import { role, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const keys = ['length', 'width', 'height', 'qty'];
  const compute = () => {
    const vals = keys.map((k) => role(k)?.value.trim() ?? '');
    if (vals.some((v) => v === '')) {
      role('per').textContent = '—'; role('total').textContent = '—'; role('formula').textContent = '—';
      clearError();
      return;
    }
    const [l, w, h, q] = vals.map(Number);
    if (![l, w, h, q].every((n) => Number.isFinite(n) && n >= 0) || q < 1) {
      showError(msg('invalidNumber', 'Please enter a valid number'));
      return;
    }
    clearError();
    const per = (l * w * h) / 1000000;
    const total = per * q;
    role('per').textContent = `${formatNumber(per, 6)} CBM`;
    role('total').textContent = `${formatNumber(total, 6)} CBM`;
    role('formula').textContent = `${l} × ${w} × ${h} ÷ 1,000,000 = ${formatNumber(per, 6)} CBM; × ${q} = ${formatNumber(total, 6)} CBM`;
    trackToolUse('calculate');
  };
  keys.forEach((k) => on(role(k), 'input', compute));
  on(role('run'), 'click', compute);
  on(role('clear'), 'click', () => {
    keys.forEach((k) => { const el = role(k); if (el) el.value = ''; });
    ['per', 'total', 'formula'].forEach((k) => { role(k).textContent = '—'; });
    clearError();
  });
  compute();
}
