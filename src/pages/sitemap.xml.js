import { tools } from '../data/tools.js';
import { categories } from '../data/categories.js';
import { LANGS, DEFAULT_LANG, langPath, toolUrl, categoryUrl, pageUrl, absoluteUrl, switchLangPath } from '../lib/site.js';

export const prerender = true;

const STATIC_PAGES = ['about', 'contact', 'privacy', 'terms', 'suggest', 'changelog', 'data'];
const TODAY = new Date().toISOString().slice(0, 10);

function alternates(path) {
  return LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${absoluteUrl(switchLangPath(path, l))}" />`).join('')
    + `<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(switchLangPath(path, DEFAULT_LANG))}" />`;
}

function entry(path, { priority = '0.7', changefreq = 'monthly', lastmod = TODAY } = {}) {
  return `<url><loc>${absoluteUrl(path)}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority>${alternates(path)}</url>`;
}

export function GET() {
  const urls = [`<url><loc>${absoluteUrl('/')}</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority>${alternates('/zh/')}</url>`];

  for (const lang of LANGS) {
    urls.push(entry(langPath(lang), { priority: '1.0', changefreq: 'weekly' }));
    for (const m of tools) urls.push(entry(toolUrl(lang, m.slug), { priority: '0.8', lastmod: m.addedAt }));
    for (const c of categories) urls.push(entry(categoryUrl(lang, c.id), { priority: '0.6' }));
    for (const p of STATIC_PAGES) urls.push(entry(pageUrl(lang, p), { priority: '0.4', changefreq: 'yearly' }));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
