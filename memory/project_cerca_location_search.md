---
name: Cerca — ricerca per location
description: Funzionalità pianificata ma non implementata nella pagina /cerca
type: project
---

Aggiungere la ricerca per location/zona di avvistamento nella pagina /cerca.

**Why:** il sistema di ricerca già supporta utenti (username/nickname) e gatti (catNickname). La location è il terzo asse naturale.

**How to apply:** quando si implementa, usare PostGIS per ricerca geografica oppure un campo testuale "zona" sul sighting se aggiunto allo schema. La ricerca per location andrebbe in una terza sezione "Luoghi" nei risultati di /cerca, sotto Utenti e Gatti.
