import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

import { existsSync } from 'node:fs';
import { buildEnglish, buildSitemap, localize } from './build-site.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const html=read('../index.html');
const css=read('../assets/styles.css');
const appJs=read('../assets/app.js');
const englishHtml=read('../en/index.html');
assert.ok(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*no(?:index|follow)/i.test(html),'Production must be indexable');
assert.match(html,/<link rel="canonical" href="https:\/\/falker47\.github\.io\/"/);
assert.match(html,/<meta name="google-site-verification" content="[^"]+"/);
assert.ok(!/<title>[^<]*(?:Blueprint|Preview)/i.test(html),'Use the public site title');
assert.equal([...html.matchAll(/<h1\b/g)].length,1,'One primary heading');
assert.ok(!/(?:href|src)="(?:https?:\/\/(?:localhost|127\.0\.0\.1)|file:)/i.test(html),'No local URLs');

const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Unique HTML and SVG IDs');
for(const [,id] of html.matchAll(/(?:href="#|url\(#)([^"\s)]+)/g))assert.ok(ids.includes(id),`Missing anchor or SVG target: ${id}`);
for(const [,value] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g))for(const id of value.split(/\s+/))assert.ok(ids.includes(id),`Missing accessibility target: ${id}`);

const copy=JSON.parse(appJs.match(/const copy=(\{[^\n]*\});/)[1]);
for(const [,key] of html.matchAll(/data-(?:i18n|label)="([^"]+)"/g))for(const lang of ['it','en'])assert.equal(typeof copy[lang][key],'string',`Missing ${lang} translation: ${key}`);
for(const [,attrs,source] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
 if(attrs.includes('application/ld+json')){
  const graph=JSON.parse(source)['@graph'];
  assert.ok(graph.some(item=>item['@type']==='Person'&&item.jobTitle==='AI & Automation Engineer'));
 }else new vm.Script(source);
}
assert.match(css,/prefers-reduced-motion:\s*reduce/);
assert.doesNotMatch(html,/12k\+/, 'Do not ship stale 12k+ totals as the unique-download fallback');
assert.match(html,/<script type="module" src="\/scripts\/nexus-downloads\.mjs"><\/script>/,'Live Nexus totals must load without exposing a key');
assert.match(appJs,/document\.dispatchEvent\(new Event\('portfolio:languagechange'\)\)/,'Language toggle must preserve fetched Nexus totals');
assert.match(html,/<a class="skip"[^>]*href="#main"|<a[^>]*href="#main"[^>]*class="skip"/);
assert.match(readFileSync(new URL('../robots.txt',import.meta.url),'utf8'),/Sitemap: https:\/\/falker47\.github\.io\/sitemap\.xml/);
assert.match(readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8'),/<loc>https:\/\/falker47\.github\.io\/<\/loc>/);

/* Every local asset referenced from the pages must exist. */
for(const page of [html,englishHtml,css])for(const [,path] of page.matchAll(/(?:(?:src|href)="|url\()(\/(?:assets|scripts)\/[^"?#)]+)/g))assert.ok(existsSync(new URL('..'+path,import.meta.url)),`Missing local asset: ${path}`);
new vm.Script(appJs);

/* Performance budget: no embedded image payloads and a lean HTML document. */
assert.ok(!/data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]{4000,}/.test(html+englishHtml+css),'Large images belong in /assets, not inline');
assert.ok(html.length<80_000,`index.html grew to ${html.length} bytes`);
assert.ok(!/<style[\s>]/.test(html),'Styles live in assets/styles.css');

/* The two languages: the English page is generated, never edited by hand. */
assert.equal(localize(html,'it',copy),html,'index.html is out of sync with the Italian copy table in assets/app.js');
assert.equal(englishHtml,buildEnglish(html,copy),'en/index.html is stale: run `node scripts/build-site.mjs`');
assert.match(html,/<html lang="it"/);
assert.match(englishHtml,/<html lang="en"/);
assert.match(englishHtml,/<link rel="canonical" href="https:\/\/falker47\.github\.io\/en\/"/);
for(const page of [html,englishHtml]){
  assert.match(page,/<link rel="alternate" hreflang="it" href="https:\/\/falker47\.github\.io\/"/);
  assert.match(page,/<link rel="alternate" hreflang="en" href="https:\/\/falker47\.github\.io\/en\/"/);
  assert.match(page,/<link rel="alternate" hreflang="x-default" href="https:\/\/falker47\.github\.io\/"/);
  assert.match(page,/<meta name="twitter:card" content="summary_large_image"/);
  assert.match(page,/<meta property="og:image" content="https:\/\/falker47\.github\.io\/assets\/img\/og-card\.jpg"/);
  assert.ok(!/falker47\.github\.io\/Nexus-portfolio\/assets/.test(page),'Share/icon assets must not depend on the other repository');
}
const sitemap=read('../sitemap.xml');
const lastmod=sitemap.match(/<lastmod>([^<]+)<\/lastmod>/)[1];
assert.equal(sitemap,buildSitemap(lastmod),'sitemap.xml is out of sync with the build script');

/* Layout invariants worth guarding (behavioural, not pixel-exact): the portrait stays square and the headline untouched by artwork sizing. */
const desktopSizing=css.match(/\/\* id="desktop-visual-sizing" \*\/([\s\S]*)$/)?.[1].replace(/\/\*[\s\S]*?\*\//g,'');
assert.ok(desktopSizing,'Dedicated desktop artwork sizing must exist');
assert.match(desktopSizing,/^\s*@media\s*\(min-width:\s*1000px\)/);
assert.match(desktopSizing,/\.person \.portrait-frame\s*\{[^}]*aspect-ratio:\s*1 \/ 1/,'Portrait frame must stay square');
assert.doesNotMatch(desktopSizing,/\.hero(?:-lead)?(?:\s|\{|\.)|\.cta(?:\s|\{)|\bh1\s*\{/,'Artwork sizing must not change the headline, CTA or hero grid');
assert.match(css,/\.person \.portrait\{[^}]*object-fit:cover/,'Portrait image must fill its frame without distortion');
assert.match(html,/<div class="hero-lead"><h1>/,'Existing independent lead stays in place');

console.log('Site checks passed: metadata, assets, languages (IT/EN in sync), SEO, ARIA references, translations and JavaScript syntax.');
