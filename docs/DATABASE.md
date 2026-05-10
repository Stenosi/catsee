# CatSee — Database package

Schema Drizzle + script per il database PostgreSQL su Neon, con PostGIS.

## Struttura file

```
.
├── drizzle.config.ts                # config drizzle-kit
├── .env.example                     # variabili d'ambiente da settare
├── package.snippet.json             # script e dipendenze da copiare nel package.json di Next.js
├── scripts/
│   ├── 0_setup_postgis.sql          # da eseguire UNA volta su Neon prima di tutto
│   └── seed.ts                      # script di seed (badges + admin)
└── src/db/
    ├── index.ts                     # export pubblico (db, schema)
    ├── client.ts                    # connessione Drizzle ↔ Neon
    ├── geo.ts                       # helper PostGIS (makePoint, withinRadiusMeters, ...)
    └── schema/
        ├── README.ts                # documentazione interna
        ├── index.ts                 # re-export di tutto lo schema
        ├── users.ts
        ├── sightings.ts
        ├── reactions.ts
        ├── follows.ts
        ├── badges.ts
        ├── reports.ts
        ├── cleanup.ts
        └── auth.ts                  # tabelle Auth.js (boilerplate)
```

## Setup iniziale (una sola volta)

1. **Crea progetto su Neon**
   - https://console.neon.tech → crea nuovo progetto
   - Copia la `DATABASE_URL` (connection string "pooled")

2. **Configura `.env`**
   ```bash
   cp .env.example .env
   # Compila DATABASE_URL e ADMIN_EMAIL
   ```

3. **Abilita PostGIS sul database**
   - Neon dashboard → SQL Editor
   - Copia-incolla `scripts/0_setup_postgis.sql` ed esegui
   - Verifica output `PostGIS_Version()` non vuoto

4. **Installa dipendenze nel progetto Next.js**
   - Vedi `package.snippet.json` per le librerie da aggiungere
   - Aggiungi gli script `db:*`

5. **Push dello schema**
   ```bash
   npm run db:push
   ```
   Drizzle ti mostrerà cosa farà → conferma.

6. **Seed iniziale**
   ```bash
   npm run db:seed
   ```
   Inserisce i badge MVP. Per promuovere admin:
   - Registrati nell'app con email = ADMIN_EMAIL
   - Rilancia `npm run db:seed`

## Comandi quotidiani

| Comando | Quando usarlo |
|---|---|
| `npm run db:push` | Modificato lo schema → sincronizza al DB |
| `npm run db:studio` | Visualizza/modifica dati nel browser |
| `npm run db:seed` | Re-inserisce badge / promuove admin (idempotente) |

## Strategia migrazioni

Per **MVP** usiamo `db:push` perché lo schema cambia spesso e siamo da soli. È più rapido.

Quando il prodotto sarà stabile / in produzione con utenti veri, passiamo a:
```bash
npm run db:generate   # genera file SQL di migrazione
git commit ...        # versiona il file
npm run db:migrate    # applica le migrazioni
```

## Note tecniche

### Soft delete
Tutte le tabelle "primarie" (users, sightings) hanno `deletedAt`. Le query devono filtrare `WHERE deleted_at IS NULL` oppure usare le viste/indici parziali predefiniti.

### Coordinate
- `locationReal`: coordinate vere, mai esposte via API.
- `locationFuzzed`: offset random ~100m, esposte pubblicamente.
- Calcolo del fuzzing: `fuzzCoordinates()` in `geo.ts`, lato applicazione (più trasparente).

### Encryption
Encryption-at-rest fornita automaticamente da Neon. Nessuna logica applicativa.

### Pulizia file R2
Niente delete sincroni. Il file viene aggiunto a `r2_cleanup_queue` con stato `pending`. Un job notturno (cron Vercel) processa la coda con retry automatici.

### Auth.js
Le tabelle `accounts`, `sessions`, `verificationTokens`, `authenticators` sono lo schema standard atteso da Auth.js v5 con DrizzleAdapter. Non modificarle a meno di aggiornamenti maggiori di Auth.js.
