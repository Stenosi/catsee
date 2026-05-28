# CatSee — Documento di Specifica MVP

> Working title: **CatSee** (placeholder, da rivedere prima del lancio).

**Versione documento:** 0.3 — MVP consolidato
**Data:** 26 aprile 2026
**Status:** Draft

---

## 1. Vision

CatSee è una Progressive Web App che permette agli amanti dei gatti di documentare, condividere e scoprire gatti incontrati per strada. L'utente, durante una passeggiata, scatta una foto autentica del gatto direttamente dall'app (no upload da galleria, in stile BeReal), la geolocalizza e la pubblica su una mappa globale visibile a tutta la community.

L'app combina tre anime:

1. **Diario personale** — tieni traccia dei gatti che incontri nella tua vita.
2. **Social leggero** — segui altri utenti, scopri i loro gatti, reagisci con emoji.
3. **Gamification onesta** — badge, streak e contatori incentivano l'esplorazione, con meccaniche anti-cheating per restare credibili.

Il prodotto è pensato come **PWA web-based** per massimizzare l'accessibilità (no App Store, no Play Store, no costi di pubblicazione, una sola codebase) ma con esperienza mobile-first e installabilità sul telefono.

## 2. Target Users

- **Primario:** amanti dei gatti tra i 18 e i 45 anni che camminano regolarmente in città/quartieri con gatti randagi o di condominio.
- **Secondario:** turisti/viaggiatori che vogliono "collezionare" gatti incontrati nei loro viaggi.
- **Strategia di lancio:** partire dall'Italia (con focus iniziale sulle Marche per testing community piccola e feedback diretto), il prodotto è già tecnicamente predisposto per scalare globalmente.

## 3. Principi di Design

1. **Privacy-first.** Raccogliamo il minimo indispensabile. Le coordinate esatte non sono mai esposte pubblicamente.
2. **Autenticità.** Foto solo da fotocamera live, no upload da galleria.
3. **Wholesome social.** Niente DM, niente commenti testuali liberi (solo reazioni emoji), niente metriche tossiche, niente algoritmi di engagement.
4. **Gamification onesta.** I meccanismi di reward sono progettati per resistere al cheating banale.
5. **Accessibility.** L'app deve essere usabile da chiunque, anche senza account (read-only sulla mappa).
6. **Mobile-first ma desktop-friendly.** Si scatta dal telefono, si esplora la mappa anche da desktop.

## 4. Funzionalità MVP (v1.0)

### 4.1 Autenticazione

- **Login via Magic Link** (email senza password).
- **Login via Google OAuth** come opzione alternativa.
- **Onboarding al primo login:**
  - Username (handle univoco tipo `@mario_rossi`, modificabile raramente).
  - Nickname (display name visibile, modificabile, può contenere emoji).
- **No password gestite da noi** → riduce drasticamente la superficie di attacco e il carico GDPR.
- **Profili tutti pubblici nell'MVP.** I profili privati arrivano in v1.1 (vedi sezione 5).

#### 4.1.1 Policy Username

Per garantire un ambiente safe e prevenire abusi:

- **Restrizioni tecniche:**
  - Solo caratteri ASCII: lettere minuscole/maiuscole, numeri, underscore (`_`), punto (`.`).
  - Lunghezza: 3-30 caratteri.
  - Non può iniziare/finire con punto o underscore.
  - Univoco a livello globale (case-insensitive).
- **Blocklist parole proibite:** integrazione di librerie open source (`obscenity` o `bad-words` con dizionario italiano + inglese) per filtrare:
  - Insulti, slur, parole offensive.
  - Riferimenti sessuali espliciti.
  - Parole riservate (`admin`, `support`, `moderator`, `staff`, `official`, `catsee*`).
  - Pattern di impersonificazione (es. `@admin_*`, `@official_*`).
- **Review post-segnalazione:** se un username sfugge alla blocklist ma viene segnalato dagli utenti, l'admin ha la facoltà di forzare il cambio username con notifica all'utente.
- **Stessi controlli sul nickname** (display name) ma con regole più permissive (può contenere spazi, emoji, accenti).

### 4.2 Scatto Foto (core flow)

1. L'utente apre l'app e clicca il bottone centrale "Avvista un gatto" (FAB grosso, ben visibile).
2. L'app richiede (se non già concessi) i permessi di **fotocamera** e **geolocalizzazione**.
3. Si apre la fotocamera in-app (no accesso galleria). Vista frontale e posteriore selezionabili.
4. L'utente scatta. Vede preview con opzione "rifai" o "continua".
5. Schermata di compilazione post:
   - **Nickname del gatto** (opzionale, libero, max 30 caratteri). Esempi: "Re Magio", "Stronzetto", "Garfield del Bar".
   - **Tag colore/pattern** (selezione multipla): Nero, Bianco, Tigrato, Rosso/Arancione, Calico, Smoking, Siamese, Grigio, Altro. **Pre-suggeriti automaticamente** dalla palette estratta dalla foto (l'utente conferma o modifica).
   - **Tag pelo:** Corto, Lungo.
   - **Note** (opzionale, max 200 caratteri).
   - **Posizione:** automaticamente catturata. L'utente vede un piccolo pin sulla mappa con possibilità di aggiustare di poco la posizione.
   - **Nota MVP:** la classificazione `cat_type` (randagio/comunitario/domestico) è gestita silenziosamente nel DB con default `stray` per tutti i post, senza esporla all'utente. Sarà introdotta come campo visibile in v2 insieme al sistema XP.
6. **Verifica AI client-side** (TensorFlow.js + COCO-SSD): all'invio, l'app analizza la foto e verifica la presenza di un gatto.
   - Se OK → pubblicazione immediata.
   - Se NO → messaggio "Non vediamo un gatto. Vuoi inviare comunque per revisione manuale?" → entra in coda moderazione admin.
7. **Estrazione palette colori** client-side (libreria `node-vibrant` o `colorthief`): genera 3-5 colori dominanti, salvati nel post per uso successivo (filtri, badge, eventuale icona generativa in v2).
8. **EXIF stripping:** rimozione completa dei metadati EXIF prima dell'upload (geolocalizzazione embedded, modello fotocamera, ecc.).
9. **Pubblicazione.**

### 4.3 Gestione Privacy Coordinate

- Al primo post (o nel profilo, modificabile in qualsiasi momento) l'utente sceglie:
  - **Posizione approssimata** (default, raggio ~100m, fuzzing applicato server-side).
  - **Posizione esatta** (opt-in esplicito con conferma di aver letto un'avvertenza).
- **Nel database** salviamo sempre le coordinate vere (encryption at-rest).
- **Via API pubblica** esponiamo solo le coordinate fuzzate (a meno che l'utente abbia scelto "esatta").
- Le coordinate vere sono visibili **solo all'autore** del post nella sua mappa privata.
- **Senza permessi GPS:** l'utente può navigare la mappa e reagire ai post, ma **non può pubblicare**.

### 4.4 Mappa Globale

- Mappa basata su **Leaflet + OpenStreetMap** (gratis, illimitata, no API key).
- Visualizzazione pin/cluster dei gatti avvistati (clustering automatico via `leaflet.markercluster`).
- **Zoom iniziale:** centrato sulla posizione corrente dell'utente (se permessi GPS attivi) con zoom medio sulla città/zona. Senza permessi: vista default su Italia.
- Zoom out progressivo fino a vista mondo intero.
- Click su un pin → preview della foto + nickname gatto + autore + data.
- Click su preview → pagina di dettaglio del post.
- **Filtri MVP:**
  - Per data (ultimi 7 giorni / 30 giorni / sempre).
  - Per colore del gatto.
  - Per username specifico.
- Visibile **anche senza login** (incentiva la registrazione).

### 4.5 Ricerca

- **Voce "Cerca" nella bottom navbar** (spostata dall'header: con 4 tab + FAB il FAB non era centrato; aggiungendo Cerca si arriva a 5 slot con FAB al centro geometrico). Accessibile direttamente come tab principale.
- Cerca utenti per username (`@mario_rossi`) o nickname.
- Risultati: lista utenti con avatar, nickname, @username, contatore avvistamenti.
- Click → vai al profilo dell'utente.

### 4.6 Feed Social

- **Pagina home** dopo login: feed cronologico (no algoritmo) dei post degli utenti seguiti + post recenti vicini alla zona attuale (se permessi GPS attivi).
- **Pagina Esplora:** feed globale dei post più recenti.
- Card del post: foto, nickname gatto, autore, tempo relativo, distanza approssimata, tag colori, reazioni emoji.

### 4.7 Profilo Utente

- **Profilo proprio:**
  - Avatar (upload immagine, opzionale).
  - Nickname e @username.
  - Bio (max 150 caratteri).
  - Contatori pubblici: gatti avvistati, follower, following.
  - Lista dei propri post (griglia tipo Instagram).
  - Sezione "I miei gatti su mappa" (mappa privata con coordinate ESATTE, visibile solo a sé stessi).
  - Badge ottenuti (sezione dedicata).
  - Settings: privacy coordinate, gestione notifiche (placeholder, attivazione in v2.1), eliminazione account, logout.
- **Profilo di altri utenti:**
  - Avatar, nickname, @username, bio.
  - Contatori pubblici.
  - Griglia post pubblici.
  - Bottone "Segui / Non seguire più".

### 4.8 Interazione Sociale

- **Reazioni emoji** sui post (set fisso curato: ❤️ 😍 😺 🤩 😂). Ogni utente può reagire con UNA emoji per post (modificabile, tipo Slack).
- **Follow / Unfollow** utenti.
- **NO commenti testuali** all'MVP (riducono complessità di moderazione).
- **NO messaggi privati** (out-of-scope filosofico, non si introdurranno mai).

### 4.9 Condivisione Esterna (nice-to-have MVP)

> Inserita come "stretch goal": se i tempi lo permettono entra in v1.0, altrimenti slitta in v1.2.

- **Bottone "Condividi"** su ogni post di dettaglio.
- Apre il **sheet di condivisione del sistema operativo** (Web Share API), che permette all'utente di condividere il link su Instagram (come storia con link), WhatsApp, Telegram, copiare il link, ecc.
- **Generazione dinamica di immagini OpenGraph** (`@vercel/og`) per la preview del link su social/messaggistica:
  - Foto del gatto.
  - Nickname del gatto + autore.
  - Watermark/logo dell'app.
  - Quando qualcuno incolla `catsee.app/post/abc123` su WhatsApp, vede una bella preview che invoglia a cliccare.

### 4.10 Gamification (versione minima)

- **Contatore gatti avvistati** sul profilo.
- **Anti-cheating MVP:**
  - Verifica AI is-a-cat obbligatoria.
  - Validazione coerenza tag colore con palette estratta (warning soft, non blocca).
- **Badge MVP iniziali:**
  - 🥇 *Primo Gatto* — primo avvistamento.
  - 🐾 *Esploratore* — 5 gatti avvistati.
  - 🎖️ *Cat Hunter* — 10 gatti avvistati.
  - 🏆 *Cat Master* — 50 gatti avvistati.
  - 🔥 *Streak 2 giorni* — avvistamenti in 2 giorni consecutivi.
  - 🔥🔥 *Streak 7 giorni* — avvistamenti in 7 giorni consecutivi.
  - 🌑 *Notturno* — avvistamento tra le 22:00 e le 06:00.
  - 🖤 *Pantera* — 5 gatti neri avvistati.
- I badge sono visibili sul profilo, mostrati con animazione/notifica al momento dell'unlock.

### 4.11 Moderazione

- **Sistema di segnalazione utenti:** ogni post ha un menu "Segnala" con motivazioni (non è un gatto / contenuto inappropriato / spam / altro).
- **Coda di moderazione admin:** post falliti dalla verifica AI o segnalati 3+ volte entrano in coda.
- **Pannello admin minimale** (pagina protetta) per:
  - Visualizzare la coda di moderazione (post + report).
  - Approvare o rimuovere post.
  - Bannare utenti.
  - Forzare cambio username (vedi sezione 4.1.1).
- **Auto-rimozione post:** se 5+ segnalazioni, il post viene auto-nascosto in attesa di review.

## 5. Funzionalità Versioni Future

### v1.1 — "Privacy & Polish" (subito dopo lancio)

- **Pagina profilo pubblico `/profilo/[username]`:** route dinamica che mostra il profilo di qualsiasi utente (avatar, nickname, bio, griglia post approvati). Necessaria per linkare l'autore dal bottom sheet della mappa (avatar+username attualmente non cliccabili — il link è già pronto, manca la destinazione) e da qualsiasi altro punto dell'app che referenzia un utente.

- **Profili privati (filosofia A):**
  - Profilo non visibile pubblicamente (mostra "questo profilo è privato").
  - Le foto restano sulla mappa pubblica come **anonime** (no @username, click sul pin non ricollega all'autore).
  - Le foto **diventano riconducibili al profilo solo per i follower approvati** o se il profilo torna pubblico.
  - Default per nuovi utenti: pubblico.

### v1.1b — "Upload non-live"

- **Upload immagine dalla galleria** come alternativa allo scatto live. L'utente carica una foto esistente invece di scattarla al momento.
  - **Geolocalizzazione manuale:** nessun vincolo GPS — la mappa è libera, il pin può essere posizionato ovunque nel mondo senza restrizione al raggio 50m.
  - **Badge visivo "non live":** i post pubblicati con questo flusso mostrano un indicatore distintivo (es. icona o etichetta) nella card del feed, nella griglia del profilo e nella pagina di dettaglio. Comunica onestà verso la community: la foto non è stata scattata sul momento.
  - **Nessuna verifica AI obbligatoria:** il flusso può passare direttamente in `moderationStatus: 'pending'` (revisione manuale) oppure usare lo stesso hook `useAiVerify` come per lo scatto live.
  - **Anti-cheating:** i post non-live non contribuiscono agli streak giornalieri e non danno XP bonus "primo avvistamento". I contatori badge si aggiornano normalmente.
  - **UX:** nel wizard `/scatta`, aggiungere un'opzione "Carica dalla galleria" accanto al viewfinder. Il flusso successivo (preview → form) è identico allo scatto live, tranne che per la mappa libera e il badge non-live.
  - **Motivazione:** utenti che incontrano un gatto ma non hanno l'app aperta in quel momento; fotografi che hanno già scattato con la fotocamera nativa.
  - **Nota tecnica — distinguibilità live vs non-live:** non è possibile verificare tecnicamente se una foto è stata scattata al momento o caricata dalla galleria. I metadati EXIF (`DateTimeOriginal`) sono falsificabili e spesso strippati. L'unica protezione è il design: due flussi separati nell'app, `isLive` impostato server-side in base al flusso usato, badge non-live visibile alla community. L'onestà è contrattuale (ToS), non tecnica. Vedi anche l'analisi comparativa in `CLAUDE.md` § Camera.

### v1.1b — "Post Browsing contestuale"

- **Navigazione post in-context stile Instagram:** invece di aprire `/post/[id]` come pagina isolata, mostrare una lista scorrevole di post con il post selezionato già visibile. L'utente può scorrere verso il post precedente/successivo senza tornare alla pagina di provenienza.
  - **Contesti pianificati:**
    - **Griglia profilo** (proprio e altrui) — sfogliare i post di un utente in sequenza.
    - **Risultati ricerca "Gatti"** — sfogliare i risultati trovati senza tornare alla lista.
  - **Contesti esclusi (navigazione puntuale resta):** mappa pubblica, mappa del profilo, feed, link diretto/condivisione.
  - **Motivo del rinvio:** richiede virtual scroll, gestione posizione e prefetch non banali. Priorità bassa in MVP dove le griglie hanno pochi post. Da rivalutare quando il volume di contenuti rende la navigazione sequenziale rilevante.

### v1.2 — "Discovery"

- **Filtri mappa avanzati:** per "miei like", raggio km da posizione corrente, orario diurno/notturno, pelo corto/lungo, combinazioni multiple.
- **Heatmap zone:** layer aggiuntivo sulla mappa con densità di avvistamenti (`Leaflet.heat`).
- **Statistiche profilo:** "le tue zone preferite" calcolate via clustering geografico (visibili solo all'utente).
- **Condivisione esterna** (se non già completata in MVP).

### v2.0 — "Identità del Gatto"

- **Schede gatto comunitarie:** wiki dei gatti del quartiere. Gli utenti creano "schede" (es. "Bartolomeo del bar di via Roma") con foto principale + galleria. Quando si fotografa, opzione "linka a un gatto esistente" → ricerca per nome o nelle vicinanze. Schede collaborative (più utenti contribuiscono).
- **Auto-suggerimenti identità:** quando carichi una foto, sistema cerca gatti esistenti entro 50m con tag colore identici → "potrebbe essere questo gatto?" come hint, mai automatico.
- **Classificazione `cat_type` esposta all'utente:** Randagio / Comunitario / Condominio / Domestico, selezionabile in fase di pubblicazione.
- **Sistema XP / Livelli "Esploratore di gatti":**
  - XP per avvistamento (gatti randagi/comunitari).
  - Gatti domestici non danno XP.
  - XP bonus per primo avvistamento di un gatto in una zona.
  - XP penalizzati per cluster geografici troppo ravvicinati (anti farming).
  - Livelli da 1 a 50 con titoli (es. "Curioso" → "Cat Master" → "Cat Whisperer").
- **Anti-cheating rafforzato:** diversità geografica (max N avvistamenti dalla stessa coordinata danno XP), validazione palette ↔ tag.
- **Internazionalizzazione completa:** strutture i18n già pronte dall'MVP, attivazione lingua inglese e altre.

### v2.1 — "Engagement"

- **Notifiche push (Web Push):** preferenze granulari, tutto disattivabile, notifiche tipo:
  - "La tua streak scade tra 3 ore!"
  - "Nuovi gatti avvistati nella tua zona."
  - "@mario_rossi ha iniziato a seguirti."
- **Reazioni estese:** set di emoji più ampio.
- **Badge stagionali:** Halloween (gatti neri), Natale (gatti con sciarpa/cappello), ecc.

### v3.0 — "Community Mature"

- **Classifiche regionali** (per città/regione, opt-in).
- **Eventi community:** "Cat Hunt Day", contest fotografici.
- **Integrazione associazioni protezione animali:** badge per segnalare gatti che sembrano in difficoltà a colonie locali.
- **Modalità colonia felina** per volontari che gestiscono colonie ufficiali.
- **Re-identification ML** dei gatti (se valore percepito > complessità).

### Funzionalità ESCLUSE per scelta filosofica

- **Messaggi privati:** non aggiungono valore, aumentano moderazione e rischio molestie.
- **Commenti testuali:** sostituiti da reazioni emoji per evitare moderazione complessa e tossicità.
- **Algoritmi di engagement:** il feed resta cronologico per scelta etica.
- **Monetizzazione invasiva:** mai pubblicità di terze parti. Eventuale monetizzazione futura solo via donazioni o premium opzionale.

## 6. Stack Tecnologico

### 6.1 Stack scelto

| Layer | Tecnologia | Motivazione |
|---|---|---|
| **Framework** | Next.js 15 (App Router) + React 19 | Standard moderno, SSR per SEO mappa pubblica, ottimo PWA support |
| **Linguaggio** | TypeScript | Type safety, standard di mercato |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Velocità sviluppo, design moderno, accessibile |
| **State** | Zustand + TanStack Query | Leggero, ottimo per data fetching |
| **i18n** | next-intl | Setup fin da subito, attivazione lingue gradata |
| **Mappa** | Leaflet + react-leaflet + leaflet.markercluster | Gratuito, OpenStreetMap, no costi tile |
| **Database** | Neon (PostgreSQL serverless) | Free tier 0.5GB, branching, ottimo per portfolio |
| **ORM** | Drizzle ORM | Type-safe, leggero, alternativa moderna a Prisma |
| **Auth** | Auth.js v5 (NextAuth) | Magic link + Google OAuth out-of-the-box |
| **Storage immagini** | Cloudflare R2 | 10GB gratis, S3-compatible, no egress fees |
| **Image processing** | next/image + Sharp | Ottimizzazione automatica, EXIF stripping |
| **AI is-a-cat** | TensorFlow.js + COCO-SSD | Verifica gratis, gira nel browser |
| **Palette colori** | node-vibrant o colorthief | Estrazione client-side, gratis |
| **OG images** | @vercel/og | Generazione dinamica preview link |
| **Username filtering** | obscenity / bad-words + custom blocklist | Anti-username offensivi |
| **Hosting** | Vercel (free tier) | Deploy automatico da Git |
| **Analytics** | Plausible o Umami self-hosted | GDPR-friendly, niente cookie banner |
| **Error tracking** | Sentry (free tier) | Monitoring errori in produzione |
| **Schema validation** | Zod | Validazione type-safe input/output API |

### 6.2 Considerazioni sicurezza

- HTTPS only ovunque.
- Rate limiting sulle API critiche (login, post, like) tramite middleware (Upstash Ratelimit).
- Sanitizzazione input server-side (Zod schema validation).
- Content Security Policy stretta.
- Encryption at-rest sul database (Neon default).
- Fuzzing coordinate server-side, mai esposizione di lat/lng vere via API pubblica.
- No tracking pixel di terze parti.
- EXIF stripping su tutte le foto prima del salvataggio.

## 7. Modello Dati (high-level)

```
User
├── id (uuid, pk)
├── email (unique)
├── username (unique, immutable post-creazione, validato anti-blocklist)
├── nickname (display name, mutable, validato anti-blocklist)
├── bio (text, max 150)
├── avatar_url (string, nullable)
├── created_at, updated_at
├── settings (jsonb: { precise_location: bool, ... })
├── role (user | admin)

CatSighting (post)
├── id (uuid, pk)
├── user_id (fk → User)
├── photo_url (string, R2 reference)
├── photo_thumbnail_url (string, R2 reference)
├── cat_nickname (string, nullable, max 30)
├── cat_type (enum: 'stray' | 'community' | 'domestic')  ← MVP default 'stray', UI in v2
├── note (text, nullable, max 200)
├── tag_colors (string[]: ['black', 'white', ...])
├── tag_fur (enum: 'short' | 'long')
├── extracted_palette (jsonb: array di {hex, percentage})  ← per badge avanzati v2
├── lat_real, lng_real (float, encryption at-rest)
├── lat_fuzzed, lng_fuzzed (float, esposte via API)
├── created_at
├── ai_verified (bool)
├── moderation_status (enum: pending | approved | rejected)
├── deleted_at (soft delete)

Reaction
├── user_id, post_id (composite pk)
├── emoji (enum: del set fisso scelto)
├── created_at

Follow
├── follower_id, followed_id (composite pk)
├── created_at

Badge
├── id (slug, pk)
├── name, description, icon

UserBadge
├── user_id, badge_id (composite pk)
├── unlocked_at

Report
├── id, post_id, reporter_id, reason, note
├── created_at, resolved_at, resolution
```

## 8. Architettura

```
┌─────────────────────────────────────────────────┐
│  Browser PWA (Next.js client + service worker)  │
│  - Camera API, Geolocation API                  │
│  - TensorFlow.js (verifica is-a-cat)            │
│  - Vibrant.js (palette estrazione)              │
│  - Leaflet map                                  │
└─────────────┬───────────────────────────────────┘
              │ HTTPS
              ▼
┌─────────────────────────────────────────────────┐
│  Vercel Edge / Next.js Server (App Router)      │
│  - Server Components (rendering pages)          │
│  - Server Actions / Route Handlers (API)        │
│  - Auth.js middleware                           │
│  - Rate limiting (Upstash Ratelimit)            │
│  - Drizzle ORM queries                          │
│  - OG image generation                          │
└──────┬──────────────────────────┬───────────────┘
       │                          │
       ▼                          ▼
┌──────────────┐        ┌──────────────────┐
│  Neon DB     │        │  Cloudflare R2   │
│  (PostgreSQL)│        │  (foto + thumb)  │
└──────────────┘        └──────────────────┘
```

## 9. Considerazioni Legali (Italia/UE)

> ⚠️ Sezione da approfondire prima del lancio. Considerare consulenza legale.

- **GDPR:** privacy policy chiara, base giuridica (consenso esplicito), diritto all'oblio (eliminazione account + tutti i post), portabilità dei dati (export JSON).
- **Cookie/Tracking:** preferire analytics cookieless (Plausible/Umami) per evitare cookie banner intrusivi.
- **Età minima:** 14 anni in Italia (art. 2-quinquies Codice Privacy). Da dichiarare in registrazione.
- **Foto come dato personale:** una foto geolocalizzata è dato personale. L'app è titolare del trattamento.
- **Diritti d'autore:** ToS devono specificare licenza non esclusiva concessa dall'utente per la pubblicazione.
- **Persone in foto:** il volto di una persona è dato personale. Policy esplicita: foto con persone identificabili in primo piano sono motivo di rimozione. Considerare blurring automatico (v2, complesso).
- **Termini di servizio:** definire chiaramente cosa è ammesso, processo di moderazione, diritto di rimozione.

## 10. Strategia Portfolio

1. **Repository GitHub pubblico** con README curato (screenshot, demo link, architettura, decisioni tecniche, lessons learned).
2. **Live demo** ben mantenuta su dominio dedicato.
3. **Case study** post-mortem: problema, scelte fatte, errori, miglioramenti. Pubblicabile su Medium/Dev.to/blog personale.
4. **Documentazione tecnica leggibile** (questo doc è il primo passo).
5. **Video demo da 60 secondi** (Loom) — fondamentale per recruiter.
6. **Metriche di utilizzo reale** (anche piccole) aumentano credibilità.
7. **CI/CD pulito** (GitHub Actions, deploy automatici, test) — mostra rigore.
8. **Test automatizzati** sui flow critici (Vitest + Playwright).

## 11. Domande Aperte

Decisioni rimandate da prendere in fasi future:

- Branding completo (nome definitivo, logo, palette colori, tono di voce).
- Wireframe e flow utente dettagliati.
- ✅ Schema DB completo con constraint, indici, PostGIS per query geografiche — risolto nel setup iniziale (2026-05-10), schema pushato su Neon con PostGIS attivo.
- Definizione precisa API endpoints (REST? RSC + Server Actions?).
- Strategia di testing dettagliata.
- Setup repository (struttura cartelle, conventional commits, branching strategy).
- Eventuale monetizzazione futura (donazioni? premium?).
- Internazionalizzazione (quali lingue dopo IT/EN?).

---

## Changelog

- **0.4** (2026-05-10 — post-setup):
  - Schema DB completo pushato su Neon (PostgreSQL 17, regione Europa, PostGIS attivo).
  - Auth.js v5 beta installato con DrizzleAdapter; magic link e Google OAuth prossimo step.
  - shadcn/ui installato con stile **base-nova** (usa `@base-ui/react` come primitive, colori OKLCH).
  - Palette colori **"Ginger Cat"** (primary ambra arancio caldo) applicata in `globals.css`.
  - Font **Plus Jakarta Sans** (variable) per UI; Geist Mono per codice.
  - Token custom `--warning` / `--success` aggiunti oltre allo schema shadcn standard.
  - Sonner sostituisce il componente Toast deprecato di shadcn/ui.
  - React Compiler abilitato.
- **0.3** (2026-04-26):
  - Aggiunta ricerca utenti per username/nickname (sezione 4.5).
  - Aggiunto filtro mappa per username (sezione 4.4).
  - Aggiunta policy Username con blocklist anti-offensivi (sezione 4.1.1).
  - Aggiunta condivisione esterna come "nice-to-have" MVP (sezione 4.9).
  - Aggiunta sezione zoom mappa: avvio sulla zona utente, zoom out fino a mondo intero.
  - `cat_type` rimane nel DB ma defaulta a "stray" e non è esposto in MVP (UI in v2).
  - Profili privati v1.1 chiariti con filosofia A.
  - Aggiunto admin: forzare cambio username.
- **0.2** (2026-04-26):
  - Aggiunti tipo gatto e meccaniche anti-cheating.
  - Reazioni emoji al posto di like.
  - Estrazione palette colori in MVP.
  - Roadmap versioni future strutturata.
- **0.1** (2026-04-26): prima stesura MVP.
