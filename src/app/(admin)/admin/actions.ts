'use server';

import { db } from '@/db';
import { sightings, reports, users, r2CleanupQueue } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireOnboardedSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const BAN_DURATIONS_DAYS = [1, 3, 7, 14, 30];
const MAX_BAN_DAYS = 30;

async function requireAdmin() {
  const session = await requireOnboardedSession();
  if (session.user.role !== 'admin') redirect('/mappa');
  return session;
}

// ── Moderazione ────────────────────────────────────────────────────────────────

export async function approveSighting(sightingId: string) {
  await requireAdmin();
  await db
    .update(sightings)
    .set({ moderationStatus: 'approved', updatedAt: new Date() })
    .where(eq(sightings.id, sightingId));
  revalidatePath('/admin/moderazione');
}

export async function rejectSighting(sightingId: string) {
  await requireAdmin();
  await db
    .update(sightings)
    .set({ moderationStatus: 'rejected', deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(sightings.id, sightingId));
  revalidatePath('/admin/moderazione');
}

// ── Segnalazioni ───────────────────────────────────────────────────────────────

export async function dismissReports(sightingId: string) {
  await requireAdmin();
  await db
    .update(reports)
    .set({ resolution: 'dismissed', resolvedAt: new Date() })
    .where(and(eq(reports.sightingId, sightingId), eq(reports.resolution, 'pending')));
  revalidatePath('/admin/segnalazioni');
}

export async function removeUserAvatar(userId: string) {
  await requireAdmin();
  const [user] = await db.select({ avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, userId));
  const bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .update(users)
    .set({ avatarUrl: null, avatarBannedUntil: bannedUntil, updatedAt: new Date() })
    .where(eq(users.id, userId));
  if (user?.avatarUrl) {
    const key = user.avatarUrl.replace(`${process.env.R2_PUBLIC_URL}/`, '');
    await db.insert(r2CleanupQueue).values({ r2Key: key, fileType: 'avatar' });
  }
  revalidatePath('/admin/segnalazioni');
}

export async function dismissUserReports(reportedUserId: string) {
  await requireAdmin();
  await db
    .update(reports)
    .set({ resolution: 'dismissed', resolvedAt: new Date() })
    .where(and(eq(reports.reportedUserId, reportedUserId), eq(reports.resolution, 'pending')));
  revalidatePath('/admin/segnalazioni');
}

export async function removeReportedPost(sightingId: string) {
  await requireAdmin();
  await db
    .update(sightings)
    .set({ moderationStatus: 'rejected', deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(sightings.id, sightingId));
  await db
    .update(reports)
    .set({ resolution: 'post_removed', resolvedAt: new Date() })
    .where(and(eq(reports.sightingId, sightingId), eq(reports.resolution, 'pending')));
  revalidatePath('/admin/segnalazioni');
}

export async function banUser(userId: string) {
  await requireAdmin();

  const [user] = await db
    .select({ banCount: users.banCount })
    .from(users)
    .where(eq(users.id, userId));

  const newBanCount = (user?.banCount ?? 0) + 1;
  const durationDays = BAN_DURATIONS_DAYS[Math.min(newBanCount - 1, BAN_DURATIONS_DAYS.length - 1)];
  const bannedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await db
    .update(users)
    .set({ banned: true, banCount: newBanCount, bannedAt: new Date(), bannedUntil, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Soft delete dei post pending
  await db
    .update(sightings)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sightings.userId, userId), eq(sightings.moderationStatus, 'pending'), isNull(sightings.deletedAt)));

  // Chiude i report pendenti come user_banned → sparisce da Segnalazioni
  await db
    .update(reports)
    .set({ resolution: 'user_banned', resolvedAt: new Date() })
    .where(and(eq(reports.reportedUserId, userId), eq(reports.resolution, 'pending')));

  revalidatePath('/admin/segnalazioni');
  revalidatePath('/admin/utenti');
}

// ── Utenti bannati ─────────────────────────────────────────────────────────────

export async function unbanUser(userId: string) {
  await requireAdmin();
  await db
    .update(users)
    .set({ banned: false, bannedAt: null, bannedReason: null, bannedUntil: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
  revalidatePath('/admin/utenti');
}

export async function adjustBanDuration(userId: string, delta: number) {
  await requireAdmin();

  const [user] = await db
    .select({ bannedUntil: users.bannedUntil })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.bannedUntil) return;

  const current = user.bannedUntil.getTime();
  const now = Date.now();
  const deltaMs = delta * 24 * 60 * 60 * 1000;
  const newTimestamp = current + deltaMs;

  // Min: 1 giorno rimanente - Max: 30 giorni dalla chiamata
  const minTimestamp = now + 1 * 24 * 60 * 60 * 1000;
  const maxTimestamp = now + MAX_BAN_DAYS * 24 * 60 * 60 * 1000;
  const clamped = Math.min(Math.max(newTimestamp, minTimestamp), maxTimestamp);

  await db
    .update(users)
    .set({ bannedUntil: new Date(clamped), updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath('/admin/utenti');
}
