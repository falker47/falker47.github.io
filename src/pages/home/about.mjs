import credentials from '../../../data/certifications.json' with { type: 'json' };
import profile from '../../../data/profile.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { certificateDeck, label } from '../../partials/components.mjs';
import { journey } from '../../partials/journey.mjs';

const arrow = '<svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg>';
const icons = {
  linkedin: '<svg class="about-action-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M11 17v-7M11 13c0-4 6-4 6 0v4"/><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none"/></svg>',
  github: '<svg class="about-action-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 .9A11.1 11.1 0 0 0 8.5 22.5c.55.1.75-.24.75-.53v-2.08c-3.1.67-3.75-1.3-3.75-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.68.08-.68 1.1.08 1.69 1.14 1.69 1.14.98 1.68 2.58 1.2 3.21.92.1-.72.38-1.2.7-1.48-2.48-.28-5.09-1.24-5.09-5.5 0-1.22.44-2.22 1.14-3-.11-.28-.49-1.41.11-2.94 0 0 .93-.3 3.05 1.14a10.7 10.7 0 0 1 5.56 0c2.12-1.44 3.05-1.14 3.05-1.14.6 1.53.22 2.66.1 2.94.72.78 1.15 1.78 1.15 3 0 4.27-2.61 5.21-5.1 5.49.4.35.76 1.02.76 2.06v3.05c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z"/></svg>',
  research: '<svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M18 3H6v26h20V11L18 3Zm0 0v8h8M10 8h3"/><circle cx="16" cy="19" r="4"/><path d="m19 22 4 4"/></svg>',
  oeis: '<svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M4 25h24M6 22V10m10 12V6m10 16V3"/><circle cx="6" cy="10" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="26" cy="3" r="2"/></svg>',
  orcid: '<svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><rect x="4" y="5" width="24" height="22" rx="3"/><circle cx="12" cy="13" r="3"/><path d="M7 22c0-5 10-5 10 0m3-10h4m-4 5h4m-4 5h3"/></svg>',
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

export function aboutSection(ctx) {
  const { t, copy } = ctx;
  const links = actions.map(([glyph, href, name]) => {
    const title = name === 'research' || name === 'tutoring'
      ? html`<span class="about-action-title" data-i18n="${name}">${t(name)}</span>`
      : html`<span class="about-action-title">${name}</span>`;
    return html`<a href="${href}" class="about-action about-action-profile">${raw(icons[glyph])}${raw(title)}${raw(arrow)}</a>`;
  }).join('');
  return html`<details class="about" id="chi-sono"><summary><h2>${label(t, 'about')}</h2></summary><div class="about-content"><div class="about-text"><p data-i18n="aboutWork">${t('aboutWork')}</p><p data-i18n="aboutResearch">${t('aboutResearch')}</p></div>
<section class="about-journey" aria-labelledby="journey-title"><h3 class="section-label" id="journey-title">${label(t, 'journeyTitle')}</h3>
${raw(journey(ctx))}</section>
<p class="philosophy" data-i18n="philosophy">${t('philosophy')}</p><nav class="research-links about-actions" aria-label="${copy.it.researchProfiles}" data-label="researchProfiles">${raw(links)}</nav>
<section class="credentials" id="certificazioni" aria-labelledby="credentials-title"><h3 class="section-label" id="credentials-title">${label(t, 'guideCertificates')} <span aria-hidden="true">·</span> ${credentials.length}</h3>
${raw(certificateDeck(ctx, credentials, 'home-certificate'))}</section></div></details>`;
}
