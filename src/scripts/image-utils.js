/* 图片工具共用：文件选择、Canvas 重编码、预览与体积对比（全部本地） */
import { role, on, msg, formatBytes, validateFile, loadImage, canvasToBlob, MAX_IMAGE_BYTES, showError, clearError } from './utils.js';
import { mimeForFormat, extForFormat } from './logic/files.js';

export function bindFileDrop({ onFile, extensions = ['.jpg', '.jpeg', '.png', '.webp'], maxBytes = MAX_IMAGE_BYTES, multiple = false }) {
  const input = role('file-input');
  const drop = role('file-drop');
  if (!input || !drop) return;

  const handle = (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    for (const file of list) {
      const err = validateFile(file, { extensions, maxBytes });
      if (err) {
        const keyMap = { invalidFile: 'typeError', sizeError: 'sizeError', pleaseSelect: 'pleaseSelect' };
        showError(msg(keyMap[err] || err));
        return;
      }
    }
    clearError();
    onFile(multiple ? list : list[0]);
  };

  on(input, 'change', () => { handle(input.files); input.value = ''; });
  on(drop, 'dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
  on(drop, 'dragleave', () => drop.classList.remove('dragover'));
  on(drop, 'drop', (e) => {
    e.preventDefault();
    drop.classList.remove('dragover');
    handle(e.dataTransfer?.files);
  });
}

export function qualityLabel(el) {
  const value = role('quality-value');
  if (value) value.textContent = `${el.value}%`;
}

export async function renderToBlob(file, { width, height, fmt = 'png', quality = 90, background } = {}) {
  const img = await loadImage(file);
  const w = Math.max(1, Math.round(width || img.naturalWidth));
  const h = Math.max(1, Math.round(height || img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const bg = background || (fmt === 'jpg' || fmt === 'jpeg' ? '#ffffff' : null);
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const isLossy = fmt === 'jpg' || fmt === 'jpeg' || fmt === 'webp';
  const blob = await canvasToBlob(canvas, mimeForFormat(fmt), isLossy ? Math.min(1, Math.max(0.01, quality / 100)) : undefined);
  return { blob, width: w, height: h, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight };
}

export function showPreview(host, blob) {
  if (!host) return;
  host.innerHTML = '';
  const img = document.createElement('img');
  const url = URL.createObjectURL(blob);
  img.src = url;
  img.alt = 'preview';
  img.onload = () => URL.revokeObjectURL(url);
  host.appendChild(img);
}

export function showSizes({ original, output, dimension, originalLabel, outputLabel, dimensionLabel }) {
  const set = (k, v) => { const el = role(k); if (el) el.textContent = v; };
  if (original !== undefined) set('original-size', formatBytes(original));
  if (output !== undefined) set('output-size', formatBytes(output));
  if (original !== undefined && output !== undefined) {
    const saved = original > 0 ? (1 - output / original) * 100 : 0;
    set('saved', `${saved >= 0 ? '−' : '+'}${Math.abs(saved).toFixed(1)}%`);
  }
  if (dimension !== undefined) set('dimension', dimension);
  void originalLabel; void outputLabel; void dimensionLabel;
}

export function outputName(file, fmt) {
  const base = (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[^\w.\-\u4e00-\u9fa5]+/g, '_').slice(0, 60);
  return `${base}.${extForFormat(fmt)}`;
}
