import { role, on, msg, showError, clearError, setStatus, readAsArrayBuffer, downloadBlob, loadImage, canvasToBlob, toast } from '../utils.js';
import { trackToolUse } from '../analytics.js';
import { bindFileInput, renderFileList, bindFileListActions, fileSize } from '../file-utils.js';

export default function init() {
  let files = [];

  const render = () => {
    renderFileList(role('file-list'), files.map((f) => ({ name: f.name, meta: fileSize(f.size) })));
    role('run').disabled = files.length === 0;
  };

  bindFileInput({
    extensions: ['.jpg', '.jpeg', '.png', '.webp'], maxBytes: 20 * 1024 * 1024, multiple: true, errorKey: 'typeError',
    onFiles: async (list) => { files.push(...list); render(); clearError(); },
  });
  bindFileListActions(role('file-list'), { onRemove: (i) => { files.splice(i, 1); }, onRender: render });

  async function embedBytes(file) {
    const isJpg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
    const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
    if (isJpg || isPng) {
      return { type: isJpg ? 'jpg' : 'png', bytes: new Uint8Array(await readAsArrayBuffer(file)) };
    }
    // WEBP 不被 pdf-lib 直接支持，先用 Canvas 转成 PNG（全程本地）
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const blob = await canvasToBlob(canvas, 'image/png');
    return { type: 'png', bytes: new Uint8Array(await blob.arrayBuffer()) };
  }

  on(role('run'), 'click', async () => {
    if (!files.length) { showError(msg('emptyHint')); return; }
    const run = role('run');
    run.disabled = true;
    setStatus(msg('processing'));
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const size = role('page-size').value;
      const landscape = role('orientation').value === 'landscape';
      const margin = Math.min(100, Math.max(0, Number(role('margin').value) || 0));

      for (const file of files) {
        const img = await loadImage(file);
        const { type, bytes } = await embedBytes(file);
        const embedded = type === 'jpg' ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);
        let pageW, pageH;
        if (size === 'fit') {
          pageW = img.naturalWidth + margin * 2;
          pageH = img.naturalHeight + margin * 2;
        } else {
          const base = size === 'letter' ? [612, 792] : [595.28, 841.89];
          [pageW, pageH] = landscape ? [base[1], base[0]] : base;
        }
        const availW = Math.max(1, pageW - margin * 2);
        const availH = Math.max(1, pageH - margin * 2);
        const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
        const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
        const page = pdf.addPage([pageW, pageH]);
        page.drawImage(embedded, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
      }
      downloadBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), 'toolnest-images.pdf');
      clearError(); setStatus(msg('success')); toast(msg('success'), 'success');
      trackToolUse('images-to-pdf');
    } catch (err) { console.error(err); showError(msg('readError')); }
    finally { run.disabled = false; render(); }
  });

  on(role('clear'), 'click', () => { files = []; render(); setStatus(''); clearError(); });
  render();
}
