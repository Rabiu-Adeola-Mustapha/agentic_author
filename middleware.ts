import { auth } from '@/lib/auth/options';
import type { NextRequest } from 'next/server';

export const middleware = auth((req: any) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/projects/:path*', '/api/pipeline/:path*'],
};
