import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import UserAdminRow from '../_components/user-admin-row';

export default async function UtentiPage() {
  const banned = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      username: users.username,
      avatarUrl: users.avatarUrl,
      bannedAt: users.bannedAt,
      bannedReason: users.bannedReason,
    })
    .from(users)
    .where(and(eq(users.banned, true), isNull(users.deletedAt)))
    .orderBy(desc(users.bannedAt))
    .limit(100);

  if (banned.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <span className="text-4xl mb-3">👤</span>
        <p className="text-base font-semibold text-foreground">Nessun utente bannato</p>
        <p className="text-sm text-muted-foreground mt-1">Non ci sono utenti bannati al momento.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {banned.map((user) => (
        <UserAdminRow
          key={user.id}
          userId={user.id}
          nickname={user.nickname}
          username={user.username}
          avatarUrl={user.avatarUrl ?? null}
          bannedAt={user.bannedAt}
          bannedReason={user.bannedReason ?? null}
        />
      ))}
    </div>
  );
}
