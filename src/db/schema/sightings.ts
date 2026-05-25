import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  pgEnum,
  jsonb,
  doublePrecision,
  index,
  customType,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

// ============================================================================
// CUSTOM TYPE: geography(Point, 4326) — PostGIS
// ============================================================================

/**
 * Tipo PostGIS per memorizzare punti geografici sul globo.
 * SRID 4326 = WGS84, lo standard GPS.
 *
 * Drizzle non ha un tipo PostGIS nativo, lo definiamo come customType.
 * I valori sono inseriti come stringa WKT: `POINT(lng lat)` (lng prima!).
 *
 * Per query "vicini a me" useremo ST_DWithin in raw SQL via `sql` template.
 */
export const geographyPoint = customType<{
  data: { lng: number; lat: number };
  driverData: string;
}>({
  dataType() {
    return 'geography';
  },
  toDriver(value) {
    return `POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value) {
    if (typeof value === 'string' && value.startsWith('POINT')) {
      const match = value.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
      if (match) {
        return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
      }
    }
    return { lng: 0, lat: 0 };
  },
});

// ============================================================================
// ENUM
// ============================================================================

/**
 * Tipo di gatto avvistato.
 * Per MVP defaulta a 'stray' per tutti, UI introdotta in v2.
 * Solo stray + community danno XP/badge.
 */
export const catTypeEnum = pgEnum('cat_type', [
  'stray',
  'community',
  'domestic',
]);

/**
 * Pelo del gatto.
 */
export const catFurEnum = pgEnum('cat_fur', ['short', 'long']);

/**
 * Stato di moderazione del post.
 * - approved: visibile pubblicamente (default per AI-verified)
 * - pending: in coda admin (AI fail o auto-flag report)
 * - rejected: rimosso da admin
 */
export const moderationStatusEnum = pgEnum('moderation_status', [
  'approved',
  'pending',
  'rejected',
]);

/**
 * Visibilità del post.
 * - public: visibile a tutti sulla mappa e nei feed
 * - private_owner: l'utente non aveva GPS, post visibile solo a lui
 *   (non sulla mappa). Permette di salvare l'avvistamento comunque.
 */
export const postVisibilityEnum = pgEnum('post_visibility', [
  'public',
  'private_owner',
]);

// ============================================================================
// TIPI TYPESCRIPT PER CAMPI JSON
// ============================================================================

/**
 * Una entry della palette colori estratta dall'immagine.
 */
export type PaletteEntry = {
  hex: string; // es. "#ff6600"
  percentage: number; // 0-100
};

// ============================================================================
// COSTANTI VINCOLI BUSINESS
// ============================================================================

export const SIGHTING_LIMITS = {
  CAT_NICKNAME_MAX_LENGTH: 30,
  NOTE_MAX_LENGTH: 200,
  MAX_TAG_COLORS: 3,
  /** Raggio di fuzzing per coordinate "approssimate" (metri) */
  FUZZING_RADIUS_METERS: 100,
} as const;

/** Tag colori disponibili — sincronizzato con UI */
export const TAG_COLORS = [
  'black',
  'white',
  'gray',
  'orange',
  'brown',
  'tabby',
  'other',
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

// ============================================================================
// TABELLA sightings
// ============================================================================

export const sightings = pgTable(
  'sightings',
  {
    // ── Identificatore
    id: uuid('id').primaryKey().defaultRandom(),

    // ── Autore (relazione)
    /**
     * onDelete: 'cascade' significa che se l'utente viene HARD-deletato,
     * tutti i suoi post vengono eliminati. In pratica usiamo soft delete
     * sull'utente, quindi questo cascade scatta solo nella pulizia finale
     * dopo i 30 giorni.
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // ── Foto
    /** Path su Cloudflare R2 (es. "sightings/2026/04/uuid.jpg") */
    photoKey: text('photo_key').notNull(),
    /** Path della thumbnail su R2 */
    photoThumbnailKey: text('photo_thumbnail_key').notNull(),

    // ── Contenuto
    /**
     * Nickname del gatto. Obbligatorio in MVP (funge da "titolo" del post).
     * Validato lato app contro la blocklist parole offensive.
     */
    catNickname: varchar('cat_nickname', { length: 30 }).notNull(),

    /** Note libere opzionali, max 200 char, filtrate per parole offensive */
    note: varchar('note', { length: 200 }),

    /** Tipo gatto. MVP: sempre 'stray'. UI introdotta in v2. */
    catType: catTypeEnum('cat_type').default('stray').notNull(),

    /**
     * Tag colori scelti dall'utente, max 3 (validato a livello applicazione).
     * Usiamo text[] perché PostgreSQL ha array nativi.
     */
    tagColors: text('tag_colors').array().notNull(),

    /** Pelo del gatto */
    tagFur: catFurEnum('tag_fur').notNull(),

    /**
     * Palette colori estratta automaticamente dall'immagine.
     * Salvata per badge avanzati v2 e potenziale generazione avatar gatto.
     */
    extractedPalette: jsonb('extracted_palette')
      .$type<PaletteEntry[]>()
      .notNull(),

    // ── Geolocalizzazione
    /**
     * Coordinate VERE (encryption-at-rest tramite Neon).
     * Visibili solo all'autore nella sua mappa privata.
     */
    locationReal: geographyPoint('location_real').notNull(),

    /**
     * Coordinate FUZZED (offset random entro FUZZING_RADIUS_METERS).
     * Esposte via API pubblica.
     * Calcolate al momento della pubblicazione.
     * Se l'utente ha settings.preciseLocation = true, locationFuzzed === locationReal.
     */
    locationFuzzed: geographyPoint('location_fuzzed').notNull(),

    // ── Moderazione
    /** True se TF.js ha riconosciuto un gatto in fase di pubblicazione */
    aiVerified: boolean('ai_verified').default(false).notNull(),

    /** Stato moderazione */
    moderationStatus: moderationStatusEnum('moderation_status')
      .default('approved')
      .notNull(),

    /** Numero di report aggregati — denormalizzato per performance */
    reportsCount: doublePrecision('reports_count').default(0).notNull(),

    // ── Visibilità
    visibility: postVisibilityEnum('visibility').default('public').notNull(),

    // ── Edit tracking
    /** True se il post è stato modificato dopo la creazione */
    edited: boolean('edited').default(false).notNull(),

    // ── Timestamp
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    /**
     * Soft delete. Il post sparisce da feed/mappa.
     * Pulizia file R2 affidata al job notturno (vedi cleanup.ts).
     */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    // ── INDICI PER QUERY COMUNI

    // Feed "post di un utente" — ordinati per data desc
    userIdCreatedAtIdx: index('sightings_user_id_created_at_idx').on(
      table.userId,
      table.createdAt,
    ),

    // Feed esplora — post pubblici recenti
    publicFeedIdx: index('sightings_public_feed_idx')
      .on(table.createdAt)
      .where(
        sql`visibility = 'public' AND moderation_status = 'approved' AND deleted_at IS NULL`,
      ),

    // Mappa — query geografiche con PostGIS, indice GIST
    locationFuzzedIdx: index('sightings_location_fuzzed_idx')
      .using('gist', table.locationFuzzed),

    // Coda moderazione admin
    moderationIdx: index('sightings_moderation_idx')
      .on(table.moderationStatus, table.createdAt)
      .where(sql`moderation_status = 'pending'`),
  }),
);

// ============================================================================
// TIPI INFERITI
// ============================================================================

export type Sighting = typeof sightings.$inferSelect;
export type NewSighting = typeof sightings.$inferInsert;
