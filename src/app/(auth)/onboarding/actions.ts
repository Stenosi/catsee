'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

const RESERVED_USERNAMES = new Set([
  'admin', 'support', 'moderator', 'staff', 'official',
  'catsee', 'help', 'info', 'contact', 'team', 'bot',
]);

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const usernameSchema = z
  .string()
  .min(3, 'Minimo 3 caratteri.')
  .max(30, 'Massimo 30 caratteri.')
  .regex(/^[a-zA-Z0-9._]+$/, 'Solo lettere, numeri, punto e underscore.')
  .refine((v) => !v.startsWith('.') && !v.startsWith('_'), 'Non può iniziare con . o _')
  .refine((v) => !v.endsWith('.') && !v.endsWith('_'), 'Non può finire con . o _');

const nicknameSchema = z
  .string()
  .min(1, 'Il nickname è obbligatorio.')
  .max(30, 'Massimo 30 caratteri.');

/** Controlla se uno username è disponibile (usato per la validazione live). */
export async function checkUsername(
  username: string,
): Promise<{ available: boolean; error?: string }> {
  const result = usernameSchema.safeParse(username);
  if (!result.success) return { available: false, error: result.error.issues[0].message };

  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { available: false, error: 'Questo username è riservato.' };
  }

  if (matcher.hasMatch(username)) {
    return { available: false, error: 'Questo username non è ammesso.' };
  }

  const session = await auth();
  const existing = await db.query.users.findFirst({
    where: (u) =>
      and(
        eq(u.username, username),
        session?.user?.id ? ne(u.id, session.user.id) : undefined,
      ),
    columns: { id: true },
  });

  return { available: !existing };
}

/** Completa l'onboarding: salva username + nickname e segna onboardingCompleted. */
export async function completeOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const username = (formData.get('username') as string)?.trim();
  const nickname = (formData.get('nickname') as string)?.trim();

  const usernameResult = usernameSchema.safeParse(username);
  if (!usernameResult.success) {
    return { error: usernameResult.error.issues[0].message };
  }

  const nicknameResult = nicknameSchema.safeParse(nickname);
  if (!nicknameResult.success) {
    return { error: nicknameResult.error.issues[0].message };
  }

  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { error: 'Questo username è riservato.' };
  }

  if (matcher.hasMatch(username) || matcher.hasMatch(nickname)) {
    return { error: 'Il testo contiene parole non ammesse.' };
  }

  // Verifica unicità username (escludiamo l'utente corrente che potrebbe avere un temp username uguale)
  const conflict = await db.query.users.findFirst({
    where: (u) => and(eq(u.username, username), ne(u.id, session.user.id)),
    columns: { id: true },
  });
  if (conflict) return { error: 'Username già in uso, scegline un altro.' };

  await db
    .update(users)
    .set({
      username,
      nickname,
      usernameUpdatedAt: new Date(),
      onboardingCompleted: true,
    })
    .where(eq(users.id, session.user.id));

  redirect('/mappa');
}
