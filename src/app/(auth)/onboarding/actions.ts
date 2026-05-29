'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { users, r2CleanupQueue } from '@/db/schema';
import type { UserSettings } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { containsProfanity } from '@/lib/obscenity';
import { getSessionForAction } from '@/lib/session';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';

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

/** Controlla se uno username è disponibile (usato per la validazione live). */
export async function checkUsername(
  username: string,
): Promise<{ available: boolean; error?: string }> {
  const result = usernameSchema.safeParse(username);
  if (!result.success) return { available: false, error: result.error.issues[0].message };

  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { available: false, error: 'Questo username è riservato.' };
  }

  if (containsProfanity(username)) {
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

/** Salva username + nickname e segna onboardingCompleted. Non fa redirect — il wizard continua lato client. */
export async function saveUsernameNickname(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const username = (formData.get('username') as string)?.trim();
  const nickname = (formData.get('nickname') as string)?.trim();

  const usernameResult = usernameSchema.safeParse(username);
  if (!usernameResult.success) return { error: usernameResult.error.issues[0].message };

  const nicknameResult = nicknameSchema.safeParse(nickname);
  if (!nicknameResult.success) return { error: nicknameResult.error.issues[0].message };

  if (RESERVED_USERNAMES.has(username.toLowerCase())) return { error: 'Questo username è riservato.' };

  if (containsProfanity(username) || containsProfanity(nickname)) {
    return { error: 'Il testo contiene parole non ammesse.' };
  }

  const conflict = await db.query.users.findFirst({
    where: (u) => and(eq(u.username, username), ne(u.id, session.user.id)),
    columns: { id: true },
  });
  if (conflict) return { error: 'Username già in uso, scegline un altro.' };

  await db
    .update(users)
    .set({ username, nickname, usernameUpdatedAt: new Date(), onboardingCompleted: true })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

// ── Avatar upload (usa requireSession, non requireOnboardedSession) ────────────
// L'utente è autenticato ma potrebbe non essere ancora "onboardato" formalmente
// nel cookie di sessione — non serve il check extra.

export type GetOnboardingAvatarUploadUrlResult =
  | { success: true; key: string; uploadUrl: string }
  | { success: false; error: string };

export async function getOnboardingAvatarUploadUrl(): Promise<GetOnboardingAvatarUploadUrlResult> {
  const session = await getSessionForAction();
  if (!session) return { success: false, error: 'Non autenticato.' };
  const key = `avatars/${session.user.id}/${crypto.randomUUID()}.jpg`;
  try {
    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: 'image/jpeg' }),
      { expiresIn: 300 },
    );
    return { success: true, key, uploadUrl };
  } catch {
    return { success: false, error: 'Errore nella generazione del link di upload.' };
  }
}

export type SaveOnboardingAvatarResult =
  | { success: true; avatarUrl: string }
  | { success: false; error: string };

export type PrivacyLevel = 'standard' | 'high' | 'precise';

export async function saveOnboardingAvatarUrl(key: string): Promise<SaveOnboardingAvatarResult> {
  const session = await getSessionForAction();
  if (!session) return { success: false, error: 'Non autenticato.' };
  const userId = session.user.id;

  const current = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
    columns: { avatarUrl: true },
  });

  const newUrl = `${R2_PUBLIC_URL}/${key}`;

  await db.update(users).set({ avatarUrl: newUrl, updatedAt: new Date() }).where(eq(users.id, userId));

  if (current?.avatarUrl) {
    const oldKey = current.avatarUrl.replace(`${R2_PUBLIC_URL}/`, '');
    if (oldKey !== key) {
      await db.insert(r2CleanupQueue).values({ r2Key: oldKey, fileType: 'avatar' });
    }
  }

  return { success: true, avatarUrl: newUrl };
}

export async function saveOnboardingPrivacyLevel(
  level: PrivacyLevel,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSessionForAction();
  if (!session) return { success: false, error: 'Non autenticato.' };

  try {
    const userRow = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, session.user.id))
      .then((r) => r[0]);

    const current = userRow?.settings ?? { preciseLocation: false, highPrivacy: false };
    const updated: UserSettings = {
      ...current,
      preciseLocation: level === 'precise',
      highPrivacy: level === 'high',
    };

    await db
      .update(users)
      .set({ settings: updated, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch {
    return { success: false, error: 'Impossibile salvare le impostazioni.' };
  }
}
