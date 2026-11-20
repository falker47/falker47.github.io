import { html, jsonScript } from '../lib/html.mjs';
import { origin } from '../routes.mjs';

export function redirectPage({ to, hashMap = {} }, copy) {
  return html`<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${copy.it.moved} / ${copy.en.moved} · Nexus Portfolio</title>
<link rel="canonical" href="${new URL(to, origin).href}">
<script>
  const target = ${jsonScript(to)};
  const fragments = ${jsonScript(hashMap)};
  location.replace(target + location.search + (fragments[location.hash] ?? location.hash));
</script>
<meta http-equiv="refresh" content="0; url=${to}">
<link rel="icon" href="/assets/images/falkerlogo.png">
<link rel="stylesheet" href="/styles/tokens.css">
<link rel="stylesheet" href="/styles/base.css">
<link rel="stylesheet" href="/styles/components.css">
<link rel="stylesheet" href="/styles/status.css">
</head>
<body>
<main class="status-standalone">
  <div class="status-panel redirect-stub">
    <p class="status-code">Nexus Portfolio</p>
    <h1 lang="it">${copy.it.moved}</h1>
    <p class="status-translation" lang="en">${copy.en.moved}</p>
    <p class="status-path"><code>${to}</code></p>
    <div class="status-actions">
      <a href="${to}" lang="it">${copy.it.visitDestination}</a>
      <a href="${to}?lang=en" lang="en">${copy.en.visitDestination}</a>
    </div>
  </div>
</main>
</body>
</html>
`;
}
