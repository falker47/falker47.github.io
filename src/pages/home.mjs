import { software, mods, ratings } from './home-examples.mjs';
import { html, raw } from '../lib/html.mjs';
import { icon } from '../partials/icons.mjs';
import { disclosure, modRow, primaryCta, ratingCard, registerRow, statTile, tabs } from '../partials/components.mjs';

export const jobTitle = 'AI & Digital Innovation Specialist';

export const graph = [
  {
    "@type": "WebSite",
    "@id": "https://falker47.github.io/#website",
    "url": "https://falker47.github.io/",
    "name": "Maurizio Falconi",
    "alternateName": "falker47",
    "publisher": {
      "@id": "https://falker47.github.io/#person"
    }
  },
  {
    "@type": "ProfilePage",
    "@id": "https://falker47.github.io/#profile",
    "url": "https://falker47.github.io/",
    "name": "Maurizio Falconi (falker47)",
    "primaryImageOfPage": {
      "@id": "https://falker47.github.io/#profile-image"
    },
    "mainEntity": {
      "@id": "https://falker47.github.io/#person"
    }
  },
  {
    "@type": "Person",
    "@id": "https://falker47.github.io/#person",
    "name": "Maurizio Falconi",
    "alternateName": "falker47",
    "url": "https://falker47.github.io/",
    "image": {
      "@id": "https://falker47.github.io/#profile-image"
    },
    "jobTitle": jobTitle,
    "description": "Sviluppo applicazioni e strumenti, creo mod per videogiochi e porto avanti ricerca matematica indipendente.",
    "sameAs": [
      "https://falker47.github.io/Nexus-portfolio/",
      "https://github.com/falker47",
      "https://www.linkedin.com/in/mauriziofalconi/",
      "https://www.instagram.com/falker47/",
      "https://orcid.org/0009-0005-3162-3651",
      "https://scholar.google.com/citations?user=5xHRNvoAAAAJ",
      "https://oeis.org/wiki/User:Maurizio_Falconi"
    ],
    "knowsAbout": [
      "Data Engineering",
      "Applied AI",
      "Automation",
      "Algorithms",
      "Computational Research"
    ]
  },
  {
    "@type": "ImageObject",
    "@id": "https://falker47.github.io/#profile-image",
    "contentUrl": "https://falker47.github.io/assets/images/maurizio-falconi.webp",
    "url": "https://falker47.github.io/assets/images/maurizio-falconi.webp",
    "name": "Maurizio Falconi (falker47)",
    "caption": "Maurizio Falconi, known online as falker47"
  }
];

const paperUrls = ["https://arxiv.org/abs/2607.28654","https://arxiv.org/abs/2609.13630"];
const lessonUrls = ["https://falker47.github.io/mauriziofalconi-ripetizioni/"];

export function render(ctx) {
  const { t, copy } = ctx;
  return html`<main id="main" tabindex="-1">
<section class="hero" aria-label="Maurizio Falconi">
<div class="hero-lead"><h1><span data-i18n="headlineStart">${t('headlineStart')}</span><em data-i18n="headlineEnd">${t('headlineEnd')}</em></h1>
${raw(primaryCta(t, 'cta', '#progetti'))}</div>
<figure class="engine-figure" aria-label="${copy.it.diagramTitle}" data-label="diagramTitle" aria-describedby="diagram-description">
<div class="engine-art" aria-hidden="true" data-identity-diagram="v1"><svg class="engine desktop-engine" viewBox="0 0 720 590" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="desktop-idea-light"><stop stop-color="#e4f6ff" stop-opacity=".8"/><stop offset=".42" stop-color="#a4dcff" stop-opacity=".42"/><stop offset="1" stop-color="#86d5ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="desktop-glass" x1="0" y1="0" x2="100%" y2="100%"><stop stop-color="#1c415c"/><stop offset="1" stop-color="#0b2034"/></linearGradient>
  <linearGradient id="desktop-insert" x1="0" y1="0" x2="100%" y2="100%"><stop stop-color="#76c6f2" stop-opacity=".3"/><stop offset="1" stop-color="#1a5276" stop-opacity=".25"/></linearGradient>
  </defs>
<g class="channel"><path d="M78.5 334.2C112 334.2 160 299.55 213.3 299.55M310 300C397 300 391 90 484 90M310 300C355 300 355 278 397 278C439 278 439 300 484 300M310 300C397 300 391 500 493 500"/></g>
<path class="signal signal-input" pathLength="100" d="M78.5 334.2C112 334.2 160 299.55 213.3 299.55"/><path class="signal signal-output" pathLength="100" d="M310 300C397 300 391 90 484 90"/><path class="signal signal-output" pathLength="100" d="M310 300C355 300 355 278 397 278C439 278 439 300 484 300"/><path class="signal signal-output" pathLength="100" d="M310 300C397 300 391 500 493 500"/>
<g class="arrow"><path d="m205.3 296.55 6 3-6 3ZM479 87l6 3-6 3ZM479 297l6 3-6 3ZM488 497l6 3-6 3Z"/></g>
<text class="node-title stage-title diagram-label" x="65" y="220" data-i18n="idea" text-anchor="middle">${t('idea')}</text><g transform="translate(20.9 246) scale(.9)"><g class="idea-art bulb-art">
<path class="datum" d="M49-5v132M3 42h92"/>
<path class="artifact-panel bulb-envelope" fill="url(#desktop-glass)" d="M49 2C25 2 10 20 10 42c0 19 11 28 19 38 4 5 5 11 5 18h30c0-7 1-13 5-18 8-10 19-19 19-38C88 20 73 2 49 2Z"/>
<ellipse class="idea-light" cx="49" cy="51" rx="36" ry="45" fill="url(#desktop-idea-light)"/>
<path class="artifact-bright bulb-filament" d="M41 96V75L33 58l16 9 16-9-8 17v21"/>
<path class="artifact-line" d="M34 98v12l6 10h18l6-10V98M34 104h30M37 112h24"/>
<circle class="port small bulb-port" cx="64" cy="98" r="2.6"/>
</g></g>
<text class="node-title stage-title diagram-label" x="261.75" y="220" data-i18n="model" text-anchor="middle">${t('model')}</text><g transform="translate(200 234) scale(.95)"><g class="model-art"><path class="model-charge" d="M14 35 65 6l51 29v68l-51 29-51-29Z"/>
  <path class="datum" d="M65-5v148M-10 71h150M8 23l115 66M8 89 123 23"/>
  <path class="model-top" fill="url(#desktop-glass)" d="M14 35 65 6l51 29-51 30Z"/>
  <path class="artifact-line" d="M14 35 65 6l51 29v68l-51 29-51-29ZM14 35l51 30 51-30M65 65v67"/>
  <path class="artifact-bright" d="m14 69 51 29 51-29M39 49V20M91 49V20"/>
  <path class="model-piece" fill="url(#desktop-insert)" d="m65 65 26-15v33L65 98Z"/>
  <path class="artifact-bright" d="m65 65 26-15v33L65 98Z"/>
  <circle class="port" cx="65" cy="65" r="4"/><circle class="port small" cx="14" cy="69" r="2"/><circle class="port small" cx="116" cy="69" r="2"/>
  </g></g>
<g transform="translate(489 35)"><g class="software-art">
  <rect class="ghost-line" x="15" y="0" width="142" height="96" rx="6"/>
  <path class="datum" d="M20 2V-7M152 2V-7M20-3h132"/>
  <rect class="artifact-panel" fill="url(#desktop-glass)" x="0" y="14" width="148" height="98" rx="6"/>
  <path class="artifact-line" d="M0 32h148"/>
  <circle class="port small" cx="10" cy="23" r="1.6"/><circle class="port small" cx="17" cy="23" r="1.6"/><circle class="port small" cx="24" cy="23" r="1.6"/>
  <rect class="screen-sidebar" x="9" y="43" width="23" height="57" rx="3"/>
  <path class="artifact-line quiet" d="M15 51h11M15 60h8M15 69h11M15 89h8"/>
  <g class="app-component"><path class="artifact-bright" d="M44 46h65M44 52h40"/><rect class="screen-block" x="44" y="63" width="76" height="19" rx="3"/><rect class="screen-block" x="44" y="89" width="33" height="12" rx="2"/><path class="artifact-line quiet" d="M85 92h26M85 98h17"/></g>
  <rect class="artifact-panel phone" x="126" y="48" width="43" height="79" rx="8"/>
  <path class="artifact-line quiet" d="M141 54h13M141 120h13"/>
  <g class="app-component"><rect class="screen-block" x="133" y="64" width="29" height="21" rx="3"/><path class="artifact-line" d="M133 93h27M133 100h18"/><path class="artifact-bright verification" d="m143 109 3 3 7-7"/></g>
  </g></g><text class="artifact-title diagram-label" x="573.5" y="17" data-i18n="softwareLabel" text-anchor="middle">${t('softwareLabel')}</text>
<g transform="translate(489 240)"><g class="modding-art">
  <path class="ghost-line" d="M0 35h34v72H0ZM140 35h28v72h-28Z"/>
  <path class="base-link" d="M34 61h14M106 61h34M17 107v10h137v-10"/>
  <path class="artifact-line quiet" d="M8 48h18M8 58h10M8 91h18M148 48h12M148 91h12"/>
  <path class="old-module" transform="translate(34 -22)" d="M62 25h58v27h-14v19h14v27H62V80H48V43h14Z"/>
  <path class="datum" d="M92 21 114 3M120 99l34-22"/>
  <path class="slot" d="M58 21h66v82H58Z"/>
  <g class="mod-piece"><path class="artifact-panel insert" fill="url(#desktop-insert)" d="M62 25h58v27h-14v19h14v27H62V80H48V43h14Z"/><path class="artifact-bright" d="m71 47 12 12 15-16M83 59v23"/><circle class="port small" cx="71" cy="47" r="2.4"/><circle class="port small" cx="98" cy="43" r="2.4"/><circle class="port small" cx="83" cy="82" r="2.4"/><path class="artifact-bright verification" d="m112 106 4 4 9-10"/></g>
  </g></g><text class="artifact-title diagram-label" x="573" y="222" data-i18n="moddingLabel" text-anchor="middle">${t('moddingLabel')}</text>
<g transform="translate(490 435)"><g class="research-art">
  <path class="datum" d="M0 65h173M85 3v129M28 65 118 20 143 77 70 115Z"/>
  <circle class="research-core" fill="url(#desktop-glass)" cx="85" cy="65" r="36"/>
  <circle class="artifact-bright" pathLength="100" cx="85" cy="65" r="36"/>
  <circle class="artifact-line" pathLength="100" cx="28" cy="65" r="21"/><circle class="artifact-line" pathLength="100" cx="118" cy="20" r="20"/>
  <circle class="artifact-line" pathLength="100" cx="143" cy="77" r="24"/><circle class="artifact-line" pathLength="100" cx="70" cy="115" r="15"/>
  <path class="artifact-bright radius" pathLength="100" d="M85 65h36M121 61v8M85 61v8"/>
  <path class="datum" d="M49 58v14M85 65 108 38"/>
  <circle class="port verification" cx="49" cy="65" r="2.8"/><circle class="port small" cx="85" cy="65" r="2.4"/>
  <text class="radius-label" x="99" y="58">r</text>
  </g></g><text class="artifact-title diagram-label" x="577" y="417" data-i18n="researchLabel" text-anchor="middle">${t('researchLabel')}</text>
</svg>
<svg class="engine mobile-engine" viewBox="0 0 360 286" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="mobile-idea-light"><stop stop-color="#e4f6ff" stop-opacity=".8"/><stop offset=".42" stop-color="#a4dcff" stop-opacity=".42"/><stop offset="1" stop-color="#86d5ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="mobile-glass" x1="0" y1="0" x2="100%" y2="100%"><stop stop-color="#1c415c"/><stop offset="1" stop-color="#0b2034"/></linearGradient>
  <linearGradient id="mobile-insert" x1="0" y1="0" x2="100%" y2="100%"><stop stop-color="#76c6f2" stop-opacity=".3"/><stop offset="1" stop-color="#1a5276" stop-opacity=".25"/></linearGradient>
  </defs>
<g class="channel"><path d="M78.375 86.865C112 86.865 174 67.88 232.28 67.88M259 101C259 137 50 132 50 172M259 101C259 137 180 137 180 172M259 101C259 135 324 133 324 170"/></g>
<path class="signal signal-input" pathLength="100" d="M78.375 86.865C112 86.865 174 67.88 232.28 67.88"/><path class="signal signal-output" pathLength="100" d="M259 101C259 137 50 132 50 172"/><path class="signal signal-output" pathLength="100" d="M259 101C259 137 180 137 180 172"/><path class="signal signal-output" pathLength="100" d="M259 101C259 135 324 133 324 170"/>
<g class="arrow"><path d="m224.28 64.88 6 3-6 3ZM47 166l3 6 3-6ZM177 166l3 6 3-6ZM321 164l3 6 3-6Z"/></g>
<text class="node-title stage-title diagram-label" x="70.95" y="21" data-i18n="idea" text-anchor="middle">${t('idea')}</text><g transform="translate(46.695 38.355) scale(.495)"><g class="idea-art bulb-art">
<path class="datum" d="M49-5v132M3 42h92"/>
<path class="artifact-panel bulb-envelope" fill="url(#mobile-glass)" d="M49 2C25 2 10 20 10 42c0 19 11 28 19 38 4 5 5 11 5 18h30c0-7 1-13 5-18 8-10 19-19 19-38C88 20 73 2 49 2Z"/>
<ellipse class="idea-light" cx="49" cy="51" rx="36" ry="45" fill="url(#mobile-idea-light)"/>
<path class="artifact-bright bulb-filament" d="M41 96V75L33 58l16 9 16-9-8 17v21"/>
<path class="artifact-line" d="M34 98v12l6 10h18l6-10V98M34 104h30M37 112h24"/>
<circle class="port small bulb-port" cx="64" cy="98" r="2.6"/>
</g></g>
<text class="node-title stage-title diagram-label" x="258.8" y="21" data-i18n="model" text-anchor="middle">${t('model')}</text><g transform="translate(225 32) scale(.52)"><g class="model-art"><path class="model-charge" d="M14 35 65 6l51 29v68l-51 29-51-29Z"/>
  <path class="datum" d="M65-5v148M-10 71h150M8 23l115 66M8 89 123 23"/>
  <path class="model-top" fill="url(#mobile-glass)" d="M14 35 65 6l51 29-51 30Z"/>
  <path class="artifact-line" d="M14 35 65 6l51 29v68l-51 29-51-29ZM14 35l51 30 51-30M65 65v67"/>
  <path class="artifact-bright" d="m14 69 51 29 51-29M39 49V20M91 49V20"/>
  <path class="model-piece" fill="url(#mobile-insert)" d="m65 65 26-15v33L65 98Z"/>
  <path class="artifact-bright" d="m65 65 26-15v33L65 98Z"/>
  <circle class="port" cx="65" cy="65" r="4"/><circle class="port small" cx="14" cy="69" r="2"/><circle class="port small" cx="116" cy="69" r="2"/>
  </g></g>
<g transform="translate(1 182) scale(.6)"><g class="software-art">
  <rect class="ghost-line" x="15" y="0" width="142" height="96" rx="6"/>
  <path class="datum" d="M20 2V-7M152 2V-7M20-3h132"/>
  <rect class="artifact-panel" fill="url(#mobile-glass)" x="0" y="14" width="148" height="98" rx="6"/>
  <path class="artifact-line" d="M0 32h148"/>
  <circle class="port small" cx="10" cy="23" r="1.6"/><circle class="port small" cx="17" cy="23" r="1.6"/><circle class="port small" cx="24" cy="23" r="1.6"/>
  <rect class="screen-sidebar" x="9" y="43" width="23" height="57" rx="3"/>
  <path class="artifact-line quiet" d="M15 51h11M15 60h8M15 69h11M15 89h8"/>
  <g class="app-component"><path class="artifact-bright" d="M44 46h65M44 52h40"/><rect class="screen-block" x="44" y="63" width="76" height="19" rx="3"/><rect class="screen-block" x="44" y="89" width="33" height="12" rx="2"/><path class="artifact-line quiet" d="M85 92h26M85 98h17"/></g>
  <rect class="artifact-panel phone" x="126" y="48" width="43" height="79" rx="8"/>
  <path class="artifact-line quiet" d="M141 54h13M141 120h13"/>
  <g class="app-component"><rect class="screen-block" x="133" y="64" width="29" height="21" rx="3"/><path class="artifact-line" d="M133 93h27M133 100h18"/><path class="artifact-bright verification" d="m143 109 3 3 7-7"/></g>
  </g></g><text class="artifact-title diagram-label" x="51.7" y="277" data-i18n="softwareLabel" text-anchor="middle">${t('softwareLabel')}</text>
<g transform="translate(128 183) scale(.6)"><g class="modding-art">
  <path class="ghost-line" d="M0 35h34v72H0ZM140 35h28v72h-28Z"/>
  <path class="base-link" d="M34 61h14M106 61h34M17 107v10h137v-10"/>
  <path class="artifact-line quiet" d="M8 48h18M8 58h10M8 91h18M148 48h12M148 91h12"/>
  <path class="old-module" transform="translate(34 -22)" d="M62 25h58v27h-14v19h14v27H62V80H48V43h14Z"/>
  <path class="datum" d="M92 21 114 3M120 99l34-22"/>
  <path class="slot" d="M58 21h66v82H58Z"/>
  <g class="mod-piece"><path class="artifact-panel insert" fill="url(#mobile-insert)" d="M62 25h58v27h-14v19h14v27H62V80H48V43h14Z"/><path class="artifact-bright" d="m71 47 12 12 15-16M83 59v23"/><circle class="port small" cx="71" cy="47" r="2.4"/><circle class="port small" cx="98" cy="43" r="2.4"/><circle class="port small" cx="83" cy="82" r="2.4"/><path class="artifact-bright verification" d="m112 106 4 4 9-10"/></g>
  </g></g><text class="artifact-title diagram-label" x="178.4" y="277" data-i18n="moddingLabel" text-anchor="middle">${t('moddingLabel')}</text>
<g transform="translate(254 177) scale(.59)"><g class="research-art">
  <path class="datum" d="M0 65h173M85 3v129M28 65 118 20 143 77 70 115Z"/>
  <circle class="research-core" fill="url(#mobile-glass)" cx="85" cy="65" r="36"/>
  <circle class="artifact-bright" pathLength="100" cx="85" cy="65" r="36"/>
  <circle class="artifact-line" pathLength="100" cx="28" cy="65" r="21"/><circle class="artifact-line" pathLength="100" cx="118" cy="20" r="20"/>
  <circle class="artifact-line" pathLength="100" cx="143" cy="77" r="24"/><circle class="artifact-line" pathLength="100" cx="70" cy="115" r="15"/>
  <path class="artifact-bright radius" pathLength="100" d="M85 65h36M121 61v8M85 61v8"/>
  <path class="datum" d="M49 58v14M85 65 108 38"/>
  <circle class="port verification" cx="49" cy="65" r="2.8"/><circle class="port small" cx="85" cy="65" r="2.4"/>
  <text class="radius-label" x="99" y="58">r</text>
  </g></g><text class="artifact-title diagram-label" x="305.33" y="277" data-i18n="researchLabel" text-anchor="middle">${t('researchLabel')}</text>
</svg></div>
<figcaption class="sr-only" id="diagram-description" data-i18n="diagramDescription">${t('diagramDescription')}</figcaption>


</figure>
<div class="identity"><div class="identity-core">
<div class="person"><span class="portrait-frame"><img class="portrait" src="/assets/images/maurizio-falconi.webp" srcset="/assets/images/maurizio-falconi-native.webp 1x, /assets/images/maurizio-falconi.webp 2x" width="256" height="256" alt="Maurizio Falconi"></span><div class="person-copy"><p class="person-name">Maurizio Falconi</p><p class="person-handle">@falker47</p><p class="person-role">${jobTitle}</p></div></div>
<p class="identity-intro" data-i18n="intro">${t('intro')}</p>

<nav class="contacts" aria-label="${copy.it.contacts}" data-label="contacts"><a class="contact" href="https://github.com/falker47"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 .9A11.1 11.1 0 0 0 8.5 22.5c.55.1.75-.24.75-.53v-2.08c-3.1.67-3.75-1.3-3.75-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.68.08-.68 1.1.08 1.69 1.14 1.69 1.14.98 1.68 2.58 1.2 3.21.92.1-.72.38-1.2.7-1.48-2.48-.28-5.09-1.24-5.09-5.5 0-1.22.44-2.22 1.14-3-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.05 1.14a10.7 10.7 0 0 1 5.56 0c2.12-1.44 3.05-1.14 3.05-1.14.6 1.53.22 2.66.1 2.94.72.78 1.15 1.78 1.15 3 0 4.27-2.61 5.21-5.1 5.49.4.35.76 1.02.76 2.06v3.05c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z"/></svg><span>GitHub</span></a><a class="contact" href="https://www.linkedin.com/in/mauriziofalconi/"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M11 17v-7M11 13c0-4 6-4 6 0v4"/><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none"/></svg><span>LinkedIn</span></a><a class="contact contact-mail" href="mailto:maurizio.falconi47@gmail.com" aria-label="${copy.it.email}" data-label="email" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg><span>Email</span></a></nav>
</div></div>
</section>



<section class="work" id="progetti" aria-labelledby="work-title">
<h2 id="work-title" data-i18n="workTitle">${t('workTitle')}</h2>
<div class="work-content">${raw(tabs(ctx, [
  { id: 'software', key: 'softwareTitle', count: software.length },
  { id: 'modding', key: 'moddingTitle', count: mods.length },
  { id: 'research', key: 'researchTitle', count: paperUrls.length },
  { id: 'teaching', key: 'teachingTitle', count: lessonUrls.length },
], 'workAreas'))}<div class="work-panels">
<section class="work-panel" id="panel-software" role="tabpanel" aria-labelledby="tab-software" tabindex="0">
<h3 class="panel-heading" id="software"><span data-i18n="softwareTitle" >${t('softwareTitle')}</span></h3><p data-i18n="softwareIntro" class="category-intro">${t('softwareIntro')}</p>
<div class="results-row software-results"><a class="result" href="https://falker47.github.io/Nexus-portfolio/#projects"><svg class="result-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2M9 9h6v6H9Z"/></svg><span class="result-body"><strong class="result-value">4</strong><span data-i18n="appsCount" class="result-label">${t('appsCount')}</span></span><span class="result-arrow" aria-hidden="true">↗</span></a><a class="result" href="https://falker47.github.io/Nexus-portfolio/#projects"><svg class="result-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7h10c3 0 5 9 3 11-1 1-3-1-5-3H9c-2 2-4 4-5 3-2-2 0-11 3-11ZM7 10v4m-2-2h4"/><circle cx="16" cy="11" r=".7"/><circle cx="18" cy="13" r=".7"/></svg><span class="result-body"><strong class="result-value">5</strong><span data-i18n="gamesCount" class="result-label">${t('gamesCount')}</span></span><span class="result-arrow" aria-hidden="true">↗</span></a><a class="result" href="https://falker47.github.io/Nexus-portfolio/#projects"><svg class="result-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 7 3 3 4-4c1 6-3 9-7 7L6 21l-3-3 8-8c-2-4 1-8 7-7Z"/></svg><span class="result-body"><strong class="result-value">5</strong><span data-i18n="toolsCount" class="result-label">${t('toolsCount')}</span></span><span class="result-arrow" aria-hidden="true">↗</span></a><p data-i18n="softwareSelection" class="sample-count">${t('softwareSelection')}</p></div>
<div class="register">${raw(software.map((item, index) => registerRow(ctx, item, index)).join('\n'))}</div></section>
<section class="work-panel" id="panel-modding" role="tabpanel" aria-labelledby="tab-modding" tabindex="0">
<h3 class="panel-heading"><span data-i18n="moddingTitle" >${t('moddingTitle')}</span></h3><p data-i18n="moddingIntro" class="category-intro">${t('moddingIntro')}</p>
<div class="stats-pair">${raw(statTile(t, { valueKey: 'moddingNumber', key: 'downloadsLabel', iconName: 'download', href: 'https://www.nexusmods.com/profile/falker47/mods' }))}
${raw(statTile(t, { valueKey: 'nexusModCount', nexusStat: 'modCount', key: 'modsLabel', iconName: 'file', href: 'https://www.nexusmods.com/profile/falker47/mods' }))}</div>
<div class="register">${raw(mods.map((item, index) => modRow(t, item, index)).join('\n'))}</div></section>
<section class="work-panel" id="panel-research" role="tabpanel" aria-labelledby="tab-research" tabindex="0">
<h3 class="panel-heading" id="ricerca"><span data-i18n="researchTitle" >${t('researchTitle')}</span></h3><p data-i18n="researchIntro" class="category-intro">${t('researchIntro')}</p>
<div class="stats-pair">${raw(statTile(t, { value: paperUrls.length, key: 'papersLabel', iconName: 'file', href: 'https://falker47.github.io/Nexus-portfolio/research.html' }))}</div>
<div class="project-gallery pair-gallery research-pair">
<article class="project-item"><svg class="project-visual " viewBox="0 0 300 164" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="art-datum" d="M20 82h260M152 10v145M71 83 176 26 221 95 127 140Z"/><circle class="art-fill" cx="151" cy="83" r="42"/><circle class="art-line" cx="151" cy="83" r="42"/><circle class="art-line" cx="83" cy="83" r="26"/><circle class="art-line" cx="177" cy="27" r="20"/><circle class="art-line" cx="220" cy="96" r="28"/><circle class="art-line" cx="130" cy="140" r="19"/><path class="art-line" d="M151 83h42m-42-4v8m42-8v8"/><circle class="art-solid" cx="151" cy="83" r="2.7"/><text x="167" y="73" class="art-r">r</text></svg>
<div class="project-caption"><p data-i18n="paperOneType" class="project-type">${t('paperOneType')}</p>
<h4><a href="${paperUrls[0]}">Ringmin I<span aria-hidden="true">↗</span></a></h4><p data-i18n="paperOneText" class="project-description">${t('paperOneText')}</p></div></article>
<article class="project-item"><svg class="project-visual" viewBox="0 0 300 164" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="art-datum" d="M47 30v109h211M57 75h199"/><path class="art-muted" d="m43 37 4-7 4 7m200 98 7 4-7 4"/><path class="art-line" d="M70 33v91m-6-91h12m-12 91h12M110 48v58m-6-58h12m-12 58h12M151 60v32m-6-32h12m-12 32h12M192 68v15m-6-15h12m-12 15h12M233 72v7m-6-7h12m-12 7h12"/><path class="art-muted" d="M70 33Q145 71 233 72M70 124Q145 81 233 79"/><circle class="art-solid" cx="233" cy="75" r="2.5"/><text class="art-r" x="264" y="79">C*</text></svg>
<div class="project-caption"><p data-i18n="paperTwoType" class="project-type">${t('paperTwoType')}</p>
<h4><a href="${paperUrls[1]}">Ringmin II<span aria-hidden="true">↗</span></a></h4><p data-i18n="paperTwoText" class="project-description">${t('paperTwoText')}</p></div></article></div></section>
<section class="work-panel" id="panel-teaching" role="tabpanel" aria-labelledby="tab-teaching" tabindex="0">
<h3 class="panel-heading"><span data-i18n="teachingTitle" >${t('teachingTitle')}</span></h3><p data-i18n="teachingIntro" class="category-intro">${t('teachingIntro')}</p>
<div class="stats-pair">${raw(ratings.map(item => ratingCard(t, item)).join('\n'))}</div><div class="lesson-example"><svg class="project-visual " viewBox="0 0 300 164" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="art-surface" d="m66 14 169 13-10 128-169-13Z"/><path class="art-datum" d="m80 40 128 10M78 60l128 10M77 80l128 10M75 100l128 10M73 120l128 10"/><path class="art-muted" d="M101 119V51m-14 52h102"/><path class="art-line" d="M110 56c18 78 40 77 65 7"/><path class="art-muted" d="m97 57 4-6 4 6m79 42 5 4-5 4"/><path class="art-line" d="m210 128 34-68 9 5-34 68-9 4Z"/><path class="art-muted" d="m239 70 9 5"/></svg><div>
<h4><span data-i18n="lessonExample" >${t('lessonExample')}</span></h4><p data-i18n="lessonText" class="project-description">${t('lessonText')}</p><a class="lesson-link" href="${lessonUrls[0]}"><span data-i18n="lessonPortal" >${t('lessonPortal')}</span><span aria-hidden="true">↗</span></a></div></div></section></div>
<div class="portfolio-outro"><a class="text-link" href="https://falker47.github.io/Nexus-portfolio/#projects"><span data-i18n="allProjects" >${t('allProjects')}</span> ${icon('arrow-ne')}</a></div></div></section>
${raw(disclosure(t, { id: 'chi-sono', key: 'navAbout', className: 'about', content: html`<div class="about-content"><p data-i18n="aboutWork">${t('aboutWork')}</p><p data-i18n="aboutResearch">${t('aboutResearch')}</p><p class="philosophy" data-i18n="philosophy">${t('philosophy')}</p><nav class="research-links about-actions" aria-label="${copy.it.researchProfiles}" data-label="researchProfiles"><a href="https://www.linkedin.com/in/mauriziofalconi/" class="about-action about-action-profile"><svg class="about-action-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M11 17v-7M11 13c0-4 6-4 6 0v4"/><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none"/></svg><span class="about-action-title">LinkedIn</span><svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg></a><a href="https://github.com/falker47" class="about-action about-action-profile"><svg class="about-action-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 .9A11.1 11.1 0 0 0 8.5 22.5c.55.1.75-.24.75-.53v-2.08c-3.1.67-3.75-1.3-3.75-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.68.08-.68 1.1.08 1.69 1.14 1.69 1.14.98 1.68 2.58 1.2 3.21.92.1-.72.38-1.2.7-1.48-2.48-.28-5.09-1.24-5.09-5.5 0-1.22.44-2.22 1.14-3-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.05 1.14a10.7 10.7 0 0 1 5.56 0c2.12-1.44 3.05-1.14 3.05-1.14.6 1.53.22 2.66.1 2.94.72.78 1.15 1.78 1.15 3 0 4.27-2.61 5.21-5.1 5.49.4.35.76 1.02.76 2.06v3.05c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z"/></svg><span class="about-action-title">GitHub</span><svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg></a><a href="https://falker47.github.io/Nexus-portfolio/research.html" class="about-action about-action-profile"><svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M18 3H6v26h20V11L18 3Zm0 0v8h8M10 8h3"/><circle cx="16" cy="19" r="4"/><path d="m19 22 4 4"/></svg><span class="about-action-title" data-i18n="research">${t('research')}</span><svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg></a><a href="https://oeis.org/wiki/User:Maurizio_Falconi" class="about-action about-action-profile"><svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M4 25h24M6 22V10m10 12V6m10 16V3"/><circle cx="6" cy="10" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="26" cy="3" r="2"/></svg><span class="about-action-title">OEIS</span><svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg></a><a href="https://orcid.org/0009-0005-3162-3651" class="about-action about-action-profile"><svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><rect x="4" y="5" width="24" height="22" rx="3"/><circle cx="12" cy="13" r="3"/><path d="M7 22c0-5 10-5 10 0m3-10h4m-4 5h4m-4 5h3"/></svg><span class="about-action-title">ORCID</span><svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg></a><a href="https://www.letuelezioni.it/insegnanti/maurizio-falconi.htm" class="about-action about-action-profile"><svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M16 7c-4-3-9-3-13-1v19c4-2 9-2 13 1m0-19c4-3 9-3 13-1v19c-4-2-9-2-13 1V7Z"/><path d="M7 10h5m-5 5h5m8-5h5m-6 7 2 2 4-4"/></svg><span class="about-action-title" data-i18n="tutoring">${t('tutoring')}</span><svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg></a></nav></div>` }))}


</main>`;
}
