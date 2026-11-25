/* 文本工具纯逻辑（无 DOM，可单测） */

export function dedupeLines(text, opts = {}) {
  const { ignoreCase = false, trimWhitespace = false, sortOutput = false, removeEmpty = false } = opts;
  const lines = String(text).split(/\r\n|\r|\n/);
  const seen = new Set();
  const result = [];
  let removed = 0;
  for (const raw of lines) {
    if (removeEmpty && !raw.trim()) { removed++; continue; }
    const value = trimWhitespace ? raw.trim() : raw;
    const key = ignoreCase ? value.toLowerCase() : value;
    if (seen.has(key)) { removed++; continue; }
    seen.add(key);
    result.push(value);
  }
  if (sortOutput) result.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  return { lines: result, removed, original: lines.length };
}

export function splitWords(text) {
  return String(text)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9\u3400-\u9fff]+/)
    .filter(Boolean);
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function convertCase(text, mode) {
  const words = splitWords(text);
  switch (mode) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'title': return text.replace(/[A-Za-z]+/g, (w) => cap(w));
    case 'sentence': return text.replace(/(^|[.!?。！？\n]+\s*)([a-z])/g, (_, p, c) => p + c.toUpperCase());
    case 'camel': return words.map((w, i) => (i ? cap(w) : w.toLowerCase())).join('');
    case 'pascal': return words.map((w) => cap(w)).join('');
    case 'snake': return words.map((w) => w.toLowerCase()).join('_');
    case 'kebab': return words.map((w) => w.toLowerCase()).join('-');
    case 'toggle': return Array.from(text).map((c) => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
    case 'reverse': return Array.from(text).reverse().join('');
    default: return text;
  }
}

/** LCS 逐行差异；超大文本退化为按行号对齐，避免 O(n·m) 内存爆炸 */
export function diffLines(textA, textB, opts = {}) {
  const { ignoreCase = false, ignoreWhitespace = false } = opts;
  const A = String(textA).split(/\r\n|\r|\n/);
  const B = String(textB).split(/\r\n|\r|\n/);
  const norm = (s) => {
    let v = ignoreWhitespace ? s.replace(/\s+/g, ' ').trim() : s;
    if (ignoreCase) v = v.toLowerCase();
    return v;
  };
  const a = A.map(norm), b = B.map(norm);
  const n = a.length, m = b.length;

  const simple = () => {
    const out = [];
    const len = Math.max(n, m);
    for (let i = 0; i < len; i++) {
      if (i >= n) out.push({ type: 'added', text: B[i], aLine: null, bLine: i + 1 });
      else if (i >= m) out.push({ type: 'removed', text: A[i], aLine: i + 1, bLine: null });
      else if (a[i] === b[i]) out.push({ type: 'same', text: A[i], aLine: i + 1, bLine: i + 1 });
      else {
        out.push({ type: 'removed', text: A[i], aLine: i + 1, bLine: null });
        out.push({ type: 'added', text: B[i], aLine: null, bLine: i + 1 });
      }
    }
    return out;
  };
  if ((n + 1) * (m + 1) > 250000) return simple();

  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ type: 'same', text: A[i], aLine: i + 1, bLine: j + 1 }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'removed', text: A[i], aLine: i + 1, bLine: null }); i++; }
    else { out.push({ type: 'added', text: B[j], aLine: null, bLine: j + 1 }); j++; }
  }
  while (i < n) { out.push({ type: 'removed', text: A[i], aLine: ++i, bLine: null }); }
  while (j < m) { out.push({ type: 'added', text: B[j], aLine: null, bLine: ++j }); }
  return out;
}

export function formatJSON(text, { indent = 2, sortKeys = false, minify = false } = {}) {
  try {
    const parsed = JSON.parse(text);
    const sort = (v) => {
      if (Array.isArray(v)) return v.map(sort);
      if (v && typeof v === 'object') {
        return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])]));
      }
      return v;
    };
    const value = sortKeys ? sort(parsed) : parsed;
    const space = minify ? 0 : (indent === 'tab' ? '\t' : Number(indent) || 2);
    return { ok: true, output: JSON.stringify(value, null, space) };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}
