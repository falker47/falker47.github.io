import { html, jsonScript, raw } from '../lib/html.mjs';
import { initialLanguageScript } from '../partials/language-switch.mjs';
import { origin } from '../routes.mjs';

// A fragment maps to another fragment of the destination ("#contact" → "#contatti")
// or to another page ("#projects" → "/projects/"). The query string is always kept.
export function legacyTarget(to, fragments, search, hash) {
  const mapped = Object.prototype.hasOwnProperty.call(fragments, hash) ? fragments[hash] : hash;
  if (mapped.charAt(0) !== '/') return to + search + mapped;
  const at = mapped.indexOf('#');
  return at === -1 ? mapped + search : mapped.slice(0, at) + search + mapped.slice(at);
}

export function redirectPage({ to, hashMap = {} }, copy, styles) {
  return html`<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${copy.it.moved}</title>
<link rel="canonical" href="${new URL(to, origin).href}">
<script>
  const target = ${jsonScript(to)};
  const fragments = ${jsonScript(hashMap)};
  location.replace((${raw(legacyTarget.toString())})(target, fragments, location.search, location.hash));
</script>
<meta http-equiv="refresh" content="0; url=${to}">
${raw(initialLanguageScript({ titleKey: 'moved' }, copy))}
<meta name="description" data-meta-i18n="moved" content="${copy.it.moved}">
<meta property="og:title" content="${copy.it.moved}">
<meta property="og:description" content="${copy.it.moved}">
<meta name="twitter:title" content="${copy.it.moved}">
<meta name="twitter:description" content="${copy.it.moved}">
<link rel="icon" href="/assets/images/falkerlogo.png">
${raw(styles)}
</head>
<body>
<main class="status-standalone">
  <div class="status-panel redirect-stub">
    <p class="status-code">falker47</p>
    <h1 data-i18n="moved">${copy.it.moved}</h1>
    <noscript><p class="status-translation" lang="en">${copy.en.moved}</p></noscript>
    <p class="status-path"><code>${to}</code></p>
    <div class="status-actions">
      <a href="${to}" lang="it">${copy.it.visitDestination}</a>
      <a href="${to}?lang=en" lang="en">${copy.en.visitDestination}</a>
    </div>
  </div>
</main>
<script type="application/json" id="page-i18n">${jsonScript({ it: { moved: copy.it.moved }, en: { moved: copy.en.moved } })}</script>
<script defer src="/scripts/i18n.js"></script>
</body>
</html>
`;
}
