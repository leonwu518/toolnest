import { role, $$, on, msg, showError, clearError, setStatus, bindCommonActions, downloadText } from '../utils.js';
import { trackToolUse } from '../analytics.js';
import { FORMULAS, formulaById, buildFormula, evaluateFormula, trialValues } from '../logic/excel-formula.js';

export default function init() {
  const typeSel = role('formula-type'), paramsBox = role('params'), trialBox = role('trial');
  const output = role('output'), desc = role('desc'), trialResult = role('trial-result'), dl = role('download');
  const labels = msg('paramLabels') || {}, names = msg('formulaNames') || {}, descs = msg('formulaDesc') || {};
  const DEFAULT_TRIAL = '10\n20\n30';

  function fillParams() {
    const tpl = formulaById[typeSel.value];
    paramsBox.textContent = '';
    (tpl?.params || []).forEach((p) => {
      const field = document.createElement('div'); field.className = 'field';
      const label = document.createElement('label');
      label.textContent = labels[p.key] || p.key;
      const input = document.createElement('input');
      input.className = 'input'; input.type = 'text'; input.value = p.default;
      input.dataset.param = p.key; input.setAttribute('spellcheck', 'false');
      field.append(label, input);
      paramsBox.appendChild(field);
      on(input, 'input', compute);
    });
  }

  function params() {
    return Object.fromEntries($$('[data-param]', paramsBox).map((el) => [el.dataset.param, el.value]));
  }

  function compute() {
    clearError();
    const p = params();
    const built = buildFormula(typeSel.value, p);
    if (built.error) {
      output.value = ''; desc.textContent = '—'; trialResult.textContent = '—';
      dl.disabled = true; setStatus('');
      showError(msg(built.error)); return;
    }
    output.value = built.formula;
    desc.textContent = descs[typeSel.value] || '';
    dl.disabled = false;
    trackToolUse('build');
    const values = trialValues(trialBox.value);
    if (!values.length) trialResult.textContent = msg('noTrial');
    else {
      const r = evaluateFormula(typeSel.value, values, p);
      trialResult.textContent = r.supported ? String(r.value) : msg('unsupported');
    }
    setStatus(names[typeSel.value] || typeSel.value);
  }

  on(typeSel, 'change', () => { fillParams(); compute(); });
  on(trialBox, 'input', compute);
  on(role('run'), 'click', compute);

  bindCommonActions({
    getCopyText: () => output.value,
    getDownload: () => downloadText(
      `${output.value}\n\n${msg('descriptionLabel')}: ${desc.textContent}\n${msg('trialResult')}: ${trialResult.textContent}\n`,
      'toolnest-formula.txt'),
    onClear: () => {
      typeSel.value = FORMULAS[0].id;
      trialBox.value = DEFAULT_TRIAL;
      fillParams(); compute();
    },
  });

  fillParams();
  compute();
}
