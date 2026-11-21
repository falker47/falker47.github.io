import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import profile from '../data/profile.json' with { type: 'json' };
import manifest from '../legacy/sha256.json' with { type: 'json' };
import { sitemap } from '../src/lib/sitemap.mjs';
import { origin, routes } from '../src/routes.mjs';
import { startServer } from './qa/serve.mjs';
import { openSite, routeFor, siteRoot, tags, walk } from './qa/site.mjs';
import { validateCanonical, validateSitemap } from './validate-migration.mjs';

const site = await openSite();
const legacy = fileURLToPath(new URL('../legacy/', import.meta.url));

test('every legacy image is byte-identical in the repository and the published tree', async () => {
  const paths = Object.keys(manifest.files).sort();
  for (const dir of [legacy, siteRoot]) {
    const listed = [];
    const base = join(dir, 'Nexus-portfolio/assets');
    for await (const file of walk(base)) {
      const path = '/Nexus-portfolio/assets' + routeFor(file, base);
      const hash = createHash('sha256').update(await readFile(file)).digest('hex');
      assert.equal(hash, manifest.files[path], path);
      listed.push(path);
    }
    assert.deepEqual(listed.sort(), paths);
  }
  assert.equal(site.map.status, 'active');
  await assert.rejects(site.resolveFile(new URL('/Nexus-portfolio/sitemap.xml', origin)), /Missing site file/);
  const allowed = new Set();
  for (const pattern of site.map.assets) {
    const matcher = new RegExp('^' + pattern.replaceAll('.', '\\.').replaceAll('*', '[^/]+') + '$');
    const matches = paths.filter(path => matcher.test(path));
    assert.ok(matches.length, pattern);
    for (const path of matches) allowed.add(path);
  }
  assert.deepEqual([...allowed].sort(), paths, 'Only requested images are published');
});

test('each old URL replaces history, retaining query and remapping only its own fragments', async () => {
  for (const redirect of site.map.redirects) {
    const file = await site.resolveFile(new URL(redirect.from, origin));
    const { elements } = await site.document(file);
    validateCanonical(elements, redirect.from, redirect);
    const script = elements.find(e => e.name === 'script').body;
    const links = elements.filter(e => e.name === 'a');
    for (const lang of ['it', 'en']) {
      assert.ok(links.some(e => e.attrs.lang === lang && new URL(e.attrs.href, origin).pathname === redirect.to));
    }
    const destination = await site.document(await site.resolveFile(new URL(redirect.to, origin)));
    for (const mapped of Object.values(redirect.hashMap ?? {})) {
      if (mapped) assert.ok(destination.elements.some(e => e.attrs.id === mapped.slice(1)), redirect.to + mapped);
    }
    const fragments = new Set(['', '#projects', '#certifications', '#contact', '#hero', '#other',
      ...Object.keys(redirect.hashMap ?? {})]);
    for (const hash of fragments) {
      let actual;
      const search = '?lang=en&x=a%2Bb';
      vm.runInNewContext(script, { location: { search, hash, replace(url) { actual = url; } } });
      assert.equal(actual, redirect.to + search + (redirect.hashMap?.[hash] ?? hash), redirect.from + hash);
    }
  }
});

test('visual QA holds only the requested redirect and preserves its published body', async t => {
  const path = '/Nexus-portfolio/research.html';
  const { source } = await site.document(await site.resolveFile(new URL(path, origin)));
  for (const auditScripts of [false, true]) {
    const server = await startServer({ holdRedirects: new Set([path]), auditScripts });
    t.after(() => server.close());
    const response = await fetch(server.origin + path);
    const markup = await response.text();
    if (auditScripts) {
      assert.ok(markup.includes('<template><script>'));
      assert.equal(markup.replace('<template>', '').replace('</template>', ''), source);
    } else {
      assert.equal(markup, source);
      assert.equal(response.headers.get('content-security-policy'), 'sandbox allow-same-origin');
    }
    const regular = await fetch(server.origin + '/Nexus-portfolio/testers.html');
    assert.equal(regular.headers.get('content-security-policy'), null);
    assert.ok(!(await regular.text()).includes('<template>'));
  }
});

test('only links from their own stub can defer an undeclared destination', async t => {
  const root = await mkdtemp(join(tmpdir(), 'p6-routes-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'data'));
  const from = '/Nexus-portfolio/research.html', to = '/research/';
  await writeFile(join(root, 'data/redirects.json'), JSON.stringify({ status: 'active', redirects: [{ from, to }] }));
  const link = { value: to, navigation: true };
  const pending = await openSite(root, []);
  assert.equal((await pending.check(link, from)).kind, 'undeclared');
  await assert.rejects(pending.check(link, '/'), /Missing site file/);
  await assert.rejects(pending.check({ value: to }, from), /Missing site file/);
  await assert.rejects(pending.check({ value: '/elsewhere/', navigation: true }, from), /Missing site file/);
  const declared = await openSite(root, [{ path: to }]);
  await assert.rejects(declared.check(link, from), /Missing site file/);
  await mkdir(join(root, 'research'));
  await writeFile(join(root, 'research/index.html'), '<h1>Research</h1>');
  assert.equal((await declared.check(link, from)).kind, 'internal');
});

test('sitemap reflects canonical indexable routes, dates and the new portrait', async () => {
  const xml = await readFile(join(siteRoot, 'sitemap.xml'), 'utf8');
  await validateSitemap(site, xml);
  assert.ok(xml.includes('<image:loc>' + origin + profile.photo.variants.at(-1).src + '</image:loc>'));
  await assert.rejects(validateSitemap(site, xml.replace('</urlset>', xml.match(/<url>[\s\S]*?<\/url>/)[0] + '</urlset>')));
  await assert.rejects(validateSitemap(site, xml.replace('<loc>' + origin + '/</loc>', '<loc>' + origin + '/404.html</loc>')));
  const extra = ['/research/', '/styleguide/', '/projects/social-viewer/test/', '/Nexus-portfolio/testers.html'].map(path => ({ path, lastmod: '2026-10-01' }));
  const preview = sitemap('  <!-- canonical routes -->', [...routes, ...extra], '2026-11-20');
  assert.ok(preview.includes('<loc>' + origin + '/research/</loc>'));
  assert.ok(preview.includes('<lastmod>2026-10-01</lastmod>'));
  for (const { path } of extra.slice(1)) assert.ok(!preview.includes(origin + path));
});

test('validator rejects mismatched refresh, noindex stubs and non-self canonicals', () => {
  const route = '/Nexus-portfolio/research.html', redirect = { from: route, to: '/research/' };
  const head = '<link rel="canonical" href="' + origin + redirect.to + '"><script>location.replace("/research/")</script>';
  const refresh = '<meta http-equiv="refresh" content="0; url=/research/">';
  assert.throws(() => validateCanonical(tags(head + refresh.replace('0;', '1;')), route, redirect));
  assert.throws(() => validateCanonical(tags(head + refresh.replace('/research/', '/')), route, redirect));
  assert.throws(() => validateCanonical(tags(refresh + head), route, redirect));
  assert.throws(() => validateCanonical(tags(head + refresh + '<meta name="robots" content="noindex">'), route, redirect));
  assert.throws(() => validateCanonical(tags(head), '/'));
});
