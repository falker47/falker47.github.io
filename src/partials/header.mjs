import { html, raw } from '../lib/html.mjs';
import { languageSwitch } from './language-switch.mjs';
import { label } from './components.mjs';

const sections = [['progetti', 'workTitle'], ['chi-sono', 'navAbout'], ['contatti', 'navContact']];

export function header({ route, copy, t }) {
  const prefix = route.path === '/' ? '' : '/';
  return html`<header class="site-header"><a class="site-brand" href="${prefix || '#main'}" aria-label="falker47 Maurizio Falconi">
    <img src="/assets/images/falkerlogo-native.webp" width="36" height="36" alt=""><span>falker47 <small>Maurizio Falconi</small></span></a>
  <nav class="site-nav" data-label="navSite" aria-label="${copy.it.navSite}">${raw(sections.map(([id, key]) =>
    html`<a href="${prefix}#${id}">${label(t, key)}</a>`).join(''))}</nav>
  ${raw(languageSwitch(copy.it.language))}</header>`;
}
