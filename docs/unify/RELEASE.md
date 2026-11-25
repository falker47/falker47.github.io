# R1 release verification

The unified build serves nine pages and seven legacy URL aliases from 15 HTML files. `/Nexus-portfolio/` and `/Nexus-portfolio/index.html` share one file. The following measurements come from the R1 release evidence at `1361aa6`. [Audit JSON](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/audit.json) · [Build, tests and crawl](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/check.txt)

## Lighthouse and accessibility

Lighthouse 12.8.2 measured each URL in Italian and English on mobile and desktop. Every one of the 64 runs scored **100 for Accessibility and 100 for Best Practices**. All 64 corresponding axe scans reported **zero violations**. Performance passed the release floors of 95 on mobile and 98 on desktop. Each pair below reads **IT / EN**. SEO was identical on both devices for a given language and has no release threshold. [Lighthouse and axe results](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/audit.json)

| URL | Kind | Mobile performance | Desktop performance | SEO | HTML + CSS + JS (B) |
| --- | --- | ---: | ---: | ---: | ---: |
| `/` | Page | 97 / 97 | 100 / 100 | 100 / 92 | 144,299 |
| `/404.html` | Page | 100 / 100 | 100 / 100 | 69 / 69 | 38,938 |
| `/research/` | Page | 100 / 99 | 100 / 100 | 100 / 100 | 50,672 |
| `/projects/prof-gecko/` | Page | 99 / 100 | 100 / 100 | 100 / 100 | 47,643 |
| `/projects/camaleonte/` | Page | 99 / 99 | 100 / 100 | 100 / 100 | 47,963 |
| `/uses/` | Page | 100 / 100 | 100 / 100 | 100 / 100 | 51,350 |
| `/projects/social-viewer/` | Page | 99 / 100 | 100 / 100 | 100 / 100 | 48,107 |
| `/projects/social-viewer/test/` | Page | 100 / 100 | 100 / 100 | 69 / 69 | 50,717 |
| `/projects/social-viewer/privacy/` | Page | 100 / 99 | 100 / 100 | 100 / 100 | 57,418 |
| `/Nexus-portfolio/` | Stub | 100 / 100 | 100 / 100 | 100 / 100 | 23,707 |
| `/Nexus-portfolio/index.html` | Stub | 100 / 100 | 100 / 100 | 100 / 100 | 23,707 |
| `/Nexus-portfolio/research.html` | Stub | 100 / 100 | 100 / 100 | 100 / 100 | 23,668 |
| `/Nexus-portfolio/prof-gecko.html` | Stub | 100 / 100 | 100 / 100 | 100 / 100 | 23,734 |
| `/Nexus-portfolio/consigli.html` | Stub | 100 / 100 | 100 / 100 | 100 / 100 | 23,644 |
| `/Nexus-portfolio/testers.html` | Stub | 100 / 100 | 100 / 100 | 100 / 100 | 23,782 |
| `/Nexus-portfolio/socialviewer-privacy.html` | Stub | 100 / 100 | 100 / 100 | 100 / 100 | 23,800 |

## Home budgets

The largest page was the home at **144,299 B** of HTML, CSS and JS against a **160,000 B** limit. Its static initial-resource inventory was **231,269 B across 10 requests**. The cold-load limits were **450,000 B and 15 requests**. Lighthouse counts transferred bytes. The separate Playwright budget check sums the uncompressed sizes of the responses Chromium requested. [Audit measurements](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/audit.json) · [Validator output](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/check.txt)

| Language | Lighthouse profile | Transfer (B) | Requests | Playwright viewport | Response bodies (B) | Requests |
| --- | --- | ---: | ---: | --- | ---: | ---: |
| IT | Mobile | 233,765 | 11 | 390 px | 231,335 | 11 |
| EN | Mobile | 233,767 | 11 | 390 px | 231,335 | 11 |
| IT | Desktop | 271,137 | 14 | 1440 px | 260,447 | 13 |
| EN | Desktop | 271,137 | 14 | 1440 px | 260,447 | 13 |

The largest cold Lighthouse load was **271,137 B over 14 requests**. The 390 px Software panel measured 1,254 px in both languages, within its 1,500 px limit. All 80 page and panel layout checks passed, as did the 64 visible-language scans. [Home interactions](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/interactions.json) · [Layout results](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/layout.json) · [Language scans](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/i18n.json)

## Verified legacy URL map

`node scripts/qa/legacy.mjs --task R1` verified **59 Chromium navigations** on the local release build. These are the exact destinations recorded for the seven bare source URLs with an Italian browser locale and JavaScript enabled. Each source served a stub and `location.replace` opened the destination. [Redirect manifest](../../data/redirects.json) · [All 59 results](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/redirects.md)

| Old URL | Final URL reached | First → final HTTP |
| --- | --- | --- |
| `/Nexus-portfolio/` | `/?lang=it` | 200 → 200 |
| `/Nexus-portfolio/index.html` | `/?lang=it` | 200 → 200 |
| `/Nexus-portfolio/research.html` | `/research/?lang=it` | 200 → 200 |
| `/Nexus-portfolio/prof-gecko.html` | `/projects/prof-gecko/?lang=it` | 200 → 200 |
| `/Nexus-portfolio/consigli.html` | `/uses/?lang=it` | 200 → 200 |
| `/Nexus-portfolio/testers.html` | `/projects/social-viewer/test/?lang=it` | 200 → 200 |
| `/Nexus-portfolio/socialviewer-privacy.html` | `/projects/social-viewer/privacy/?lang=it` | 200 → 200 |

The other 52 navigations covered these cases. [Per-URL results](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/redirects.md)

| Case | Chromium result |
| --- | --- |
| Four English index links | Preserved `?lang=en&ref=a%2Bb`. Mapped `#projects` to `#progetti`, `#certifications` to `#certificazioni` and `#contact` to `#contatti`. Removed `#hero` to open the top of the page. All four returned 200 → 200. |
| Research deep link | `/Nexus-portfolio/research.html?lang=en#paper` reached `/research/?lang=en#paper`, 200 → 200. |
| JavaScript disabled | The old research URL reached `/research/` by native HTML refresh, 200 → 200. The static refresh target drops any incoming query and fragment. |
| Missing legacy project | `/Nexus-portfolio/projects/retired.html?lang=en` reached `/?lang=en#software`, 404 → 200. |
| Other missing legacy page | `/Nexus-portfolio/missing.html?lang=en` reached `/?lang=en`, 404 → 200. |
| Unknown site URL | `/missing-p6-page?lang=en` kept its URL and displayed the custom 404, 404 → 404. |
| 43 original assets | The portrait, both logos, tester preview, project images and certificate images returned 200 at their old URLs. Every response matched its original SHA-256. |

The migration also preserves the public home, its `?lang=it` and `?lang=en` forms, `/robots.txt`, `/sitemap.xml` and the public Nexus snapshot URL. Separate project Pages sites retain their own top-level paths. [URL map](URL-MAP.md) · [Original asset hashes](../../legacy/sha256.json)

## Changes from `consigli.html` to `/uses/`

The original and R1 list the same four products in the same order. Both Amazon Associate disclosure sentences, the paid-link labels and the four affiliate destinations are identical. The Italian title remains *Cosa utilizzo e consiglio*. The English title changed from *Use & recommendations* to *Tools I use and recommend*. Both introductions now describe equipment used at home, at the desk and on the road. [Original page](https://github.com/falker47/Nexus-portfolio/blob/f84932472973ccc009294236a68e156e8a0cff71/consigli.html) · [Original translations](https://github.com/falker47/Nexus-portfolio/blob/f84932472973ccc009294236a68e156e8a0cff71/js/translations.js) · [R1 page](../../src/pages/uses.mjs)

| Product | What changed in both editions | Amazon link ID |
| --- | --- | --- |
| 5G SIM router | The old example gave fixed-line service at €22–30/month, a data SIM at €8–13/month and potential savings of about 50%. R1 asks readers to check indoor reception and compare their own allowance and monthly cost. | `B01Um942w` |
| Portable USB-C monitor | A shorter account retains the backpack, second screen and single cable for power and video on Maurizio’s PC. The category changed from *Smart working* / *Remote work* to *Lavoro in viaggio* / *Working away from home*. | `B0cuqIZyw` |
| Multi-port GaN charger | The description focuses on charging several devices and saving space in a bag. It drops the original charging-speed claim. | `B04ikrTOS` |
| Solar Wi-Fi camera | The copy retains motion alerts, two-way audio, sunlight and the Wi-Fi requirement. It drops the detail about tuning detection settings. | `B0h5EUEl1` |

- The old page put the disclosure after the introduction and editorial criteria after the products. R1 puts the illustrated equipment sheet and criteria first, then the disclosure and the four product cards. The shorter category labels and icons replace the four product subtitles. The list uses two columns on desktop and one on mobile.
- The Amazon link text is shorter in both languages. Its accessible name includes the product. Each link now opens in the current tab with `rel="sponsored noopener"`. The previous links opened a new tab with `rel="sponsored noopener noreferrer"`. The price figures in the old router copy referred to service plans. [Italian copy](../../data/i18n/it.json) · [English copy](../../data/i18n/en.json)
- Shared site navigation replaces the former header, flags, scroll indicator, back-to-top control and footer. The page links back to the home Software tab. The canonical and sharing URLs now point to `/uses/`. Local artwork, icons, fonts and bundled scripts replace the previous external assets. Share previews use the localized title and description, the equipment illustration and a `summary` card. [R1 page](../../src/pages/uses.mjs) · [Shared head](../../src/partials/head.mjs)

## Known limits

- The scores and redirect results describe a loopback build. Lighthouse and axe held automatic navigation while measuring the stubs. The migration run followed them with normal browser navigation. The local link crawler lists external destinations without contacting them. Public URL ownership, Google Play links and the Pages cutover have separate production checks. [Go-live runbook](GO-LIVE.md)
- Italian is the static language and the English switch relies on JavaScript. The 404 and tester pages carry `noindex` and scored 69 for SEO. The English home scored 92. The optional styleguide was outside the release build. [Route declarations](../../src/routes.mjs) · [Audit JSON](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/audit.json)
- Against the F3 baseline, all six hero regions had zero geometry change in both languages at both widths. The visible hero crops matched pixel for pixel. Full-page hero crops differed by up to one RGB level. The optional strict pixel comparison detects that difference. [Hero comparison](https://github.com/falker47/falker47.github.io/blob/1361aa65d59e784c034bba67c77cfa738fee40ff/_review/R1/hero-comparison.json)
