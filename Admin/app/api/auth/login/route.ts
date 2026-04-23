import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'arong-admin-session';

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

  // Generate the same HMAC token that middleware will verify
  const token = createHmac('sha256', secret)
    .update('arong-admin-authenticated')
    .digest('base64');

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
