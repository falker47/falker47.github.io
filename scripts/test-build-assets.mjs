import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildAssets, minifyCss, minifyHtml, minifyJs } from './build-assets.mjs';
import { checkLoad, limits, pageBudget } from './budgets.mjs';
import { auditRoutes } from './qa/audit-routes.mjs';
import { openSite, tags } from './qa/site.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'falker-p5-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('minification preserves text, raw content, descendant selectors and JS line terminators', () => {
  const source = '<span>a</span>  <span title="x   y">b</span>\n<!-- comment --><pre>a\n   b</pre>';
  assert.equal(minifyHtml(source), '<span>a</span> <span title="x   y">b</span> <pre>a\n   b</pre>\n');
  assert.equal(minifyCss('.a :hover { content: "x;  y"; /* test */ width: calc(100% - 2px); }'), '.a :hover{content: "x;  y";width: calc(100% - 2px);}');
  assert.equal(minifyCss('x{--value:a/**/b}'), 'x{--value:a/**/b}');
  const literal = '`first\n   second\n// retained`';
  assert.equal(minifyJs('  // comment\n  const value = ' + literal), '  const value = ' + literal);
  assert.equal(minifyJs('  return\n  value;\n'), 'return\nvalue;\n');
});

test('the CSS byte threshold includes the protected home block and hashes actual bundle content', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'src/styles'), { recursive: true });
  for (const name of ['tokens', 'base', 'components']) await writeFile(join(root, 'src/styles', name + '.css'), '');
  const page = { path: '/', styles: ['/styles/page.css'] };
  const file = join(root, 'src/styles/page.css');
  const assets = buildAssets(root, root);
  await writeFile(file, '.x{content:"url(keep.png)";background:url(../assets/p.webp)}');
  const rebased = await assets.styles(page, '');
  assert.ok(rebased.includes('content:"url(keep.png)"') && rebased.includes('url("/assets/p.webp")'));
  const boundary = '.x{content:"' + 'a'.repeat(13_980) + '"}';
  await writeFile(file, boundary);
  assert.match(await assets.styles(page, ''), /^<style>/);
  const large = await assets.styles(page, 'protected'.repeat(3));
  const external = tags(large).find(t => t.attrs.as === 'style').attrs.href;
  assert.match(external, /^\/styles\/site-[a-f0-9]{16}\.css$/);
  assert.ok(tags(large).some(t => t.attrs.rel === 'stylesheet' && t.attrs.href === external));
  assert.doesNotMatch(large, /\bonload=|<noscript>/, 'The initial layout stylesheet must apply before paint');
  assert.equal(await readFile(join(root, external), 'utf8'), boundary);
  assert.equal(await assets.styles(page, 'protected'.repeat(3)), large);
  await writeFile(file, boundary.replace('aaa', 'abb'));
  assert.ok(!(await assets.styles(page, 'protected'.repeat(3))).includes(external));
});

test('validator counts delivered bytes once, lazy hero assets and forbidden CSS requests', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'data'));
  await writeFile(join(root, 'data/redirects.json'), '{"status":"planned","redirects":[]}');
  await writeFile(join(root, 'data/nexus-downloads.json'), '{}');
  const source = '<link rel="preload" as="style" href="/s.css"><noscript><link rel="stylesheet" href="/s.css"></noscript><section class="hero"><img loading="lazy" src="/p.webp"></section>';
  await writeFile(join(root, 'index.html'), source);
  await writeFile(join(root, 'p.webp'), 'a');
  await writeFile(join(root, 's.css'), 'p{}');
  const site = await openSite(root);
  const budget = () => pageBudget(site, { route: '/', source, elements: tags(source) });
  assert.equal((await budget()).bytes, Buffer.byteLength(source) + 3);
  await writeFile(join(root, 'p.webp'), Buffer.alloc(450_000));
  await assert.rejects(budget, /first-load bytes/);
  // The home has its own code budget since V3 (every project lives in it).
  await writeFile(join(root, 's.css'), 'a'.repeat(limits.homePageBytes));
  await assert.rejects(budget, /HTML\+CSS\+JS/);
  await writeFile(join(root, 's.css'), '.a{background:url(https://example.org/img.png)}');
  await assert.rejects(budget, /external stylesheet resource/);
  assert.throws(() => checkLoad({ bytes: 1, requests: 16 }), /requests/);
});

test('audit includes each existing stub URL and fails closed on missing public or active routes', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'data'));
  await mkdir(join(root, 'old'));
  await writeFile(join(root, 'old/index.html'), 'stub');
  const manifest = { status: 'planned', redirects: ['/old/', '/old/index.html', '/later.html'].map(from => ({ from, to: '/' })) };
  const file = join(root, 'data/redirects.json');
  await writeFile(file, JSON.stringify(manifest));
  await assert.rejects(auditRoutes(root, [{ path: '/' }]), /missing public route/);
  await writeFile(join(root, 'index.html'), 'home');
  const result = await auditRoutes(root, [{ path: '/' }]);
  assert.deepEqual(result.routes, [{ path: '/', stub: false }, { path: '/old/', stub: true }, { path: '/old/index.html', stub: true }]);
  assert.deepEqual(result.pending, ['/later.html']);
  await writeFile(file, JSON.stringify({ ...manifest, status: 'active' }));
  await assert.rejects(auditRoutes(root, []), /missing active redirect/);
});
