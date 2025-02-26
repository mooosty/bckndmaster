import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log the current URL and cookies for debugging
  console.log('Middleware - URL:', request.url);
  console.log('Middleware - Cookies:', request.cookies.toString());

  const { pathname } = request.nextUrl;

  // Check if we're on an admin page
  if (pathname.startsWith('/admin/dashboard')) {
    const adminAccess = request.cookies.get('adminAccess');
    console.log('Middleware - Admin access cookie:', adminAccess);

    if (!adminAccess || adminAccess.value !== 'true') {
      console.log('Middleware - No valid admin access, redirecting to login');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Check if we're on a user dashboard page
  if (pathname.startsWith('/dashboard')) {
    // For user dashboard pages, we'll let Dynamic Labs handle the authentication
    // in the client-side components
    return NextResponse.next();
  }

  // Check if the path starts with /r/ followed by a code
  if (pathname.match(/^\/r\/[a-zA-Z0-9]{6}$/)) {
    // Let the route handler handle it
    return;
  }
  
  // For all other /r/ paths, redirect to the /r page
  if (pathname === '/r') {
    return;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
    '/dashboard/:path*',
    '/r/:path*',
  ],
}; 