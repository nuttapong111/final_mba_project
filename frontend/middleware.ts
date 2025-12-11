import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle subdomain routing
 * Extracts subdomain from host and passes it to the application
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const forwardedHost = request.headers.get('x-forwarded-host') || '';
  const actualHost = forwardedHost || host;
  
  // Remove port if present
  const hostWithoutPort = actualHost.split(':')[0];
  
  // Extract subdomain or use full domain
  let domain = hostWithoutPort;
  
  // Skip for localhost
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return NextResponse.next();
  }

  // Extract subdomain if it's a subdomain format (e.g., school.example.com)
  const hostParts = hostWithoutPort.split('.');
  if (hostParts.length >= 3) {
    // It's a subdomain (e.g., school.example.com)
    domain = hostParts[0];
  }

  // Add domain to request headers for use in the app
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-school-domain', domain);
  requestHeaders.set('x-original-host', hostWithoutPort);

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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
