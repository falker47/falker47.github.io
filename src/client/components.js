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
      // The tabs of "I miei progetti" set its accent; Software keeps the default blue.
      const work = list.closest('.work');
      if (work) {
        if (current.dataset.panel === 'software') delete work.dataset.accent;
        else work.dataset.accent = current.dataset.panel;
      }
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
      picker.querySelectorAll('.picker-count').forEach(count => { count.hidden = count.dataset.group !== name; });
    }
    toggles.forEach(toggle => toggle.addEventListener('click', () => show(toggle.dataset.group)));
    picker.classList.add('picker-enhanced');
    show(toggles[0].dataset.group);
    bar.hidden = false;
  }

  // Rails: the arrows move by one card; touch and keyboard scroll natively.
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
        const card = track.querySelector('.card');
        const width = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : track.clientWidth;
        track.scrollBy({ left: Number(step.dataset.step) * width, behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    });
    track.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    update();
  }

  // "Su di me": one paragraph at a time. "Indietro" and "Avanti" move by one slide, touch scrolls
  // natively. Every slide is as tall as the tallest (CSS), so the controls never move.
  for (const carousel of document.querySelectorAll('.about-carousel')) {
    const track = carousel.firstElementChild, rows = Array.from(track.children), nav = track.nextElementSibling;
    const steps = nav.querySelectorAll('button'), bars = nav.querySelectorAll('i');
    let index = 0, width = 0;
    const left = i => rows[i].offsetLeft - rows[0].offsetLeft;
    // The bar fills up to the open paragraph. At the ends a step stays focusable and does nothing.
    function sync(next) {
      index = Math.max(0, Math.min(rows.length - 1, next));
      bars.forEach((bar, i) => bar.classList.toggle('on', i <= index));
      steps[0].setAttribute('aria-disabled', String(!index));
      steps[1].setAttribute('aria-disabled', String(index === rows.length - 1));
      nav.querySelector('.about-index').textContent = index + 1;
    }
    function go(next, smooth) {
      sync(next);
      track.scrollTo({ left: left(index), behavior: smooth && !reduced.matches ? 'smooth' : 'auto' });
    }
    track.addEventListener('scroll', () => {
      const next = left(1) && Math.round(track.scrollLeft / left(1));
      if (left(1) && next !== index) sync(next);
    }, { passive: true });
    steps.forEach(step => step.addEventListener('click', () => go(index + Number(step.dataset.step), true)));
    // Focus on a link of another slide brings that slide in. The browser has already scrolled the
    // track to the link; once the track is realigned, the page scrolls to it instead.
    track.addEventListener('focusin', event => {
      go(rows.indexOf(event.target.closest('.about-row')), false);
      track.scrollTop = 0;
      event.target.scrollIntoView({ block: 'nearest' });
    });
    // A new width (a resize, the section opening) realigns the open slide.
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => {
        if (track.clientWidth !== width && (width = track.clientWidth)) track.scrollLeft = left(index);
      }).observe(track);
    }
    carousel.aboutGo = go;
    carousel.classList.add('about-enhanced');
    nav.hidden = false;
    sync(0);
  }

  // Certificates. The thumbnails sit inside the closed "Chi sono", where lazy images wait
  // until it opens. Start them once the page has loaded and the browser is idle, or as soon
  // as the reader points at, focuses or opens the summary. A card under the pointer or the focus
  // also fetches its full image for the viewer.
  const thumbnails = Array.from(document.querySelectorAll('.deck-card img'));
  let warmed = false;
  function warm() {
    if (warmed) return;
    warmed = true;
    thumbnails.forEach(image => { image.loading = 'eager'; });
  }
  const about = thumbnails.length ? thumbnails[0].closest('details') : null;
  if (about) {
    const summary = about.querySelector(':scope > summary');
    ['pointerenter', 'focus', 'touchstart', 'click'].forEach(type => summary.addEventListener(type, warm, { once: true, passive: true }));
    const saveData = navigator.connection && navigator.connection.saveData;
    // A second after the load event, when the browser is idle: the first screen is settled by then.
    const idle = () => setTimeout(() => { if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3000 }); else warm(); }, 1000);
    if (!saveData) {
      if (document.readyState === 'complete') idle();
      else addEventListener('load', idle, { once: true });
    }
  }
  const fetched = new Set();
  function preloadFull(card) {
    const src = card.dataset.full;
    if (!src || fetched.has(src)) return;
    fetched.add(src);
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
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
    // The pointer picks the card from its slot in the fan, the strip of the card that the next
    // one leaves visible, not from the card on top: a raised card would otherwise keep the
    // pointer until it left, and moving to the right would feel stuck.
    const fan = deck.querySelector('.deck-fan');
    const cards = Array.from(deck.querySelectorAll('.deck-card'));
    let active = null;
    function activate(card) {
      if (card === active) return;
      if (active) active.removeAttribute('data-active');
      active = card;
      if (card) {
        card.setAttribute('data-active', '');
        preloadFull(card);
      }
      name(card || deck.querySelector('.deck-card:focus-visible'));
    }
    fan.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || cards.length < 2) return;
      if (!event.target.closest('.deck-card')) return activate(null);
      const x = event.clientX - fan.getBoundingClientRect().left - cards[0].offsetLeft;
      const step = cards[1].offsetLeft - cards[0].offsetLeft;
      activate(cards[Math.max(0, Math.min(cards.length - 1, Math.floor(x / step)))]);
    });
    fan.addEventListener('pointerleave', () => activate(null));
    deck.classList.add('deck-enhanced');
    for (const card of cards) {
      card.addEventListener('pointerenter', event => { if (event.pointerType === 'touch') preloadFull(card); });
      card.addEventListener('focus', () => { preloadFull(card); name(card); });
      card.addEventListener('blur', () => name(active));
    }
  }

  for (const viewer of document.querySelectorAll('.certificate-viewer')) {
    const cards = Array.from(document.querySelectorAll('.deck-card[data-viewer="' + viewer.id + '"]'));
    if (!cards.length || !viewer.showModal) continue;
    const stage = viewer.querySelector('.viewer-stage');
    const title = viewer.querySelector('h3');
    const index = viewer.querySelector('.viewer-index');
    const image = document.createElement('img');
    image.decoding = 'async';
    image.draggable = false;
    let current = 0, trigger = null, startX = null;
    function show(position) {
      current = (position + cards.length) % cards.length;
      const card = cards[current];
      title.textContent = card.dataset.title + ' — ' + card.dataset.meta.replace(' · ', ', ');
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
    for (const step of viewer.querySelectorAll('.viewer-step[data-step]')) {
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
    // A target in "Su di me" (the certificates) brings its slide in first.
    const slide = target.closest('.about-row');
    const carousel = slide && slide.closest('.about-carousel');
    if (carousel && carousel.aboutGo) carousel.aboutGo(Array.from(slide.parentNode.children).indexOf(slide), false);
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
  // The browser also scrolls to the fragment once the page has loaded: arrive again after it.
  if (reveal(location.hash, false) && document.readyState !== 'complete') {
    addEventListener('load', () => setTimeout(() => reveal(location.hash, false)), { once: true });
  }
})();
