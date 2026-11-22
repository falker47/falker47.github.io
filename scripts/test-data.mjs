import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { img, picture } from '../src/lib/media.mjs';
import { tags } from './qa/site.mjs';
import { styleguide } from '../src/styleguide/page.mjs';
import { routes } from '../src/routes.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async name => JSON.parse(await readFile(join(root, 'data', name + '.json'), 'utf8'));
const [projects, mods, certs, research, tutoring, profile, it, en] = await Promise.all(
  ['projects', 'mods', 'certifications', 'research', 'tutoring', 'profile', 'i18n/it', 'i18n/en'].map(read)
);
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const string = value => assert.ok(typeof value === 'string' && value.trim(), 'Expected non-empty text');
const positive = value => assert.ok(Number.isSafeInteger(value) && value > 0, 'Expected a positive integer');
const unique = values => assert.equal(new Set(values).size, values.length, 'Expected unique values: ' + values);
const heroes = new Set(['prof-gecko', 'camaleonte', 'social-viewer', 'ringmin']);

function pair(value) {
  assert.deepEqual(Object.keys(value).sort(), ['en', 'it']);
  string(value.it);
  string(value.en);
}

function https(value) {
  string(value);
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', value);
  assert.ok(url.host && !url.username && !url.password, value);
}

test('catalogues have complete IT/EN pairs, safe URLs and unique identifiers', () => {
  function inspect(value) {
    if (typeof value === 'string') {
      assert.doesNotMatch(value, /\/Nexus-portfolio\//i);
      if (/^\w+:\/\//.test(value)) https(value);
    } else if (value && typeof value === 'object') {
      if ('it' in value || 'en' in value) pair(value);
      for (const item of Object.values(value)) inspect(item);
    }
  }
  inspect([projects, mods, certs, research, tutoring, profile]);
  const ids = [...projects, ...mods.items, ...certs].map(item => item.id);
  ids.forEach(id => assert.match(id, slug));
  unique(ids);
  unique(projects.map(p => p.slug));
  assert.deepEqual(Object.keys(it).sort(), Object.keys(en).sort());
  for (const dictionary of [it, en]) {
    for (const value of Object.values(dictionary)) string(value);
    for (const key of ['projectOne', 'projectOther', 'modOne', 'modOther']) assert.match(dictionary[key], /\{count\}/);
  }
});

test('projects preserve catalogue order, visibility, summaries, routes and link types', () => {
  const counts = { app: 0, game: 0, tool: 0, research: 0 };
  for (const [index, p] of projects.entries()) {
    assert.match(p.slug, slug);
    string(p.title);
    pair(p.kind);
    pair(p.summary);
    pair(p.description);
    for (const text of Object.values(p.summary)) {
      assert.doesNotMatch(text, /[\r\n]/, p.id);
      assert.ok([...text].length <= 110, p.id + ' summary exceeds 110 characters');
    }
    assert.ok(Array.isArray(p.stack) && p.stack.length > 0, p.id);
    p.stack.forEach(string);
    assert.ok(Object.hasOwn(counts, p.category), p.id);
    assert.equal(typeof p.hidden, 'boolean');
    if (!p.hidden) counts[p.category]++;
    assert.equal(p.order, index + 1);
    if (p.page !== null) assert.match(p.page, /^\/(?:[a-z0-9-]+\/)+$/);
    assert.ok(Array.isArray(p.links) && p.links.length > 0, p.id);
    unique(p.links.map(link => link.url));
    for (const link of p.links) {
      pair(link.label);
      assert.ok(['demo', 'repo', 'store', 'paper', 'nexus', 'test'].includes(link.type));
      if (link.type === 'test' && link.url.startsWith('/')) {
        assert.equal(p.id, 'social-viewer');
        assert.equal(link.url, '/projects/social-viewer/test/');
      } else https(link.url);
    }
  }
  assert.deepEqual(counts, { app: 4, game: 5, tool: 5, research: 1 });
  assert.deepEqual(projects.map(p => p.slug), [
    'prof-gecko', 'camaleonte', 'social-viewer', 'chi-l-ha-detto', 'diario-di-bordo', 'easy-contract',
    'zerofilez', 'pokemon-mystery-dungeon-tools', 'carte-senza-umanita', 'panacea', 'iban-checker',
    'codice-fiscale', 'sommatrix', 'crack-the-code', 'ringmin', 'power-ringmin',
  ]);
  assert.deepEqual(projects.filter(p => p.hidden).map(p => p.id), ['power-ringmin']);
  assert.deepEqual(projects.filter(p => p.page).map(p => p.page), [
    '/projects/prof-gecko/', '/projects/camaleonte/', '/projects/social-viewer/', '/research/',
  ]);
  const social = projects.find(p => p.slug === 'social-viewer');
  assert.deepEqual(social.links.map(link => link.type).sort(), ['repo', 'store', 'test']);
  assert.equal(social.links.find(link => link.type === 'store').url, 'https://play.google.com/store/apps/details?id=io.github.falker47.socialviewer');
});

test('featured mods, certificates, research, tutoring and profile have their required fields', () => {
  https(mods.profile);
  assert.deepEqual(mods.items.map(m => m.title), ['Hogwarts Legacy Save Editor', 'Giant Shockwaves', 'Respect the Chief']);
  for (const m of mods.items) {
    string(m.game);
    pair(m.description);
    https(m.url);
    if (m.repo !== null) https(m.repo);
  }
  assert.equal(certs.length, 11);
  for (const c of certs) {
    string(c.title);
    string(c.issuer);
    assert.notEqual(c.title, 'Archaeoastronomy Course');
    positive(c.year);
    pair(c.alt);
  }
  assert.equal(research.id, 'ringmin');
  string(research.title);
  pair(research.summary);
  assert.deepEqual(research.papers.map(p => p.arxiv), ['2607.28654', '2609.13630']);
  for (const paper of research.papers) {
    assert.ok(['I', 'II'].includes(paper.number));
    string(paper.title);
    pair(paper.summary);
    pair(paper.highlight);
    assert.equal(paper.url, 'https://arxiv.org/abs/' + paper.arxiv);
  }
  assert.deepEqual(research.repositories.map(r => r.project), ['ringmin', 'power-ringmin']);
  for (const repo of research.repositories) {
    const project = projects.find(p => p.id === repo.project);
    assert.ok(project?.links.some(link => link.type === 'repo' && link.url === repo.url));
  }
  assert.equal(research.zenodo.url, 'https://doi.org/' + research.zenodo.doi);
  pair(research.zenodo.description);
  assert.match(tutoring.since, /^\d{4}-(0[1-9]|1[0-2])$/);
  for (const [key, count] of [['subjects', 2], ['services', 3], ['formats', 2]]) {
    assert.equal(tutoring[key].length, count);
    tutoring[key].forEach(pair);
  }
  https(tutoring.portal);
  assert.deepEqual(tutoring.ratings.map(r => [r.source, r.score, r.scale, r.ratings, r.recommendations]),
    [['Letuelezioni', 5, 5, 10, undefined], ['Superprof', 5, 5, 2, 3]]);
  tutoring.ratings.forEach(r => https(r.url));
  for (const key of ['name', 'handle', 'role']) string(profile[key]);
  assert.match(profile.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  for (const key of ['github', 'linkedin', 'orcid', 'oeis', 'scholar']) https(profile.links[key]);
});

// RIFF chunk lengths include padding only between chunks. Decode the actual VP8 frame size
// so CI can verify WebP headers without installing an image codec or reading the source clones.
function webpDimensions(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
  let dimensions;
  for (let i = 12; i < bytes.length;) {
    const type = bytes.toString('ascii', i, i + 4);
    const size = bytes.readUInt32LE(i + 4);
    const data = i + 8;
    assert.ok(data + size <= bytes.length, 'Truncated WebP chunk');
    assert.ok(!['EXIF', 'ICCP', 'XMP '].includes(type), 'Image still contains ' + type);
    if (type === 'VP8 ') {
      assert.equal(bytes.toString('hex', data + 3, data + 6), '9d012a');
      dimensions = [bytes.readUInt16LE(data + 6) & 0x3fff, bytes.readUInt16LE(data + 8) & 0x3fff];
    } else if (type === 'VP8L') {
      assert.equal(bytes[data], 0x2f);
      const bits = bytes.readUInt32LE(data + 1);
      dimensions = [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    i = data + size + (size % 2);
  }
  assert.ok(dimensions, 'Missing WebP frame');
  return dimensions;
}

test('every responsive image matches its encoded dimensions, directory, size and budget', async () => {
  const files = new Map();
  async function verify(image, directory) {
    const prefix = '/assets/' + directory + '/';
    assert.ok(image.src.startsWith(prefix), image.src);
    assert.match(image.src.slice(prefix.length), /^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/);
    positive(image.width);
    positive(image.height);
    if (!files.has(image.src)) files.set(image.src, await readFile(join(root, image.src.slice(1))));
    const bytes = files.get(image.src);
    assert.ok(bytes.length <= 300_000, image.src);
    assert.deepEqual(webpDimensions(bytes), [image.width, image.height], image.src);
  }
  async function media(image, directory, widths) {
    pair(image.alt);
    positive(image.nativeWidth);
    assert.deepEqual(image.variants.map(v => v.width), [...new Set(widths.map(width => Math.min(width, image.nativeWidth)))]);
    assert.equal(image.src, image.variants[0].src);
    await verify(image, directory);
    for (const variant of image.variants) await verify(variant, directory);
  }
  for (const p of projects) await media(p.cover, 'projects', heroes.has(p.id) ? [480, 960, 1440] : [480, 960]);
  for (const m of mods.items) await media(m.cover, 'mods', [480, 960]);
  for (const c of certs) {
    assert.equal(c.thumbnail.width, 480);
    assert.equal(c.full.width, 960);
    await verify(c.thumbnail, 'certifications');
    await verify(c.full, 'certifications');
  }
  assert.equal(profile.photo.nativeWidth, 256);
  assert.equal(projects.find(project => project.id === 'social-viewer').cover.nativeWidth, Math.floor(313 * 16 / 9)); // 640×313 source, cropped to 16:9.
  await media(profile.photo, 'profile', [480, 960]);
  for (const dir of ['projects', 'mods', 'certifications', 'profile']) {
    for (const name of await readdir(join(root, 'assets', dir))) assert.ok(files.has('/assets/' + dir + '/' + name), 'Unreferenced asset ' + name);
  }
  const bytes = [...files.values()].reduce((sum, file) => sum + file.length, 0);
  assert.ok(bytes <= 4_000_000, 'Images exceed 4 MB: ' + bytes);
});

test('responsive markup localizes alt text and opts priority images into eager loading', () => {
  const cover = projects[0].cover;
  for (const render of [img, picture]) {
    const markup = tags(render(cover, { lang: 'en', sizes: '42vw' }));
    const image = markup.find(tag => tag.name === 'img').attrs;
    const responsive = markup.find(tag => tag.attrs.srcset).attrs;
    assert.equal(image.alt, cover.alt.en);
    assert.equal(image.width, String(cover.width));
    assert.equal(image.height, String(cover.height));
    assert.equal(image.loading, 'lazy');
    assert.equal(image.decoding, 'async');
    assert.equal(responsive.sizes, '42vw');
    assert.equal(responsive.srcset, cover.variants.map(v => v.src + ' ' + v.width + 'w').join(', '));
    const capped = { ...cover, nativeWidth: cover.variants[0].width };
    assert.equal(tags(render(capped)).find(tag => tag.attrs.srcset).attrs.srcset, cover.src + ' ' + cover.width + 'w');
    const priority = tags(render(cover, { fetchpriority: 'high' })).find(tag => tag.name === 'img').attrs;
    assert.equal(priority.fetchpriority, 'high');
    assert.equal(priority.loading, 'eager');
    assert.equal(priority.alt, cover.alt.it);
  }
});

test('the QA Data section shows all 30 entries and keeps planned routes out of navigation', () => {
  const markup = styleguide.render({ t: key => it[key], copy: { it, en } });
  const section = markup.match(/<section [^>]*id="data"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(section, 'Missing Data section');
  const elements = tags(section[1]);
  const expected = [...projects.map(p => p.cover), ...mods.items.map(m => m.cover), ...certs.map(c => c.thumbnail)];
  assert.equal(elements.filter(e => e.name === 'picture').length, expected.length);
  assert.deepEqual(elements.filter(e => e.name === 'img' && e.attrs.src).map(e => e.attrs.src), expected.map(image => image.src));
  const built = new Set(routes.map(route => route.path));
  const planned = new Set([...projects.map(p => p.page), '/projects/social-viewer/test/'].filter(path => path && !built.has(path)));
  for (const link of tags(markup).filter(e => e.name === 'a')) {
    assert.ok(!planned.has(link.attrs.href), 'Unbuilt route in styleguide: ' + link.attrs.href);
    assert.doesNotMatch(link.attrs.href, /\/Nexus-portfolio\//i);
  }
});
