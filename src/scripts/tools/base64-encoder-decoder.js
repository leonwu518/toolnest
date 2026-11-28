import { role, on, msg, showError, clearError, readAsDataURL, downloadBlob, formatBytes } from '../utils.js';
import { base64Encode, base64Decode } from '../logic/encoding.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const input = role('input'), output = role('output');
  const state = { file: null, blob: null, mime: 'application/octet-stream' };

  function mode() {
    return document.querySelector('[data-role="mode"]:checked')?.value || 'text';
  }
  function syncMode() {
    const isFile = mode() === 'file';
    role('file-field').hidden = !isFile;
    role('text-fields').hidden = isFile;
    clearError();
  }

  function decodeToBlob(text) {
    let b64 = text.trim();
    let mime = 'application/octet-stream';
    const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(b64);
    if (m) { mime = m[1]; b64 = m[2]; }
    const binary = atob(b64.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return { blob: new Blob([bytes], { type: mime }), mime };
  }

  on(role('file'), 'change', () => {
    const file = role('file').files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showError(msg('sizeError')); return; }
    state.file = file;
    role('file-info').textContent = `${file.name} · ${formatBytes(file.size)}`;
    clearError();
  });

  document.querySelectorAll('[data-role="mode"]').forEach((el) => on(el, 'change', syncMode));

  function encode() {
    clearError();
    if (mode() === 'file') {
      if (!state.file) { showError(msg('emptyHint')); return; }
      readAsDataURL(state.file).then((url) => {
        output.value = url;
        role('download').disabled = true;
        role('status').textContent = `${msg('dataUrlLabel')} · ${formatBytes(url.length)}`;
        trackToolUse('encode-file');
      }).catch(() => showError(msg('readError')));
      return;
    }
    if (!input.value) { showError(msg('emptyHint')); return; }
    output.value = base64Encode(input.value);
    role('download').disabled = true;
    role('status').textContent = msg('utf8Label');
    trackToolUse('encode-text');
  }

  function decode() {
    clearError();
    const text = input.value.trim() || output.value.trim();
    if (!text) { showError(msg('emptyHint')); return; }
    try {
      if (mode() === 'file') {
        const { blob, mime } = decodeToBlob(text);
        state.blob = blob; state.mime = mime;
        output.value = text;
        role('download').disabled = false;
        role('status').textContent = `${msg('downloadLabel')} · ${formatBytes(blob.size)}`;
      } else {
        output.value = base64Decode(text);
        role('download').disabled = true;
        role('status').textContent = msg('utf8Label');
      }
      trackToolUse(mode() === 'file' ? 'decode-file' : 'decode-text');
    } catch {
      output.value = '';
      role('download').disabled = true;
      showError(msg('decodeError'));
    }
  }

  on(document.querySelector('[data-action="encode"]'), 'click', encode);
  on(document.querySelector('[data-action="decode"]'), 'click', decode);
  on(role('copy'), 'click', async () => {
    const { copyText } = await import('../utils.js');
    copyText(output.value);
  });
  on(role('download'), 'click', () => {
    if (!state.blob) return;
    const ext = (state.mime.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'bin';
    downloadBlob(state.blob, `toolwild-decoded.${ext}`);
  });
  on(role('clear'), 'click', () => {
    input.value = ''; output.value = '';
    state.file = null; state.blob = null;
    role('file').value = ''; role('file-info').textContent = '';
    role('download').disabled = true;
    role('status').textContent = '';
    clearError();
  });
  syncMode();
}
