import { role, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const keys = ['cost', 'fees', 'margin', 'rate'];
  const compute = () => {
    const vals = keys.map((k) => role(k)?.value.trim() ?? '');
    if (vals.some((v) => v === '')) {
      role('result').textContent = '—'; role('formula').textContent = '—'; clearError(); return;
    }
    const [cost, fees, margin, rate] = vals.map(Number);
    if (![cost, fees, margin, rate].every((n) => Number.isFinite(n) && n >= 0) || rate === 0) {
      showError(msg('invalidNumber', 'Please enter a valid number')); return;
    }
    clearError();
    const subtotal = cost + fees;
    const usd = (subtotal * (1 + margin / 100)) / rate;
    role('result').textContent = `$${formatNumber(usd, 2)}`;
    role('formula').textContent = `(${cost} + ${fees}) × (1 + ${margin}%) ÷ ${rate} = $${formatNumber(usd, 2)}`;
    trackToolUse('calculate');
  };
  keys.forEach((k) => on(role(k), 'input', compute));
  on(role('run'), 'click', compute);
  on(role('clear'), 'click', () => {
    keys.forEach((k) => { const el = role(k); if (el) el.value = ''; });
    const d = role('rate-date'); if (d) d.value = '';
    role('result').textContent = '—'; role('formula').textContent = '—'; clearError();
  });
  compute();
}
