/* Excel / Google Sheets 公式助手：公式模板、生成与本地试算（纯逻辑） */

const req = (key, def) => ({ key, default: def, required: true });
const P = {
  range: () => req('range', 'A1:A10'),
  cell: () => req('cell', 'A1'),
};

/** 每个模板：参数定义、公式生成、可在浏览器本地模拟的试算 */
export const FORMULAS = [
  { id: 'sum', params: [P.range()], build: (p) => `=SUM(${p.range})`,
    evaluate: (v) => ({ supported: true, value: sum(v) }) },
  { id: 'average', params: [P.range()], build: (p) => `=AVERAGE(${p.range})`,
    evaluate: (v) => { const n = nums(v); return { supported: true, value: n.length ? avg(n) : 0 }; } },
  { id: 'count', params: [P.range()], build: (p) => `=COUNT(${p.range})`,
    evaluate: (v) => ({ supported: true, value: nums(v).length }) },
  { id: 'counta', params: [P.range()], build: (p) => `=COUNTA(${p.range})`,
    evaluate: (v) => ({ supported: true, value: v.filter((x) => String(x).trim() !== '').length }) },
  { id: 'max', params: [P.range()], build: (p) => `=MAX(${p.range})`,
    evaluate: (v) => { const n = nums(v); return { supported: true, value: n.length ? Math.max(...n) : 0 }; } },
  { id: 'min', params: [P.range()], build: (p) => `=MIN(${p.range})`,
    evaluate: (v) => { const n = nums(v); return { supported: true, value: n.length ? Math.min(...n) : 0 }; } },
  { id: 'round', params: [P.cell(), req('digits', '2')], build: (p) => `=ROUND(${p.cell}, ${p.digits})`,
    evaluate: (v, p) => {
      const n = Number(String(v[0] ?? '').trim()), d = Number(p.digits);
      return { supported: true, value: Number.isFinite(n) && Number.isFinite(d) ? Number(n.toFixed(Math.max(0, Math.min(10, d)))) : '—' };
    } },
  { id: 'if', params: [req('condition', 'A1>=60'), req('trueValue', '"Pass"'), req('falseValue', '"Fail"')],
    build: (p) => `=IF(${p.condition}, ${p.trueValue}, ${p.falseValue})`,
    evaluate: () => ({ supported: false }) },
  { id: 'sumif', params: [P.range(), req('criteria', '">60"'), { ...req('sumRange', 'B1:B10'), required: false }],
    build: (p) => `=SUMIF(${p.range}, ${p.criteria}${p.sumRange ? `, ${p.sumRange}` : ''})`,
    evaluate: (v, p) => {
      const pred = parseCriteria(p.criteria);
      if (!pred) return { supported: false };
      return { supported: true, value: sum(v.filter((x) => pred(x))) };
    } },
  { id: 'countif', params: [P.range(), req('criteria', '">60"')],
    build: (p) => `=COUNTIF(${p.range}, ${p.criteria})`,
    evaluate: (v, p) => {
      const pred = parseCriteria(p.criteria);
      if (!pred) return { supported: false };
      return { supported: true, value: v.filter((x) => pred(x)).length };
    } },
  { id: 'vlookup', params: [req('lookupValue', 'E2'), req('tableArray', 'A2:C100'), req('colIndex', '2')],
    build: (p) => `=VLOOKUP(${p.lookupValue}, ${p.tableArray}, ${p.colIndex}, FALSE)`,
    evaluate: () => ({ supported: false }) },
  { id: 'xlookup', params: [req('lookupValue', 'E2'), req('lookupArray', 'A2:A100'), req('returnArray', 'C2:C100')],
    build: (p) => `=XLOOKUP(${p.lookupValue}, ${p.lookupArray}, ${p.returnArray})`,
    evaluate: () => ({ supported: false }) },
  { id: 'textjoin', params: [req('delimiter', '", "'), P.range()],
    build: (p) => `=TEXTJOIN(${p.delimiter}, TRUE, ${p.range})`,
    evaluate: (v, p) => {
      const d = String(p.delimiter).replace(/^"|"$/g, '');
      return { supported: true, value: v.filter((x) => String(x).trim() !== '').join(d) };
    } },
  { id: 'trim', params: [P.cell()], build: (p) => `=TRIM(${p.cell})`,
    evaluate: (v) => ({ supported: true, value: String(v[0] ?? '').trim().replace(/\s+/g, ' ') }) },
  { id: 'upper', params: [P.cell()], build: (p) => `=UPPER(${p.cell})`,
    evaluate: (v) => ({ supported: true, value: String(v[0] ?? '').toUpperCase() }) },
  { id: 'len', params: [P.cell()], build: (p) => `=LEN(${p.cell})`,
    evaluate: (v) => ({ supported: true, value: String(v[0] ?? '').length }) },
  { id: 'iferror', params: [req('value', 'A1/B1'), req('fallback', '0')],
    build: (p) => `=IFERROR(${p.value}, ${p.fallback})`,
    evaluate: () => ({ supported: false }) },
];

export const formulaById = Object.fromEntries(FORMULAS.map((f) => [f.id, f]));
export const formulaIds = FORMULAS.map((f) => f.id);

const nums = (values) => values
  .map((x) => ({ raw: String(x).trim(), n: Number(String(x).trim()) }))
  .filter(({ raw, n }) => raw !== '' && Number.isFinite(n))
  .map(({ n }) => n);
const sum = (values) => values.reduce((a, b) => a + (Number(String(b).trim()) || 0), 0);
const avg = (numbers) => numbers.reduce((a, b) => a + b, 0) / numbers.length;

/** 解析 COUNTIF / SUMIF 条件，支持 > < >= <= = <> 与文本相等 */
export function parseCriteria(raw) {
  const text = String(raw ?? '').trim().replace(/^"|"$/g, '');
  if (!text) return null;
  const m = /^(>=|<=|<>|>|<|=)?\s*([\s\S]*)$/.exec(text);
  if (!m) return null;
  const op = m[1] || '=', operand = m[2].trim();
  const numOperand = Number(operand);
  const numeric = operand !== '' && Number.isFinite(numOperand);
  return (value) => {
    const s = String(value ?? '').trim();
    const n = Number(s);
    const a = numeric && s !== '' && Number.isFinite(n) ? n : s;
    const b = numeric ? numOperand : operand;
    if (op === '>') return a > b;
    if (op === '<') return a < b;
    if (op === '>=') return a >= b;
    if (op === '<=') return a <= b;
    if (op === '<>') return a !== b;
    return a === b;
  };
}

/** 生成公式；缺少必填参数时返回 error */
export function buildFormula(id, params = {}) {
  const tpl = formulaById[id];
  if (!tpl) return { formula: '', error: 'unknownFormula' };
  const clean = {};
  for (const p of tpl.params) {
    const v = String(params[p.key] ?? '').trim();
    if (p.required && !v) return { formula: '', error: 'missingParams' };
    clean[p.key] = v;
  }
  try { return { formula: tpl.build(clean), error: null }; }
  catch { return { formula: '', error: 'missingParams' }; }
}

/** 本地试算：只模拟不依赖单元格引用的函数，其余返回 supported=false */
export function evaluateFormula(id, values, params = {}) {
  const tpl = formulaById[id];
  if (!tpl) return { supported: false, value: null };
  try { return tpl.evaluate(values.map((v) => String(v)), params); }
  catch { return { supported: false, value: null }; }
}

/** 试算输入：每行一个值，忽略末尾空行 */
export function trialValues(text) {
  if (!text) return [];
  return String(text).replace(/\r\n?/g, '\n').split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l.trim() === ''));
}
