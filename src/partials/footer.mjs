import profile from '../../data/profile.json' with { type: 'json' };
import { label } from './components.mjs';
import { html, raw } from '../lib/html.mjs';
import { brand, icon } from './icons.mjs';

const contacts = [
  ['mail', 'Email', `mailto:${profile.email}`],
  ['github', 'GitHub', profile.links.github],
  ['linkedin', 'LinkedIn', profile.links.linkedin],
  ['orcid', 'ORCID', profile.links.orcid],
];

export function footer({ route, t, copy }) {
  // The master's one-line signature closes the home. The signature is a link to the home on every page.
  if (route.path === '/') return html`<footer class="footer wrap"><p><a class="footer-home" href="/">${profile.name} <span aria-hidden="true">·</span> @${profile.handle}</a></p></footer>`;
  return html`<footer class="site-footer"><a class="footer-home" href="/"><span class="footer-name">${profile.name}</span><span class="footer-handle">@${profile.handle}</span></a>
  <nav id="contatti" aria-label="${copy.it.navContact}" data-label="navContact">
  ${raw(contacts.map(([glyph, name, url]) => html`<a href="${url}">${glyph === 'mail' || glyph === 'linkedin' ? icon(glyph) : brand(glyph)}${name}</a>`).join('\n'))}
  <a href="/uses/">${icon('file')}${label(t, 'navUses')}</a>
  </nav></footer>`;
}
