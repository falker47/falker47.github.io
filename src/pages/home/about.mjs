import credentials from '../../../data/certifications.json' with { type: 'json' };
import profile from '../../../data/profile.json' with { type: 'json' };
import research from '../../../data/research.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { certificateDeck, label } from '../../partials/components.mjs';
import { brand, brandFor, brandInk, icon } from '../../partials/icons.mjs';
import { categories } from './work.mjs';

const arrow = '<svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg>';
const icons = {
  linkedin: '<svg class="about-action-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M11 17v-7M11 13c0-4 6-4 6 0v4"/><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none"/></svg>',
  research: '<svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M18 3H6v26h20V11L18 3Zm0 0v8h8M10 8h3"/><circle cx="16" cy="19" r="4"/><path d="m19 22 4 4"/></svg>',
  tutoring: '<svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M16 7c-4-3-9-3-13-1v19c4-2 9-2 13 1m0-19c4-3 9-3 13-1v19c-4-2-9-2-13 1V7Z"/><path d="M7 10h5m-5 5h5m8-5h5m-6 7 2 2 4-4"/></svg>',
};

// The master's profile row. Research opens the research page of this site.
const actions = [
  ['linkedin', profile.links.linkedin, 'LinkedIn'],
  ['github', profile.links.github, 'GitHub'],
  ['research', '/research/', 'research'],
  ['oeis', profile.links.oeis, 'OEIS'],
  ['orcid', profile.links.orcid, 'ORCID'],
  ['tutoring', 'https://www.letuelezioni.it/insegnanti/maurizio-falconi.htm', 'tutoring'],
];

// The four figures beside the text, all counted from the data at build time. The Nexus total
// is the live counter of the Modding tab (same key, same snapshot).
const integer = value => new Intl.NumberFormat('it-IT').format(value);
// Each figure wears the colour of the section it opens, and its mark or icon.
export const facts = [
  { key: 'factProjects', href: '#progetti', tone: 'software', glyph: () => icon('code'), value: categories.reduce((sum, category) => sum + category.items.length, 0) },
  { key: 'factDownloads', href: '#panel-modding', tone: 'modding', glyph: () => brand('nexusmods'), live: 'moddingNumber' },
  { key: 'factPapers', href: '#ricerca', tone: 'research', glyph: () => brand('arxiv'), value: research.papers.length },
  { key: 'factCertificates', href: '#certificazioni', tone: 'credentials', glyph: () => icon('medal'), value: credentials.length },
];

function factsCard({ t, copy }) {
  const items = facts.map(fact => {
    const value = fact.live
      ? html`<strong class="fact-value" data-i18n="${fact.live}">${t(fact.live)}</strong>`
      : html`<strong class="fact-value" data-i18n-number="${fact.value}">${integer(fact.value)}</strong>`;
    return html`<li><a class="fact fact-${fact.tone}" href="${fact.href}"><span class="fact-glyph" aria-hidden="true">${fact.glyph()}</span>${raw(value)}<span class="fact-label">${label(t, fact.key)}</span></a></li>`;
  }).join('');
  return html`<section class="about-facts" aria-labelledby="facts-title"><h3 class="section-label" id="facts-title">${label(t, 'factsTitle')}</h3><ul class="facts-grid" data-label="factsTitle" aria-label="${copy.it.factsTitle}">${raw(items)}</ul></section>`;
}

export function aboutSection(ctx) {
  const { t, copy } = ctx;
  const links = actions.map(([glyph, href, name]) => {
    const title = name === 'research' || name === 'tutoring'
      ? html`<span class="about-action-title" data-i18n="${name}">${t(name)}</span>`
      : html`<span class="about-action-title">${name}</span>`;
    // GitHub, OEIS and ORCID show their own marks and take their colour on hover.
    const mark = brandFor(href);
    const style = mark ? html` style="--brand:${brandInk(mark)}" data-brand="${mark}"` : '';
    return html`<a href="${href}" class="about-action about-action-profile"${raw(style)}>${mark ? brand(mark) : raw(icons[glyph])}${raw(title)}${raw(arrow)}</a>`;
  }).join('');
  return html`<details class="about" id="chi-sono"><summary><h2>${label(t, 'about')}</h2></summary><div class="about-content"><div class="about-intro"><div class="about-text"><p data-i18n="aboutWork">${t('aboutWork')}</p></div>
${raw(factsCard(ctx))}</div>
<p class="philosophy" data-i18n="philosophy">${t('philosophy')}</p><nav class="research-links about-actions" aria-label="${copy.it.researchProfiles}" data-label="researchProfiles">${raw(links)}</nav>
<section class="credentials" id="certificazioni" aria-labelledby="credentials-title"><h3 class="section-label" id="credentials-title">${label(t, 'guideCertificates')} <span aria-hidden="true">·</span> ${credentials.length}</h3>
${raw(certificateDeck(ctx, credentials, 'home-certificate'))}</section></div></details>`;
}
