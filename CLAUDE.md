# CatSee — Briefing per Claude Code

Questo file è il punto d'ingresso per chi (umano o AI) inizia a lavorare sul progetto. Contiene il **contesto essenziale** del prodotto e link ai documenti dettagliati.

> **Per Claude Code:** leggi questo file all'inizio di ogni sessione. Per task specifici, leggi anche il documento di riferimento dalla sezione "Documenti chiave".

---

## TL;DR del prodotto

CatSee è una **PWA** (Progressive Web App) per amanti dei gatti. L'utente, durante una passeggiata, scatta una foto di un gatto randagio direttamente dall'app (stile BeReal, no upload da galleria), la geolocalizza e la pubblica su una **mappa globale** condivisa con la community.

**Anime del prodotto:**
1. **Diario personale** — tieni traccia dei gatti che incontri.
2. **Social leggero** — segui altri utenti, reagisci con emoji.
3. **Gamification onesta** — badge, streak, contatori con anti-cheating.

**Tre principi non negoziabili:**
- **Privacy-first.** Coordinate vere mai esposte, fuzzing entro 100m di default.
- **Autenticità.** Foto solo da fotocamera live in-app, no upload da galleria.
- **Wholesome social.** No DM, no commenti testuali liberi (solo emoji), no algoritmi di engagement.

## Stato del progetto

- **Fase:** sviluppo MVP v1.0
- **Target lancio:** Italia (focus iniziale Marche), poi globale
- **Lingua MVP:** italiano (i18n predisposta da subito)
- **Tema MVP:** solo chiaro (codice dark-mode-ready via CSS variables)
- **Piattaforma MVP:** mobile-first PWA (desktop come visualizzazione read-only in v1.x)

## Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Linguaggio | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand + TanStack Query |
| i18n | next-intl |
| Mappa | Leaflet + react-leaflet + leaflet.markercluster + OpenStreetMap |
| Database | Neon PostgreSQL serverless + PostGIS |
| ORM | Drizzle ORM (modalità `push` per MVP) |
| Auth | Auth.js v5 (magic link via Resend + Google OAuth) |
| Storage | Cloudflare R2 (S3-compatible, free tier 10GB) |
| AI is-a-cat | TensorFlow.js + COCO-SSD (client-side) |
| Palette colori | node-vibrant (client-side) |
| Hosting | Vercel free tier |
| Rate limiting | Upstash Ratelimit |
| Analytics | Plausible/Umami self-hosted (cookieless, GDPR) |
| Error tracking | Sentry free tier |

## Documenti chiave

Tutti in `docs/`. Consultali per i dettagli prima di prendere decisioni di implementazione.

| File | Contenuto |
|---|---|
| `docs/SPEC.md` | Specifica funzionale completa: feature MVP, roadmap futura, principi di design, considerazioni legali, modello dati high-level |
| `docs/WIREFRAMES.md` | Wireframe testuali di tutte le schermate mobile MVP, pattern UI globali, flow utente |
| `docs/DATABASE.md` | Setup database, struttura schema Drizzle, comandi quotidiani, strategia migrazioni |
| `docs/DESIGN_SYSTEM.md` | Palette colori (token OKLCH, motivazioni, linee guida d'uso), tipografia, anti-pattern, note dark mode |
| `docs/KNOWN_BUGS.md` | Bug confermati (risolti e aperti): sintomi, cause, tentativi, soluzione adottata |

## Struttura repository

```
catsee/
├── CLAUDE.md                      ← questo file
├── docs/
│   ├── SPEC.md
│   ├── WIREFRAMES.md
│   └── DATABASE.md
├── src/
│   ├── db/
│   │   ├── client.ts              ← client Drizzle ↔ Neon
│   │   ├── geo.ts                 ← helper PostGIS
│   │   ├── index.ts               ← re-export
│   │   └── schema/                ← schema diviso per dominio
│   ├── app/                       ← Next.js App Router
│   ├── components/
│   │   └── ui/                    ← componenti shadcn/ui
│   └── lib/                       ← utility condivise
├── scripts/
│   ├── 0_setup_postgis.sql        ← UNA tantum, su Neon
│   └── seed.ts                    ← popola badges + admin
├── drizzle.config.ts
├── .env.example
└── package.json
```

## Convenzioni di codice

- **TypeScript ovunque.** No `any`, no `// @ts-ignore` se evitabile.
- **camelCase in TS, snake_case in DB.** Drizzle traduce.
- **CSS variables di shadcn/ui.** Mai colori hardcoded (`bg-white`, `text-black`). Usa `bg-background`, `text-foreground`, ecc. per dark-mode readiness.
- **Server Components di default.** `'use client'` solo dove serve davvero (interazioni, browser API).
- **Server Actions per le mutazioni.** Niente API REST custom in MVP, le Server Actions di Next.js bastano.
- **Validazione con Zod** su ogni input utente, sia client che server.
- **Soft delete** dove abbiamo `deletedAt`, mai DELETE hard nel codice applicativo.
- **Rate limiting** su tutte le mutazioni (login, post, like, follow).

## Decisioni architetturali importanti

### Privacy coordinate
Salvare sempre `locationReal` (vero) e `locationFuzzed` (offset random ~100m) nel DB. Le API pubbliche espongono SOLO `locationFuzzed` (a meno che l'utente abbia opt-in `preciseLocation: true`). Le coordinate vere sono visibili solo all'autore nella sua mappa privata.

### Encryption
Nessuna application-level encryption. Affidiamo a Neon la encryption-at-rest (automatica, gratuita). La protezione della privacy viene dal fuzzing, non dalla crittografia.

### Pulizia file R2
Niente DELETE sincroni. Quando un file diventa orfano (avatar sostituito, post eliminato, ecc.), aggiungiamo una riga a `r2_cleanup_queue` con stato `pending`. Un cron job notturno (Vercel Cron) processa la coda con retry automatici, max 5 tentativi.

### Camera
Non usiamo la camera di sistema (salverebbe in galleria). Usiamo `navigator.mediaDevices.getUserMedia()` per il feed video in-app + canvas per la cattura del frame. Garantisce l'autenticità BeReal-style.

### AI verifica
Verifica "is-a-cat" via TensorFlow.js + COCO-SSD client-side. Zero costi, zero latenza server, foto non viaggia mai per essere validata. Se fallisce, post va in moderazione admin.

### Soft delete + GDPR
Eliminazione account → 1) `deletedAt = now()`, 2) anonimizzazione email/username, 3) job cleanup file R2, 4) hard delete dopo 30 giorni.

## Anti-pattern da evitare

- ❌ DM, commenti testuali liberi, algoritmi di engagement (scelte filosofiche permanenti).
- ❌ Cookie banner. Usiamo analytics cookieless.
- ❌ Tracking pixel di terze parti. Mai.
- ❌ Pubblicità. Mai.
- ❌ Hardcoded colors / strings (rompe dark mode e i18n).
- ❌ DB queries dentro componenti React. Usa Server Components o Server Actions.
- ❌ Coordinate esatte in API pubbliche.
- ❌ EXIF non strippato dalle foto.

## Flow di sviluppo locale

```bash
pnpm dev              # avvia Next.js
pnpm db:push          # sincronizza schema dopo modifiche
pnpm db:studio        # esplora il DB nel browser
pnpm db:seed          # popola badges + promuovi admin
pnpm lint             # ESLint
```

## Per Claude Code: come aiutarmi al meglio

- **Quando proponi feature nuove**, controlla prima in `docs/SPEC.md` se è già stata pensata (potrebbe essere in roadmap v1.1+ deliberatamente).
- **Per UI**, usa il design system shadcn/ui esistente. Non aggiungere componenti senza motivo.
- **Per query DB**, sfrutta gli helper in `src/db/geo.ts` per query geografiche e gli indici esistenti.
- **Pubblica codice piccolo e testabile**, non file giganti.
- **Discuti le decisioni grosse** prima di implementarle: non farti scappare lo scope.
- **Mantieni la documentazione aggiornata** (specialmente `CLAUDE.md` se aggiungi qualcosa di importante).

## Roadmap di sviluppo (alto livello)

L'ordine di sviluppo che ha più senso (non rigido):

1. ✅ Setup repo, schema DB, dipendenze
2. ✅ Auth.js + magic link (Resend) — Google OAuth rimandato a dopo il lancio
3. ✅ Onboarding (username + nickname)
4. ✅ Layout di base + bottom navbar
5. ✅ Profilo proprio (read-only base)
5b. ✅ Modifica profilo (nickname, bio, username con lock 30gg)
5c. ✅ Pagina badge (catalogo + progresso + emoji fill)
6. ⬜ Mappa pubblica con pin
7. ⬜ Flow scatto: camera → AI verify → palette → form → save
8. ⬜ Feed (Seguiti / Esplora / Vicini)
9. ⬜ Reazioni emoji + Follow/Unfollow
10. ⬜ Sistema badge + unlock animations
11. ⬜ Moderazione (segnalazioni, pannello admin)
12. ⬜ PWA manifest + service worker + install prompt
13. ⬜ Job cron R2 cleanup
14. ⬜ Privacy policy + ToS + GDPR consent
15. ⬜ Beta launch

## Decisioni aperte / da prendere

- Naming definitivo (CatSee è placeholder).
- Branding: logo, palette finale, tono di voce.
- Design dettagliato schermate (per ora wireframe testuali, code-first approach).
- Lista parole offensive italiane curata per `obscenity`.
- Strategia testing (Vitest? Playwright? quanto coverage?).
- Domain name e hosting di produzione.
- Privacy policy e ToS dettagliati (template + adattamento, possibile consulenza legale a scaling).

## Aggiornamenti post-setup (2026-05-10)

Decisioni prese durante il setup iniziale, non ancora documentate altrove:

- **Schema DB:** completo e pushato su Neon con PostGIS attivo. Tabelle operative: `users`, `sightings`, `reactions`, `follows`, `badges`, `user_badges`, `reports`, `r2_cleanup_queue` + tabelle Auth.js (`accounts`, `sessions`, `verificationTokens`, `authenticators`).
- **Auth.js v5 (beta):** installato con `DrizzleAdapter`. Magic link (Resend) e Google OAuth pronti come passo successivo.
- **shadcn/ui:** installato con stile **base-nova** (stile di default dell'init corrente — usa `@base-ui/react` come primitive invece di Radix UI). CSS variables in formato **OKLCH**. File di config: `components.json`.
- **Palette colori:** "Ginger Cat" (ambra arancio caldo). Definita in `src/app/globals.css` con variabili OKLCH per light e dark mode. Token custom aggiuntivi: `--warning`, `--warning-foreground`, `--success`, `--success-foreground` (non standard shadcn, esposti come `bg-warning`, `bg-success` via `@theme inline`).
- **Font:** **Plus Jakarta Sans** (variable font, pesi 400/500/600/700) via `next/font/google`. CSS variable: `--font-sans`. Font mono: Geist Mono (`--font-geist-mono`) per snippet di codice.
- **Sonner:** usato al posto del componente `Toast` deprecato di shadcn/ui.
- **React Compiler:** abilitato in `next.config.ts`.
- **AGENTS.md:** presente nella root con best practice Next.js aggiornate.
- **Database:** PostgreSQL 17 su Neon, regione Europa.
- **Pulizia R2:** strategia confermata — coda `r2_cleanup_queue` + cron job notturno Vercel, niente delete sincroni.

## Aggiornamenti sessione 3 (2026-05-17)

### Auth.js completato

- **`src/auth.ts`:** Auth.js v5 con `DrizzleAdapter` wrappato. Override di `createUser` per iniettare `username` temp e `onboardingCompleted: false` (il nostro schema ha `username/nickname NOT NULL`, l'adapter di default non li conosce). Session callback arricchisce la sessione con `id`, `username`, `nickname`, `role`, `onboardingCompleted`.
- **`src/proxy.ts`:** sostituisce `middleware.ts` (rinomina richiesta da Next.js 16). Protegge le route: non autenticato → `/login`; autenticato ma non onboarded → `/onboarding`; route pubbliche: `/`, `/mappa`, `/login`, `/api/auth`.
- **Provider:** solo Resend (magic link). Google OAuth rimandato a post-lancio — setup troppo lento in sviluppo.
- **`/api/auth/dev-login`:** endpoint dev-only che crea sessione Auth.js reale senza email. Configura `DEV_USER_EMAIL` in `.env`. **Invisibile in produzione** (`NODE_ENV !== 'development'` → 404).
- **Schema:** aggiunte colonne `email_verified` (timestamp, nullable) e `onboarding_completed` (boolean, default false) a `users`. Pushato su Neon.

### Onboarding

- **`src/app/(auth)/onboarding/page.tsx`:** 2 step (username → nickname). Validazione live username con debounce 400ms (server action `checkUsername`). Controllo disponibilità, formato, parole riservate, obscenity (libreria `obscenity` con dataset inglese).
- **Pagine auth** nel route group `(auth)` — layout senza AppHeader/BottomNavbar.

### Convenzioni stabilite

- **`src/lib/session.ts`:** helper `getSession()`, `requireSession()`, `requireOnboardedSession()` da usare in tutti i Server Components e Server Actions che richiedono autenticazione. **Non usare `auth()` direttamente nei componenti** — usa questi helper.
- **Input styled manualmente:** il progetto non ha ancora un componente `<Input>` shadcn. Fino a che non viene installato, usare `<input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ...">` (stesso stile del componente shadcn).
- **Route group `(auth)`:** tutte le schermate senza navbar (login, onboarding, future schermate fullscreen) vanno qui.

## Aggiornamenti sessione 2 (2026-05-15)

### Layout shell completato

- **`src/app/(app)/layout.tsx`:** shell `h-dvh overflow-hidden flex flex-col` con `AppHeader` (`shrink-0`) + `<main className="flex-1 overflow-y-auto">` + `BottomNavbar` (`shrink-0`). Niente `sticky` — non necessario quando il parent non scrolla.
- **`src/app/page.tsx`:** redirect verso `/mappa`.
- **Pagine placeholder:** `mappa`, `feed`, `scatta`, `cerca` — tutte con contenuto minimo.

### Bottom navbar

- 5 tab (Mappa, Feed, [FAB Scatta], Cerca, Profilo). FAB centrato, `-translate-y-2` per sollevarsi, `w-14 h-14 rounded-full`.
- Nascosta su `/scatta` via `HIDDEN_PATHS`.
- Safe area: `pb-[env(safe-area-inset-bottom)]` sul `<nav>`, altezza fissa `h-16` sull'inner div.

### Gesture bar / safe area

- `viewport` export in `src/app/layout.tsx` con `viewportFit: "cover"`.
- `html { @apply bg-card; }` in `globals.css` — l'elemento `html` riempie le aree fuori dal contenuto (gesture bar in basso, status bar in alto) con il colore della navbar.

### App header

- Variante per route: logo su mappa/feed, titolo + settings su profilo, searchbar su cerca.
- Nascosto su `/scatta`.

### Tabs shadcn — fix visivi

- `src/components/ui/tabs.tsx`: `after:bottom-[-5px]` → `after:bottom-0` (indicatore a filo), `after:bg-foreground` → `after:bg-primary`.
- Rimosso shadow da tutti i `TabsTrigger` (non solo quando attivi).

### Pagina Profilo

- Avatar con `onLoadingStatusChange` + `Skeleton` overlay + `AvatarFallback` sempre nel DOM (base-ui gestisce la visibilità).
- Stats con `<dl>/<dd>/<dt>` (HTML semantico per coppie chiave-valore).
- Badge gatti avvistati con `aria-label`.
- Tabs Post / Mappa con swipe orizzontale: `|deltaX| ≥ 50 && |deltaX| > |deltaY|` per non interferire con lo scroll verticale.
- Empty state con componente `Empty` di shadcn per entrambe le tab.

### Workflow testing mobile

Il dev server Next.js **non funziona via IP di rete locale** su mobile: il WebSocket HMR fallisce durante `hydrate()`, impedendo l'idratazione React (app visiva ma non interattiva). Vedere `docs/KNOWN_BUGS.md` KB-001 e KB-002 per dettagli.

**Strategia adottata:** sviluppo e debug su desktop; testing mobile su **Vercel** (deploy automatico da `main`, URL HTTPS stabile, nessun problema HMR).

### Vercel

- Progetto collegato al repo GitHub `main`. Deploy automatico ad ogni push.
- Free tier Vercel sufficiente per MVP.
- **Regione:** impostare la regione delle Functions su `fra1` (Frankfurt) nelle Settings del progetto Vercel, per minimizzare la latenza verso Neon Europa. Il default `iad1` (Washington) aggiunge ~200ms per query.

## Aggiornamenti sessione 5 (2026-05-21)

### Route pubbliche — layout (app)

- **`(app)/layout.tsx`** ora usa `getSession()` invece di `requireOnboardedSession()`. Il layout non redirige più gli utenti non autenticati — `/mappa` è accessibile come spettatore. Le singole pagine che richiedono auth (es. `/profilo`) chiamano `requireOnboardedSession()` nella loro page.
- **`AppHeader`** accetta `username: string | null` per supportare utenti non loggati.

### Onboarding — restyling step 1 e 2

- Sottotesto username: "Il tuo nome univoco su CatSee. Nessun altro può averlo."
- Hint box sostituito con componente `Alert` (shadcn) + lista puntata dei vincoli. Installato `src/components/ui/alert.tsx`.
- Progress indicator animato: linea che si disegna da pallino 1 a pallino 2, con `delay-300` solo in avanzamento (non in ritorno).

### Modifica profilo

- **`src/app/(app)/profilo/modifica/page.tsx`** — Server Component: carica utente dal DB, calcola `usernameLockedDays` server-side.
- **`src/app/(app)/profilo/modifica/_components/modifica-client.tsx`** — Client Component: `react-hook-form` + Zod, avatar placeholder con overlay fotocamera, nickname/bio/username con validazione, username locked con `Alert` + giorni rimanenti, bottone salva abilitato solo se `isDirty`.
- **`src/app/(app)/profilo/modifica/actions.ts`** — Server Action `saveProfile`: valida tutti i campi, check lock 30gg, profanity su nickname+bio+username, unicità username, `revalidatePath`, redirect a `/profilo` al successo.
- **Sonner** installato (`pnpm add sonner`). `<Toaster position="top-center" richColors />` aggiunto al root layout. Usare `toast.success()` / `toast.error()` per feedback mutazioni.

### Pagina badge

- **`src/app/(app)/profilo/badge/page.tsx`** — Server Component puro (no interazioni).
- Badge raggruppati per categoria, flex wrap con `basis-[40%]` per riempire le righe incomplete.
- Badge con `target > 1` non ancora sbloccati: emoji con fill dal basso via `clip-path: inset(X% 0 -20% 0)` (layer colorato su layer grayscale), barra `Progress` h-1.5 con counter `X/Y` a destra, descrizione sotto. Il `-20%` sul bottom compensa il padding sotto la baseline delle emoji.
- Barra totale in cima: "Badge sbloccati X/Y" con `Progress`.
- Installato `src/components/ui/progress.tsx`.

### Schema badges

- Aggiunto campo `target: integer` nullable. `null` = badge booleano (no barra). Pushato su Neon.
- Seed aggiornato con target: milestone (1/5/10/50), pantera (5), streak/time/special (`null`). Descrizioni riscritte all'imperativo.

### Obscenity — fix leetspeak italiano

- `src/lib/obscenity.ts` riscritto con **due matcher separati**: inglese con `englishRecommendedTransformers`, italiano con soli `resolveLeetSpeakTransformer` + `toAsciiLowerCaseTransformer` + `skipNonAlphabeticTransformer`. Il motivo: i transformer inglesi includono una whitelist che rompe il matching delle parole italiane se i dataset vengono uniti. Ora "c4zzo", "P3ne" ecc. vengono bloccati.
- **Regola:** aggiungere `containsProfanity()` a OGNI campo testuale libero nelle Server Actions. Vedi KB-003 in `docs/KNOWN_BUGS.md` per la checklist.

### Convenzioni aggiornate

- **`<Input>` shadcn** ora installato — non usare più stili manuali inline per i campi testo.
- **`<Alert>` shadcn** per box informativi (sostituisce i `<div>` con emoji 💡).
- **`<Progress>` shadcn** per barre di avanzamento.
- **Sonner `toast`** per feedback post-mutazione (successo/errore).
- **Avatar upload** rimandato a quando si implementa il flow scatto — stessa infrastruttura R2. Il bottone "Cambia foto" è già presente visivamente in modifica profilo.

## Aggiornamenti sessione 4 (2026-05-18)

### Pagina Profilo connessa al DB

- **`src/app/(app)/profilo/page.tsx`** refactored a Server Component: chiama `requireOnboardedSession()`, poi `Promise.all` con 4 query parallele (dati utente + count sightings approvati + count follower + count seguiti).
- **`src/app/(app)/profilo/_components/profilo-client.tsx`** nuovo Client Component che riceve i dati come props e gestisce avatar loading state, swipe tabs, interazioni.
- **Pattern Server/Client split:** quando una pagina ha dati DB + interazioni, il Server Component fa il fetch e passa props al Client Component. Seguire questo pattern per le altre pagine.
- **`AvatarFallback` con iniziali:** nickname a 2+ parole → prima lettera di ogni parola (es. "Davide Marsili" → "DM"); altrimenti prime 2 lettere. Gestito con `split(/\s+/)`.
- **`(app)/layout.tsx`** ora async: chiama `requireOnboardedSession()` e passa `username` come prop ad `AppHeader`, così `ProfiloHeader` mostra lo `@username` reale invece di un valore hardcoded.

### Convenzioni aggiuntive

- **Dati sessione in Client Components dell'header:** passare come prop dal layout Server Component, non usare `useSession()` — evita di aggiungere `SessionProvider`. Rivalutare se altri componenti client avranno bisogno della sessione in futuro.
- **Conteggio avvistamenti:** usa solo `moderationStatus = 'approved'` e `deletedAt IS NULL` per il badge pubblico sul profilo.

## Aggiornamenti sessione 6 (2026-05-23)

### Flow scatto completato (Fasi A–D)

- **`src/lib/r2.ts`** — client S3 per Cloudflare R2. Usa `@aws-sdk/client-s3` (già in `package.json`). Credenziali via env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
- **`src/app/(app)/scatta/actions.ts`** — due server actions:
  - `getUploadUrls()`: genera due presigned PUT URL (foto originale + thumbnail, scadenza 5 min)
  - `publishSighting()`: valida, calcola fuzzed coords con `fuzzCoordinates()`, inserisce in DB con `makePoint()` per entrambe le geography column
- **Upload pattern:** presigned URL → PUT diretto da browser a R2, zero payload su server Next.js. `browser-image-compression` per thumbnail 400px lato client.
- **GPS fallback desktop:** se GPS non disponibile, mappa centrata su Roma (41.9028, 12.4964), pin libero senza restrizione 50m. `PositionMap` accetta `restrictToOrigin?: boolean` (default `true`). In produzione il flusso da desktop sarà disabilitato del tutto.
- **`tag_colors` allineamento:** il form usava `'grey'`, lo schema DB usa `'gray'` — allineati su `'gray'`.
- **Camera stream:** aggiunto listener `visibilitychange` in `CameraStep` per fermare lo stream immediatamente quando la pagina va in background (previene spia fotocamera accesa dopo navigazione).

### Avatar upload con crop

- **`avatar-crop-modal.tsx`** — modal fullscreen con `react-easy-crop` (già installato). Crop circolare 1:1, canvas resize a 400×400 JPEG. Pattern `onConfirm(blob)` / `onCancel()`.
- **`modifica/actions.ts`** aggiunte: `getAvatarUploadUrl()` (key fisso `avatars/{userId}.jpg`) e `saveAvatarUrl()` (update `users.avatar_url` + enqueue vecchio file in `r2_cleanup_queue`).
- **`ModificaClient`:** file input nascosto triggerato dal tap sull'avatar, spinner Loader2 sull'overlay fotocamera durante upload, aggiornamento ottimistico del preview post-upload.

### Profilo — griglia post

- **`profilo/page.tsx`:** query aggiuntiva per ultimi 60 sighting approvati; URL thumbnail costruiti server-side (`${R2_PUBLIC_URL}/${key}`).
- **`ProfiloClient`:** griglia 3 colonne `aspect-square` stile Instagram. `ThumbImage` (componente interno) mostra `Skeleton` durante il caricamento poi fade-in `opacity`.

### Componenti aggiornati

- **`ImageLightbox`:** prop `circle?: boolean` — quando `true` mostra l'immagine come cerchio 64×64 (ideale per preview foto profilo). Default `false` (rettangolo `rounded-lg`).
- **`alert.tsx`:** variante `destructive` usa `bg-destructive/10` invece di `bg-card` per maggiore visibilità.

### Roadmap aggiornata

```text
7. ✅ Flow scatto: camera → form → R2 upload → DB save (AI verify e palette: rimandati)
5d. ✅ Avatar upload con crop
5e. ✅ Griglia post nel profilo (thumbnail da R2)
```

### Debiti tecnici e TODO aperti

- **AI verify (TF.js + COCO-SSD):** saltato per ora, tutti i post vanno in `approved` direttamente. Da implementare in Fase B.
- **Palette colori (node-vibrant):** `extractedPalette` salvato come array vuoto `[]`. Da popolare lato client al momento della pubblicazione.
- **Desktop lock `/scatta`:** in produzione questa route dovrà essere inaccessibile da desktop (o mostrare un messaggio). Da aggiungere prima del lancio.
- **Cron job R2 cleanup:** `r2_cleanup_queue` viene popolata correttamente (vecchi avatar), ma il job notturno Vercel non è ancora implementato.
- **`getAvatarUploadUrl` key fissa:** usa `avatars/{userId}.jpg` — sovrascrive sempre la stessa chiave R2. Questo significa che il vecchio file viene sovrascritto prima che il cleanup sia eseguito. Funziona, ma la cleanup queue accumula entry inutili. Soluzione futura: usare un UUID nel key e affidarsi interamente alla cleanup queue.

### Convenzioni aggiornate

- **R2 upload:** usare sempre il pattern presigned URL (server action genera URL → client fa PUT direttamente). Mai passare file binari attraverso server actions/API routes.
- **URL R2 pubblici:** costruire sempre server-side come `${process.env.R2_PUBLIC_URL}/${key}` e passarli come prop al client. Mai esporre `R2_PUBLIC_URL` come `NEXT_PUBLIC_`.
- **`ThumbImage`:** quando serve un'immagine con skeleton di caricamento in una lista/griglia, usare il pattern componente locale con `useState(false)` + `onLoad` + `Skeleton` overlay.
