import { routes } from '../routes.mjs';
import { label } from './components.mjs';
import { html, raw } from '../lib/html.mjs';
import { icon } from './icons.mjs';

const contacts = [
  ['mail', 'Email', 'mailto:maurizio.falconi47@gmail.com'],
  ['github', 'GitHub', 'https://github.com/falker47'],
  ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/mauriziofalconi/'],
  ['orcid', 'ORCID', 'https://orcid.org/0009-0005-3162-3651'],
];

export function footer({ t, copy }) {
  return html`<footer class="site-footer"><div><p class="footer-name">Maurizio Falconi</p><p class="footer-handle">@falker47</p></div>
  <nav id="contatti" aria-label="${copy.it.navContact}" data-label="navContact">
  ${raw(contacts.map(([glyph, name, url]) => html`<a href="${url}">${icon(glyph)}${name}</a>`).join('\n'))}
  <a href="${routes.some(r => r.path === '/uses/') ? '/uses/' : 'https://falker47.github.io/Nexus-portfolio/consigli.html'}">${icon('file')}${label(t, 'navUses')}</a>
  </nav></footer>`;
}
