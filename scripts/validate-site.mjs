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

/* Guard the desktop artwork iteration against accidentally shifting the lead or mobile layout. */
const desktopSizing=html.match(/<style id="desktop-visual-sizing">([\s\S]*?)<\/style>/)?.[1];
assert.ok(desktopSizing,'Dedicated desktop artwork sizing must exist');
const desktopRules=desktopSizing.replace(/\/\*[\s\S]*?\*\//g,'');
assert.match(desktopRules,/^\s*@media\s*\(min-width:\s*1000px\)/);
assert.match(desktopRules,/\.identity\s*\{[^}]*max-width:\s*min\(100%,\s*520px\)/);
assert.match(desktopRules,/\.desktop-engine\s*\{[^}]*height:\s*116%/);
assert.match(desktopRules,/\.desktop-engine\s*\{[^}]*transform:\s*translate\(14px,\s*-9%\)/);
assert.doesNotMatch(desktopRules,/\.hero(?:-lead)?(?:\s|\{|\.)|\.cta(?:\s|\{)|\bh1\s*\{/,'Artwork sizing must not change the headline, CTA or hero grid');
assert.match(html,/<div class="hero-lead"><h1>/,'Existing independent lead stays in place');

console.log('Site checks passed: production metadata, links, SVG/ARIA references, translations and JavaScript syntax.');
