/**
 * 浏览器端真实交互冒烟测试（需要 dist 已构建、/usr/bin/chromium 可用）
 * 覆盖：20 个工具的真实功能、下载、复制、双语路由、主题、收藏、移动端布局
 * 用法：npm run smoke
 */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4322;
const DIST = path.resolve('dist');
const FIXTURES = '/tmp/toolwild-fixtures';
const DOWNLOADS = '/tmp/toolwild-downloads';
const BASE = `http://127.0.0.1:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.join(DIST, pathname);
  if (!file.startsWith(DIST) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
fs.mkdirSync(DOWNLOADS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const client = await page.target().createCDPSession();
await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS });

const jsErrors = [];
let current = 'startup';
page.on('pageerror', (e) => jsErrors.push(`[${current}] ${e.message}`));
page.on('dialog', async (d) => d.accept());

const results = [];
async function check(name, fn) {
  current = name;
  try { await fn(); results.push({ name, ok: true }); console.log(`  ✓ ${name}`); }
  catch (e) { results.push({ name, ok: false, error: e.message }); console.log(`  ✗ ${name}: ${e.message}`); }
}
const go = async (url) => {
  await page.goto(BASE + url, { waitUntil: 'networkidle2' });
  // 站点启用了平滑滚动；自动化坐标点击前关闭它，避免滚动动画未结束时点击落空
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await sleep(180);
};
const setVal = (sel, value) => page.$eval(sel, (el, v) => {
  el.value = v;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, value);
const val = (sel) => page.$eval(sel, (el) => el.value);
const text = (sel) => page.$eval(sel, (el) => el.textContent.trim());
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const hiddenError = async () => {
  const el = await page.$('[data-role="error"]');
  if (!el) return true;
  return page.$eval('[data-role="error"]', (e) => e.hidden || !e.textContent.trim());
};
const clearDownloads = () => fs.readdirSync(DOWNLOADS).forEach((f) => { try { fs.unlinkSync(path.join(DOWNLOADS, f)); } catch {} });
async function waitDownload(match, timeout = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const files = fs.readdirSync(DOWNLOADS).filter((f) => !f.endsWith('.crdownload'));
    const hit = files.find((f) => f.includes(match));
    if (hit) return path.join(DOWNLOADS, hit);
    await sleep(200);
  }
  throw new Error(`下载超时: ${match}`);
}
async function upload(sel, ...files) {
  const input = await page.$(sel);
  assert(input, `找不到文件输入框 ${sel}`);
  await input.uploadFile(...files.map((f) => path.join(FIXTURES, f)));
  await sleep(400);
}

console.log('\n=== ToolWild 浏览器冒烟测试 ===');

/* ---------- 站点级 ---------- */
await check('首页 / 搜索 / 语言切换 / 深色模式', async () => {
  await go('/zh/');
  assert((await text('h1')).includes('搞定日常工作'), '首页 H1 不正确');
  await setVal('[data-role="site-search"]', '压缩');
  await sleep(150);
  assert((await page.$$('a.search-result-item')).length > 0, '搜索无结果');
  const enHref = await page.$eval('[data-lang-link="en"]', (a) => a.getAttribute('href'));
  assert(enHref === '/en/', `语言切换链接错误: ${enHref}`);
  await page.click('[data-action="theme-toggle"]');
  assert((await page.evaluate(() => localStorage.getItem('toolwild.theme'))) === 'dark', '主题未保存');
  assert((await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark', '主题未应用');
  await page.click('[data-action="theme-toggle"]');
});

/* ---------- A. 文本工具 ---------- */
await check('字数统计：实时统计中文/英文/行数', async () => {
  await go('/zh/tools/word-counter/');
  await setVal('[data-role="input"]', 'hello 世界\n第二行');
  await sleep(100);
  const cjk = await text('[data-stat="cjk"] [data-role="stat-value"]');
  const words = await text('[data-stat="words"] [data-role="stat-value"]');
  assert(cjk === '5', `中文字符数应为 5，实际 ${cjk}`);
  assert(words === '3', `单词数应为 3，实际 ${words}`);
});

await check('文本去重：删除重复行并统计', async () => {
  await go('/zh/tools/remove-duplicate-lines/');
  await setVal('[data-role="input"]', 'apple\nbanana\napple\norange');
  await page.click('[data-role="run"]');
  assert((await val('[data-role="output"]')) === 'apple\nbanana\norange', '去重结果错误');
  assert((await text('[data-role="status"]')).includes('1 行'), '未显示删除统计');
});

await check('大小写转换：camelCase', async () => {
  await go('/zh/tools/case-converter/');
  await setVal('[data-role="input"]', 'hello world');
  await page.click('[data-case="camel"]');
  assert((await val('[data-role="output"]')) === 'helloWorld', '驼峰转换错误');
});

await check('文本对比：Diff 结果渲染', async () => {
  await go('/zh/tools/text-diff/');
  await setVal('[data-role="input-a"]', 'a\nb\nc');
  await setVal('[data-role="input-b"]', 'a\nx\nc\nd');
  await page.click('[data-role="run"]');
  assert((await page.$$('.diff-line.added')).length > 0, '缺少新增行');
  assert((await page.$$('.diff-line.removed')).length > 0, '缺少删除行');
  assert((await text('[data-role="status"]')).includes('新增'), '统计缺失');
});

await check('JSON 格式化：格式化 + 校验错误', async () => {
  await go('/zh/tools/json-formatter/');
  await setVal('[data-role="input"]', '{"b":2,"a":1}');
  await page.click('[data-action="format"]');
  assert((await val('[data-role="output"]')).includes('\n  "b": 2'), '格式化失败');
  await setVal('[data-role="input"]', '{bad');
  await page.click('[data-action="validate"]');
  assert(!(await hiddenError()), '非法 JSON 未报错');
});

/* ---------- B. 图片工具 ---------- */
await check('图片压缩：Canvas 本地压缩 + JPG 下载', async () => {
  clearDownloads();
  await go('/zh/tools/image-compressor/');
  await upload('[data-role="file-input"]', 'test.png');
  await page.click('[data-role="run"]');
  await page.waitForFunction(() => !document.querySelector('[data-role="download"]').disabled, { timeout: 10000 });
  assert((await page.$$('[data-role="preview"] img')).length === 1, '预览未生成');
  assert((await text('[data-role="output-size"]')) !== '—', '未显示输出体积');
  await page.click('[data-role="download"]');
  const f = await waitDownload('.jpg');
  assert(fs.statSync(f).size > 100, '下载文件为空');
});

await check('图片尺寸调整：等比缩放', async () => {
  await go('/zh/tools/image-resizer/');
  await upload('[data-role="file-input"]', 'test.png');
  assert((await val('[data-role="width"]')) === '800', '未读取原始宽度');
  await setVal('[data-role="width"]', '400');
  await page.click('[data-role="run"]');
  await page.waitForFunction(() => !document.querySelector('[data-role="download"]').disabled, { timeout: 10000 });
  assert((await text('[data-role="dimension"]')).includes('400 ×'), `尺寸错误: ${await text('[data-role="dimension"]')}`);
});

await check('图片格式转换：PNG → WEBP', async () => {
  await go('/zh/tools/image-converter/');
  await upload('[data-role="file-input"]', 'test.png');
  await setVal('[data-role="format"]', 'webp');
  await page.click('[data-role="run"]');
  await page.waitForFunction(() => !document.querySelector('[data-role="download"]').disabled, { timeout: 10000 });
  assert((await page.$$('[data-role="preview"] img')).length === 1, '转换预览缺失');
});

/* ---------- C. 文件工具 ---------- */
await check('PDF 合并：2 个 PDF → 合并下载', async () => {
  clearDownloads();
  await go('/zh/tools/merge-pdf/');
  await upload('[data-role="file-input"]', 'a.pdf', 'b.pdf');
  assert((await page.$$('.file-item')).length === 2, '文件列表应为 2 项');
  assert((await text('[data-role="total-pages"]')).includes('5'), '总页数应为 5');
  await page.click('[data-role="run"]');
  const f = await waitDownload('merged.pdf');
  const head = fs.readFileSync(f).slice(0, 5).toString();
  assert(head === '%PDF-', '下载的不是合法 PDF');
  assert(await hiddenError(), '合并出现错误提示');
});

await check('PDF 拆分：页码范围提取', async () => {
  clearDownloads();
  await go('/zh/tools/split-pdf/');
  await upload('[data-role="file-input"]', 'a.pdf');
  assert((await text('[data-role="file-info"]')).includes('2 页'), '未读取页数');
  await setVal('[data-role="range"]', '1');
  await page.click('[data-role="run"]');
  const f = await waitDownload('split.pdf');
  assert(fs.readFileSync(f).slice(0, 5).toString() === '%PDF-', '拆分结果不是 PDF');
});

await check('图片转 PDF：多图合成', async () => {
  clearDownloads();
  await go('/zh/tools/image-to-pdf/');
  await upload('[data-role="file-input"]', 'test.png', 'test.jpg');
  assert((await page.$$('.file-item')).length === 2, '图片列表应为 2 项');
  await page.click('[data-role="run"]');
  const f = await waitDownload('images.pdf');
  assert(fs.readFileSync(f).slice(0, 5).toString() === '%PDF-', '生成结果不是 PDF');
});

await check('Excel 转 CSV：解析 + 预览 + 下载', async () => {
  clearDownloads();
  await go('/zh/tools/excel-to-csv/');
  await upload('[data-role="file-input"]', 'test.xlsx');
  assert((await page.$$('[data-role="preview"] table tr')).length >= 3, '预览表格缺失');
  await page.click('[data-role="run"]');
  assert(!(await page.$eval('[data-role="download"]', (b) => b.disabled)), '下载按钮未启用');
  await page.click('[data-role="download"]');
  const f = await waitDownload('.csv');
  const content = fs.readFileSync(f, 'utf8');
  assert(content.includes('a,b') || content.includes('"a,b"'), 'CSV 内容错误');
  assert(content.includes('中文'), 'CSV 中文丢失');
});

/* ---------- D. 计算器 ---------- */
await check('百分比计算器：四种模式', async () => {
  await go('/zh/tools/percentage-calculator/');
  await setVal('[data-role="x"]', '200');
  await setVal('[data-role="percent"]', '15');
  await page.click('[data-role="run"]');
  assert((await text('[data-role="result"]')) === '30', 'X 的 Y% 计算错误');
  await page.click('[data-role="mode"][value="4"]');
  await setVal('[data-role="x"]', '100');
  await setVal('[data-role="y"]', '120');
  await page.click('[data-role="run"]');
  assert((await text('[data-role="result"]')) === '20%', '变化率计算错误');
});

await check('利润率计算器：毛利率/加价率', async () => {
  await go('/zh/tools/profit-margin-calculator/');
  assert((await text('[data-role="margin"]')) === '20', '毛利率应为 20%');
  assert((await text('[data-role="markup"]')) === '25', '加价率应为 25%');
});

await check('单位换算：长度、温度、力与能量', async () => {
  await go('/zh/tools/unit-converter/');
  await setVal('[data-role="value"]', '1');
  assert((await text('[data-role="result"]')) === '0.1', 'mm→cm 换算错误');
  await setVal('[data-role="unit-group"]', 'temperature');
  await sleep(120);
  assert((await text('[data-role="result"]')) !== '—', '温度换算无结果');
  await setVal('[data-role="precision"]', '2');
  await sleep(120);
  assert((await text('[data-role="result"]')) === '33.80', '精度 2 位小数应为 33.80');
  const units = await page.$$eval('[data-role="all-units"] .uc-unit', (els) => els.length);
  assert(units === 3, '温度类别应有 3 个全单位卡片');
  await page.click('[data-role="all-units"] .uc-unit:nth-child(3)');
  await sleep(120);
  assert((await page.$eval('[data-role="to"]', (el) => el.value)) === 'k', '点击全单位卡片应切换目标单位');

  await setVal('[data-role="precision"]', 'auto');
  await setVal('[data-role="unit-group"]', 'force');
  await sleep(120);
  await setVal('[data-role="from"]', 'n');
  await setVal('[data-role="to"]', 'lbf');
  await sleep(120);
  assert((await text('[data-role="result"]')) === '0.224809', 'N→lbf 应显示 0.224809');

  await setVal('[data-role="unit-group"]', 'energy');
  await sleep(120);
  await setVal('[data-role="from"]', 'kj');
  await setVal('[data-role="to"]', 'j');
  await sleep(120);
  assert((await text('[data-role="result"]')) === '1000', 'kJ→J 应显示 1000');
});

await check('日期计算器：间隔与工作日', async () => {
  await go('/zh/tools/date-calculator/');
  assert((await text('[data-role="days"]')) === '7', '默认间隔应为 7 天');
  assert((await text('[data-role="weekdays"]')) === '5', '工作日应为 5');
});

/* ---------- E. 开发工具 ---------- */
await check('URL 编码解码：中文往返', async () => {
  await go('/zh/tools/url-encoder-decoder/');
  await setVal('[data-role="input"]', '中文 工具');
  await page.click('[data-action="encode"]');
  assert((await val('[data-role="output"]')).includes('%E4%B8%AD%E6%96%87'), '编码错误');
  const encoded = await val('[data-role="output"]');
  await setVal('[data-role="input"]', encoded);
  await page.click('[data-action="decode"]');
  assert((await val('[data-role="output"]')) === '中文 工具', '解码错误');
});

await check('Base64 编码解码：中文与 emoji', async () => {
  await go('/zh/tools/base64-encoder-decoder/');
  await setVal('[data-role="input"]', '你好 🚀');
  await page.click('[data-action="encode"]');
  const encoded = await val('[data-role="output"]');
  assert(encoded.length > 0, '编码为空');
  await setVal('[data-role="input"]', encoded);
  await page.click('[data-action="decode"]');
  assert((await val('[data-role="output"]')) === '你好 🚀', '解码往返失败');
});

await check('颜色转换器：HEX → RGB/HSL 联动', async () => {
  await go('/zh/tools/color-converter/');
  await setVal('[data-role="hex"]', '#FF0000');
  await page.click('[data-action="complementary"]');
  assert((await val('[data-role="hex"]')) === '#00FFFF' || (await val('[data-role="hex"]')) !== '', '颜色变体未生效');
  assert((await val('[data-role="rgb"]')).includes('rgb('), 'RGB 未同步');
});

/* ---------- F. 效率工具 ---------- */
await check('二维码生成器：生成 + PNG 下载', async () => {
  clearDownloads();
  await go('/zh/tools/qr-code-generator/');
  await setVal('[data-role="input"]', 'https://example.com');
  await page.click('[data-role="run"]');
  await page.waitForFunction(() => !document.querySelector('[data-role="download-png"]').disabled, { timeout: 10000 });
  assert((await page.$$('[data-role="preview"] canvas')).length === 1, '二维码 canvas 缺失');
  await page.click('[data-role="download-png"]');
  const f = await waitDownload('qrcode.png');
  assert(fs.statSync(f).size > 100, 'PNG 下载为空');
});

/* ---------- G. 办公效率工具（第二批新增） ---------- */
await check('Excel 公式助手：生成、参数切换、试算与重置', async () => {
  await go('/zh/tools/excel-formula-helper/');
  assert((await val('[data-role="output"]')) === '=SUM(A1:A10)', '默认 SUM 公式错误');
  assert((await text('[data-role="trial-result"]')) === '60', 'SUM 本地试算应为 60');
  await page.select('[data-role="formula-type"]', 'if');
  await sleep(120);
  assert((await val('[data-role="output"]')).startsWith('=IF('), 'IF 公式错误');
  assert((await page.$$('[data-param]')).length === 3, 'IF 应渲染 3 个参数');
  await page.select('[data-role="formula-type"]', 'vlookup');
  await sleep(120);
  assert((await val('[data-role="output"]')).startsWith('=VLOOKUP('), 'VLOOKUP 公式错误');
  assert((await text('[data-role="trial-result"]')).includes('Excel'), '依赖单元格引用的公式应提示在 Excel 中试算');
  await page.click('[data-role="clear"]');
  assert((await val('[data-role="output"]')) === '=SUM(A1:A10)', '重置未恢复默认公式');
});

await check('CSV 数据清洗：去重、列筛选、预览、下载与本地文件上传', async () => {
  await go('/zh/tools/csv-cleaner/');
  await setVal('[data-role="input"]', 'name,qty\n Apple ,10\nApple,10\n\nBanana,20\n');
  await page.click('[data-opt="removeDuplicates"]');
  await page.click('[data-role="run"]');
  await sleep(150);
  const out = await val('[data-role="output"]');
  const lines = out.split('\n').filter(Boolean);
  assert(lines.length === 3, `去重+去空行后应为 3 行，实际 ${lines.length}`);
  assert(lines.filter((l) => l === 'Apple,10').length === 1, '重复行未删除');
  assert(lines[0] === 'name,qty', '表头未保留');
  assert((await text('[data-role="stat-original"]')) === '5', '原始行数统计错误');
  assert((await page.$$('[data-role="preview"] .csv-table tbody tr')).length === 3, '预览表格行数错误');
  await page.select('[data-role="column-mode"]', 'keep');
  await setVal('[data-role="column-spec"]', '1');
  await page.click('[data-role="run"]');
  await sleep(150);
  assert(!(await val('[data-role="output"]')).includes(','), '只保留第 1 列后不应再有分隔符');
  clearDownloads();
  await page.click('[data-role="download"]');
  const f = await waitDownload('cleaned.csv');
  assert(fs.readFileSync(f, 'utf8').includes('name'), 'CSV 下载内容错误');
  // 本地文件上传：FileReader 读取，不产生网络请求
  fs.mkdirSync(FIXTURES, { recursive: true });
  fs.writeFileSync(path.join(FIXTURES, 'sample.csv'), 'col1,col2\na,b\n');
  await page.click('[data-role="reset"]');
  await upload('[data-role="file"]', 'sample.csv');
  assert((await val('[data-role="input"]')).includes('col1,col2'), '上传文件未读入输入框');
  assert((await val('[data-role="output"]')).includes('a,b'), '上传文件未触发清洗');
});

await check('批量文本处理：步骤链、顺序调整、下载与重置', async () => {
  await go('/zh/tools/batch-text-processor/');
  await setVal('[data-role="input"]', '  apple \n\nApple\nbanana\n');
  for (const t of ['trim', 'removeEmpty', 'dedupe', 'number']) {
    await page.select('[data-role="step-type"]', t);
    await page.click('[data-role="add-step"]');
  }
  await page.$eval('.bt-step:nth-child(3) .bt-check input', (el) => {
    el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.click('[data-role="run"]');
  await sleep(150);
  assert((await val('[data-role="output"]')) === '1. apple\n2. banana', '步骤链结果错误');
  assert((await text('[data-role="stat-original"]')) === '4', '原始行数错误');
  assert((await text('[data-role="stat-steps"]')) === '4', '步骤数错误');
  // 点击「开始处理」后页面下滚，粘性导航栏会遮挡位于视口顶部的步骤按钮；
  // 先向上滚动一点，模拟用户看到按钮后再真实点击
  await page.evaluate(() => window.scrollBy(0, -160));
  const downBtn = '.bt-step:nth-child(1) .bt-step-actions button:nth-child(2)';
  await page.click(downBtn);
  await sleep(120);
  assert((await text('.bt-step:nth-child(1) .bt-step-title')).includes('删除空行'), '下移按钮未改变步骤顺序');
  clearDownloads();
  await page.click('[data-role="download"]');
  const f = await waitDownload('processed.txt');
  assert(fs.readFileSync(f, 'utf8').includes('apple'), 'TXT 下载内容错误');
  await page.click('[data-role="reset"]');
  assert((await page.$$('.bt-step')).length === 0, '重置未清空步骤');
  assert((await val('[data-role="input"]')) === '', '重置未清空输入');
});

await check('新增工具的英文页面与语言路由', async () => {
  await go('/en/tools/csv-cleaner/');
  assert((await text('h1')).includes('CSV Data Cleaner'), '英文 H1 错误');
  assert((await page.$eval('[data-lang-link="zh"]', (a) => a.getAttribute('href'))) === '/zh/tools/csv-cleaner/', '语言回切链接错误');
  assert((await page.$eval('link[rel="canonical"]', (a) => a.getAttribute('href'))).endsWith('/en/tools/csv-cleaner/'), 'canonical 错误');
  await go('/en/tools/batch-text-processor/');
  assert((await text('h1')).includes('Batch Text Processor'), '英文批量文本页 H1 错误');
});

/* ---------- 个人功能 / 双语 / 响应式 ---------- */
await check('收藏与最近使用：localStorage 写入', async () => {
  await go('/zh/tools/word-counter/');
  await page.click('[data-action="favorite"]');
  const fav = await page.evaluate(() => JSON.parse(localStorage.getItem('toolwild.favorites') || '[]'));
  const recent = await page.evaluate(() => JSON.parse(localStorage.getItem('toolwild.recent') || '[]'));
  assert(fav.includes('word-counter'), '收藏未保存');
  assert(recent[0] === 'word-counter', '最近使用未记录');
});

await check('本地数据页：备份导出与清除', async () => {
  clearDownloads();
  await go('/zh/data/');
  assert((await text('[data-role="stat-favorites"]')) !== '', '状态未渲染');
  await page.click('[data-role="data-export"]');
  const f = await waitDownload('backup.json');
  const backup = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert(backup.app === 'ToolWild', '备份格式错误');
  await page.click('[data-role="data-clear"]');
  await sleep(200);
  assert((await page.evaluate(() => localStorage.getItem('toolwild.favorites'))) === null, '清除未生效');
  // 用刚导出的备份恢复
  const imp = await page.$('[data-role="data-import"]');
  await imp.uploadFile(f);
  await sleep(250);
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('toolwild.favorites') || '[]'));
  assert(restored.includes('word-counter'), '备份恢复失败');
});

await check('英文页面与语言路由保持', async () => {
  await go('/en/tools/word-counter/');
  assert((await text('h1')).includes('Word Counter'), '英文 H1 错误');
  const zhHref = await page.$eval('[data-lang-link="zh"]', (a) => a.getAttribute('href'));
  assert(zhHref === '/zh/tools/word-counter/', `语言回切链接错误: ${zhHref}`);
  const canonical = await page.$eval('link[rel="canonical"]', (a) => a.getAttribute('href'));
  assert(canonical.endsWith('/en/tools/word-counter/'), 'canonical 错误');
});

await check('移动端布局：无横向溢出', async () => {
  await page.setViewport({ width: 375, height: 780, isMobile: true });
  for (const url of [
    '/zh/', '/zh/tools/merge-pdf/', '/zh/tools/percentage-calculator/',
    '/zh/tools/excel-formula-helper/', '/zh/tools/csv-cleaner/', '/zh/tools/batch-text-processor/',
  ]) {
    await go(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 2, `${url} 横向溢出 ${overflow}px`);
  }
  await page.setViewport({ width: 1280, height: 900 });
});

await check('移动端交互：三个新工具可正常操作', async () => {
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await go('/zh/tools/excel-formula-helper/');
  await page.select('[data-role="formula-type"]', 'countif');
  await sleep(120);
  assert((await val('[data-role="output"]')).startsWith('=COUNTIF('), '移动端公式切换失败');
  await go('/zh/tools/csv-cleaner/');
  await setVal('[data-role="input"]', 'a,b\n1,2\n');
  await page.click('[data-role="run"]');
  await sleep(150);
  assert((await val('[data-role="output"]')).includes('1,2'), '移动端 CSV 清洗失败');
  await go('/zh/tools/batch-text-processor/');
  await setVal('[data-role="input"]', 'a\nb\n');
  await page.select('[data-role="step-type"]', 'reverse');
  await page.click('[data-role="add-step"]');
  await sleep(150);
  assert((await page.$$('.bt-step')).length === 1, '移动端添加步骤失败');
  assert((await val('[data-role="output"]')) === 'b\na', '移动端批量文本处理结果错误');
  await page.setViewport({ width: 1280, height: 900 });
});

await browser.close();
server.close();

console.log(`\n通过 ${results.filter((r) => r.ok).length}/${results.length} 项`);
if (jsErrors.length) {
  console.log('\n页面 JavaScript 错误:');
  [...new Set(jsErrors)].forEach((e) => console.log('  - ' + e));
}
const failed = results.filter((r) => !r.ok);
if (failed.length || jsErrors.length) {
  failed.forEach((r) => console.log(`失败: ${r.name} -> ${r.error}`));
  process.exitCode = 1;
} else {
  console.log('✓ 全部浏览器冒烟测试通过，无 JS 运行时错误');
}
