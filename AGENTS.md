# Working on falker47.github.io

The static site builds with Node 22 and its standard library. Run commands from the checkout root.

## Commands

- `node scripts/build.mjs` renders the routes into `_site/`.
- `node scripts/check.mjs` rebuilds, validates every HTML file, runs every `scripts/**/test-*.mjs` file and crawls local links and assets. CI uses the same command.
- `node scripts/qa/serve.mjs` prints a free loopback URL. Directory routes redirect to their trailing slash. Missing paths serve `404.html` with status 404 when the file exists.
- `node scripts/qa/screenshots.mjs --task F1 --pages / --langs it,en` captures both viewports at reduced motion.
- `node scripts/qa/lighthouse.mjs --task F1 --pages / --min-perf-mobile 90 --min-perf-desktop 95 --min-a11y 95 --min-bp 95` records the category scores.
- `node scripts/qa/axe.mjs --task F1 --pages /` checks both languages and viewports. Serious and critical violations fail the run.

Browser QA reads Playwright, Lighthouse and axe from `~/qa-tools` and the Chromium executable from `~/qa-tools/chrome-path.txt`. Review artifacts belong in `_review/<task>/`. Build, validation, tests and the link crawl work without those installations.

## Layout and rendering

`src/routes.mjs` declares public URLs and page metadata. Each module in `src/pages/` exports `render(ctx)`. The build maps a directory route to its `index.html` and a file route to its filename. Shared head, header, language switch and footer live in `src/partials/`.

Use the escaping `html` template from `src/lib/html.mjs`. Wrap trusted rendered components in `raw()`. Put styles in `src/styles/`, browser scripts in `src/client/`, self-hosted assets in `assets/` and structured data in `data/`. The two original browser scripts retain their public URLs under `scripts/`.

The Italian HTML is readable with JavaScript disabled. Use keys from both `data/i18n/` dictionaries in page text, accessible labels and descriptions. The layout embeds the keys used on the route. Keep the `portfolio:languagechange` event for live Nexus totals. The snapshot supplies the initial localized numbers.

## Project boundaries

Keep the approved home blueprint, including the inline `desktop-visual-sizing` block. Follow [the design brief](docs/unify/BRIEF.md) and [URL map](docs/unify/URL-MAP.md) for later tasks.

Use static HTML, CSS and vanilla browser JavaScript with self-hosted assets. The public Nexus snapshot is the sole external runtime fetch. Its scheduled updater owns `data/nexus-downloads.json`. Preserve its metric, parser tests and restricted commit scope.

Project Pages sites have their own repositories. Keep their top-level paths reserved. F1 records the seven legacy redirect sources as a migration plan. P6 owns the `Nexus-portfolio/` stubs and legacy assets. P6 sets the redirect manifest status to `active`. An active manifest or a local legacy mount makes the crawler require every redirect source locally.

Work on the task branch in its dedicated worktree and deliver a draft PR to the assigned base. Production deployment belongs to `main`. Keep build output, dependencies and reference clones out of commits.
