import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@/lib/auth';

/**
 * Middleware to protect admin routes
 * - Redirects unauthenticated users to /api/auth/signin
 * - Redirects non-admin users to /
 * - Only protects routes starting with /admin
 */
export async function middleware(req: NextRequest) {
  // Only protect routes starting with /admin
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    // Don't protect other routes - allow them to proceed
    return NextResponse.next();
  }

  // Get JWT token using NEXTAUTH_SECRET
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token, user is not authenticated - redirect to sign in
  if (!token) {
    return NextResponse.redirect(new URL('/api/auth/signin', req.url));
  }

  // Check if user has admin role
  const userRole = token.role as UserRole | undefined;
  if (userRole !== 'admin') {
    // Non-admin users are redirected to home page
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Admin users can proceed
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * Only match routes starting with /admin
 */
export const config = {
  matcher: '/admin/:path*',
};
