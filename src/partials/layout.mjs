import { html, jsonScript, raw } from '../lib/html.mjs';
import { head } from './head.mjs';
import { header } from './header.mjs';
import { sprite } from './icons.mjs';
import { footer } from './footer.mjs';

export async function layout(ctx, bundleScripts) {
  const { route, copy, t } = ctx;
  const page = html`<a class="skip" href="#main" data-i18n="skip">${t('skip')}</a>
${raw(header(ctx))}
${raw(route.path === '/'
    // The home's hero is a full-bleed band, so its sections bring their own gutters.
    ? route.render(ctx) + '\n' + footer(ctx)
    : '<div class="page">\n' + route.render(ctx) + '\n' + footer(ctx) + '\n</div>')}`;
  let content = html`${raw(head(ctx))}
<body>
${raw(sprite(page))}
${raw(page)}`;
  const keys = new Set(Array.from(content.matchAll(/\bdata-(?:i18n|label|meta-i18n)="([^"]+)"/g), match => match[1]));
  const scripts = [];
  if (/\bdata-(?:alt|text)-it="/.test(content)) scripts.push('/scripts/catalogue.js');
  scripts.push('/scripts/i18n.js', '/scripts/components.js', '/scripts/animated-disclosures.js');
  if (route.qaScript) scripts.push(route.qaScript);
  if (route.path === '/') scripts.push('/scripts/home.js', '/scripts/nexus-downloads.mjs');
  const translations = {};
  for (const [lang, dictionary] of Object.entries(copy)) {
    translations[lang] = {};
    for (const key of keys) {
      if (typeof dictionary[key] !== 'string') throw Error(`Missing ${lang} translation: ${key}`);
      translations[lang][key] = dictionary[key];
    }
  }
  let catalogueEnglish;
  if (route.path === '/') {
    // The Italian text and alt attributes are already present in the static page.
    // Store each alternate catalogue value once, alongside the bilingual dictionary.
    const english = new Map();
    content = content.replace(/data-(text|alt)-it="[^"]*" data-\1-en="([^"]*)"/g, (_, kind, value) => {
      const text = value.replace(/&(amp|lt|gt|quot|#39);/g, entity =>
        ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" })[entity]);
      if (!english.has(text)) english.set(text, english.size);
      return 'data-' + kind + '-key="' + english.get(text) + '"';
    });
    catalogueEnglish = [...english.keys()];
  }
  const bundle = await bundleScripts(scripts);
  return html`<!doctype html>
<html lang="it"${raw(route.path === '/' ? ' data-mode="pulse"' : '')}>
${raw(content)}
${catalogueEnglish ? raw(html`<script type="application/json" id="catalogue-en">${jsonScript(catalogueEnglish)}</script>`) : ''}
<script type="application/json" id="page-i18n">${jsonScript(translations)}</script>
<script type="module">${raw(bundle)}</script>
</body>
</html>
`;
}
