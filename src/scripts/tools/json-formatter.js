import { role, $, on, msg, bindCommonActions, downloadText, showError, clearError, setStatus, formatBytes } from '../utils.js';
import { formatJSON } from '../logic/text.js';

export default function init() {
  const input = role('input'), output = role('output'), dl = role('download');
  const success = role('success');

  function run(mode) {
    if (success) success.hidden = true;
    if (!input.value.trim()) { showError(msg('pleaseInput')); return; }
    const result = formatJSON(input.value, {
      indent: role('indent')?.value || '2',
      sortKeys: $('[data-opt="sortKeys"]')?.checked || false,
      minify: mode === 'minify',
    });
    if (!result.ok) {
      output.value = '';
      dl.disabled = true;
      showError(`${msg('invalidMsg')} · ${result.error}`);
      setStatus('');
      return;
    }
    clearError();
    output.value = result.output;
    dl.disabled = false;
    if (mode === 'validate' && success) { success.hidden = false; success.textContent = msg('validMsg'); }
    setStatus(formatBytes(new Blob([result.output]).size));
  }

  [['format', 'format'], ['minify', 'minify'], ['validate', 'validate']].forEach(([action, mode]) => {
    on(document.querySelector(`[data-action="${action}"]`), 'click', () => run(mode));
  });
  on(role('indent'), 'change', () => { if (input.value.trim()) run('format'); });
  on($('[data-opt="sortKeys"]'), 'change', () => { if (input.value.trim()) run('format'); });

  bindCommonActions({
    getCopyText: () => output.value,
    getDownload: () => downloadText(output.value, 'formatted.json', 'application/json;charset=utf-8'),
    onClear: () => { dl.disabled = true; if (success) success.hidden = true; setStatus(''); },
  });
}
