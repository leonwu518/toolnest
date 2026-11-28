import {
  role, on, msg, showError, clearError, setStatus, bindCommonActions, downloadText, debounce,
} from '../utils.js';
import { STEP_DEFS, defaultStepOptions, applySteps, splitLines } from '../logic/batch-text.js';
import { trackToolUse } from '../analytics.js';

export default function init() {
  const input = role('input'), output = role('output'), dl = role('download');
  const list = role('steps'), emptyEl = role('empty-steps'), typeSel = role('step-type');
  const stepNames = msg('stepTypes') || {}, fieldLabels = msg('stepOptionLabels') || {};
  let steps = [];

  function iconButton(icon, label, handler) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bt-icon-btn';
    b.setAttribute('aria-label', label); b.title = label;
    const tpl = role(`icon-${icon}`);
    if (tpl) b.appendChild(tpl.content.cloneNode(true));
    else b.textContent = icon === 'remove' ? '×' : icon === 'up' ? '↑' : '↓';
    on(b, 'click', handler);
    return b;
  }

  function render() {
    list.textContent = '';
    emptyEl.hidden = steps.length > 0;
    steps.forEach((step, index) => {
      const def = STEP_DEFS[step.type] || { fields: [] };
      const card = document.createElement('div'); card.className = 'bt-step';

      const head = document.createElement('div'); head.className = 'bt-step-head';
      const title = document.createElement('span'); title.className = 'bt-step-title';
      title.textContent = `${index + 1}. ${stepNames[step.type] || step.type}`;
      const actions = document.createElement('div'); actions.className = 'bt-step-actions';
      actions.append(
        iconButton('up', msg('moveUp'), () => move(index, -1)),
        iconButton('down', msg('moveDown'), () => move(index, 1)),
        iconButton('remove', msg('remove'), () => { steps.splice(index, 1); render(); process(); }),
      );
      head.append(title, actions);
      card.appendChild(head);

      const fields = document.createElement('div'); fields.className = 'bt-step-fields';
      def.fields.forEach((f) => {
        if (f.showIf && Object.entries(f.showIf).some(([k, v]) => step.options[k] !== v)) return;
        const wrap = document.createElement('label');
        wrap.className = 'bt-field' + (f.type === 'checkbox' ? ' bt-check' : '');
        const label = document.createElement('span');
        label.textContent = fieldLabels[f.key] || f.key;
        let control;
        if (f.type === 'select') {
          control = document.createElement('select'); control.className = 'select';
          const group = msg(f.labelGroup) || {};
          f.options.forEach((v) => {
            const o = document.createElement('option'); o.value = v; o.textContent = group[v] || v;
            control.appendChild(o);
          });
          control.value = step.options[f.key] ?? f.options[0];
          on(control, 'change', () => {
            step.options[f.key] = control.value;
            if (def.fields.some((x) => x.showIf)) render();
            process();
          });
        } else if (f.type === 'checkbox') {
          control = document.createElement('input'); control.type = 'checkbox';
          control.checked = !!step.options[f.key];
          on(control, 'change', () => { step.options[f.key] = control.checked; process(); });
        } else {
          control = document.createElement('input');
          control.type = f.type === 'number' ? 'number' : 'text';
          control.className = 'input';
          control.value = step.options[f.key] ?? '';
          on(control, 'input', () => {
            step.options[f.key] = f.type === 'number' ? Number(control.value) : control.value;
            process();
          });
        }
        if (f.type === 'checkbox') wrap.append(control, label);
        else wrap.append(label, control);
        fields.appendChild(wrap);
      });
      if (def.fields.length) card.appendChild(fields);
      list.appendChild(card);
    });
    role('stat-steps').textContent = String(steps.length);
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    [steps[index], steps[target]] = [steps[target], steps[index]];
    render(); process();
  }

  function clearStats() {
    for (const key of ['stat-original', 'stat-output', 'stat-removed']) role(key).textContent = '—';
    role('stat-steps').textContent = String(steps.length);
  }

  function process() {
    clearError();
    if (!input.value.trim()) {
      output.value = ''; dl.disabled = true; setStatus(''); clearStats();
      showError(msg('pleaseInput')); return;
    }
    const r = applySteps(splitLines(input.value), steps);
    if (r.error) { showError(msg(r.error)); return; }
    output.value = r.lines.join('\n');
    role('stat-original').textContent = String(r.stats.original);
    role('stat-output').textContent = String(r.stats.output);
    role('stat-removed').textContent = String(r.stats.removed);
    role('stat-steps').textContent = String(r.stats.stepCount);
    setStatus(`${msg('statOutput')} ${r.stats.output} · ${msg('stepCount')} ${r.stats.stepCount}`);
    dl.disabled = false;
    trackToolUse('apply-steps');
  }

  on(role('add-step'), 'click', () => {
    const type = typeSel.value;
    steps.push({ type, options: { ...(defaultStepOptions[type] || {}) } });
    render(); process();
  });
  on(role('run'), 'click', process);
  on(input, 'input', debounce(() => { if (input.value.trim()) process(); }, 220));

  on(role('reset'), 'click', () => {
    steps = [];
    input.value = ''; output.value = '';
    const file = role('file'); if (file) file.value = '';
    clearError(); setStatus(''); dl.disabled = true;
    render(); clearStats();
  });

  bindCommonActions({
    getCopyText: () => output.value,
    getDownload: () => downloadText(output.value, 'processed.txt'),
    onClear: () => { dl.disabled = true; setStatus(''); clearStats(); clearError(); },
  });

  render();
}
