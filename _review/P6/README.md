# P6 review evidence

The [Chromium navigation table](redirects.md) records the first response and final URL for all seven legacy sources, the home fragments, both 404 recovery paths and the 43 original images. The five destinations owned by P2 and P3 return 404 on this branch. Their stubs already return 200.

The 404 uses the live language switch. Each legacy stub has a single bilingual fallback that is readable in either locale. The screenshots capture the original HTML bytes with JavaScript disabled and a loopback-only sandbox holding the immediate meta refresh. A separate navigation in the table verifies that the refresh works with JavaScript disabled on the normal server.

Lighthouse and axe need JavaScript to run their audits. Only for those stub audits, the loopback server wraps the redirect script and refresh tag in an inert HTML template. The published body, styles and links remain byte-identical. The 404 and styleguide run directly. [Lighthouse scores](lighthouse.json) · [axe results](axe.json) · [Screenshot network log](network.json)

## Screenshots

Desktop uses 1440 × 900 and mobile uses 390 × 844. Each cell links to the viewport and full page. The styleguide is included because it previews the shared status panel.

| Page | IT desktop | IT mobile | EN desktop | EN mobile |
| --- | --- | --- | --- | --- |
| `/404.html` | [Viewport](404.html-it-1440.webp) · [Full](404.html-it-1440-full.webp) | [Viewport](404.html-it-390.webp) · [Full](404.html-it-390-full.webp) | [Viewport](404.html-en-1440.webp) · [Full](404.html-en-1440-full.webp) | [Viewport](404.html-en-390.webp) · [Full](404.html-en-390-full.webp) |
| `/Nexus-portfolio/` | [Viewport](Nexus-portfolio-it-1440.webp) · [Full](Nexus-portfolio-it-1440-full.webp) | [Viewport](Nexus-portfolio-it-390.webp) · [Full](Nexus-portfolio-it-390-full.webp) | [Viewport](Nexus-portfolio-en-1440.webp) · [Full](Nexus-portfolio-en-1440-full.webp) | [Viewport](Nexus-portfolio-en-390.webp) · [Full](Nexus-portfolio-en-390-full.webp) |
| `/Nexus-portfolio/index.html` | [Viewport](Nexus-portfolio-index.html-it-1440.webp) · [Full](Nexus-portfolio-index.html-it-1440-full.webp) | [Viewport](Nexus-portfolio-index.html-it-390.webp) · [Full](Nexus-portfolio-index.html-it-390-full.webp) | [Viewport](Nexus-portfolio-index.html-en-1440.webp) · [Full](Nexus-portfolio-index.html-en-1440-full.webp) | [Viewport](Nexus-portfolio-index.html-en-390.webp) · [Full](Nexus-portfolio-index.html-en-390-full.webp) |
| `/Nexus-portfolio/research.html` | [Viewport](Nexus-portfolio-research.html-it-1440.webp) · [Full](Nexus-portfolio-research.html-it-1440-full.webp) | [Viewport](Nexus-portfolio-research.html-it-390.webp) · [Full](Nexus-portfolio-research.html-it-390-full.webp) | [Viewport](Nexus-portfolio-research.html-en-1440.webp) · [Full](Nexus-portfolio-research.html-en-1440-full.webp) | [Viewport](Nexus-portfolio-research.html-en-390.webp) · [Full](Nexus-portfolio-research.html-en-390-full.webp) |
| `/Nexus-portfolio/prof-gecko.html` | [Viewport](Nexus-portfolio-prof-gecko.html-it-1440.webp) · [Full](Nexus-portfolio-prof-gecko.html-it-1440-full.webp) | [Viewport](Nexus-portfolio-prof-gecko.html-it-390.webp) · [Full](Nexus-portfolio-prof-gecko.html-it-390-full.webp) | [Viewport](Nexus-portfolio-prof-gecko.html-en-1440.webp) · [Full](Nexus-portfolio-prof-gecko.html-en-1440-full.webp) | [Viewport](Nexus-portfolio-prof-gecko.html-en-390.webp) · [Full](Nexus-portfolio-prof-gecko.html-en-390-full.webp) |
| `/Nexus-portfolio/consigli.html` | [Viewport](Nexus-portfolio-consigli.html-it-1440.webp) · [Full](Nexus-portfolio-consigli.html-it-1440-full.webp) | [Viewport](Nexus-portfolio-consigli.html-it-390.webp) · [Full](Nexus-portfolio-consigli.html-it-390-full.webp) | [Viewport](Nexus-portfolio-consigli.html-en-1440.webp) · [Full](Nexus-portfolio-consigli.html-en-1440-full.webp) | [Viewport](Nexus-portfolio-consigli.html-en-390.webp) · [Full](Nexus-portfolio-consigli.html-en-390-full.webp) |
| `/Nexus-portfolio/testers.html` | [Viewport](Nexus-portfolio-testers.html-it-1440.webp) · [Full](Nexus-portfolio-testers.html-it-1440-full.webp) | [Viewport](Nexus-portfolio-testers.html-it-390.webp) · [Full](Nexus-portfolio-testers.html-it-390-full.webp) | [Viewport](Nexus-portfolio-testers.html-en-1440.webp) · [Full](Nexus-portfolio-testers.html-en-1440-full.webp) | [Viewport](Nexus-portfolio-testers.html-en-390.webp) · [Full](Nexus-portfolio-testers.html-en-390-full.webp) |
| `/Nexus-portfolio/socialviewer-privacy.html` | [Viewport](Nexus-portfolio-socialviewer-privacy.html-it-1440.webp) · [Full](Nexus-portfolio-socialviewer-privacy.html-it-1440-full.webp) | [Viewport](Nexus-portfolio-socialviewer-privacy.html-it-390.webp) · [Full](Nexus-portfolio-socialviewer-privacy.html-it-390-full.webp) | [Viewport](Nexus-portfolio-socialviewer-privacy.html-en-1440.webp) · [Full](Nexus-portfolio-socialviewer-privacy.html-en-1440-full.webp) | [Viewport](Nexus-portfolio-socialviewer-privacy.html-en-390.webp) · [Full](Nexus-portfolio-socialviewer-privacy.html-en-390-full.webp) |
| `/styleguide/` | [Viewport](styleguide-it-1440.webp) · [Full](styleguide-it-1440-full.webp) | [Viewport](styleguide-it-390.webp) · [Full](styleguide-it-390-full.webp) | [Viewport](styleguide-en-1440.webp) · [Full](styleguide-en-1440-full.webp) | [Viewport](styleguide-en-390.webp) · [Full](styleguide-en-390-full.webp) |

## Reproduce

Run from the worktree with the shared browser QA tools installed. `check.mjs` builds the production site. The screenshot and audit commands below use the QA build, which also contains the styleguide.

```powershell
node scripts/check.mjs
```

```powershell
node scripts/build.mjs --styleguide
```

```powershell
node scripts/qa/legacy.mjs --task P6
```

```powershell
$p6Pages = '/404.html,/Nexus-portfolio/,/Nexus-portfolio/index.html,/Nexus-portfolio/research.html,/Nexus-portfolio/prof-gecko.html,/Nexus-portfolio/consigli.html,/Nexus-portfolio/testers.html,/Nexus-portfolio/socialviewer-privacy.html,/styleguide/'
```

```powershell
node scripts/qa/screenshots.mjs --task P6 --pages $p6Pages --langs it,en --format webp
```

```powershell
node scripts/qa/lighthouse.mjs --task P6 --pages $p6Pages --langs it,en --min-a11y 100
```

```powershell
node scripts/qa/axe.mjs --task P6 --pages $p6Pages --langs it,en
```
