/* CSV 解析、序列化与清洗的纯逻辑（RFC 4180 兼容，可同时在浏览器与 Node 运行） */

export const DELIMITER_MAP = { comma: ',', semicolon: ';', tab: '\t', pipe: '|' };

/** 依据引号外的分隔符出现次数推测分隔符，取前 12 行统计 */
export function detectDelimiter(text) {
  const candidates = [',', ';', '\t', '|'];
  const counts = Object.fromEntries(candidates.map((d) => [d, 0]));
  let inQuotes = false, line = 0;
  for (let i = 0; i < text.length && line < 12; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { i++; continue; }
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (ch === '\n') { line++; continue; }
    if (counts[ch] !== undefined) counts[ch]++;
  }
  const best = candidates.reduce((a, b) => (counts[b] > counts[a] ? b : a), candidates[0]);
  return counts[best] > 0 ? best : ',';
}

/** 解析 CSV 文本为二维数组；支持引号内逗号、换行、双引号转义与 BOM */
export function parseCSV(text, delimiter = 'auto') {
  const raw = String(text ?? '').replace(/^\uFEFF/, '');
  const d = delimiter === 'auto' ? detectDelimiter(raw) : (DELIMITER_MAP[delimiter] || delimiter || ',');
  const rows = [];
  let row = [], field = '', inQuotes = false, quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '' && !quoted) { inQuotes = true; quoted = true; continue; }
    if (ch === d) { row.push(field); field = ''; quoted = false; continue; }
    if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      row.push(field); rows.push(row);
      row = []; field = ''; quoted = false;
      continue;
    }
    field += ch;
  }
  if (inQuotes) return { rows: [], delimiter: d, error: 'unclosedQuote' };
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  // 文件末尾换行会多出一个只有空字段的行
  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '' && /\r?\n$/.test(raw)) rows.pop();
  // 补齐列数，便于后续按列操作
  const width = rows.reduce((n, r) => Math.max(n, r.length), 0);
  for (const r of rows) while (r.length < width) r.push('');
  return { rows, delimiter: d, error: null };
}

/** 序列化二维数组为 CSV 文本 */
export function stringifyCSV(rows, delimiter = ',', { bom = false, lineEnding = '\r\n' } = {}) {
  const needsQuote = (v) => v.includes(delimiter) || v.includes('"') || /[\r\n]/.test(v) || /^\s|\s$/.test(v);
  const body = rows.map((row) => row.map((cell) => {
    const v = cell === null || cell === undefined ? '' : String(cell);
    return needsQuote(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(delimiter)).join(lineEnding);
  return (bom ? '\uFEFF' : '') + body;
}

function compileMatcher(pattern, useRegex) {
  if (!pattern) return null;
  if (!useRegex) return { test: (v) => v.includes(pattern) };
  let re;
  try { re = new RegExp(pattern); } catch { return { invalid: true }; }
  return { test: (v) => { re.lastIndex = 0; return re.test(v); } };
}

/** 解析列选择："1,3" 或 "2-4"，支持表头名称（keepHeader 时） */
function resolveColumns(spec, header, width) {
  const parts = String(spec || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean);
  const indexes = [];
  for (const part of parts) {
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (range) {
      for (let i = Number(range[1]); i <= Number(range[2]); i++) indexes.push(i - 1);
      continue;
    }
    if (/^\d+$/.test(part)) { indexes.push(Number(part) - 1); continue; }
    if (header) {
      const i = header.findIndex((h) => h.trim() === part);
      if (i >= 0) indexes.push(i);
    }
  }
  const valid = [...new Set(indexes)].filter((i) => i >= 0 && i < width);
  return valid;
}

function rowKey(row, ignoreCase) {
  const key = row.map((c) => String(c)).join('\u0001');
  return ignoreCase ? key.toLowerCase() : key;
}

/**
 * 清洗 CSV 行数据。opts:
 * trim / removeEmptyRows / removeDuplicates / ignoreCase / keepHeader /
 * columnMode ('all'|'keep'|'drop') / columnSpec / replaceFind / replaceWith /
 * useRegex / normalizeEmpty / filterMode ('none'|'keep'|'drop') / filterText /
 * sortColumn ('' 或 1-based 数字) / sortOrder ('asc'|'desc')
 */
export function cleanCSV(rows, opts = {}) {
  const o = {
    trim: true, removeEmptyRows: true, removeDuplicates: false, ignoreCase: false,
    keepHeader: true, columnMode: 'all', columnSpec: '', replaceFind: '', replaceWith: '',
    useRegex: false, normalizeEmpty: '', filterMode: 'none', filterText: '',
    sortColumn: '', sortOrder: 'asc', ...opts,
  };
  const originalRows = rows.length;
  const width = rows.reduce((n, r) => Math.max(n, r.length), 0);
  let data = rows.map((r) => r.map((c) => String(c ?? '')));
  if (o.trim) data = data.map((r) => r.map((c) => c.trim()));

  const matcher = compileMatcher(o.replaceFind, o.useRegex);
  if (matcher?.invalid) return { rows: [], error: 'invalidRegex' };
  let regexReplacement = null;
  if (o.replaceFind && o.useRegex) {
    try { regexReplacement = new RegExp(o.replaceFind, 'g'); } catch { return { rows: [], error: 'invalidRegex' }; }
  }
  if (o.replaceFind) {
    data = data.map((r) => r.map((c) => regexReplacement
      ? c.replace(regexReplacement, o.replaceWith)
      : c.split(o.replaceFind).join(o.replaceWith)));
  }
  if (o.normalizeEmpty) data = data.map((r) => r.map((c) => (c === '' ? o.normalizeEmpty : c)));

  let header = o.keepHeader && data.length ? data[0] : null;
  if (o.columnMode !== 'all') {
    const chosen = resolveColumns(o.columnSpec, header, width);
    if (!chosen.length) return { rows: [], error: 'invalidColumns' };
    if (o.columnMode === 'drop') {
      const keep = Array.from({ length: width }, (_, i) => i).filter((i) => !chosen.includes(i));
      if (!keep.length) return { rows: [], error: 'invalidColumns' };
      data = data.map((r) => keep.map((i) => r[i] ?? ''));
    } else data = data.map((r) => chosen.map((i) => r[i] ?? ''));
    header = o.keepHeader && data.length ? data[0] : null;
  }

  const body = header ? data.slice(1) : data;
  const stats = { originalRows, outputRows: 0, removedEmpty: 0, removedDuplicates: 0, removedByFilter: 0, columnCount: 0 };

  let list = body;
  if (o.removeEmptyRows) {
    const before = list.length;
    list = list.filter((r) => r.some((c) => c.trim() !== ''));
    stats.removedEmpty = before - list.length;
  }
  if (o.removeDuplicates) {
    const seen = new Set(header ? [rowKey(header, o.ignoreCase)] : []);
    const before = list.length;
    list = list.filter((r) => {
      const k = rowKey(r, o.ignoreCase);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    stats.removedDuplicates = before - list.length;
  }
  if (o.filterMode !== 'none' && o.filterText) {
    const fm = compileMatcher(o.filterText, o.useRegex);
    if (fm?.invalid) return { rows: [], error: 'invalidRegex' };
    const before = list.length;
    list = list.filter((r) => {
      const hit = fm.test(r.join('\u0001'));
      return o.filterMode === 'keep' ? hit : !hit;
    });
    stats.removedByFilter = before - list.length;
  }
  const col = Number(o.sortColumn);
  if (Number.isInteger(col) && col >= 1 && col <= width) {
    list = [...list].sort((a, b) => {
      const x = a[col - 1] ?? '', y = b[col - 1] ?? '';
      const nx = Number(x), ny = Number(y);
      const numeric = x !== '' && y !== '' && Number.isFinite(nx) && Number.isFinite(ny);
      const cmp = numeric ? nx - ny : String(x).localeCompare(String(y), undefined, { numeric: true });
      return o.sortOrder === 'desc' ? -cmp : cmp;
    });
  }
  const out = header ? [header, ...list] : list;
  stats.outputRows = out.length;
  stats.columnCount = out.reduce((n, r) => Math.max(n, r.length), 0);
  return { rows: out, stats, error: null };
}
