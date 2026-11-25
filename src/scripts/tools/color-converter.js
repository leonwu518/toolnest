import { role, on, msg, showError, clearError, copyText } from '../utils.js';
import { parseColor, rgbToHex, rgbToHsl, formatRgb, formatHsl, adjustLightness, complementary } from '../logic/color.js';

const DEFAULT = { r: 37, g: 99, b: 235 };

export default function init() {
  let current = { ...DEFAULT };

  function update(rgb, skip) {
    current = rgb;
    const hex = rgbToHex(rgb);
    if (skip !== 'hex') role('hex').value = hex;
    if (skip !== 'rgb') role('rgb').value = formatRgb(rgb);
    if (skip !== 'hsl') role('hsl').value = formatHsl(rgbToHsl(rgb));
    role('picker').value = hex.toLowerCase();
    const preview = role('color-preview');
    const light = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    preview.style.background = hex;
    preview.style.color = light > 0.6 ? '#0f172a' : '#ffffff';
    preview.textContent = hex;
    renderSwatches(rgb);
  }

  function renderSwatches(rgb) {
    const host = role('swatches');
    host.innerHTML = '';
    [['lighten', adjustLightness(rgb, 10)], ['darken', adjustLightness(rgb, -10)], ['complementary', complementary(rgb)]]
      .forEach(([key, c]) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = rgbToHex(c);
        swatch.title = msg(key);
        swatch.setAttribute('aria-label', msg(key));
        on(swatch, 'click', () => { update(c); clearError(); });
        host.appendChild(swatch);
      });
  }

  function sync(field) {
    const rgb = parseColor(role(field).value);
    if (!rgb) { showError(msg('invalidMsg')); return; }
    clearError();
    update(rgb, field);
  }

  ['hex', 'rgb', 'hsl'].forEach((field) => {
    const el = role(field);
    on(el, 'change', () => sync(field));
    on(el, 'keydown', (e) => { if (e.key === 'Enter') sync(field); });
    on(el, 'click', () => copyText(el.value));
  });
  on(role('picker'), 'input', (e) => { role('hex').value = e.target.value; sync('hex'); });

  [['lighten', 10], ['darken', -10]].forEach(([action, delta]) => {
    on(document.querySelector(`[data-action="${action}"]`), 'click', () => { update(adjustLightness(current, delta)); clearError(); });
  });
  on(document.querySelector('[data-action="complementary"]'), 'click', () => { update(complementary(current)); clearError(); });

  on(role('clear'), 'click', () => { update({ ...DEFAULT }); clearError(); });
  update({ ...DEFAULT });
}
