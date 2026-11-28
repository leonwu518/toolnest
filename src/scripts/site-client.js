/* 全站客户端交互：主题、菜单、语言偏好、搜索、收藏、最近使用、首页个人区块 */
import { $, $$, on, escapeHtml, msg, toast } from './utils.js';
import { trackSearchTool } from './analytics.js';
import { getFavorites, toggleFavorite, isFavorite, pushRecent, sortByUsage, getRecent, setLang, setTheme } from './storage.js';

const html = document.documentElement;
const lang = html.dataset.lang || ((html.lang || '').startsWith('zh') ? 'zh' : 'en');
const base = `/${lang}`;

/* ---------- 深色模式 ---------- */
function applyThemeIcon() {
  const dark = html.dataset.theme === 'dark';
  $$('[data-action="theme-toggle"]').forEach((btn) => {
    btn.setAttribute('aria-label', dark ? msg('light') : msg('dark'));
    btn.title = dark ? msg('light') : msg('dark');
  });
}
$$('[data-action="theme-toggle"]').forEach((btn) => on(btn, 'click', () => {
  const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
  html.dataset.theme = next;
  setTheme(next);
  applyThemeIcon();
}));
applyThemeIcon();

/* ---------- 移动端菜单 ---------- */
const navToggle = $('[data-action="nav-toggle"]');
const nav = $('#main-nav');
if (navToggle && nav) {
  on(navToggle, 'click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  on(document, 'click', (e) => {
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ---------- 语言偏好 ---------- */
setLang(lang);
$$('[data-lang-link]').forEach((a) => on(a, 'click', () => {
  setLang(a.dataset.langLink || '');
}));

/* ---------- 工具索引 ---------- */
let index = [];
try { index = JSON.parse($('#tool-index')?.textContent || '[]'); } catch { index = []; }
const bySlug = Object.fromEntries(index.map((t) => [t.s, t]));
const toolUrl = (slug) => `${base}/tools/${slug}/`;
const iconSvg = (t) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${bySlug[t]?.v || t.v || ''}</svg>`;

/* ---------- 搜索 ---------- */
function renderSearchResults(host, list) {
  if (!list.length) {
    host.innerHTML = `<div class="search-empty"><strong>${escapeHtml(msg('noResult'))}</strong><div>${escapeHtml(msg('noResultHint'))}</div></div>`;
  } else {
    host.innerHTML = `<div class="search-result-group">${escapeHtml(msg('resultsCount', 'Results').replace('{n}', String(list.length)))}</div>` +
      list.slice(0, 8).map((t) => {
        const l = lang === 'zh' ? t.zh : t.en;
        return `<a class="search-result-item" href="${toolUrl(t.s)}" data-search-slug="${escapeHtml(t.s)}">
          <span class="sr-icon">${iconSvg(t)}</span>
          <span><strong>${escapeHtml(l.n)}</strong><small>${escapeHtml(l.d)}</small></span>
        </a>`;
      }).join('');
  }
  host.hidden = false;
}

$$('[data-role="site-search"]').forEach((input) => {
  const wrap = input.closest('.search-wrap') || input.parentElement;
  const host = wrap.querySelector('[data-role="search-results"]');
  const clearBtn = wrap.querySelector('[data-role="search-clear"]');
  if (!host) return;
  const doSearch = () => {
    const q = input.value.trim().toLowerCase();
    clearBtn?.classList.toggle('show', q.length > 0);
    if (!q) { host.hidden = true; host.innerHTML = ''; return; }
    const matched = index.filter((t) => {
      const hay = `${t.zh.k} ${t.en.k} ${t.zh.n} ${t.en.n} ${t.zh.d} ${t.en.d} ${t.s} ${t.c}`.toLowerCase();
      return hay.includes(q);
    });
    renderSearchResults(host, matched);
  };
  on(input, 'input', doSearch);
  on(input, 'focus', () => { if (input.value.trim()) doSearch(); });
  on(input, 'keydown', (e) => {
    if (e.key === 'Escape') { host.hidden = true; input.blur(); }
    if (e.key === 'Enter') {
      const first = host.querySelector('a.search-result-item');
      if (first) {
        trackSearchTool(first.dataset.searchSlug || '');
        window.location.href = first.href;
      }
    }
  });
  /* 用户点击搜索结果进入工具：先发事件（不阻止默认跳转） */
  on(document, 'click', (e) => {
    const item = e.target.closest && e.target.closest('a.search-result-item');
    if (item && input.value.trim()) trackSearchTool(item.dataset.searchSlug || '');
  }, true);
  on(clearBtn, 'click', () => { input.value = ''; host.hidden = true; host.innerHTML = ''; clearBtn.classList.remove('show'); input.focus(); });
  on(document, 'click', (e) => { if (!wrap.contains(e.target)) host.hidden = true; });
});

/* ---------- 工具页：收藏按钮 + 最近使用 ---------- */
const currentTool = html.dataset.tool;
if (currentTool) {
  pushRecent(currentTool);
  $$('[data-action="favorite"]').forEach((btn) => {
    const sync = () => {
      const active = isFavorite(currentTool);
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
      const label = btn.querySelector('[data-role="favorite-label"]');
      if (label) label.textContent = active ? msg('unfavorite') : msg('favorite');
      const star = btn.querySelector('[data-icon="star"]');
      if (star) star.setAttribute('fill', active ? 'currentColor' : 'none');
    };
    sync();
    on(btn, 'click', () => {
      const active = toggleFavorite(currentTool);
      toast(active ? msg('favoriteAdded') : msg('favoriteRemoved'), active ? 'success' : '');
      sync();
      window.dispatchEvent(new CustomEvent('toolnest:favorites'));
    });
  });
}

/* ---------- 首页：我的收藏 / 最近使用 ---------- */
function cardHtml(t) {
  if (!t) return '';
  const l = lang === 'zh' ? t.zh : t.en;
  return `<a class="tool-card" href="${toolUrl(t.s)}">
    <div class="tool-card-top"><span class="tool-icon accent-${escapeHtml(t.a || 'blue')}">${iconSvg(t)}</span></div>
    <h3>${escapeHtml(l.n)}</h3><p>${escapeHtml(l.d)}</p>
    <div class="tool-card-foot"><span class="cat">${escapeHtml(l.c || '')}</span><span class="arrow">→</span></div>
  </a>`;
}
function renderPersonal() {
  const favHost = $('[data-role="favorites-grid"]');
  const recentHost = $('[data-role="recent-grid"]');
  const favEmpty = $('[data-role="favorites-empty"]');
  const recentEmpty = $('[data-role="recent-empty"]');
  if (favHost) {
    const favs = sortByUsage(getFavorites()).filter((s) => bySlug[s]).slice(0, 8);
    favHost.innerHTML = favs.map((s) => cardHtml(bySlug[s])).join('');
    if (favEmpty) favEmpty.hidden = favs.length > 0;
  }
  if (recentHost) {
    const recent = getRecent().filter((s) => bySlug[s]).slice(0, 8);
    recentHost.innerHTML = recent.map((s) => cardHtml(bySlug[s])).join('');
    if (recentEmpty) recentEmpty.hidden = recent.length > 0;
  }
}
renderPersonal();
window.addEventListener('toolnest:favorites', renderPersonal);
