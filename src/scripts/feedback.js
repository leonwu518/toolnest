/* 统一反馈层：inline / banner / toast / overlay 四种形态 + 工具四态状态机
 * 仅操作 DOM，不依赖任何框架，不发起网络请求。 */
const ERROR_CODES = [
  'FILE_CORRUPTED', 'FILE_ENCRYPTED', 'FILE_TOO_LARGE', 'FILE_TYPE_INVALID',
  'FILE_COUNT_ZERO', 'API_UNSUPPORTED', 'MEMORY_LIMIT', 'RESULT_EMPTY',
  'RESULT_LARGER', 'INPUT_EMPTY', 'INPUT_TOO_LARGE', 'PROCESS_FAILED',
];

const ui = (() => {
  try { return JSON.parse(document.documentElement.dataset.ui || '{}'); } catch { return {}; }
})();
const text = (key, fallback) => {
  const v = ui[key];
  if (typeof v === 'string' && v.length) return v;
  return fallback || key;
};

/** 把错误码或文案转成用户可读文字，支持 {n} / {format} 占位符 */
export function errorText(code, values = {}) {
  let out = text(code, ERROR_CODES.includes(code) ? code : code);
  for (const [k, v] of Object.entries(values)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

const hostFor = (roleName, className) => {
  let el = document.querySelector(`[data-role="${roleName}"]`);
  if (!el) {
    el = document.createElement('div');
    el.dataset.role = roleName;
    el.className = className;
    el.hidden = true;
    const body = document.querySelector('[data-role="tool-state"]') || document.querySelector('main') || document.body;
    body.prepend(el);
  }
  return el;
};

/** 统一反馈入口：type = inline | banner | toast | overlay */
export function feedback(message, { type = 'inline', values = {}, actions = [], tone = '' } = {}) {
  const content = errorText(message, values);
  if (type === 'toast') {
    let stack = document.getElementById('toast-host');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-host';
      stack.className = 'toast-host';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `toast ${tone}`.trim();
    el.textContent = content;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 2500);
    return el;
  }
  if (type === 'overlay') {
    const el = hostFor('feedback-overlay', 'feedback-overlay');
    el.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'feedback-overlay-box';
    const p = document.createElement('p');
    p.textContent = content;
    box.appendChild(p);
    actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-outline btn-sm';
      b.textContent = a.label;
      b.onclick = () => { el.hidden = true; a.onClick?.(); };
      box.appendChild(b);
    });
    el.appendChild(box);
    el.hidden = false;
    return el;
  }
  const el = hostFor(type === 'banner' ? 'feedback-banner' : 'error', `feedback-${type} ${tone}`.trim());
  el.textContent = content;
  el.hidden = false;
  return el;
}

export function clearFeedback(type = 'inline') {
  const name = type === 'banner' ? 'feedback-banner' : type === 'overlay' ? 'feedback-overlay' : 'error';
  const el = document.querySelector(`[data-role="${name}"]`);
  if (el) { el.hidden = true; el.textContent = ''; }
}

/** 四态状态机：idle → processing → success | error */
let overlayTimer = null;
let disableTimer = null;
export function setToolState(state, except = null) {
  const body = document.querySelector('[data-role="tool-state"]');
  if (!body) return;
  body.dataset.state = state;
  body.setAttribute('aria-busy', String(state === 'processing'));
  clearTimeout(disableTimer);
  const apply = (disabled) => {
    body.querySelectorAll('input, select, textarea, button').forEach((el) => {
      if (el.closest('[data-role="feedback-overlay"]') || el === except) return;
      /* 下载/复制按钮由工具自身控制可点状态，状态机不触碰 */
      if (['download', 'copy'].includes(el.dataset.role || '')) return;
      if (disabled) {
        if (el.dataset.wasDisabled === undefined) el.dataset.wasDisabled = String(el.disabled);
        el.disabled = true;
      } else if (el.dataset.wasDisabled !== undefined) {
        /* 下载/复制按钮的可点状态由工具自己管理，状态机不覆盖 */
        const toolManaged = ['download', 'copy'].includes(el.dataset.role || '');
        if (!toolManaged) el.disabled = el.dataset.wasDisabled === 'true';
        delete el.dataset.wasDisabled;
      }
    });
  };
  if (state === 'processing') {
    /* 同步工具会在下一帧完成，短暂延迟后再禁用控件，避免影响连续操作 */
    disableTimer = setTimeout(() => apply(true), 150);
  } else {
    apply(false);
  }
  if (state === 'processing') {
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => feedback(text('processing', 'Processing…'), { type: 'overlay' }), 900);
  } else {
    clearTimeout(overlayTimer);
    const overlay = document.querySelector('[data-role="feedback-overlay"]');
    if (overlay) overlay.hidden = true;
  }
}

/** 全局兜底：未捕获错误不白屏，给出可理解的提示 */
export function installErrorBoundary() {
  const report = () => {
    feedback('PROCESS_FAILED', {
      type: 'banner',
      actions: [{ label: text('retry', 'Retry'), onClick: () => location.reload() }],
    });
  };
  window.addEventListener('error', (e) => {
    if (e.target && e.target !== window) return;
    console.warn('[ToolWild] captured error:', e.message || 'unknown');
    report();
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.warn('[ToolWild] captured rejection:', e.reason);
    report();
    e.preventDefault();
  });
}

/** 调试面板：?debug=errors 时列出全部错误码，逐个预览 */
export function installDebugPanel() {
  const params = new URL(location.href).searchParams;
  if (params.get('debug') !== 'errors') return;
  const panel = document.createElement('div');
  panel.className = 'feedback-debug';
  panel.innerHTML = `<strong>${text('debugTitle', 'Error states')}</strong><p>${text('debugHint', 'Debug only')}</p>`;
  ERROR_CODES.forEach((code) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = code;
    b.onclick = () => feedback(code, { type: 'inline', values: { n: '100 MB', format: 'JPG / PNG / WEBP' } });
    panel.appendChild(b);
  });
  const more = document.createElement('div');
  more.className = 'feedback-debug-row';
  [['banner', 'RESULT_LARGER'], ['toast', 'FILE_COUNT_ZERO'], ['overlay', 'API_UNSUPPORTED']].forEach(([type, code]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = `${type}: ${code}`;
    b.onclick = () => feedback(code, { type, tone: type === 'toast' ? 'error' : '' });
    more.appendChild(b);
  });
  panel.appendChild(more);
  document.body.appendChild(panel);
}
