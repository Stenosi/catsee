import { db } from '@/db';
import { sightings, reports, users } from '@/db/schema';
import { eq, and, inArray, isNotNull, sql } from 'drizzle-orm';
import ReportList from '../_components/report-list';
import UserReportList from '../_components/user-report-list';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

export default async function SegnalazioniPage() {
  // ── Post reports ─────────────────────────────────────────────────────────────

  const postGroups = await db
    .select({
      sightingId: reports.sightingId,
      count: sql<number>`count(*)::int`,
    })
    .from(reports)
    .where(and(eq(reports.resolution, 'pending'), isNotNull(reports.sightingId)))
    .groupBy(reports.sightingId)
    .orderBy(sql`count(*) DESC`)
    .limit(30);

  // ── User reports ─────────────────────────────────────────────────────────────

  const userGroups = await db
    .select({
      reportedUserId: reports.reportedUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(reports)
    .where(and(eq(reports.resolution, 'pending'), isNotNull(reports.reportedUserId)))
    .groupBy(reports.reportedUserId)
    .orderBy(sql`count(*) DESC`)
    .limit(30);

  const hasPostReports = postGroups.length > 0;
  const hasUserReports = userGroups.length > 0;

  if (!hasPostReports && !hasUserReports) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <span className="text-4xl mb-3">🚩</span>
        <p className="text-base font-semibold text-foreground">Nessuna segnalazione</p>
        <p className="text-sm text-muted-foreground mt-1">Non ci sono segnalazioni da gestire.</p>
      </div>
    );
  }

  // ── Post report details ───────────────────────────────────────────────────────

  const sightingIds = postGroups
    .map((g) => g.sightingId)
    .filter((id): id is string => id !== null);

  const postItems = sightingIds.length > 0 ? await (async () => {
    const postDetails = await db
      .select({
        id: sightings.id,
        photoThumbnailKey: sightings.photoThumbnailKey,
        catNickname: sightings.catNickname,
        note: sightings.note,
        userId: sightings.userId,
        authorNickname: users.nickname,
        authorUsername: users.username,
      })
      .from(sightings)
      .innerJoin(users, eq(sightings.userId, users.id))
      .where(inArray(sightings.id, sightingIds));

    const postMap = new Map(postDetails.map((p) => [p.id, p]));

    const reportDetails = await db
      .select({
        sightingId: reports.sightingId,
        reasons: reports.reasons,
        reporterUsername: users.username,
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .where(and(eq(reports.resolution, 'pending'), inArray(reports.sightingId, sightingIds)));

    const reportsByPost = new Map<string, { reasons: string[][]; reporters: string[] }>();
    for (const r of reportDetails) {
      if (!r.sightingId) continue;
      if (!reportsByPost.has(r.sightingId)) {
        reportsByPost.set(r.sightingId, { reasons: [], reporters: [] });
      }
      const entry = reportsByPost.get(r.sightingId)!;
      entry.reasons.push(r.reasons ?? []);
      if (r.reporterUsername) entry.reporters.push(r.reporterUsername);
    }

    return postGroups.flatMap((g) => {
      if (!g.sightingId) return [];
      const post = postMap.get(g.sightingId);
      if (!post) return [];
      const details = reportsByPost.get(g.sightingId) ?? { reasons: [], reporters: [] };
      const reasonCounts = new Map<string, number>();
      for (const reasonList of details.reasons) {
        for (const r of reasonList) {
          reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
        }
      }
      const reasonsWithCount = [...reasonCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

      return [{
        sightingId: g.sightingId,
        userId: post.userId,
        thumbnailUrl: `${R2_PUBLIC_URL}/${post.photoThumbnailKey}`,
        catNickname: post.catNickname ?? 'Senza nome',
        note: post.note ?? null,
        authorNickname: post.authorNickname,
        authorUsername: post.authorUsername,
        reportCount: g.count,
        reasons: reasonsWithCount,
        reporters: details.reporters,
      }];
    });
  })() : [];

  // ── User report details ───────────────────────────────────────────────────────

  const reportedUserIds = userGroups
    .map((g) => g.reportedUserId)
    .filter((id): id is string => id !== null);

  const userItems = reportedUserIds.length > 0 ? await (async () => {
    const userDetails = await db
      .select({
        id: users.id,
        nickname: users.nickname,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, reportedUserIds));

    const userMap = new Map(userDetails.map((u) => [u.id, u]));

    const userReportDetails = await db
      .select({
        reportedUserId: reports.reportedUserId,
        reasons: reports.reasons,
        reporterUsername: users.username,
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .where(and(eq(reports.resolution, 'pending'), inArray(reports.reportedUserId, reportedUserIds)));

    const reportsByUser = new Map<string, { reasons: string[][]; reporters: string[] }>();
    for (const r of userReportDetails) {
      if (!r.reportedUserId) continue;
      if (!reportsByUser.has(r.reportedUserId)) {
        reportsByUser.set(r.reportedUserId, { reasons: [], reporters: [] });
      }
      const entry = reportsByUser.get(r.reportedUserId)!;
      entry.reasons.push(r.reasons ?? []);
      if (r.reporterUsername) entry.reporters.push(r.reporterUsername);
    }

    return userGroups.flatMap((g) => {
      if (!g.reportedUserId) return [];
      const user = userMap.get(g.reportedUserId);
      if (!user) return [];
      const details = reportsByUser.get(g.reportedUserId) ?? { reasons: [], reporters: [] };
      const reasonCounts = new Map<string, number>();
      for (const reasonList of details.reasons) {
        for (const r of reasonList) {
          reasonCounts.set(r, (reasonCounts.get(r) ?? 0) + 1);
        }
      }
      const reasonsWithCount = [...reasonCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

      return [{
        reportedUserId: g.reportedUserId,
        reportedNickname: user.nickname,
        reportedUsername: user.username,
        reportedAvatarUrl: user.avatarUrl ?? null,
        reportCount: g.count,
        reasons: reasonsWithCount,
        reporters: details.reporters,
      }];
    });
  })() : [];

  return (
    <div>
      {hasPostReports && (
        <div>
          {hasUserReports && (
            <div className="px-4 py-2 bg-muted/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Post</p>
            </div>
          )}
          <ReportList items={postItems} />
        </div>
      )}
      {hasUserReports && (
        <div>
          {hasPostReports && (
            <div className="px-4 py-2 bg-muted/50 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Utenti</p>
            </div>
          )}
          <UserReportList items={userItems} />
        </div>
      )}
    </div>
  );
}
