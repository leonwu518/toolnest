// URL 与站点级工具函数（服务端 / 构建期使用）
export const SITE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.SITE)
  || process.env.SITE_URL
  || 'https://www.toolwild.com';

export const LANGS = ['zh', 'en'];
export const DEFAULT_LANG = 'zh';

/* 反馈表单端点：由 Cloudflare Pages / 本地 .env 的 PUBLIC_FORMSPREE_ENDPOINT 注入。
 * 未完成 Formspree 配置时保留占位端点，页面会停用提交并提示改用邮件，避免静默失败。 */
export const FORMSPREE_ENDPOINT = import.meta.env.PUBLIC_FORMSPREE_ENDPOINT || 'https://formspree.io/f/xxxxxxxx';
export const FORMSPREE_CONFIGURED = !/formspree\.io\/f\/x{8}/.test(FORMSPREE_ENDPOINT);

/** 生成带尾斜杠的语言路由：默认语言 zh 走根目录，en 走 /en/
 * langPath('zh', 'tools/word-counter') -> /tools/word-counter/
 * langPath('en', 'tools/word-counter') -> /en/tools/word-counter/
 */
export function langPath(lang, rest = '') {
  const clean = String(rest).replace(/^\/+|\/+$/g, '');
  const prefix = lang === 'en' ? '/en' : '';
  return clean ? `${prefix}/${clean}/` : `${prefix}/`;
}

export const toolUrl = (lang, slug) => langPath(lang, `tools/${slug}`);
export const categoryUrl = (lang, id) => langPath(lang, `category/${id}`);
export const pageUrl = (lang, slug) => langPath(lang, slug);

export function absoluteUrl(path) {
  return new URL(path, SITE).href;
}

/** 当前路径切换语言：/tools/x/ <-> /en/tools/x/（停留在同一工具页） */
export function switchLangPath(pathname, targetLang) {
  const clean = String(pathname).replace(/^\/en(?=\/|$)/, '') || '/';
  const rest = clean === '/' ? '' : clean.replace(/\/+$/, '');
  return langPath(targetLang, rest);
}

/** 生成 canonical + hreflang 标签数据
 * canonical 指向自己（不跨语言），x-default 指向默认语言根首页。
 */
export function seoLinks(lang, path) {
  return {
    canonical: absoluteUrl(path),
    alternates: [
      { lang: 'zh-CN', href: absoluteUrl(switchLangPath(path, 'zh')) },
      { lang: 'en', href: absoluteUrl(switchLangPath(path, 'en')) },
      { lang: 'x-default', href: absoluteUrl('/') },
    ],
  };
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
