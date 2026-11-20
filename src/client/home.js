(() => {
  'use strict';
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const art = document.querySelector('.engine-art');
  let timer, frame, observer;
  let started = false;

  function disconnect() {
    observer?.disconnect();
    window.removeEventListener('scroll', checkVisibility);
  }

  function finish() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    disconnect();
    root.classList.remove('playing');
  }

  function startOnce() {
    if (started || document.hidden) return;
    started = true;
    disconnect();
    if (motion.matches) return;
    frame = requestAnimationFrame(() => {
      if (motion.matches || document.hidden) return;
      root.classList.add('playing');
      timer = setTimeout(finish, 4950);
    });
  }

  function visibleThreshold() {
    return Math.max(.01, Math.min(.65, innerHeight * .65 / Math.max(1, art.getBoundingClientRect().height)));
  }

  function checkVisibility() {
    const rect = art.getBoundingClientRect();
    const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    if (rect.width && rect.height && width * height / (rect.width * rect.height) >= visibleThreshold()) startOnce();
  }

  function prepare() {
    if (started || document.hidden) return;
    if (motion.matches) { started = true; finish(); return; }
    disconnect();
    if (!('IntersectionObserver' in window)) {
      window.addEventListener('scroll', checkVisibility, { passive: true });
      checkVisibility();
      return;
    }
    const threshold = visibleThreshold();
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= threshold)) startOnce();
    }, { threshold });
    observer.observe(art);
  }

  const work = document.querySelector('.work');
  const tablist = work.querySelector('.work-tabs');
  const tabs = [...tablist.querySelectorAll('[role=tab]')];
  const panels = work.querySelectorAll('.work-panel');
  function select(tab) {
    tabs.forEach(item => {
      item.setAttribute('aria-selected', String(item === tab));
      item.tabIndex = item === tab ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
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
  work.classList.add('work-enhanced');
  tablist.hidden = false;
  select(tabs[0]);

  motion.addEventListener('change', () => { if (motion.matches) { started = true; finish(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && started) finish(); else prepare(); });
  window.addEventListener('resize', () => { if (started) finish(); else prepare(); });
  prepare();
})();
