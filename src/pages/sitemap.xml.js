import { tools } from '../data/tools.js';
import { activeCategories } from '../data/categories.js';
import { LANGS, langPath, toolUrl, categoryUrl, pageUrl, absoluteUrl, switchLangPath } from '../lib/site.js';

export const prerender = true;

const STATIC_PAGES = ['about', 'contact', 'privacy', 'terms', 'suggest', 'changelog', 'data', 'feedback'];
const TODAY = new Date().toISOString().slice(0, 10);

/* 每个 URL 都给出 zh-CN / en / x-default 三条 hreflang，中英互指同一页面 */
function alternates(path) {
  return LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l === 'zh' ? 'zh-CN' : l}" href="${absoluteUrl(switchLangPath(path, l))}" />`).join('')
    + `<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl('/')}" />`;
}

function entry(path, { priority = '0.7', changefreq = 'monthly', lastmod = TODAY } = {}) {
  return `<url><loc>${absoluteUrl(path)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority>${alternates(path)}</url>`;
}

export function GET() {
  const urls = [];
  /* 默认语言 zh 输出根路径，英文输出 /en/ 路径，不再产生任何 /zh/ URL */
  for (const lang of LANGS) {
    urls.push(entry(langPath(lang), { priority: '1.0', changefreq: 'weekly' }));
    urls.push(entry(langPath(lang, 'tools'), { priority: '0.9', changefreq: 'weekly' }));
    for (const m of tools) urls.push(entry(toolUrl(lang, m.slug), { priority: '0.8', lastmod: m.addedAt }));
    for (const c of activeCategories) urls.push(entry(categoryUrl(lang, c.id), { priority: '0.6' }));
    for (const p of STATIC_PAGES) urls.push(entry(pageUrl(lang, p), { priority: '0.4', changefreq: 'yearly' }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
