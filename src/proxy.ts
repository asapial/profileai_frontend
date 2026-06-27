import { NextRequest, NextResponse } from 'next/server';

const AUTH_ROUTES = [
  '/login',
  '/login/2fa',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

const ADMIN_ROUTES = ['/admin'];
const USER_ROUTES = ['/dashboard', '/profile', '/resume', '/resumes', '/templates'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = Boolean(accessToken);
  const userRole = request.cookies.get('userRole')?.value as 'ADMIN' | 'USER' | undefined;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isUserRoute = USER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL(userRole === 'ADMIN' ? '/admin' : '/dashboard', request.url));
  }

  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isUserRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
