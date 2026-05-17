import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Restituisce la sessione corrente oppure null.
 * Usabile in Server Components e Server Actions.
 */
export async function getSession() {
  return auth();
}

/**
 * Restituisce la sessione corrente o redirige a /login se assente.
 * Usare nei Server Components che richiedono autenticazione.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return session;
}

/**
 * Come requireSession ma verifica anche che l'onboarding sia completato.
 */
export async function requireOnboardedSession() {
  const session = await requireSession();
  if (!session.user.onboardingCompleted) redirect('/onboarding');
  return session;
}
