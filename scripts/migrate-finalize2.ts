/** Applica le ultime differenze per allineare lo snapshot drizzle */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "unique_reporter_per_user"`;
  await sql`ALTER TABLE "users" ALTER COLUMN "settings" SET DEFAULT '{"preciseLocation":false,"highPrivacy":false}'::jsonb`;

  // Ricrea il constraint nell'ordine corretto per drizzle
  await sql`ALTER TABLE "reports" ADD CONSTRAINT "unique_reporter_per_user" UNIQUE("reported_user_id","reporter_id")`;

  // Verification tokens PK
  await sql`ALTER TABLE "verification_tokens" DROP CONSTRAINT IF EXISTS "verification_tokens_identifier_token_pk"`;
  await sql`ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")`;

  // Accounts PK
  await sql`ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_provider_provider_account_id_pk"`;
  await sql`ALTER TABLE "accounts" ADD CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")`;

  console.log('✅ Finalize2 completato');
}

main().catch((err) => { console.error(err); process.exit(1); });
