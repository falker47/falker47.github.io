(() => {
  'use strict';
  const copy = JSON.parse(document.getElementById('page-i18n').textContent);
  const buttons = document.querySelectorAll('[data-lang]');
  const isLanguage = value => value === 'it' || value === 'en';

  function initialLanguage() {
    const requested = new URL(location.href).searchParams.get('lang');
    if (isLanguage(requested)) return requested;
    try {
      const saved = localStorage.getItem('nexus-language');
      if (isLanguage(saved)) return saved;
    } catch { /* Storage is optional in private browsing. */ }
    const browser = navigator.language || navigator.languages?.[0];
    return browser ? (/^it/i.test(browser) ? 'it' : 'en') : 'it';
  }

  function setLanguage(lang) {
    const changeText = document.documentElement.lang !== lang;
    document.documentElement.lang = lang;
    if (changeText) document.querySelectorAll('[data-i18n]').forEach(node => {
      const value = copy[lang][node.dataset.i18n];
      const lines = value.split('<br>');
      node.textContent = lines.shift();
      for (const line of lines) node.append(document.createElement('br'), line);
    });
    document.querySelectorAll('[data-label]').forEach(node => {
      node.setAttribute('aria-label', copy[lang][node.dataset.label]);
    });
    document.querySelectorAll('[data-meta-i18n]').forEach(node => {
      node.content = copy[lang][node.dataset.metaI18n];
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
    try { localStorage.setItem('nexus-language', lang); } catch { /* Optional storage. */ }
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    url.searchParams.delete('mode');
    history.replaceState(history.state, '', url);
    document.dispatchEvent(new Event('portfolio:languagechange'));
  }

  setLanguage(initialLanguage());
  document.querySelectorAll('.language-switch').forEach(nav => { nav.hidden = false; });
  buttons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
})();
