/* 批量文本处理：按顺序执行的有序步骤链（纯逻辑，可在浏览器与 Node 运行） */

export const STEP_TYPES = [
  'trim', 'removeEmpty', 'dedupe', 'sort', 'case', 'affix', 'replace',
  'filter', 'extract', 'number', 'reverse',
];

export const defaultStepOptions = {
  trim: {},
  removeEmpty: {},
  dedupe: { ignoreCase: false },
  sort: { order: 'asc' },
  case: { mode: 'upper' },
  affix: { prefix: '', suffix: '' },
  replace: { find: '', replacement: '', useRegex: false },
  filter: { mode: 'keep', keyword: '' },
  extract: { mode: 'column', separator: ',', index: 1, pattern: '(\\S+)', group: 1 },
  number: { start: 1, separator: '. ' },
  reverse: {},
};

function titleCase(str) {
  return str.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function buildRegex(pattern, flags) {
  try { return new RegExp(pattern, flags); } catch { return null; }
}

/**
 * 对文本行依次执行步骤。
 * @param {string[]} lines 输入行
 * @param {{type:string,options?:object}[]} steps 有序步骤
 * @returns {{lines:string[], stats:object, error:string|null}}
 */
export function applySteps(lines, steps = []) {
  const original = lines.length;
  let out = lines.map((l) => String(l));
  const removed = { empty: 0, duplicate: 0, filter: 0, extract: 0 };

  for (const step of steps) {
    const type = step?.type;
    if (!STEP_TYPES.includes(type)) return { lines: out, stats: {}, error: 'invalidStep' };
    const o = { ...(defaultStepOptions[type] || {}), ...(step.options || {}) };
    switch (type) {
      case 'trim':
        out = out.map((l) => l.trim());
        break;
      case 'removeEmpty': {
        const before = out.length;
        out = out.filter((l) => l.trim() !== '');
        removed.empty += before - out.length;
        break;
      }
      case 'dedupe': {
        const seen = new Set();
        const before = out.length;
        out = out.filter((l) => {
          const key = o.ignoreCase ? l.toLowerCase() : l;
          if (seen.has(key)) return false;
          seen.add(key); return true;
        });
        removed.duplicate += before - out.length;
        break;
      }
      case 'sort':
        out = [...out];
        if (o.order === 'reverse') out.reverse();
        else if (o.order === 'length') out.sort((a, b) => a.length - b.length);
        else out.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        if (o.order === 'desc') out.reverse();
        break;
      case 'case':
        out = out.map((l) => (o.mode === 'lower' ? l.toLowerCase() : o.mode === 'title' ? titleCase(l) : l.toUpperCase()));
        break;
      case 'affix':
        out = out.map((l) => `${o.prefix || ''}${l}${o.suffix || ''}`);
        break;
      case 'replace': {
        if (o.find === '') break;
        if (o.useRegex) {
          const re = buildRegex(o.find, 'g');
          if (!re) return { lines: out, stats: {}, error: 'invalidRegex' };
          out = out.map((l) => l.replace(re, o.replacement || ''));
        } else out = out.map((l) => l.split(o.find).join(o.replacement || ''));
        break;
      }
      case 'filter': {
        if (!o.keyword) break;
        const before = out.length;
        const kw = o.keyword;
        out = out.filter((l) => (o.mode === 'drop' ? !l.includes(kw) : l.includes(kw)));
        removed.filter += before - out.length;
        break;
      }
      case 'extract': {
        const before = out.length;
        if (o.mode === 'regex') {
          const re = buildRegex(o.pattern, 'g');
          if (!re) return { lines: out, stats: {}, error: 'invalidRegex' };
          const group = Number(o.group) || 0;
          const next = [];
          for (const line of out) {
            re.lastIndex = 0;
            const m = re.exec(line);
            if (m && m[group] !== undefined) next.push(m[group]);
          }
          out = next;
        } else {
          const sep = o.separator || ',';
          const idx = (Number(o.index) || 1) - 1;
          const next = [];
          for (const line of out) {
            const parts = line.split(sep);
            if (idx >= 0 && idx < parts.length) next.push(parts[idx].trim());
          }
          out = next;
        }
        removed.extract += before - out.length;
        break;
      }
      case 'number': {
        const start = Number.isFinite(Number(o.start)) ? Number(o.start) : 1;
        const sep = o.separator ?? '. ';
        out = out.map((l, i) => `${start + i}${sep}${l}`);
        break;
      }
      case 'reverse':
        out = [...out].reverse();
        break;
    }
  }

  return {
    lines: out,
    stats: {
      original, output: out.length,
      removed: original - out.length,
      removedEmpty: removed.empty, removedDuplicate: removed.duplicate,
      removedByFilter: removed.filter, removedByExtract: removed.extract,
      stepCount: steps.length,
    },
    error: null,
  };
}

/** 步骤参数定义（供 UI 动态渲染；label 文案由 i18n 的 ui 对象提供） */
export const STEP_DEFS = {
  trim: { fields: [] },
  removeEmpty: { fields: [] },
  dedupe: { fields: [{ key: 'ignoreCase', type: 'checkbox' }] },
  sort: { fields: [{ key: 'order', type: 'select', options: ['asc', 'desc', 'reverse', 'length'], labelGroup: 'sortOrders' }] },
  case: { fields: [{ key: 'mode', type: 'select', options: ['upper', 'lower', 'title'], labelGroup: 'caseModes' }] },
  affix: { fields: [{ key: 'prefix', type: 'text' }, { key: 'suffix', type: 'text' }] },
  replace: { fields: [{ key: 'find', type: 'text' }, { key: 'replacement', type: 'text' }, { key: 'useRegex', type: 'checkbox' }] },
  filter: { fields: [{ key: 'mode', type: 'select', options: ['keep', 'drop'], labelGroup: 'filterModes' }, { key: 'keyword', type: 'text' }] },
  extract: {
    fields: [
      { key: 'mode', type: 'select', options: ['column', 'regex'], labelGroup: 'extractModes' },
      { key: 'separator', type: 'text', showIf: { mode: 'column' } },
      { key: 'index', type: 'number', showIf: { mode: 'column' } },
      { key: 'pattern', type: 'text', showIf: { mode: 'regex' } },
      { key: 'group', type: 'number', showIf: { mode: 'regex' } },
    ],
  },
  number: { fields: [{ key: 'start', type: 'number' }, { key: 'separator', type: 'text' }] },
  reverse: { fields: [] },
};

/** 把输入文本按行拆分，兼容 CRLF 与末尾换行 */
export function splitLines(text) {
  if (!text) return [];
  return String(text).replace(/\r\n?/g, '\n').split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === ''));
}
