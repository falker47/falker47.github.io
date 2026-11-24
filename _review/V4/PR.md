V4 refines the unified site (V3, #23): nine visual changes, every figure and string built from `data/` in Italian and English, tests updated for the new data. Base: `claude/v3-fusion`.

## Changes (before → after)

Each image puts the V3 build on the left and this branch on the right; the full capture matrix (IT/EN, 1440×900 and 390×844, "Chi sono" and "I miei progetti" open, every tab) is in `_review/V4/before/` and `_review/V4/after/`.

1. **Chi sono: facts card replaces "Percorso".** One text column with both paragraphs; from 900 px a facts card on the right, 2×2 below the text on narrower screens. Figures are counted at build time: 14 software projects (App + Giochi + Strumenti), 10.871 / 10,871 Nexus unique downloads (the live counter of the Modding tab), 2 arXiv papers, 11 certifications; each links to its section (`#progetti`, `#panel-modding`, `#ricerca`, `#certificazioni`). Quote, profile links and certificate fan stay. ![1](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/01-about-facts.webp?raw=true) ![1 phone](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/01-about-facts-390.webp?raw=true)
2. **Certificates load faster.** Thumbnails now come at 300w and 480w (`sizes="150px"`), and the home starts them after the load event (`requestIdleCallback`, 2 s timeout, `setTimeout` fallback; skipped with Save-Data) or as soon as the "Chi sono" summary gets the pointer, focus or a touch. A card under the pointer or the focus preloads its 960 px viewer image. Same look; measurements below. ![2](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/02-certificates.webp?raw=true)
3. **Filter pills.** "App 4 · Giochi 5 · Strumenti 5" and "Mod 10 · Traduzioni 17": text only, 44 px tall, the pressed pill filled with the panel accent (blue on Software, Nexus orange on Modding), the others outlined. Same component on both panels; counts from the data. ![3](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/03-filter-pills.webp?raw=true) ![3 phone](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/03-filter-pills-390.webp?raw=true)
4. **Brand marks on external actions.** One helper, `actionLink`, renders every external action: GitHub, Google Play, Nexus Mods, arXiv, Zenodo, ORCID and OEIS show their mark left of the label and take the brand colour on hover (border and mark); other links keep an arrow icon (→ inside the site, e.g. "Prova l'app", ↗ elsewhere, e.g. "Apri"). Applied to project, mod and paper cards, the research footnote, the "Chi sono" profile row, the project pages and the site footer. Marks are inlined into the page's icon sprite only when used. ![4](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/04-brand-buttons.webp?raw=true)
5. **Modding in Nexus Mods orange.** No violet left in the panel: `--nexus: #f97316` (the emblem's fill), download bars `#f97316 → #fbbf24`, orange game chips, Nexus buttons and translation headers, the Nexus emblem in every Nexus button and before the "download unici" summary. ![5](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/05-nexus-orange.webp?raw=true)
6. **Paper II chart against 1/n.** x from 0 to 1/3 with labels n = ∞, 18, 10, 6, 4, 3 at their 1/n positions and a "1/n" title; filled dots certified, hollow non-exhaustive (legend sentence updated in IT/EN). At x = 0 a short band marks the certified interval for C*, labelled "C* ∈ [0,1405; 0,1420]" (outward-rounded, localized), above the dashed 1/8 lower-bound line. A faint dashed segment extends the last two points to x = 0; it lands at 0.1396, beside the band, so it stays. ![6](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/06-cstar-chart.webp?raw=true) ![6 phone](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/06-cstar-chart-390.webp?raw=true)
7. **Lessons.** From 900 px: title, text and "Scopri le lezioni →" on the left; the lead and the Letuelezioni and Superprof boxes on the right. Below 900 px the text and CTA come first. The separate "Lezioni individuali" box is gone. ![7](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/07-lessons.webp?raw=true) ![7 phone](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/07-lessons-390.webp?raw=true)
   English copy, written for English readers:
   - Title: *Maths and physics lessons*
   - Text: *I have a degree in physics, and since 2023 I've been helping middle and high school students in Parma and online. We start wherever you get stuck and go through every step in full, with digital notes and guided exercises that you keep after the lesson.*
   - CTA: *Explore the lessons*
   - Lead: *Curious what my students say? These are the sites where I teach.*
8. **Footer signature links home** on every page (`/`), underlined and blue on hover and focus. ![8](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/08-footer-link.webp?raw=true) ![8 home](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/08-footer-link-home.webp?raw=true)
9. **"Cosa uso" / "What I use" in the header**, after the existing items, on desktop and in the phone menu, `aria-current="page"` on `/uses/`. ![9](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/09-nav-uses.webp?raw=true) ![9 phone](https://github.com/falker47/falker47.github.io/blob/claude/v4-polish/_review/V4/compare/09-nav-menu-390.webp?raw=true)

## Measurements

### Certificate fan, time to visible on "Fast 4G"

Chrome DevTools' Fast 4G preset (165 ms RTT, 9 Mbit/s down), cold cache, 3 runs each, median shown. The clock runs from the click on "Chi sono" (the page then scrolls to the fan) until all 11 thumbnails have loaded and decoded. Script: `node scripts/qa/cert-loading.mjs --task V4/measurements --label after [--root <V3 _site>]`; raw data and request traces in `_review/V4/measurements/`.

| Reader | 1440 px, V3 → V4 | 390 px (DPR 2.75), V3 → V4 |
| --- | --- | --- |
| opens "Chi sono" 3 s after load | 684 → **17 ms** | 697 → **25 ms** |
| opens it at the load event | 676 → **468 ms** | 704 → **544 ms** |
| points at the summary, opens 300 ms later | 682 → **72 ms** | 703 → **174 ms** |

**Cause, from the network trace of the V3 build:** the thumbnails are `loading="lazy"` inside the closed `<details>`, so Chromium does not request any of them until the section opens. In every V3 run the first thumbnail request starts 135–165 ms *after* the click, and all 11 then compete on the throttled link. Their weight was not the bottleneck (176 KB in total). In V4 the requests start up to 3 s *before* the click, and at 1440 px the 300w files halve the transfer (82 KB instead of 176 KB; phones at DPR 2.75 still pick the 480w files).

### Budgets

- Cold home load (unchanged gate, now excluding the idle prefetch): 351,655 bytes / 11 requests at 1440 px, 292,252 / 11 at 390 px (limits 450,000 / 15).
- The idle prefetch after the load event has its own gate (`checkDeferred`): only certificate thumbnails, at most one per certificate, ≤ 200,000 bytes; measured 82,078 bytes at 1440 px and 175,708 at 390 px. Lighthouse applies the same split.
- Home HTML+CSS+JS 212,328 bytes (limit 220,000).

### Lighthouse (performance / accessibility), V3 → V4

| Route | IT mobile | IT desktop | EN mobile | EN desktop |
| --- | --- | --- | --- | --- |
| / | 95/100 → 93/100 | 99/100 → 100/100 | 93/100 → 94/100 | 98/100 → 99/100 |
| /404.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /research/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 99/100 → 100/100 |
| /projects/prof-gecko/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /projects/camaleonte/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /uses/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /projects/social-viewer/ | 99/100 → 100/100 | 100/100 → 100/100 | 99/100 → 100/100 | 100/100 → 100/100 |
| /projects/social-viewer/test/ | 100/100 → 100/100 | 100/100 → 100/100 | 99/100 → 100/100 | 100/100 → 100/100 |
| /projects/social-viewer/privacy/ | 99/100 → 99/100 | 100/100 → 100/100 | 99/100 → 99/100 | 100/100 → 100/100 |
| /Nexus-portfolio/ | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /Nexus-portfolio/index.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /Nexus-portfolio/research.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /Nexus-portfolio/prof-gecko.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /Nexus-portfolio/consigli.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /Nexus-portfolio/testers.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /Nexus-portfolio/socialviewer-privacy.html | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |
| /projects/ | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 | 100/100 → 100/100 |

Floors: performance ≥ 90 mobile and ≥ 95 desktop, accessibility 100, best practices ≥ 95; axe: 0 violations in all 68 runs (17 routes and stubs × IT/EN × 1440/390), as on V3. Every row passes; raw data in `_review/V4/before-audit/` and `_review/V4/after-audit/`.

## Checks

- `node scripts/check.mjs`: pass (build, HTML/budget validation, 72 tests, link crawl, cold-browser load at both viewports).
- `scripts/qa/audit.mjs`: PASS on every route and stub (table above).
- `scripts/qa/legacy.mjs`: 79 browser navigations verified.
- `scripts/qa/i18n-check.mjs`: 0 language leaks, 0 scan errors on every page and interaction state (the new pills included).
- `scripts/qa/release-layout.mjs`: 92 page and panel layouts, 0 failures.
- `scripts/qa/interactions.mjs`: pass on `/`, `/research/`, `/uses/`, the three project pages, the Social Viewer test page and `/404.html` (see Decisions for the privacy page); `scripts/qa/social-viewer.mjs`: 19 checks pass.
- `scripts/qa/overflow.mjs`: 150 layouts (every route and home state × IT/EN × 360/390/768/1024/1440 px, phone menu open), 0 with horizontal overflow. Reduced motion: captures and interactions run with `prefers-reduced-motion: reduce`, no running animations in the reflow check, the card lift stays off; the new transitions are colour-only.

## Decisions

- **Change 2, prefetch accounting.** The cold-load gate (450 KB / 15 requests) now counts the idle certificate prefetch separately instead of being raised: requests before and around the load event stay under the old limits, and the thumbnails after it have a dedicated limit (≤ 11 requests, ≤ 200 KB, nothing else allowed). Without this, Lighthouse and the cold-browser check would count 22 requests.
- **Change 1, Nexus figure.** Shown exactly (10.871 / 10,871), not as "11k": five digits fit the card at every width and match the Modding tab's counter, which the facts card reuses, so it follows the live snapshot and the language switch. The projects figure counts the software categories only (App, Giochi, Strumenti = 14); Ringmin lives in the Research tab and is counted as a paper. The Nexus figure links to `#panel-modding`, which the deep-link code opens on the Modding tab.
- **Change 3, ARIA.** The pills keep the V3 semantics, a labelled `role="group"` of toggle buttons with `aria-pressed`, exactly one pressed: a correct pattern, natively keyboard-operable (Tab, Enter, Space). "Panel accent" is read as one accent per panel (blue / Nexus orange), not the per-category colour, which still marks the cards.
- **Change 4, colours on hover.** GitHub `#181717`, Google Play `#414141` and arXiv `#b31b1b` are below 3:1 on the card surface, so their marks and borders turn near white on hover instead; ORCID, Zenodo and the Nexus orange keep their brand colour. Nexus Mods and OEIS marks keep their published colours at all times. LinkedIn is not in Simple Icons (removed upstream) and is not in the list, so it keeps its existing glyph. The trailing ↗ is dropped where a mark identifies the destination.
- **Change 4, logo sources.** Nexus Mods and OEIS are missing from Simple Icons 16.38.1; their official files are used unaltered and pinned by SHA-256 (see the table below). An automated re-download of the Nexus emblem today hits a Cloudflare bot check, which I did not try to bypass; the file in `~/sources/brand/` was retrieved in a browser earlier today and its hash is enforced by `make-brands.mjs`.
- **Change 5, orange.** `#f97316` is the fill of the emblem's four arms in `logo-emblem.svg` (the lighter `#fb923c` is its disc); the lighter amber of the gradient is `#fbbf24`. Contrast on the dark surfaces is checked in `design-checks.mjs`: `#f97316` 6.2:1 on `--surface`, `#fbbf24` higher, and `--bg` text 6.8:1 on a pressed orange pill.
- **Change 6, C\* interval.** Lower end from Paper II (arXiv 2609.13630), Proposition "Explicit global lower bound": C\* ≥ C_term + η_width > 0.14056946887766…. Paper II states the upper end only as U_4 = C_4(1/20000), with no decimal value, so the upper end comes from the ringmin repository's `knowledge/GLOBAL_BOUNDS_ASYMPTOTICS.md`: the exact directed-enclosure bound limsup R\*(n)/n² < 0.14199597951 (valid for C\* because Paper II proves the limit exists). No number was invented; both are imported by `scripts/import-ringmin.mjs` with their source sentences and checked by `scripts/test-ringmin.mjs`. The label rounds outward to four decimals.
- **Change 7.** The teaching panel drops its one-line intro ("Do ripetizioni … dal gennaio 2023"), which the new text repeats. The CTA is a filled button but not `.primary-cta`, so the hero keeps the single primary action per view.
- **Change 9.** On the home the three section links stay fragments; "Cosa uso" is the only path link. The phone menu is now 4 × 48 px tall; one interaction test now clicks 300 px below the top of `<main>` instead of 200 to stay clear of it.
- **Outside the nine changes.** `/projects/social-viewer/privacy/` had no `tabindex="-1"` on `<main>`, so the skip link could not move focus there (also on V3); fixed with that attribute only. The page's inline legal links (e.g. the e-mail address) are still below 44 px in the reflow check; this is pre-existing, the text is a fixed legal snapshot, and V3 did not run `interactions.mjs` on it either. The Social Viewer checks (`social-viewer.mjs`) pass.
- **QA tooling.** `--task` accepts one sub-folder (`V4/before`), and `QA_SITE_ROOT` serves another built checkout, so before/after runs share one set of scripts. New: `scripts/qa/cert-loading.mjs` and `scripts/qa/overflow.mjs` (all routes and home states at 360, 390, 768, 1024, 1440 px, phone menu open).
- **Earlier attempt.** An earlier, interrupted session had left half-reverted edits in this worktree. They were saved as a patch outside the repository and the branch restarted from 7594622; nothing from it was committed except the two official brand files it had downloaded (kept outside the repository and hash-pinned).

## Logo sources and licences

| Mark | Source | Licence |
| --- | --- | --- |
| GitHub, Google Play, arXiv, Zenodo, ORCID | Simple Icons 16.38.1 (pinned; `siGithub`, `siGoogleplay`, `siArxiv`, `siZenodo`, `siOrcid`) | CC0-1.0 (brand owners' trademark guidelines still apply) |
| Nexus Mods | `https://next.nexusmods.com/assets/images/default/logo-emblem.svg`, SHA-256 `039ea05b…8418` | Trademark of Black Tree Gaming Ltd; no licence granted, used unaltered to identify links |
| OEIS | `https://oeis.org/favicon.svg`, SHA-256 `94f32c8d…0182` | Mark of The OEIS Foundation Inc.; site content CC BY-SA 4.0; used unaltered to identify links |

Details in `docs/unify/BRANDS.md`; regenerate with `node scripts/tools/make-brands.mjs`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
