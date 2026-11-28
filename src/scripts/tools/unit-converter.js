import { role, on, msg, showError, clearError, formatNumber } from '../utils.js';
import { unitGroups, unitGroupById, convertUnit } from '../logic/units.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const lang = document.documentElement.dataset.lang === 'en' ? 'en' : 'zh';
  const label = (l) => (l && (l[lang] || l.en)) || '';
  const groupSel = role('unit-group'), fromSel = role('from'), toSel = role('to');
  const precisionSel = role('precision');
  const bigBox = role('big-result'), bigFrom = role('big-from'), bigFromUnit = role('big-from-unit'),
    bigToUnit = role('big-to-unit'), resultEl = role('result'), formulaEl = role('formula'),
    allBox = role('all-units');

  unitGroups.forEach((g) => {
    const o = document.createElement('option');
    o.value = g.id; o.textContent = label(g.label);
    groupSel.appendChild(o);
  });

  /** 按精度选择格式化：auto 走自适应有效数字，固定档位用 toFixed */
  function fmt(v) {
    if (!Number.isFinite(v)) return '—';
    const p = precisionSel.value;
    if (p === 'auto') return formatNumber(v, 6);
    return v.toFixed(Number(p));
  }

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
    const group = unitGroupById[groupSel.value];
    const from = group?.units.find((u) => u.id === fromSel.value);
    const to = group?.units.find((u) => u.id === toSel.value);
    if (raw === '') {
      bigBox.hidden = true; resultEl.textContent = '—'; formulaEl.textContent = '—';
      renderAllUnits(group, null);
      clearError(); return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) { showError(msg('invalidNumber')); bigBox.hidden = true; return; }
    clearError();

    // 大字号换算行
    bigFrom.textContent = fmt(value);
    bigFromUnit.textContent = label(from?.label);
    bigToUnit.textContent = label(to?.label);
    const result = convertUnit(value, groupSel.value, fromSel.value, toSel.value);
    resultEl.textContent = fmt(result);
    bigBox.hidden = false;

    // 换算关系
    const one = convertUnit(1, groupSel.value, fromSel.value, toSel.value);
    formulaEl.textContent = `1 ${label(from?.label)} = ${fmt(one)} ${label(to?.label)}`;

    renderAllUnits(group, value);
    trackToolUse(`${groupSel.value}:${fromSel.value}-to-${toSel.value}`);
  }

  /** 同类全单位面板：一次输入，类别下所有单位同时换算；点击卡片切换目标单位 */
  function renderAllUnits(group, value) {
    allBox.innerHTML = '';
    if (!group) return;
    group.units.forEach((u) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'uc-unit' + (u.id === toSel.value ? ' active' : '');
      const name = document.createElement('span'); name.className = 'u'; name.textContent = label(u.label);
      const val = document.createElement('span'); val.className = 'v';
      val.textContent = value === null ? '—' : fmt(convertUnit(value, groupSel.value, fromSel.value, u.id));
      btn.append(name, val);
      btn.setAttribute('aria-label', `${label(u.label)}: ${val.textContent}`);
      on(btn, 'click', () => { toSel.value = u.id; compute(); });
      allBox.appendChild(btn);
    });
  }

  on(groupSel, 'change', () => { fillUnits(unitGroupById[groupSel.value]); compute(); });
  on(fromSel, 'change', compute);
  on(toSel, 'change', compute);
  on(precisionSel, 'change', compute);
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
