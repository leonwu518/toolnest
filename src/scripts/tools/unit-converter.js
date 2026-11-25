import { role, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { unitGroups, unitGroupById, convertUnit } from '../logic/units.js';

export default function init() {
  const lang = document.documentElement.dataset.lang === 'en' ? 'en' : 'zh';
  const label = (l) => (l && (l[lang] || l.en)) || '';
  const groupSel = role('unit-group'), fromSel = role('from'), toSel = role('to');

  unitGroups.forEach((g) => {
    const o = document.createElement('option');
    o.value = g.id; o.textContent = label(g.label);
    groupSel.appendChild(o);
  });

  function fillUnits(group, keepFrom, keepTo) {
    fromSel.innerHTML = ''; toSel.innerHTML = '';
    group.units.forEach((u) => {
      const a = document.createElement('option'); a.value = u.id; a.textContent = label(u.label);
      const b = a.cloneNode(true);
      fromSel.appendChild(a); toSel.appendChild(b);
    });
    if (keepFrom && group.units.some((u) => u.id === keepFrom)) fromSel.value = keepFrom;
    else fromSel.value = group.units[0]?.id || '';
    if (keepTo && group.units.some((u) => u.id === keepTo)) toSel.value = keepTo;
    else toSel.value = group.units[1]?.id || group.units[0]?.id || '';
  }

  function compute() {
    const raw = role('value').value.trim();
    if (raw === '') { role('result').textContent = '—'; role('formula').textContent = '—'; clearError(); return; }
    const value = Number(raw);
    if (!Number.isFinite(value)) { showError(msg('invalidNumber')); return; }
    clearError();
    const group = groupSel.value;
    const result = convertUnit(value, group, fromSel.value, toSel.value);
    role('result').textContent = formatNumber(result);
    const one = convertUnit(1, group, fromSel.value, toSel.value);
    const from = unitGroupById[group]?.units.find((u) => u.id === fromSel.value);
    const to = unitGroupById[group]?.units.find((u) => u.id === toSel.value);
    role('formula').textContent = `1 ${label(from?.label)} = ${formatNumber(one)} ${label(to?.label)}`;
  }

  on(groupSel, 'change', () => { fillUnits(unitGroupById[groupSel.value]); compute(); });
  on(fromSel, 'change', compute);
  on(toSel, 'change', compute);
  on(role('value'), 'input', compute);
  on(role('swap'), 'click', () => {
    const temp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = temp;
    compute();
  });

  fillUnits(unitGroupById[groupSel.value || unitGroups[0].id]);
  groupSel.value = groupSel.value || unitGroups[0].id;
  compute();
}
