import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
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

const copy=JSON.parse(html.match(/const copy=(\{[^\n]*\});/)[1]);
for(const [,key] of html.matchAll(/data-(?:i18n|label)="([^"]+)"/g))for(const lang of ['it','en'])assert.equal(typeof copy[lang][key],'string',`Missing ${lang} translation: ${key}`);
for(const [,attrs,source] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
 if(attrs.includes('application/ld+json')){
  const graph=JSON.parse(source)['@graph'];
  assert.ok(graph.some(item=>item['@type']==='Person'&&item.jobTitle==='AI & Automation Engineer'));
 }else new vm.Script(source);
}
assert.match(html,/prefers-reduced-motion:\s*reduce/);
assert.match(html,/<a class="skip"[^>]*href="#main"|<a[^>]*href="#main"[^>]*class="skip"/);
assert.match(readFileSync(new URL('../robots.txt',import.meta.url),'utf8'),/Sitemap: https:\/\/falker47\.github\.io\/sitemap\.xml/);
assert.match(readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8'),/<loc>https:\/\/falker47\.github\.io\/<\/loc>/);
// Mobile closed state uses a viewport-sized composition, while expanded sections remain scrollable.
assert.match(html, /@media\(max-width:599px\)\{/);
assert.match(html, /\.page\{height:100svh/);
assert.match(html, /\.hero-lead h1>span>br\{display:none\}/);
assert.match(html, /\.page:has\(\.about\[open\],\.work\[open\]\)\{height:auto/);

const phase = Number(html.match(/--phase-glow:([\\d.]+)s/)[1]);
const bulb = Number(html.match(/--bulb-glow:([\\d.]+)s/)[1]);
const model = Number(html.match(/--model-glow:([\\d.]+)s/)[1]);
assert.ok(Math.abs(bulb / phase - 1.3) < 1e-9, 'Bulb illumination is 30% longer');
assert.ok(Math.abs(model / phase - .85) < 1e-9, 'Cube illumination is 15% shorter');
assert.equal((html.match(/var\(--bulb-glow\)/g) || []).length, 3, 'Bulb and filament/light stay in sync');
assert.equal((html.match(/var\(--model-glow\)/g) || []).length, 2, 'Model and charge stay in sync');

console.log('Site checks passed: production metadata, links, SVG/ARIA references, translations and JavaScript syntax.');
