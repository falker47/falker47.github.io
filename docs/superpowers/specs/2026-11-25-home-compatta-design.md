# Home più compatta: carosello in "Su di me", icone coerenti, Ricerca come Software

Data: 2026-11-25 · Branch: `claude/v5-compact` (worktree `falker47-wt/V5`) · Stato: approvato da Maurizio il 2026-11-25

## Intento

Il pregio del sito è che all'inizio è compatto: in "I miei progetti" le rail orizzontali contengono molto materiale in poco spazio. "Su di me" invece su mobile è lunga circa 2.300 px. Maurizio vuole applicarle la stessa logica, rendere coerenti le icone, far sembrare la Ricerca identica a Software e Modding, sistemare il tab Lezioni su desktop e ritrovare la strada verso la pagina di Social Viewer.

## Obiettivi

1. **Carosello in "Su di me"** (scelto da Maurizio). Un paragrafo con la sua figura per volta, frecce, puntini e contatore "1/4" come le rail dei progetti. L'altezza segue il paragrafo aperto. I link dei profili restano sempre visibili sotto il carosello.
8. **Via la frase finale** "Il mio obiettivo è non smettere mai di imparare…" (chiesto da Maurizio): si tolgono il paragrafo, la chiave `philosophy` dai due dizionari, il suo stile e il controllo in `scripts/validate-home.mjs`.
2. **Riquadri dei numeri due per riga**, desktop e mobile ("14 progetti software" accanto a "11.080 download", "5,0 su 12 recensioni" accanto a "2 articoli su arXiv").
3. **Icone dei riquadri nello stile del Nexus**: quadratino pieno colorato con il logo o simbolo bianco. arXiv usa il suo logo ufficiale; il terminale (progetti) e la stella (recensioni) restano gli stessi soggetti, ridisegnati pieni.
4. **Link in fondo a "Su di me"**: ognuno mostra il logo originale, a colori, del posto dove porta. LinkedIn, GitHub, OEIS e ORCID usano i loro marchi. Ripetizioni usa il logo di Letuelezioni, perché porta lì. Ricerca usa il simbolo a cerchi della ricerca del sito, perché porta a `/research/`.
5. **Ricerca identica a Software**: i due articoli diventano card `.card` come quelle dei progetti, dentro una rail. Al posto della copertina va il disegno, poi titolo, etichetta "Paper I/II", riga tecnica e riassunto, con i bottoni arXiv e GitHub in fondo. Su mobile scorrono in orizzontale.
6. **Lezioni su desktop**: le due card dei portali sono affiancate sotto la frase "Vuoi sapere…", così la colonna destra è alta quanto il testo. Su mobile restano come sono.
7. **Schede dei progetti raggiungibili**: sulle card con una pagina nel sito (Prof. Gecko, Camaleonte, Social Viewer), la copertina apre la scheda e porta l'etichetta "Scheda →" (chiave esistente `projectPage`). Il titolo resta un link.

## Non obiettivi

- Le categorie software (App · Giochi · Strumenti) restano come sono: Maurizio ne riparlerà.
- Il testo dei quattro paragrafi, il ventaglio dei certificati, il disegno del pendolo e l'hero non cambiano.
- Il tab Lezioni su mobile non cambia.

## Anti-obiettivi

- Testo nascosto senza JavaScript: senza script i quattro paragrafi restano in colonna, leggibili in italiano (regola del sito).
- Un carosello alto quanto la slide più lunga, con spazi vuoti sotto quelle corte.
- Perdere i link profondi: `#certificazioni` deve portare alla slide del lavoro e aprire il visore come oggi.
- Superare i limiti di peso della home (235.000 byte tra HTML, CSS e JS, di cui 180.000 di HTML) o abbassare i punteggi Lighthouse e axe sotto i minimi del sito. Aggiornamento del 2026-11-26: il lavoro ci stava, ma con circa 300 byte di margine, meno di una mod Nexus (circa 1.050 byte); Maurizio ha approvato di alzare i limiti a 240.000 e 185.000 byte.

## Approcci

**Per "Su di me" compatta** (decisi con Maurizio):
1. **Carosello (scelto).** I paragrafi sono un racconto in sequenza ("Da lì…", "Fuori dal lavoro…"), quindi frecce e "1/4" ne conservano l'ordine. Le lunghezze diverse si gestiscono con l'altezza che segue la slide aperta.
2. Schede come "I miei progetti": scartate, perché farebbero leggere i paragrafi fuori ordine.
3. Solo compattare in verticale: scartato, si guadagna circa il 10%.

**Per le categorie** sono state proposte tre alternative: per scopo, per dimensione (7 e 7) e per ambito (4 gruppi). Maurizio le ha scartate tutte per ora.

## Come si costruisce (scelte di Claude, correggibili)

- **Carosello.** `about.mjs` avvolge le quattro `.about-row` in una traccia con scroll-snap. Sotto ci sono frecce, puntini e "1/4", tutti `hidden` finché lo script non li attiva; i puntini sono bottoni con area di 44 px. `components.js` aggiunge `about-enhanced`: frecce e puntini scorrono di una slide, e lo scorrimento a mano (swipe) aggiorna puntini e contatore. Un `ResizeObserver` imposta l'altezza della traccia su quella della slide attiva, con una transizione che si spegne con reduced motion. Il focus da tastiera su un link di un'altra slide la porta in vista e aggiorna l'indice. `reveal()` impara a scorrere il carosello fino alla slide che contiene il bersaglio (`#certificazioni`). Accessibilità: regione con `aria-roledescription="carosello"` ed etichetta "Su di me"; ogni slide è un gruppo "1 di 4"; le stringhe nuove vanno in `it.json` ed `en.json`.
- **Disposizione su desktop.** Nel carosello il testo sta sempre a sinistra e la figura a destra: in una sequenza sfogliata, una disposizione fissa si legge meglio dello zig-zag.
- **Riquadri.** `.facts-list` passa a due colonne. Il glifo diventa un quadratino pieno con sfumatura nel colore della sezione e simbolo bianco pieno. Nexus tiene il suo emblema a colori; arXiv usa il logo ufficiale (fonte e licenza in `docs/unify/BRANDS.md`).
- **Link dei profili.** I loghi originali a colori. LinkedIn non è in Simple Icons: il suo "in" viene dalla pagina brand di LinkedIn, con fonte e regole d'uso in `BRANDS.md` e `brands.json`. Letuelezioni usa `assets/images/letuelezioni.png`, già nel sito. Ricerca usa un piccolo simbolo a cerchi tangenti nel viola della ricerca, disegnato inline.
- **Ricerca.** `paperCard` diventa una `.card` con lo stesso markup dei progetti, dentro `rail()`. La riga tecnica è "arXiv 2607.28654"; per il Paper II si aggiunge l'intervallo C*. Il riassunto è la frase oggi in corsivo (`paper…Highlight`). La seconda frase (`paper…Line`) esce dalla card, perché la pagina `/research/` ha già il suo riassunto: le chiavi tolte si cancellano dai due dizionari. Il riquadro "2 articoli su arXiv" e la riga "Anche Power-Ringmin · Zenodo" restano.
- **Lezioni.** Da 900 px `.lesson-cards` passa a due colonne.
- **Schede.** In `projectCard` la copertina è avvolta in un link alla pagina, con `tabindex="-1"` e `aria-hidden`, perché per tastiera e lettori di schermo il link resta il titolo. L'etichetta "Scheda →" sta sulla copertina.
- **Documentazione.** `AGENTS.md` si aggiorna per il carosello (sparisce l'alternanza da 900 px), le card della ricerca, i loghi dei link e le schede sulle copertine.

## Verifica

`node scripts/check.mjs`, poi in `_review/V5/`: `audit.mjs`, `interactions.mjs` (da estendere al carosello: frecce, puntini, swipe, deep link `#certificazioni`, pagina senza script), `release-layout.mjs`, `i18n-check.mjs`, `legacy.mjs` e gli screenshot della home in italiano e inglese a 390 e 1440 px. Prima della consegna un controllo a occhio in browser.

## Lasciato a chi costruisce

Durata e curva della transizione d'altezza, dimensione dei puntini, sfumature esatte dei quadratini e posizione dell'etichetta "Scheda" sulla copertina, entro lo stile del sito.
