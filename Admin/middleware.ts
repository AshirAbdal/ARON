import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/authSession';

const COOKIE_NAME = 'arong-admin-session';

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

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return new NextResponse('Server auth is not configured', { status: 500 });
  }

  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;

  const isValid = cookieToken ? await verifySessionToken(cookieToken, secret) : false;
  if (!isValid) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
