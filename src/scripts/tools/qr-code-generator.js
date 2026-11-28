import { role, on, msg, showError, clearError, setStatus, downloadBlob, downloadText, canvasToBlob } from '../utils.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const state = { canvas: null, svg: '' };

  function options() {
    const size = Math.min(2048, Math.max(64, Number(role('size').value) || 320));
    return {
      width: size,
      margin: Math.min(20, Math.max(0, Number(role('margin').value) || 0)),
      errorCorrectionLevel: role('level').value,
      color: { dark: role('fg').value, light: role('bg').value },
    };
  }

  on(role('run'), 'click', async () => {
    const text = role('input').value.trim();
    if (!text) { showError(msg('emptyHint')); return; }
    const run = role('run');
    run.disabled = true;
    setStatus(msg('processing'));
    try {
      const mod = await import('qrcode');
      const QRCode = mod.default || mod;
      const opts = options();
      const svg = await QRCode.toString(text, { type: 'svg', ...opts });
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, text, opts);
      state.canvas = canvas;
      state.svg = svg;
      const host = role('preview');
      host.innerHTML = '';
      host.appendChild(canvas);
      role('download-png').disabled = false;
      role('download-svg').disabled = false;
      clearError();
      setStatus('');
      trackToolUse('generate');
    } catch (err) {
      console.error(err);
      showError(msg('tooLong'));
      setStatus('');
    } finally { run.disabled = false; }
  });

  on(role('download-png'), 'click', async () => {
    if (!state.canvas) return;
    const blob = await canvasToBlob(state.canvas, 'image/png');
    downloadBlob(blob, 'toolwild-qrcode.png');
  });
  on(role('download-svg'), 'click', () => {
    if (!state.svg) return;
    downloadText(state.svg, 'toolwild-qrcode.svg', 'image/svg+xml;charset=utf-8');
  });
  on(role('clear'), 'click', () => {
    role('input').value = '';
    state.canvas = null; state.svg = '';
    role('preview').innerHTML = `<span class="preview-placeholder">${msg('previewLabel')}</span>`;
    role('download-png').disabled = true;
    role('download-svg').disabled = true;
    setStatus(''); clearError();
  });
}
