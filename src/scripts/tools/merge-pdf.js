import { role, on, msg, fmt, showError, clearError, setStatus, readAsArrayBuffer, downloadBlob, toast, MAX_PDF_BYTES } from '../utils.js';
import { trackToolUse } from '../analytics.js';
import { bindFileInput, renderFileList, bindFileListActions, fileSize } from '../file-utils.js';

export default function init() {
  let items = [];

  function render() {
    renderFileList(role('file-list'), items.map((it) => ({
      name: it.name,
      meta: `${it.pages} ${msg('pages')} · ${fileSize(it.bytes.byteLength)}`,
    })), { reorder: true });
    const total = items.reduce((s, it) => s + it.pages, 0);
    const totalEl = role('total-pages');
    if (totalEl) totalEl.textContent = items.length ? fmt('totalPages', { n: total }) : '';
    role('run').disabled = items.length < 2;
  }

  bindFileInput({
    extensions: ['.pdf'], maxBytes: MAX_PDF_BYTES, multiple: true, errorKey: 'typeError',
    onFiles: async (files) => {
      const { PDFDocument } = await import('pdf-lib');
      for (const file of files) {
        try {
          const bytes = await readAsArrayBuffer(file);
          const doc = await PDFDocument.load(bytes);
          items.push({ name: file.name, bytes, pages: doc.getPageCount() });
        } catch (err) { console.error(err); showError(msg('readError')); }
      }
      render();
    },
  });

  bindFileListActions(role('file-list'), {
    onRemove: (i) => { items.splice(i, 1); },
    onReorder: (from, to) => {
      if (to >= 0 && to < items.length) { const [moved] = items.splice(from, 1); items.splice(to, 0, moved); }
    },
    onRender: render,
  });

  on(role('run'), 'click', async () => {
    if (items.length < 2) { showError(msg('minFiles')); return; }
    const run = role('run');
    run.disabled = true;
    setStatus(msg('processing'));
    try {
      const { PDFDocument } = await import('pdf-lib');
      const merged = await PDFDocument.create();
      for (const it of items) {
        const src = await PDFDocument.load(it.bytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'toolnest-merged.pdf');
      clearError();
      setStatus(msg('success'));
      toast(msg('success'), 'success');
      trackToolUse('merge');
    } catch (err) { console.error(err); showError(msg('readError')); }
    finally { run.disabled = false; render(); }
  });

  on(role('clear'), 'click', () => { items = []; render(); setStatus(''); clearError(); });
  render();
}
