import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { and, eq, lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { r2CleanupQueue } from '@/db/schema';
import { r2, R2_BUCKET } from '@/lib/r2';

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await db
    .select()
    .from(r2CleanupQueue)
    .where(
      and(
        eq(r2CleanupQueue.status, 'pending'),
        lt(sql`cast(${r2CleanupQueue.attempts} as int)`, MAX_ATTEMPTS),
      ),
    )
    .limit(BATCH_SIZE);

  let deleted = 0;
  let failed = 0;

  for (const item of pending) {
    const attempts = parseInt(item.attempts, 10) + 1;
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: item.r2Key }));
      await db
        .update(r2CleanupQueue)
        .set({ status: 'deleted', processedAt: new Date() })
        .where(eq(r2CleanupQueue.id, item.id));
      deleted++;
    } catch (err) {
      const lastError = err instanceof Error ? err.message : String(err);
      await db
        .update(r2CleanupQueue)
        .set({
          attempts: String(attempts),
          lastError,
          processedAt: new Date(),
          ...(attempts >= MAX_ATTEMPTS ? { status: 'failed' } : {}),
        })
        .where(eq(r2CleanupQueue.id, item.id));
      failed++;
    }
  }

  return NextResponse.json({ processed: pending.length, deleted, failed });
}
