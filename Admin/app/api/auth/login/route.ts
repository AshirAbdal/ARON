import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/authSession';
import { applyRateLimit } from '@/lib/rateLimit';

const COOKIE_NAME = 'arong-admin-session';

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const rate = applyRateLimit(`admin-login:${ip}`, 8, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      }
    );
  }

  let body: { username: string; password: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }

  const { username, password } = body as { username: string; password: string };

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!validUsername || !validPassword || !secret) {
    return NextResponse.json(
      { error: 'Server auth is not configured' },
      { status: 500 }
    );
  }

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

  const token = await createSessionToken(secret);

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
