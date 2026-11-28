/* 按需加载当前工具的逻辑脚本：每个工具一个独立 chunk，页面不会加载无关代码
 * 同时安装统一反馈边界与工具四态状态机。 */
import { msg, showError } from './utils.js';
import { feedback, setToolState, clearFeedback, installErrorBoundary, installDebugPanel } from './feedback.js';

installErrorBoundary();
installDebugPanel();

/* 状态机：点击「开始处理」后进入 processing，检测结果区/错误区后进入 success | error */
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('[data-role="run"]');
  if (!btn) return;
  const body = btn.closest('[data-role="tool-state"]');
  if (!body) return;
  clearFeedback('inline');
  clearFeedback('banner');
  setToolState('processing', btn);
  const output = body.querySelector('[data-role="output"], [data-role="preview"], [data-role="result"]');
  const before = output ? String(output.value ?? output.textContent ?? '') : null;
  const download = body.querySelector('[data-role="download"]');
  const started = Date.now();
  let finished = false;
  const check = () => {
    if (finished) return true;
    const err = body.querySelector('[data-role="error"]:not([hidden])');
    const status = body.querySelector('[data-role="status"]')?.textContent || '';
    const done = download && !download.disabled;
    const changed = output && before !== null && String(output.value ?? output.textContent ?? '') !== before;
    if (err) {
      finished = true; clearInterval(timer); setToolState('error', btn); return true;
    }
    if (done || changed || /完成|done|success/i.test(status)) {
      finished = true; clearInterval(timer); setToolState('success', btn);
      feedback('localDone', { type: 'banner' });
      return true;
    }
    if (Date.now() - started > 20000) {
      finished = true; clearInterval(timer); setToolState('error', btn);
      feedback('PROCESS_FAILED', { type: 'banner' });
      return true;
    }
    return false;
  };
  /* 同步工具在下一帧即可判定完成，避免禁用控件影响连续操作 */
  setTimeout(check, 0);
  const timer = setInterval(check, 250);
}, true);

/* ---------- 工具串联：sessionStorage 仅传文本/配置，大文件提示重选 ---------- */
const CHAINS = {
  'image-compressor': ['image-resizer', 'image-converter', 'image-to-pdf'],
  'excel-to-csv': ['csv-cleaner', 'batch-text-processor'],
  'image-to-pdf': ['merge-pdf', 'split-pdf'],
};
const HANDOFF_KEY = 'toolwild.handoff';
const handoffLang = document.documentElement.dataset.lang || 'zh';

function readHandoff() {
  try { return JSON.parse(sessionStorage.getItem(HANDOFF_KEY) || 'null'); } catch { return null; }
}
function storeHandoff(to) {
  const out = document.querySelector('[data-role="output"], [data-role="result"]');
  const text = out ? String(out.value ?? out.textContent ?? '').trim() : '';
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({
      from: document.documentElement.dataset.tool || '', to,
      text: text.slice(0, 200000), needsFile: !text, at: Date.now(),
    }));
  } catch { /* 隐私模式下忽略 */ }
}
function renderNextTools() {
  const host = document.querySelector('[data-role="next-tools"]');
  const row = host?.querySelector('[data-role="next-tools-row"]');
  const slug = document.documentElement.dataset.tool;
  if (!host || !row || !slug || !CHAINS[slug]) return;
  let index = [];
  try { index = JSON.parse(document.getElementById('tool-index')?.textContent || '[]'); } catch { index = []; }
  const bySlug = Object.fromEntries(index.map((t) => [t.s, t]));
  CHAINS[slug].forEach((s) => {
    const a = document.createElement('a');
    a.className = 'chip';
    a.href = `${handoffLang === 'en' ? '/en' : ''}/tools/${s}/`;
    const t = bySlug[s];
    a.textContent = t ? (handoffLang === 'zh' ? t.zh.n : t.en.n) : s;
    a.addEventListener('click', () => storeHandoff(s));
    row.appendChild(a);
  });
  host.hidden = false;
}
function restoreHandoff() {
  const h = readHandoff();
  if (!h || h.to !== document.documentElement.dataset.tool) return;
  try { sessionStorage.removeItem(HANDOFF_KEY); } catch { /* ignore */ }
  if (h.text) {
    const input = document.querySelector('[data-role="input"]');
    if (input) {
      input.value = h.text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      feedback('nextLoaded', { type: 'banner' });
    }
  } else {
    feedback('nextNeedFile', { type: 'banner' });
  }
}

const loaders = import.meta.glob('./tools/*.js');

export function runTool() {
  const slug = document.documentElement.dataset.tool;
  if (!slug) return;
  const loader = loaders[`./tools/${slug}.js`];
  if (!loader) {
    showError(msg('readError'));
    return;
  }
  loader()
    .then((mod) => {
      try {
        if (typeof mod.default === 'function') mod.default();
        renderNextTools();
        restoreHandoff();
      }
      catch (err) { console.warn('[ToolWild] tool init failed', err); showError('PROCESS_FAILED'); }
    })
    .catch((err) => {
      console.warn('[ToolWild] tool load failed', err);
      showError('PROCESS_FAILED');
    });
}

runTool();
