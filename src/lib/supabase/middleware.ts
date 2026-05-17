import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/local/session-cookie';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health');

  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
