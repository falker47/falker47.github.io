import { readFile } from 'node:fs/promises';

const snapshotUrl = 'https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json';
const snapshot = await readFile(new URL('../../data/nexus-downloads.json', import.meta.url));

export async function isolateNetwork(context, origin, requests = []) {
  await context.route(/^https?:\/\//, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const entry = { method: request.method(), type: request.resourceType(), url: url.href };
    if (url.href === snapshotUrl && entry.method === 'GET') {
      requests.push({ ...entry, disposition: 'fulfilled from committed data/nexus-downloads.json before network' });
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: snapshot });
    }
    if (url.origin === origin) {
      requests.push({ ...entry, disposition: 'loopback' });
      return route.continue();
    }
    requests.push({ ...entry, disposition: 'blocked' });
    return route.abort('blockedbyclient');
  });
  return () => {
    const blocked = requests.filter(entry => entry.disposition === 'blocked');
    if (blocked.length) throw Error('Unexpected external request: ' + blocked.map(r => r.url).join(', '));
  };
}
