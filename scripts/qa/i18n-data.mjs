import { readdir, readFile } from 'node:fs/promises';

const data = new URL('../../data/', import.meta.url);
const json = async file => JSON.parse(await readFile(new URL(file, data), 'utf8'));

export function* dataPairs(value, path) {
  if (!value || typeof value !== 'object') return;
  if (Object.hasOwn(value, 'it') || Object.hasOwn(value, 'en')) {
    yield { path, it: value.it, en: value.en };
  }
  for (const [key, child] of Object.entries(value)) yield* dataPairs(child, path + '.' + key);
}

export async function readTranslations() {
  const it = await json('i18n/it.json');
  const en = await json('i18n/en.json');
  const pairs = Array.from(new Set([...Object.keys(it), ...Object.keys(en)]),
    key => ({ path: 'i18n.' + key, it: it[key], en: en[key] }));
  for (const file of (await readdir(data)).sort()) {
    if (file.endsWith('.json')) pairs.push(...dataPairs(await json(file), file));
  }
  return { it, en, pairs };
}

function normalize(text) {
  return text.normalize('NFC').replace(/<br\s*\/?>/gi, ' ').replace(/\s+/gu, ' ').trim().toLowerCase();
}

export function foreignPhrases(pairs, lang) {
  const other = lang === 'it' ? 'en' : 'it';
  const phrases = new Map();
  for (const pair of pairs) {
    for (const language of ['it', 'en']) {
      if (typeof pair[language] !== 'string' || !pair[language].trim()) {
        throw Error(pair.path + '.' + language + ': expected nonempty localized text');
      }
    }
    const text = normalize(pair[other]);
    if ([...text].length <= 12 || text === normalize(pair[lang]) || phrases.has(text)) continue;
    const parts = text.split('{count}');
    const escape = part => part.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');
    const pattern = parts.length > 1
      ? new RegExp(parts.map(escape).join('[+−-]?\\p{N}+(?:[.,\\s]\\p{N}+)*'), 'u') : null;
    phrases.set(text, { path: pair.path, text, pattern });
  }
  return [...phrases.values()];
}

export function findForeignText(visibleText, phrases) {
  const visible = normalize(visibleText);
  return phrases.filter(({ text, pattern }) => pattern ? pattern.test(visible) : visible.includes(text))
    .map(({ path, text }) => ({ path, text }));
}
