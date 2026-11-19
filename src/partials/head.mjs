import { html, jsonScript, raw } from '../lib/html.mjs';
import { origin } from '../routes.mjs';

export function head({ route, copy, desktopSizing }) {
  const canonical = new URL(route.path, origin).href;
  const description = copy.it[route.descriptionKey];
  const image = new URL(route.image, origin).href;
  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#071525">
<title>${route.title}</title>
<meta name="description" content="${description}" data-meta-i18n="${route.descriptionKey}">
<meta name="author" content="Maurizio Falconi (falker47)">
<link rel="canonical" href="${canonical}">
<meta name="google-site-verification" content="ZOWij9OnT_HZBDPG4FcCeEwF5m7MvFjqJuK53YtkCWw">
<link rel="icon" type="image/png" href="/assets/images/falkerlogo.png">
<link rel="apple-touch-icon" href="/assets/images/falkerlogo.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Maurizio Falconi">
<meta property="og:title" content="${route.title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${route.title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
${route.graph ? raw(html`<script type="application/ld+json">${jsonScript({ '@context': 'https://schema.org', '@graph': route.graph })}</script>`) : ''}
${raw(route.styles.map(href => html`<link rel="stylesheet" href="${href}">`).join('\n'))}
${route.path === '/' ? raw(html`<style id="desktop-visual-sizing">${raw(desktopSizing)}</style>`) : ''}
</head>`;
}
