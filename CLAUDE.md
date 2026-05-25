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

### Avatar — rimozione foto profilo

- **`removeAvatar` server action** in `modifica/actions.ts`: imposta `avatar_url = null` + accoda il vecchio file in `r2_cleanup_queue`.
- **UI:** bottone `Button variant="destructive" size="sm"` visibile solo se esiste una foto, avvolto in `AlertDialog` di conferma prima di procedere.
- **`AlertDialog` shadcn** installato (`src/components/ui/alert-dialog.tsx`). Usa `@base-ui/react/alert-dialog` — non supporta `asChild`, usare il pattern `render={<Button ... />}` sul `AlertDialogTrigger` (vedi come `AlertDialogCancel` usa lo stesso pattern).

### Bug risolto — upload avatar su Vercel

L'upload avatar falliva su Vercel (sia mobile che desktop) con errore generico. **Causa:** le variabili d'ambiente R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`) erano presenti solo nel `.env` locale e non erano state aggiunte alle Environment Variables di Vercel. **Soluzione:** aggiungere tutte e 5 le variabili in Vercel → Settings → Environment Variables.

### Debiti tecnici e TODO aperti

- **AI verify (TF.js + COCO-SSD):** saltato per ora, tutti i post vanno in `approved` direttamente. Da implementare in Fase B.
- **Palette colori (node-vibrant):** `extractedPalette` salvato come array vuoto `[]`. Da popolare lato client al momento della pubblicazione.
- **Desktop lock `/scatta`:** in produzione questa route dovrà essere inaccessibile da desktop (o mostrare un messaggio). Da aggiungere prima del lancio.
- ~~**Cron job R2 cleanup**~~ ✅ Risolto — vedi sessione 7b.
- ~~**`getAvatarUploadUrl` key fissa**~~ ✅ Risolto — vedi sessione 7b.

### Convenzioni aggiornate

- **R2 upload:** usare sempre il pattern presigned URL (server action genera URL → client fa PUT direttamente). Mai passare file binari attraverso server actions/API routes.
- **URL R2 pubblici:** costruire sempre server-side come `${process.env.R2_PUBLIC_URL}/${key}` e passarli come prop al client. Mai esporre `R2_PUBLIC_URL` come `NEXT_PUBLIC_`.
- **`ThumbImage`:** quando serve un'immagine con skeleton di caricamento in una lista/griglia, usare il pattern componente locale con `useState(false)` + `onLoad` + `Skeleton` overlay.

## Aggiornamenti sessione 7 (2026-05-25)

### Pagina impostazioni

- **`src/app/(app)/impostazioni/page.tsx`** — Client Component minimale con bottone logout. `AppHeader` già mostra back-arrow su questa route via `BACK_HEADERS`.
- **`src/app/(app)/impostazioni/actions.ts`** — Server Action `signOutAction` che chiama `signOut()` di Auth.js e redirige a `/login`.
- **ProfiloHeader** collegato: tap sull'icona ⚙️ fa `router.push('/impostazioni')`.

### Badge — animazione unlock

- **`src/app/(app)/profilo/badge/_components/badges-client.tsx`** — Client Component che riceve i badge dal Server Component (`badge/page.tsx`) e gestisce l'animazione confetti al primo render dei badge sbloccati (via `canvas-confetti`).
- **`tailwindcss-motion`** installato per animazioni CSS badge.
- **Pattern Server/Client split badge:** `page.tsx` fa le query DB e passa dati come props; `BadgesClient` gestisce animazioni e interazioni.
- **`scripts/dev-unlock-badge.ts`** — script dev-only per sbloccare badge manualmente via CLI (`pnpm tsx scripts/dev-unlock-badge.ts <userId> <badgeSlug>`). Non è parte del prodotto.

### Mappa posizione in /scatta — UX fixed-center pin

- **Pattern adottato:** niente più `<Marker>` draggable. Il pin SVG è un overlay CSS fisso al centro del container (`absolute inset-0 flex items-center justify-center`, `paddingBottom: 36` per ancorare la punta). L'utente sposta la mappa sotto il pin (stile Google Maps / Uber).
- **`CenterTracker`** (componente interno): usa `useMapEvents({ moveend })` per leggere il centro della mappa. Se `restrictToOrigin=true` e il centro supera i 50m dall'origine GPS, fa `map.panTo(snapped, { animate: true })` per riportare la mappa nel raggio.
- **Props rimosse:** `PositionMap` non accetta più `pinLat`/`pinLng` (il pin è sempre al centro, le coordinate vengono aggiornate via `onChange` a ogni `moveend`).
- **Scroll wheel zoom:** abilitato solo su `mouseenter` del container, disabilitato su `mouseleave` (tramite `ScrollWheelOnHover`). Nessun bottone zoom UI.

### Bug fix — ImageLightbox sopra la mappa Leaflet

- **Causa:** Leaflet assegna z-index interni elevati ai propri pane (marker pane = 600, tooltip = 650). Il lightbox con `z-200` finiva sotto.
- **Fix:** `z-1000` su `ImageLightbox` (sopra qualsiasi pane Leaflet).

## Aggiornamenti sessione 8 (2026-05-25)

### AI verify — TensorFlow.js + COCO-SSD

- **`src/app/(app)/scatta/_components/use-ai-verify.ts`** — hook `useAiVerify(imageUrl, enabled)`. Carica `@tensorflow/tfjs` e `@tensorflow-models/coco-ssd` in lazy import (zero bundle cost finché l'utente non arriva al form step). Usa il base model `lite_mobilenet_v2` per bilanciare velocità e accuratezza. Soglia di confidenza: `score >= 0.35`. Restituisce `AiVerifyState: 'idle' | 'loading' | 'cat' | 'no-cat' | 'error'`.
- **`ScattaWizard`** — il hook parte appena l'utente entra nello step form (`enabled: step === 'form'`), in parallelo all'estrazione palette. Il risultato `aiVerifyState` è passato a `FormStep` e usato in `handlePublish`.
- **`FormStep` — indicatore top bar:** badge discreto accanto al titolo "Nuovo avvistamento": spinner "Verifica…" → "Gatto rilevato" (verde, `text-success`) o "In revisione" (ambra, `text-warning`). Non blocca la compilazione del form.
- **`publishSighting` (server action):** accetta ora `aiVerified?: boolean`. Imposta `aiVerified: true` + `moderationStatus: 'approved'` se cat rilevato; `aiVerified: false` + `moderationStatus: 'pending'` altrimenti.
- **Toast post-publish differenziato:** se `approved` → "Avvistamento pubblicato!"; se `pending` → "Avvistamento salvato — in attesa di approvazione." con descrizione estesa (duration 6s).

### Bug fix — form id mancante

- `<form>` in `FormStep` mancava di `id="post-form"`. Il bottone "Pubblica" aveva `form="post-form"` ma funzionava solo tramite l'`onClick` fallback. Aggiunto `id="post-form"` alla form element.

### Debiti tecnici aggiornati

- ~~**AI verify (TF.js + COCO-SSD)**~~ ✅ Implementato — vedi sessione 8.
- ~~**Palette colori (node-vibrant)**~~ ✅ Implementato — vedi sessione 7b.
- **Desktop lock `/scatta`:** da aggiungere prima del lancio.
- **Redirect post-pubblicazione:** valutare se mandare a `/profilo` o al post/feed dopo publish (attualmente `/profilo` come placeholder MVP).

### Convenzioni aggiornate

- **`useAiVerify`:** quando serve verifica AI in un wizard, usare questo hook. Non caricare TF.js a livello di modulo — il lazy import nel hook garantisce che il bundle pesante arrivi solo quando necessario.
- **`AiVerifyState`:** il tipo è esportato da `use-ai-verify.ts` e usato da `FormStep` per il badge UI. Se in futuro si aggiungono altri modelli o logica, modificare solo il hook senza toccare i componenti.

## Aggiornamenti sessione 9 (2026-05-25)

### Loading screen AI verify

- **`src/app/(app)/scatta/_components/ai-loading-step.tsx`** — schermata di attesa fullscreen mostrata mentre COCO-SSD carica. Sfondo `bg-background` (coerente con il form step che segue). Icona `PawPrint` (lucide-react) in `text-primary` con doppio cerchio `bg-primary/8` e `bg-primary/15` in pulsazione sfasata (`motion-preset-pulse`, durate 2200ms / 1400ms). Container icona esplicito `w-32 h-32` per evitare che i cerchi `absolute` invadano il gap verso il testo. Testo rotante ogni 1700ms con fade opacity 300ms, frasi solo cat-related.
- **Comportamento:** la loading screen appare ogni volta che si entra nello step form (`aiVerifyState === 'idle' || aiVerifyState === 'loading'`). Quando l'AI termina, `FormStep` fa mount con `motion-preset-fade motion-duration-400`.
- **Singleton modello:** in `use-ai-verify.ts`, variabile module-level `cachedModel: ObjectDetection | null`. Dal secondo avvistamento della stessa sessione il modello è già in memoria → il download non si ripete, solo l'inferenza (~200-300ms).

### Colori gatto — semplificazione

- **`TAG_COLORS` (schema)** e **`CAT_COLORS` (UI)** allineati alla nuova lista: `black`, `white`, `gray`, `orange`, `brown`, `tabby`, `other`. Rimossi `calico`, `tuxedo`, `siamese` (categorie miste pattern/razza non intuitive per utente casual).
- **Filosofia:** bicolore e tricolore emergono dalla selezione multipla (max 3 colori), non servono tag dedicati.
- **`matchToCatColor` semplificato:** acromatici → `gray`; tonalità calde chiare (`s>=40, l>58`) → `orange`; tonalità calde scure (`s>=20, l>=20`) → `brown`. `tabby` e `other` solo selezione manuale, non auto-suggeriti dalla palette.
- **Nessuna migration DB:** `tag_colors` è `text[]` libero, non un enum PostgreSQL vincolato.
- **Dot "Altro":** pallino con `border: 1.5px dashed #6b7280` e sfondo trasparente invece di fill solido. Implementato con flag `dashed: true` nell'array `CAT_COLORS` e stile inline condizionale.

### Desktop detection — skip GPS

- **`ScattaWizard`:** all'avvio, controlla `navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches`. Se nessun touch point (desktop) → `setIsDesktop(true)` e skip totale della geolocalizzazione.
- **`FormStep`:** riceve `isDesktop?: boolean`. Se `true`, salta lo spinner "Ricerca posizione GPS…" e carica la mappa immediatamente sul fallback (Roma). Testo descrittivo sotto la mappa adattato ("modalità desktop, GPS non disponibile").

### Debiti tecnici aggiornati

- **Desktop lock `/scatta`:** da aggiungere prima del lancio (la route è accessibile da desktop).
- **Redirect post-pubblicazione:** valutare se mandare a `/profilo` o al post/feed (attualmente `/profilo`).
- **Loading screen al secondo scatto:** con modello già in cache JS, la schermata appare per ~200-300ms (solo inferenza). Accettabile per ora.
- **Pannello admin moderazione:** i post in `pending` non hanno UI per essere approvati/rifiutati.

### Convenzioni aggiornate

- **Desktop detection:** usare `navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches` per distinguere touch (mobile/tablet) da desktop. Non usare user-agent.
- **Loading screen pattern:** quando un'operazione pesante precede un form, usare il pattern `aiVerifyState === 'idle' || aiVerifyState === 'loading' ? <LoadingStep /> : <FormStep />` con fade-in sul mount del form via `motion-preset-fade`.

## Aggiornamenti sessione 10 (2026-05-25)

### Mappa pubblica `/mappa` — implementazione completa

- **`src/app/(app)/mappa/actions.ts`** — Server Action pubblica `fetchMapSightings()`. Query sightings JOIN users, filtrata su `approved + public + deletedAt IS NULL`, LIMIT 500, ORDER BY createdAt DESC. `thumbnailUrl` costruito server-side (`${R2_PUBLIC_URL}/${photoThumbnailKey}`). Nessuna autenticazione richiesta.
- **`src/app/(app)/mappa/page.tsx`** — Server Component async: chiama `fetchMapSightings()`, passa risultato a `<MapView>`. Wrapper `relative h-full w-full overflow-hidden`.
- **`src/app/(app)/mappa/_components/map-view.tsx`** — Client Component con `next/dynamic ssr:false` wrapping `MapInner`. Loading fallback con testo "Caricamento mappa…".
- **`src/app/(app)/mappa/_components/map-inner.tsx`** — Componente principale Leaflet:
  - Import CSS in ordine: `leaflet.css` → `MarkerCluster.css` → `MarkerCluster.Default.css`
  - `createCatPin()`: `L.divIcon` con `className: ''` (critico), img circolare 44×44px con bordo amber e box-shadow
  - `CatMarkerCluster`: `useMap()` + `useEffect`, cluster via `(L as unknown as ...).markerClusterGroup`, cerchio amber con count, cleanup `map.removeLayer`
  - `InitialPosition`: GPS flyTo al mount (una sola volta), notifica padre via `onLocated`
  - `MapFlyToBinder`: espone `flyToRef` al padre per consentire il FAB di richiamare `map.flyTo` dall'esterno di `MapContainer`
  - `ViewportEmptyChecker`: `useMapEvents({ moveend, zoomend })`, controlla se qualche sighting è nel bounds
  - FAB recenter: fuori da `MapContainer` ma sovrapposto (`absolute bottom-20 right-4 z-900`), usa `flyToRef.current`
  - Empty state pill: `absolute inset-x-0 top-4 z-900 pointer-events-none`
- **`src/app/(app)/mappa/_components/sighting-sheet.tsx`** — Bottom sheet CSS custom:
  - Backdrop `z-1001` con opacity transition
  - Panel `z-1002` con `transform: translateY(0/100%)` transition 300ms
  - Contenuto: foto 4:3, nickname, @username, data (Intl.DateTimeFormat it-IT), color pills, CTA disabilitato
  - `pb-[calc(env(safe-area-inset-bottom)+1.5rem)]` per safe area

### Roadmap aggiornata (sessione 10)

```text
6. ✅ Mappa pubblica con pin, clustering e bottom sheet preview
```

### Debiti tecnici aggiornati (sessione 10)

- ~~**Redirect post-pubblicazione**~~ ✅ — redirect a `/feed` dopo publish.
- **Desktop lock `/scatta`:** da aggiungere prima del lancio.
- **Pannello admin moderazione:** i post in `pending` non hanno UI per essere approvati/rifiutati.
- **Profilo pubblico `/profilo/[username]`:** il blocco avatar+username nel bottom sheet della mappa è già pronto visivamente ma non è cliccabile — manca la route destinazione. Da implementare in v1.1 insieme ai profili privati.
- **Tile layer dark mode:** light mode usa `Stadia.AlidadeSmooth`, dark mode dovrà usare `Stadia.AlidadeSmoothDark` (`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png`). Il commento è già nel codice in `map-inner.tsx` e `profile-map-inner.tsx`.
- **Pin cliccabili → dettaglio post:** nella mappa profilo il tap su un pin mostra un toast "prossimamente". Da collegare a `/post/[id]` (route non ancora implementata) quando sarà disponibile.
- **Logo CatSee:** attualmente si usa l'icona Lucide `Cat` su sfondo amber come placeholder in tutte le icone PWA (favicon, apple-icon, manifest 192/512). Va sostituito con un logo vettoriale definitivo prima del lancio. Il logo deve essere quadrato con ~10-15% padding interno; esportare PNG 192×192, 512×512 (anche maskable), 180×180, 32×32. Verificare il maskable su maskable.app/editor. Quando pronto, sostituire i file `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/icon-192/route.tsx`, `src/app/icon-512/route.tsx`.

### Pattern architetturali mappa

- **FAB fuori da MapContainer:** il bottone visivo vive nel wrapper div. Il hook `MapFlyToBinder` (dentro `MapContainer`) scrive un `flyToRef` che il FAB esterno chiama. Evita problemi con i componenti react-leaflet che si aspettano un contesto Leaflet.
- **`className: ''` su `L.divIcon`:** obbligatorio — senza di esso Leaflet aggiunge bordi bianchi ai marker custom.
- **`(L as unknown as ...).markerClusterGroup`:** typescript cast necessario perché `@types/leaflet.markercluster` estende `L` come side-effect, non come tipo esplicito.

## Aggiornamenti sessione 11 (2026-05-25)

### Fix z-index navbar vs mappa Leaflet

- **`relative` su `<nav>` e `<header>`:** senza `position` esplicita il `z-index` di Tailwind non crea uno stacking context e viene ignorato dal browser. Aggiunto `relative` a entrambi.
- **`isolate` su `<main>`** (`src/app/(app)/layout.tsx`): crea uno stacking context che contiene tutti i z-index interni di Leaflet (fino a 600+), impedendo loro di uscire sopra navbar e header. Regola generale: qualsiasi pagina con Leaflet deve avere il suo container con `isolate`.
- **`createPortal(…, document.body)` su `SightingSheet`:** il portal sposta il DOM del sheet fuori da `<main isolate>`, mettendolo nel root stacking context. Necessario per tutti i componenti `fixed` (modal, sheet, toast) che devono sovrapporsi alla navbar — se vivono dentro un elemento `isolate`, nessun z-index li farebbe uscire.

### Bottom sheet — UX miglioramenti

- **Swipe-to-close:** pointer events sul panel, `setPointerCapture` per catturare il move anche fuori dal panel, soglia 80px, snap-back se non raggiunta. Il backdrop si schiarisce proporzionalmente al drag (`opacity: 1 - dragY / 200`).
- **`select-none` sul panel + `draggable={false}` sulle immagini:** previene la selezione di testo e il drag nativo del browser durante lo swipe.
- **Profilo utente nel sheet:** avatar circolare 24px + username (senza @) in cima al blocco info. Avatar con fallback alle prime 2 lettere dell'username su sfondo `primary/20`. `avatarUrl` aggiunto alla query `fetchMapSightings` e al tipo `MapSighting`.

### Navigazione

- **Logo CatSee → `<Link href="/feed">`:** sostituisce il `<button onClick(router.push)>` precedente per avere prefetch automatico della route.
