# CatSee — Known Bugs

Bug confermati, non ancora risolti. Per ogni bug: contesto, sintomi, cause investigate, tentativi falliti.

---

## KB-001 — Bottone "X" della searchbar non appare su mobile

**Schermata:** `/cerca`
**Priorità:** media (funzionalità degradata, non bloccante)
**Ambiente:** Android Chrome (confermato); iOS non testato
**Stato:** ✅ RISOLTO — causa radice era l'ambiente di test, non il codice

### Sintomi originali

Nella barra di ricerca della schermata Cerca, digitando sulla tastiera mobile i caratteri compaiono nell'input ma il bottone X per svuotare il campo non appare mai. Su desktop il comportamento è corretto.

### Causa radice (scoperta)

Il problema non era nel codice della searchbar. Quando il dev server Next.js veniva raggiunto tramite IP di rete locale (`192.168.x.x:3000`) invece di `localhost`, il WebSocket per l'HMR falliva con `ERR_INVALID_HTTP_RESPONSE` durante l'handshake. Questo WebSocket viene aperto **dentro la chiamata `hydrate()` di React** (stack: `web-socket.ts → app-index.tsx → hydrate`): il fallimento impediva il completamento dell'idratazione, quindi **nessun event handler veniva mai attaccato al DOM**. L'app era visivamente funzionante (SSR) ma completamente non interattiva.

Tutti i tentativi di debug elencati sotto erano stati eseguiti in questo ambiente rotto — i test erano invalidi perché il problema non era mai la searchbar.

### Tentativi precedenti (invalidati)

1. **Input controllato + `onChange` React** — non aggiornava lo stato su mobile.
2. **`onCompositionEnd`** — aggiunto in parallelo a `onChange`. Non risolveva.
3. **Input non controllato + `onInput` React** — stesso risultato.
4. **Native `addEventListener("input")` nel layout condiviso** — non risolveva.
5. **Native `addEventListener("input")` nella pagina** — debug visivo confermava che `hasText` restava `false`. Interpretato come bug del listener; in realtà era il sintomo dell'idratazione mancante.

### Risoluzione

Accedere al dev server tramite **port forwarding Chrome** (`chrome://inspect → Port forwarding → 3000 → localhost:3000`), così il telefono raggiunge il server via `localhost` e il WebSocket HMR funziona correttamente. In alternativa, usare la versione deployata su **Vercel** (URL HTTPS stabile, nessun problema di WebSocket).

### Note post-risoluzione

Con idratazione corretta (Vercel o port forwarding) la searchbar e il cambio tab funzionano regolarmente. Il bottone X nella searchbar non è stato ritestato in modo esplicito nell'ambiente corretto — da verificare su Vercel prima di considerare il bug definitivamente chiuso a livello di funzionalità.

---

## KB-003 — Profanity filter non applicato su tutti i campi

**Schermata:** globale (tutti i form con input testuale)
**Priorità:** alta (contenuto inappropriato potrebbe passare inosservato)
**Ambiente:** tutti
**Stato:** ⚠️ PARZIALMENTE RISOLTO — leetspeak fixato il 2026-05-21; da auditare i campi futuri

### Contesto

Due problemi scoperti in test manuale (2026-05-21):

1. Il filtro `containsProfanity()` era stato dimenticato sul campo `bio` nella Server Action di modifica profilo.
2. Il filtro non gestiva il leetspeak (es. "P3ne", "c4zzo") per le parole italiane — la regex semplice faceva match solo su testo esatto.

### Fix applicati

- `bio`: aggiunto check in `actions.ts` di modifica profilo.
- Leetspeak: `src/lib/obscenity.ts` riscritto con due matcher separati. Il matcher italiano usa `resolveLeetSpeakTransformer` + `toAsciiLowerCaseTransformer` + `skipNonAlphabeticTransformer`. Il motivo della separazione: `englishRecommendedTransformers` contiene una whitelist che rompe il matching delle parole italiane se i due dataset vengono uniti.

### Stato attuale

- ✅ `username` — controllato (onboarding + modifica profilo)
- ✅ `nickname` — controllato (onboarding + modifica profilo)
- ✅ `bio` — fixato il 2026-05-21
- ⬜ `catName` (nome del gatto nel post) — da implementare quando si sviluppa il flow di scatto
- ⬜ `notes` (note del post) — idem
- ⬜ Qualsiasi altro campo testuale libero aggiunto in futuro

### Azione richiesta

Prima del lancio beta, fare un audit completo di tutte le Server Actions che accettano input testuale e verificare che `containsProfanity()` sia chiamato. Aggiungere un test automatico su `containsProfanity('cazzo')` e altri termini comuni per evitare regressioni.

---

## KB-002 — HMR Next.js rompe la pagina su mobile con port forwarding

**Schermata:** globale
**Priorità:** bassa (impatta solo il workflow di sviluppo mobile, non la produzione)
**Ambiente:** Android Chrome con port forwarding Chrome DevTools
**Stato:** ✅ RISOLTO — usare Vercel per il testing mobile

### Sintomi

Ogni volta che veniva salvato un file durante lo sviluppo, il dev server ricompilava e inviava un aggiornamento HMR via WebSocket. Il browser mobile riceveva il messaggio prima che il router App di Next.js fosse inizializzato, causando:

```text
Uncaught Error: Internal Next.js error: Router action dispatched before initialization.
```

Dopodichè la pagina diventava non responsiva e richiedeva un reload manuale.

### Causa

Race condition tra il WebSocket HMR (che arriva con latenza extra dovuta al port forwarding) e l'inizializzazione del router App di Next.js. Il messaggio di rebuild veniva ricevuto prima che `useActionQueue` fosse pronto, lasciando il router in uno stato inconsistente.

### Soluzione adottata

Usare **Vercel** per il testing mobile: deploy automatico da branch `main` su GitHub, URL HTTPS stabile, HMR non coinvolto (si ricarica manualmente dopo ogni deploy). Per lo sviluppo quotidiano si usa il desktop dove l'HMR funziona perfettamente.
