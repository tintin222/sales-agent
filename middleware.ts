import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/edge-config';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/api/auth/setup', '/setup', '/'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow static files and Next.js internals
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/_next') ||
    path.includes('.') // static files
  ) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verify token
  const payload = await verifyToken(token);
  if (!payload) {
    // Clear invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
  
  // Add user info to headers for all authenticated routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId.toString());
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};