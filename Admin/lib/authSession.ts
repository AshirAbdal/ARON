const encoder = new TextEncoder();
const decoder = new TextDecoder();

type SessionPayload = {
  iat: number;
  exp: number;
  nonce: string;
};

function toBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...Array.from(bytes)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function randomHex(size = 16): string {
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sign(secret: string, payloadBase64Url: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadBase64Url));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export async function createSessionToken(secret: string, ttlSeconds = 60 * 60 * 12): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iat: now,
    exp: now + ttlSeconds,
    nonce: randomHex(),
  };

  const payloadRaw = encoder.encode(JSON.stringify(payload));
  const payloadBase64Url = toBase64Url(payloadRaw);
  const signature = await sign(secret, payloadBase64Url);

  return `${payloadBase64Url}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const [payloadBase64Url, providedSignature] = token.split('.');
  if (!payloadBase64Url || !providedSignature) return false;

  const expectedSignature = await sign(secret, payloadBase64Url);
  if (!timingSafeEqual(providedSignature, expectedSignature)) return false;

  try {
    const payloadJson = decoder.decode(fromBase64Url(payloadBase64Url));
    const payload = JSON.parse(payloadJson) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    return typeof payload.exp === 'number' && payload.exp > now;
  } catch {
    return false;
  }
}
