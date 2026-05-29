import { requireOnboardedSession } from '@/lib/session';
import { db } from '@/db';
import ModificaClient from './_components/modifica-client';

export default async function ModificaProfiloPage() {
  const session = await requireOnboardedSession();
  const userId = session.user.id;

  const user = await db.query.users.findFirst({
    where: (u, { eq, isNull, and }) => and(eq(u.id, userId), isNull(u.deletedAt)),
    columns: {
      nickname: true,
      username: true,
      bio: true,
      avatarUrl: true,
      usernameUpdatedAt: true,
      avatarBannedUntil: true,
    },
  });

  if (!user) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceUpdate = Math.floor((Date.now() - user.usernameUpdatedAt.getTime()) / msPerDay);
  const usernameLockedDays = Math.max(0, 30 - daysSinceUpdate);

  const avatarBannedDays = user.avatarBannedUntil && user.avatarBannedUntil > new Date()
    ? Math.ceil((user.avatarBannedUntil.getTime() - Date.now()) / msPerDay)
    : 0;

  return (
    <ModificaClient
      nickname={user.nickname}
      username={user.username}
      bio={user.bio ?? null}
      avatarUrl={user.avatarUrl ?? null}
      usernameLockedDays={usernameLockedDays}
      avatarBannedDays={avatarBannedDays}
    />
  );
}
