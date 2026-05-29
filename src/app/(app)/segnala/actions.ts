'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { getOnboardedSessionForAction } from '@/lib/session';
import { REPORT_REASONS } from '@/db/schema/reports';

const VALID_REASONS = new Set(REPORT_REASONS);

export async function createReport(
  type: 'post' | 'user',
  targetId: string,
  reasons: string[],
): Promise<{ success: true } | { error: string }> {
  const session = await getOnboardedSessionForAction();
  if (!session) return { error: 'Non autenticato.' };

  const reporterId = session.user.id;

  // Valida reasons
  if (!reasons.length) return { error: 'Seleziona almeno un motivo.' };
  if (!reasons.every((r) => VALID_REASONS.has(r as typeof REPORT_REASONS[number]))) {
    return { error: 'Motivo non valido.' };
  }

  if (type === 'post') {
    const post = await db.query.sightings.findFirst({
      where: (s, { eq, and, isNull }) =>
        and(eq(s.id, targetId), isNull(s.deletedAt)),
      columns: { id: true, userId: true },
    });
    if (!post) return { error: 'Avvistamento non trovato.' };
    if (post.userId === reporterId) return { error: 'Non puoi segnalare il tuo avvistamento.' };

    const existing = await db.query.reports.findFirst({
      where: (r, { eq, and }) =>
        and(eq(r.sightingId, targetId), eq(r.reporterId, reporterId)),
      columns: { id: true, resolution: true },
    });

    if (existing) {
      if (existing.resolution === 'pending') {
        return { error: 'Hai già segnalato questo avvistamento.' };
      }
      // Segnalazione già gestita: rimuovi il record per permettere una nuova segnalazione
      await db.delete(reports).where(eq(reports.id, existing.id));
    }

    await db.insert(reports).values({ sightingId: targetId, reporterId, reasons });
  } else {
    if (targetId === reporterId) return { error: 'Non puoi segnalare te stesso.' };

    const target = await db.query.users.findFirst({
      where: (u, { eq, isNull, and }) =>
        and(eq(u.username, targetId), isNull(u.deletedAt)),
      columns: { id: true },
    });
    if (!target) return { error: 'Utente non trovato.' };
    if (target.id === reporterId) return { error: 'Non puoi segnalare te stesso.' };

    const existing = await db.query.reports.findFirst({
      where: (r, { eq, and }) =>
        and(eq(r.reportedUserId, target.id), eq(r.reporterId, reporterId)),
      columns: { id: true, resolution: true },
    });

    if (existing) {
      if (existing.resolution === 'pending') {
        return { error: 'Hai già segnalato questo utente.' };
      }
      // Segnalazione già gestita: rimuovi il record per permettere una nuova segnalazione
      await db.delete(reports).where(eq(reports.id, existing.id));
    }

    await db.insert(reports).values({ reportedUserId: target.id, reporterId, reasons });
  }

  return { success: true };
}
