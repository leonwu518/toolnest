import { role, $$, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { dateDiff, addDays } from '../logic/date.js';

export default function init() {
  const lang = document.documentElement.dataset.lang === 'en' ? 'en' : 'zh';
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = addDays(today, -7, 'add')?.date || today;
  role('start').value = weekAgo;
  role('end').value = today;
  role('base').value = today;

  const mode = () => document.querySelector('[data-role="mode"]:checked')?.value || 'diff';

  function setMode() {
    const isDiff = mode() === 'diff';
    role('diff-fields').hidden = !isDiff;
    role('add-fields').hidden = isDiff;
    role('diff-results').hidden = !isDiff;
    role('add-results').hidden = isDiff;
    compute();
  }

  function compute() {
    clearError();
    if (mode() === 'diff') {
      const r = dateDiff(role('start').value, role('end').value, role('include-end').checked);
      if (!r) { showError(msg('invalidDate')); return; }
      role('days').textContent = String(r.days);
      role('weeks').textContent = formatNumber(r.weeks, 2);
      role('months').textContent = formatNumber(r.months, 2);
      role('years').textContent = formatNumber(r.years, 2);
      role('weekdays').textContent = String(r.weekdays);
      role('weekend-days').textContent = String(r.weekendDays);
      role('status').textContent = r.days < 0 ? msg('negativeHint') : '';
    } else {
      const r = addDays(role('base').value, role('days').value, document.querySelector('[data-role="direction"]:checked')?.value || 'add');
      if (!r) { showError(msg('invalidDate')); return; }
      role('result-date').textContent = r.date;
      const date = new Date(`${r.date}T00:00:00Z`);
      role('weekday').textContent = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', timeZone: 'UTC' }).format(date);
      role('status').textContent = '';
    }
  }

  $$('[data-role="mode"]').forEach((el) => on(el, 'change', setMode));
  $$('[data-role="direction"]').forEach((el) => on(el, 'change', compute));
  ['start', 'end', 'include-end', 'base', 'days'].forEach((k) => {
    const el = role(k);
    on(el, k === 'include-end' ? 'change' : 'input', compute);
  });
  on(role('run'), 'click', compute);
  on(role('clear'), 'click', () => {
    role('start').value = weekAgo; role('end').value = today;
    role('base').value = today; role('days').value = '30';
    role('include-end').checked = false;
    clearError(); compute();
  });
  compute();
}
