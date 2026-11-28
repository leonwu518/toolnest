import { role, on, msg, formatBytes, showError, clearError, setStatus, downloadBlob, loadImage , errorFromException} from '../utils.js';
import { trackToolUse } from '../analytics.js';
import { targetSize, extForFormat } from '../logic/files.js';
import { bindFileDrop, renderToBlob, showPreview, showSizes, outputName } from '../image-utils.js';

export default function init() {
  const state = { file: null, blob: null, fmt: 'png', ow: 0, oh: 0 };

  bindFileDrop({ onFile: async (file) => {
    try {
      const img = await loadImage(file);
      state.file = file; state.blob = null;
      state.ow = img.naturalWidth; state.oh = img.naturalHeight;
      state.fmt = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'png';
      role('width').value = String(state.ow);
      role('height').value = String(state.oh);
      role('file-info').textContent = `${file.name} · ${state.ow} × ${state.oh} · ${formatBytes(file.size)}`;
      role('run').disabled = false;
      role('download').disabled = true;
      clearError();
    } catch { showError('FILE_CORRUPTED'); }
  } });

  const syncFromWidth = () => {
    role('preset').value = '';
    if (role('lock').checked && state.ow) {
      const w = Number(role('width').value);
      if (w > 0) role('height').value = String(Math.max(1, Math.round(w * state.oh / state.ow)));
    }
  };
  const syncFromHeight = () => {
    role('preset').value = '';
    if (role('lock').checked && state.oh) {
      const h = Number(role('height').value);
      if (h > 0) role('width').value = String(Math.max(1, Math.round(h * state.ow / state.oh)));
    }
  };
  on(role('width'), 'input', syncFromWidth);
  on(role('height'), 'input', syncFromHeight);
  on(role('preset'), 'change', (e) => {
    const m = /^(\d+)x(\d+)$/.exec(e.target.value);
    if (!m) return;
    role('width').value = m[1];
    role('height').value = m[2];
  });

  on(role('run'), 'click', async () => {
    if (!state.file) { showError(msg('pleaseSelect')); return; }
    const size = targetSize(state.ow, state.oh, role('width').value, role('height').value, role('lock').checked);
    if (!size) { showError(msg('invalidSize')); return; }
    const run = role('run');
    run.disabled = true;
    setStatus(msg('processing'));
    try {
      const r = await renderToBlob(state.file, { width: size.width, height: size.height, fmt: state.fmt, quality: 92 });
      state.blob = r.blob;
      showSizes({ original: state.file.size, output: r.blob.size, dimension: `${r.width} × ${r.height}` });
      showPreview(role('preview'), r.blob);
      role('download').disabled = false;
      clearError(); setStatus('');
      trackToolUse('resize');
    } catch (err) { console.warn(err); showError(errorFromException(err)); }
    finally { run.disabled = false; }
  });

  on(role('download'), 'click', () => {
    if (!state.blob || !state.file) return;
    downloadBlob(state.blob, outputName(state.file, extForFormat(state.fmt)));
  });

  on(role('clear'), 'click', () => {
    state.file = null; state.blob = null; state.ow = 0; state.oh = 0;
    role('width').value = ''; role('height').value = '';
    role('file-info').textContent = '';
    role('run').disabled = true; role('download').disabled = true;
    role('preview').innerHTML = `<span class="preview-placeholder">${msg('previewLabel')}</span>`;
    ['original-size', 'output-size', 'dimension'].forEach((k) => { const el = role(k); if (el) el.textContent = '—'; });
    setStatus(''); clearError();
  });
}
