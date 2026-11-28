import { role, on, msg, fmt, showError, clearError, setStatus, readAsArrayBuffer, downloadText , errorFromException} from '../utils.js';
import { trackToolUse } from '../analytics.js';
import { bindFileInput } from '../file-utils.js';
import { toCSV } from '../logic/files.js';

export default function init() {
  let XLSX = null, workbook = null;
  const state = { csv: '', name: 'data' };

  function delimiter() {
    const v = role('delimiter').value;
    return v === '\\t' ? '\t' : v;
  }

  function rows() {
    if (!workbook) return [];
    const sheet = workbook.Sheets[role('sheet').value];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
  }

  function preview() {
    const host = role('preview');
    const data = rows().slice(0, 10);
    host.innerHTML = '';
    if (!data.length) { host.innerHTML = `<div class="preview-placeholder" style="padding:20px;text-align:center">${msg('noResult')}</div>`; return; }
    const table = document.createElement('table');
    table.className = 'data-table';
    data.forEach((row, ri) => {
      const tr = document.createElement('tr');
      row.forEach((cell) => {
        const el = document.createElement(ri === 0 ? 'th' : 'td');
        el.textContent = cell === null || cell === undefined ? '' : String(cell);
        tr.appendChild(el);
      });
      table.appendChild(tr);
    });
    host.appendChild(table);
  }

  bindFileInput({
    extensions: ['.xlsx', '.xls'], maxBytes: 20 * 1024 * 1024, multiple: false, errorKey: 'typeError',
    onFiles: async (files) => {
      try {
        const mod = await import('xlsx');
        XLSX = mod.default || mod;
        const bytes = await readAsArrayBuffer(files[0]);
        workbook = XLSX.read(new Uint8Array(bytes), { type: 'array' });
        const select = role('sheet');
        select.innerHTML = '';
        workbook.SheetNames.forEach((name) => {
          const option = document.createElement('option');
          option.value = name; option.textContent = name;
          select.appendChild(option);
        });
        state.name = files[0].name.replace(/\.[^.]+$/, '') || 'data';
        role('file-info').textContent = `${files[0].name} · ${workbook.SheetNames.length} ${msg('sheetLabel')}`;
        role('run').disabled = false;
        role('download').disabled = true;
        state.csv = '';
        preview();
        clearError();
      } catch (err) { console.warn(err); showError(errorFromException(err)); }
    },
  });

  on(role('sheet'), 'change', () => { preview(); role('download').disabled = true; state.csv = ''; });
  on(role('delimiter'), 'change', () => { role('download').disabled = true; state.csv = ''; });
  on(role('bom'), 'change', () => { role('download').disabled = true; state.csv = ''; });

  on(role('run'), 'click', () => {
    if (!workbook) { showError(msg('emptyHint')); return; }
    const data = rows();
    state.csv = toCSV(data, delimiter());
    role('download').disabled = false;
    const cols = data.reduce((max, row) => Math.max(max, row.length), 0);
    setStatus(`${fmt('rowCount', { n: data.length })} · ${fmt('columnCount', { n: cols })}`);
    clearError();
    trackToolUse('convert');
  });

  on(role('download'), 'click', () => {
    if (!state.csv) return;
    const bom = role('bom').checked ? '\ufeff' : '';
    downloadText(bom + state.csv, `${state.name}.csv`, 'text/csv;charset=utf-8');
  });

  on(role('clear'), 'click', () => {
    workbook = null; state.csv = '';
    role('sheet').innerHTML = '';
    role('file-info').textContent = '';
    role('run').disabled = true; role('download').disabled = true;
    role('preview').innerHTML = `<div class="preview-placeholder" style="padding:24px;text-align:center">${msg('previewLabel')}</div>`;
    setStatus(''); clearError();
  });
}
