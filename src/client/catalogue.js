// The layout includes this script on pages that render bilingual catalogue content.
document.addEventListener('portfolio:languagechange', () => {
  const lang = document.documentElement.lang;
  for (const node of document.querySelectorAll('[data-text-it]')) {
    node.textContent = node.getAttribute('data-text-' + lang);
  }
  for (const image of document.querySelectorAll('img[data-alt-it]')) {
    image.alt = image.getAttribute('data-alt-' + lang);
  }
});
