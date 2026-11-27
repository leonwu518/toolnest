/**
 * 从 lucide-static 提取所需图标的内部 SVG 片段，生成 src/data/icons.json。
 * 生成结果是纯静态数据，网站运行时不依赖 lucide-static，也不加载任何图标 JS。
 * 用法：node scripts/gen-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ICONS = [
  // 工具与分类图标
  'type', 'list-filter', 'case-upper', 'git-compare', 'braces', 'minimize-2', 'maximize-2',
  'refresh-cw', 'files', 'scissors', 'file-image', 'sheet', 'percent', 'trending-up', 'ruler',
  'calendar-days', 'link', 'binary', 'palette', 'qr-code', 'image', 'file-stack', 'calculator',
  'sparkles', 'code', 'zap', 'globe', 'wrench', 'layers',
  // 通用 UI 图标
  'menu', 'x', 'sun', 'moon', 'languages', 'search', 'star', 'arrow-right', 'arrow-left',
  'chevron-right', 'chevron-down', 'chevron-up', 'check', 'check-check', 'circle-check',
  'circle-alert', 'info', 'copy', 'download', 'trash-2', 'upload', 'file-text', 'file',
  'plus', 'arrow-up', 'arrow-down', 'shield-check', 'clock', 'mail', 'lock', 'database',
  'rotate-ccw', 'sliders-horizontal', 'calendar', 'hash', 'file-plus', 'image-plus',
  'external-link', 'circle-help', 'lightbulb', 'eye', 'move-up', 'move-down', 'clipboard',
  'eraser', 'save', 'file-down', 'file-up', 'settings', 'settings-2', 'list', 'arrow-left-right',
  'table', 'circle-x', 'scan-line', 'droplet', 'square-stack', 'book-open', 'heart',
  'briefcase', 'circle-dot', 'filter', 'align-left', 'wand-sparkles', 'chart-no-axes-combined', 'wallet',
  'function-square', 'list-checks', 'sigma', 'regex', 'list-ordered', 'grip-vertical',
];

const base = path.resolve('node_modules/lucide-static/icons');
const out = {};
const missing = [];

for (const name of ICONS) {
  const file = path.join(base, `${name}.svg`);
  if (!fs.existsSync(file)) { missing.push(name); continue; }
  const raw = fs.readFileSync(file, 'utf8').trim();
  const inner = raw
    .replace(/<!--[\s\S]*?-->/g, '')   // 去掉 license 注释
    .trim()
    .replace(/^<svg[^>]*>/, '')        // 去掉外层开标签（lucide-static 的开标签为多行属性）
    .replace(/<\/svg>\s*$/, '')        // 去掉外层闭标签
    .replace(/\s+/g, ' ')
    .trim();
  if (/<svg/i.test(inner)) {
    console.error(`图标 ${name} 内仍有嵌套 svg，提取失败`);
    process.exitCode = 1;
  }
  out[name] = inner;
}

if (missing.length) {
  console.error('图标缺失:', missing.join(', '));
  process.exitCode = 1;
}

fs.mkdirSync(path.resolve('src/data'), { recursive: true });
fs.writeFileSync(path.resolve('src/data/icons.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`已生成 ${Object.keys(out).length} 个 Lucide 图标 -> src/data/icons.json`);
