import zh from './zh.js';
import en from './en.js';
import { LANGS, DEFAULT_LANG } from '../lib/site.js';

export const dictionaries = { zh, en };

export function isLang(v) {
  return LANGS.includes(v);
}

/** 取得完整字典；fallback 为英文，避免某个键漏译导致页面报错 */
export function getDict(lang) {
  return dictionaries[lang] || en;
}

/** 工具文案：以英文为底，覆盖为目标语言，保证任何缺失键都有可读值 */
export function getToolI18n(lang, slug) {
  const dict = getDict(lang);
  const base = (en.tools && en.tools[slug]) || {};
  const own = (dict.tools && dict.tools[slug]) || {};
  return {
    ...base,
    ...own,
    ui: { ...(base.ui || {}), ...(own.ui || {}) },
    faqs: own.faqs || base.faqs || [],
    howto: own.howto || base.howto || { title: '', steps: [] },
  };
}

/** 分类文案 */
export function getCategoryI18n(lang, id) {
  const dict = getDict(lang);
  return { ...(en.categories[id] || {}), ...(dict.categories[id] || {}) };
}

/** 静态页面文案 */
export function getPageI18n(lang, slug) {
  const dict = getDict(lang);
  return { ...(en.pages[slug] || {}), ...(dict.pages[slug] || {}) };
}

/** 简化取值：t('home.heroTitle') */
export function translator(lang) {
  const dict = getDict(lang);
  return (path, fallback = '') => {
    const value = path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
    return value === undefined ? fallback || path : value;
  };
}

export { LANGS, DEFAULT_LANG };
