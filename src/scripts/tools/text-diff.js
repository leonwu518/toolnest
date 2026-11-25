import { role, $$, on, msg, fmt, showError, clearError, setStatus } from '../utils.js';
import { diffLines } from '../logic/text.js';

export default function init() {
  const a = role('input-a'), b = role('input-b'), host = role('diff-output');

  function render() {
    clearError();
    const ignoreCase = document.querySelector('[data-opt="ignoreCase"]')?.checked || false;
    const ignoreWhitespace = document.querySelector('[data-opt="ignoreWhitespace"]')?.checked || false;
    const rows = diffLines(a.value, b.value, { ignoreCase, ignoreWhitespace });
    const counts = { added: 0, removed: 0, same: 0 };

    const view = document.createElement('div');
    view.className = 'diff-view';
    const legend = document.createElement('div');
    legend.className = 'diff-legend';
    legend.innerHTML = `<span><i style="background:var(--added-bg);border:1px solid var(--added)"></i>${msg('added')}</span>`
      + `<span><i style="background:var(--removed-bg);border:1px solid var(--removed)"></i>${msg('removed')}</span>`
      + `<span><i style="background:var(--bg-subtle);border:1px solid var(--border)"></i>${msg('unchanged')}</span>`;
    view.appendChild(legend);

    rows.forEach((row) => {
      counts[row.type]++;
      const line = document.createElement('div');
      line.className = `diff-line ${row.type === 'same' ? 'same' : row.type}`;
      const ln = document.createElement('span');
      ln.className = 'ln';
      ln.textContent = String(row.aLine ?? row.bLine ?? '');
      const sign = document.createElement('span');
      sign.className = 'sign';
      sign.textContent = row.type === 'added' ? '+' : row.type === 'removed' ? '−' : ' ';
      const txt = document.createElement('span');
      txt.className = 'txt';
      txt.textContent = row.text; // textContent 而非 innerHTML，防止注入
      line.append(ln, sign, txt);
      view.appendChild(line);
    });

    host.replaceChildren(view);
    const identical = rows.every((r) => r.type === 'same');
    setStatus(identical ? msg('identical') : fmt('diffStats', { a: counts.added, r: counts.removed, u: counts.same }));
  }

  on(role('run'), 'click', render);
  $$('[data-opt]').forEach((el) => on(el, 'change', () => { if (a.value || b.value) render(); }));
  on(role('clear'), 'click', () => { a.value = ''; b.value = ''; host.innerHTML = ''; setStatus(''); clearError(); });
}
