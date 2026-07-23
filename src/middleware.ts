import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const path = req.nextUrl.pathname;

  // Only rewrite on go.dropy.in domain
  if (hostname.startsWith('go.')) {
    // Skip known app routes
    if (
      path.startsWith('/admin') ||
      path.startsWith('/api') ||
      path.startsWith('/dash') ||
      path.startsWith('/go') ||
      path.startsWith('/_next') ||
      path.startsWith('/favicon') ||
      path === '/'
    ) {
      return NextResponse.next();
    }

    // Rewrite /SHAHEEN → /go/SHAHEEN
    const url = req.nextUrl.clone();
    url.pathname = `/go${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};