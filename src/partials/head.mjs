import profile from '../../data/profile.json' with { type: 'json' };
import { html, jsonScript, raw } from '../lib/html.mjs';
import { initialLanguageScript } from './language-switch.mjs';
import { origin } from '../routes.mjs';

export function head({ route, copy, desktopSizing, styles, favicon }) {
  const canonical = new URL(route.path, origin).href;
  const description = copy.it[route.descriptionKey];
  const image = new URL(route.image, origin).href;
  const titleLabel = route.titleKey ? raw(html` data-i18n="${route.titleKey}"`) : '';
  const titleMeta = route.titleKey ? raw(html` data-meta-i18n="${route.titleKey}"`) : '';
  const descriptionMeta = route.titleKey ? raw(html` data-meta-i18n="${route.descriptionKey}"`) : '';
  return html`<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json; object-src 'none'; base-uri 'self'">
${raw(initialLanguageScript(route, copy))}
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#071525">
<title${titleLabel}>${route.title}</title>
<meta name="description" content="${description}" data-meta-i18n="${route.descriptionKey}">
${route.noindex ? raw('<meta name="robots" content="noindex">') : ''}
<meta name="author" content="${profile.name} (${profile.handle})">
<link rel="canonical" href="${canonical}">
<meta name="google-site-verification" content="ZOWij9OnT_HZBDPG4FcCeEwF5m7MvFjqJuK53YtkCWw">
<link rel="icon" type="image/webp" href="${favicon}">
<link rel="apple-touch-icon" href="/assets/images/falkerlogo.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${profile.name}">
<meta property="og:title" content="${route.title}"${titleMeta}>
<meta property="og:description" content="${description}"${descriptionMeta}>
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${route.title}"${titleMeta}>
<meta name="twitter:description" content="${description}"${descriptionMeta}>
<meta name="twitter:image" content="${image}">
${route.graph ? raw(html`<script type="application/ld+json">${jsonScript({ '@context': 'https://schema.org', '@graph': route.graph })}</script>`) : ''}
${route.path === '/' ? raw(['normal', 'italic'].map(style => html`<link rel="preload" href="/assets/fonts/gelasio-latin-400-${style}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n')) : ''}
${raw(styles)}
${route.path === '/' ? raw(html`<style id="desktop-visual-sizing">${raw(desktopSizing)}</style>`) : ''}
</head>`;
}
