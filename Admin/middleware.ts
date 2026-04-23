import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'arong-admin-session';

async function computeExpectedToken(secret: string): Promise<string> {
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: login page, auth API routes, Next.js internals
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET || '';
  const expectedToken = await computeExpectedToken(secret);
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;

  // Constant-time comparison to prevent timing attacks
  if (!cookieToken || cookieToken !== expectedToken) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
