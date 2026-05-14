# CatSee — Wireframes (Mobile MVP)

**Versione:** 0.2 — feedback iterazione 1
**Companion document:** `SPEC.md` v0.3
**Target:** mobile, viewport 375-430px (iPhone/Android moderni)
**Tema:** solo chiaro per MVP, codice dark-mode-ready
**Approccio:** code-first (no Figma per ora — il developer è più rapido in codice)

---

## Convenzioni di lettura

```
┌──────┐   bordi schermo / contenitori
│      │
├──────┤   separatori
[btn]      bottone
{icon}     icona
"text"     testo statico (label, headline)
<input>    campo input
( )        radio / toggle
[ ]        checkbox
…          contenuto ripetibile (lista)
```

Per ogni schermata: **Scopo · Layout · Componenti · Comportamenti · Edge cases**.

---

## 0. Pattern globali

### 0.1 Tipografia e palette

→ Vedi `docs/DESIGN_SYSTEM.md` per font, scala tipografica, token colore OKLCH, linee guida d'uso e note dark mode.

Riepilogo per navigare i wireframe:

- Testi secondari/meta: `text-sm text-muted-foreground`
- Azioni primarie (FAB, "Pubblica"): `bg-primary text-primary-foreground`
- Feedback negativi: `bg-destructive`, `bg-warning`
- Feedback positivi: `bg-success`

### 0.2 Layout di base (post-login)

```
┌──────────────────────────┐
│  HEADER (variabile)      │  ← 56px, sticky top, varia per schermata
├──────────────────────────┤
│                          │
│  CONTENT                 │  ← scrollable
│                          │
├──────────────────────────┤
│  BOTTOM NAVBAR           │  ← 64px, sticky bottom
└──────────────────────────┘
```

### 0.4 Bottom Navbar — versione MVP (5 voci)

**Decisione:** 5 voci. La distinzione Home/Esplora rischiava di sovrapporsi, quindi Feed rimane una voce unica con tab interne. La **Ricerca** è spostata dall'header alla navbar (era accessibile da header variante A), portando le voci a 5 e permettendo al FAB di stare geometricamente al centro (2 | FAB | 2).

```
┌──────────────────────────────────────────┐
│  {🗺️}   {🏠}   ┌────┐   {🔍}   {👤}   │
│  Mappa   Feed   │ 📷 │   Cerca  Profilo  │
│                 └────┘                   │
└──────────────────────────────────────────┘
```

**Logica delle 5 voci:**
- **Mappa** = visione spaziale dei dati (la lente più caratteristica del prodotto).
- **Feed** = visione temporale dei dati, con tab interne: *Seguiti* / *Esplora* / *Vicini*.
- **Scatta (FAB)** = azione di creazione, sempre al centro, prominente.
- **Cerca** = ricerca utenti per username/nickname; in v1.1 ricerca multi-tipo.
- **Profilo** = il proprio profilo + accesso a settings globali.

**Componenti:**
- 5 voci con icona + label corta sotto (text-xs); il FAB non ha label.
- FAB centrale: più grande, colore primary, sporge ~8px sopra la barra (estetica BeReal/Strava).
- Voce attiva: icona piena + colore primary; voci inattive: outline + grigio.

**Comportamenti:**
- Tap su voce: navigazione immediata, no transizione.
- Tap sul FAB: apre il flow di scatto (mai apre un menu).
- Tap su voce già attiva: scroll-to-top + refresh (pattern Twitter/Instagram).
- La navbar è **nascosta** durante:
  - Flow di scatto (camera fullscreen).
  - Schermate di auth/onboarding.
  - Schermate di dettaglio fullscreen (foto fullscreen).

**Edge cases:**
- FAB Scatta disabilitato visivamente se permessi camera negati: badge rosso "!" + tap mostra modale spiegazione.
- Permessi GPS negati ma camera OK: FAB attivo, ma in fase di pubblicazione si bloccherà con messaggio.

### 0.5 Header — varianti per schermata

Header alto 56px, sticky, sfondo background.

**Variante A — Mappa / Feed (solo logo):**
```
┌──────────────────────────┐
│ {logo}                   │
└──────────────────────────┘
```
La ricerca non è più nell'header: è accessibile direttamente dalla voce "Cerca" nella navbar.

**Variante B — Schermata di dettaglio (con back):**
```
┌──────────────────────────┐
│ {<}  Titolo schermata    │
└──────────────────────────┘
```

**Variante C — Profilo proprio:**
```
┌──────────────────────────┐
│  Profilo            {⚙}  │
└──────────────────────────┘
```
L'ingranaggio porta alle impostazioni globali (vedi sezione 4).

**Variante D — Profilo altro utente:**
```
┌──────────────────────────┐
│ {<}  @username      {⋮}  │
└──────────────────────────┘
```
Menu `{⋮}` per: Segnala, Blocca (v1.1).

**Variante E — Cerca (tab principale, no back):**
```
┌──────────────────────────┐
│ <ricerca...>         {x} │
└──────────────────────────┘
```
L'header della schermata Cerca è la search bar stessa, a piena larghezza. `{x}` compare solo se c'è testo e svuota il campo.

### 0.6 Stati globali ricorrenti

- **Loading liste:** skeleton screen via `<Skeleton>` di shadcn/ui (3-5 placeholder animati che simulano la card finale).
- **Loading azioni puntuali:** spinner inline sul bottone (bottone disabilitato + spinner).
- **Empty state:** illustrazione minimale + frase + CTA. Mai un vuoto secco.
- **Error generico:** banner rosso top con messaggio + bottone "riprova".
- **Toast (Sonner):** in basso, sopra la navbar, durata 3s, auto-dismiss. Implementato via `Sonner` (shadcn/ui depreca il proprio `Toast`). Variante info / success / error.

### 0.7 Banner "Installa la PWA" (globale)

**Scopo:** spiegare i vantaggi della PWA e invitare all'installazione, senza essere invasivi.

**Quando mostrarlo:**
- L'utente NON ha ancora installato la PWA.
- È al **secondo** ingresso nell'app (no first-time, l'utente è ancora in onboarding).
- Ha completato almeno **un avvistamento** (è motivato).
- È stato dismissato meno di 3 volte (poi non si mostra più).

**Layout (banner non bloccante, in cima al feed):**
```
┌──────────────────────────┐
│ 💡 Installa CatSee   {x} │
│ App veloce, schermo      │
│ pulito, niente browser.  │
│ [Scopri come]            │
└──────────────────────────┘
```

**Comportamenti:**
- Tap "Scopri come" → schermata 3.6 "Perché installare la PWA".
- Su Chrome/Android: trigger `beforeinstallprompt` evento per installazione 1-tap.
- Su iOS Safari: schermata istruzionale ("Tocca {condividi}, poi Aggiungi alla schermata Home").
- Tap "x": dismiss, salva preferenza in localStorage.

---

## 1. Auth & Onboarding

### 1.1 Welcome / Landing (utente non loggato)

**Scopo:** "vendere" il prodotto in 5 secondi, portare al login.

**Layout:**
```
┌──────────────────────────┐
│                          │
│   ┌──────────────────┐   │
│   │   {hero illustr.} │  │
│   │   Mappa stilizzata│  │
│   │   con pin gatti   │  │
│   └──────────────────┘   │
│                          │
│        {logo}            │
│                          │
│   "Avvista i gatti       │
│    del tuo quartiere"    │
│                          │
│   "Scatta. Mappa.        │
│    Condividi."           │
│                          │
│  [📷 Inizia ad avvistare]│
│                          │
│   [Esplora la mappa →]   │
│                          │
│  ─────────────────────   │
│   Hai già un account?    │
│   [Accedi]               │
└──────────────────────────┘
```

**Componenti:** illustrazione hero in alto, logo, headline, sub-headline, CTA primario "Inizia ad avvistare", CTA secondario testuale "Esplora la mappa", sezione "hai già un account" col link login.

**Comportamenti:**
- "Inizia ad avvistare" → schermata Login (1.2).
- "Esplora la mappa" → mappa in modalità ospite (read-only, navbar limitata: solo Mappa + Login).
- "Accedi" → schermata Login.

**Edge cases:**
- Utente già con sessione attiva: redirect automatico alla home (mai mostrata).

### 1.2 Login

**Scopo:** autenticazione veloce con magic link o Google.

**Layout:**
```
┌──────────────────────────┐
│ {<}                      │
├──────────────────────────┤
│                          │
│  "Bentornato"            │
│  "Inserisci la tua mail" │
│                          │
│  <email>                 │
│                          │
│  [Invia link magico]     │
│                          │
│  ──── oppure ────        │
│                          │
│  [G  Continua con Google]│
│                          │
│                          │
│  Continuando accetti     │
│  i [Termini di servizio] │
│  e la [Privacy policy]   │
└──────────────────────────┘
```

**Componenti:** input email, bottone primario, separatore, bottone Google, **disclaimer testuale legale con link cliccabili** (NO checkbox — pattern moderno conforme GDPR).

**Comportamenti:**
- Validazione email client-side (formato).
- Tap "Invia link magico" → spinner sul bottone → schermata 1.3.
- Tap Google → flow OAuth → al ritorno: nuovo utente → 1.4 onboarding; esistente → home.
- Tap su "Termini di servizio" o "Privacy policy" → apre rispettivamente 4.6.1 / 4.6.2 (in modalità "preview" se non loggato).

**Edge cases:**
- Email non valida: messaggio inline rosso sotto l'input.
- Errore di rete: toast "Errore di connessione, riprova".
- Rate limiting (3+ richieste in 1 minuto): "Troppi tentativi, riprova tra X minuti".

### 1.3 Conferma email inviata

**Scopo:** rassicurare l'utente, fornire fallback.

**Layout:**
```
┌──────────────────────────┐
│ {<}                      │
├──────────────────────────┤
│                          │
│       {📧 illustr.}      │
│                          │
│  "Controlla la tua email"│
│                          │
│  Abbiamo inviato un link │
│  a m***o@example.com     │
│                          │
│  Apri il link da questo  │
│  dispositivo per loggarti│
│                          │
│  Non lo trovi?           │
│  [Reinvia link] (after 30s)│
│                          │
│  [Cambia email]          │
└──────────────────────────┘
```

**Componenti:** illustrazione, titolo, **email parzialmente mascherata** (privacy), istruzioni, bottone reinvio con cooldown 30s, link cambia email.

**Comportamenti:**
- Polling silenzioso ogni 5s per check sessione (UX moderno).
- Bottone reinvio: disabilitato per 30s post-tap, poi attivo.

**Edge cases:**
- Magic link cliccato da altro dispositivo: questo schermo continua polling fino a timeout (5min).
- Magic link scaduto (>15 min): schermata 1.7 "link non valido o scaduto" (vedi sezione 1.7 nuova).

### 1.4 Onboarding — Username & Nickname

**Scopo:** raccogliere identità minima al primo login.

**Step 1 di 2 — Username:**
```
┌──────────────────────────┐
│  ●○                      │
├──────────────────────────┤
│                          │
│  "Crea il tuo username"  │
│                          │
│  @<username>             │
│  ✓ Disponibile           │
│                          │
│  💡 È il tuo handle      │
│     pubblico. Lo cambi   │
│     ogni 30 giorni.      │
│                          │
│  [Continua]              │
└──────────────────────────┘
```

**Step 2 di 2 — Nickname:**
```
┌──────────────────────────┐
│  ●●                      │
├──────────────────────────┤
│                          │
│  "Come vuoi essere       │
│   chiamato?"             │
│                          │
│  <nickname>              │
│                          │
│  💡 Il tuo nome visibile.│
│     Modificabile sempre. │
│     Anche con emoji.     │
│                          │
│  [Inizia ad avvistare]   │
└──────────────────────────┘
```

**Componenti:** progress dots, titolo grande, input con validazione live, **hint contestuale dentro card "💡"** (più gradevole del testo libero).

**Comportamenti:**
- Username: validazione live (debounce 400ms) → disponibile / occupato / non valido / contiene parole non ammesse.
- Pulsante "Continua" disabilitato finché non valido.
- Step 2: nickname obbligatorio, max 30 caratteri.

**Edge cases:**
- Username con parole offensive: messaggio gentile "questo username non è ammesso, prova con un altro".
- Chiusura app a metà: al prossimo accesso riprende dallo step.

### 1.5 Permission Request

**Scopo:** chiedere permessi spiegando il *perché*, in modo non oppressivo.

Mostrata: prima volta che si tocca il FAB Scatta.

**Layout:**
```
┌──────────────────────────┐
│ {x}                      │
├──────────────────────────┤
│                          │
│  "Per avvistare gatti    │
│   ci servono due cose"   │
│                          │
│  ┌────────────────────┐ │
│  │ {📷}               │ │
│  │ Fotocamera         │ │
│  │ Per scattare la    │ │
│  │ foto direttamente  │ │
│  │ in app, garantendo │ │
│  │ autenticità.       │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ {📍}               │ │
│  │ Posizione          │ │
│  │ Per piazzare il    │ │
│  │ gatto sulla mappa. │ │
│  │ Mostrata in modo   │ │
│  │ approssimato.      │ │
│  └────────────────────┘ │
│                          │
│  [Concedi entrambi]      │
│                          │
│  [Magari più tardi]      │
└──────────────────────────┘
```

**Comportamenti:**
- Tap "Concedi entrambi" → trigger sequenziale browser: prima camera, poi GPS.
- Tap "più tardi" → torna alla home, FAB con badge "!".

**Edge cases:**
- Solo camera concessa, no GPS: l'utente può scattare e salvare nel proprio profilo, ma il post **non appare sulla mappa pubblica**. Toast informativo: "Senza GPS, le foto restano private. Concedi GPS per condividere".
- Solo GPS, no camera: blocco totale (non puoi avvistare senza scattare).
- Entrambi negati: schermata 1.5b con istruzioni per riattivare da settings browser.

### 1.6 Permessi negati (1.5b)

**Layout:**
```
┌──────────────────────────┐
│ {<}                      │
├──────────────────────────┤
│                          │
│  "Permessi negati"       │
│                          │
│  Per scattare avvistamenti│
│  servono camera e GPS.   │
│                          │
│  Per riattivarli:        │
│                          │
│  Su iOS Safari:          │
│  Impostazioni > Safari > │
│  Camera/Posizione        │
│                          │
│  Su Chrome Android:      │
│  Tap {🔒} accanto all'URL│
│  > Permessi              │
│                          │
│  [Ho riattivato i permessi]│
│  [Torna alla mappa]      │
└──────────────────────────┘
```

### 1.7 Magic link non valido / scaduto (NUOVA)

**Scopo:** gestire link cliccati troppo tardi o già usati.

**Layout:**
```
┌──────────────────────────┐
│                          │
│       {⏱️ illustr.}       │
│                          │
│  "Link non valido"       │
│                          │
│  Il link che hai cliccato│
│  è scaduto o già usato.  │
│                          │
│  [Richiedi un nuovo link]│
│                          │
└──────────────────────────┘
```

**Comportamenti:**
- Tap "Richiedi nuovo link" → torna a 1.2 Login con email pre-compilata se conosciuta.

---

## 2. Core (5 schermate via navbar)

### 2.1 Feed

**Scopo:** visione temporale dei contenuti, con tre modalità in tab.

**Layout:**
```
┌──────────────────────────┐
│ {logo}                   │  ← header variante A
├──────────────────────────┤
│                          │
│  [Seguiti] [Esplora] [Vicini]│  ← tabs
│                          │
│  ┌──────────────────┐   │
│  │ {avatar} mario_r │   │
│  │            2h fa │   │
│  ├──────────────────┤   │
│  │                  │   │
│  │   [foto gatto]   │   │
│  │                  │   │
│  ├──────────────────┤   │
│  │ "Re Magio"       │   │
│  │ 🖤 Nero  📏 Lungo│   │
│  │ 📍 ~Ancona       │   │
│  │ {❤} 12  {😺} 4   │   │
│  └──────────────────┘   │
│                          │
│  …altri post              │
│                          │
├──────────────────────────┤
│ {nav bar}                │
└──────────────────────────┘
```

**Tab "Seguiti"** (default per utenti che seguono almeno 1 persona):
- Feed cronologico dei post degli utenti seguiti.
- Empty state se non segui nessuno: "Non segui ancora nessuno. Vai a Esplora per scoprire utenti".

**Tab "Esplora":**
- Feed cronologico globale (tutti gli utenti, ordine cronologico, no algoritmo).
- Default per nuovi utenti.

**Tab "Vicini":**
- Solo se permessi GPS attivi.
- Slider per il raggio: 5 / 10 / 25 / 50 km (default 5).
- Senza permessi GPS: prompt richiesta permessi inline, con possibilità di abilitarli.

**Componenti card post:**
- Header card: avatar + nickname (NO @username) + timestamp relativo.
- Foto gatto (rapporto 4:5 o 1:1).
- Nickname gatto (in evidenza, tipo titolo).
- Tag colori + pelo (chip piccoli).
- Posizione approssimata ("~Ancona", o distanza "~500m").
- Reazioni: emoji con counter.

**Comportamenti:**
- Pull-to-refresh in cima.
- Infinite scroll.
- Tap sulla foto → 3.1 dettaglio post.
- Tap su reazione: toggle reazione propria (UNA per utente).
- Tap su autore (avatar o nickname) → 3.2 profilo altro utente.
- Tap su tab già attivo → scroll-to-top + refresh.

**Empty states:**
- Tab Seguiti: "Non segui ancora nessuno. Esplora per trovare gente."
- Tab Vicini: "Nessun gatto avvistato in un raggio di Xkm. Aumenta il raggio o sii il primo!"

**Edge cases:**
- Errore caricamento: banner top + bottone retry, lista cachata non scompare.
- Post in moderazione: non appare nei feed pubblici, l'autore lo vede solo nel proprio profilo con badge "in revisione".

### 2.2 Mappa

**Scopo:** vedere i gatti avvistati nel mondo, geolocalizzati.

**Layout:**
```
┌──────────────────────────┐
│ {logo}                   │  ← header variante A
├──────────────────────────┤
│                          │
│   ┌──────────────────┐   │
│   │  [filtri pill]   │   │
│   │ Data · Colore · @│   │
│   └──────────────────┘   │
│                          │
│  ┌────────────────────┐ │
│  │                    │ │
│  │                    │ │
│  │    [MAPPA]         │ │
│  │      con           │ │
│  │      pin           │ │
│  │      cluster       │ │
│  │                    │ │
│  │                    │ │
│  │           {📍qui} │ │  ← FAB recenter
│  └────────────────────┘ │
│                          │
├──────────────────────────┤
│ {nav bar}                │
└──────────────────────────┘
```

**Componenti:**

- Header: solo logo (variante A — la ricerca è accessibile dalla voce "Cerca" in navbar).
- Riga filtri pill orizzontali: Data, Colore, Username; tap apre bottom sheet con opzioni.
- Mappa Leaflet a pieno schermo.
- FAB "recenter" in basso a destra (sopra navbar).
- Pin singoli: thumbnail circolare (small) della foto.
- Cluster: cerchio con counter (es. "12").

**Comportamenti:**
- Zoom iniziale: posizione utente con zoom medio (livello ~14 city), o Italia se no permessi.
- Tap su pin → bottom sheet preview (foto + nickname + autore + data + bottone "vedi dettaglio").
- Tap su cluster → zoom-in automatico.
- Tap su filtro → bottom sheet con opzioni multi-select.

**Empty state:**
- Nessun pin nell'area visibile: overlay semitrasparente "Nessun gatto avvistato qui. Sii il primo!" + CTA "Scatta".

**Edge cases:**
- Mappa non carica (no internet): placeholder grigio + "Connetti per vedere la mappa".
- Permessi GPS negati: mappa centrata su Italia, FAB recenter mostra modale "abilita GPS".
- Performance: limite ~500 pin caricati nel viewport, fallback a clustering più aggressivo.

### 2.3 Scatta — vedi sezione 5

### 2.4 Profilo (proprio)

**Scopo:** vedere proprio profilo, post, badge, accedere a settings.

**Layout (revisione):**
```
┌──────────────────────────┐
│  Profilo            {⚙}  │  ← header variante C
├──────────────────────────┤
│                          │
│       {avatar}           │
│       Nickname           │
│       @username          │
│       Bio breve qui      │
│                          │
│  ┌────┬─────┬─────┐    │
│  │ 23 │ 145 │  87 │    │
│  │gatti│seguaci│seguiti│  │
│  └────┴─────┴─────┘    │
│                          │
│  [Modifica profilo]      │
│  [📌 I miei gatti su mappa]│
│                          │
│  ── I miei post ──       │
│  ┌────┬────┬────┐       │
│  │ {g1}│ {g2}│ {g3}│       │
│  ├────┼────┼────┤       │
│  │ {g4}│ {g5}│ {g6}│       │
│  └────┴────┴────┘       │
│  …                       │
│                          │
│  ── Badge ──             │
│  {🥇} {🐾} {🌑} {🖤} (+3)│
│                          │
├──────────────────────────┤
│ {nav bar}                │
└──────────────────────────┘
```

**Note sulla revisione layout:**
- I post sono prima dei badge: l'utente che torna sul proprio profilo cerca prima i suoi contenuti.
- Le label dei contatori sono italiane semplici: "gatti", "seguaci", "seguiti".

**Comportamenti:**
- Tap avatar: modale con avatar fullscreen.
- Tap badge: bottom sheet con nome + descrizione + data unlock.
- Tap "{⚙}": apre settings root (4.1).
- Tap "I miei gatti su mappa": vista mappa privata con coordinate ESATTE, visibile solo all'utente.
- Tap contatore "seguaci"/"seguiti": apre 3.3 lista.

**Empty states:**
- Nessun post: card centrale "Non hai ancora avvistato gatti. Inizia ora!" + CTA Scatta.
- Nessun badge: card "Avvista il tuo primo gatto per sbloccare i badge".

---

## 3. Dettagli e secondari

### 3.1 Dettaglio post

**Scopo:** vista completa di un singolo avvistamento.

**Layout:**
```
┌──────────────────────────┐
│ {<}                  {⋮} │
├──────────────────────────┤
│                          │
│   [foto gatto grande]    │
│                          │
│  {avatar} mario_rossi    │
│  2 ore fa                │
│                          │
│  "Re Magio"              │
│                          │
│  🖤 Nero  📏 Lungo       │
│                          │
│  Note (opzionale):       │
│  "Mi ha guardato male    │
│   poi è scappato"        │
│                          │
│  📍 ~Ancona, AN          │
│  ┌────────────────────┐ │
│  │  [mini-mappa]      │ │
│  │   con pin          │ │
│  └────────────────────┘ │
│                          │
│  Reazioni:               │
│  {❤}12 {😍}5 {😺}8       │
│                          │
│  [Reagisci ▼]            │
│                          │
│  [↗ Condividi]           │
└──────────────────────────┘
```

**Decisione MVP — descrizione/note:** **MANTENIAMO** le note nel post, con queste protezioni:
- Max 200 caratteri (limite stretto, riduce rischio tossicità).
- Filtro automatico parole offensive (libreria `obscenity`) → blocco upload se trovate.
- Parole "moderatamente volgari" → asterischi automatici lato server con toggle nel profilo per "Mostra contenuto censurato" (default off).
- Sistema di report già attivo.

**Componenti:** foto fullwidth, autore con timestamp, nickname gatto (se presente), tag chips, note (se presenti), mini-mappa coordinate fuzzed, reazioni con counter, bottone reagisci, bottone condividi.

**Comportamenti:**
- Menu `{⋮}` in alto a destra:
  - Se post di altri: "Segnala", "Copia link".
  - Se post proprio: "Modifica", "Elimina", "Copia link".
- Tap mini-mappa → mappa principale centrata sul pin.
- Tap "Reagisci" → bottom sheet con i 5 emoji (set fisso).
- Tap autore → 3.2 profilo altro utente.
- Tap "Condividi" → Web Share API.

**Modifica post (MVP):**
- Permessa solo per: nickname gatto, tag colori, pelo, note.
- NON permessa per: foto, posizione (sarebbe troppo facile mentire dopo).
- Indicatore "modificato" visibile sul post.

**Edge cases:**
- Post eliminato: "Questo post non è più disponibile" + bottone "Torna indietro".
- Post in moderazione visualizzato dall'autore: banner giallo "In revisione, visibile solo a te".

### 3.2 Profilo altro utente

**Scopo:** vedere profilo e post di un altro utente.

**Layout:** come 2.4 profilo proprio, con queste differenze:
- Header variante D: `{<}` + `@username` + `{⋮}` (Segnala, Blocca v1.1).
- Bottone "Segui / Non seguire più" al posto di "Modifica profilo".
- Niente bottone "I miei gatti su mappa" (privato).

**Comportamenti:**
- Tap "Segui" → toggle istantaneo (optimistic update).
- Tap "Non seguire più" → conferma rapida tramite toast con undo (3s).

**Edge cases:**
- Profilo bloccato (v1.1): mostra "Questo utente ti ha bloccato".
- Profilo privato (v1.1, filosofia A): mostra avatar + nickname + bio + "Profilo privato. Segui per vedere i post." + bottone segui. Le sue foto sono comunque sulla mappa pubblica come anonime.

### 3.3 Lista seguaci / seguiti

**Scopo:** vedere chi segui o chi ti segue.

**Layout:**
```
┌──────────────────────────┐
│ {<}  Seguaci / Seguiti   │
├──────────────────────────┤
│                          │
│  <ricerca nella lista>   │
│                          │
│  ┌──────────────────┐   │
│  │ {av} Mario Rossi │   │
│  │            [Segui]│   │
│  └──────────────────┘   │
│  …                        │
└──────────────────────────┘
```

**Componenti:** header back + titolo, search bar interna, righe utente con avatar + nickname + bottone segui (se non già seguito).

**Note:** mostriamo SOLO il nickname in lista (no @username per evitare ridondanza visiva).

**Comportamenti:** tap su riga → 3.2 profilo. Bottone segui inline.

### 3.4 Cerca (tab navbar — MVP: solo utenti)

**Scopo:** trovare utenti per username/nickname. Accessibile direttamente dalla voce "Cerca" nella bottom navbar — non più come sub-page dell'header.

**MVP:** solo utenti.
**v1.1:** ricerca multi-tipo (utenti / gatti per nickname / location), tab orizzontali stile Instagram.

**Layout MVP:**
```
┌──────────────────────────┐
│ <ricerca...>         {x} │  ← header variante E (search bar a piena larghezza)
├──────────────────────────┤
│                          │
│  Risultati per "mario"   │
│                          │
│  ┌──────────────────┐   │
│  │ {av} Mario Rossi │   │
│  │     @mario_r     │   │
│  │     23 gatti     │   │
│  └──────────────────┘   │
│  …                        │
└──────────────────────────┘
```

**Note MVP:** nei risultati ricerca mostriamo nickname + @username + count gatti, perché serve disambiguare utenti con nickname simili.

**Comportamenti:**
- Ricerca live (debounce 300ms).
- Tap su utente → 3.2 profilo.
- Cancellazione ricerca → schermata "ricerche recenti" (v1.x, MVP vuoto).

**Empty state:** "Nessun utente trovato. Prova con un'altra ricerca."

### 3.5 Dettaglio badge (lista completa)

**Scopo:** vedere tutti i badge ottenuti e quelli da ottenere.

**Layout:**
```
┌──────────────────────────┐
│ {<}  I tuoi badge        │
├──────────────────────────┤
│                          │
│  Ottenuti (4 di 8)       │
│  ┌────┬────┬────┬────┐  │
│  │{🥇}│{🐾}│{🌑}│{🖤}│  │
│  └────┴────┴────┴────┘  │
│                          │
│  Da sbloccare            │
│  ┌────┬────┬────┬────┐  │
│  │{🔒}│{🔒}│{🔒}│{🔒}│  │
│  └────┴────┴────┴────┘  │
└──────────────────────────┘
```

**Comportamenti:**
- Tap su badge ottenuto → bottom sheet "Nome + descrizione + data unlock".
- Tap su badge bloccato → "Nome + come sbloccarlo".

### 3.6 "Perché installare la PWA?" (NUOVA)

**Scopo:** spiegare i vantaggi della PWA, motivare all'installazione.

**Layout:**
```
┌──────────────────────────┐
│ {<}  CatSee come app     │
├──────────────────────────┤
│                          │
│       {🚀 illustr.}      │
│                          │
│  "Installa CatSee sul    │
│   tuo telefono"          │
│                          │
│  ┌────────────────────┐ │
│  │ ⚡ Più veloce      │ │
│  │ Nessun browser da  │ │
│  │ aprire, parte come │ │
│  │ una vera app.      │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ 🎯 Schermo pulito  │ │
│  │ Niente barre URL,  │ │
│  │ più spazio per le  │ │
│  │ foto dei gatti.    │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ 📱 Icona sulla home│ │
│  │ Apri CatSee con un │ │
│  │ tap come ogni app. │ │
│  └────────────────────┘ │
│                          │
│  ┌────────────────────┐ │
│  │ 🔔 Notifiche (v2)  │ │
│  │ Streak, follower,  │ │
│  │ gatti vicini.      │ │
│  └────────────────────┘ │
│                          │
│  Come installare:        │
│  [Su Android] [Su iOS]   │
│                          │
└──────────────────────────┘
```

**Comportamenti:**
- Tap "Su Android" → istruzioni con screenshot del flow Chrome (banner installazione).
- Tap "Su iOS" → istruzioni passo-passo: tocca {condividi}, scorri, tocca "Aggiungi a Home".
- Se Chrome ha già emesso `beforeinstallprompt`, mostra subito un bottone "Installa ora" (1-tap).

---

## 4. Settings (raggiungibili da {⚙} sul profilo)

### 4.1 Settings root

```
┌──────────────────────────┐
│ {<}  Impostazioni        │
├──────────────────────────┤
│                          │
│  Account                 │
│  > Modifica profilo      │
│  > Email                 │
│                          │
│  Privacy                 │
│  > Coordinate posizione  │
│  > Profilo privato (v1.1)│
│                          │
│  Notifiche               │
│  > Gestisci notifiche    │
│   (placeholder MVP)      │
│                          │
│  App                     │
│  > Lingua                │
│  > Tema (post-MVP)       │
│  > Installa come PWA     │
│  > Versione: 0.1.0       │
│                          │
│  Legale                  │
│  > Termini di servizio   │
│  > Privacy policy        │
│                          │
│  ───────                 │
│  [Esci]                  │
│  [Elimina account]       │
└──────────────────────────┘
```

**Nota:** ho aggiunto link "Installa come PWA" in sezione App che porta a 3.6.

### 4.2 Modifica profilo

**Layout:**
```
┌──────────────────────────┐
│ {<}  Modifica profilo {salva}│
├──────────────────────────┤
│                          │
│       {avatar}           │
│   [Cambia foto]          │
│                          │
│  Nickname                │
│  <input>                 │
│                          │
│  Username  @<input>      │
│  Modificabile ogni 30g   │
│                          │
│  Bio                     │
│  <textarea max 150>      │
│                          │
└──────────────────────────┘
```

**Comportamenti:**
- Bottone "salva" disabilitato finché niente è modificato.
- Cambio username: validazione SPEC § 4.1.1; warning "potrai cambiarlo di nuovo solo tra 30 giorni".
- **Cambio avatar:** file picker → schermata 4.2.1 di crop quadrato (in-app, libreria `react-easy-crop`) → upload R2 con loader.

### 4.2.1 Crop avatar (NUOVA)

**Scopo:** consentire crop quadrato in-app stile Instagram.

**Layout:**
```
┌──────────────────────────┐
│ {x}              {Salva} │
├──────────────────────────┤
│                          │
│   ┌──────────────────┐   │
│   │ ┌──────────────┐ │   │
│   │ │              │ │   │
│   │ │  [foto con   │ │   │
│   │ │   overlay    │ │   │
│   │ │   crop]      │ │   │
│   │ │              │ │   │
│   │ └──────────────┘ │   │
│   └──────────────────┘   │
│                          │
│   [zoom slider]          │
│                          │
│   Trascina per spostare  │
│   Pizzica per zoomare    │
└──────────────────────────┘
```

**Comportamenti:**
- Drag per spostare il crop, pinch/slider per zoom.
- Tap "Salva" → upload del crop quadrato a R2 → display in profilo (sempre tondo via CSS).
- Tap "x" → annulla, torna a 4.2 senza modifiche.

**Storage e gestione vecchie foto:**
- Su upload nuovo avatar: salva nuovo file su R2 con UUID nel path, aggiorna `User.avatar_url`.
- Eliminazione vecchia foto: chiamata best-effort dopo conferma DB. Se fallisce, log + job notturno di pulizia.
- Cap risoluzione: avatar 400×400 max, JPEG quality 85, ~30-50KB target. Compressione client-side con `browser-image-compression`.

### 4.3 Privacy — Coordinate posizione

**Layout:**
```
┌──────────────────────────┐
│ {<}  Coordinate          │
├──────────────────────────┤
│                          │
│  Come vuoi mostrare la   │
│  posizione dei tuoi      │
│  avvistamenti?           │
│                          │
│  (●) Approssimata        │
│       Pin spostato di    │
│       ~100m casualmente. │
│       Consigliato.       │
│                          │
│  ( ) Esatta              │
│       Posizione precisa. │
│       ⚠ Visibile a tutti.│
│                          │
│  Si applica solo ai      │
│  NUOVI avvistamenti.     │
│                          │
└──────────────────────────┘
```

**Comportamenti:**
- Tap su "Esatta": modale di conferma esplicita "Sei sicuro? Tutti potranno vedere dove ti trovavi al momento del post".
- Cambio: si applica solo ai post futuri.

### 4.4 Notifiche (placeholder MVP)

```
┌──────────────────────────┐
│ {<}  Notifiche           │
├──────────────────────────┤
│                          │
│       {🔕 illustr.}      │
│                          │
│  Le notifiche arriveranno│
│  in una versione futura. │
│                          │
└──────────────────────────┘
```

### 4.5 Account — Email

```
┌──────────────────────────┐
│ {<}  Email               │
├──────────────────────────┤
│                          │
│  Email attuale:          │
│  mario@example.com       │
│                          │
│  Per cambiarla, inserisci│
│  la nuova:               │
│                          │
│  <new email>             │
│                          │
│  [Invia link di conferma]│
│                          │
│  Riceverai un link sulla │
│  nuova email.            │
│                          │
└──────────────────────────┘
```

### 4.6 Legale (privacy policy / ToS)

**Approccio MVP:** schermate con contenuto markdown renderizzato. Header back + titolo. Il contenuto reale dei testi sarà scritto separatamente con cura, ispirato a template aperti (Termly, iubenda) e tarato sui dati realmente trattati dall'app.

**Sezioni minime privacy policy:**
1. Chi siamo e come contattarci.
2. Dati personali raccolti (lista esplicita: email, username, foto, coordinate vere e fuzzed, IP login, user agent).
3. Per ogni dato: finalità, base giuridica GDPR, periodo di conservazione.
4. Terzi che ricevono dati (Vercel, Cloudflare, Neon, providers Auth.js).
5. Diritti dell'utente (accesso, rettifica, cancellazione, portabilità).
6. Come esercitare i diritti.
7. Cookie tecnici (no tracking).
8. Modifiche alla policy.

**Sezioni minime ToS:**
1. Cosa offre il servizio.
2. Età minima 14 anni.
3. Cosa l'utente può/non può fare (no spam, no offese, no contenuti illegali, foto solo di gatti).
4. Licenza concessa all'app sui contenuti caricati (non esclusiva, per pubblicazione).
5. Moderazione e diritto di rimozione.
6. Limitazione responsabilità.
7. Modifiche ai termini.

---

## 5. Flow Scatto Avvistamento (5 step)

Il FAB "Scatta" apre una sequenza fullscreen con la navbar nascosta.

### 5.1 Fotocamera live

**Approccio tecnico:** camera in-app via `navigator.mediaDevices.getUserMedia()`, NON la camera nativa del telefono.

**Motivazione:** la camera nativa salva la foto in galleria. Per garantire il vincolo BeReal-style (no upload da galleria, autenticità) accediamo direttamente al feed video in-app, catturiamo il frame con un canvas, e la foto risultante non passa mai dalla galleria del dispositivo.

**Trade-off:**
- ✅ Autenticità garantita.
- ✅ Stessa codebase su tutti i browser.
- ❌ Niente flash hardware avanzato, niente HDR, niente stabilizzazione hardware.
- ❌ Su iOS Safari richiede HTTPS + gesture utente (non bloccante).

**Layout:**
```
┌──────────────────────────┐
│ {x}              {flip}  │
│                          │
│                          │
│   [VISTA FOTOCAMERA      │
│      LIVE]               │
│                          │
│                          │
│        ┌────┐            │
│        │ ⚪ │            │
│        └────┘            │
└──────────────────────────┘
```

**Componenti:** vista camera fullscreen, X chiudi, flip camera, bottone scatto.

**Comportamenti:**
- Tap scatto → cattura frame → 5.2 preview.
- Tap X → conferma "Annullare l'avvistamento?" → torna a schermata precedente.
- Tap flip → switch frontale/posteriore.

**Edge cases:**
- Camera non disponibile/negata: schermata 1.6 errore con istruzioni.
- Browser troppo vecchio: "Il tuo browser non supporta la fotocamera in-app, prova ad aggiornarlo".

### 5.2 Preview foto

```
┌──────────────────────────┐
│ {<}                      │
├──────────────────────────┤
│                          │
│   [FOTO SCATTATA]        │
│                          │
│                          │
│   [Rifai]   [Continua]   │
│                          │
└──────────────────────────┘
```

**Comportamenti:**
- Tap "Rifai" → torna a 5.1.
- Tap "Continua" → 5.3 verifica AI.

### 5.3 Verifica AI

**Loader:**
```
┌──────────────────────────┐
│                          │
│       {gif gattino}      │
│                          │
│   "Sto cercando un gatto │
│    nella foto..."        │
│                          │
└──────────────────────────┘
```

**Warning se NO gatto:**
```
┌──────────────────────────┐
│ {<}                      │
├──────────────────────────┤
│                          │
│       {🤔 illustr.}      │
│                          │
│   "Mmh, non vediamo un   │
│    gatto in questa foto" │
│                          │
│   Vuoi inviarla comunque?│
│   Sarà revisionata da un │
│   moderatore.            │
│                          │
│   [Rifai foto]           │
│   [Invia per revisione]  │
│                          │
└──────────────────────────┘
```

**Comportamenti:**
- Verifica TF.js client-side: 1-2s tipici, max 5s timeout (in caso: salta e considera "verificata").
- Se OK: passa a 5.4 senza schermata intermedia.
- Se NO: warning, l'utente può rifare o inviare per revisione (post in `moderation_status = 'pending'`).

### 5.4 Compilazione metadati

**Layout:**
```
┌──────────────────────────┐
│ {<}  Avvistamento        │
├──────────────────────────┤
│                          │
│   [thumbnail piccola foto]│
│                          │
│  Come si chiama? *       │
│  <nickname gatto>        │
│  (anche soprannome)      │
│                          │
│  Colori (max 3, suggeriti)│
│  [Rosso ✓] [Bianco ✓]    │
│  [+Nero] [+Tigrato] ...  │
│                          │
│  Pelo                    │
│  (●) Corto  ( ) Lungo    │
│                          │
│  Note (opzionale)        │
│  <textarea max 200>      │
│                          │
│  📍 Posizione            │
│  ┌────────────────────┐ │
│  │  [mini-mappa con   │ │
│  │   pin spostabile]  │ │
│  └────────────────────┘ │
│  Approssimata · cambia ↗ │
│                          │
│  [Pubblica]              │
│                          │
└──────────────────────────┘
```

**Decisioni MVP:**
- **Nickname gatto OBBLIGATORIO** (funge da titolo del post). Anche un soprannome inventato va bene. Hint sotto il campo: "Anche un soprannome o descrizione".
- **Colori: max 3 selezionabili.**
- **Pelo: scelta manuale** (la verifica automatica non è affidabile).
- **Posizione: pin spostabile entro un raggio limitato** (~50m dalla posizione GPS originale). Tentativi di spostamento maggiori → warning "stai modificando troppo la posizione, sei sicuro?". Mai possibile spostare in altro continente.

**Comportamenti:**
- Tag colori: pre-selezionati i top 2-3 dalla palette estratta, l'utente può confermare/aggiungere/togliere.
- Validazione AI palette ↔ tag: warning soft "i colori scelti non sembrano corrispondere alla foto" (non blocca).
- Note: filtro parole offensive lato server, blocco se trovate; parole "moderatamente volgari" → asterischi automatici.
- Link "cambia ↗" → modal privacy coordinate (4.3).
- Tap "Pubblica" → spinner → 5.5.

**Edge cases:**
- Errore upload: toast errore, bottone "riprova" mantenendo i dati.

### 5.5 Successo + eventuali badge

**Post pubblicato:**
```
┌──────────────────────────┐
│                          │
│        {✓ check}         │
│                          │
│   "Avvistamento          │
│    pubblicato!"          │
│                          │
│   [Vedi sulla mappa]     │
│   [Avvista un altro]     │
│                          │
└──────────────────────────┘
```

**Con unlock badge:**
```
┌──────────────────────────┐
│                          │
│   {✨ animazione ✨}     │
│                          │
│   "Hai sbloccato un      │
│    nuovo badge!"         │
│                          │
│       {🥇 grande}        │
│                          │
│   "Primo Gatto"          │
│   Hai pubblicato il tuo  │
│   primo avvistamento.    │
│                          │
│   [Continua]             │
│                          │
└──────────────────────────┘
```

**Comportamenti:**
- Animazione confetti per badge unlock (`canvas-confetti`).
- Più badge unlock contemporanei: schermate sequenziali.
- Dopo l'ultima: 5.5 finale "vedi sulla mappa / avvista altro".

---

## 6. Pannello Admin

**Approccio:** ruolo `admin` gestito tramite campo `User.role = 'admin'`. Promozione iniziale tramite script di seed (`scripts/seed-admin.ts`). Il pannello admin è una rotta protetta `/admin/*` con middleware che verifica `session.user.role === 'admin'`. L'account admin è anche un account utente normale a tutti gli effetti.

### 6.1 Dashboard admin

**Scopo:** overview rapida dello stato del sistema.

**Layout:**
```
┌──────────────────────────┐
│ {<}  Admin               │
├──────────────────────────┤
│                          │
│  Metriche                │
│  ┌──────┬───────┬──────┐│
│  │ 142  │ 1.4k  │  23  ││
│  │utenti│ post  │report││
│  └──────┴───────┴──────┘│
│                          │
│  Coda moderazione        │
│  > Post da revisionare (5)│
│  > Report pendenti (3)   │
│                          │
│  Gestione                │
│  > Lista utenti          │
│  > Lista post            │
│                          │
└──────────────────────────┘
```

### 6.2 Coda moderazione

**Layout:**
```
┌──────────────────────────┐
│ {<}  Moderazione         │
├──────────────────────────┤
│                          │
│  ┌──────────────────┐   │
│  │ [thumb foto]     │   │
│  │ @mario_r · 2h fa │   │
│  │ "Re Magio"       │   │
│  │ Motivo: AI fail  │   │
│  │ [Approva][Rifiuta]│   │
│  └──────────────────┘   │
│  …                        │
└──────────────────────────┘
```

**Comportamenti:**
- Tap su card → vista completa post.
- Approva → `moderation_status = 'approved'`, post diventa pubblico.
- Rifiuta → modale con motivazione + flag opzionale "ban autore" → `moderation_status = 'rejected'`.

### 6.3 Lista utenti

**Layout:**
```
┌──────────────────────────┐
│ {<}  Utenti              │
├──────────────────────────┤
│                          │
│  <ricerca>               │
│                          │
│  [Tutti] [Banditi]       │
│                          │
│  ┌──────────────────┐   │
│  │ {av} Mario Rossi │   │
│  │     @mario_r     │   │
│  │     23 post · ok │   │
│  │  [Forza username][Ban]│
│  └──────────────────┘   │
│  …                        │
└──────────────────────────┘
```

**Comportamenti:**
- Ricerca per username/nickname/email.
- Tap su utente → 3.2 profilo.
- "Forza username": modale con input nuovo username + motivazione → notifica all'utente.
- "Ban": modale conferma → `User.banned = true`, l'utente non può loggarsi.

### 6.4 Lista report

**Scopo:** vedere e gestire le segnalazioni utenti.

**Layout:**
```
┌──────────────────────────┐
│ {<}  Report              │
├──────────────────────────┤
│                          │
│  [Pendenti] [Risolti]    │
│                          │
│  ┌──────────────────┐   │
│  │ Post di @mario_r │   │
│  │ Motivo: spam     │   │
│  │ Da: @luca · 3 segn│   │
│  │ [Vai al post]    │   │
│  │ [Risolvi: ok]    │   │
│  │ [Risolvi: rimuovi]│   │
│  └──────────────────┘   │
│  …                        │
└──────────────────────────┘
```

---

## TODO prossima iterazione

- Stati di errore globali (offline, errore generico, post 404, profilo 404).
- Schermata blocca/segnala utente (in-app, non admin).
- Schermata "Eliminazione account" (conferma + countdown 14 giorni).
- Schermata cookie/consenso GDPR primo accesso (se necessaria — Plausible/Umami sono cookieless, potrebbe non servire).
- Gestione pull-to-refresh dettagliata.
- Animazioni transizione tra schermate (decidere: slide, fade, niente).
- Dialoghi dei filtri mappa con UI dettagliata.
- Bottom sheet di reazione (UI selettore emoji).

---

## Changelog

- **0.3** (2026-05-10 — post-setup):
  - Toast: confermato Sonner come implementazione (nota in sezione 0.6).
- **0.2** (2026-04-27):
  - Bottom navbar a 4 voci (Mappa, Feed, Scatta, Profilo) anziché 5.
  - Feed con tab interne Seguiti / Esplora / Vicini (con range slider).
  - Aggiornato disclaimer ToS/Privacy senza checkbox (compliant GDPR).
  - Mantenuta descrizione/note nei post con filtri parole.
  - Aggiunta schermata "Magic link non valido / scaduto" (1.7).
  - Riorganizzato profilo proprio: post prima dei badge.
  - Mostrato solo nickname in liste seguaci/seguiti (no @username ridondante).
  - Aggiunta schermata 3.6 "Perché installare la PWA".
  - Aggiunto banner globale install PWA (sezione 0.7).
  - Aggiunta schermata 4.2.1 crop avatar in-app.
  - Specificata strategia gestione vecchie foto e cap risoluzione.
  - Aggiunte sezioni 6.1-6.4 pannello admin.
  - Specificato approccio camera in-app (mediaDevices.getUserMedia).
  - Nickname gatto reso obbligatorio (titolo del post).
  - Limite 3 colori, pin spostabile in raggio limitato.
  - Permesso modifica post (limitata: nickname/tag/note, no foto/posizione).
  - Approccio code-first (no Figma per ora).
  - Note sulla moderazione descrizioni con sistema asterischi.
  - Permessi parziali camera-only: post privato sul profilo, no mappa.
- **0.1** (2026-04-26): primo pass.
