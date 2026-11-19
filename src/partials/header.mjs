import { languageSwitch } from './language-switch.mjs';
import { html, raw } from '../lib/html.mjs';

export function header({ route, copy }) {
  return html`<header class="masthead"><a class="brand" href="${route.path === '/' ? '#main' : '/'}"><img class="brand-gecko" src="/assets/images/falkerlogo.png" srcset="/assets/images/falkerlogo-native.webp 1x, /assets/images/falkerlogo.png 2x" width="38" height="38" alt=""><span class="brand-type"><strong>falker47</strong><span>Maurizio Falconi</span></span></a>
  ${raw(languageSwitch(copy.it.language))}
</header>`;
}
