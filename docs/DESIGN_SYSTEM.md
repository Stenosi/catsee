# CatSee — Design System

**Versione:** 1.0
**Data:** 2026-05-12
**Companion:** `WIREFRAMES.md` (layout), `SPEC.md` (feature)

---

## 1. Fondamenta tecniche

- **Framework UI:** shadcn/ui stile `base-nova` + `@base-ui/react` come primitive
- **Colori:** CSS custom properties in formato **OKLCH**, definite in `src/app/globals.css`
- **Utilities:** Tailwind CSS v4 — i token colore sono esposti come classi `bg-*`, `text-*` via `@theme inline`
- **Font:** Plus Jakarta Sans (variable, 400–700) — `font-sans`; Geist Mono — `font-mono`
- **Componenti base:** `src/components/ui/` (generati da shadcn, da non modificare senza motivo)
- **Componenti dominio:** `src/components/` (specifici di CatSee, compongono i componenti base)
- **Utility classi:** usa sempre `cn()` da `@/lib/utils` per comporre classi in modo sicuro

---

## 2. Palette colori — "Ginger Cat"

### 2.1 Motivazione della scelta

La palette A "Ginger Cat" è stata scelta per tre ragioni:

1. **Coerenza con il prodotto.** Il primary (ambra arancio caldo) richiama il manto del gatto tigrato/rosso — l'animale al centro dell'app — senza essere letterale.
2. **Mood "wholesome" non aggressivo.** L'arancio è energico ma non urla. Su uno sfondo crema caldo (non bianco clinico) il tono generale è caldo, accogliente, da "piazza del paese" più che da startup tech.
3. **Leggibilità mobile.** Il contrasto dark-text-on-warm-orange (primary-foreground scuro su primary arancio) supera le soglie WCAG AA per grandi elementi UI come bottoni e FAB.

### 2.2 Token e valori OKLCH

Tutti i valori sono in `src/app/globals.css`. Qui per riferimento rapido:

#### Light mode

| Token | OKLCH | Aspetto visivo |
|---|---|---|
| `--background` | `oklch(0.974 0.012 80)` | crema tiepida |
| `--foreground` | `oklch(0.182 0.025 47)` | marrone-nero caldo |
| `--card` | `oklch(0.99 0.008 80)` | quasi bianco caldo |
| `--primary` | `oklch(0.67 0.19 48)` | ambra arancio caldo |
| `--primary-foreground` | `oklch(0.15 0.05 48)` | marrone scuro (su primary) |
| `--secondary` | `oklch(0.91 0.008 70)` | grigio caldo chiaro |
| `--secondary-foreground` | `oklch(0.27 0.022 50)` | marrone medio |
| `--muted` | `oklch(0.93 0.006 70)` | grigio caldo chiarissimo |
| `--muted-foreground` | `oklch(0.5 0.014 55)` | grigio-marrone medio |
| `--accent` | `oklch(0.905 0.042 85)` | oro pallido |
| `--accent-foreground` | `oklch(0.28 0.065 48)` | ambra scuro (su accent) |
| `--destructive` | `oklch(0.6 0.23 27)` | rosso standard |
| `--border` | `oklch(0.87 0.008 70)` | grigio caldo leggero |
| `--warning` ¹ | `oklch(0.72 0.17 65)` | ambra |
| `--success` ¹ | `oklch(0.52 0.145 145)` | verde foresta |

¹ Token custom non standard shadcn — esposti come `bg-warning`, `text-warning`, `bg-success`, `text-success`.

#### Dark mode

I valori dark mode sono nel blocco `.dark` di `globals.css`, pronti ma non attivati in MVP. Il background diventa un marrone-nero caldo (non grigio neutro), il primary si schiarisce leggermente per compensare il contrasto ridotto su sfondo scuro.

---

## 3. Linee guida d'uso

### 3.1 Quando usare ogni token

**`primary` / `primary-foreground`**
Usa per: il FAB "Scatta" (l'azione principale dell'app), bottoni di conferma ("Pubblica", "Continua"), link testuali in evidenza.
Non usare per: elementi decorativi, stati di hover/focus (usa `accent`), feedback di errore.

```tsx
<Button variant="default">Pubblica</Button>   // bg-primary text-primary-foreground
<Button variant="link">Vedi dettaglio</Button // text-primary
```

**`secondary` / `secondary-foreground`**
Usa per: bottoni secondari ("Rifai", "Annulla"), chip/tag di stato non critici, pill di filtro sulla mappa.

```tsx
<Button variant="secondary">Rifai foto</Button>
```

**`muted` / `muted-foreground`**
Usa `bg-muted` per: sfondi di sezioni subordinate, skeleton loader, input disabilitati.
Usa `text-muted-foreground` per: timestamp, distanza, meta-info, placeholder, label di contatori ("23 gatti").

```tsx
<p className="text-sm text-muted-foreground">2 ore fa · ~Ancona</p>
```

**`accent` / `accent-foreground`**
Usa per: stato hover/active su elementi interattivi non-button (righe di lista, card cliccabili), badge di highlight temporaneo, sfondo di tooltip.
Non usare come colore principale di un'azione — è troppo pallido per essere un CTA.

**`destructive`**
Usa esclusivamente per: eliminazione account, eliminazione post, ban utente nel pannello admin. Non usare per warning generici (usa `warning`).

**`warning` (custom)**
Usa per: avviso AI "non vediamo un gatto", badge "in revisione", alert non bloccanti.

**`success` (custom)**
Usa per: conferma pubblicazione, unlock badge (affiancato all'animazione confetti), stato "approvato" nel pannello admin.

---

### 3.2 Regole anti-pattern

- ❌ **Mai `bg-white` o `bg-black`** — rompe il dark mode. Usa `bg-background` o `bg-card`.
- ❌ **Mai `text-gray-*` hardcoded** — usa `text-foreground`, `text-muted-foreground`, o `text-secondary-foreground`.
- ❌ **Mai colori hex o rgb inline** — tutto passa dalle CSS variables.
- ❌ **Mai `bg-orange-500`** — anche se è visivamente simile al primary, non risponde al tema.
- ✅ L'unica eccezione ammessa: colori estratti dinamicamente dalla foto (palette del gatto) via `node-vibrant` — quelli sono inline per definizione.

---

### 3.3 Scala tipografica

| Classe Tailwind | Uso |
|---|---|
| `text-3xl font-bold` | Titoli marketing (landing, onboarding) |
| `text-2xl font-semibold` | Titolo pagina (H1 di schermata) |
| `text-xl font-semibold` | Sezione interna (H2) |
| `text-base` | Body, contenuto schede |
| `text-sm text-muted-foreground` | Timestamp, meta-info, distanza |
| `text-xs` | Badge label, micro-caption |

Il font Plus Jakarta Sans ha geometria caldo-arrotondata: i pesi 500 e 600 sono ottimi per label UI, 400 per corpo testo, 700 per titoli display.

---

### 3.4 Componenti e varianti disponibili

Da shadcn (in `src/components/ui/`):

| Componente | Varianti | Note |
|---|---|---|
| `Button` | `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` | Aggiungere `fab` quando si implementa il FAB |
| *(da aggiungere)* | — | Aggiungere con `pnpm dlx shadcn@latest add <nome>` |

Quando aggiungi un componente custom di dominio (es. `CatSightingCard`), mettilo in `src/components/` (non in `ui/`) e componi i componenti shadcn internamente.

---

## 4. Dark mode — note per implementazione futura

Il dark mode è **già definito** nel blocco `.dark` di `globals.css`. Quando sarà il momento di attivarlo (v1.x):

### Cosa serve fare
1. **Aggiungere il toggle:** impostare `class="dark"` sull'elemento `<html>`. Gestire con `next-themes` (libreria consigliata per Next.js App Router).
2. **Installare next-themes:** `pnpm add next-themes`, wrappare il layout con `<ThemeProvider>`.
3. **Aggiungere la voce "Tema" in Settings** (già prevista come placeholder in WIREFRAMES 4.1, sezione "App → Tema (post-MVP)").

### Cosa NON serve fare
- Non toccare nessun componente shadcn o custom — se le regole anti-pattern sopra sono state rispettate, tutto commuta automaticamente.
- Non aggiustare globals.css — i valori dark sono già corretti.

### Caratteristiche del dark mode "Ginger Cat"
- Background: marrone-nero caldo (non grigio — mantiene la coerenza warm della palette)
- Primary: leggermente più chiaro (`oklch(0.71 ...)`) per compensare il contrasto su sfondo scuro
- Border: semi-trasparente (`oklch(1 0 0 / 10%)`) invece di un colore solido — si adatta a qualsiasi sfondo
- Sidebar: usa gli stessi valori del card dark, non un colore separato

### Attenzione alle immagini
Le foto dei gatti in dark mode appariranno con lo sfondo scuro attorno. Valutare un sottile `ring-1 ring-border` sulle card con foto per definirle meglio su sfondo scuro.
