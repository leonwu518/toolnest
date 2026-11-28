/* 本地数据层：只保存工具标识与偏好，绝不保存任何文件内容或用户输入的文本 */
const K = {
  favorites: 'toolwild.favorites',
  recent: 'toolwild.recent',
  counts: 'toolwild.counts',
  theme: 'toolwild.theme',
  lang: 'toolwild.lang',
};
const LIMIT_RECENT = 12;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 隐私模式下忽略 */ }
}
function readString(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

/* ---------- 收藏 ---------- */
export function getFavorites() {
  const v = read(K.favorites, []);
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}
export function isFavorite(slug) { return getFavorites().includes(slug); }
export function toggleFavorite(slug) {
  const list = getFavorites();
  const i = list.indexOf(slug);
  if (i >= 0) { list.splice(i, 1); write(K.favorites, list); return false; }
  list.unshift(slug);
  write(K.favorites, list);
  return true;
}
export function removeFavorite(slug) {
  write(K.favorites, getFavorites().filter((s) => s !== slug));
}

/* ---------- 最近使用 ---------- */
export function getRecent() {
  const v = read(K.recent, []);
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, LIMIT_RECENT) : [];
}
export function pushRecent(slug) {
  const list = getRecent().filter((s) => s !== slug);
  list.unshift(slug);
  write(K.recent, list.slice(0, LIMIT_RECENT));
  const counts = getCounts();
  counts[slug] = (counts[slug] || 0) + 1;
  write(K.counts, counts);
}

/* ---------- 使用次数 / 常用排序 ---------- */
export function getCounts() {
  const v = read(K.counts, {});
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
/** 按使用次数降序、最近使用优先排列，用于「常用工具排序」 */
export function sortByUsage(slugs) {
  const counts = getCounts();
  const recent = getRecent();
  return [...slugs].sort((a, b) => {
    const d = (counts[b] || 0) - (counts[a] || 0);
    if (d !== 0) return d;
    return recent.indexOf(a) - recent.indexOf(b);
  });
}

/* ---------- 偏好 ---------- */
export function getTheme() { return readString(K.theme); }
export function setTheme(theme) { try { localStorage.setItem(K.theme, theme); } catch {} }
export function getLang() { return readString(K.lang); }
export function setLang(lang) { try { localStorage.setItem(K.lang, lang); } catch {} }

/* ---------- 备份 / 恢复 / 清除 ---------- */
export function exportBackup() {
  return {
    app: 'ToolWild',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      favorites: getFavorites(),
      recent: getRecent(),
      counts: getCounts(),
      theme: getTheme(),
      lang: getLang(),
    },
  };
}
export function importBackup(obj) {
  if (!obj || obj.app !== 'ToolWild' || !obj.data || typeof obj.data !== 'object') return false;
  const d = obj.data;
  if (Array.isArray(d.favorites)) write(K.favorites, d.favorites.filter((x) => typeof x === 'string'));
  if (Array.isArray(d.recent)) write(K.recent, d.recent.filter((x) => typeof x === 'string').slice(0, LIMIT_RECENT));
  if (d.counts && typeof d.counts === 'object') write(K.counts, d.counts);
  if (d.theme === 'dark' || d.theme === 'light') setTheme(d.theme);
  if (d.lang === 'zh' || d.lang === 'en') setLang(d.lang);
  return true;
}
export function clearAll() {
  Object.values(K).forEach((k) => { try { localStorage.removeItem(k); } catch {} });
}

export function stats() {
  return { favorites: getFavorites().length, recent: getRecent().length, theme: getTheme() || 'auto', lang: getLang() || 'auto' };
}
