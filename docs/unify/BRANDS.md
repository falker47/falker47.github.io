# Platform marks

External action buttons show the mark of the platform they open, left of the label (V4). The marks live in `data/brands.json`; `src/partials/icons.mjs` adds a mark to a page's icon sprite only when the page uses it. `node scripts/tools/make-brands.mjs` regenerates the file. Marks are copied as published, never redrawn.

| Mark | Source | Version or retrieval | Licence or terms |
| --- | --- | --- | --- |
| GitHub | [Simple Icons](https://github.com/simple-icons/simple-icons) `siGithub` (source: github.com/logos) | simple-icons 16.38.1 | CC0-1.0; GitHub trademark guidelines apply |
| Google Play | Simple Icons `siGoogleplay` (source: Google Partner Marketing Hub) | simple-icons 16.38.1 | CC0-1.0; Google brand guidelines apply |
| arXiv | Simple Icons `siArxiv` (source: arxiv.org) | simple-icons 16.38.1 | CC0-1.0; [arXiv brand](https://arxiv.org/about/brand) |
| Zenodo | Simple Icons `siZenodo` (source: about.zenodo.org) | simple-icons 16.38.1 | CC0-1.0 |
| ORCID | Simple Icons `siOrcid` (source: ORCID iD icon graphics on figshare) | simple-icons 16.38.1 | CC0-1.0; [ORCID brand guidelines](https://info.orcid.org/brand-guidelines/) |
| Nexus Mods | Official emblem, `https://next.nexusmods.com/assets/images/default/logo-emblem.svg` | Retrieved 2026-11-24 in a browser; SHA-256 `039ea05b89f10092b7b684052fa1d02832bd1a606358534ed8767c80f4888418` | Trademark of Black Tree Gaming Ltd. No licence is granted; the emblem is shown unaltered, at icon size, only to identify links to Nexus Mods |
| OEIS | Official favicon, `https://oeis.org/favicon.svg` | Retrieved 2026-11-24; SHA-256 `94f32c8db8859225dc65a159f65ac3fe7ef475440a846bc4a410c7cdaae60182` | Mark of The OEIS Foundation Inc.; site content CC BY-SA 4.0 ([End-User License Agreement](https://oeis.org/wiki/The_OEIS_End-User_License_Agreement)). Shown unaltered to identify links to oeis.org |
| LinkedIn (V5) | Simple Icons `linkedin.svg`, `https://unpkg.com/simple-icons@10.4.0/icons/linkedin.svg` | simple-icons 10.4.0, retrieved 2026-11-25; SHA-256 `2687ac468d96bd03e748dc8646ef6465cb4cc7f34b96e1d0bc86fcb3dd79121a` | CC0-1.0; [LinkedIn brand guidelines](https://brand.linkedin.com/) apply. One-colour mark: the "Su di me" profile row paints it LinkedIn blue `#0a66c2` with white behind the letters |
| arXiv logomark (V5) | The three strokes of the X (paths 4–6) of the official primary logo, `https://static.arxiv.org/static/design-system/latest/logos/arxiv-logo.svg`, framed by their own square viewBox | Retrieved 2026-11-25; SHA-256 `ce0353650c0d4c1af4e2a777dfd0b64e7079a42d16dbb2aa4fe3d924975d9000` | Registered trademark of arXiv. Its [name and logo use](https://info.arxiv.org/brand/brand-guidelines.html) guidelines allow the logo to acknowledge arXiv data and ask that it is never altered, recoloured or set on a background that impairs it: the "Su di me" tile shows it unaltered, in Cornell red and Library grey, on a light square. The card buttons keep the Simple Icons arXiv mark |

Simple Icons has neither Nexus Mods nor OEIS (checked in 16.38.1), so those two come from the platforms' own files. It dropped LinkedIn after 10.x, so `make-brands.mjs` reads the last CC0 drawing from a pinned file too, and it takes the arXiv logomark out of the official primary logo (`paths` and `viewBox` in its entry). `make-brands.mjs` reads them from `<HOME>/sources/brand/` and refuses a file whose SHA-256 differs from the pinned hash. Nexus Mods serves its emblem behind a bot check, so an automated download returns an HTML challenge page: fetch it in a browser and compare the hash. Neither platform publishes a press kit with a separate licence for the mark.

## Colours

- One-colour marks (the Simple Icons set) take the text colour of their button. On hover and focus the mark takes the brand colour from Simple Icons, and so does the button border (on the home cards, a line along the top of the button). Where that colour reads below 3:1 on the card surface `#171a21` (GitHub `#181717`, Google Play `#414141`, arXiv `#b31b1b`), they turn near white (`#f1f4f5`) instead.
- Several-colour marks (Nexus Mods, OEIS) always keep their published colours.
- The Modding tab uses the Nexus Mods orange `#f97316`, the fill of the emblem's arms in `logo-emblem.svg`. The download bars run from it to the amber `#fbbf24`. Both pass 4.5:1 on every dark surface (`scripts/design-checks.mjs`), and the page background `#0f1014` passes 4.5:1 on the orange of a pressed pill.
