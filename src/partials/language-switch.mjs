import { html } from '../lib/html.mjs';

// Runs in the head before stylesheets. Italian remains the static HTML fallback.
export function initialLanguageScript(route, copy) {
  const key = route.titleKey ?? 'title.' + route.path;
  return html`<script id="site-language" data-title-it="${copy.it[key] ?? route.title}" data-title-en="${copy.en[key] ?? route.title}">
(() => {
  const valid = value => value === 'it' || value === 'en';
  let lang = new URLSearchParams(location.search).get('lang');
  if (!valid(lang)) {
    try { lang = localStorage.getItem('nexus-language'); } catch {}
  }
  if (!valid(lang)) {
    const browser = navigator.language || navigator.languages?.[0];
    lang = !browser || /^it(?:-|$)/i.test(browser) ? 'it' : 'en';
  }
  const root = document.documentElement;
  root.lang = root.dataset.lang = lang;
})();
</script>`;
}

export function languageSwitch(label) {
  return html`<div class="language-switch" role="group" aria-label="${label}" data-label="language">
    <button type="button" disabled data-lang="it" lang="it" aria-label="IT · Italiano" aria-pressed="true">IT</button>
    <button type="button" disabled data-lang="en" lang="en" aria-label="EN · English" aria-pressed="false">EN</button>
  </div>`;
}
