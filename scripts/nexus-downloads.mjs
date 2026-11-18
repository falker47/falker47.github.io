const DATA_URL = 'https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json';

export function formatStats(uniqueModDownloads, language = 'it') {
  if (!Number.isSafeInteger(uniqueModDownloads) || uniqueModDownloads < 0) {
    throw new TypeError('Invalid Nexus Mods unique downloads');
  }
  const lang = language === 'en' ? 'en' : 'it';
  const counter = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'it-IT').format(uniqueModDownloads);
  return {
    counter,
    proof: lang === 'en'
      ? counter + ' downloads on Nexus Mods ↗'
      : counter + ' download su Nexus Mods ↗'
  };
}

export async function loadStats(fetcher = fetch) {
  const response = await fetcher(DATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('Nexus Mods stats HTTP ' + response.status);
  const stats = await response.json();
  if (stats?.username !== 'falker47' ||
      !Number.isSafeInteger(stats.uniqueModDownloads) || stats.uniqueModDownloads < 0 ||
      typeof stats.checkedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(stats.checkedOn)) {
    throw new Error('Invalid Nexus Mods stats snapshot');
  }
  return stats;
}

if (typeof document !== 'undefined') {
  let stats = null;

  const render = () => {
    if (!stats) return;
    const localized = formatStats(stats.uniqueModDownloads, document.documentElement.lang);
    document.querySelectorAll('[data-i18n="moddingNumber"]').forEach(node => {
      node.textContent = localized.counter;
    });
    if (Number.isSafeInteger(stats.modCount) && stats.modCount >= 0) document.querySelectorAll('[data-nexus-stat="modCount"]').forEach(node => {
      node.textContent = new Intl.NumberFormat(document.documentElement.lang === 'en' ? 'en-US' : 'it-IT').format(stats.modCount);
    });
    document.querySelectorAll('[data-i18n="modProof"]').forEach(node => {
      node.textContent = localized.proof;
    });
  };

  // Inline localization resets translated text; reapply live data after each language change.
  document.addEventListener('portfolio:languagechange', render);
  loadStats().then(value => {
    stats = value;
    render();
  }).catch(() => {
    // Keep the existing 12k+ fallback; never show a fabricated zero after an API error.
  });
}
