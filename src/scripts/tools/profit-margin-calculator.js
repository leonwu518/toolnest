import { role, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { profitMargin } from '../logic/calc.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const keys = ['cost', 'price', 'quantity', 'extra'];

  function compute() {
    const values = keys.map((k) => role(k).value.trim());
    if (values.some((v) => v === '' || !Number.isFinite(Number(v)) || Number(v) < 0)) {
      showError(msg('invalidNumber'));
      return;
    }
    clearError();
    const r = profitMargin(...values.map(Number));
    const set = (k, v) => { const el = role(k); if (el) el.textContent = v === null ? '—' : formatNumber(v); };
    set('margin', r.margin);
    set('markup', r.markup);
    set('profit', r.profit);
    set('unit-profit', r.unitProfit);
    set('revenue', r.revenue);
    set('total-cost', r.totalCost);
    role('status').textContent = r.profit < 0 ? msg('lossNote') : msg('note');
    trackToolUse('calculate');
  }

  keys.forEach((k) => on(role(k), 'input', compute));
  on(role('run'), 'click', compute);
  on(role('clear'), 'click', () => {
    role('cost').value = '80'; role('price').value = '100';
    role('quantity').value = '1'; role('extra').value = '0';
    clearError(); compute();
  });
  compute();
}
