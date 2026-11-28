import { role, $$, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { percentage } from '../logic/calc.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const currentMode = () => Number(document.querySelector('[data-role="mode"]:checked')?.value || 1);

  function setMode() {
    const mode = currentMode();
    role('field-percent').hidden = !(mode === 1 || mode === 3);
    role('field-y').hidden = mode === 1 || mode === 3;
    role('field-direction').hidden = mode !== 3;
    role('label-x').textContent = mode === 4 ? msg('oldLabel') : msg('xLabel');
    role('label-y').textContent = mode === 4 ? msg('newLabel') : msg('yLabel');
    compute();
  }

  function compute() {
    const mode = currentMode();
    const x = role('x').value.trim();
    const b = (mode === 1 || mode === 3 ? role('percent') : role('y')).value.trim();
    if (x === '' || b === '') {
      role('result').textContent = '—';
      role('formula').textContent = '—';
      clearError();
      return;
    }
    const dir = document.querySelector('[data-role="direction"]:checked')?.value || 'increase';
    const r = percentage(mode, Number(x), Number(b), dir);
    if (!r.valid) { showError(msg('invalidNumber')); role('result').textContent = '—'; role('formula').textContent = '—'; return; }
    clearError();
    const v = formatNumber(r.value);
    role('result').textContent = v + (mode === 2 || mode === 4 ? '%' : '');
    const formulas = {
      1: `${x} × ${b}% = ${v}`,
      2: `(${x} ÷ ${b}) × 100% = ${v}%`,
      3: `${x} × (1 ${dir === 'increase' ? '+' : '−'} ${b}%) = ${v}`,
      4: `((${b} − ${x}) ÷ |${x}|) × 100% = ${v}%`,
    };
    role('formula').textContent = formulas[mode];
    trackToolUse(`mode-${mode}`);
  }

  $$('[data-role="mode"]').forEach((el) => on(el, 'change', setMode));
  $$('[data-role="direction"]').forEach((el) => on(el, 'change', compute));
  ['x', 'y', 'percent'].forEach((k) => on(role(k), 'input', compute));
  on(role('run'), 'click', compute);
  on(role('clear'), 'click', () => {
    ['x', 'y', 'percent'].forEach((k) => { role(k).value = ''; });
    role('result').textContent = '—'; role('formula').textContent = '—'; clearError();
  });
  setMode();
}
