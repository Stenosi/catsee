import { redirect } from 'next/navigation';
import { requireOnboardedSession } from '@/lib/session';
import { db } from '@/db';
import { sightings, reports, users } from '@/db/schema';
import { eq, and, isNull, count } from 'drizzle-orm';
import AdminHeader from './admin/_components/admin-header';
import AdminTabs from './admin/_components/admin-tabs';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOnboardedSession();
  if (session.user.role !== 'admin') redirect('/mappa');

  const [
    [{ pendingCount }],
    [{ reportCount }],
    [{ bannedCount }],
  ] = await Promise.all([
    db.select({ pendingCount: count() })
      .from(sightings)
      .where(and(eq(sightings.moderationStatus, 'pending'), isNull(sightings.deletedAt))),
    db.select({ reportCount: count() })
      .from(reports)
      .where(eq(reports.resolution, 'pending')),
    db.select({ bannedCount: count() })
      .from(users)
      .where(and(eq(users.banned, true), isNull(users.deletedAt))),
  ]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      <AdminHeader />
      <AdminTabs
        pendingCount={pendingCount}
        reportCount={reportCount}
        bannedCount={bannedCount}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
