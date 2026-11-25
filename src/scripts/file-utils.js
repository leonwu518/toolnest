/* 文件工具共用：本地文件选择、列表渲染与排序/移除交互 */
import { role, on, msg, validateFile, formatBytes, showError, clearError, MAX_PDF_BYTES } from './utils.js';

const ICONS = {
  file: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};

export function bindFileInput({ extensions = [], maxBytes = MAX_PDF_BYTES, multiple = false, errorKey = 'typeError', onFiles }) {
  const input = role('file-input');
  const drop = role('file-drop');
  if (!input || !drop) return;

  const handle = async (list) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    for (const file of files) {
      const err = validateFile(file, { extensions, maxBytes });
      if (err) { showError(msg(err === 'invalidFile' ? errorKey : err)); return; }
    }
    clearError();
    await onFiles(multiple ? files : files.slice(0, 1));
  };

  on(input, 'change', () => { handle(input.files); input.value = ''; });
  on(drop, 'dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
  on(drop, 'dragleave', () => drop.classList.remove('dragover'));
  on(drop, 'drop', (e) => { e.preventDefault(); drop.classList.remove('dragover'); handle(e.dataTransfer?.files); });
  const addMore = role('add-more');
  if (addMore) on(addMore, 'click', () => input.click());
}

export function renderFileList(host, items, { reorder = false } = {}) {
  if (!host) return;
  host.innerHTML = '';
  if (!items.length) {
    host.innerHTML = `<div class="preview-placeholder" style="padding:16px;text-align:center">${msg('noFile')}</div>`;
    return;
  }
  items.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'file-item';
    const icon = document.createElement('span');
    icon.className = 'fi-icon';
    icon.innerHTML = ICONS.file;
    const name = document.createElement('span');
    name.className = 'fi-name';
    name.textContent = item.name;
    name.title = item.name;
    const meta = document.createElement('span');
    meta.className = 'fi-meta';
    meta.textContent = item.meta || '';
    row.append(icon, name, meta);
    if (reorder) {
      for (const dir of ['up', 'down']) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-btn';
        btn.dataset.act = dir;
        btn.dataset.index = String(i);
        btn.title = dir === 'up' ? msg('moveUp') : msg('moveDown');
        btn.innerHTML = ICONS[dir];
        row.appendChild(btn);
      }
    }
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'icon-btn';
    rm.dataset.act = 'remove';
    rm.dataset.index = String(i);
    rm.title = msg('remove');
    rm.innerHTML = ICONS.x;
    row.appendChild(rm);
    host.appendChild(row);
  });
}

export function bindFileListActions(host, { onReorder, onRemove, onRender }) {
  if (!host) return;
  on(host, 'click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const i = Number(btn.dataset.index);
    if (btn.dataset.act === 'remove') onRemove?.(i);
    else if (btn.dataset.act === 'up') onReorder?.(i, i - 1);
    else if (btn.dataset.act === 'down') onReorder?.(i, i + 1);
    onRender?.();
  });
}

export const fileSize = formatBytes;
