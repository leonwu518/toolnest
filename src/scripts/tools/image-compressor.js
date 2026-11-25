import { role, on, msg, formatBytes, showError, clearError, setStatus, downloadBlob } from '../utils.js';
import { bindFileDrop, renderToBlob, showPreview, showSizes, outputName, qualityLabel } from '../image-utils.js';

export default function init() {
  const state = { file: null, blob: null, fmt: 'jpg' };

  bindFileDrop({ onFile: (file) => {
    state.file = file; state.blob = null;
    role('file-info').textContent = `${file.name} · ${formatBytes(file.size)}`;
    role('run').disabled = false;
    role('download').disabled = true;
    clearError();
  } });

  on(role('quality'), 'input', (e) => qualityLabel(e.target));

  on(role('run'), 'click', async () => {
    if (!state.file) { showError(msg('pleaseSelect')); return; }
    const run = role('run');
    run.disabled = true;
    setStatus(msg('processing'));
    try {
      const fmt = role('format').value;
      const quality = Number(role('quality').value);
      const r = await renderToBlob(state.file, { fmt, quality });
      state.blob = r.blob;
      state.fmt = fmt;
      showSizes({ original: state.file.size, output: r.blob.size, dimension: `${r.width} × ${r.height}` });
      showPreview(role('preview'), r.blob);
      role('download').disabled = false;
      clearError();
      setStatus('');
    } catch (err) {
      console.error(err);
      showError(msg('readError'));
    } finally { run.disabled = false; }
  });

  on(role('download'), 'click', () => {
    if (!state.blob || !state.file) return;
    downloadBlob(state.blob, outputName(state.file, state.fmt));
  });

  on(role('clear'), 'click', () => {
    state.file = null; state.blob = null;
    role('file-info').textContent = '';
    role('run').disabled = true;
    role('download').disabled = true;
    role('preview').innerHTML = `<span class="preview-placeholder">${msg('previewLabel')}</span>`;
    ['original-size', 'output-size', 'saved', 'dimension'].forEach((k) => { const el = role(k); if (el) el.textContent = '—'; });
    setStatus(''); clearError();
  });
}
