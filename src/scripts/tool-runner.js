/* 按需加载当前工具的逻辑脚本：每个工具一个独立 chunk，页面不会加载无关代码 */
import { msg, showError } from './utils.js';

const loaders = import.meta.glob('./tools/*.js');

export function runTool() {
  const slug = document.documentElement.dataset.tool;
  if (!slug) return;
  const loader = loaders[`./tools/${slug}.js`];
  if (!loader) {
    console.error(`[ToolNest] 未找到工具脚本: ${slug}`);
    showError(msg('readError'));
    return;
  }
  loader()
    .then((mod) => { if (typeof mod.default === 'function') mod.default(); })
    .catch((err) => {
      console.error(`[ToolNest] 工具 ${slug} 初始化失败`, err);
      showError(msg('readError'));
    });
}

runTool();
