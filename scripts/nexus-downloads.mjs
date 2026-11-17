const DATA_URL = 'https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json';

export function formatStats(totalDownloads, language = 'it') {
  if (!Number.isSafeInteger(totalDownloads) || totalDownloads < 0) {
    throw new TypeError('Invalid Nexus Mods downloads total');
  }
  const lang = language === 'en' ? 'en' : 'it';
  const counter = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'it-IT').format(totalDownloads);
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
      !Number.isSafeInteger(stats.totalDownloads) || stats.totalDownloads < 0 ||
      typeof stats.checkedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(stats.checkedOn)) {
    throw new Error('Invalid Nexus Mods stats snapshot');
  }
  return stats;
}

if (typeof document !== 'undefined') {
  let stats = null;

  const render = () => {
    if (!stats) return;
    const localized = formatStats(stats.totalDownloads, document.documentElement.lang);
    document.querySelectorAll('[data-i18n="moddingNumber"]').forEach(node => {
      node.textContent = localized.counter;
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
