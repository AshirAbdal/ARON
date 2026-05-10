type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'captcha_not_configured' };
    }
    return { ok: true };
  }

  if (!token) {
    return { ok: false, reason: 'captcha_missing' };
  }

  try {
    const form = new URLSearchParams();
    form.set('secret', secret);
    form.set('response', token);
    if (remoteIp) form.set('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
      cache: 'no-store',
    });

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      return {
        ok: false,
        reason: (data['error-codes'] || []).join(',') || 'captcha_invalid',
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'captcha_verification_failed' };
  }
}
