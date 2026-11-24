import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileStat } from './qa/serve.mjs';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { validateCanonical, validateMigration } from './validate-migration.mjs';
import { pageBudget } from './budgets.mjs';
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
let homeStyles;
let count = 0;
for await (const file of walk(siteRoot)) {
  if (!file.endsWith('.html')) continue;
  count++;
  const { source, elements, ids, route } = await site.document(file);
  const budget = await pageBudget(site, { route, source, elements });
  console.log(route + ': ' + budget.bytes + ' HTML+CSS+JS bytes' + (budget.load ? ', initial resources ' + budget.load.bytes + ' bytes / ' + budget.load.requests + ' requests' : ''));
  if (route === '/') homeStyles = budget.styles.map(sheet => sheet.css).join('\n');
  assert.equal(new Set(ids).size, ids.length, `${route}: unique HTML and SVG IDs`);
  assert.equal(elements.filter(e => e.name === 'h1').length, 1, `${route}: one primary heading`);
  validateCanonical(elements, route, site.redirects.get(route));
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
  const redirect = site.map.redirects.find(item => item.from === route);
  if (!redirect) {
    assert.ok(elements.some(e => e.name === 'main' && e.attrs.id && elements.some(a => a.name === 'a' && a.attrs.class?.split(/\s+/).includes('skip') && a.attrs.href === '#' + e.attrs.id)), route + ': skip link to main');
    for (const landmark of ['header', 'nav', 'main', 'footer']) assert.ok(elements.some(e => e.name === landmark), route + ': missing ' + landmark);
  }
  let heading = 0, priority = 0;
  const used = new Set();
  for (const { name, attrs, body } of elements) {
    if (/^h[1-6]$/.test(name)) {
      const level = Number(name[1]);
      assert.ok(level <= heading + 1, route + ': heading jump to ' + name);
      heading = level;
    }
    if (name === 'img') {
      assert.ok(Object.hasOwn(attrs, 'alt') && /^[1-9]\d*$/.test(attrs.width) && /^[1-9]\d*$/.test(attrs.height), route + ': missing image dimensions or alt ' + attrs.src);
      const high = attrs.fetchpriority === 'high';
      assert.equal(attrs.loading, high ? 'eager' : 'lazy', route + ': image priority ' + attrs.src);
      if (high) priority++;
    }
    if (name === 'script' && attrs.src) assert.ok(attrs.type === 'module' || 'defer' in attrs, route + ': parser-blocking script');
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
    const embeddedIcon = name === 'link' && attrs.rel === 'icon' && resource?.startsWith('data:image/');
    if (resource !== undefined && !embeddedIcon) assert.equal(new URL(resource, origin + route).origin, origin, `${route}: external ${name} ${resource}`);
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
  assert.ok(priority <= 1, route + ': more than one high priority image');
  for (const lang of ['it','en']) assert.deepEqual(Object.keys(translations[lang] || {}).sort(), [...used].sort(), `${route}: page-scoped ${lang} copy`);
  for (const ref of references(elements)) {
    const { kind } = await site.check(ref, route);
    if (!ref.navigation) assert.notEqual(kind, 'external', `${route}: external resource ${ref.value}`);
  }
  assert.ok(!/(?:href|src)=["'](?:https?:\/\/(?:localhost|127\.0\.0\.1)|file:)/i.test(source), `${route}: no local URLs`);
}
assert.ok(count > 0, 'Build at least one page');
await validateMigration(site);

const html = await readFile(join(siteRoot, 'index.html'), 'utf8');
validateHomeCatalogue(html);
await designChecks(siteRoot, inlineCss);
assert.doesNotMatch(html, /href=["']\/styleguide\//, 'QA route in public navigation');
assert.doesNotMatch(await readFile(join(siteRoot,'sitemap.xml'),'utf8'), /\/styleguide\//);
const css = homeStyles;
const i18n = await readFile(join(siteRoot, 'scripts/i18n.js'), 'utf8');
// V3 renders every project, mod and paper inside the home (V2: 120 KB with three examples per tab).
assert.ok(Buffer.byteLength(html) <= 150000, 'Home exceeds 150 KB');
assert.ok(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*no(?:index|follow)/i.test(html), 'Production must be indexable');
assert.match(html, /<link rel="canonical" href="https:\/\/falker47\.github\.io\/"/);
assert.match(html, /<meta name="google-site-verification" content="[^"]+"/);
assert.ok(!/<title>[^<]*(?:Blueprint|Preview)/i.test(html), 'Use the public site title');
const structured = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(structured['@graph'].find(item => item['@type'] === 'Person')?.jobTitle,
  'AI & Digital Innovation Specialist', 'Person.jobTitle must match the public role');
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(html, /12k\+/, 'Do not ship stale 12k+ totals as the unique-download fallback');
const nexusClient = await readFile(join(siteRoot, 'scripts/nexus-downloads.mjs'), 'utf8');
const homeModules = (await site.document(join(siteRoot, 'index.html'))).elements.filter(e => e.name === 'script' && e.attrs.type === 'module');
assert.ok(homeModules.some(e => e.body.endsWith(nexusClient)), 'Home runs the published live Nexus client');
assert.match(i18n, /document\.dispatchEvent\(new Event\('portfolio:languagechange'\)\)/, 'Language toggle must preserve fetched Nexus totals');
assert.match(html, /<a class="skip"[^>]*href="#main"|<a[^>]*href="#main"[^>]*class="skip"/);
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
assert.match(desktopRules,/\.identity\s*\{[^}]*padding:\s*0;[^}]*background:\s*none;[^}]*border:\s*0;[^}]*box-shadow:\s*none;/,'The pinned block gives the card no frame of its own');
// V3 hero guards. The 1 px gradient ring is an absolutely positioned, masked pseudo-element, so it adds
// nothing to the card's box; the card shadow sits on the inner surface, which the pinned block leaves free.
assert.match(css,/\.identity::before\{[^}]*position:absolute;inset:0;[^}]*padding:1px;[^}]*background:linear-gradient\(135deg,#60a5fa66,#ffffff10 50%,#a78bfa33\);[^}]*mask:[^}]*exclude[^}]*pointer-events:none\}/,'The identity ring takes no part in layout');
assert.match(css,/\.identity-core\{background:#12151cd1;[^}]*backdrop-filter:blur\(14px\);box-shadow:[^}]+\}/,'Identity surface and shadow');
assert.match(css,/\.hero-band::before\{[^}]*background-size:34px 34px\}/,'The 34 px grid stays inside the hero band');
assert.match(css,/\.hero-glow i\{[^}]*animation:hero-drift 28s ease-in-out infinite alternate/,'Hero glows drift slowly');
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.hero-glow i\{animation:none\}\}/,'No drift with reduced motion');
assert.doesNotMatch(html,/<video\b/i,'Video stays forbidden');
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

// Keep the Node-only static validator available in a bare checkout. CI and the
// shared QA installation also exercise actual cold Chromium loads against _site.
if (process.env.QA_CHROME_PATH || await fileStat(join(homedir(), 'qa-tools', 'chrome-path.txt'))) {
  const { verifyHomeLoad } = await import('./qa/home-budget.mjs');
  await verifyHomeLoad(site);
}
console.log(`Validated ${count} HTML page(s), ${checkedScripts.size} browser scripts and the approved desktop artwork.`);
