#!/usr/bin/env node
/* GA4 埋点验证：用真实浏览器加载预览站，检查 dataLayer 中 config 与自定义事件
 * 前置：PUBLIC_GA4_MEASUREMENT_ID=<你的ID> npm run build 已完成，预览服务运行于 4321
 */
import puppeteer from 'puppeteer-core';
import { execSync } from 'node:child_process';

const findChrome = () => {
  for (const p of ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    try { execSync(`test -x ${p}`); return p; } catch { /* next */ }
  }
  throw new Error('未找到 Chrome');
};

const BASE = 'http://127.0.0.1:4321';
const ID = process.env.PUBLIC_GA4_MEASUREMENT_ID || 'G-TEST123456';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
page.setDefaultTimeout(20000);

const gtagCalls = () => page.evaluate(() => {
  const dl = window.dataLayer || [];
  return dl.map((e) => {
    if (e && typeof e === 'object' && e[0] === 'js') return { t: 'js' };
    if (e && typeof e === 'object' && e[0] === 'config') return { t: 'config', id: e[1] };
    if (e && typeof e === 'object' && e[0] === 'event') return { t: 'event', name: e[1], params: e[2] };
    return { t: 'other' };
  });
});
const events = async (name) => (await gtagCalls()).filter((c) => c.t === 'event' && c.name === name);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  /* 1. 工具页：config 注入 + tool_use + copy_result */
  await page.goto(`${BASE}/zh/tools/unit-converter/`, { waitUntil: 'networkidle0' });
  const config1 = (await gtagCalls()).filter((c) => c.t === 'config');
  check('gtag config 已注入', config1.length === 1 && config1[0].id === ID, JSON.stringify(config1));
  const pv = (await gtagCalls()).filter((c) => c.t === 'js').length;
  check('gtag.js 仅加载一次', pv === 1, `js 调用 ${pv} 次`);

  await page.type('[data-role="value"]', '100');
  await sleep(500);
  const tu = await events('tool_use');
  check('tool_use 事件发送', tu.length >= 1, JSON.stringify(tu[0]?.params || {}));
  check('tool_use 参数完整',
    tu[0] && tu[0].params.tool_name === 'unit-converter'
    && tu[0].params.tool_category === 'calculators'
    && tu[0].params.page_language === 'zh',
    JSON.stringify(tu[0]?.params || {}));

  /* 节流：继续输入不应重复发送 */
  await page.type('[data-role="value"]', '50');
  await sleep(500);
  const tu2 = await events('tool_use');
  check('30 秒内同事件不重复发送', tu2.length === 1, `事件数 ${tu2.length}`);

  await browser.close();
} catch (err) {
  check('验证流程异常', false, String(err));
  await browser.close();
}

const fail = results.filter((r) => !r.ok).length;
console.log(`\n通过 ${results.length - fail}/${results.length} 项`);
process.exit(fail ? 1 : 0);
