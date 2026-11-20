import { html, jsonScript, raw } from '../lib/html.mjs';
import { head } from './head.mjs';
import { header } from './header.mjs';
import { sprite } from './icons.mjs';
import { footer } from './footer.mjs';

export function layout(ctx) {
  const { route, copy, t } = ctx;
  const content = html`${raw(head(ctx))}
<body>
${raw(sprite())}
<a class="skip" href="#main" data-i18n="skip">${t('skip')}</a>
<div class="page">
${raw(header(ctx))}
${raw(route.render(ctx))}
${raw(footer(ctx))}
</div>`;
  const keys = new Set(Array.from(content.matchAll(/\bdata-(?:i18n|label|meta-i18n)="([^"]+)"/g), match => match[1]));
  const translations = {};
  for (const [lang, dictionary] of Object.entries(copy)) {
    translations[lang] = {};
    for (const key of keys) {
      if (typeof dictionary[key] !== 'string') throw Error(`Missing ${lang} translation: ${key}`);
      translations[lang][key] = dictionary[key];
    }
  }
  return html`<!doctype html>
<html lang="it"${raw(route.path === '/' ? ' data-mode="pulse"' : '')}>
${raw(content)}
<script type="application/json" id="page-i18n">${jsonScript(translations)}</script>
<script src="/scripts/i18n.js" defer></script>
<script src="/scripts/components.js" defer></script>
<script src="/scripts/animated-disclosures.js" defer></script>
${route.qaScript ? raw(html`<script src="${route.qaScript}" defer></script>`) : ''}
${raw(route.path === '/' ? `<script src="/scripts/home.js" defer></script>
<script type="module" src="scripts/nexus-downloads.mjs"></script>` : '')}
</body>
</html>
`;
}
