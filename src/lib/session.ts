import { auth } from '@/auth';
import { cache } from 'react';
import { redirect } from 'next/navigation';

const getCachedAuth = cache(auth);

export async function getSession() {
  return getCachedAuth();
}

export async function requireSession() {
  const session = await getCachedAuth();
  if (!session?.user?.id) redirect('/login');
  return session;
}

export async function requireOnboardedSession() {
  const session = await requireSession();
  if (!session.user.onboardingCompleted) redirect('/onboarding');
  return session;
}

// ── Varianti per server actions chiamate da client components ─────────────────
// Non usano redirect() - restituiscono null per permettere all'action di
// ritornare un { error } senza innescare "unexpected response" in Next.js 16.

export async function getSessionForAction() {
  const session = await auth();
  return session?.user?.id ? session : null;
}

export async function getOnboardedSessionForAction() {
  const session = await auth();
  if (!session?.user?.id || !session.user.onboardingCompleted) return null;
  return session;
}
