V4 refines the unified site (V3, #23): the nine visual changes of the first pass, then four review rounds on the preview and a last text pass. Every figure and string is built from `data/` in Italian and English. Base: `claude/v3-fusion`.

## Before → after

`_review/V4/before/` (V3 build) and `_review/V4/after/` (this branch) hold the same matrix: home closed, "Chi sono" open, "I miei progetti" on each of its four tabs, `/research/` and `/uses/`, in Italian and English, at 1440×900 and 390×844, viewport and full page (64 captures each, reduced motion). `_review/V4/compare/` puts every pair side by side, V3 on the left. The main ones:

- Chi sono: [1440](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-chi-sono-it-1440-full.webp?raw=true) · [390](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-chi-sono-it-390-full.webp?raw=true)
- Software: [1440](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-progetti-it-1440.webp?raw=true) · [390](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-progetti-it-390.webp?raw=true)
- Modding: [1440](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-tab-modding-it-1440.webp?raw=true) · [390](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-tab-modding-it-390.webp?raw=true)
- Research: [1440](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-ricerca-it-1440.webp?raw=true) · [390](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-ricerca-it-390.webp?raw=true)
- Lessons: [1440 IT](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-tab-teaching-it-1440.webp?raw=true) · [390 EN](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/home-tab-teaching-en-390.webp?raw=true)
- Cosa uso: [1440](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/uses-it-1440-full.webp?raw=true) · [390](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/uses-it-390-full.webp?raw=true)

## What changed, as it stands now

**Header and footer.** "Cosa uso" / "What I use" after the three home sections, on desktop and in the phone menu (4 × 48 px), `aria-current="page"` on `/uses/`; on the home the section links stay fragments. The footer signature links to `/` on every page. Hero and header stay blue whatever the tab.

**Chi sono.** Four paragraphs written by Maurizio (studies, work, way of reasoning, lessons and research; the English is rewritten, not translated word for word), the closing quote and the profile links. Beside the text, "In breve": four tiles counted from the data at build time, each in the colour and with the mark of its section and linked to it: 14 software projects (App + Giochi + Strumenti), 11.051 / 11,051 Nexus unique downloads (the live counter of the Modding tab), 2 arXiv papers, 15 certificates. Below 900 px the tiles go 2×2 under the text. The certificate fan has four new Coursera certificates (Wharton, Geneva, UPenn, Politecnico di Milano) and follows the pointer's slot as smoothly to the right as to the left.

**Certificates load faster.** Thumbnails at 300w and 480w (`sizes="150px"`). The home starts them a second after the load event, while the browser is idle (`requestIdleCallback`, `setTimeout` fallback, skipped with Save-Data), or as soon as the "Chi sono" summary gets the pointer, focus or a touch. A card under the pointer or the focus preloads its 960 px viewer image. Timings below.

**I miei progetti, all tabs.** The tab accent (blue, Nexus orange, violet, green) applies inside the section only. Longer panel intros. Every count is one tile shaped like the "Chi sono" figures: glyph or mark in a rounded square, number, label, an arrow only on links; same height, radius and sizes in every panel, the pressed category toggle outlined in the panel accent. Cards are smaller (about four per row on desktop) with their summaries in full. The buttons are the foot of each card: up to three in a row sharing its width, split by rules, the platform mark left of the label, brand colour on hover and focus; a card too narrow for three gives the first a row of its own. An app already on Google Play no longer shows the tester link.

**Brand marks.** One helper, `actionLink`, renders every external action: GitHub, Google Play, Nexus Mods, arXiv, Zenodo, ORCID and OEIS show their mark (sources below); other links keep an arrow (→ inside the site, ↗ elsewhere). The icon sprite of each page carries only the icons it uses.

**Modding.** Nexus Mods orange (`--nexus: #f97316`, the emblem's fill), bars `#f97316 → #fbbf24`. The panel leads with the unique-downloads tile (the publication count and snapshot date are gone), then the Mod and Traduzioni toggles. Translations use the mod card (16:9 cover, game pill, category); the Nexus updater now downloads their pictures too, shown with an "IT" badge, and a typographic header where a mod has none.

**Research.** Paper cards at the size of the software cards, both drawings 16:9. Paper I: the twelve certified optima, 6×2, labels under square drawings. Paper II: a fan, one spoke per n from 3 to 18, as long as R(n)/n² on a common scale, solid when certified and dashed otherwise, under a glowing semicircle of radius C* whose thickness is the certified interval; label "C* ∈ [0,1405; 0,1420]" (outward-rounded, localized). Every number comes from `data/ringmin.json`; the 1/8 circle, absent from the data, is not drawn. "GitHub" instead of "Codice" on the cards; the explanatory footnote is gone, the Power-Ringmin and Zenodo links stay.

**Lessons.** From 900 px: title, text and "Scopri le lezioni →" on the left, the lead and the Letuelezioni and Superprof boxes on the right; below 900 px text and button come first. The one-line intro and the "Lezioni individuali" box are gone. The text no longer mentions a degree:
- IT: *La passione per la scienza mi ha portato a volerla anche insegnare, e dal 2023 seguo studenti delle medie e del liceo, a Parma e online. Partiamo da dove ti blocchi: ogni passaggio lo spiego per intero, con appunti digitali ed esercizi guidati che ti restano dopo la lezione.*
- EN: *My passion for science made me want to teach it too, and since 2023 I've been helping middle and high school students in Parma and online. We start wherever you get stuck: I explain every step in full, with digital notes and guided exercises that you keep after the lesson.*

**Cosa uso.** Compact page: each pick beside its product, cut from the cover illustration.

## Review rounds

| Round | Commit | What changed |
| --- | --- | --- |
| First pass | 551661a, 80aa77f | Nine changes: facts card, certificate loading, filter pills, brand marks, Nexus orange, Paper II chart against 1/n, lessons layout, footer link, "Cosa uso" in the header; evidence. |
| Review 1 | f335f16 | Smaller hero headline and catalogue cards, figures as coloured tiles, four certificates, translations as mod cards, Paper I 6×2, tab accents, compact "Cosa uso", per-page icon sprite, no tester link for apps on Google Play. |
| Review 2 | 5fc4e5a, 00377be, c6de128 | Toggles back to count tiles, Modding leads with downloads, longer intros, paper cards at software size, fluid fan; prefetch a second after load; audit with `--disable-gpu`. |
| Review 3 | f369495 | Accent only inside "I miei progetti", quieter research, summaries in full, translation pictures from the updater. |
| Tiles and buttons | 28b9b1c, 871a10f | One tile for every count, buttons as the card foot (direction C of three previews). |
| Paper II | 14ba9d6 | The 1/n chart becomes the fan under the C* semicircle. |
| Chi sono | a605e1f | Four paragraphs by Maurizio; home limits 230 KB HTML+CSS+JS, 180 KB HTML. |
| Lessons text | this push | Passion for science instead of the degree, in IT and EN; opening "Chi sono" starts the thumbnails at once (see Decisions); evidence regenerated. |

## Measurements

### Certificate fan, time to visible on "Fast 4G"

Chrome DevTools' Fast 4G preset (165 ms RTT, 9 Mbit/s down), cold cache, 3 runs each, median shown. The clock runs from the click on "Chi sono" until every thumbnail has loaded and decoded. `node scripts/qa/cert-loading.mjs --task V4/measurements --label after [--root <V3 _site>]`; raw data and request traces in `_review/V4/measurements/` (V3 measured in the first pass).

| Reader | 1440 px, V3 → V4 | 390 px (DPR 2.75), V3 → V4 |
| --- | --- | --- |
| opens "Chi sono" 3 s after load | 684 → **21 ms** | 697 → **32 ms** |
| opens it at the load event | 676 → **640 ms** | 704 → 722 ms |
| points at the summary, opens 300 ms later | 682 → **334 ms** | 703 → **390 ms** |

V3 loads 11 thumbnails, V4 15 (four new certificates).

In V3 the thumbnails are `loading="lazy"` inside the closed `<details>`, so Chromium requests none of them until the section opens: the first request starts 135–165 ms after the click and all of them then compete on the throttled link. In V4 the requests start before the click.

### Budgets

- Cold home load, idle prefetch excluded: 365,839 bytes / 11 requests at 1440 px, 306,437 / 11 at 390 px (Lighthouse) (limits 450,000 / 15).
- Idle prefetch after the load event (`checkDeferred`): 15 certificate thumbnails, 105,397 bytes (limit: thumbnails only, one per certificate, ≤ 200,000 bytes). Lighthouse applies the same split.
- Home HTML+CSS+JS 224,139 bytes (limit 230,000), HTML 172,704 (limit 180,000).

### Lighthouse (performance / accessibility), V3 → V4

`QA_CHROME_FLAGS=--disable-gpu` on both sides for `/` (V3 in `_review/V4/before-audit-nogpu/`); the other V3 rows come from `_review/V4/before-audit/`. Best practices 100 everywhere.

| Route | IT mobile | IT desktop | EN mobile | EN desktop |
| --- | --- | --- | --- | --- |
| / | 95/100 → 94/100 | 100/100 → 100/100 | 95/100 → 94/100 | 100/100 → 100/100 |
| /404.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /research/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 99/100 → 99/100 |
| /projects/prof-gecko/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /projects/camaleonte/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /uses/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /projects/social-viewer/ | 99/100 → 100/100 | 100/100 → 100/100 | 99/100 → 100/100 | 100/100 → 100/100 |
| /projects/social-viewer/test/ | 100/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /projects/social-viewer/privacy/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /Nexus-portfolio/ (7 stubs) and /projects/ | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |

Floors: performance ≥ 90 mobile and ≥ 95 desktop, accessibility 100, best practices ≥ 95. axe: 0 violations in all 68 runs (17 routes and stubs × IT/EN × 1440/390). Every row passes; raw data in `_review/V4/after-audit/`.

## Checks

- `node scripts/check.mjs`: pass (build, HTML and budget validation, 73 tests, link crawl, cold-browser load at both viewports).
- `scripts/qa/audit.mjs` with `QA_CHROME_FLAGS=--disable-gpu`: PASS on every route and stub (table above).
- `scripts/qa/legacy.mjs`: 79 browser navigations verified.
- `scripts/qa/i18n-check.mjs`: 0 language leaks, 0 scan errors on every page and interaction state.
- `scripts/qa/release-layout.mjs`: 92 page and panel layouts, 47 image files, 0 failures.
- `scripts/qa/overflow.mjs`: 150 layouts (every route and home state × IT/EN × 360/390/768/1024/1440 px, phone menu open), 0 with horizontal overflow.
- `scripts/qa/interactions.mjs`: pass on `/`, `/research/`, `/uses/`, the three project pages, the Social Viewer test page and `/404.html` (32 runs); on the privacy page it fails at 320 px on the legal links (open point below).
- `scripts/qa/social-viewer.mjs`: 19 checks pass. `scripts/qa/cert-loading.mjs`: table above.
- Logs in `_review/V4/after-qa/` (`run.log`, then `run-fix.log` and `interactions-fix.log` after the click fix below). The Lighthouse run predates that one-line fix, which adds a click listener and changes nothing at load.

## Open points

- **GPU stall in headless Chrome.** On this machine (remote-desktop session) headless Chrome stalls on the GPU: one unattributed task of a second or more on every page with a picture. Without `--disable-gpu` the mobile home scores 74–94 across runs against 94–95 for V3 measured the same way; with the flag on both sides it is 94 against 95 (table above). The floor is met with the flag; CI runs on its own Chrome. Worth a run on a machine with a working GPU before merge.
- **Legal links on the privacy page.** In `/projects/social-viewer/privacy/` the links inside the legal text (e.g. the e-mail address) are below the 44 px target in the reflow check of `interactions.mjs`. It was already so in V3; the text is a fixed legal snapshot (`docs/unify/privacy-snapshot.txt`), so it is left as is. `social-viewer.mjs` passes.

## Decisions

- **Prefetch accounting.** The cold-load gate (450 KB / 15 requests) counts the idle certificate prefetch separately instead of being raised: requests before and around the load event stay under the old limits, and the thumbnails after it have their own limit. Without this, Lighthouse and the cold-browser check would count 26 requests.
- **Thumbnails on open.** Since review 2 the idle prefetch waits a second after load. A reader who opened "Chi sono" before then waited for it on phones, where the fan sits below the fold and the lazy images do not start: 1,723 ms at 390 px against 704 on V3. A click on the summary now starts them too (722 ms with 15 thumbnails instead of 11).
- **Nexus figure.** Shown exactly (11.051 / 11,051), not as "11k": it fits the tile at every width and reuses the Modding counter, so it follows the live snapshot and the language switch. The projects figure counts the software categories only; Ringmin is counted as a paper.
- **Toggles, ARIA.** The tiles keep the V3 semantics: a labelled `role="group"` of toggle buttons with `aria-pressed`, exactly one pressed, natively keyboard-operable.
- **Brand colours on hover.** GitHub `#181717`, Google Play `#414141` and arXiv `#b31b1b` are below 3:1 on the card surface, so their marks and borders turn near white on hover; ORCID, Zenodo and the Nexus orange keep their colour. LinkedIn is not in Simple Icons and keeps its glyph.
- **Logo sources.** Nexus Mods and OEIS are missing from Simple Icons 16.38.1; their official files are used unaltered and pinned by SHA-256. An automated re-download of the Nexus emblem hits a Cloudflare bot check, which was not bypassed; the file was retrieved in a browser and its hash is enforced by `make-brands.mjs`.
- **Orange.** `#f97316` is the fill of the emblem's four arms; contrast checked in `design-checks.mjs` (6.2:1 on `--surface`, 6.8:1 for `--bg` text on a pressed orange tile).
- **C\* interval.** Lower end from Paper II (arXiv 2609.13630), Proposition "Explicit global lower bound": C\* > 0.14056946887766…. Paper II gives the upper end only as U_4 = C_4(1/20000), so it comes from the ringmin repository's `knowledge/GLOBAL_BOUNDS_ASYMPTOTICS.md`: limsup R\*(n)/n² < 0.14199597951 (valid for C\* because Paper II proves the limit exists). Both are imported by `scripts/import-ringmin.mjs` with their source sentences and checked by `scripts/test-ringmin.mjs`.
- **Lessons button.** Filled but not `.primary-cta`, so the hero keeps the single primary action per view.
- **Privacy page skip link.** `<main>` had no `tabindex="-1"`, so the skip link could not move focus there (also on V3); fixed with that attribute only.
- **QA tooling.** `--task` accepts one sub-folder (`V4/before`), and `QA_SITE_ROOT` serves another built checkout, so before/after runs share one set of scripts. New: `scripts/qa/cert-loading.mjs` and `scripts/qa/overflow.mjs`.

## Logo sources and licences

| Mark | Source | Licence |
| --- | --- | --- |
| GitHub, Google Play, arXiv, Zenodo, ORCID | Simple Icons 16.38.1 (pinned; `siGithub`, `siGoogleplay`, `siArxiv`, `siZenodo`, `siOrcid`) | CC0-1.0 (brand owners' trademark guidelines still apply) |
| Nexus Mods | `https://next.nexusmods.com/assets/images/default/logo-emblem.svg`, SHA-256 `039ea05b…8418` | Trademark of Black Tree Gaming Ltd; no licence granted, used unaltered to identify links |
| OEIS | `https://oeis.org/favicon.svg`, SHA-256 `94f32c8d…0182` | Mark of The OEIS Foundation Inc.; site content CC BY-SA 4.0; used unaltered to identify links |

Details in `docs/unify/BRANDS.md`; regenerate with `node scripts/tools/make-brands.mjs`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
