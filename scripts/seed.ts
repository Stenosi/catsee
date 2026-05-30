/**
 * Seed script - popola il DB con dati iniziali.
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
// 1. Catalogo badge completo
// ============================================================================

const ALL_BADGES = [
  // ── Milestone ──────────────────────────────────────────────────────────────
  {
    id: 'first_cat',
    name: 'Primo Gatto',
    description: 'Pubblica il tuo primo avvistamento.',
    icon: '🥇',
    category: 'milestone' as const,
    displayOrder: '010',
    target: 1,
  },
  {
    id: 'explorer_5',
    name: 'Esploratore',
    description: 'Avvista 5 gatti.',
    icon: '🐾',
    category: 'milestone' as const,
    displayOrder: '020',
    target: 5,
  },
  {
    id: 'cat_hunter_10',
    name: 'Cat Hunter',
    description: 'Avvista 10 gatti.',
    icon: '🎖️',
    category: 'milestone' as const,
    displayOrder: '030',
    target: 10,
  },
  {
    id: 'cat_master_50',
    name: 'Cat Master',
    description: 'Avvista 50 gatti.',
    icon: '🏆',
    category: 'milestone' as const,
    displayOrder: '040',
    target: 50,
  },
  {
    id: 'cat_legend_100',
    name: 'Leggenda dei Gatti',
    description: 'Avvista 100 gatti.',
    icon: '🌟',
    category: 'milestone' as const,
    displayOrder: '045',
    target: 100,
  },
  // ── Streak ─────────────────────────────────────────────────────────────────
  {
    id: 'streak_2',
    name: 'Streak 2 giorni',
    description: 'Avvista un gatto in 2 giorni consecutivi.',
    icon: '🔥',
    category: 'streak' as const,
    displayOrder: '100',
    target: null,
  },
  {
    id: 'streak_7',
    name: 'Streak 7 giorni',
    description: 'Avvista un gatto in 7 giorni consecutivi.',
    icon: '🔥🔥',
    category: 'streak' as const,
    displayOrder: '110',
    target: null,
  },
  {
    id: 'streak_14',
    name: 'Streak 14 giorni',
    description: 'Avvista un gatto in 14 giorni consecutivi.',
    icon: '🔥🔥🔥',
    category: 'streak' as const,
    displayOrder: '120',
    target: null,
  },
  {
    id: 'streak_30',
    name: 'Streak 30 giorni',
    description: 'Avvista un gatto in 30 giorni consecutivi.',
    icon: '💥',
    category: 'streak' as const,
    displayOrder: '130',
    target: null,
  },
  // ── Orari ──────────────────────────────────────────────────────────────────
  {
    id: 'night_owl',
    name: 'Notturno',
    description: 'Avvista un gatto tra le 22:00 e le 06:00.',
    icon: '🌑',
    category: 'time' as const,
    displayOrder: '200',
    target: null,
  },
  {
    id: 'early_bird',
    name: 'Mattiniero',
    description: 'Avvista un gatto tra le 05:00 e le 08:00.',
    icon: '🌅',
    category: 'time' as const,
    displayOrder: '210',
    target: null,
  },
  {
    id: 'golden_hour',
    name: 'Ora Magica',
    description: 'Avvista un gatto tra le 17:00 e le 20:00.',
    icon: '🌇',
    category: 'time' as const,
    displayOrder: '220',
    target: null,
  },
  // ── Colori ─────────────────────────────────────────────────────────────────
  {
    id: 'panther_5',
    name: 'Pantera',
    description: 'Avvista 5 gatti neri.',
    icon: '🖤',
    category: 'color' as const,
    displayOrder: '300',
    target: 5,
  },
  {
    id: 'color_black_5',
    name: 'Ombre Nere',
    description: 'Avvista 5 gatti neri.',
    icon: '🖤',
    category: 'color' as const,
    displayOrder: '301',
    target: 5,
  },
  {
    id: 'color_gray_5',
    name: 'Bruma Grigia',
    description: 'Avvista 5 gatti grigi.',
    icon: '🩶',
    category: 'color' as const,
    displayOrder: '302',
    target: 5,
  },
  {
    id: 'color_white_5',
    name: 'Nuvole Bianche',
    description: 'Avvista 5 gatti bianchi.',
    icon: '🤍',
    category: 'color' as const,
    displayOrder: '303',
    target: 5,
  },
  {
    id: 'color_cream_5',
    name: 'Dolce Crema',
    description: 'Avvista 5 gatti color crema.',
    icon: '🍦',
    category: 'color' as const,
    displayOrder: '304',
    target: 5,
  },
  {
    id: 'color_orange_5',
    name: 'Fuochi d\'Arancio',
    description: 'Avvista 5 gatti arancioni.',
    icon: '🧡',
    category: 'color' as const,
    displayOrder: '305',
    target: 5,
  },
  {
    id: 'color_cinnamon_5',
    name: 'Spezia di Cannella',
    description: 'Avvista 5 gatti cannella.',
    icon: '🤎',
    category: 'color' as const,
    displayOrder: '306',
    target: 5,
  },
  {
    id: 'color_brown_5',
    name: 'Terra Bruna',
    description: 'Avvista 5 gatti marroni.',
    icon: '🟤',
    category: 'color' as const,
    displayOrder: '307',
    target: 5,
  },
  {
    id: 'color_siamese_5',
    name: 'Velluto Siamese',
    description: 'Avvista 5 gatti siamesi.',
    icon: '🐱',
    category: 'color' as const,
    displayOrder: '308',
    target: 5,
  },
  {
    id: 'color_tabby_5',
    name: 'Tigre Urbana',
    description: 'Avvista 5 gatti tigrati.',
    icon: '🐯',
    category: 'color' as const,
    displayOrder: '309',
    target: 5,
  },
  {
    id: 'color_other_5',
    name: 'Mille Colori',
    description: 'Avvista 5 gatti dalle tinte particolari.',
    icon: '⭐',
    category: 'color' as const,
    displayOrder: '310',
    target: 5,
  },
  // ── Pelo ───────────────────────────────────────────────────────────────────
  {
    id: 'fur_short_5',
    name: 'Pelo di Seta',
    description: 'Avvista 5 gatti con pelo corto.',
    icon: '⚡',
    category: 'fur' as const,
    displayOrder: '400',
    target: 5,
  },
  {
    id: 'fur_short_10',
    name: 'Veloce e Sleek',
    description: 'Avvista 10 gatti con pelo corto.',
    icon: '⚡⚡',
    category: 'fur' as const,
    displayOrder: '410',
    target: 10,
  },
  {
    id: 'fur_long_5',
    name: 'Pelo Lungo',
    description: 'Avvista 5 gatti con pelo lungo.',
    icon: '🧶',
    category: 'fur' as const,
    displayOrder: '420',
    target: 5,
  },
  {
    id: 'fur_long_10',
    name: 'Morbido e Soffice',
    description: 'Avvista 10 gatti con pelo lungo.',
    icon: '🧶🧶',
    category: 'fur' as const,
    displayOrder: '430',
    target: 10,
  },
  // ── Tipo ───────────────────────────────────────────────────────────────────
  {
    id: 'type_stray_5',
    name: 'Randagio Amico',
    description: 'Avvista 5 gatti randagi.',
    icon: '🐾',
    category: 'type' as const,
    displayOrder: '500',
    target: 5,
  },
  {
    id: 'type_stray_10',
    name: 'Esperto di Randagi',
    description: 'Avvista 10 gatti randagi.',
    icon: '🐾🐾',
    category: 'type' as const,
    displayOrder: '510',
    target: 10,
  },
  {
    id: 'type_domestic_5',
    name: 'Amico di Casa',
    description: 'Avvista 5 gatti domestici.',
    icon: '🏠',
    category: 'type' as const,
    displayOrder: '520',
    target: 5,
  },
  {
    id: 'type_domestic_10',
    name: 'Re del Divano',
    description: 'Avvista 10 gatti domestici.',
    icon: '🏠🏠',
    category: 'type' as const,
    displayOrder: '530',
    target: 10,
  },
  // ── Speciali / Stagionali ──────────────────────────────────────────────────
  {
    id: 'spring_cat',
    name: 'Gatto Primaverile',
    description: 'Avvista un gatto a primavera.',
    icon: '🌸',
    category: 'special' as const,
    displayOrder: '600',
    target: null,
  },
  {
    id: 'summer_cat',
    name: 'Gatto Estivo',
    description: 'Avvista un gatto d\'estate.',
    icon: '☀️',
    category: 'special' as const,
    displayOrder: '610',
    target: null,
  },
  {
    id: 'autumn_cat',
    name: 'Gatto Autunnale',
    description: 'Avvista un gatto in autunno.',
    icon: '🍂',
    category: 'special' as const,
    displayOrder: '620',
    target: null,
  },
  {
    id: 'winter_cat',
    name: 'Gatto Invernale',
    description: 'Avvista un gatto d\'inverno.',
    icon: '❄️',
    category: 'special' as const,
    displayOrder: '630',
    target: null,
  },
  {
    id: 'all_seasons',
    name: 'Tutte le Stagioni',
    description: 'Avvista gatti in tutte e quattro le stagioni.',
    icon: '🌍',
    category: 'special' as const,
    displayOrder: '640',
    target: null,
  },
  {
    id: 'new_year_cat',
    name: 'Buon Anno Micio!',
    description: 'Avvista un gatto il 1° gennaio.',
    icon: '🎆',
    category: 'special' as const,
    displayOrder: '650',
    target: null,
  },
  {
    id: 'christmas_cat',
    name: 'Babbo Gatto Natale',
    description: 'Avvista un gatto il 25 dicembre.',
    icon: '🎄',
    category: 'special' as const,
    displayOrder: '651',
    target: null,
  },
  {
    id: 'ferragosto',
    name: 'Micio di Ferragosto',
    description: 'Avvista un gatto il 15 agosto.',
    icon: '🏖️',
    category: 'special' as const,
    displayOrder: '652',
    target: null,
  },
  {
    id: 'halloween_cat',
    name: 'Gatto della Paura',
    description: 'Avvista un gatto il 31 ottobre.',
    icon: '🎃',
    category: 'special' as const,
    displayOrder: '653',
    target: null,
  },
  {
    id: 'friday_13',
    name: 'Venerdì 13',
    description: 'Avvista un gatto di venerdì 13.',
    icon: '🖤',
    category: 'special' as const,
    displayOrder: '654',
    target: null,
  },
];

async function seedBadges() {
  console.log('🏅 Seeding badges...');
  for (const badge of ALL_BADGES) {
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
          target: badge.target,
        },
      });
  }
  console.log(`   ✓ ${ALL_BADGES.length} badges inseriti/aggiornati.`);
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
