import { role, on, msg, showError, clearError, bindCommonActions } from '../utils.js';
import { urlEncode, urlDecode } from '../logic/encoding.js';

export default function init() {
  const input = role('input'), output = role('output');

  function run(action) {
    clearError();
    if (!input.value.trim()) { showError(msg('emptyHint')); return; }
    const component = role('component').checked;
    try {
      output.value = action === 'encode'
        ? urlEncode(input.value, component)
        : urlDecode(input.value.trim(), component);
    } catch {
      output.value = '';
      showError(msg('decodeError'));
    }
  }

  on(document.querySelector('[data-action="encode"]'), 'click', () => run('encode'));
  on(document.querySelector('[data-action="decode"]'), 'click', () => run('decode'));
  bindCommonActions({ getCopyText: () => output.value });
}
