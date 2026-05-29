/** Applica le differenze rimaste dal db:push */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Rimuovi FK creata manualmente e ricreala con il nome atteso da drizzle
  await sql`ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "unique_reporter_per_user"`;
  await sql`ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_reported_user_id_fkey"`;
  await sql`ALTER TABLE "users" ALTER COLUMN "settings" SET DEFAULT '{"preciseLocation":false,"highPrivacy":false}'::jsonb`;
  await sql`ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action`;
  await sql`ALTER TABLE "reports" ADD CONSTRAINT "unique_reporter_per_user" UNIQUE("reported_user_id","reporter_id")`;
  console.log('✅ Finalize completato');
}

main().catch((err) => { console.error(err); process.exit(1); });
