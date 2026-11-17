import test from 'node:test';
import assert from 'node:assert/strict';
import { collectProfileDownloads } from './update-nexus-downloads.mjs';
import { formatStats, loadStats } from './nexus-downloads.mjs';

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, json: async () => body };
}

function profile(overrides = {}) {
  return {
    memberId: 42,
    name: 'falker47',
    modCount: 27,
    uniqueModDownloads: 10699,
    uniqueCollectionDownloads: 9,
    ...overrides
  };
}

test('uses the exact Nexus Mods profile uniqueModDownloads metric, not all downloads or collections', async () => {
  const calls = [];
  const fetcher = async (_url, options) => {
    const request = JSON.parse(options.body);
    calls.push(request);
    assert.match(request.query, /userByName/);
    assert.match(request.query, /\buniqueModDownloads\b/);
    assert.match(request.query, /\bmodCount\b/);
    assert.doesNotMatch(request.query, /\bmods\s*\(/);
    assert.equal(request.variables.name, 'falker47');
    return response({ data: { userByName: profile() } });
  };
  assert.deepEqual(await collectProfileDownloads({ fetcher }), {
    username: 'falker47', modCount: 27, uniqueModDownloads: 10699
  });
  assert.equal(calls.length, 1, 'The profile metric should need one request, not paginated mod totals');
});

test('rejects API errors without overwriting the prior snapshot', async () => {
  await assert.rejects(
    collectProfileDownloads({ fetcher: async () => response({ errors: [{ message: 'Unauthorized' }] }) }),
    /Unauthorized/
  );
  await assert.rejects(
    collectProfileDownloads({ fetcher: async () => response({ data: { userByName: null } }) }),
    /user/i
  );
});

test('rejects wrong profile identity and malformed unique-download counts', async () => {
  for (const invalid of [
    profile({ name: 'someone-else' }),
    profile({ memberId: 0 }),
    profile({ uniqueModDownloads: -1 }),
    profile({ uniqueModDownloads: null }),
    profile({ uniqueModDownloads: 22.5 }),
    profile({ modCount: -1 }),
    profile({ modCount: null })
  ]) {
    await assert.rejects(
      collectProfileDownloads({ fetcher: async () => response({ data: { userByName: invalid } }) }),
      /user|count|download|mod/i
    );
  }
});

test('renders unique downloads exactly in Italian and English', () => {
  assert.deepEqual(formatStats(10699, 'it'), {
    counter: '10.699',
    proof: '10.699 download su Nexus Mods ↗'
  });
  assert.deepEqual(formatStats(10699, 'en'), {
    counter: '10,699',
    proof: '10,699 downloads on Nexus Mods ↗'
  });
  assert.throws(() => formatStats(-1, 'it'), /downloads/i);
});

test('loads the uniqueModDownloads snapshot and rejects totalDownloads-only data', async () => {
  const expected = {
    username: 'falker47', uniqueModDownloads: 10699,
    modCount: 27, checkedOn: '2026-11-17'
  };
  assert.deepEqual(await loadStats(async () => response(expected)), expected);
  await assert.rejects(
    loadStats(async () => response({
      username: 'falker47', totalDownloads: 12447,
      modCount: 27, checkedOn: '2026-11-17'
    })),
    /Invalid Nexus Mods stats snapshot/
  );
});

test('updates the download counter after changing language, without changing to the total-download metric', async () => {
  const originalDocument = globalThis.document;
  const originalFetch = globalThis.fetch;
  const counter = { textContent: '10k+' };
  const proof = { textContent: '10k+ download su Nexus Mods ↗' };
  const listeners = {};
  const fakeDocument = {
    documentElement: { lang: 'it' },
    addEventListener(event, fn) { listeners[event] = fn; },
    querySelectorAll(selector) {
      if (selector === '[data-i18n="moddingNumber"]') return [counter];
      if (selector === '[data-i18n="modProof"]') return [proof];
      return [];
    }
  };
  globalThis.document = fakeDocument;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.cache, 'no-store');
    return response({ username: 'falker47', uniqueModDownloads: 10699, checkedOn: '2026-11-17' });
  };
  try {
    await import('./nexus-downloads.mjs?test=unique-downloads-language-change');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(counter.textContent, '10.699');
    assert.equal(proof.textContent, '10.699 download su Nexus Mods ↗');
    fakeDocument.documentElement.lang = 'en';
    listeners['portfolio:languagechange']();
    assert.equal(counter.textContent, '10,699');
    assert.equal(proof.textContent, '10,699 downloads on Nexus Mods ↗');
  } finally {
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
  }
});
