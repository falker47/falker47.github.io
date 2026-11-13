// Smoothly expand and collapse the two native disclosures, with a native fallback.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('details.about, details.work').forEach(details => {
    const summary = details.querySelector(':scope > summary');
    if (!summary || typeof details.animate !== 'function') return;

    let animation = null;
    let expanded = details.open;

    summary.addEventListener('click', event => {
      if (reducedMotion.matches) {
        if (animation) {
          animation.cancel();
          animation = null;
          details.style.overflow = '';
          details.open = expanded;
        }
        expanded = !details.open; // Let the native summary click toggle it.
        return;
      }

      event.preventDefault();
      const opening = !expanded;
      const startHeight = details.getBoundingClientRect().height;
      if (animation) animation.cancel();

      // Measure both natural heights within one event, before the browser paints.
      details.open = false;
      const closedHeight = details.getBoundingClientRect().height;
      details.open = true;
      const openHeight = details.getBoundingClientRect().height;

      expanded = opening;
      details.style.overflow = 'clip';
      const current = details.animate([
        { height: startHeight + 'px' },
        { height: (opening ? openHeight : closedHeight) + 'px' },
      ], { duration: 350, easing: 'cubic-bezier(.22,.7,.28,1)' });
      animation = current;

      current.addEventListener('finish', () => {
        if (animation !== current) return;
        details.open = expanded;
        details.style.overflow = '';
        animation = null;
      }, { once: true });
      current.addEventListener('cancel', () => {
        if (animation !== current) return;
        details.style.overflow = '';
        animation = null;
      }, { once: true });
    });

    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches || !animation) return;
      animation.cancel();
      animation = null;
      details.open = expanded;
      details.style.overflow = '';
    });
  });
})();
