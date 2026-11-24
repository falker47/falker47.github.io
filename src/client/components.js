(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Header: on a phone the three links open from the menu button.
  const header = document.querySelector('.site-header');
  const menu = header && header.querySelector('.menu-button');
  function setMenu(open) {
    if (!menu) return;
    header.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
  }
  if (menu) {
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    header.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || menu.getAttribute('aria-expanded') !== 'true') return;
      setMenu(false);
      menu.focus();
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target) || event.target.closest('.site-nav a')) setMenu(false);
    });
    matchMedia('(min-width: 700px)').addEventListener('change', () => setMenu(false));
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

  // Category toggles: every group is in the page, one shows at a time.
  for (const picker of document.querySelectorAll('.picker')) {
    const bar = picker.querySelector('.picker-bar');
    const toggles = Array.from(bar.querySelectorAll('.picker-toggle'));
    const groups = Array.from(picker.querySelectorAll('.picker-group'));
    function show(name) {
      toggles.forEach(toggle => toggle.setAttribute('aria-pressed', String(toggle.dataset.group === name)));
      groups.forEach(group => { group.hidden = group.dataset.group !== name; });
    }
    toggles.forEach(toggle => toggle.addEventListener('click', () => show(toggle.dataset.group)));
    picker.classList.add('picker-enhanced');
    show(toggles[0].dataset.group);
    bar.hidden = false;
  }

  // Rails: the arrows move one view; touch and keyboard scroll natively.
  for (const rail of document.querySelectorAll('.rail')) {
    const track = rail.querySelector('.rail-track');
    const steps = Array.from(rail.querySelectorAll('.rail-step'));
    function update() {
      const end = track.scrollWidth - track.clientWidth - 2;
      steps.forEach(step => { step.disabled = Number(step.dataset.step) < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= end; });
    }
    steps.forEach(step => {
      step.hidden = false;
      step.addEventListener('click', () => {
        track.scrollBy({ left: Number(step.dataset.step) * track.clientWidth * .92, behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    });
    track.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    update();
  }

  // The caption beside the fan names the card under the pointer or the focus.
  for (const deck of document.querySelectorAll('.deck')) {
    const initial = deck.querySelector('.deck-default');
    const current = deck.querySelector('.deck-current');
    const [meta, title] = current.children;
    function name(card) {
      if (card) {
        meta.textContent = card.dataset.meta;
        title.textContent = card.dataset.title;
      }
      initial.hidden = Boolean(card);
      current.hidden = !card;
    }
    for (const card of deck.querySelectorAll('.deck-card')) {
      card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') name(card); });
      card.addEventListener('pointerleave', () => name(deck.querySelector('.deck-card:focus-visible')));
      card.addEventListener('focus', () => name(card));
      card.addEventListener('blur', () => name(null));
    }
  }

  for (const viewer of document.querySelectorAll('.certificate-viewer')) {
    const cards = Array.from(document.querySelectorAll('.deck-card[data-viewer="' + viewer.id + '"]'));
    if (!cards.length || !viewer.showModal) continue;
    const stage = viewer.querySelector('.viewer-stage');
    const title = viewer.querySelector('h3');
    const meta = viewer.querySelector('.viewer-meta');
    const index = viewer.querySelector('.viewer-index');
    const image = document.createElement('img');
    image.decoding = 'async';
    let current = 0, trigger = null, startX = null;
    function show(position) {
      current = (position + cards.length) % cards.length;
      const card = cards[current];
      title.textContent = card.dataset.title;
      meta.textContent = card.dataset.meta;
      index.textContent = String(current + 1);
      image.width = Number(card.dataset.width);
      image.height = Number(card.dataset.height);
      image.alt = card.querySelector('img').alt;
      image.src = card.dataset.full;
    }
    cards.forEach((card, position) => card.addEventListener('click', () => {
      trigger = card;
      show(position);
      stage.append(image);
      viewer.showModal();
    }));
    for (const step of viewer.querySelectorAll('.viewer-step')) {
      step.addEventListener('click', () => show(current + Number(step.dataset.step)));
    }
    viewer.addEventListener('keydown', event => {
      const move = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (!move) return;
      event.preventDefault();
      show(current + move);
    });
    stage.addEventListener('pointerdown', event => { startX = event.clientX; });
    stage.addEventListener('pointerup', event => {
      if (startX === null) return;
      const distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 40) show(current + (distance < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', () => { startX = null; });
    // A click on the backdrop reaches the dialog element itself.
    viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
    viewer.addEventListener('close', () => { image.remove(); image.removeAttribute('src'); trigger?.focus(); });
    document.addEventListener('portfolio:languagechange', () => { if (viewer.open) image.alt = cards[current].querySelector('img').alt; });
  }

  // Deep links. #progetti opens "I miei progetti" on its first tab, #ricerca on
  // the Research tab; a target inside a closed disclosure opens it first. The
  // page scrolls once the opening animation has ended, 76 px below the top.
  const offset = 76;
  function reveal(hash, smooth) {
    let target;
    try { target = hash.length > 1 ? document.querySelector(hash) : null; } catch { return false; }
    if (!target) return false;
    const panel = target.closest('[role="tabpanel"]');
    const work = target.matches('details.work') ? target : null;
    const tab = panel ? document.getElementById(panel.getAttribute('aria-labelledby')) : work && work.querySelector('[role="tab"]');
    const details = target.matches('details') ? target : target.closest('details');
    if (!details) return false;
    if (tab) tab.click();
    const anchor = panel ? details : target;
    function arrive() {
      const top = anchor.getBoundingClientRect().top + scrollY - offset;
      scrollTo({ top, behavior: smooth && !reduced.matches ? 'smooth' : 'auto' });
    }
    if (details.open) { arrive(); return true; }
    details.querySelector(':scope > summary').click();
    const running = details.getAnimations ? details.getAnimations() : [];
    if (!details.open) details.open = true;
    Promise.all(running.map(animation => animation.finished)).then(arrive, arrive);
    return true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="#"]');
    if (!link || event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (link.origin !== location.origin || link.pathname !== location.pathname || !link.hash) return;
    if (!reveal(link.hash, true)) return;
    event.preventDefault();
    if (link.hash !== location.hash) history.pushState(history.state, '', link.hash);
  });
  addEventListener('hashchange', () => reveal(location.hash, false));
  addEventListener('popstate', () => reveal(location.hash, false));
  reveal(location.hash, false);
})();
