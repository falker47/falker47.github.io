import profile from '../../data/profile.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { flagSwitch } from './language-switch.mjs';
import { label } from './components.mjs';

// The three destinations live in the home: "I miei progetti" on its Software
// or Research tab, and "Chi sono".
export const sections = [
  ['#progetti', 'workTitle'],
  ['#ricerca', 'research'],
  ['#chi-sono', 'navAbout'],
];

/**
 * One full-width bar for every page. On the home the links stay on the page (a
 * path would drop the ?lang= query and reload it). On a phone the links move
 * into a menu button; without scripts they stay visible as a second row. The
 * button precedes the links in the document so that they follow it in the tab order.
 */
export function header({ route, copy, t }) {
  const home = route.path === '/';
  const links = sections.map(([hash, key]) => html`<a href="${home ? hash : '/' + hash}">${label(t, key)}</a>`).join('');
  return html`<header class="site-header"><div class="header-bar wrap">
  <a class="site-brand" href="${home ? '#main' : '/'}"><img class="brand-gecko" src="/assets/images/falkerlogo.png" srcset="/assets/images/falkerlogo-native.webp 1x, /assets/images/falkerlogo.png 2x" width="38" height="38" alt="" loading="lazy"><span class="brand-type"><strong>${profile.handle}</strong> <span>${profile.name}</span></span></a>
  <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav" data-label="navMenu" aria-label="${copy.it.navMenu}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  <nav class="site-nav" id="site-nav" data-label="navSite" aria-label="${copy.it.navSite}">${raw(links)}</nav>
  ${raw(flagSwitch(copy.it.language))}
</div></header>`;
}
