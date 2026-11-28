# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Chiunque voglia sapere chi è Maurizio Falconi: recruiter e aziende, colleghi, utenti delle sue app e mod, studenti delle lezioni, lettori dei paper. Nessun gruppo prevale sugli altri.

## Product Purpose

La home di falker47.github.io è il profilo vetrina di Maurizio, la sua immagine sul web. Successo: il visitatore resta colpito dal profilo, capisce in una schermata chi è (AI Engineer; software, modding, ricerca, lezioni) e raggiunge qualunque progetto in al massimo due interazioni.

## Positioning

Un solo sito tiene insieme quattro attività reali e verificabili: app e strumenti pubblicati, mod Nexus con download misurati, due paper arXiv (Ringmin) e lezioni con recensioni degli studenti. I numeri sono calcolati dai dati, mai scritti a mano.

## Operating Context

Sito statico su GitHub Pages, costruito con Node 22 senza dipendenze (`node scripts/build.mjs`). L'unica richiesta esterna a runtime è lo snapshot Nexus su `main`, aggiornato ogni giorno da un workflow.

## Capabilities and Constraints

- Italiano lingua principale, leggibile senza JavaScript; inglese completo sulla stessa URL (`?lang=en`), stringhe accoppiate in `data/i18n/`.
- Soglie QA: Accessibility 100, zero violazioni axe, Performance ≥90 mobile e ≥95 desktop, Best Practices ≥95; budget di byte e richieste in AGENTS.md.
- Nessuna CDN e nessuna richiesta di terze parti.
- Gli URL legacy elencati in `data/redirects.json` e `legacy/sha256.json` non si rimuovono.

## Brand Commitments

- Direzione visiva V3 ("master home con skin Nexus", `docs/unify/BRIEF.md`): è il riferimento approvato, ma rivedibile nei dettagli.
- Nome, ruolo e contatti da `data/profile.json`.

## Evidence on Hand

Progetti in `data/projects.json`, mod in `data/nexus-mods.json`, paper in `data/research.json` e `data/ringmin.json`, certificati in `data/certifications.json`, recensioni reali degli studenti in `data/tutoring.json`. Nessuna testimonianza, cliente o metrica va inventata.

## Product Principles

1. Prima impressione forte: il profilo deve colpire, non solo informare.
2. Tutto verificabile: ogni numero e ogni affermazione rimanda a dati o link reali.
3. Tutto a portata: ogni progetto a due interazioni dalla home.
4. Accessibile e leggero in entrambe le lingue, anche senza script.

## Accessibility & Inclusion

Accessibility 100 in Lighthouse e zero violazioni axe su ogni pagina e stato della home, in italiano e in inglese.
