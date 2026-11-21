const trusted = Symbol('trusted markup');
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => entities[char]);
}

export function raw(markup) {
  return { [trusted]: String(markup) };
}

export function html(strings, ...values) {
  return strings.reduce((result, literal, index) => {
    if (index === 0) return literal;
    const value = values[index - 1];
    return result + (value?.[trusted] ?? escapeHtml(value)) + literal;
  }, '');
}

export function jsonScript(value) {
  return raw(JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026'));
}

// Translations permit a line break in the hero. All other characters are text.
export function translatedText(value) {
  return raw(value.split('<br>').map(escapeHtml).join('<br>'));
}
