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
      list.dispatchEvent(new CustomEvent('tabchange', { bubbles: true, detail: current.id }));
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
    if (list.closest('.work')) {
      list.closest('.work').classList.add('work-enhanced');
      const hashes = { '#software': 'tab-software', '#modding': 'tab-modding', '#ricerca': 'tab-research', '#tutoring': 'tab-teaching' };
      const fromHash = () => {
        const target = tabs.find(tab => tab.id === hashes[location.hash]);
        if (target) {
          select(target);
          document.getElementById('progetti').scrollIntoView();
        }
        return Boolean(target);
      };
      window.addEventListener('hashchange', fromHash);
      list.addEventListener('tabchange', event => {
        const hash = Object.keys(hashes).find(key => hashes[key] === event.detail);
        if (hash && !list.hidden) history.replaceState(history.state, '', hash);
      });
      if (!fromHash()) select(tabs[0]);
    } else select(tabs[0]);
    list.hidden = false;
  }

  for (const filters of document.querySelectorAll('.filter-chips')) {
    const buttons = filters.querySelectorAll('[data-filter]');
    const rows = filters.closest('[data-filter-list]')?.querySelectorAll('.register-row') || [];
    for (const button of buttons) button.addEventListener('click', () => {
      for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
      for (const row of rows) row.hidden = button.dataset.filter !== 'all' && row.dataset.kind !== button.dataset.filter;
    });
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

  const links = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (!links.length) return;
  const sections = links.map(link => document.getElementById(link.hash.slice(1)));
  function current() {
    const top = document.querySelector('.site-header').getBoundingClientRect().bottom;
    const reached = section => Math.floor(section.getBoundingClientRect().top) <= top;
    const visible = sections.filter(section => {
      const rect = section.getBoundingClientRect();
      return rect.top < innerHeight && rect.bottom > top;
    });
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const linked = visible.find(section => {
      if ('#' + section.id !== location.hash) return false;
      const destination = Math.max(0, Math.min(maxScroll, scrollY + section.getBoundingClientRect().top - padding));
      return Math.abs(destination - scrollY) <= 2;
    });
    const last = scrollY >= maxScroll - 2;
    const atProjects = reached(sections[0]);
    const active = atProjects && (linked || (last ? visible.at(-1) : visible.find(reached)));
    links.forEach((link, i) => {
      if (sections[i] === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function followFragment() {
    const about = document.getElementById('chi-sono');
    if (['#chi-sono', '#certificazioni'].includes(location.hash) && !about.open) {
      about.open = true;
      document.getElementById(location.hash.slice(1)).scrollIntoView({ block: 'start' });
    }
    current();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(current, { rootMargin: '-64px 0px 0px', threshold: [0, 1] });
    sections.forEach(section => observer.observe(section));
  }
  let frame = 0;
  addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; current(); });
  }, { passive: true });
  links.find(link => link.hash === '#chi-sono').addEventListener('click', () => {
    document.getElementById('chi-sono').open = true;
  });
  addEventListener('hashchange', followFragment);
  followFragment();
})();
