'use server';

import { db } from '@/db';
import { sightings, reports, users, r2CleanupQueue } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireOnboardedSession } from '@/lib/session';
import { redirect } from 'next/navigation';

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
  await db
    .update(users)
    .set({ banned: true, bannedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
  // Soft delete pending sightings dell'utente
  await db
    .update(sightings)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sightings.userId, userId), eq(sightings.moderationStatus, 'pending'), isNull(sightings.deletedAt)));
  revalidatePath('/admin/segnalazioni');
  revalidatePath('/admin/utenti');
}

// ── Utenti bannati ─────────────────────────────────────────────────────────────

export async function unbanUser(userId: string) {
  await requireAdmin();
  await db
    .update(users)
    .set({ banned: false, bannedAt: null, bannedReason: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
  revalidatePath('/admin/utenti');
}
