/* 颜色转换纯逻辑：HEX / RGB / HSL 互转与配色变体 */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function parseColor(input) {
  const s = String(input || '').trim().toLowerCase();
  if (!s) return null;

  const hex = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let h = hex[1].slice(0, 6);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/)
    || s.match(/^([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)$/);
  if (rgb) {
    const r = Number(rgb[1]), g = Number(rgb[2]), b = Number(rgb[3]);
    if ([r, g, b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255)) return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
    return null;
  }

  const hsl = s.match(/^hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?/);
  if (hsl) {
    return hslToRgb({ h: Number(hsl[1]), s: Number(hsl[2]), l: Number(hsl[3]) });
  }
  return null;
}

export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }) {
  const hn = ((Number(h) % 360) + 360) % 360;
  const sn = clamp(Number(s), 0, 100) / 100;
  const ln = clamp(Number(l), 0, 100) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs((hn / 60) % 2 - 1));
  const m = ln - c / 2;
  let rgb;
  if (hn < 60) rgb = [c, x, 0];
  else if (hn < 120) rgb = [x, c, 0];
  else if (hn < 180) rgb = [0, c, x];
  else if (hn < 240) rgb = [0, x, c];
  else if (hn < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return { r: Math.round((rgb[0] + m) * 255), g: Math.round((rgb[1] + m) * 255), b: Math.round((rgb[2] + m) * 255) };
}

export const formatRgb = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;
export const formatHsl = ({ h, s, l }) => `hsl(${h}, ${s}%, ${l}%)`;

export function adjustLightness(rgb, delta) {
  const hsl = rgbToHsl(rgb);
  return hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 0, 100) });
}

export function complementary(rgb) {
  const hsl = rgbToHsl(rgb);
  return hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 });
}
