import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { checkText, designChecks } from './design-checks.mjs';
import { validateHomeCatalogue } from './validate-home.mjs';
import { decode, openSite, origin, references, siteRoot, walk } from './qa/site.mjs';

const site = await openSite();
const checkedScripts = new Set();
const dictionaries = {};
for (const lang of ['it', 'en']) {
  dictionaries[lang] = JSON.parse(await readFile(new URL(`../data/i18n/${lang}.json`, import.meta.url), 'utf8'));
}
const idRefs = ['aria-activedescendant','aria-controls','aria-describedby','aria-details',
  'aria-errormessage','aria-flowto','aria-labelledby','aria-owns','for','headers','list','form'];

function checkScript(source, filename, module = false) {
  if (!module) { new vm.Script(source, { filename }); return; }
  const result = spawnSync(process.execPath, ['--input-type=module','--check'], { input: source, encoding: 'utf8' });
  assert.equal(result.status, 0, `${filename}: ${result.stderr}`);
}

const inlineCss = [];
let count = 0;
for await (const file of walk(siteRoot)) {
  if (!file.endsWith('.html')) continue;
  count++;
  const { source, elements, ids, route } = await site.document(file);
  assert.equal(new Set(ids).size, ids.length, `${route}: unique HTML and SVG IDs`);
  assert.equal(elements.filter(e => e.name === 'h1').length, 1, `${route}: one primary heading`);
  const canonical = elements.filter(e => e.name === 'link' && e.attrs.rel?.split(/\s+/).includes('canonical'));
  assert.equal(canonical.length, 1, `${route}: one canonical`);
  assert.equal(canonical[0].attrs.href, origin + route, `${route}: self-referencing canonical`);
  for (const match of source.matchAll(/\bdata:[^"')\s<>]+/gi)) {
    assert.ok(Buffer.byteLength(match[0]) <= 2048, `${route}: data URI exceeds 2 KB`);
  }

  const translations = JSON.parse(elements.find(e => e.name === 'script' && e.attrs.id === 'page-i18n')?.body || '{}');
  const visibleText = source.replace(/<!--[^]*?-->|<(script|style)\b[^>]*>[^]*?<\/\1>/gi, '').replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, ' ');
  checkText(decode(visibleText), route);
  for (const [lang, copy] of Object.entries(translations)) for (const [key, value] of Object.entries(copy)) checkText(value, route + ' ' + lang + ' ' + key);
  const preloads = elements.filter(e => e.name === 'link' && e.attrs.rel === 'preload' && e.attrs.as === 'font').map(e => e.attrs.href).sort();
  assert.deepEqual(preloads, route === '/' ? ['/assets/fonts/gelasio-latin-400-italic.woff2', '/assets/fonts/gelasio-latin-400-normal.woff2'] : []);
  if (route === '/styleguide/') assert.ok(elements.some(e => e.name === 'meta' && e.attrs.name === 'robots' && e.attrs.content.includes('noindex')), 'QA route must be noindex');
  const used = new Set();
  for (const { name, attrs, body } of elements) {
    if (name === 'style') inlineCss.push(body);
    if (attrs.style) inlineCss.push(`inline { ${attrs.style} }`);
    for (const attr of ['alt', 'aria-label', 'title']) if (attrs[attr]) checkText(attrs[attr], route + ' ' + attr);
    if (attrs.style && ['a','button'].includes(name)) {
      const height = attrs.style.match(/min-height:\s*([\d.]+)px/i);
      if (height) assert.ok(Number(height[1]) >= 44, route + ': undersized inline target');
    }
    for (const key of idRefs) if (attrs[key]) {
      for (const id of attrs[key].trim().split(/\s+/)) assert.ok(ids.includes(id), `${route}: missing ${key} target ${id}`);
    }
    for (const value of Object.values(attrs)) {
      for (const match of value.matchAll(/url\(\s*['"]?#([^'")\s]+)/g)) assert.ok(ids.includes(match[1]), `${route}: missing SVG target ${match[1]}`);
      if (value.startsWith('data:')) assert.ok(Buffer.byteLength(value) <= 2048, `${route}: data URI exceeds 2 KB`);
    }
    for (const attr of ['data-i18n','data-label','data-meta-i18n']) if (attr in attrs) {
      const key = attrs[attr];
      used.add(key);
      for (const lang of ['it','en']) {
        assert.equal(typeof dictionaries[lang][key], 'string', `${route}: missing ${lang} dictionary entry ${key}`);
        assert.equal(typeof translations[lang]?.[key], 'string', `${route}: missing inline ${lang} translation ${key}`);
      }
    }
    const resource = name === 'script' ? attrs.src : name === 'link' ? attrs.href : undefined;
    if (resource !== undefined) assert.equal(new URL(resource, origin + route).origin, origin, `${route}: external ${name} ${resource}`);
    if (name === 'script') {
      if (attrs.src) {
        const script = await site.resolveFile(new URL(attrs.src, origin + route));
        if (!checkedScripts.has(script)) {
          checkScript(await readFile(script, 'utf8'), script, attrs.type === 'module');
          checkedScripts.add(script);
        }
      } else if (['application/ld+json','application/json','importmap'].includes(attrs.type)) JSON.parse(body);
      else checkScript(body, route, attrs.type === 'module');
    }
  }
  for (const lang of ['it','en']) assert.deepEqual(Object.keys(translations[lang] || {}).sort(), [...used].sort(), `${route}: page-scoped ${lang} copy`);
  for (const ref of references(elements)) {
    const { kind } = await site.check(ref, route);
    if (!ref.navigation) assert.notEqual(kind, 'external', `${route}: external resource ${ref.value}`);
  }
  assert.ok(!/(?:href|src)=["'](?:https?:\/\/(?:localhost|127\.0\.0\.1)|file:)/i.test(source), `${route}: no local URLs`);
}
assert.ok(count > 0, 'Build at least one page');

const html = await readFile(join(siteRoot, 'index.html'), 'utf8');
validateHomeCatalogue(html);
await designChecks(siteRoot, inlineCss);
assert.doesNotMatch(html, /href=["']\/styleguide\//, 'QA route in public navigation');
assert.doesNotMatch(await readFile(join(siteRoot,'sitemap.xml'),'utf8'), /\/styleguide\//);
const css = await readFile(join(siteRoot, 'styles/home.css'), 'utf8');
const i18n = await readFile(join(siteRoot, 'scripts/i18n.js'), 'utf8');
assert.ok(Buffer.byteLength(html) <= 120000, 'Home exceeds 120 KB');
assert.ok(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*no(?:index|follow)/i.test(html), 'Production must be indexable');
assert.match(html, /<link rel="canonical" href="https:\/\/falker47\.github\.io\/"/);
assert.match(html, /<meta name="google-site-verification" content="[^"]+"/);
assert.ok(!/<title>[^<]*(?:Blueprint|Preview)/i.test(html), 'Use the public site title');
const structured = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(structured['@graph'].find(item => item['@type'] === 'Person')?.jobTitle,
  'AI & Digital Innovation Specialist', 'Person.jobTitle must match the public role');
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(html, /12k\+/, 'Do not ship stale 12k+ totals as the unique-download fallback');
assert.match(html, /<script type="module" src="scripts\/nexus-downloads\.mjs"><\/script>/, 'Live Nexus totals must load without exposing a key');
assert.match(i18n, /document\.dispatchEvent\(new Event\('portfolio:languagechange'\)\)/, 'Language toggle must preserve fetched Nexus totals');
assert.match(html, /<a class="skip"[^>]*href="#main"|<a[^>]*href="#main"[^>]*class="skip"/);
assert.match(readFileSync(join(siteRoot, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/falker47\.github\.io\/sitemap\.xml/);
assert.match(readFileSync(join(siteRoot, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/falker47\.github\.io\/<\/loc>/);
const styleBlock = html.match(/<style id="desktop-visual-sizing">[\s\S]*?<\/style>/)?.[0];
assert.ok(styleBlock, 'Inline desktop artwork sizing is required');
assert.equal(createHash('sha256').update(styleBlock).digest('hex'),
  '410af188ab20f81ab3702ab2ec6897c1f995d4fe10cd7f3ad5cdc4bd8ed5aa7b', 'Approved desktop style bytes');

/* Guard the desktop artwork iteration against accidentally shifting the lead or mobile layout. */
const desktopSizing=html.match(/<style id="desktop-visual-sizing">([\s\S]*?)<\/style>/)?.[1];
assert.ok(desktopSizing,'Dedicated desktop artwork sizing must exist');
const desktopRules=desktopSizing.replace(/\/\*[\s\S]*?\*\//g,'');
assert.match(desktopRules,/^\s*@media\s*\(min-width:\s*1000px\)/);
assert.match(desktopRules,/\.identity\s*\{[^}]*max-width:\s*min\(100%,\s*520px\)/);
assert.match(desktopRules,/\.identity\s*\{[^}]*padding:\s*0;[^}]*background:\s*none;[^}]*border:\s*0;[^}]*box-shadow:\s*none;/,'No gradient frame around the card');
assert.match(desktopRules,/\.identity-core\s*\{[^}]*width:\s*100%;[^}]*padding:\s*30px 34px;[^}]*border-radius:\s*inherit;/,'Inner card fills its container');
assert.match(desktopRules,/@media\s*\(min-width:\s*1600px\)\s*\{[\s\S]*?\.identity-core\s*\{\s*padding:\s*32px 36px;/,'Large desktop uses inner padding');
assert.match(desktopRules,/@media\s*\(min-width:\s*1000px\)\s*and\s*\(max-height:\s*620px\)[\s\S]*?\.identity-core\s*\{\s*padding:\s*20px 24px;/,'Short viewport uses inner padding');
assert.match(desktopRules,/\.person \.portrait-frame\s*\{[^}]*width:\s*100%;[^}]*aspect-ratio:\s*1 \/ 1;[^}]*align-self:\s*start;/,'Desktop portrait frame must remain square and not stretch with text');
assert.match(css,/\.person \.portrait\{[^}]*width:100%;height:100%;[^}]*object-fit:cover/,'Portrait image must fill the square frame without distortion');
assert.match(desktopRules,/\.desktop-engine\s*\{[^}]*height:\s*116%/);
assert.match(desktopRules,/\.desktop-engine\s*\{[^}]*transform:\s*translate\(14px,\s*-15%\)/);
assert.match(desktopRules,/\.desktop-engine\s*\{[^}]*height:\s*120%;[^}]*transform:\s*translate\(20px,\s*-16%\)/,'Wide desktop research lifted');
assert.match(desktopRules,/\.desktop-engine\s*\{[^}]*height:\s*106%;[^}]*transform:\s*translate\(5px,\s*-12%\)/,'Short desktop research lifted');
assert.doesNotMatch(desktopRules,/\.hero(?:-lead)?(?:\s|\{|\.)|\.cta(?:\s|\{)|\bh1\s*\{/,'Artwork sizing must not change the headline, CTA or hero grid');
assert.match(html,/<div class="hero-lead"><h1>/,'Existing independent lead stays in place');

console.log(`Validated ${count} HTML page(s), ${checkedScripts.size} browser scripts and the approved desktop artwork.`);
