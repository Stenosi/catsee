'use server';

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
    // Verifica che il post esista e non sia dell'utente corrente
    const post = await db.query.sightings.findFirst({
      where: (s, { eq, and, isNull }) =>
        and(eq(s.id, targetId), isNull(s.deletedAt)),
      columns: { id: true, userId: true },
    });
    if (!post) return { error: 'Avvistamento non trovato.' };
    if (post.userId === reporterId) return { error: 'Non puoi segnalare il tuo avvistamento.' };

    try {
      await db.insert(reports).values({
        sightingId: targetId,
        reporterId,
        reasons,
      });
    } catch {
      return { error: 'Hai già segnalato questo avvistamento.' };
    }
  } else {
    // Verifica che non si stia segnalando se stessi
    if (targetId === reporterId) return { error: 'Non puoi segnalare te stesso.' };

    // targetId per user reports è lo username — recupera l'id
    const target = await db.query.users.findFirst({
      where: (u, { eq, isNull, and }) =>
        and(eq(u.username, targetId), isNull(u.deletedAt)),
      columns: { id: true },
    });
    if (!target) return { error: 'Utente non trovato.' };
    if (target.id === reporterId) return { error: 'Non puoi segnalare te stesso.' };

    try {
      await db.insert(reports).values({
        reportedUserId: target.id,
        reporterId,
        reasons,
      });
    } catch {
      return { error: 'Hai già segnalato questo utente.' };
    }
  }

  return { success: true };
}
