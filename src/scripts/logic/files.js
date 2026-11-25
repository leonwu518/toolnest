/* 文件 / 图片工具共用的纯逻辑 */

/** 解析 "1-3,5,8-10" 形式的页码范围；返回 1-based 去重页码，越界页码被忽略 */
export function parsePageRanges(input, total) {
  const pages = [];
  const parts = String(input).split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return { valid: false, pages: [] };
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!m) return { valid: false, pages: [] };
    const start = Number(m[1]);
    const end = m[2] === undefined ? start : Number(m[2]);
    if (start < 1 || end < start || end > 100000) return { valid: false, pages: [] };
    for (let i = start; i <= end; i++) if (i <= total) pages.push(i);
  }
  return { valid: true, pages: [...new Set(pages)].sort((a, b) => a - b) };
}

/** 二维数组转 CSV，正确处理引号、分隔符与换行 */
export function toCSV(rows, delimiter = ',') {
  return rows.map((row) => (row || []).map((cell) => {
    const s = cell === null || cell === undefined ? '' : String(cell);
    return /["\r\n]/.test(s) || s.includes(delimiter)
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }).join(delimiter)).join('\r\n');
}

export const mimeForFormat = (fmt) => ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[fmt] || 'image/png');
export const extForFormat = (fmt) => (fmt === 'jpg' || fmt === 'jpeg' ? 'jpg' : fmt);

export function clampDimension(v, max = 20000) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(n, max);
}

/** 锁定比例时由一侧推算另一侧 */
export function targetSize(originalW, originalH, width, height, lockRatio) {
  const w = clampDimension(width), h = clampDimension(height);
  if (!w && !h) return null;
  if (lockRatio && originalW && originalH) {
    if (!w) return { width: Math.max(1, Math.round(h * originalW / originalH)), height: h };
    if (!h) return { width: w, height: Math.max(1, Math.round(w * originalH / originalW)) };
  }
  return { width: w || 1, height: h || 1 };
}
