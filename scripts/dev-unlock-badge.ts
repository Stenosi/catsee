/**
 * Script DEV - sblocca un badge per un utente dato l'email.
 * Usage: npx tsx scripts/dev-unlock-badge.ts <email> <badgeId>
 * Esempio: npx tsx scripts/dev-unlock-badge.ts mario@example.com panther_5
 */
import { db } from '../src/db';
import { users, userBadges } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const [email, badgeId] = process.argv.slice(2);
if (!email || !badgeId) {
  console.error('Usage: npx tsx scripts/dev-unlock-badge.ts <email> <badgeId>');
  process.exit(1);
}

const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
if (!user) {
  console.error(`Utente non trovato: ${email}`);
  process.exit(1);
}

await db
  .insert(userBadges)
  .values({ userId: user.id, badgeId })
  .onConflictDoNothing();

console.log(`✅ Badge "${badgeId}" sbloccato per ${email}`);
process.exit(0);
