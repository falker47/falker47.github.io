import profile from '../../data/profile.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { flagSwitch, languageSwitch } from './language-switch.mjs';
import { label } from './components.mjs';

// The master's masthead: brand and flags, no navigation, not sticky.
function masthead(copy) {
  return html`<header class="masthead"><a class="brand" href="#main"><img class="brand-gecko" src="/assets/images/falkerlogo.png" srcset="/assets/images/falkerlogo-native.webp 1x, /assets/images/falkerlogo.png 2x" width="38" height="38" alt="" loading="lazy"><span class="brand-type"><strong>${profile.handle}</strong><span>${profile.name}</span></span></a>
  ${raw(flagSwitch(copy.it.language))}
</header>`;
}

const sections = [
  ['/', 'navHome'],
  ['/projects/', 'workTitle'],
  ['/research/', 'research'],
  ['/#chi-sono', 'navAbout'],
];

function current(path, href) {
  if (href === path) return 'page';
  if (href === '/projects/' && path.startsWith('/projects/')) return 'true';
  return null;
}

export function header({ route, copy, t }) {
  if (route.path === '/') return masthead(copy);
  return html`<header class="site-header"><a class="site-brand" href="/" aria-label="${profile.handle} ${profile.name}">
    <img src="/assets/images/falkerlogo.png" loading="lazy" width="36" height="36" alt=""><span>${profile.handle} <small>${profile.name}</small></span></a>
  <nav class="site-nav" data-label="navSite" aria-label="${copy.it.navSite}">${raw(sections.map(([href, key]) => {
    const state = current(route.path, href);
    return html`<a href="${href}"${raw(state ? html` aria-current="${state}"` : '')}>${label(t, key)}</a>`;
  }).join(''))}</nav>
  ${raw(languageSwitch(copy.it.language))}</header>`;
}
