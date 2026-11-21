# Working on falker47.github.io

The static site builds with Node 22 and its standard library. Run commands from the checkout root.

## Commands

- `node scripts/build.mjs` renders the routes into `_site/`.
- `node scripts/check.mjs` rebuilds, validates every HTML file, runs every `scripts/**/test-*.mjs` file and crawls local links and assets. CI uses the same command.
- `node scripts/qa/serve.mjs` prints a free loopback URL. Directory routes redirect to their trailing slash. Missing paths serve `404.html` with status 404 when the file exists.
- `node scripts/qa/screenshots.mjs --task F1 --pages / --langs it,en` captures both viewports at reduced motion.
- `node scripts/qa/lighthouse.mjs --task P5 --pages /` records cold mobile and desktop scores, transferred bytes, requests, LCP and CLS in Italian and English.
- `node scripts/qa/axe.mjs --task P5 --pages /` checks both languages and viewports. Any violation fails the run.
- `node scripts/qa/audit.mjs --task R1` audits the current `_site/`, including every declared route, every existing redirect stub and the styleguide if built. `_review/R1/audit.json` records each result and exits nonzero on a missing gate. The thresholds are 95 mobile, 98 desktop, 100 Accessibility, 95 Best Practices and zero axe violations.

Browser QA reads Playwright, Lighthouse and axe from `~/qa-tools` and the Chromium executable from `~/qa-tools/chrome-path.txt`. Review artifacts belong in `_review/<task>/`. The static budgets, tests and link crawl work with Node alone. With Chromium configured, the validator also checks actual cold home requests at both viewports and in both languages. CI uses its installed Chrome and a temporary copy of Playwright.

## Catalogue images

Run `node scripts/tools/make-images.mjs` from the worktree to rebuild the committed WebPs and their dimensions. It reads `~/sources/Nexus-portfolio/assets`, the two Skyrim PNGs in `~/sources/mods` and Sharp from `~/qa-tools` via `createRequire`. CI validates the committed files with Node alone. A second run with identical inputs leaves every output byte intact.

Project and mod covers target 480 and 960 px at quality 80. The hero target is 1440 px for Ringmin, Prof. Gecko, Camaleonte and Social Viewer. The source dimensions after orientation and cropping cap every target. Duplicate widths collapse to one rendition. Covers outside the 5% tolerance are cropped to 16:9. Keep the Social Viewer wordmark in frame with a left-aligned crop. Certificates retain the complete page at both widths, and the portrait keeps its square frame. Power-Ringmin shares Ringmin’s diagram. Each catalogue WebP is at most 300,000 bytes and their combined budget is 4,000,000 bytes.

Use `picture(media, { sizes, lang })` or `img(media, options)` from `src/lib/media.mjs`. The helpers read localized alt text and actual image dimensions from the data. Set `fetchpriority: 'high'` only for an image that supplies the page's LCP. Text supplies the home LCP. Inspect the complete catalogue on the QA-only `/styleguide/` after `node scripts/build.mjs --styleguide`. For size-limited review evidence, add `--format webp` to the screenshots command. Home captures use lossless encoding. `compare-hero.mjs --baseline PATH --baseline-task F2 --task F3 --format webp --exact` checks every pixel against the archived F2 PNGs as well as the hero geometry.

## Layout and rendering

`src/routes.mjs` declares public URLs and page metadata. Each module in `src/pages/` exports `render(ctx)`. The build maps a directory route to its `index.html` and a file route to its filename. Shared head, header, language switch and footer live in `src/partials/`.

The build inlines up to 14,000 bytes of CSS. Larger pages inline the shared first-paint styles and preload one content-addressed stylesheet, with a native stylesheet fallback for disabled JavaScript. The desktop sizing block stays byte-identical. The validator counts delivered HTML, CSS and JS (160,000 bytes per page) and initial home assets. The audit also enforces 450,000 transferred bytes and 15 actual requests for each cold home load.

Use the escaping `html` template from `src/lib/html.mjs`. Wrap trusted rendered components in `raw()`. Put styles in `src/styles/`, browser scripts in `src/client/`, self-hosted assets in `assets/` and structured data in `data/`. The two original browser scripts retain their public URLs under `scripts/`.

The Italian HTML is readable with JavaScript disabled. Use keys from both `data/i18n/` dictionaries in page text, accessible labels and descriptions. The layout embeds the keys used on the route. Keep the `portfolio:languagechange` event for live Nexus totals. The snapshot supplies the initial localized numbers.

## Project boundaries

Keep the approved home blueprint, including the inline `desktop-visual-sizing` block. Follow [the design brief](docs/unify/BRIEF.md) and [URL map](docs/unify/URL-MAP.md) for later tasks.

Use static HTML, CSS and vanilla browser JavaScript with self-hosted assets. The public Nexus snapshot is the sole external runtime fetch. Its scheduled updater owns `data/nexus-downloads.json`. Preserve its metric, parser tests and restricted commit scope.

`Deploy Pages` checks out `main` for pushes, manual runs and successful completions of `Refresh Nexus Mods downloads` on `main`. A successful refresh also rebuilds Pages when the snapshot is already current.

Project Pages sites have their own repositories. Keep their top-level paths reserved. F1 records the seven legacy redirect sources as a migration plan. P6 owns the `Nexus-portfolio/` stubs and legacy assets. P6 sets the redirect manifest status to `active`. An active manifest or a local legacy mount makes the crawler require every redirect source locally.

Work on the task branch in its dedicated worktree and deliver a draft PR to the assigned base. Production deployment belongs to `main`. Keep build output, dependencies and reference clones out of commits.
