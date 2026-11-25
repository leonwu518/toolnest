import { role, on, msg, fmt, showError, clearError, setStatus, readAsArrayBuffer, downloadBlob, toast, MAX_PDF_BYTES } from '../utils.js';
import { bindFileInput } from '../file-utils.js';
import { parsePageRanges } from '../logic/files.js';

export default function init() {
  const state = { file: null, bytes: null, pages: 0 };

  bindFileInput({
    extensions: ['.pdf'], maxBytes: MAX_PDF_BYTES, multiple: false, errorKey: 'typeError',
    onFiles: async (files) => {
      const file = files[0];
      try {
        const { PDFDocument } = await import('pdf-lib');
        const bytes = await readAsArrayBuffer(file);
        const doc = await PDFDocument.load(bytes);
        state.file = file; state.bytes = bytes; state.pages = doc.getPageCount();
        role('file-info').textContent = `${file.name} · ${fmt('pageCount', { n: state.pages })}`;
        role('run').disabled = false;
        clearError();
      } catch (err) { console.error(err); showError(msg('readError')); }
    },
  });

  document.querySelectorAll('[data-role="mode"]').forEach((radio) => on(radio, 'change', () => {
    const each = document.querySelector('[data-role="mode"]:checked')?.value === 'each';
    const field = role('range-field');
    if (field) field.hidden = each;
  }));

  on(role('run'), 'click', async () => {
    if (!state.bytes) { showError(msg('emptyHint')); return; }
    const mode = document.querySelector('[data-role="mode"]:checked')?.value || 'range';
    const run = role('run');
    run.disabled = true;
    setStatus(msg('processing'));
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(state.bytes);
      if (mode === 'range') {
        const parsed = parsePageRanges(role('range').value, state.pages);
        if (!parsed.valid || !parsed.pages.length) { showError(msg('invalidRange')); return; }
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, parsed.pages.map((p) => p - 1));
        pages.forEach((p) => out.addPage(p));
        downloadBlob(new Blob([await out.save()], { type: 'application/pdf' }), 'toolnest-split.pdf');
      } else {
        const mod = await import('jszip');
        const JSZip = mod.default || mod;
        const zip = new JSZip();
        for (let i = 0; i < state.pages; i++) {
          const out = await PDFDocument.create();
          const [page] = await out.copyPages(src, [i]);
          out.addPage(page);
          zip.file(`page-${String(i + 1).padStart(3, '0')}.pdf`, await out.save());
        }
        downloadBlob(await zip.generateAsync({ type: 'blob' }), 'toolnest-split-pages.zip');
      }
      clearError();
      setStatus(msg('success'));
      toast(msg('success'), 'success');
    } catch (err) { console.error(err); showError(msg('readError')); }
    finally { run.disabled = false; }
  });

  on(role('clear'), 'click', () => {
    state.file = null; state.bytes = null; state.pages = 0;
    role('file-info').textContent = '';
    role('range').value = '';
    role('run').disabled = true;
    setStatus(''); clearError();
  });
}
