import { role, $$, on, msg, bindCommonActions, copyText } from '../utils.js';
import { trackToolUse } from '../analytics.js';
import { feedback } from '../feedback.js';

export default function init() {
  const input = role('input');
  if (!input) return;
  const labels = {
    chars: msg('chars'), charsNoSpaces: msg('charsNoSpaces'), words: msg('words'),
    cjk: msg('cjk'), lines: msg('lines'), paragraphs: msg('paragraphs'),
    sentences: msg('sentences'), bytes: msg('bytes'), readTime: msg('readTime'),
  };
  let current = {};

  function compute(text) {
    const points = Array.from(text);
    const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
    const words = (text.trim().match(/\S+/g) || []).length;
    const lines = text.length ? text.split(/\r\n|\r|\n/).length : 0;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length).length;
    const sentences = (text.match(/[^.!?。！？\n]+[.!?。！？]+/g) || []).length;
    const bytes = new TextEncoder().encode(text).length;
    const readTime = Math.max(0, Math.ceil((cjk / 300 + words / 200) * 10) / 10);
    return { chars: points.length, charsNoSpaces: Array.from(text.replace(/\s/g, '')).length,
      words, cjk, lines, paragraphs, sentences, bytes, readTime };
  }

  function render() {
    current = compute(input.value);
    if (current.lines > 5000) feedback('INPUT_TOO_LARGE', { type: 'banner', values: { n: 5000 } });
    if (input.value.trim()) trackToolUse('count');
    $$('[data-stat]').forEach((card) => {
      const el = card.querySelector('[data-role="stat-value"]');
      if (el) el.textContent = String(current[card.dataset.stat] ?? 0);
    });
  }

  function report() {
    return Object.entries(labels).map(([k, label]) => `${label}: ${current[k] ?? 0}`).join('\n');
  }

  on(input, 'input', render);
  bindCommonActions({ onClear: render, getCopyText: report });
  render();
}
