import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { routes } from '../src/routes.mjs';
import { styleguide } from '../src/styleguide/page.mjs';
import { initialLanguageScript } from '../src/partials/language-switch.mjs';
import { dataPairs, readTranslations, foreignPhrases, findForeignText } from './qa/i18n-data.mjs';
import { routeFor, siteRoot, tags, walk } from './qa/site.mjs';

const { it, en, pairs } = await readTranslations();

test('IT and EN have the same keys and every bilingual value in the data is nonempty', () => {
  assert.deepEqual(Object.keys(it).sort(), Object.keys(en).sort());
  for (const pair of pairs) for (const lang of ['it', 'en']) {
    assert.ok(typeof pair[lang] === 'string' && pair[lang].trim(), pair.path + '.' + lang);
  }
});

test('nested bilingual records are checked even when their parent has its own translations', () => {
  const records = [...dataPairs({ it: 'Titolo', en: 'Title', images: [{ alt: { it: 'Ritratto' } }] }, 'sample.json')];
  assert.deepEqual(records.map(pair => pair.path), ['sample.json', 'sample.json.images.0.alt']);
  assert.throws(() => foreignPhrases(records, 'it'), /sample\.json\.images\.0\.alt\.en/);
});

test('every built HTML translation key exists in both dictionaries', async () => {
  let pages = 0;
  for await (const file of walk(siteRoot)) {
    if (!file.endsWith('.html')) continue;
    pages++;
    for (const { attrs } of tags(await readFile(file, 'utf8'))) {
      const keys = ['data-i18n', 'data-label', 'data-i18n-alt', 'data-meta-i18n']
        .filter(attr => Object.hasOwn(attrs, attr)).map(attr => attrs[attr]);
      if (Object.hasOwn(attrs, 'data-i18n-plural')) {
        const base = attrs['data-i18n-plural'];
        keys.push(base + 'One', base + 'Other');
        assert.ok(attrs['data-count']?.trim() && Number.isFinite(Number(attrs['data-count'])), base + ' needs a count');
      }
      for (const key of keys) for (const dict of [it, en]) {
        assert.ok(Object.hasOwn(dict, key), routeFor(file) + ': unknown translation key ' + JSON.stringify(key));
      }
    }
  }
  assert.ok(pages > 0, 'Build the site before checking HTML');
});

test('each route has localized document and sharing titles', () => {
  for (const route of [...routes, styleguide]) {
    const key = route.titleKey ?? 'title.' + route.path;
    const [{ attrs }] = tags(initialLanguageScript(route, { it, en }));
    for (const [lang, dict] of Object.entries({ it, en })) {
      assert.ok(Object.hasOwn(dict, key), route.path + ': missing title key ' + key);
      assert.equal(attrs['data-title-' + lang], dict[key]);
    }
  }
});

test('the head selects query, storage or browser language in that order, before styles and body', async () => {
  const html = await readFile(new URL('../_site/index.html', import.meta.url), 'utf8');
  const head = tags(html.slice(0, html.indexOf('</head>')));
  const index = head.findIndex(({ attrs }) => attrs.id === 'site-language');
  assert.ok(index >= 0 && index < head.findIndex(({ attrs }) => attrs.rel === 'stylesheet'));
  for (const [query, saved, browser, expected] of [
    ['en', 'it', 'it-IT', 'en'], ['it', 'en', 'en-US', 'it'], ['fr', 'en', 'it', 'en'],
    ['', 'it', 'en', 'it'], ['', 'fr', 'it-CH', 'it'], ['', null, 'de-DE', 'en'],
    ['', null, '', 'it'], ['', Error('storage denied'), 'en-GB', 'en'],
  ]) {
    const root = { lang: 'it', dataset: {} };
    runInNewContext(head[index].body, {
      document: { documentElement: root }, URLSearchParams, location: { search: '?lang=' + query },
      localStorage: { getItem(key) { assert.equal(key, 'nexus-language'); if (saved instanceof Error) throw saved; return saved; } },
      navigator: { language: browser },
    });
    assert.equal(root.lang, expected);
    assert.equal(root.dataset.lang, expected);
  }
});

test('visible-text checks find leaked prose in either direction, across line breaks and formatted counts', () => {
  const sample = [
    { path: 'hero', it: 'Una frase <br>su due righe', en: 'A line that wraps' },
    { path: 'count', it: '{count} copie disponibili', en: '{count} copies available' },
    { path: 'name', it: 'A long product name', en: 'A long product name' },
    { path: 'short', it: 'Dodici segni', en: 'Twelve chars' },
  ];
  assert.deepEqual(findForeignText('UNA FRASE\nSU DUE RIGHE · 12.345 copie disponibili', foreignPhrases(sample, 'en')).map(x => x.path), ['hero', 'count']);
  assert.deepEqual(findForeignText('12,345 copies available', foreignPhrases(sample, 'it')).map(x => x.path), ['count']);
  assert.deepEqual(findForeignText('A long product name · Dodici segni', foreignPhrases(sample, 'en')), []);
});
