import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/:path*'],
};

const CACHE_SECONDS = 60;

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=120`);
  return response;
}
