# "Su di me" a zig-zag, con i numeri nelle grafiche

Data: 2026-11-25 · Branch: `claude/v4-polish` · Stato: da approvare

## Intento

Maurizio vuole che "Su di me" sia più visiva: ogni paragrafo affiancato da una grafica, sfalsate (P1 G1 / G2 P2 / P3 G3 / G4 P4). I numeri del sito, oggi raccolti nel riquadro "In breve", diventano il contenuto delle grafiche, ognuno accanto al paragrafo che lo spiega. Si aggiunge il voto delle ripetizioni aggregato dai portali.

## Obiettivi

- Zig-zag paragrafo/grafica dai 900 px in su; sotto, ogni grafica segue il suo paragrafo in colonna.
- G1 (studi): disegno a linee nello stile dell'hero, onda della fisica → `</>`, etichette FISICA / INFORMATICA (IT/EN).
- G2 (lavoro): 15 certificazioni, con le materie dei corsi come etichette (Blockchain, Data science, Machine learning, AI generativa); link a `#certificazioni`.
- G3 (metodo): 14 progetti software (link `#progetti`) e i download unici Nexus (contatore live, link `#panel-modding`).
- G4 (tempo libero): voto delle ripetizioni "5,0 ★ su 12 recensioni" (link `#panel-teaching`) e 2 articoli su arXiv (link `#ricerca`).
- Il riquadro "In breve" sparisce.

## Non obiettivi

- Nessun numero nella prima schermata: "Su di me" resta chiusa all'apertura (deciso da Maurizio).
- Testo dei paragrafi, citazione finale, link ai profili e ventaglio dei certificati restano come sono, sotto lo zig-zag.
- Nessun recupero automatico dei voti dai portali: si leggono da `data/tutoring.json`, aggiornato a mano.

## Anti-obiettivi

- Numeri scritti a mano o dentro immagini: devono restare contati dai dati, tradotti col cambio lingua e (per Nexus) live.
- Ordine di lettura che separa un numero dal suo paragrafo.
- Superare i limiti di peso della home (HTML 180.000 byte, HTML+CSS+JS 230.000).

## Approcci

1. **Righe intrecciate nell'HTML (scelto).** Ogni riga è `<div class="about-row">` con il `<p>` e subito dopo la sua `<figure>`; lo zig-zag è CSS (righe pari invertite da 900 px). Ordine di lettura corretto, riuso dei riquadri `.fact`.
2. Testo e riquadri in due blocchi separati, disposti con grid-template-areas: scartato, l'ordine reale stacca i numeri dai paragrafi e la disposizione è fragile.
3. Grafiche come immagini: scartato, i numeri non si aggiornerebbero né si tradurrebbero.

## Come si costruisce (deciso)

- `src/pages/home/about.mjs`: `aboutText` diventa una lista di righe `{ text, figure }`; `factsCard` lascia il posto a una figura per riga. I riquadri riusano il markup `.fact` (glifo, numero, etichetta, link) e i conteggi attuali.
- Voto aggregato calcolato al build da `tutoring.ratings`: media pesata per numero di valutazioni, arrotondata a una cifra e localizzata (5,0 / 5.0); totale = somma delle valutazioni (10 + 2 = 12). Le "raccomandazioni" di Superprof non contano.
- Stringhe nuove in `data/i18n/it.json` ed `en.json` (etichette di G1, materie di G2, "su {count} recensioni" / "from {count} reviews"); quelle di "In breve" che non servono più si tolgono.
- `src/styles/sections.css`: stili delle righe e delle figure, via quelli di `.about-facts` / `.facts-grid`.

## Scelte mie (da controllare)

- Colori: restano i toni attuali dei riquadri (software blu, Nexus arancio, ricerca viola, certificazioni verde); il voto prende un giallo stella (`#facc15`), con contrasto verificato in `design-checks.mjs`.
- G1 è uno SVG inline in `src/partials/`, decorativo (`aria-hidden`), stile e tratti dell'hero; nessuna animazione.
- Le materie in G2 sono etichette, non link.
- Le righe sono separate da una riga sottile come nella bozza B.

## Lasciato al builder

- Misure, spaziature e proporzione testo/grafica (circa 1,45 : 1 nella bozza).
- Aggiornare `validate-home.mjs`, `test-home.mjs` e `scripts/qa/interactions.mjs` dalla disposizione di "In breve" a quella a righe (ordine paragrafo → figura, zig-zag ≥ 900 px, colonna sotto).
- Rigenerare le catture di confronto in `_review/V4/` per "Su di me" e aggiornare la descrizione della PR 24.
