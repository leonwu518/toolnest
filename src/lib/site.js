// URL 与站点级工具函数（服务端 / 构建期使用）
export const SITE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.SITE)
  || process.env.SITE_URL
  || 'https://toolnest.pages.dev';

export const LANGS = ['zh', 'en'];
export const DEFAULT_LANG = 'zh';

/** 生成带尾斜杠的语言路由，例如 langPath('zh', 'tools/word-counter') -> /zh/tools/word-counter/ */
export function langPath(lang, rest = '') {
  const clean = String(rest).replace(/^\/+|\/+$/g, '');
  return `/${lang}${clean ? '/' + clean : ''}/`;
}

export const toolUrl = (lang, slug) => langPath(lang, `tools/${slug}`);
export const categoryUrl = (lang, id) => langPath(lang, `category/${id}`);
export const pageUrl = (lang, slug) => langPath(lang, slug);

export function absoluteUrl(path) {
  return new URL(path, SITE).href;
}

/** 当前路径切换语言：/zh/tools/x/ <-> /en/tools/x/ */
export function switchLangPath(pathname, targetLang) {
  const parts = String(pathname).split('/').filter(Boolean);
  if (LANGS.includes(parts[0])) parts[0] = targetLang;
  else parts.unshift(targetLang);
  return '/' + parts.join('/') + '/';
}

/** 生成 canonical + hreflang 标签数据 */
export function seoLinks(lang, path) {
  return {
    canonical: absoluteUrl(path),
    alternates: [
      { lang: 'zh', href: absoluteUrl(switchLangPath(path, 'zh')) },
      { lang: 'en', href: absoluteUrl(switchLangPath(path, 'en')) },
      { lang: 'x-default', href: absoluteUrl(switchLangPath(path, DEFAULT_LANG)) },
    ],
  };
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
