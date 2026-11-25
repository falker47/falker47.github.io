(() => {
  'use strict';
  const root = document.documentElement;
  const pageCopy = JSON.parse(document.getElementById('page-i18n').textContent);
  const titles = document.getElementById('site-language').dataset;
  const buttons = document.querySelectorAll('button[data-lang]');
  const extraCopy = new Map();
  let revision = 0;

  function setText(node, value) {
    if (!value.includes('<br>')) {
      const text = node.firstChild;
      if (text?.nodeType === Node.TEXT_NODE && !text.nextSibling) {
        if (text.data !== value) text.data = value;
      } else if (node.textContent !== value) node.textContent = value;
      return;
    }
    if (node.innerHTML === value) return;
    const [first, ...lines] = value.split('<br>');
    node.textContent = first;
    for (const line of lines) node.append(document.createElement('br'), line);
  }

  function setMetadata(lang, copy) {
    const title = document.querySelector('title');
    if (!title.hasAttribute('data-i18n')) document.title = lang === 'it' ? titles.titleIt : titles.titleEn;
    for (const meta of document.querySelectorAll('meta[data-meta-i18n]')) {
      meta.content = copy[meta.dataset.metaI18n];
    }
    const description = document.querySelector('meta[name="description"]').content;
    for (const meta of document.querySelectorAll('meta[property="og:title"], meta[name="twitter:title"]')) {
      if (!meta.hasAttribute('data-meta-i18n')) meta.content = document.title;
    }
    for (const meta of document.querySelectorAll('meta[property="og:description"], meta[name="twitter:description"]')) {
      if (!meta.hasAttribute('data-meta-i18n')) meta.content = description;
    }
  }

  function formatDate(value, lang) {
    if (!value) return;
    // Date-only values represent calendar dates, including in time zones west of UTC.
    const calendar = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
    const date = calendar
      ? new Date([calendar[1], calendar[2] ?? '01', calendar[3] ?? '01'].join('-') + 'T00:00:00Z')
      : new Date(value);
    if (!Number.isFinite(date.getTime())) return;
    const options = calendar
      ? { year: 'numeric', month: calendar[2] && 'long', day: calendar[3] && 'numeric', timeZone: 'UTC' }
      : { dateStyle: 'long', timeStyle: 'short' };
    return new Intl.DateTimeFormat(lang, options).format(date);
  }

  function applyFormats(lang, copy) {
    let numbers, plurals;
    const formatNumber = value => (numbers ??= new Intl.NumberFormat(lang)).format(value);
    for (const node of document.querySelectorAll('[data-i18n-number], [data-i18n-plural]')) {
      const { i18nNumber, i18nPlural, count } = node.dataset;
      const raw = i18nPlural === undefined ? i18nNumber : count;
      if (!raw?.trim() || !Number.isFinite(Number(raw))) continue;
      const value = Number(raw);
      if (i18nPlural === undefined) {
        node.textContent = formatNumber(value);
      } else {
        const category = (plurals ??= new Intl.PluralRules(lang)).select(value);
        const suffix = category[0].toUpperCase() + category.slice(1);
        const pattern = copy[i18nPlural + suffix] ?? copy[i18nPlural + 'Other'];
        if (pattern) node.textContent = pattern.replaceAll('{count}', formatNumber(value));
      }
    }
    for (const node of document.querySelectorAll('time[datetime], [data-i18n-date]')) {
      const date = formatDate(node.dataset.i18nDate || node.getAttribute('datetime'), lang);
      if (date) node.textContent = date;
    }
    for (const node of document.querySelectorAll('[data-i18n-alt]')) {
      const alt = copy[node.dataset.i18nAlt];
      if (typeof alt === 'string') node.setAttribute('alt', alt);
    }
  }

  // The original page bundle contains text, labels and meta keys. Only pages using
  // additional dictionary keys need the self-hosted JSON, once per language.
  function dictionary(lang) {
    if (!extraCopy.has(lang)) {
      extraCopy.set(lang, fetch('/data/i18n/' + lang + '.json').then(response => {
        if (!response.ok) throw Error('Dictionary HTTP ' + response.status);
        return response.json();
      }).catch(error => { extraCopy.delete(lang); throw error; }));
    }
    return extraCopy.get(lang);
  }

  function setLanguage(lang) {
    const current = ++revision;
    const copy = pageCopy[lang];
    if (root.lang !== lang) root.lang = root.dataset.lang = lang;
    for (const node of document.querySelectorAll('[data-i18n]')) setText(node, copy[node.dataset.i18n]);
    for (const node of document.querySelectorAll('[data-label]')) node.setAttribute('aria-label', copy[node.dataset.label]);
    setMetadata(lang, copy);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
    try { localStorage.setItem('nexus-language', lang); } catch { /* Optional storage. */ }
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    url.searchParams.delete('mode');
    if (url.href !== location.href) history.replaceState(history.state, '', url);
    function finish(translations) {
      if (current !== revision) return;
      applyFormats(lang, translations);
      document.dispatchEvent(new Event('portfolio:languagechange'));
    }

    const needsKeys = document.querySelector('[data-i18n-plural]') ||
      Array.from(document.querySelectorAll('[data-i18n-alt]')).some(node => !Object.hasOwn(copy, node.dataset.i18nAlt));
    if (needsKeys) {
      dictionary(lang).then(full => finish({ ...full, ...copy }), () => finish(copy));
    } else {
      finish(copy);
    }
  }

  setLanguage(root.lang);
  buttons.forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
    button.disabled = false;
  });
})();
