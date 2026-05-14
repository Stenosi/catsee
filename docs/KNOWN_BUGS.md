# CatSee — Known Bugs

Bug confermati, non ancora risolti. Per ogni bug: contesto, sintomi, cause investigate, tentativi falliti.

---

## KB-001 — Bottone "X" della searchbar non appare su mobile

**Schermata:** `/cerca`
**Priorità:** media (funzionalità degradata, non bloccante)
**Ambiente:** Android Chrome (confermato); iOS non testato

### Sintomi

Nella barra di ricerca della schermata Cerca, digitando sulla tastiera mobile i caratteri compaiono nell'input ma il bottone X per svuotare il campo non appare mai. Su desktop il comportamento è corretto: i caratteri compaiono e la X appare non appena il campo non è vuoto.

### Causa attesa

Lo stato React `hasText` (o equivalente) non si aggiorna quando l'utente digita da mobile, nonostante l'input riceva effettivamente i caratteri. Sul desktop il flusso funziona: evento → aggiornamento stato → re-render → X visibile.

### Architettura attuale

La barra di ricerca è un componente client (`"use client"`) nella pagina `src/app/(app)/cerca/page.tsx`. Il bottone X è renderizzato condizionalmente su `{hasText && <button>}`. L'input è **non controllato** (nessun prop `value=`), con un native DOM event listener attaccato via `useEffect`:

```tsx
useEffect(() => {
  const el = inputRef.current;
  if (!el) return;
  const onInput = () => setHasText(el.value.length > 0);
  el.addEventListener("input", onInput);
  return () => el.removeEventListener("input", onInput);
}, []);
```

### Tentativi falliti

1. **Input controllato + `onChange` React** — `onChange` non aggiornava lo stato su mobile (possibile interferenza IME/autocorrect della tastiera Android con il layer di eventi sintetici di React).

2. **`onCompositionEnd`** — aggiunto in parallelo a `onChange` per catturare la fine della composizione IME. Non ha risolto: i caratteri continuavano ad apparire ma `hasText` rimaneva `false`.

3. **Input non controllato + `onInput` React** — rimosso `value=`, usato `onInput` React sintetico al posto di `onChange`. Stesso risultato: stato non aggiornato su mobile.

4. **Native `addEventListener("input")` nel layout condiviso** — spostato l'input nel componente `CercaHeader` dentro `AppHeader` (layout condiviso), con listener DOM nativo via `useEffect`. Non ha risolto. Ipotesi: il viewport cambia quando compare la tastiera virtuale (`h-dvh` si aggiorna), possibile remount o instabilità del DOM nel contesto del layout.

5. **Native `addEventListener("input")` nella pagina** — spostato l'input direttamente in `CercaPage` (stesso albero React, nessun cross-component state). Il debug visivo (sfondo rosso + testo `hasText: true/false`) ha confermato che `hasText` resta `false` anche dopo la digitazione su mobile. Il listener nativo non scatta.

### Prossimi passi suggeriti

- Testare su iOS Safari per capire se è specifico di Android Chrome.
- Verificare se il problema è legato al **React Compiler** (`babel-plugin-react-compiler` abilitato nel progetto): provare a disabilitarlo temporaneamente per la pagina Cerca con la direttiva `"use no memo"`.
- Investigare se la tastiera virtuale Android causa un remount del componente (aggiungere un `console.log` nel mount/unmount dell'`useEffect`).
- Considerare un approccio completamente diverso: `<form>` nativo con `action` + `useFormStatus`, che bypassa il layer di eventi React.
