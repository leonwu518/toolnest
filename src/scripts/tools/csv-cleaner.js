import {
  role, $$, on, msg, showError, clearError, setStatus, bindCommonActions,
  downloadText, validateFile, readAsText, MAX_FILE_BYTES, debounce,
} from '../utils.js';
import { parseCSV, stringifyCSV, cleanCSV, DELIMITER_MAP } from '../logic/csv.js';

export default function init() {
  const input = role('input'), output = role('output'), dl = role('download'), preview = role('preview');
  const delimSel = role('delimiter'), outDelimSel = role('output-delimiter');
  const colMode = role('column-mode'), colSpec = role('column-spec');
  const find = role('replace-find'), replaceWith = role('replace-with'), emptyValue = role('empty-value');
  const filterMode = role('filter-mode'), filterText = role('filter-text');
  const sortColumn = role('sort-column'), sortOrder = role('sort-order');

  const DEFAULTS = {
    delimiter: 'auto', 'output-delimiter': 'comma', 'column-mode': 'all',
    'filter-mode': 'none', 'sort-order': 'asc',
  };
  const CHECK_DEFAULTS = { trim: true, removeEmptyRows: true, removeDuplicates: false, ignoreCase: false, keepHeader: true, useRegex: false, bom: false };

  function options() {
    return Object.fromEntries($$('[data-opt]').map((el) => [el.dataset.opt, el.checked]));
  }

  function clearOutput() {
    dl.disabled = true;
    for (const key of ['stat-original', 'stat-output', 'stat-removed']) role(key).textContent = '—';
    renderPreview([]);
  }

  function renderPreview(rows) {
    preview.textContent = '';
    if (!rows.length) {
      const p = document.createElement('div');
      p.className = 'csv-preview-empty';
      p.textContent = msg('noResult');
      preview.appendChild(p);
      return;
    }
    const table = document.createElement('table'); table.className = 'csv-table';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    rows[0].forEach((_, i) => {
      const th = document.createElement('th');
      th.textContent = String(i + 1);
      hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.slice(0, 8).forEach((row) => {
      const tr = document.createElement('tr');
      row.forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = String(cell);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    preview.appendChild(table);
  }

  function process() {
    clearError();
    if (!input.value.trim()) {
      output.value = ''; clearOutput(); setStatus('');
      showError(msg('pleaseInput')); return;
    }
    const o = options();
    const parsed = parseCSV(input.value, delimSel.value);
    if (parsed.error) {
      output.value = ''; clearOutput();
      showError(msg(parsed.error)); return;
    }
    const cleaned = cleanCSV(parsed.rows, {
      trim: o.trim, removeEmptyRows: o.removeEmptyRows, removeDuplicates: o.removeDuplicates,
      ignoreCase: o.ignoreCase, keepHeader: o.keepHeader,
      columnMode: colMode.value, columnSpec: colSpec.value,
      replaceFind: find.value, replaceWith: replaceWith.value, useRegex: o.useRegex,
      normalizeEmpty: emptyValue.value,
      filterMode: filterMode.value, filterText: filterText.value,
      sortColumn: sortColumn.value, sortOrder: sortOrder.value,
    });
    if (cleaned.error) {
      output.value = ''; clearOutput();
      showError(msg(cleaned.error)); return;
    }
    const outDelim = DELIMITER_MAP[outDelimSel.value] || ',';
    output.value = stringifyCSV(cleaned.rows, outDelim, { bom: o.bom });
    const s = cleaned.stats;
    role('stat-original').textContent = String(s.originalRows);
    role('stat-output').textContent = String(s.outputRows);
    role('stat-removed').textContent = String(s.originalRows - s.outputRows);
    renderPreview(cleaned.rows);
    setStatus(`${msg('statOutput')} ${s.outputRows} · ${msg('statRemoved')} ${s.originalRows - s.outputRows}`);
    dl.disabled = false;
  }

  const auto = debounce(() => { if (input.value.trim()) process(); }, 260);
  on(input, 'input', auto);
  $$('[data-opt]').forEach((el) => on(el, 'change', () => { if (input.value.trim()) process(); }));
  [delimSel, outDelimSel, colMode, filterMode, sortOrder].forEach((el) => on(el, 'change', () => { if (input.value.trim()) process(); }));
  [colSpec, find, replaceWith, emptyValue, filterText, sortColumn].forEach((el) => on(el, 'input', auto));
  on(role('run'), 'click', process);

  on(role('file'), 'change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, { extensions: ['.csv', '.txt'], maxBytes: MAX_FILE_BYTES });
    if (err) {
      const keyMap = { invalidFile: 'typeError', sizeError: 'sizeError', pleaseSelect: 'pleaseSelect' };
      showError(msg(keyMap[err] || err)); e.target.value = ''; return;
    }
    try {
      input.value = await readAsText(file);
      process();
    } catch { showError(msg('readError')); }
    e.target.value = '';
  });

  function resetAll() {
    input.value = ''; output.value = '';
    Object.entries(DEFAULTS).forEach(([name, value]) => { const el = role(name); if (el) el.value = value; });
    [colSpec, find, replaceWith, emptyValue, filterText, sortColumn].forEach((el) => { el.value = ''; });
    $$('[data-opt]').forEach((el) => { el.checked = !!CHECK_DEFAULTS[el.dataset.opt]; });
    const file = role('file'); if (file) file.value = '';
    clearError(); setStatus(''); clearOutput();
  }

  on(role('reset'), 'click', resetAll);
  bindCommonActions({
    getCopyText: () => output.value,
    getDownload: () => downloadText(output.value, 'cleaned.csv', 'text/csv;charset=utf-8'),
    onClear: () => { clearOutput(); setStatus(''); clearError(); },
  });
  renderPreview([]);
}
