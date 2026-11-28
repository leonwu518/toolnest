/* GA4 事件埋点（第二阶段：Google Analytics 4）
 *
 * 设计原则：
 * 1. 只在「生产构建 + 配置了 PUBLIC_GA4_MEASUREMENT_ID」时由 MainLayout 注入 gtag.js；
 *    未配置时本模块全部函数为静默空操作，不影响任何功能。
 * 2. 不发送任何用户输入内容：只发工具名 / 分类 / 语言 / 动作类型等结构化参数。
 * 3. 同一事件（同名 + 同参数）30 秒内只发送一次，避免即时计算型工具连打事件。
 * 4. page_view 由 gtag('config') 在整页加载时自动发送；本项目是传统多页站点，
 *    每次跳转都是完整加载，天然不重复，因此这里不做手动 page_view。
 */

const THROTTLE_MS = 30000;
const lastSent = new Map();

/** 工具上下文：从 <html data-lang data-tool data-category> 读取 */
function toolContext() {
  const html = document.documentElement;
  return {
    tool_name: html.dataset.tool || '(site)',
    tool_category: html.dataset.category || '(none)',
    page_language: html.dataset.lang || 'zh',
  };
}

/** 通用事件发送（GA4 未就绪时为 no-op） */
export function trackEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  const payload = { ...toolContext(), ...params };
  const key = `${name}|${JSON.stringify(payload)}`;
  const now = Date.now();
  if (now - (lastSent.get(key) || 0) < THROTTLE_MS) return;
  lastSent.set(key, now);
  window.gtag('event', name, payload);
}

/** 用户执行工具；action 描述本次操作，如 'merge-pdf'、'compress' */
export const trackToolUse = (action) => trackEvent('tool_use', { tool_action: action });

/** 用户复制结果（触发点：utils.js 的 copyText 成功返回） */
export const trackCopy = () => trackEvent('copy_result', {});

/** 用户下载结果（触发点：utils.js 的 downloadBlob / downloadDataUrl 成功触发） */
export const trackDownload = () => trackEvent('download_result', {});

/** 用户通过站内搜索进入工具（触发点：site-client.js 的搜索结果点击 / 回车跳转） */
export const trackSearchTool = (slug) => trackEvent('search_tool', { result_slug: slug });
