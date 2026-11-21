import { projectsSection } from './home/projects.mjs';
import { aboutSection } from './home/about.mjs';
import { html, raw, translatedText } from '../lib/html.mjs';
import { primaryCta } from '../partials/components.mjs';

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
    "contentUrl": "https://falker47.github.io/assets/images/maurizio-falconi-native.webp",
    "url": "https://falker47.github.io/assets/images/maurizio-falconi-native.webp",
    "name": "Maurizio Falconi (falker47)",
    "caption": "Maurizio Falconi, known online as falker47"
  }
];

export function render(ctx) {
  const { t, copy } = ctx;
  return html`<main id="main" tabindex="-1">
<section class="hero" aria-label="Maurizio Falconi">
<div class="hero-lead"><h1><span lang="it">${t('headlineStart')}</span><em lang="it">${t('headlineEnd')}</em><span lang="en">${translatedText(copy.en.headlineStart)}</span><em lang="en">${translatedText(copy.en.headlineEnd)}</em></h1>
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
<div class="person"><span class="portrait-frame"><img class="portrait" src="/assets/images/maurizio-falconi-native.webp" loading="lazy" width="256" height="256" alt="Maurizio Falconi"></span><div class="person-copy"><p class="person-name">Maurizio Falconi</p><p class="person-handle">@falker47</p><p class="person-role">${jobTitle}</p></div></div>
<p class="identity-intro" data-i18n="intro">${t('intro')}</p>

<nav class="contacts" aria-label="${copy.it.contacts}" data-label="contacts"><a class="contact" href="https://github.com/falker47"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 .9A11.1 11.1 0 0 0 8.5 22.5c.55.1.75-.24.75-.53v-2.08c-3.1.67-3.75-1.3-3.75-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.68.08-.68 1.1.08 1.69 1.14 1.69 1.14.98 1.68 2.58 1.2 3.21.92.1-.72.38-1.2.7-1.48-2.48-.28-5.09-1.24-5.09-5.5 0-1.22.44-2.22 1.14-3-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.05 1.14a10.7 10.7 0 0 1 5.56 0c2.12-1.44 3.05-1.14 3.05-1.14.6 1.53.22 2.66.1 2.94.72.78 1.15 1.78 1.15 3 0 4.27-2.61 5.21-5.1 5.49.4.35.76 1.02.76 2.06v3.05c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z"/></svg><span>GitHub</span></a><a class="contact" href="https://www.linkedin.com/in/mauriziofalconi/"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M11 17v-7M11 13c0-4 6-4 6 0v4"/><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none"/></svg><span>LinkedIn</span></a><a class="contact contact-mail" href="mailto:maurizio.falconi47@gmail.com" aria-label="${copy.it.email}" data-label="email" title="Email"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg><span>Email</span></a></nav>
</div></div>
</section>
${raw(projectsSection(ctx))}
${raw(aboutSection(ctx))}
</main>`;
}
