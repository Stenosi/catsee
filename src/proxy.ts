import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Route accessibili senza login
const PUBLIC_PATHS = ['/', '/mappa', '/login', '/api/auth', '/termini', '/privacy'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (isPublic(pathname)) return NextResponse.next();

  // Non autenticato → login
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticato ma onboarding non completato → /onboarding
  if (!session.user.onboardingCompleted && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // Onboarding già completato ma tenta di riaprirlo → /mappa
  if (session.user.onboardingCompleted && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/mappa', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)'],
};
