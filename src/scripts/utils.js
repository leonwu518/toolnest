/* 工具脚本共享基础库：DOM、文案、复制下载、文件校验、图片与提示 */
import { trackCopy, trackDownload } from './analytics.js';
import { feedback, errorText } from './feedback.js';

// 页面在 <html data-ui="..."> 中注入当前语言的全部界面文案
export const ui = (() => {
  try { return JSON.parse(document.documentElement.dataset.ui || '{}'); }
  catch { return {}; }
})();

export const msg = (key, fallback) => ui[key] ?? fallback ?? key;

/** 支持 "共删除 {n} 行" 形式的占位替换 */
export function fmt(key, values = {}, fallback) {
  let text = msg(key, fallback);
  for (const [k, v] of Object.entries(values)) {
    text = text.split(`{${k}}`).join(String(v));
  }
  return text;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const role = (name, root = document) => root.querySelector(`[data-role="${name}"]`);
export const roles = (name, root = document) => Array.from(root.querySelectorAll(`[data-role="${name}"]`));
export const on = (el, type, fn, opts) => el && el.addEventListener(type, fn, opts);

export function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- Toast ---------- */
export function toast(text, type = '') {
  feedback(text, { type: 'toast', tone: type });
}

/* ---------- 复制 / 下载 ---------- */
export async function copyText(text) {
  if (text === undefined || text === null || text === '') { toast(msg('pleaseInput'), 'error'); return false; }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(String(text));
    } else {
      const ta = document.createElement('textarea');
      ta.value = String(text);
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (!ok) throw new Error('execCommand failed');
    }
    toast(msg('copied'), 'success');
    trackCopy();
    return true;
  } catch {
    toast(msg('copyFailed'), 'error');
    return false;
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  trackDownload();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function downloadText(text, filename, mime = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  trackDownload();
}

/* ---------- 结果 / 提示区 ---------- */
export function showError(text, values = {}) {
  feedback(text || msg('error'), { type: 'inline', values });
}

/** 把异常映射为统一的错误码文案，避免暴露异常栈或技术术语 */
export function errorFromException(err) {
  const s = String(err?.message || err || '').toLowerCase();
  if (/encrypt|password|decrypt/.test(s)) return 'FILE_ENCRYPTED';
  if (/corrupt|damaged|invalid|parse|unsupported|read failed/.test(s)) return 'FILE_CORRUPTED';
  if (/memory|out of|quota|too large/.test(s)) return 'MEMORY_LIMIT';
  return 'PROCESS_FAILED';
}
export function clearError() {
  const el = role('error');
  if (el) { el.hidden = true; el.textContent = ''; }
}
export function setStatus(text) {
  const el = role('status');
  if (el) el.textContent = text || '';
}
export function setResult(text) {
  const el = role('output');
  if (el) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.value = text;
    else el.textContent = text;
  }
}
export function getInput() {
  const el = role('input');
  return el ? el.value : '';
}

/** 绑定通用的复制 / 清空 / 下载按钮，返回清空回调供工具覆盖 */
export function bindCommonActions({ onClear, getCopyText, getDownload } = {}) {
  const copyBtn = role('copy');
  if (copyBtn && getCopyText) on(copyBtn, 'click', () => copyText(getCopyText()));

  const clearBtn = role('clear');
  if (clearBtn) on(clearBtn, 'click', () => {
    const input = role('input');
    if (input) { input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); }
    setResult('');
    clearError();
    setStatus('');
    $$('[data-role="preview"]').forEach((el) => { el.innerHTML = ''; });
    if (onClear) onClear();
  });

  const dlBtn = role('download');
  if (dlBtn && getDownload) on(dlBtn, 'click', () => getDownload());
}

/* ---------- 格式化 ---------- */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let n = bytes / 1024, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 ? 2 : 1)} ${units[i]}`;
}

export function formatNumber(value, maxDigits = 6) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) !== 0 && (Math.abs(value) < 1e-8 || Math.abs(value) >= 1e15)) {
    return value.toExponential(6).replace(/\.?0+e/, 'e');
  }
  const fixed = Number(value.toFixed(maxDigits));
  return String(Object.is(fixed, -0) ? 0 : fixed);
}

export function debounce(fn, ms = 120) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---------- 文件 ---------- */
export function validateFile(file, { extensions = [], mimePrefixes = [], maxBytes = Infinity } = {}) {
  if (!file) return 'pleaseSelect';
  const name = (file.name || '').toLowerCase();
  if (extensions.length && !extensions.some((ext) => name.endsWith(ext))) return 'invalidFile';
  if (mimePrefixes.length && !mimePrefixes.some((p) => (file.type || '').startsWith(p)) && !extensions.length) return 'invalidFile';
  if (file.size > maxBytes) return 'sizeError';
  return null;
}

export const readAsArrayBuffer = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('read failed'));
  r.readAsArrayBuffer(file);
});

export const readAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('read failed'));
  r.readAsDataURL(file);
});

export const readAsText = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('read failed'));
  r.readAsText(file);
});

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

export function canvasToBlob(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('canvas toBlob failed')), type, quality);
  });
}

export function safeFileName(name) {
  return String(name || 'toolwild').replace(/[^\w.\-\u4e00-\u9fa5]+/g, '_').slice(0, 80);
}

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
