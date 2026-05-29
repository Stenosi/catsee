import { db } from '@/db';
import { sightings, reports, users } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import ReportGroup from '../_components/report-group';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

export default async function SegnalazioniPage() {
  // Step 1: raggruppa reports pending per sighting
  const groups = await db
    .select({
      sightingId: reports.sightingId,
      count: sql<number>`count(*)::int`,
    })
    .from(reports)
    .where(and(eq(reports.resolution, 'pending'), sql`${reports.sightingId} IS NOT NULL`))
    .groupBy(reports.sightingId)
    .orderBy(sql`count(*) DESC`)
    .limit(30);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <span className="text-4xl mb-3">🚩</span>
        <p className="text-base font-semibold text-foreground">Nessuna segnalazione</p>
        <p className="text-sm text-muted-foreground mt-1">Non ci sono segnalazioni da gestire.</p>
      </div>
    );
  }

  const sightingIds = groups
    .map((g) => g.sightingId)
    .filter((id): id is string => id !== null);

  // Step 2: dettagli sighting + autori
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

  // Step 3: dettagli reports (reasons + reporter)
  const reportDetails = await db
    .select({
      sightingId: reports.sightingId,
      reasons: reports.reasons,
      reporterUsername: users.username,
    })
    .from(reports)
    .leftJoin(users, eq(reports.reporterId, users.id))
    .where(and(eq(reports.resolution, 'pending'), inArray(reports.sightingId, sightingIds)));

  // Raggruppa report details per sightingId
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

  return (
    <div className="divide-y divide-border">
      {groups.map((g) => {
        if (!g.sightingId) return null;
        const post = postMap.get(g.sightingId);
        if (!post) return null;
        const details = reportsByPost.get(g.sightingId) ?? { reasons: [], reporters: [] };
        const uniqueReasons = [...new Set(details.reasons.flat())];

        return (
          <ReportGroup
            key={g.sightingId}
            sightingId={g.sightingId}
            userId={post.userId}
            thumbnailUrl={`${R2_PUBLIC_URL}/${post.photoThumbnailKey}`}
            catNickname={post.catNickname ?? 'Senza nome'}
            note={post.note ?? null}
            authorNickname={post.authorNickname}
            authorUsername={post.authorUsername}
            reportCount={g.count}
            reasons={uniqueReasons}
            reporters={details.reporters}
          />
        );
      })}
    </div>
  );
}
