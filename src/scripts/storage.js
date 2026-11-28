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
/** 规范化使用记录：兼容旧版纯数字次数，统一为 { n: 次数, at: 时间戳 } */
function normalizeUsage(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out = {};
  for (const [slug, item] of Object.entries(v)) {
    if (typeof slug !== 'string') continue;
    if (typeof item === 'number' && Number.isFinite(item)) out[slug] = { n: item, at: 0 };
    else if (item && typeof item === 'object' && Number.isFinite(item.n)) {
      out[slug] = { n: item.n, at: Number.isFinite(item.at) ? item.at : 0 };
    }
  }
  return out;
}
/** 读取本机使用统计：仅工具 slug、次数与最近使用时间戳，绝无文件内容 */
export function getUsage() {
  return normalizeUsage(read(K.counts, {}));
}
export function pushRecent(slug) {
  if (typeof slug !== 'string' || !slug) return;
  const list = getRecent().filter((s) => s !== slug);
  list.unshift(slug);
  write(K.recent, list.slice(0, LIMIT_RECENT));
  const usage = getUsage();
  const prev = usage[slug] || { n: 0, at: 0 };
  usage[slug] = { n: prev.n + 1, at: Date.now() };
  write(K.counts, usage);
}

/* ---------- 使用次数 / 常用排序 ---------- */
/** 兼容旧接口：返回 { slug: 次数 } */
export function getCounts() {
  const usage = getUsage();
  return Object.fromEntries(Object.entries(usage).map(([slug, v]) => [slug, v.n]));
}
/** 按使用次数降序、最近使用优先排列，用于「大家都在用」排序 */
export function sortByUsage(slugs) {
  const usage = getUsage();
  const recent = getRecent();
  return [...slugs].sort((a, b) => {
    const d = (usage[b]?.n || 0) - (usage[a]?.n || 0);
    if (d !== 0) return d;
    const at = (usage[b]?.at || 0) - (usage[a]?.at || 0);
    if (at !== 0) return at;
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
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      favorites: getFavorites(),
      recent: getRecent(),
      counts: getCounts(),
      usage: getUsage(),
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
  if (d.usage && typeof d.usage === 'object') write(K.counts, normalizeUsage(d.usage));
  else if (d.counts && typeof d.counts === 'object') write(K.counts, normalizeUsage(d.counts));
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
