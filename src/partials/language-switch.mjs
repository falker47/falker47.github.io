import { html } from '../lib/html.mjs';

export function languageSwitch(label) {
  return html`<nav class="language" aria-label="${label}" data-label="language" hidden>
  <button type="button" data-lang="it" aria-label="Italiano" aria-pressed="true"><img class="lang-flag" src="/assets/images/flag-it.png" srcset="/assets/images/flag-it-native.png 1x, /assets/images/flag-it.png 2x" width="24" height="16" alt="" aria-hidden="true"></button>
  <button type="button" data-lang="en" aria-label="English" aria-pressed="false"><img class="lang-flag" src="/assets/images/flag-en.png" srcset="/assets/images/flag-en-native.png 1x, /assets/images/flag-en.png 2x" width="24" height="16" alt="" aria-hidden="true"></button>
</nav>`;
}
