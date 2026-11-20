import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { decode, tags } from './qa/site.mjs';

const built = readFileSync(new URL('../_site/projects/social-viewer/privacy/index.html', import.meta.url), 'utf8');
const snapshot = readFileSync(new URL('../docs/unify/privacy-snapshot.txt', import.meta.url), 'utf8').trim();
const original = join(homedir(), 'sources', 'Nexus-portfolio', 'socialviewer-privacy.html');

// The original document body is a single main plus a script. Compare the entire
// document inside main, including both selectable editions and every disclosure.
function documentText(source) {
  const clean = source.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const documents = [...clean.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/gi)];
  assert.equal(documents.length, 1, 'Expected one privacy document');
  const text = documents[0][1]
    .replace(/<\/?(?:section|header|footer|div|nav|p|h[1-6]|details|summary|br)\b[^>]*>/gi, ' ')
    .replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, '');
  return decode(text).replace(/\s+/gu, ' ').trim();
}

test('the complete published privacy document matches the original text snapshot', () => {
  assert.equal(documentText(built), snapshot);
});

test('the published text matches the reference checkout directly', { skip: !existsSync(original) && 'reference checkout unavailable' }, () => {
  assert.equal(documentText(built), documentText(readFileSync(original, 'utf8')));
});

test('both legal editions, all twelve disclosures and all three contact links are reachable', () => {
  const main = built.match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0];
  const elements = tags(main);
  assert.deepEqual(elements.filter(e => e.attrs['data-panel']).map(e => e.attrs.lang), ['en', 'it']);
  assert.equal(elements.filter(e => e.name === 'details').length, 12);
  assert.equal(elements.filter(e => e.name === 'summary').length, 12);
  assert.equal(elements.filter(e => e.name === 'a' && e.attrs.href === 'mailto:falker.dev@gmail.com').length, 3);
});
