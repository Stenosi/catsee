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
