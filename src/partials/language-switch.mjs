import { html } from '../lib/html.mjs';

export function languageSwitch(label) {
  return html`<div class="language-switch" role="group" aria-label="${label}" data-label="language" hidden>
    <button type="button" data-lang="it" lang="it" aria-label="IT · Italiano" aria-pressed="true">IT</button>
    <button type="button" data-lang="en" lang="en" aria-label="EN · English" aria-pressed="false">EN</button>
  </div>`;
}
