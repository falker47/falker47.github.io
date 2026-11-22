(() => {
  'use strict';

  const previews = document.querySelectorAll('picture > source[data-preview]');
  if (previews.length) {
    // Native lazy loading starts far outside a dense register. Reveal the actual
    // picture shortly before it scrolls into view; no-script readers get it directly.
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.querySelector('source[data-preview]')?.remove();
          observer.unobserve(entry.target);
        }
      }, { rootMargin: '240px 0px' });
      for (const source of previews) observer.observe(source.parentElement);
    } else {
      for (const source of previews) source.remove();
    }
  }

  for (const list of document.querySelectorAll('[role="tablist"]')) {
    const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    function select(current) {
      tabs.forEach((tab, i) => {
        tab.tabIndex = tab === current ? 0 : -1;
        tab.setAttribute('aria-selected', String(tab === current));
        panels[i].hidden = tab !== current;
      });
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', event => {
        const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length,
          Home: 0, End: tabs.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next]);
        tabs[next].focus();
      });
    });
    list.closest('.work')?.classList.add('work-enhanced');
    select(tabs[0]);
    list.hidden = false;
  }

  for (const viewer of document.querySelectorAll('.certificate-viewer')) {
    let trigger;
    const title = viewer.querySelector('h3');
    const image = document.createElement('img');
    image.loading = 'lazy';
    image.decoding = 'async';
    const updateTitle = () => {
      if (!trigger) return;
      title.textContent = trigger.querySelector(':scope > span').textContent;
      image.alt = trigger.querySelector('img').alt;
    };
    for (const link of document.querySelectorAll('[data-viewer]')) {
      if (link.dataset.viewer !== viewer.id) continue;
      link.addEventListener('click', event => {
        if (!viewer.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        trigger = link;
        updateTitle();
        image.width = Number(link.dataset.width);
        image.height = Number(link.dataset.height);
        image.src = link.href;
        viewer.append(image);
        viewer.showModal();
      });
    }
    viewer.addEventListener('keydown', event => {
      // The close button is the only stop in this image viewer.
      if (event.key === 'Tab') {
        event.preventDefault();
        viewer.querySelector('button').focus();
      }
    });
    viewer.addEventListener('close', () => { image.remove(); image.removeAttribute('src'); trigger?.focus(); });
    document.addEventListener('portfolio:languagechange', updateTitle);
  }

  // A fragment inside a closed disclosure (#chi-sono, #certificazioni) opens it first.
  function followFragment() {
    let target;
    try { target = location.hash ? document.querySelector(location.hash) : null; } catch { return; }
    const details = target?.closest('details');
    if (!details || details.open) return;
    details.open = true;
    target.scrollIntoView({ block: 'start' });
  }
  addEventListener('hashchange', followFragment);
  followFragment();
})();
