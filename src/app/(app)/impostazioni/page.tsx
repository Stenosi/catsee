import { requireOnboardedSession } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ImpostazioniClient from './_components/impostazioni-client';

export default async function ImpostazioniPage() {
  const session = await requireOnboardedSession();

  const user = await db
    .select({ settings: users.settings, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .then((r) => r[0]);

  return (
    <ImpostazioniClient
      settings={user.settings}
      username={user.username}
    />
  );
}
