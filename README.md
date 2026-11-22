# Maurizio Falconi’s personal site

This repository builds Maurizio Falconi’s unified portfolio for [falker47.github.io](https://falker47.github.io/). It brings together software, game mods, research and tutoring: the master home at `/` and every project as a technical sheet at `/projects/`. Italian is rendered in the HTML. The language switch and `?lang=en` open the English edition on the same route.

## Repository layout

| Path | What lives here |
| --- | --- |
| `src/` | Route definitions, page templates, shared components, styles and browser code |
| `data/` | Catalogues, profile, IT/EN dictionaries, redirect map and Nexus snapshot |
| `assets/` | Self-hosted fonts, artwork and generated responsive images |
| `legacy/` | Original portfolio assets at their old paths and their SHA-256 manifest |
| `scripts/` | Build, validation, tests, image generation and Nexus updater |
| `scripts/qa/` | Local server, link crawler, browser audits and captures |
| `docs/unify/` | Design brief, URL map, release measurements and cutover instructions |

## Build and check

Run these commands from the repository root with Node.js 22. The build uses the Node standard library.

| Command | Result |
| --- | --- |
| `node scripts/build.mjs` | Build the site in `_site/` |
| `node scripts/qa/serve.mjs` | Serve that build at the printed loopback URL |
| `node scripts/check.mjs` | Rebuild, validate HTML and budgets, run the tests and crawl local links |
| `node scripts/qa/audit.mjs --task local` | Run Lighthouse and axe on every route and redirect stub |
| `node scripts/qa/legacy.mjs --task local` | Follow the old URLs and verify legacy asset hashes |
| `node scripts/qa/i18n-check.mjs --task local` | Check the visible language in both editions |
| `node scripts/qa/screenshots.mjs --task local --pages /,/uses/ --langs it,en` | Capture selected pages at desktop and mobile sizes |

Build before running browser QA. Install Playwright, Lighthouse, chrome-launcher, axe-core and Sharp under `<HOME>/qa-tools`. Put the Chromium executable path in `<HOME>/qa-tools/chrome-path.txt`. The `--task` value names the output folder under `_review/`. With Chromium configured, `check.mjs` also measures cold home loads.

## Add a catalogue entry

- **Project.** Add a record to `data/projects.json` with a unique ID and slug, sequential `order`, category, visibility, stack, `where` (IT/EN, the spec table's "Dove"), typed links and IT/EN copy, including `cover.alt`. Set `page` to a declared detail route or `null`. Register the ID in `projectSources` in `scripts/tools/make-images.mjs` with its source path relative to `<HOME>/sources/Nexus-portfolio/assets/`.
- **Featured mod.** Append to `items` in `data/mods.json` with an ID, title, game, IT/EN `kind`, `stack`, IT/EN `where`, Nexus URL, repository URL or `null`, and IT/EN description and cover alt text. Supply the artwork for a new mod at `<HOME>/sources/mods/<id>.png`.

Run `node scripts/tools/make-images.mjs` to generate the WebPs and write their dimensions to the data. Commit the generated variants with the entry. The new entry appears on `/projects/` and in the home counts automatically. Update the catalogue expectations in `scripts/test-data.mjs` for the new inventory, then run `node scripts/check.mjs`.

## Nexus refresh and deployment

`Refresh Nexus Mods downloads` runs daily at 05:24 UTC or by manual dispatch. It tests the parser, reads `uniqueModDownloads` and `modCount` from the Nexus profile and commits only a changed `data/nexus-downloads.json` to `main`. The home page renders the bundled snapshot immediately and can refresh it from the public copy on `main`.

`pages.yml` listens for a completed refresh on `main` through `workflow_run`. A successful refresh triggers a build even when the snapshot needed no commit. Pushes to `main` and manual dispatch also trigger it. Pages checks out `main`, runs `node scripts/check.mjs` and deploys the validated `_site/` artifact. [Release results](docs/unify/RELEASE.md) · [Go-live runbook](docs/unify/GO-LIVE.md)
