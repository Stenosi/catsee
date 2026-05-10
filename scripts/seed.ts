/**
 * Seed script — popola il DB con dati iniziali.
 *
 * Da eseguire una volta dopo `db:push` con: `npm run db:seed`
 *
 * Cosa fa:
 *  1. Inserisce/aggiorna il catalogo dei badge MVP
 *  2. Promuove un utente specifico ad admin (configurato via env var)
 *
 * Idempotente: può essere rilanciato in sicurezza.
 */

import 'dotenv/config';
import { db } from '../src/db';
import { badges, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// 1. Badges MVP
// ============================================================================

const MVP_BADGES = [
  {
    id: 'first_cat',
    name: 'Primo Gatto',
    description: 'Hai pubblicato il tuo primo avvistamento.',
    icon: '🥇',
    category: 'milestone' as const,
    displayOrder: '10',
  },
  {
    id: 'explorer_5',
    name: 'Esploratore',
    description: 'Hai avvistato 5 gatti.',
    icon: '🐾',
    category: 'milestone' as const,
    displayOrder: '20',
  },
  {
    id: 'cat_hunter_10',
    name: 'Cat Hunter',
    description: 'Hai avvistato 10 gatti.',
    icon: '🎖️',
    category: 'milestone' as const,
    displayOrder: '30',
  },
  {
    id: 'cat_master_50',
    name: 'Cat Master',
    description: 'Hai avvistato 50 gatti.',
    icon: '🏆',
    category: 'milestone' as const,
    displayOrder: '40',
  },
  {
    id: 'streak_2',
    name: 'Streak 2 giorni',
    description: 'Hai avvistato un gatto in 2 giorni consecutivi.',
    icon: '🔥',
    category: 'streak' as const,
    displayOrder: '50',
  },
  {
    id: 'streak_7',
    name: 'Streak 7 giorni',
    description: 'Hai avvistato un gatto in 7 giorni consecutivi.',
    icon: '🔥🔥',
    category: 'streak' as const,
    displayOrder: '60',
  },
  {
    id: 'night_owl',
    name: 'Notturno',
    description: 'Hai avvistato un gatto tra le 22:00 e le 06:00.',
    icon: '🌑',
    category: 'time' as const,
    displayOrder: '70',
  },
  {
    id: 'panther_5',
    name: 'Pantera',
    description: 'Hai avvistato 5 gatti neri.',
    icon: '🖤',
    category: 'color' as const,
    displayOrder: '80',
  },
] as const;

async function seedBadges() {
  console.log('🏅 Seeding badges...');
  for (const badge of MVP_BADGES) {
    await db
      .insert(badges)
      .values(badge)
      .onConflictDoUpdate({
        target: badges.id,
        set: {
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          displayOrder: badge.displayOrder,
        },
      });
  }
  console.log(`   ✓ ${MVP_BADGES.length} badges inseriti/aggiornati.`);
}

// ============================================================================
// 2. Promozione admin
// ============================================================================

async function promoteAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.log('⚠️  ADMIN_EMAIL non configurata, salto la promozione admin.');
    console.log('   Per promuovere un utente, aggiungi ADMIN_EMAIL in .env');
    return;
  }

  console.log(`👑 Promuovo ${adminEmail} ad admin...`);

  const result = await db
    .update(users)
    .set({ role: 'admin', updatedAt: new Date() })
    .where(eq(users.email, adminEmail))
    .returning({ id: users.id, username: users.username });

  if (result.length === 0) {
    console.log(`   ⚠️  Nessun utente con email ${adminEmail}.`);
    console.log(`       Registrati prima nell'app, poi rilancia il seed.`);
  } else {
    console.log(`   ✓ ${result[0].username} è ora admin.`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🌱 Seed CatSee\n');
  await seedBadges();
  await promoteAdmin();
  console.log('\n✅ Seed completato.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Errore durante il seed:', err);
  process.exit(1);
});
