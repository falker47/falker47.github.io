import { html, raw } from './html.mjs';

// The fallback and each width descriptor come from the encoded files' metadata.
function responsiveAttributes(media, sizes) {
  const variants = media.variants.filter(variant => variant.width <= (media.nativeWidth ?? Infinity));
  if (!variants.length) throw Error('No native rendition for ' + media.src);
  const srcset = variants.map(variant => `${variant.src} ${variant.width}w`).join(', ');
  return html` srcset="${srcset}" sizes="${sizes}"`;
}

function imageTag(media, { lang = 'it', className, fetchpriority }, responsive = '') {
  const high = fetchpriority === 'high';
  return html`<img${raw(className ? html` class="${className}"` : '')} src="${media.src}"${raw(responsive)} width="${media.width}" height="${media.height}" alt="${media.alt[lang]}" data-alt-it="${media.alt.it}" data-alt-en="${media.alt.en}" loading="${high ? 'eager' : 'lazy'}" decoding="async"${raw(high ? ' fetchpriority="high"' : '')}>`;
}

export function img(media, options = {}) {
  return imageTag(media, options, responsiveAttributes(media, options.sizes ?? '100vw'));
}

export function picture(media, options = {}) {
  const responsive = responsiveAttributes(media, options.sizes ?? '100vw');
  const preview = options.nearViewport ? '<source media="(scripting: enabled)" data-preview srcset="/assets/images/thumbnail-space.svg">' : '';
  return html`<picture>${raw(preview)}<source type="image/webp"${raw(responsive)}>${raw(imageTag(media, options))}</picture>`;
}
