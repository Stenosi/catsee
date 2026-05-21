'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOnboardedSession } from '@/lib/session';
import { containsProfanity } from '@/lib/obscenity';

const RESERVED_USERNAMES = new Set([
  'admin', 'support', 'moderator', 'staff', 'official',
  'catsee', 'help', 'info', 'contact', 'team', 'bot',
]);

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

const bioSchema = z
  .string()
  .max(150, 'Massimo 150 caratteri.')
  .optional();

export type SaveProfileResult =
  | { success: true }
  | { success: false; error: string; field?: 'nickname' | 'bio' | 'username' };

export async function saveProfile(formData: {
  nickname: string;
  bio: string;
  username: string;
}): Promise<SaveProfileResult> {
  const session = await requireOnboardedSession();
  const userId = session.user.id;

  // Validazione nickname
  const nicknameResult = nicknameSchema.safeParse(formData.nickname.trim());
  if (!nicknameResult.success) {
    return { success: false, error: nicknameResult.error.issues[0].message, field: 'nickname' };
  }

  // Validazione bio
  const bioResult = bioSchema.safeParse(formData.bio.trim() || undefined);
  if (!bioResult.success) {
    return { success: false, error: bioResult.error.issues[0].message, field: 'bio' };
  }

  // Profanity check nickname
  if (containsProfanity(nicknameResult.data)) {
    return { success: false, error: 'Il nickname contiene parole non ammesse.', field: 'nickname' };
  }

  // Profanity check bio
  if (bioResult.data && containsProfanity(bioResult.data)) {
    return { success: false, error: 'La bio contiene parole non ammesse.', field: 'bio' };
  }

  // Legge dati correnti per capire se username è cambiato e se il lock è ancora attivo
  const current = await db.query.users.findFirst({
    where: (u, { eq, and, isNull }) => and(eq(u.id, userId), isNull(u.deletedAt)),
    columns: { username: true, usernameUpdatedAt: true },
  });

  if (!current) return { success: false, error: 'Utente non trovato.' };

  const newUsername = formData.username.trim().toLowerCase();
  const usernameChanged = newUsername !== current.username;

  let usernameToSave = current.username;
  let usernameUpdatedAt: Date | undefined;

  if (usernameChanged) {
    // Verifica lock 30 giorni
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysSince = Math.floor((Date.now() - current.usernameUpdatedAt.getTime()) / msPerDay);
    if (daysSince < 30) {
      const remaining = 30 - daysSince;
      return {
        success: false,
        error: `Puoi cambiare username tra ${remaining} ${remaining === 1 ? 'giorno' : 'giorni'}.`,
        field: 'username',
      };
    }

    // Validazione formato
    const usernameResult = usernameSchema.safeParse(newUsername);
    if (!usernameResult.success) {
      return { success: false, error: usernameResult.error.issues[0].message, field: 'username' };
    }

    // Username riservato
    if (RESERVED_USERNAMES.has(newUsername)) {
      return { success: false, error: 'Questo username è riservato.', field: 'username' };
    }

    // Profanity check
    if (containsProfanity(newUsername)) {
      return { success: false, error: 'Questo username non è ammesso.', field: 'username' };
    }

    // Unicità
    const conflict = await db.query.users.findFirst({
      where: (u, { eq, and, ne, isNull }) =>
        and(eq(u.username, newUsername), ne(u.id, userId), isNull(u.deletedAt)),
      columns: { id: true },
    });
    if (conflict) {
      return { success: false, error: 'Username già in uso, scegline un altro.', field: 'username' };
    }

    usernameToSave = newUsername;
    usernameUpdatedAt = new Date();
  }

  await db
    .update(users)
    .set({
      nickname: nicknameResult.data,
      bio: bioResult.data ?? null,
      username: usernameToSave,
      ...(usernameUpdatedAt ? { usernameUpdatedAt } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)));

  revalidatePath('/profilo');
  revalidatePath('/profilo/modifica');

  return { success: true };
}
