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

Simple Icons has neither Nexus Mods nor OEIS (checked in 16.38.1), so those two come from the platforms' own files. `make-brands.mjs` reads them from `<HOME>/sources/brand/` and refuses a file whose SHA-256 differs from the pinned hash. Nexus Mods serves its emblem behind a bot check, so an automated download returns an HTML challenge page: fetch it in a browser and compare the hash. Neither platform publishes a press kit with a separate licence for the mark.

## Colours

- One-colour marks (the Simple Icons set) take the text colour of their button. On hover and focus the mark takes the brand colour from Simple Icons, and so does the button border (on the home cards, a line along the top of the button). Where that colour reads below 3:1 on the card surface `#171a21` (GitHub `#181717`, Google Play `#414141`, arXiv `#b31b1b`), they turn near white (`#f1f4f5`) instead.
- Several-colour marks (Nexus Mods, OEIS) always keep their published colours.
- The Modding tab uses the Nexus Mods orange `#f97316`, the fill of the emblem's arms in `logo-emblem.svg`. The download bars run from it to the amber `#fbbf24`. Both pass 4.5:1 on every dark surface (`scripts/design-checks.mjs`), and the page background `#0f1014` passes 4.5:1 on the orange of a pressed pill.
