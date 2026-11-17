import test from 'node:test';
import assert from 'node:assert/strict';
import { collectTotalDownloads } from './update-nexus-downloads.mjs';
import { formatStats } from './nexus-downloads.mjs';

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function mod(uid, downloads, memberId = 42) {
  return { uid, downloads, uploader: { memberId } };
}

test('sums all mods across pages, without confusing unique and total downloads', async () => {
  const calls = [];
  const fetcher = async (_url, options) => {
    const payload = JSON.parse(options.body);
    calls.push(payload);
    if (payload.query.includes('userByName')) {
      return response({ data: { userByName: { memberId: 42, name: 'falker47' } } });
    }
    assert.equal(payload.variables.filter.uploaderId[0].value, '42');
    assert.equal(payload.variables.filter.uploaderId[0].op, 'EQUALS');
    assert.equal(payload.variables.count, 2);
    if (payload.variables.offset === 0) {
      return response({ data: { mods: { totalCount: 3, nodes: [mod('A', 110), mod('B', 220)] } } });
    }
    if (payload.variables.offset === 2) {
      return response({ data: { mods: { totalCount: 3, nodes: [mod('C', 330)] } } });
    }
    throw new Error('Unexpected page');
  };
  const stats = await collectTotalDownloads({ fetcher, username: 'falker47', pageSize: 2 });
  assert.deepEqual(stats, { username: 'falker47', modCount: 3, totalDownloads: 660 });
  assert.equal(calls.length, 3);
});

test('fails closed on API GraphQL errors', async () => {
  const fetcher = async () => response({ errors: [{ message: 'Unauthorized' }] });
  await assert.rejects(collectTotalDownloads({ fetcher }), /Unauthorized/);
});

test('fails closed if the user cannot be resolved', async () => {
  const fetcher = async () => response({ data: { userByName: null } });
  await assert.rejects(collectTotalDownloads({ fetcher }), /user/i);
});

test('rejects downloads attributed to another uploader', async () => {
  const fetcher = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    return query.includes('userByName')
      ? response({ data: { userByName: { memberId: 42, name: 'falker47' } } })
      : response({ data: { mods: { totalCount: 1, nodes: [mod('A', 100, 999)] } } });
  };
  await assert.rejects(collectTotalDownloads({ fetcher }), /uploader/i);
});

test('rejects duplicate and incomplete mod pages', async () => {
  let page = 0;
  const fetcher = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    if (query.includes('userByName')) return response({ data: { userByName: { memberId: 42, name: 'falker47' } } });
    page++;
    return response({ data: { mods: { totalCount: 3, nodes: page === 1
      ? [mod('A', 10), mod('B', 20)]
      : [mod('B', 20)] } } });
  };
  await assert.rejects(collectTotalDownloads({ fetcher, pageSize: 2 }), /duplicate/i);
});

test('rejects non-integer download counts and incomplete responses', async () => {
  const fetcher = async (_url, options) => {
    const { query } = JSON.parse(options.body);
    return query.includes('userByName')
      ? response({ data: { userByName: { memberId: 42, name: 'falker47' } } })
      : response({ data: { mods: { totalCount: 1, nodes: [mod('A', 2.5)] } } });
  };
  await assert.rejects(collectTotalDownloads({ fetcher }), /download/i);
});

test('renders exact localized totals for Italian and English', () => {
  assert.deepEqual(formatStats(12345, 'it'), {
    counter: '12.345',
    proof: '12.345 download su Nexus Mods ↗'
  });
  assert.deepEqual(formatStats(12345, 'en'), {
    counter: '12,345',
    proof: '12,345 downloads on Nexus Mods ↗'
  });
  assert.throws(() => formatStats(-1, 'it'), /downloads/i);
});
