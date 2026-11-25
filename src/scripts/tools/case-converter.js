import { role, $$, on, msg, bindCommonActions, downloadText, showError, clearError } from '../utils.js';
import { convertCase } from '../logic/text.js';

export default function init() {
  const input = role('input'), output = role('output'), dl = role('download');
  const buttons = $$('[data-case]');

  buttons.forEach((btn) => on(btn, 'click', () => {
    if (!input.value.trim()) { showError(msg('pleaseInput')); return; }
    clearError();
    output.value = convertCase(input.value, btn.dataset.case);
    dl.disabled = false;
    buttons.forEach((b) => b.classList.toggle('btn-primary', b === btn));
    buttons.forEach((b) => b.classList.toggle('btn-outline', b !== btn));
  }));

  on(input, 'input', () => { output.value = ''; dl.disabled = true; clearError(); });
  bindCommonActions({
    getCopyText: () => output.value,
    getDownload: () => downloadText(output.value, 'converted.txt'),
    onClear: () => { dl.disabled = true; buttons.forEach((b) => { b.classList.add('btn-outline'); b.classList.remove('btn-primary'); }); },
  });
}
