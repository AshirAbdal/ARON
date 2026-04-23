import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'arong-admin-session';

async function generateToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode('arong-admin-authenticated')
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body as { username: string; password: string };

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET || '';

  if (
    !username ||
    !password ||
    username !== validUsername ||
    password !== validPassword
  ) {
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  }

  const token = await generateToken(secret);

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
