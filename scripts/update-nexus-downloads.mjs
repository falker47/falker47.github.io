import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ENDPOINT = 'https://api.nexusmods.com/v2/graphql';
const USERNAME = 'falker47';
const USER_QUERY = 'query NexusUser($name: String!) { userByName(name: $name) { memberId name modCount uniqueModDownloads } }';
const OUTPUT = new URL('../data/nexus-downloads.json', import.meta.url);

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

/** Return the exact user-profile unique mod downloads, not a sum of raw mod downloads. */
export async function collectProfileDownloads({ fetcher = fetch, username = USERNAME } = {}) {
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
  return {
    username,
    uniqueModDownloads: user.uniqueModDownloads,
    modCount: user.modCount
  };
}

export async function updateDownloads() {
  const stats = await collectProfileDownloads();
  const snapshot = {
    username: stats.username,
    uniqueModDownloads: stats.uniqueModDownloads,
    modCount: stats.modCount,
    checkedOn: new Date().toISOString().slice(0, 10),
    source: 'Nexus Mods GraphQL user.uniqueModDownloads'
  };

  let old = null;
  try {
    old = JSON.parse(readFileSync(OUTPUT, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (old && old.username === snapshot.username &&
      old.uniqueModDownloads === snapshot.uniqueModDownloads &&
      old.modCount === snapshot.modCount) {
    // Totals unchanged: keep the file as is, so the daily job does not add a commit with only a new date.
    console.log('Nexus Mods unique downloads unchanged:', snapshot.uniqueModDownloads);
    return snapshot;
  }
  writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log('Nexus Mods unique downloads updated:', snapshot.uniqueModDownloads, 'across', snapshot.modCount, 'mods');
  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  updateDownloads().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
