import credentials from '../../../data/certifications.json' with { type: 'json' };
import profile from '../../../data/profile.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { certificates, disclosure, label } from '../../partials/components.mjs';
import { icon } from '../../partials/icons.mjs';

const profiles = [
  ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['orcid', 'ORCID'], ['oeis', 'OEIS'], ['scholar', 'Google Scholar'],
];

export function aboutSection(ctx) {
  const { t, copy } = ctx;
  return disclosure(t, {
    id: 'chi-sono', key: 'navAbout', className: 'about',
    content: html`<div class="about-content"><p data-i18n="aboutWork">${t('aboutWork')}</p>
    <p data-i18n="aboutResearch">${t('aboutResearch')}</p>
    <p class="philosophy" data-i18n="philosophy">${t('philosophy')}</p>
    <nav class="profile-links" aria-label="${copy.it.profileLinks}" data-label="profileLinks">
    ${raw(profiles.map(([key, name]) => html`<a class="text-link" href="${profile.links[key]}">${name} ${icon('arrow-ne')}</a>`).join('\n'))}
    </nav></div><section class="credentials" id="certificazioni" aria-labelledby="credentials-title">
    <h3 id="credentials-title">${label(t, 'guideCertificates')}</h3>
    ${raw(certificates(ctx, credentials, 'home-certificate', 4))}</section>`,
  });
}
