# "Su di me" a zig-zag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn "Su di me" into four paragraph/figure rows in a zig-zag, with the site's figures (and a new aggregated tutoring rating) inside the figures, replacing the "In breve" card.

**Architecture:** `aboutSection` in `src/pages/home/about.mjs` renders one `.about-row` per paragraph: the `<p>` and then its `<figure>`. Figures reuse the existing `.fact` tile markup; G1 is a decorative inline SVG. The rating is computed at build time from `data/tutoring.json` by a small pure module. Zig-zag is CSS only.

**Tech Stack:** Node 22 standard library, `node:test`, static HTML/CSS, Playwright QA from `~/qa-tools`.

**Spec:** `docs/superpowers/specs/2026-11-25-su-di-me-zigzag-design.md`

## Global Constraints

- Home limits: HTML ≤ 180,000 bytes, HTML+CSS+JS ≤ 230,000 bytes (`scripts/validate-site.mjs`).
- Every visible string is paired in `data/i18n/it.json` and `data/i18n/en.json`, or rendered with `localized({ it, en })`.
- Figures are counted from data at build time; the Nexus figure keeps `data-i18n="moddingNumber"` (live counter).
- Links: certificates `#certificazioni`, projects `#progetti`, Nexus `#panel-modding`, rating `#panel-teaching`, papers `#ricerca`.
- Anchor `#chi-sono` and `<details class="about" id="chi-sono">` stay unchanged (closed by default).
- Tones: software `#60a5fa`, modding `#f97316`, research `#a78bfa`, credentials `#4ade80`, rating `#facc15`.
- Zig-zag from 900 px; below 900 px each figure follows its paragraph.
- Run every command from `C:/Users/Falker/code/falker47-wt/V4`; in Git Bash prefix route arguments with `MSYS_NO_PATHCONV=1`.

## Review Focus

- Language switch to EN: rating shows "5.0" and "from 12 reviews", topic chips and G1 labels switch too.
- Nexus live counter: the G3 tile keeps updating from the snapshot like the Modding tab.
- Widths 900–1100 px: the tiles in the narrower figure column do not overflow (`scripts/qa/overflow.mjs`).
- One review on a portal total: "su 1 recensione" / "from 1 review" (singular).
- A portal with `scale` ≠ 5 is normalised to five stars before averaging.

---

### Task 1: Aggregated rating

**Files:**
- Create: `src/lib/rating.mjs`
- Test: `scripts/test-rating.mjs`

**Interfaces:**
- Produces: `aggregateRating(ratings: {score:number, scale:number, ratings:number}[]) -> { score: number, count: number } | null` (score on a 5 scale, weighted by `ratings`; `null` when the total is 0).
- Produces: `formatScore(score: number, lang: 'it'|'en') -> string` (exactly one decimal, `Intl.NumberFormat` of the lang).

- [ ] **Step 1: Write the failing tests** in `scripts/test-rating.mjs`:

```js
test('weights each portal by its ratings', () => {
  assert.deepEqual(aggregateRating([{ score: 5, scale: 5, ratings: 10 }, { score: 5, scale: 5, ratings: 2 }]), { score: 5, count: 12 });
  assert.deepEqual(aggregateRating([{ score: 4, scale: 5, ratings: 1 }, { score: 5, scale: 5, ratings: 3 }]), { score: 4.75, count: 4 });
});
test('normalises other scales to five', () => {
  assert.deepEqual(aggregateRating([{ score: 8, scale: 10, ratings: 2 }]), { score: 4, count: 2 });
});
test('no ratings, no figure', () => assert.equal(aggregateRating([{ score: 5, scale: 5, ratings: 0 }]), null));
test('one decimal in each language', () => {
  assert.equal(formatScore(5, 'it'), '5,0'); assert.equal(formatScore(5, 'en'), '5.0');
  assert.equal(formatScore(4.75, 'it'), '4,8');
});
```

- [ ] **Step 2:** `node --test scripts/test-rating.mjs` → FAIL (module not found).
- [ ] **Step 3:** Implement both functions in `src/lib/rating.mjs`.
- [ ] **Step 4:** `node --test scripts/test-rating.mjs` → PASS.
- [ ] **Step 5:** Commit `V4: aggregated tutoring rating from the portals`.

### Task 2: Rows, figures, styles and the home validator

**Files:**
- Modify: `src/pages/home/about.mjs` (replace `aboutText`, `facts`, `factsCard`; `aboutSection` body)
- Modify: `src/partials/icons.mjs` (add `star`: path `m12 2.5 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z`, the one in `work.mjs`)
- Create: `src/partials/about-studies.mjs` (G1 SVG)
- Modify: `data/i18n/it.json`, `data/i18n/en.json`
- Modify: `src/styles/sections.css` (lines 18–35), `src/styles/tokens.css` (`--star: #facc15`), `scripts/design-checks.mjs`
- Modify: `scripts/validate-home.mjs` (`checkAbout`), `scripts/test-home.mjs` (test at line 73)

**Interfaces:**
- Consumes: `aggregateRating`, `formatScore` from Task 1.
- Produces: `export const aboutRows: { text: string, figure: 'studies'|'work'|'approach'|'spare' }[]` in `about.mjs`, order `aboutStudies, aboutWork, aboutApproach, aboutSpare`.
- Produces markup (Task 3 relies on these classes):
  - `<div class="about-rows">` › 4 × `<div class="about-row">` › `<p data-i18n="aboutX">` then `<figure class="about-figure figure-<name>">`.
  - G1: `<figure class="about-figure figure-studies" aria-hidden="true">` with the SVG; labels `<text data-i18n="figurePhysics">` / `figureComputing`.
  - Others: `<ul class="facts-list">` of `<li><a class="fact fact-<tone>" href="…">` with the current `.fact-glyph` / `.fact-value` / `.fact-label` children.
  - Certificates tile adds `<span class="fact-topics">` with four `<span data-i18n="topicX">` after `.fact-label`.
  - Rating tile: tone `tutoring`, glyph `icon('star')`, value `localized({ it: formatScore(s,'it'), en: formatScore(s,'en') })`, label `localized` from `ratingReviewsOne`/`ratingReviewsOther` with `{count}`; omitted when `aggregateRating` returns `null`.

New i18n keys (IT / EN): `figurePhysics` Fisica / Physics · `figureComputing` Informatica / Computer science · `topicBlockchain` Blockchain / Blockchain · `topicDataScience` Data science / Data science · `topicMachineLearning` Machine learning / Machine learning · `topicGenerativeAi` AI generativa / Generative AI · `ratingReviewsOne` su {count} recensione / from {count} review · `ratingReviewsOther` su {count} recensioni / from {count} reviews. Remove `factsTitle`.

- [ ] **Step 1: Rewrite `checkAbout` and the test first.** In `validate-home.mjs` the expected figures, in row order, become:

```js
[['#certificazioni', italian(certificates.length), 'certificazioni', 'credentials', 'icon-medal'],
 ['#progetti', italian(software), 'progetti software', 'software', 'icon-code'],
 ['#panel-modding', italian(snapshot.uniqueModDownloads), 'download unici su Nexus Mods', 'modding', 'brand-nexusmods'],
 ['#panel-teaching', '5,0', 'su 12 recensioni', 'tutoring', 'icon-star'],   // from aggregateRating(tutoring.ratings)
 ['#ricerca', italian(research.papers.length), 'articoli su arXiv', 'research', 'brand-arxiv']]
```

  Order assertion: `aboutStudies, figure-studies, aboutWork, fact-credentials, aboutApproach, fact-software, fact-modding, aboutSpare, fact-tutoring, fact-research, philosophy, about-actions, credentials`; assert no `about-facts` / `facts-grid`. In `test-home.mjs` (line 73, rename to "Su di me …") replace the facts mutations with: dropping `fact-tutoring` → throws `/Facts/`; `href="#panel-teaching"` → `href="/lessons/"` throws `/Facts/`; swapping the `aboutWork` and `aboutApproach` rows throws `/order/`.
- [ ] **Step 2:** `node scripts/build.mjs && node --test scripts/test-home.mjs` → FAIL on the old markup.
- [ ] **Step 3:** Implement markup, G1 partial (≈ 300×170 viewBox, strokes `--stroke`, as in the approved mock B), i18n keys, `star` icon.
- [ ] **Step 4:** CSS: `.about-row {display:grid;gap:20px;padding:18px 0;border-top:1px solid var(--rule-soft)}`; from 900 px `grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:32px;align-items:center`, `.about-row:nth-child(even)` swaps the columns and gives the figure `order:-1`. Figures: `--surface` card, radius 14px. `.facts-list` one column of tiles; `.fact-tutoring {--tone:var(--star)}`; `.fact-topics` small chips. Remove `.about-facts`, `.facts-grid`. In `design-checks.mjs` add `contrast('--star', '--surface', 3)`.
- [ ] **Step 5:** `node scripts/check.mjs` → exit 0, `fail 0`, budgets pass.
- [ ] **Step 6:** Commit `V4: "Su di me" as a zig-zag, figures beside their paragraphs`.

### Task 3: Browser QA for the new layout

**Files:**
- Modify: `scripts/qa/interactions.mjs:341-349`

**Interfaces:**
- Consumes: the classes from Task 2.

- [ ] **Step 1:** Replace the facts-card layout check: for each `.about-row`, at ≥ 900 px the figure is right of the paragraph on odd rows and left on even rows (`figure.right <= p.left + 1`); below 900 px `figure.top >= p.bottom - 1`. After switching to EN (existing helper), the rating tile reads `5.0` and `from 12 reviews`.
- [ ] **Step 2:** `MSYS_NO_PATHCONV=1 node scripts/qa/interactions.mjs --task V4/after-qa` → pass on `/`; then `node scripts/qa/overflow.mjs --task V4/after-qa` → 0 overflowing layouts.
- [ ] **Step 3:** Commit `V4: QA for the "Su di me" rows`.

### Task 4: Docs and evidence

**Files:**
- Modify: `AGENTS.md` (the "facts card" sentence in the home paragraph), `README.md` if it mentions "In breve"
- Regenerate: `_review/V4/after/` and `_review/V4/compare/` captures of "Su di me" (existing screenshots script, `--format webp`)

- [ ] **Step 1:** Update the docs to describe rows and figures; regenerate the "Su di me" captures at 1440 and 390 in IT and EN.
- [ ] **Step 2:** `node scripts/check.mjs` → exit 0.
- [ ] **Step 3:** Commit `V4: docs and evidence for "Su di me"`. Do not push; the PR 24 description is updated after Maurizio sees the preview.
