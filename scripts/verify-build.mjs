/**
 * 构建产物静态校验：SEO 元信息、双语链接、结构化数据、页面完整性
 * 用法：npm run verify（需先 npm run build）
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const errors = [];
const read = (p) => fs.readFileSync(path.join(DIST, p), 'utf8');

if (!fs.existsSync(DIST)) {
  console.error('dist 不存在，请先运行 npm run build');
  process.exit(1);
}

const { tools } = await import('../src/data/tools.js');
const { activeCategories } = await import('../src/data/categories.js');
const STATIC_PAGES = ['about', 'contact', 'privacy', 'terms', 'suggest', 'changelog', 'data'];

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(path.join(DIST, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) walk(rel);
    else if (e.name === 'index.html') htmlFiles.push(rel.replace(/\\/g, '/'));
  }
})('.');

let checked = 0;
for (const file of htmlFiles) {
  const html = read(file);
  const url = '/' + file.replace(/\/index\.html$/, '/').replace(/^\.\//, '');
  const isRoot = file === 'index.html';
  const lang = url.startsWith('/en/') ? 'en' : url.startsWith('/zh/') ? 'zh' : null;
  const isTool = /\/tools\/[^/]+\/$/.test(url);
  const tag = url;

  const has = (re) => re.test(html);
  if (!has(/<title>[^<]+<\/title>/)) errors.push(`${tag} 缺少 title`);
  if (!isRoot && !has(/<meta name="description" content="[^"]{20,}"/)) errors.push(`${tag} 缺少有效 description`);
  if (!has(/<link rel="canonical" href="https?:\/\/[^"]+"/)) errors.push(`${tag} 缺少 canonical`);
  if (!isRoot) {
    for (const l of ['zh-CN', 'en', 'x-default']) {
      if (!has(new RegExp(`hreflang="${l}"`))) errors.push(`${tag} 缺少 hreflang=${l}`);
    }
  }
  if (!has(/<html lang="(zh-CN|en)"/)) errors.push(`${tag} 缺少 html lang`);
  if (lang && !has(new RegExp(`<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}"`))) errors.push(`${tag} html lang 与路由语言不符`);
  // 根路径是独立的语言选择页（不含工具 UI），无需注入客户端文案与搜索索引
  if (!isRoot) {
    if (!has(/data-ui="[^"]+"/)) errors.push(`${tag} 缺少客户端文案注入`);
    if (!has(/id="tool-index"/)) errors.push(`${tag} 缺少搜索索引`);
  }
  if (/>undefined</.test(html) || />\s*NaN\s*</.test(html)) errors.push(`${tag} 页面出现 undefined / NaN 文本（i18n 键可能缺失）`);

  if (isTool) {
    const h1count = (html.match(/<h1[ >]/g) || []).length;
    if (h1count !== 1) errors.push(`${tag} H1 数量应为 1，实际 ${h1count}`);
    if (!has(/application\/ld\+json/)) errors.push(`${tag} 缺少 JSON-LD`);
    if (!html.includes('SoftwareApplication') || !html.includes('FAQPage')) errors.push(`${tag} 结构化数据不完整`);
    if ((html.match(/class="faq-item"/g) || []).length < 3) errors.push(`${tag} FAQ 少于 3 条`);
    if ((html.match(/class="howto-list"/g) || []).length !== 1) errors.push(`${tag} 缺少使用说明`);
    if ((html.match(/class="related-item"/g) || []).length < 3) errors.push(`${tag} 相关工具内链不足`);
    if (!html.includes('data-action="favorite"')) errors.push(`${tag} 缺少收藏按钮`);
    if (!html.includes('data-role="error"')) errors.push(`${tag} 缺少错误提示区`);
    if (!html.includes('data-tool="')) errors.push(`${tag} 缺少工具脚本标记`);
    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] || '';
    if (!canonical.endsWith(url)) errors.push(`${tag} canonical 与路径不符: ${canonical}`);
  }
  checked++;
}

// 必备页面与资源
const required = ['index.html', 'robots.txt', 'sitemap.xml', '_headers', 'favicon.svg'];
for (const lang of ['zh', 'en']) {
  required.push(`${lang}/index.html`, `${lang}/tools/index.html`);
  for (const t of tools) required.push(`${lang}/tools/${t.slug}/index.html`);
  for (const c of activeCategories) required.push(`${lang}/category/${c.id}/index.html`);
  for (const p of STATIC_PAGES) required.push(`${lang}/${p}/index.html`);
}
for (const p of required) if (!fs.existsSync(path.join(DIST, p))) errors.push(`缺少产物: ${p}`);

// sitemap / robots
const sitemap = read('sitemap.xml');
const sitemapUrls = (sitemap.match(/<loc>/g) || []).length;
const expectedUrls = 1 + 2 * (1 + 1 + tools.length + activeCategories.length + STATIC_PAGES.length);
if (sitemapUrls !== expectedUrls) errors.push(`sitemap URL 数应为 ${expectedUrls}，实际 ${sitemapUrls}`);
for (const t of tools) {
  for (const lang of ['zh', 'en']) {
    if (!sitemap.includes(`/${lang}/tools/${t.slug}/`)) errors.push(`sitemap 缺少 /${lang}/tools/${t.slug}/`);
  }
}
if ((sitemap.match(/xhtml:link rel="alternate"/g) || []).length < expectedUrls * 3) errors.push('sitemap 缺少 hreflang 声明');
const robots = read('robots.txt');
if (!robots.includes('Sitemap:') || !robots.includes('Allow: /')) errors.push('robots.txt 内容不完整');

// 检查每个工具页引用的 JS chunk 存在
const astroDir = path.join(DIST, '_astro');
const chunks = fs.existsSync(astroDir) ? fs.readdirSync(astroDir) : [];
for (const t of tools) {
  if (!chunks.some((f) => f.startsWith(t.slug + '.'))) errors.push(`缺少工具脚本 chunk: ${t.slug}`);
}

console.log(`校验 HTML 页面 ${checked} 个 | 工具 ${tools.length} 个 | sitemap ${sitemapUrls} 条 URL | JS chunks ${chunks.length} 个`);
if (errors.length) {
  console.log(`\n发现 ${errors.length} 个问题:`);
  [...new Set(errors)].slice(0, 40).forEach((e) => console.log('  - ' + e));
  process.exitCode = 1;
} else {
  console.log('✓ SEO / 双语 / 结构化数据 / 产物完整性校验通过');
}
