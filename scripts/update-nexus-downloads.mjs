import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const ENDPOINT = 'https://api.nexusmods.com/v2/graphql';
const USERNAME = 'falker47';
const USER_QUERY = 'query NexusUser($name: String!) { userByName(name: $name) { memberId name modCount uniqueModDownloads } }';
const OUTPUT = new URL('../data/nexus-downloads.json', import.meta.url);
const MODS_OUTPUT = new URL('../data/nexus-mods.json', import.meta.url);
const FEATURED = new URL('../data/mods.json', import.meta.url);
const THUMBNAILS = fileURLToPath(new URL('../assets/nexus/', import.meta.url));
const THUMBNAIL_HOST = 'staticdelivery.nexusmods.com';
const THUMBNAIL_LIMIT = 400_000;
const PAGE = 100;
// The member id is a verified positive integer, so the filter value is safe inline.
const modsQuery = memberId => 'query NexusMods { mods(filter:{uploaderId:[{value:"' + memberId + '",op:EQUALS}]}, count:' + PAGE +
  ', sort:[{downloads:{direction:DESC}}]){ totalCount nodes{ modId name downloads endorsements game{name domainName} modCategory{name} thumbnailUrl } } }';

async function graphql(fetcher, query, variables) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Application-Name': 'falker47-master-portfolio',
    'Application-Version': '1.0'
  };
  if (process.env.NEXUS_API_KEY) headers.APIKEY = process.env.NEXUS_API_KEY;
  const response = await fetcher(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error('Nexus Mods GraphQL HTTP ' + response.status);
  const payload = await response.json();
  if (Array.isArray(payload?.errors) && payload.errors.length) {
    throw new Error('Nexus Mods GraphQL: ' + payload.errors.map(e => e.message || 'unknown error').join('; '));
  }
  if (!payload?.data) throw new Error('Nexus Mods returned no GraphQL data');
  return payload.data;
}

async function verifiedUser(fetcher, username) {
  const userData = await graphql(fetcher, USER_QUERY, { name: username });
  const user = userData.userByName;
  if (!Number.isSafeInteger(user?.memberId) || user.memberId < 1 ||
      typeof user.name !== 'string' || user.name.toLowerCase() !== username.toLowerCase()) {
    throw new Error('Nexus Mods user could not be verified: ' + username);
  }
  if (!Number.isSafeInteger(user.uniqueModDownloads) || user.uniqueModDownloads < 0) {
    throw new Error('Invalid Nexus Mods profile unique-download count');
  }
  if (!Number.isSafeInteger(user.modCount) || user.modCount < 0) {
    throw new Error('Invalid Nexus Mods profile mod count');
  }
  return user;
}

/** Return the exact user-profile unique mod downloads, not a sum of raw mod downloads. */
export async function collectProfileDownloads({ fetcher = fetch, username = USERNAME } = {}) {
  const user = await verifiedUser(fetcher, username);
  return {
    username,
    uniqueModDownloads: user.uniqueModDownloads,
    modCount: user.modCount
  };
}

const TRANSLATION = /Traduzione Italiana/i;

/** "X - Traduzione Italiana 1.1" becomes "X"; "Y - Final Merge" becomes "Y". */
export function cleanModName(name) {
  return name.replace(/\s*-\s*Traduzione Italiana.*$/i, '').replace(/ - Final Merge/g, '').trim();
}

const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isText = value => typeof value === 'string' && value.trim().length > 0;

/**
 * Every published mod of the member, most downloaded first. `thumbnails` maps a
 * mod id to the picture Nexus serves for it; the address stays out of the mod records.
 */
export async function collectMods({ fetcher = fetch, username = USERNAME, memberId } = {}) {
  const id = memberId ?? (await verifiedUser(fetcher, username)).memberId;
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Invalid Nexus Mods member id');
  const page = (await graphql(fetcher, modsQuery(id))).mods;
  if (!Array.isArray(page?.nodes) || !isCount(page.totalCount)) throw new Error('Nexus Mods returned no mod list');
  if (page.totalCount !== page.nodes.length) {
    throw new Error('Nexus Mods lists ' + page.totalCount + ' mods but returned ' + page.nodes.length + ': page the query');
  }
  const thumbnails = new Map();
  const seen = new Set();
  const mods = page.nodes.map(node => {
    if (!Number.isSafeInteger(node?.modId) || node.modId < 1 || seen.has(node.modId)) throw new Error('Invalid Nexus Mods mod id');
    seen.add(node.modId);
    if (!isText(node.name) || !isText(node.game?.name) || !/^[a-z0-9]+$/.test(node.game?.domainName ?? '')) {
      throw new Error('Invalid Nexus Mods mod ' + node.modId);
    }
    if (!isCount(node.downloads) || !isCount(node.endorsements)) throw new Error('Invalid Nexus Mods counts for mod ' + node.modId);
    const name = cleanModName(node.name);
    if (!name) throw new Error('Empty Nexus Mods name for mod ' + node.modId);
    if (isText(node.thumbnailUrl)) thumbnails.set(node.modId, node.thumbnailUrl);
    return {
      modId: node.modId,
      name,
      kind: TRANSLATION.test(node.name) ? 'translation' : 'mod',
      game: node.game.name.trim(),
      category: isText(node.modCategory?.name) ? node.modCategory.name.trim() : null,
      downloads: node.downloads,
      endorsements: node.endorsements,
      url: 'https://www.nexusmods.com/' + node.game.domainName + '/mods/' + node.modId
    };
  }).sort((a, b) => b.downloads - a.downloads || a.modId - b.modId);
  return { mods, thumbnails };
}

/** Read the format and pixel size from the file header: Nexus serves WebP under a .png address. */
export function imageInfo(bytes) {
  const b = Buffer.from(bytes);
  const ascii = (start, end) => b.toString('latin1', start, end);
  let info;
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47 && ascii(12, 16) === 'IHDR') {
    info = { ext: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  } else if (b.length > 30 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    const chunk = ascii(12, 16);
    if (chunk === 'VP8X') info = { ext: 'webp', width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    else if (chunk === 'VP8 ' && b.readUIntBE(23, 3) === 0x9d012a) info = { ext: 'webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    else if (chunk === 'VP8L' && b[20] === 0x2f) {
      const bits = b.readUInt32LE(21);
      info = { ext: 'webp', width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
  } else if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    for (let at = 2; at + 9 < b.length && b[at] === 0xff;) {
      const marker = b[at + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        info = { ext: 'jpg', width: b.readUInt16BE(at + 7), height: b.readUInt16BE(at + 5) };
        break;
      }
      at += 2 + b.readUInt16BE(at + 2);
    }
  }
  if (!info || !(info.width > 0 && info.height > 0)) throw new Error('Unsupported thumbnail image');
  return info;
}

/** Mod ids that already have a cover in data/mods.json. */
export function featuredIds(file = FEATURED) {
  return new Set(JSON.parse(readFileSync(file, 'utf8')).items
    .map(item => Number(/\/mods\/(\d+)$/.exec(item.url)?.[1])).filter(Number.isSafeInteger));
}

/**
 * Give every published mod, translations included (V4), a local picture in `dir`
 * (<modId>.<ext>). Mods with a cover in data/mods.json keep that cover and download
 * nothing; a mod without a Nexus picture keeps a typographic header. An unchanged
 * source is not fetched again.
 */
export async function syncThumbnails({ mods, thumbnails, previous = [], covered = featuredIds(), fetcher = fetch, dir = THUMBNAILS }) {
  const known = new Map(previous.filter(mod => mod.image).map(mod => [mod.modId, mod.image]));
  let files;
  try { files = new Set(readdirSync(dir)); } catch { files = new Set(); }
  const keep = new Set();
  const result = [];
  for (const mod of mods) {
    const source = thumbnails.get(mod.modId);
    let image = null;
    if (!covered.has(mod.modId) && source) {
      const url = new URL(source);
      if (url.protocol !== 'https:' || url.hostname !== THUMBNAIL_HOST) throw new Error('Unexpected thumbnail host for mod ' + mod.modId);
      const prior = known.get(mod.modId);
      if (prior?.source === source && files.has(prior.src.split('/').pop())) image = prior;
      else {
        const response = await fetcher(url.href, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error('Nexus Mods thumbnail HTTP ' + response.status + ' for mod ' + mod.modId);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length || bytes.length > THUMBNAIL_LIMIT) throw new Error('Thumbnail of ' + bytes.length + ' bytes for mod ' + mod.modId);
        const { ext, width, height } = imageInfo(bytes);
        const file = mod.modId + '.' + ext;
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, file), bytes);
        image = { src: '/assets/nexus/' + file, width, height, source };
      }
      keep.add(image.src.split('/').pop());
    }
    result.push({ ...mod, image });
  }
  for (const file of files) if (/^\d+\.(?:png|webp|jpg)$/.test(file) && !keep.has(file)) rmSync(join(dir, file));
  return result;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

export async function updateDownloads() {
  // Read both answers first: a failed request leaves both snapshots as they were.
  const user = await verifiedUser(fetch, USERNAME);
  const list = await collectMods({ memberId: user.memberId });
  const checkedOn = new Date().toISOString().slice(0, 10);
  const snapshot = {
    username: USERNAME,
    uniqueModDownloads: user.uniqueModDownloads,
    modCount: user.modCount,
    checkedOn,
    source: 'Nexus Mods GraphQL user.uniqueModDownloads'
  };

  const old = readJson(OUTPUT);
  if (old && old.username === snapshot.username &&
      old.uniqueModDownloads === snapshot.uniqueModDownloads &&
      old.modCount === snapshot.modCount &&
      old.checkedOn === snapshot.checkedOn) {
    console.log('Nexus Mods unique downloads unchanged today:', snapshot.uniqueModDownloads);
  } else {
    writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2) + '\n');
    console.log('Nexus Mods unique downloads updated:', snapshot.uniqueModDownloads, 'across', snapshot.modCount, 'mods');
  }

  const oldMods = readJson(MODS_OUTPUT);
  const mods = await syncThumbnails({ ...list, previous: oldMods?.mods ?? [] });
  const serialized = JSON.stringify({
    username: USERNAME,
    checkedOn,
    source: 'Nexus Mods GraphQL mods(filter: uploaderId)',
    totalCount: mods.length,
    mods
  }, null, 2) + '\n';
  if (oldMods && JSON.stringify(oldMods, null, 2) + '\n' === serialized) {
    console.log('Nexus Mods list unchanged today:', mods.length, 'mods');
  } else {
    writeFileSync(MODS_OUTPUT, serialized);
    console.log('Nexus Mods list updated:', mods.length, 'mods, of which', mods.filter(mod => mod.kind === 'translation').length, 'translations');
  }
  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  updateDownloads().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
