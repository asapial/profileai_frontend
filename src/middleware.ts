import { NextRequest, NextResponse } from 'next/server';

// ─── Route Configuration ─────────────────────────────

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/login/2fa',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

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

// ─── Middleware ───────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read access token from cookie
  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;

  // Detect user role from cookie (decoded from JWT claims stored in a separate non-httpOnly cookie)
  const userRole = request.cookies.get('userRole')?.value as 'ADMIN' | 'USER' | undefined;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isUserRoute = USER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // ── Already authenticated, trying to access auth pages ──
  if (isAuthenticated && isAuthRoute) {
    const redirectTo = userRole === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // ── Admin routes: require ADMIN role ─────────────────────
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

  // ── User routes: require authentication ──────────────────
  if (isUserRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
