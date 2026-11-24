import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { cleanModName, collectMods, featuredIds, imageInfo, syncThumbnails } from './update-nexus-downloads.mjs';

const json = body => ({ ok: true, status: 200, json: async () => body });
const user = { memberId: 42, name: 'falker47', modCount: 4, uniqueModDownloads: 900 };
const node = (modId, name, downloads, extra = {}) => ({
  modId, name, downloads, endorsements: 3,
  game: { name: 'Skyrim Special Edition', domainName: 'skyrimspecialedition' },
  modCategory: { name: 'Gameplay' },
  thumbnailUrl: 'https://staticdelivery.nexusmods.com/mods/1704/images/thumbnails/' + modId + '/' + modId + '-1.png',
  ...extra,
});
const nodes = [
  node(7, 'Jiub\'s Opus - Traduzione Italiana', 6),
  node(2414, 'Hogwarts Legacy Save Editor - Final Merge', 10359, { game: { name: 'Hogwarts Legacy', domainName: 'hogwartslegacy' }, modCategory: { name: 'Tools and Utilities' } }),
  node(5, 'Spouse Merchant', 413),
  node(9, 'Unique Uniques SE - Traduzione Italiana 1.1', 30, { modCategory: null }),
];

// A 1x1 lossy WebP header with the stated canvas size (only the header is read).
function webp(width, height) {
  const bytes = Buffer.alloc(40);
  bytes.write('RIFF', 0, 'latin1');
  bytes.writeUInt32LE(32, 4);
  bytes.write('WEBPVP8 ', 8, 'latin1');
  bytes.writeUInt32LE(20, 16);
  bytes.writeUIntBE(0x9d012a, 23, 3);
  bytes.writeUInt16LE(width, 26);
  bytes.writeUInt16LE(height, 28);
  return bytes;
}
function png(width, height) {
  const bytes = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'latin1');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function api({ list = nodes, totalCount = list.length } = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    assert.equal(url, 'https://api.nexusmods.com/v2/graphql');
    const request = JSON.parse(options.body);
    calls.push(request.query);
    if (/userByName/.test(request.query)) return json({ data: { userByName: user } });
    return json({ data: { mods: { totalCount, nodes: list } } });
  };
  return { calls, fetcher };
}

test('reads every mod of the verified member with the published query', async () => {
  const { calls, fetcher } = api();
  const { mods, thumbnails } = await collectMods({ fetcher });
  assert.equal(calls.length, 2);
  assert.match(calls[0], /userByName/);
  assert.match(calls[1], /mods\(filter:\{uploaderId:\[\{value:"42",op:EQUALS\}\]\}, count:100, sort:\[\{downloads:\{direction:DESC\}\}\]\)/);
  assert.match(calls[1], /totalCount nodes\{ modId name downloads endorsements game\{name domainName\} modCategory\{name\} thumbnailUrl \}/);
  assert.deepEqual(mods, [
    { modId: 2414, name: 'Hogwarts Legacy Save Editor', kind: 'mod', game: 'Hogwarts Legacy', category: 'Tools and Utilities',
      downloads: 10359, endorsements: 3, url: 'https://www.nexusmods.com/hogwartslegacy/mods/2414' },
    { modId: 5, name: 'Spouse Merchant', kind: 'mod', game: 'Skyrim Special Edition', category: 'Gameplay',
      downloads: 413, endorsements: 3, url: 'https://www.nexusmods.com/skyrimspecialedition/mods/5' },
    { modId: 9, name: 'Unique Uniques SE', kind: 'translation', game: 'Skyrim Special Edition', category: null,
      downloads: 30, endorsements: 3, url: 'https://www.nexusmods.com/skyrimspecialedition/mods/9' },
    { modId: 7, name: 'Jiub\'s Opus', kind: 'translation', game: 'Skyrim Special Edition', category: 'Gameplay',
      downloads: 6, endorsements: 3, url: 'https://www.nexusmods.com/skyrimspecialedition/mods/7' },
  ]);
  assert.equal(thumbnails.size, 4);
  // A known member id needs the list request only.
  const direct = api();
  await collectMods({ fetcher: direct.fetcher, memberId: 42 });
  assert.equal(direct.calls.length, 1);
});

test('cleans the published names', () => {
  assert.equal(cleanModName('Hogwarts Legacy Save Editor - Final Merge'), 'Hogwarts Legacy Save Editor');
  assert.equal(cleanModName('Elianora\'s Breezehome Overhaul (EBO) - Traduzione Italiana Revisionata'), 'Elianora\'s Breezehome Overhaul (EBO)');
  assert.equal(cleanModName('Soarin\' Over Skyrim 1.4.6 - Traduzione Italiana'), 'Soarin\' Over Skyrim 1.4.6');
  assert.equal(cleanModName('My Home is Your Home (MHiYH 2plus) - SSE - Traduzione Italiana'), 'My Home is Your Home (MHiYH 2plus) - SSE');
  assert.equal(cleanModName('Soarin\' Over Skyrim - Configurable Flight Speed - MCM'), 'Soarin\' Over Skyrim - Configurable Flight Speed - MCM');
});

test('rejects a partial list, malformed mods and API errors', async () => {
  await assert.rejects(collectMods({ fetcher: api({ totalCount: 120 }).fetcher }), /page the query/);
  await assert.rejects(collectMods({ fetcher: async () => json({ errors: [{ message: 'Unauthorized' }] }) }), /Unauthorized/);
  await assert.rejects(collectMods({ fetcher: api().fetcher, memberId: 0 }), /member id/);
  for (const invalid of [
    node(0, 'Zero', 1), node(5, '', 1), node(5, 'Negative', -1), node(5, 'Half', 1.5),
    node(5, 'Endorsements', 1, { endorsements: null }),
    node(5, 'Domain', 1, { game: { name: 'Skyrim', domainName: '../x' } }),
    node(5, ' - Traduzione Italiana', 1),
  ]) {
    await assert.rejects(collectMods({ fetcher: api({ list: [invalid] }).fetcher, memberId: 42 }), /Nexus Mods/);
  }
  await assert.rejects(collectMods({ fetcher: api({ list: [node(5, 'A', 2), node(5, 'B', 1)] }).fetcher, memberId: 42 }), /mod id/);
});

test('reads the size of PNG and WebP files from their headers', () => {
  assert.deepEqual(imageInfo(webp(385, 216)), { ext: 'webp', width: 385, height: 216 });
  assert.deepEqual(imageInfo(png(640, 360)), { ext: 'png', width: 640, height: 360 });
  assert.throws(() => imageInfo(Buffer.from('<html>not an image</html>')), /Unsupported/);
});

test('downloads pictures for every published mod, translations included, keeps existing covers and removes stale files', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'nexus-thumbs-'));
  try {
    writeFileSync(join(dir, '999.png'), 'stale');
    writeFileSync(join(dir, 'README.txt'), 'kept');
    const { mods, thumbnails } = await collectMods({ fetcher: api().fetcher, memberId: 42 });
    const requested = [];
    const fetcher = async url => {
      requested.push(url);
      return { ok: true, status: 200, arrayBuffer: async () => webp(385, 216) };
    };
    const first = await syncThumbnails({ mods, thumbnails, covered: new Set([2414]), fetcher, dir });
    // 2414 keeps its cover from data/mods.json; the translations 9 and 7 get their Nexus pictures (V4).
    assert.deepEqual(requested, [thumbnails.get(5), thumbnails.get(9), thumbnails.get(7)]);
    const picture = id => ({ src: '/assets/nexus/' + id + '.webp', width: 385, height: 216, source: thumbnails.get(id) });
    assert.deepEqual(first.map(mod => mod.image), [null, picture(5), picture(9), picture(7)]);
    assert.deepEqual(readdirSync(dir).sort(), ['5.webp', '7.webp', '9.webp', 'README.txt']);
    assert.deepEqual(readFileSync(join(dir, '5.webp')), webp(385, 216));
    // An unchanged source is not downloaded again; a new one replaces the file.
    await syncThumbnails({ mods, thumbnails, previous: first, covered: new Set([2414]), fetcher, dir });
    assert.equal(requested.length, 3);
    const moved = new Map(thumbnails).set(5, thumbnails.get(5).replace('-1.png', '-2.png'));
    const next = await syncThumbnails({ mods, thumbnails: moved, previous: first, covered: new Set([2414]),
      fetcher: async url => { requested.push(url); return { ok: true, status: 200, arrayBuffer: async () => png(640, 360) }; }, dir });
    assert.equal(requested.length, 4);
    assert.equal(next[1].image.src, '/assets/nexus/5.png');
    assert.deepEqual(readdirSync(dir).sort(), ['5.png', '7.webp', '9.webp', 'README.txt']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('refuses pictures from another host, failed downloads and non-images', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'nexus-thumbs-'));
  try {
    const mods = [{ modId: 5, name: 'Spouse Merchant', kind: 'mod' }];
    const run = (source, fetcher) => syncThumbnails({ mods, thumbnails: new Map([[5, source]]), covered: new Set(), fetcher, dir });
    const never = async () => { throw Error('must not fetch'); };
    await assert.rejects(run('https://example.com/5.png', never), /host/);
    await assert.rejects(run('http://staticdelivery.nexusmods.com/5.png', never), /host/);
    const source = 'https://staticdelivery.nexusmods.com/5.png';
    await assert.rejects(run(source, async () => ({ ok: false, status: 404 })), /HTTP 404/);
    await assert.rejects(run(source, async () => ({ ok: true, arrayBuffer: async () => Buffer.from('<html>') })), /Unsupported/);
    await assert.rejects(run(source, async () => ({ ok: true, arrayBuffer: async () => Buffer.alloc(400_001) })), /bytes/);
    assert.deepEqual(readdirSync(dir), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the committed snapshot matches its pictures and the featured covers', () => {
  const snapshot = JSON.parse(readFileSync(new URL('../data/nexus-mods.json', import.meta.url), 'utf8'));
  const covered = featuredIds();
  assert.deepEqual([...covered].sort((a, b) => a - b), [2414, 193883, 198756]);
  assert.equal(snapshot.username, 'falker47');
  assert.match(snapshot.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(snapshot.totalCount, snapshot.mods.length);
  assert.ok(snapshot.mods.length > 0);
  const downloads = snapshot.mods.map(mod => mod.downloads);
  assert.deepEqual(downloads, [...downloads].sort((a, b) => b - a), 'Most downloaded first');
  for (const mod of snapshot.mods) {
    assert.ok(['mod', 'translation'].includes(mod.kind));
    assert.doesNotMatch(mod.name, /Traduzione Italiana|Final Merge/);
    assert.equal(mod.url, new URL(mod.url).href);
    assert.match(mod.url, new RegExp('^https://www\\.nexusmods\\.com/[a-z0-9]+/mods/' + mod.modId + '$'));
    if (covered.has(mod.modId)) { assert.equal(mod.image, null, mod.name); continue; }
    // A mod Nexus shows without a picture keeps the typographic header.
    if (mod.image === null) continue;
    assert.match(mod.image.src, new RegExp('^/assets/nexus/' + mod.modId + '\\.(?:png|webp|jpg)$'));
    const info = imageInfo(readFileSync(new URL('..' + mod.image.src, import.meta.url)));
    assert.deepEqual([info.width, info.height], [mod.image.width, mod.image.height], mod.name);
    assert.ok(mod.image.src.endsWith('.' + info.ext));
  }
  for (const id of covered) assert.ok(snapshot.mods.some(mod => mod.modId === id), 'Featured mod ' + id + ' is published');
});
