# falker47.github.io

Sito master di **Maurizio Falconi (falker47)**: <https://falker47.github.io/>.
Una pagina sola, bilingue (italiano `/`, inglese `/en/`), HTML/CSS/JS statico senza build step né dipendenze npm. Pubblicato con GitHub Pages dal branch `main`.

Il portfolio dei progetti è un'altra repo: [Nexus-portfolio](https://falker47.github.io/Nexus-portfolio/). Questa pagina è l'ingresso e rimanda lì.

## Struttura

| Percorso | Contenuto |
| --- | --- |
| `index.html` | Pagina italiana. **È la sorgente**: si modifica solo questa. |
| `en/index.html` | Pagina inglese. **Generata**, non modificarla a mano. |
| `assets/styles.css` | Tutto il CSS (tre sezioni, in ordine di cascata). |
| `assets/app.js` | Tabella traduzioni `copy` (IT/EN), animazione del diagramma, tab, cambio lingua. |
| `assets/img/`, `assets/fonts/` | Immagini (WebP/PNG), card Open Graph, favicon, Poppins in WOFF2. |
| `scripts/build-site.mjs` | Genera `en/index.html` e `sitemap.xml`. |
| `scripts/validate-site.mjs` | Controlli di produzione: SEO, hreflang, asset, ARIA, traduzioni, sincronia IT/EN. |
| `scripts/*.mjs`, `scripts/animated-disclosures.js` | Contatore download Nexus Mods e animazione dei `<details>`. |
| `data/nexus-downloads.json` | Snapshot dei download unici su Nexus Mods, aggiornato dal workflow. |

## Lavorare in locale

Serve solo Node 22 (e un server statico qualsiasi: i percorsi degli asset sono assoluti, `/assets/...`).

```bash
python3 -m http.server 8000
```

Dopo ogni modifica a `index.html` o alla tabella `copy` in `assets/app.js`:

```bash
node scripts/build-site.mjs
node scripts/validate-site.mjs
node --test scripts/test-disclosures.mjs scripts/test-nexus-downloads.mjs
```

La CI (`validate.yml`) ripete gli stessi controlli su ogni push e pull request. Fallisce se `en/index.html` o `sitemap.xml` non sono allineati alla sorgente.

## Come funzionano le lingue

- Il testo traducibile ha `data-i18n="chiave"` (o `data-label` per gli `aria-label`); le stringhe stanno in `copy.it` / `copy.en` in `assets/app.js`.
- `build-site.mjs` applica `copy.en` all'HTML, riscrive `lang`, canonical, description e JSON-LD e produce `/en/`. Entrambe le pagine sono quindi complete anche senza JavaScript e indicizzabili.
- I pulsanti bandiera portano all'altra URL. La scelta è salvata in `localStorage` (`nexus-language`, condivisa con Nexus-portfolio) e `?lang=it|en` sulla radice reindirizza alla lingua richiesta.
- Per aggiungere una chiave: aggiungila in `copy.it` **e** `copy.en`, metti `data-i18n` nell'HTML italiano, poi esegui la build. Il validatore segnala le chiavi mancanti.

## Contatore download Nexus Mods

`update-nexus-downloads.yml` gira ogni giorno alle 05:24 UTC (e a richiesta), interroga l'API GraphQL di Nexus Mods con il secret `NEXUS_API_KEY` e aggiorna `data/nexus-downloads.json` solo se i totali sono cambiati. Il browser legge lo snapshot da `raw.githubusercontent.com` (`scripts/nexus-downloads.mjs`); se la richiesta fallisce restano i valori già presenti nell'HTML.

## Regole

- Immagini grandi in `assets/img/`, mai inline in base64 (il validatore ha un limite).
- Niente `<style>` nell'HTML: gli stili vanno in `assets/styles.css`.
- Le immagini di condivisione e le icone devono stare in questa repo, non in Nexus-portfolio.
