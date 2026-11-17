import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ENDPOINT = 'https://api.nexusmods.com/v2/graphql';
const USERNAME = 'falker47';
const USER_QUERY = 'query NexusUser($name: String!) { userByName(name: $name) { memberId name } }';
const MODS_QUERY = 'query NexusMods($filter: ModsFilter!, $count: Int!, $offset: Int!) { mods(filter: $filter, count: $count, offset: $offset) { totalCount nodes { uid downloads uploader { memberId } } } }';
const OUTPUT = new URL('../data/nexus-downloads.json', import.meta.url);

async function graphql(fetcher, query, variables) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Application-Name': 'falker47-master-portfolio',
    'Application-Version': '1.0'
  };
  // Optional for installations that require authenticated API access.
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

/** Return total downloads of all publicly listed mods uploaded by the named user. */
export async function collectTotalDownloads({ fetcher = fetch, username = USERNAME, pageSize = 100 } = {}) {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new RangeError('pageSize must be between 1 and 100');
  }
  const userData = await graphql(fetcher, USER_QUERY, { name: username });
  const user = userData.userByName;
  if (!Number.isSafeInteger(user?.memberId) || user.memberId < 1 ||
      typeof user.name !== 'string' || user.name.toLowerCase() !== username.toLowerCase()) {
    throw new Error('Nexus Mods user could not be verified: ' + username);
  }

  const memberId = String(user.memberId);
  const filter = { uploaderId: [{ value: memberId, op: 'EQUALS' }] };
  let expectedCount = null;
  let offset = 0;
  let totalDownloads = 0;
  const seen = new Set();

  for (let page = 0; page < 1000; page++) {
    const data = await graphql(fetcher, MODS_QUERY, { filter, count: pageSize, offset });
    const listing = data.mods;
    if (!Number.isSafeInteger(listing?.totalCount) || listing.totalCount < 0 ||
        !Array.isArray(listing.nodes)) {
      throw new Error('Incomplete Nexus Mods response');
    }
    if (expectedCount === null) expectedCount = listing.totalCount;
    if (listing.totalCount !== expectedCount) {
      throw new Error('Mod count changed during pagination; retry the next refresh');
    }
    if (expectedCount === 0) {
      throw new Error('No Nexus Mods were returned; refuse to replace the last known total');
    }
    if (listing.nodes.length === 0 || listing.nodes.length > pageSize) {
      throw new Error('Incomplete Nexus Mods page');
    }
    for (const mod of listing.nodes) {
      if (!mod || mod.uid == null || seen.has(String(mod.uid))) {
        throw new Error('Duplicate or missing Nexus Mods mod identifier');
      }
      if (String(mod.uploader?.memberId) !== memberId) {
        throw new Error('Unexpected Nexus Mods uploader');
      }
      if (!Number.isSafeInteger(mod.downloads) || mod.downloads < 0) {
        throw new Error('Invalid Nexus Mods download count');
      }
      seen.add(String(mod.uid));
      totalDownloads += mod.downloads;
      if (!Number.isSafeInteger(totalDownloads)) {
        throw new Error('Nexus Mods download total exceeds safe integer range');
      }
    }
    offset += listing.nodes.length;
    if (offset === expectedCount) {
      return { username, modCount: seen.size, totalDownloads };
    }
    if (offset > expectedCount) {
      throw new Error('Nexus Mods pagination exceeded totalCount');
    }
  }
  throw new Error('Nexus Mods pagination exceeded maximum pages');
}

export async function updateDownloads() {
  const stats = await collectTotalDownloads();
  const snapshot = {
    username: stats.username,
    totalDownloads: stats.totalDownloads,
    modCount: stats.modCount,
    checkedOn: new Date().toISOString().slice(0, 10),
    source: 'Nexus Mods GraphQL'
  };

  let old = null;
  try {
    old = JSON.parse(readFileSync(OUTPUT, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (old && old.username === snapshot.username &&
      old.totalDownloads === snapshot.totalDownloads &&
      old.modCount === snapshot.modCount &&
      old.checkedOn === snapshot.checkedOn) {
    console.log('Nexus Mods downloads unchanged today:', snapshot.totalDownloads);
    return snapshot;
  }
  writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log('Nexus Mods downloads updated:', snapshot.totalDownloads, 'across', snapshot.modCount, 'mods');
  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  updateDownloads().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
