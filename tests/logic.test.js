import test from 'node:test';
import assert from 'node:assert/strict';

import { dedupeLines, convertCase, diffLines, formatJSON, splitWords } from '../src/scripts/logic/text.js';
import { urlEncode, urlDecode, base64Encode, base64Decode } from '../src/scripts/logic/encoding.js';
import { percentage, profitMargin } from '../src/scripts/logic/calc.js';
import { convertUnit, unitGroups } from '../src/scripts/logic/units.js';
import { dateDiff, addDays, countWeekdays, toUTC } from '../src/scripts/logic/date.js';
import { parseColor, rgbToHex, rgbToHsl, hslToRgb, complementary, adjustLightness } from '../src/scripts/logic/color.js';
import { parsePageRanges, toCSV, targetSize, mimeForFormat } from '../src/scripts/logic/files.js';
import { parseCSV, stringifyCSV, detectDelimiter, cleanCSV } from '../src/scripts/logic/csv.js';
import { applySteps, splitLines, STEP_TYPES } from '../src/scripts/logic/batch-text.js';
import { FORMULAS, buildFormula, evaluateFormula, parseCriteria, trialValues } from '../src/scripts/logic/excel-formula.js';

/* ---------------- 文本工具 ---------------- */
test('dedupeLines: 基本去重保留首次出现', () => {
  const r = dedupeLines('apple\nbanana\napple\norange', {});
  assert.deepEqual(r.lines, ['apple', 'banana', 'orange']);
  assert.equal(r.removed, 1);
  assert.equal(r.original, 4);
});

test('dedupeLines: 忽略大小写、空白、空行与排序', () => {
  const r = dedupeLines('  Apple \napple\n\nBanana\nBANANA', {
    ignoreCase: true, trimWhitespace: true, removeEmpty: true, sortOutput: true,
  });
  assert.deepEqual(r.lines, ['Apple', 'Banana']);
  assert.equal(r.removed, 3);
});

test('convertCase: 常见命名格式', () => {
  assert.equal(convertCase('hello world', 'upper'), 'HELLO WORLD');
  assert.equal(convertCase('HELLO WORLD', 'lower'), 'hello world');
  assert.equal(convertCase('hello WORLD', 'title'), 'Hello World');
  assert.equal(convertCase('hello world', 'camel'), 'helloWorld');
  assert.equal(convertCase('hello world', 'pascal'), 'HelloWorld');
  assert.equal(convertCase('HelloWorld', 'snake'), 'hello_world');
  assert.equal(convertCase('HelloWorld', 'kebab'), 'hello-world');
  assert.equal(convertCase('AbC', 'toggle'), 'aBc');
  assert.equal(convertCase('abc', 'reverse'), 'cba');
});

test('splitWords: 中文与驼峰混合', () => {
  assert.deepEqual(splitWords('userName 中文 test'), ['user', 'Name', '中文', 'test']);
});

test('diffLines: 新增/删除/相同统计', () => {
  const rows = diffLines('a\nb\nc', 'a\nx\nc\nd');
  const types = rows.map((r) => r.type);
  assert.ok(types.includes('added') && types.includes('removed') && types.includes('same'));
  assert.equal(rows.filter((r) => r.type === 'same').length, 2);
  assert.deepEqual(diffLines('a\nb', 'b\na').filter((r) => r.type === 'same').length >= 1, true);
});

test('diffLines: 忽略大小写与空白', () => {
  const rows = diffLines('Hello  World', 'hello world', { ignoreCase: true, ignoreWhitespace: true });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].type, 'same');
});

test('diffLines: 超长文本自动降级不抛错', () => {
  const a = Array.from({ length: 600 }, (_, i) => `line ${i}`).join('\n');
  const b = Array.from({ length: 600 }, (_, i) => `line ${i}`).join('\n');
  const rows = diffLines(a, b);
  assert.equal(rows.length, 600);
  assert.ok(rows.every((r) => r.type === 'same'));
});

test('formatJSON: 格式化、压缩、排序与错误定位', () => {
  const input = '{"b":2,"a":1}';
  assert.equal(formatJSON(input, { indent: 2 }).output, '{\n  "b": 2,\n  "a": 1\n}');
  assert.equal(formatJSON(input, { minify: true }).output, '{"b":2,"a":1}');
  assert.equal(formatJSON(input, { sortKeys: true, minify: true }).output, '{"a":1,"b":2}');
  assert.equal(formatJSON('{"a": [1, 2,]}').ok, false);
  assert.match(formatJSON('{bad').error, /position|token|Unexpected/i);
});

/* ---------------- 编码工具 ---------------- */
test('URL 编解码：中文与特殊字符', () => {
  assert.equal(urlEncode('中文 工具'), '%E4%B8%AD%E6%96%87%20%E5%B7%A5%E5%85%B7');
  assert.equal(urlDecode('%E4%B8%AD%E6%96%87'), '中文');
  assert.equal(urlEncode('https://a.com/?q=1', false), 'https://a.com/?q=1');
  assert.throws(() => urlDecode('%E0%A4%A'));
});

test('Base64：中文与 emoji 往返', () => {
  const text = '你好 ToolNest 🚀\n第二行';
  assert.equal(base64Decode(base64Encode(text)), text);
  assert.equal(base64Decode(base64Encode('')), '');
  assert.throws(() => base64Decode('not-valid-base64!!!'));
});

/* ---------------- 计算器 ---------------- */
test('percentage: 四种模式', () => {
  assert.equal(percentage(1, 200, 15).value, 30);
  assert.equal(percentage(2, 50, 200).value, 25);
  assert.equal(percentage(3, 100, 10, 'increase').value, 110);
  assert.equal(percentage(3, 100, 10, 'decrease').value, 90);
  assert.equal(percentage(4, 100, 120).value, 20);
  assert.ok(Math.abs(percentage(4, 120, 100).value + 16.666666666666664) < 1e-8);
  assert.equal(percentage(2, 1, 0).valid, false);
});

test('profitMargin: 毛利率/加价率/亏损', () => {
  const r = profitMargin(80, 100, 1, 0);
  assert.equal(r.margin, 20);
  assert.equal(r.markup, 25);
  assert.equal(r.profit, 20);
  const bulk = profitMargin(80, 100, 10, 50);
  assert.equal(bulk.revenue, 1000);
  assert.equal(bulk.totalCost, 850);
  assert.equal(bulk.profit, 150);
  assert.equal(bulk.unitProfit, 15);
  assert.equal(profitMargin(120, 100, 1, 0).profit, -20);
});

/* ---------------- 单位换算 ---------------- */
test('convertUnit: 线性单位', () => {
  assert.equal(convertUnit(1, 'length', 'km', 'm'), 1000);
  assert.equal(convertUnit(1, 'length', 'mi', 'km'), 1.609344);
  assert.equal(convertUnit(1, 'weight', 'kg', 'lb'), 2.2046226218487757);
  assert.equal(convertUnit(1, 'data', 'gb', 'mb'), 1000);
});

test('convertUnit: 温度零点偏移', () => {
  assert.equal(convertUnit(0, 'temperature', 'c', 'f'), 32);
  assert.equal(convertUnit(100, 'temperature', 'c', 'f'), 212);
  assert.equal(convertUnit(32, 'temperature', 'f', 'c'), 0);
  assert.equal(convertUnit(0, 'temperature', 'c', 'k'), 273.15);
  assert.ok(Math.abs(convertUnit(0, 'temperature', 'k', 'c') + 273.15) < 1e-9);
});

test('unitGroups: 8 类单位数据完整', () => {
  assert.equal(unitGroups.length, 8);
  for (const g of unitGroups) {
    assert.ok(g.units.length >= 3, `${g.id} 单位过少`);
    assert.ok(g.label.zh && g.label.en);
    if (g.id !== 'temperature') for (const u of g.units) assert.ok(u.factor > 0, `${g.id}.${u.id} 缺少 factor`);
  }
});

/* ---------------- 日期 ---------------- */
test('toUTC: 非法日期被拒绝', () => {
  assert.ok(toUTC('2025-03-12'));
  assert.equal(toUTC('2025-02-30'), null);
  assert.equal(toUTC('2025/03/12'), null);
});

test('dateDiff: 天数、工作日与包含结束日', () => {
  const r = dateDiff('2025-03-01', '2025-03-08');
  assert.equal(r.days, 7);
  assert.equal(r.weeks, 1);
  assert.equal(r.weekdays, 5);
  assert.equal(r.weekendDays, 2);
  assert.equal(dateDiff('2025-03-01', '2025-03-08', true).days, 8);
  assert.equal(dateDiff('2025-03-08', '2025-03-01').days, -7);
});

test('addDays: 加减与跨月', () => {
  assert.deepEqual(addDays('2025-01-31', 1, 'add'), { date: '2025-02-01', weekday: 6 });
  assert.equal(addDays('2025-03-01', 10, 'subtract').date, '2025-02-19');
  assert.equal(countWeekdays('2025-03-01', '2025-03-08').weekdays, 5);
});

/* ---------------- 颜色 ---------------- */
test('parseColor: HEX / RGB / HSL', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseColor('2563EB'), { r: 37, g: 99, b: 235 });
  assert.deepEqual(parseColor('rgb(37, 99, 235)'), { r: 37, g: 99, b: 235 });
  assert.deepEqual(parseColor('37,99,235'), { r: 37, g: 99, b: 235 });
  assert.ok(parseColor('hsl(0, 100%, 50%)'));
  assert.equal(parseColor('rgb(300, 0, 0)'), null);
  assert.equal(parseColor('nonsense'), null);
});

test('颜色互转与变体', () => {
  const rgb = { r: 37, g: 99, b: 235 };
  assert.equal(rgbToHex(rgb), '#2563EB');
  const hsl = rgbToHsl(rgb);
  assert.ok(hsl.h >= 0 && hsl.h <= 360 && hsl.s >= 0 && hsl.s <= 100);
  const back = hslToRgb(hsl);
  assert.ok(Math.abs(back.r - rgb.r) <= 2 && Math.abs(back.g - rgb.g) <= 2 && Math.abs(back.b - rgb.b) <= 2);
  assert.equal(rgbToHex(hslToRgb({ h: 0, s: 100, l: 50 })), '#FF0000');
  assert.equal(rgbToHex(complementary({ r: 255, g: 0, b: 0 })), '#00FFFF');
  assert.ok(adjustLightness(rgb, 10).b >= rgb.b);
});

/* ---------------- 文件 ---------------- */
test('parsePageRanges: 范围解析与越界', () => {
  assert.deepEqual(parsePageRanges('1-3,5,8-10', 10).pages, [1, 2, 3, 5, 8, 9, 10]);
  assert.deepEqual(parsePageRanges('2,2,3', 3).pages, [2, 3]);
  assert.deepEqual(parsePageRanges('1-3', 2).pages, [1, 2]);
  assert.equal(parsePageRanges('3-1', 10).valid, false);
  assert.equal(parsePageRanges('abc', 10).valid, false);
  assert.equal(parsePageRanges('', 10).valid, false);
});

test('toCSV: 引号、逗号、换行转义', () => {
  assert.equal(toCSV([['a', 'b'], ['1', 'x,y']]), 'a,b\r\n1,"x,y"');
  assert.equal(toCSV([['he said "hi"', 'line\nbreak']]), '"he said ""hi""","line\nbreak"');
  assert.equal(toCSV([['a', 'b']], ';'), 'a;b');
  assert.equal(toCSV([[null, undefined]]), ',');
});

test('targetSize: 锁定比例与非法输入', () => {
  assert.deepEqual(targetSize(1000, 500, 500, '', true), { width: 500, height: 250 });
  assert.deepEqual(targetSize(1000, 500, '', 250, true), { width: 500, height: 250 });
  assert.deepEqual(targetSize(1000, 500, 800, 400, false), { width: 800, height: 400 });
  assert.equal(targetSize(1000, 500, 'abc', '', true), null);
  assert.equal(mimeForFormat('webp'), 'image/webp');
});

/* ---------------- CSV 数据清洗 ---------------- */
test('parseCSV: 引号内逗号、换行与双引号转义', () => {
  const r = parseCSV('name,note\r\n"a,b","line\nbreak"\r\n"say ""hi""",ok\r\n');
  assert.equal(r.error, null);
  assert.deepEqual(r.rows, [['name', 'note'], ['a,b', 'line\nbreak'], ['say "hi"', 'ok']]);
});

test('parseCSV: 自动识别分隔符、BOM 与补列', () => {
  assert.equal(detectDelimiter('a;b;c\n1;2;3'), ';');
  assert.equal(detectDelimiter('a\tb\tc\n1\t2\t3'), '\t');
  const r = parseCSV('\uFEFFa|b\n1', 'auto');
  assert.equal(r.delimiter, '|');
  assert.deepEqual(r.rows, [['a', 'b'], ['1', '']]);
  assert.equal(parseCSV('a,"unterminated', ',').error, 'unclosedQuote');
});

test('stringifyCSV: 按需加引号、转义与 BOM，往返无损', () => {
  assert.equal(stringifyCSV([['a', 'b'], ['x,y', 'he said "hi"']]), 'a,b\r\n"x,y","he said ""hi"""');
  assert.equal(stringifyCSV([['中文', '值']], ',', { bom: true }).charCodeAt(0), 0xFEFF);
  const rows = [['name', 'note'], ['a,b', 'line\nbreak']];
  assert.deepEqual(parseCSV(stringifyCSV(rows)).rows, rows);
});

test('cleanCSV: 去空白/空行/重复行并保留表头', () => {
  const { rows, stats, error } = cleanCSV(parseCSV('name,qty\n Apple ,10\nApple,10\n\nBanana,20\n', ',').rows, {
    trim: true, removeEmptyRows: true, removeDuplicates: true, keepHeader: true,
  });
  assert.equal(error, null);
  assert.deepEqual(rows, [['name', 'qty'], ['Apple', '10'], ['Banana', '20']]);
  assert.equal(stats.removedEmpty, 1);
  assert.equal(stats.removedDuplicates, 1);
  assert.equal(stats.outputRows, 3);
});

test('cleanCSV: 保留/删除列、查找替换、行过滤与排序', () => {
  const src = parseCSV('name,qty,city\napple,10,SH\nbanana,3,BJ\ncherry,7,SH\n', ',').rows;
  const kept = cleanCSV(src, { columnMode: 'keep', columnSpec: '1,3', keepHeader: true });
  assert.deepEqual(kept.rows[0], ['name', 'city']);
  assert.equal(kept.stats.columnCount, 2);
  assert.equal(cleanCSV(src, { columnMode: 'drop', columnSpec: 'qty', keepHeader: true }).rows[0].join(','), 'name,city');
  const replaced = cleanCSV(src, { replaceFind: 'SH', replaceWith: '上海', keepHeader: true });
  assert.equal(replaced.rows[1][2], '上海');
  const filtered = cleanCSV(src, { filterMode: 'keep', filterText: 'SH', keepHeader: true });
  assert.equal(filtered.stats.removedByFilter, 1);
  const sorted = cleanCSV(src, { sortColumn: '2', sortOrder: 'desc', keepHeader: true });
  assert.deepEqual(sorted.rows.slice(1).map((r) => r[1]), ['10', '7', '3']);
  assert.equal(cleanCSV(src, { columnMode: 'keep', columnSpec: '99' }).error, 'invalidColumns');
  assert.equal(cleanCSV(src, { replaceFind: '[', useRegex: true }).error, 'invalidRegex');
});

/* ---------------- 批量文本处理 ---------------- */
test('applySteps: 有序步骤链（trim → 去空 → 去重 → 加前后缀 → 编号）', () => {
  const lines = splitLines('  apple \n\nApple\nbanana\n');
  const r = applySteps(lines, [
    { type: 'trim' }, { type: 'removeEmpty' },
    { type: 'dedupe', options: { ignoreCase: true } },
    { type: 'affix', options: { prefix: '· ', suffix: '' } },
    { type: 'number', options: { start: 1, separator: '. ' } },
  ]);
  assert.equal(r.error, null);
  assert.deepEqual(r.lines, ['1. · apple', '2. · banana']);
  assert.equal(r.stats.removed, 2);
  assert.equal(r.stats.stepCount, 5);
});

test('applySteps: 排序、大小写、正则替换、过滤与提取', () => {
  assert.deepEqual(applySteps(['b', 'A', 'c'], [{ type: 'sort', options: { order: 'asc' } }]).lines, ['A', 'b', 'c']);
  assert.deepEqual(applySteps(['b', 'a'], [{ type: 'sort', options: { order: 'reverse' } }]).lines, ['a', 'b']);
  assert.deepEqual(applySteps(['hello world'], [{ type: 'case', options: { mode: 'title' } }]).lines, ['Hello World']);
  assert.deepEqual(applySteps(['a1', 'b2'], [{ type: 'replace', options: { find: '\\d', replacement: '#', useRegex: true } }]).lines, ['a#', 'b#']);
  assert.deepEqual(applySteps(['keep', 'drop'], [{ type: 'filter', options: { mode: 'drop', keyword: 'drop' } }]).lines, ['keep']);
  assert.deepEqual(applySteps(['a,b,c'], [{ type: 'extract', options: { mode: 'column', separator: ',', index: 2 } }]).lines, ['b']);
  assert.deepEqual(applySteps(['id=42'], [{ type: 'extract', options: { mode: 'regex', pattern: 'id=(\\d+)', group: 1 } }]).lines, ['42']);
  assert.equal(applySteps(['x'], [{ type: 'replace', options: { find: '[', useRegex: true } }]).error, 'invalidRegex');
  assert.equal(applySteps(['x'], [{ type: 'nope' }]).error, 'invalidStep');
  assert.ok(STEP_TYPES.includes('reverse'));
  assert.deepEqual(splitLines('a\r\nb\r\n'), ['a', 'b']);
});

/* ---------------- Excel 公式助手 ---------------- */
test('buildFormula: 常用公式生成与参数校验', () => {
  assert.equal(buildFormula('sum', { range: 'A1:A10' }).formula, '=SUM(A1:A10)');
  assert.equal(buildFormula('if', { condition: 'A1>=60', trueValue: '"Pass"', falseValue: '"Fail"' }).formula,
    '=IF(A1>=60, "Pass", "Fail")');
  assert.equal(buildFormula('sumif', { range: 'A1:A10', criteria: '">60"', sumRange: 'B1:B10' }).formula,
    '=SUMIF(A1:A10, ">60", B1:B10)');
  assert.equal(buildFormula('vlookup', { lookupValue: 'E2', tableArray: 'A2:C100', colIndex: '2' }).formula,
    '=VLOOKUP(E2, A2:C100, 2, FALSE)');
  assert.equal(buildFormula('sum', { range: '' }).error, 'missingParams');
  assert.equal(buildFormula('unknown', {}).error, 'unknownFormula');
  assert.ok(FORMULAS.length >= 15);
});

test('evaluateFormula: 本地试算与不支持的公式', () => {
  const v = trialValues('10\n20\n30\n');
  assert.equal(evaluateFormula('sum', v, {}).value, 60);
  assert.equal(evaluateFormula('average', v, {}).value, 20);
  assert.equal(evaluateFormula('count', ['1', 'x', ''], {}).value, 1);
  assert.equal(evaluateFormula('counta', ['1', 'x', ''], {}).value, 2);
  assert.equal(evaluateFormula('max', v, {}).value, 30);
  assert.equal(evaluateFormula('min', v, {}).value, 10);
  assert.equal(evaluateFormula('round', ['3.14159'], { digits: '2' }).value, 3.14);
  assert.equal(evaluateFormula('sumif', v, { criteria: '">15"' }).value, 50);
  assert.equal(evaluateFormula('countif', v, { criteria: '>=20' }).value, 2);
  assert.equal(evaluateFormula('textjoin', ['a', 'b'], { delimiter: '"-"' }).value, 'a-b');
  assert.equal(evaluateFormula('trim', ['  a   b  '], {}).value, 'a b');
  assert.equal(evaluateFormula('upper', ['abc'], {}).value, 'ABC');
  assert.equal(evaluateFormula('len', ['中文'], {}).value, 2);
  assert.equal(evaluateFormula('vlookup', v, {}).supported, false);
});

test('parseCriteria: 比较运算符与文本相等', () => {
  assert.equal(parseCriteria('">60"')(70), true);
  assert.equal(parseCriteria('">60"')(50), false);
  assert.equal(parseCriteria('<=20')(20), true);
  assert.equal(parseCriteria('<>5')(6), true);
  assert.equal(parseCriteria('"Apple"')('Apple'), true);
  assert.equal(parseCriteria('"Apple"')('Banana'), false);
  assert.equal(parseCriteria(''), null);
});
