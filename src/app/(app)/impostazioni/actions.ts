'use server';

import { signOut } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import type { UserSettings } from '@/db/schema';
import { requireOnboardedSession } from '@/lib/session';
import { eq } from 'drizzle-orm';

export async function logout() {
  await signOut({ redirectTo: '/login' });
}

export async function saveSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K],
): Promise<{ success: boolean; error?: string }> {
  const session = await requireOnboardedSession();

  try {
    const userRow = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, session.user.id))
      .then((r) => r[0]);

    const current = userRow?.settings ?? { preciseLocation: false, highPrivacy: false };
    const updated: UserSettings = { ...current, [key]: value };

    await db
      .update(users)
      .set({ settings: updated, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return { success: true };
  } catch {
    return { success: false, error: 'Impossibile salvare le impostazioni.' };
  }
}

export type PrivacyLevel = 'standard' | 'high' | 'precise';

export async function savePrivacyLevel(
  level: PrivacyLevel,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireOnboardedSession();

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

export async function deleteAccount(
  usernameConfirm: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireOnboardedSession();

  const userRow = await db
    .select({ username: users.username, id: users.id })
    .from(users)
    .where(eq(users.id, session.user.id))
    .then((r) => r[0]);

  if (!userRow) return { success: false, error: 'Utente non trovato.' };
  if (usernameConfirm !== userRow.username) {
    return { success: false, error: 'Username non corretto.' };
  }

  const anonSuffix = userRow.id.slice(0, 8);

  await db
    .update(users)
    .set({
      deletedAt: new Date(),
      email: `deleted_${anonSuffix}@catsee.local`,
      username: `deleted_${anonSuffix}`,
      nickname: 'Utente eliminato',
      bio: null,
      avatarUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  await signOut({ redirectTo: '/login' });
  return { success: true };
}
