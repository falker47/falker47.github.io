# Home compatta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Su di me" becomes a carousel with two-up figure tiles and coherent icons; Research uses the project card in a rail; Lessons sit side by side on desktop; project covers open their detail page.

**Architecture:** Build-time HTML from `src/pages/home/*.mjs` (escaping `html` template), styles in `src/styles/sections.css`, behaviour in `src/client/components.js` (no template literals, no block comments). `scripts/validate-home.mjs` asserts the rendered markup from the data (run by `node scripts/check.mjs`); `scripts/qa/interactions.mjs` drives Chromium.

**Tech Stack:** Node 22 standard library; Playwright/axe/Lighthouse from `~/qa-tools`.

**Spec:** `docs/superpowers/specs/2026-11-25-home-compatta-design.md`

## Global Constraints

- Italian HTML readable with JavaScript disabled: all four about rows visible and stacked, nav controls `hidden` until the script runs.
- Every visible string and accessible label paired in `data/i18n/it.json` and `en.json`; labels via `data-label`, text via `data-i18n`.
- Home budget: ≤ 235,000 bytes HTML+CSS+JS, ≤ 180,000 HTML; cold load ≤ 450,000 bytes and 15 requests.
- Targets ≥ 44 px (`:where(.about,.work) :is(a, button) {min-height:var(--target)}`); reduced motion disables animation.
- Lighthouse Performance ≥ 90 mobile / ≥ 95 desktop, Accessibility 100, Best Practices ≥ 95, zero axe violations, zero i18n leaks.
- Brand marks: source and licence recorded in `data/brands.json` and `docs/unify/BRANDS.md`.
- Hero, header, `desktop-visual-sizing` bytes untouched.

## Review Focus

- Deep link `/#certificazioni` on a fresh load: Chi sono opens, the carousel shows slide 2 and the page stops 76 px above the fan (interactions `checkFragments`).
- Tab from the last link of slide 1 into slide 2: the track follows the focus, dots and counter update, no vertical offset is left inside the track (`scrollTop === 0`).
- Language switch while on slide 3: labels change, slide and height stay.
- Resize from 390 to 1440 px on slide 2: the track keeps slide 2 aligned (no half slide) and its height matches the slide.
- Hover over the certificate fan after reaching slide 2 by swipe: the caption names the card (existing `checkCertificates`, now reached through the carousel).

---

### Task 1: Carousel in "Su di me", two-up tiles, quote removed

**Files:**
- Modify: `src/pages/home/about.mjs` (`aboutSection`, `aboutRow`)
- Modify: `src/styles/sections.css` (Chi sono block and media queries)
- Modify: `src/client/components.js` (new carousel block, `reveal()`)
- Modify: `data/i18n/it.json`, `data/i18n/en.json`
- Modify: `scripts/validate-home.mjs` (`checkAbout`), `scripts/qa/interactions.mjs` (`home`, `checkFragments`, `checkNoScript`)
- Modify: `AGENTS.md` (paragraph on the home)

**Interfaces:**
- Produces markup:
  `<div class="about-carousel"><div class="about-rows">` + four `<div class="about-row" data-slide="0..3">` (unchanged inner `<p data-i18n>` + `<figure>`) + `</div>` + `<div class="about-nav" hidden>` with `<button type="button" class="about-step" data-step="-1" data-label="aboutPrevious">`, four `<button type="button" class="about-dot" data-slide="N" data-label="aboutDot{Studies|Work|Approach|Spare}">`, `<p class="about-count" aria-hidden="true"><span class="about-index">1</span> / 4</p>`, `<button … data-step="1" data-label="aboutNext">`.
- Produces client state: `.about-carousel.about-enhanced`, active dot `aria-current="true"`, track inline `height`.
- New keys: `aboutPrevious` "Paragrafo precedente" / "Previous paragraph", `aboutNext` "Paragrafo successivo" / "Next paragraph", `aboutDotStudies` "Studi" / "Studies", `aboutDotWork` "Lavoro" / "Work", `aboutDotApproach` "Progetti" / "Projects", `aboutDotSpare` "Tempo libero" / "Spare time". Removed key: `philosophy`.

- [ ] **Step 1: Update `checkAbout` in `scripts/validate-home.mjs`**

Rows regex accepts `<div class="about-row" data-slide="(\d)">`; assert slides `['0','1','2','3']`. Assert `!about.includes('class="philosophy"')`. Order list drops `class="philosophy"` and inserts `class="about-nav"` before `class="research-links about-actions"`. Assert the nav: `hidden`, two `about-step`, four `about-dot` with the four `data-label` keys in order, count text `1 / 4`.

- [ ] **Step 2: Run `node scripts/build.mjs && node scripts/validate-site.mjs` — expect FAIL on the about rows**

- [ ] **Step 3: Implement markup, keys and CSS**

CSS without script: unchanged column layout. Under `.about-enhanced`: `.about-rows` becomes `display:grid;grid-auto-flow:column;grid-auto-columns:100%;column-gap:24px;align-items:start;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none;transition:height .3s ease`; rows `scroll-snap-align:start`, no top border. `.about-nav` flex row (arrows reuse `.rail-step` look; dots 44×44 hit area, 8 px visual dot, active dot in `--blue`). From 900 px every row is text left, figure right (drop the `:nth-child(even)` rules); first row keeps `minmax(0,1fr) minmax(0,400px)`. `.facts-list` → `grid-template-columns:repeat(2,minmax(0,1fr))` at every width; on phones `.fact` stacks glyph above value (`grid-template-columns:1fr`) so labels fit. Remove `.philosophy` rule.

- [ ] **Step 4: Implement the carousel in `components.js`**

For each `.about-carousel`: `go(index, smooth)` scrolls the track to `rows[index].offsetLeft`; on `scroll` (rAF-throttled) the index is `Math.round(track.scrollLeft / track.clientWidth)`; `sync(index)` sets dot `aria-current`, counter text, steps `disabled` at the ends, `track.style.height = rows[index].offsetHeight + 'px'`, `track.scrollTop = 0`. `ResizeObserver` on track and rows re-syncs and realigns `scrollLeft` to the current slide. `focusin` inside a row syncs to that row. Reduced motion → `behavior:'auto'` and `transition:none`. Add `about-enhanced`, unhide nav. In `reveal()`: when the target is inside `.about-row`, call the carousel's `go(row index, false)` before scrolling the page (expose via `carousel.aboutGo = go`).

- [ ] **Step 5: Update `interactions.mjs`**

`home()`: rows measured per slide after `go`-ing to it by clicking its dot; at ≥ 900 px the figure is right of the text for all four; arrows/dots move slides (`about-index` text 1→2→1); track height equals the active row's height ±1; phone swipe: `track.evaluate(n => n.scrollTo({left:n.clientWidth}))` → counter `2`. `checkFragments`: `/#certificazioni` also asserts the active dot is `data-slide="1"`. `checkNoScript`: `.about-row:visible` count 4 and `.about-nav` hidden.

- [ ] **Step 6: Run `node scripts/check.mjs` — expect PASS; then `MSYS_NO_PATHCONV=1 node scripts/qa/interactions.mjs --task V5 --pages /` — expect PASS**

- [ ] **Step 7: Update `AGENTS.md`** (about rows: carousel, text left from 900 px, two-up tiles; quote gone) **and commit** `V5: carousel in "Su di me", two-up figures, quote removed`

### Task 2: Badge icons on the figures, original marks on the profile links

**Files:**
- Modify: `data/brands.json` (add `linkedin`; arXiv colour logomark if the official file is usable), `docs/unify/BRANDS.md`
- Modify: `src/partials/icons.mjs` (`brandHosts` + `linkedin.com`; new drawings `terminal-solid`, `star-solid`, `ringmin`)
- Modify: `src/pages/home/about.mjs` (`figures`, `actions`, `icons`)
- Modify: `src/styles/sections.css` (`.fact-glyph`, `.about-action`)
- Modify: `scripts/validate-home.mjs` (`expectedBrand`, facts glyph ids, about links)

**Interfaces:**
- Consumes: Task 1 markup (facts inside slides).
- Produces: `brand('linkedin')`; `brandFor('https://www.linkedin.com/…') === 'linkedin'`; icons `terminal-solid`, `star-solid`, `ringmin`.

- [ ] **Step 1: Update `validate-home.mjs`**: facts glyph ids become `icon-terminal-solid`, `brand-nexusmods`, `icon-star-solid`, `brand-arxiv`; `expectedBrand` maps `linkedin.com` → `linkedin`; about links: LinkedIn/GitHub/OEIS/ORCID carry their brand, Ripetizioni contains `<img src="/assets/images/letuelezioni.png"`, Ricerca contains `href="#icon-ringmin"`.
- [ ] **Step 2: Build + `validate-site.mjs` — expect FAIL on the facts glyphs**
- [ ] **Step 3: Implement.** LinkedIn "in" path from the last CC0 Simple Icons release that shipped it (record version, licence, LinkedIn brand guidelines URL), colour `#0a66c2`, `mono:false` with fill set. arXiv: official logomark from `https://arxiv.org/about/brand` if its terms allow; otherwise the existing CC0 path, white on `#b31b1b`. `.fact-glyph`: solid gradient square `linear-gradient(145deg, var(--tone), color-mix(in srgb,var(--tone) 60%,#000))`, glyph `#fff`, 1 px inner highlight; Nexus keeps its own emblem. Profile links: marks in brand colours (GitHub `#f1f4f5`, ORCID `#a6ce39`, LinkedIn `#0a66c2`, OEIS as is), Letuelezioni PNG 18 px without the grayscale filter, `ringmin` in `#a78bfa`. Titles keep `--blue`.
- [ ] **Step 4: `node scripts/check.mjs` — expect PASS; screenshot `/#chi-sono` at 390 and 1440 for a visual check**
- [ ] **Step 5: Commit** `V5: badge icons on the figures, original marks on the profile links`

### Task 3: Research as project cards, Lessons side by side, covers open the detail page

**Files:**
- Modify: `src/pages/home/work.mjs` (`paperCard`, research panel, `projectCard`)
- Modify: `src/styles/sections.css` (remove `.paper-cards`/`.paper-card` layout rules no longer used, `.lesson-cards` from 900 px, `.cover-chip`)
- Modify: `data/i18n/it.json`, `en.json` (remove `paperILine`, `paperIILine`)
- Modify: `scripts/validate-home.mjs` (`checkResearch`, `checkSoftware`), `scripts/qa/interactions.mjs` (research block), `AGENTS.md`

**Interfaces:**
- Produces: research panel `rail(copy, [paperCard…])` where `paperCard(t, paper, figure, repo, extra)` returns `<li class="card paper-card">` with `<div class="card-cover paper-figure">`, `<h4>`, `<p class="card-meta"><span class="pill">Paper I</span><span class="card-stack">arXiv 2607.28654</span></p>` (Paper II stack adds ` · ` + the C* interval line), `<p class="card-summary">` = `paper…Highlight`, `<p class="card-links">` arXiv + GitHub.
- Produces: `projectCard` cover for projects with `page`: `<a class="card-cover" href="{page}" tabindex="-1" aria-hidden="true">{img}<span class="cover-chip"><span data-i18n="projectPage">Scheda</span> →</span></a>`.

- [ ] **Step 1: Update validators.** `checkResearch`: cards from `<li class="card paper-card">` inside `.rail`, pill/stack/summary as above, C* interval inside Paper II stack, no `paper-highlight`/`card-label`. `checkSoftware`: expected hrefs `[page, page, ...shown]` when `project.page`, and the cover link has `tabindex="-1"` and `aria-hidden="true"`. `checkLessons` unchanged.
- [ ] **Step 2: Build + `validate-site.mjs` — expect FAIL on research cards**
- [ ] **Step 3: Implement.** Paper h4 uses the card font (drop the serif override); drawings keep 16:9 in `.card-cover`. `.lesson-cards` `grid-template-columns:1fr 1fr` from 900 px. `.cover-chip` bottom-left on the cover, `font:600 11px var(--name)`, dark translucent pill with `--cat` border; visible always.
- [ ] **Step 4: Update `interactions.mjs`** research block: `checkCardButtons(page.locator('#panel-research .rail'))`, phone card width 70–80% of the row.
- [ ] **Step 5: `node scripts/check.mjs` and `interactions.mjs --pages /` — expect PASS**
- [ ] **Step 6: Update `AGENTS.md`** (research cards in a rail, covers link to detail pages) **and commit** `V5: research cards like the projects, lessons side by side, covers open the detail page`

### Task 4: Release QA and draft PR

- [ ] **Step 1:** `node scripts/build.mjs --styleguide`, then with `--task V5`: `audit.mjs` (retry with `QA_CHROME_FLAGS=--disable-gpu` if the GPU stalls), `release-layout.mjs`, `i18n-check.mjs`, `legacy.mjs`, `social-viewer.mjs`, `screenshots.mjs --pages /,/#chi-sono,/#ricerca,/#tab-teaching --langs it,en --format webp`. Expected: every gate at its floor, zero leaks, zero axe violations.
- [ ] **Step 2:** Visual check in the browser pane at 390 and 1440 px of the four changed areas.
- [ ] **Step 3:** Push `claude/v5-compact`, open a draft PR to `main` with the before/after numbers (Chi sono height at 390 px: ~2,290 px before).
