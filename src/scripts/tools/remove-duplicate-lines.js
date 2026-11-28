import { role, $$, on, msg, fmt, bindCommonActions, downloadText, showError, clearError, setStatus } from '../utils.js';
import { dedupeLines } from '../logic/text.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const input = role('input'), output = role('output'), dl = role('download');

  function options() {
    return Object.fromEntries($$('[data-opt]').map((el) => [el.dataset.opt, el.checked]));
  }
  function process() {
    clearError();
    if (!input.value.trim()) { showError(msg('pleaseInput')); return; }
    const r = dedupeLines(input.value, options());
    output.value = r.lines.join('\n');
    dl.disabled = false;
    trackToolUse('dedupe');
    setStatus(`${fmt('removedCount', { n: r.removed })} · ${fmt('originalCount', { n: r.original })} · ${fmt('uniqueCount', { n: r.lines.length })}`);
  }

  on(role('run'), 'click', process);
  $$('[data-opt]').forEach((el) => on(el, 'change', () => { if (input.value.trim()) process(); }));
  bindCommonActions({
    getCopyText: () => output.value,
    getDownload: () => downloadText(output.value, 'deduped.txt'),
    onClear: () => { dl.disabled = true; setStatus(''); },
  });
}
