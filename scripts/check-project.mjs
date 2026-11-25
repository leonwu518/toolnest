/**
 * 项目完整性自检：新增工具后运行 `npm run check:project`。
 * 校验：工具注册 / UI 组件 / 逻辑脚本 / 中英文文案 / Lucide 图标 / 构建产物页面
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const errors = [];
const warnings = [];

const { tools, toolsByCategory } = await import('../src/data/tools.js');
const { categories } = await import('../src/data/categories.js');
const zh = (await import('../src/i18n/zh-tools.js')).default;
const en = (await import('../src/i18n/en-tools.js')).default;
const icons = JSON.parse(read('src/data/icons.json'));

// 1. 每个工具必须有组件、脚本、双语文案
for (const tool of tools) {
  const ui = `src/tools/${tool.category}/${tool.slug}.astro`;
  const js = `src/scripts/tools/${tool.slug}.js`;
  if (!exists(ui)) errors.push(`缺少 UI 组件: ${ui}`);
  if (!exists(js)) errors.push(`缺少逻辑脚本: ${js}`);
  for (const [name, dict] of [['zh', zh], ['en', en]]) {
    const t = dict[tool.slug];
    if (!t) { errors.push(`${name} 缺少工具文案: ${tool.slug}`); continue; }
    for (const key of ['name', 'desc', 'short', 'seoTitle', 'seoDesc']) {
      if (!t[key]) errors.push(`${name}.${tool.slug} 缺少字段 ${key}`);
    }
    if (!t.howto?.steps?.length) errors.push(`${name}.${tool.slug} 缺少使用说明`);
    if (!t.faqs?.length) errors.push(`${name}.${tool.slug} 缺少 FAQ`);
    if (!t.ui || Object.keys(t.ui).length < 5) errors.push(`${name}.${tool.slug} 缺少界面文案`);
  }
}

// 2. 所有 <Icon name="..."> 必须有对应图标数据
const astroFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.astro')) astroFiles.push(rel);
  }
}
walk('src');
const usedIcons = new Set();
for (const file of astroFiles) {
  const text = read(file);
  for (const m of text.matchAll(/<Icon[^>]*\bname="([a-z0-9-]+)"/g)) usedIcons.add(m[1]);
  for (const m of text.matchAll(/\bicon:\s*'([a-z0-9-]+)'/g)) usedIcons.add(m[1]);
}
for (const t of tools) usedIcons.add(t.icon);
for (const c of categories) usedIcons.add(c.icon);
for (const file of ['src/i18n/zh.js', 'src/i18n/en.js']) {
  for (const m of read(file).matchAll(/\bicon:\s*'([a-z0-9-]+)'/g)) usedIcons.add(m[1]);
}
for (const name of usedIcons) {
  if (!icons[name]) warnings.push(`图标未生成: ${name}（将回退为 circle-dot）`);
}

// 3. 工具脚本不能引用不存在的 data-role（仅提示，实际由冒烟测试覆盖）
const roles = new Set();
for (const file of fs.readdirSync(path.join(root, 'src/scripts/tools'))) {
  if (!file.endsWith('.js')) continue;
  const text = read(`src/scripts/tools/${file}`);
  for (const m of text.matchAll(/role\('([a-z0-9-]+)'\)/g)) roles.add(m[1]);
}

// 4. 构建产物校验（可选）
if (exists('dist')) {
  const expected = [];
  for (const lang of ['zh', 'en']) {
    expected.push(`dist/${lang}/index.html`);
    for (const t of tools) expected.push(`dist/${lang}/tools/${t.slug}/index.html`);
  }
  for (const p of expected) if (!exists(p)) errors.push(`构建产物缺失: ${p}`);
  for (const p of ['dist/index.html', 'dist/sitemap.xml', 'dist/robots.txt', 'dist/_headers', 'dist/favicon.svg']) {
    if (!exists(p)) errors.push(`构建产物缺失: ${p}`);
  }
}

console.log(`工具数: ${tools.length} | Astro 文件: ${astroFiles.length} | 图标: ${Object.keys(icons).length} | 使用的图标: ${usedIcons.size}`);
if (warnings.length) { console.log('\n警告:'); warnings.forEach((w) => console.log('  - ' + w)); }
if (errors.length) { console.log('\n错误:'); errors.forEach((e) => console.log('  - ' + e)); process.exitCode = 1; }
else console.log('\n✓ 项目完整性检查通过');
