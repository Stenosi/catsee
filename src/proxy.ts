import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Route accessibili senza login
const PUBLIC_PATHS = ['/', '/mappa', '/login', '/api/auth', '/termini', '/privacy'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

// Solo top-level statiche come callbackUrl — route dinamiche (/profilo/[username], /post/[id])
// potrebbero chiamare notFound() internamente e causare un loop 404 dopo il login.
const SAFE_CALLBACK_PATHS = ['/feed', '/cerca', '/profilo', '/impostazioni', '/scatta', '/admin'];

function isSafeCallback(pathname: string): boolean {
  return SAFE_CALLBACK_PATHS.some((p) => pathname === p);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (isPublic(pathname)) return NextResponse.next();

  // Server action POST requests: bypass redirect logic, let the action handle auth
  if (req.headers.get('next-action')) return NextResponse.next();

  // Non autenticato → login
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    if (isSafeCallback(pathname)) loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Utente bannato → login con errore
  if (session.user.banned) {
    return NextResponse.redirect(new URL('/login?error=banned', req.url));
  }

  // Guard dashboard admin
  if (pathname.startsWith('/admin')) {
    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/mappa', req.url));
    }
  }

  // Autenticato ma onboarding non completato → /onboarding
  if (!session.user.onboardingCompleted && pathname !== '/onboarding') {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // Onboarding già completato ma tenta di riaprirlo → /profilo
  if (session.user.onboardingCompleted && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/profilo', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-.*|.*\\.(?:png|jpg|svg|ico)$).*)'],
};
