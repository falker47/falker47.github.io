(() => {
  const select = document.getElementById('preview-state');
  const samples = [...document.querySelectorAll(':is(.guide-section, .site-header, .site-footer) :is(a, button, summary)')];
  const restore = new Map();
  function update() {
    for (const undo of restore.values()) undo();
    restore.clear();
    const state = select.value;
    if (state === 'selected') {
      const nav = document.querySelector('.site-nav a');
      nav.dataset.preview = 'selected';
      restore.set(nav, () => { delete nav.dataset.preview; });
      return;
    }
    if (state === 'default') return;
    for (const element of samples) {
      element.dataset.preview = state;
      const href = element.getAttribute('href');
      const tabIndex = element.getAttribute('tabindex');
      if (state === 'disabled') {
        if (element.matches('button')) element.disabled = true;
        if (href !== null) element.removeAttribute('href');
        element.setAttribute('aria-disabled', 'true');
        element.tabIndex = -1;
      }
      restore.set(element, () => {
        delete element.dataset.preview;
        if (element.matches('button')) element.disabled = false;
        if (href !== null) element.setAttribute('href', href);
        element.removeAttribute('aria-disabled');
        if (tabIndex === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', tabIndex);
      });
    }
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[aria-disabled="true"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  select.addEventListener('change', update);
})();
