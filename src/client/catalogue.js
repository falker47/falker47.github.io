// Recover the default Italian straight from the static HTML before the first switch.
const catalogueCopy = document.getElementById('catalogue-en');
if (catalogueCopy) {
  const english = JSON.parse(catalogueCopy.textContent);
  for (const node of document.querySelectorAll('[data-text-key], [data-alt-key]')) {
    const image = node.hasAttribute('data-alt-key');
    const kind = image ? 'alt' : 'text';
    node.setAttribute('data-' + kind + '-it', image ? node.alt : node.textContent);
    node.setAttribute('data-' + kind + '-en', english[node.getAttribute('data-' + kind + '-key')]);
  }
}
document.addEventListener('portfolio:languagechange', () => {
  const lang = document.documentElement.lang;
  for (const node of document.querySelectorAll('[data-text-it]')) {
    const text = node.getAttribute('data-text-' + lang);
    if (node.textContent !== text) node.textContent = text;
  }
  for (const image of document.querySelectorAll('img[data-alt-it]')) {
    const alt = image.getAttribute('data-alt-' + lang);
    if (image.alt !== alt) image.alt = alt;
  }
});
