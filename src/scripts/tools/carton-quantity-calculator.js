import { role, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const keys = ['c-l', 'c-w', 'c-h', 'p-l', 'p-w', 'p-h'];
  const compute = () => {
    const vals = keys.map((k) => role(k)?.value.trim() ?? '');
    const lossRaw = role('loss')?.value.trim() ?? '';
    if (vals.some((v) => v === '') || lossRaw === '') {
      role('result').textContent = '—'; role('formula').textContent = '—'; clearError(); return;
    }
    const nums = [...vals.map(Number), Number(lossRaw)];
    if (!nums.every((n) => Number.isFinite(n) && n >= 0) || nums[6] > 90) {
      showError(msg('invalidNumber', 'Please enter a valid number')); return;
    }
    const [cl, cw, ch, pl, pw, ph, loss] = nums;
    if (pl * pw * ph <= 0) { showError(msg('invalidNumber', 'Please enter a valid number')); return; }
    clearError();
    const containerCbm = (cl * cw * ch) / 1000000;
    const unitCbm = (pl * pw * ph) / 1000000;
    const qty = Math.floor((containerCbm / unitCbm) * (1 - loss / 100));
    role('result').textContent = String(Math.max(0, qty));
    role('formula').textContent = `${formatNumber(containerCbm, 4)} ÷ ${formatNumber(unitCbm, 6)} × (1 − ${loss}%) = ${Math.max(0, qty)}`;
    trackToolUse('calculate');
  };
  [...keys, 'loss'].forEach((k) => on(role(k), 'input', compute));
  on(role('run'), 'click', compute);
  on(role('clear'), 'click', () => {
    [...keys, 'loss'].forEach((k) => { const el = role(k); if (el) el.value = ''; });
    role('result').textContent = '—'; role('formula').textContent = '—'; clearError();
  });
  compute();
}
