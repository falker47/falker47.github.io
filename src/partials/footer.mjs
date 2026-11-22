import profile from '../../data/profile.json' with { type: 'json' };
import { label } from './components.mjs';
import { html, raw } from '../lib/html.mjs';
import { icon } from './icons.mjs';

const contacts = [
  ['mail', 'Email', `mailto:${profile.email}`],
  ['github', 'GitHub', profile.links.github],
  ['linkedin', 'LinkedIn', profile.links.linkedin],
  ['orcid', 'ORCID', profile.links.orcid],
];

export function footer({ route, t, copy }) {
  // The master's one-line signature closes the home.
  if (route.path === '/') return html`<footer class="footer"><p>${profile.name} <span aria-hidden="true">·</span> @${profile.handle}</p></footer>`;
  return html`<footer class="site-footer"><div><p class="footer-name">${profile.name}</p><p class="footer-handle">@${profile.handle}</p></div>
  <nav id="contatti" aria-label="${copy.it.navContact}" data-label="navContact">
  ${raw(contacts.map(([glyph, name, url]) => html`<a href="${url}">${icon(glyph)}${name}</a>`).join('\n'))}
  <a href="/uses/">${icon('file')}${label(t, 'navUses')}</a>
  </nav></footer>`;
}
