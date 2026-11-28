# 新增工具操作指南

ToolWild 的架构支持扩展到 100–500 个工具：**新增一个工具不需要新建页面文件**，动态路由会自动生成中英文两个页面、sitemap、hreflang 与内链。

只需 4 个步骤 + 1 次自检。

---

## 步骤 1：注册工具

编辑 `src/data/tools.js`，在 `tools` 数组追加一条（分类决定 UI 组件与脚本所在目录）：

```js
{ slug: 'csv-cleaner', category: 'productivity', icon: 'list-filter',
  popular: false, recommended: false, isNew: true, addedAt: '2025-06-01' },
```

字段说明：

| 字段 | 含义 |
|---|---|
| `slug` | URL 片段，同时是组件名、脚本名、i18n 键名（用小写连字符） |
| `category` | `text` / `image` / `files` / `calculators` / `developer` / `productivity` / `ai` / `business` |
| `icon` | `src/data/icons.json` 中的 Lucide 图标名；若没有，运行 `npm run gen:icons` 前先把名字加入 `scripts/gen-icons.mjs` 的 `ICONS` 列表 |
| `popular` / `recommended` / `isNew` | 首页热门 / 推荐 / 最近新增区块 |
| `addedAt` | sitemap 的 lastmod |

`src/data/tools.js` 底部的 `roadmap` 存放第二阶段规划名称，工具上线后请从 roadmap 中移除。

---

## 步骤 2：补充中英文文案

在 `src/i18n/zh-tools.js` 与 `src/i18n/en-tools.js` 各加一个同名条目，**键名保持一致**：

```js
'csv-cleaner': {
  name: 'CSV 数据清洗',
  desc: '清理 CSV 中的空行、重复行与多余空白。',
  short: '清理 CSV 空行、重复行与空白',
  seoTitle: '在线 CSV 数据清洗工具 | ToolWild',
  seoDesc: '免费在线 CSV 清洗：移除空行、重复行、首尾空白……（自然描述，不要堆砌关键词）',
  keywords: ['CSV 清洗', 'csv cleaner'],
  howto: { steps: ['第一步…', '第二步…', '第三步…'] },
  faqs: [
    { q: '问题一？', a: '回答一。' },
    { q: '问题二？', a: '回答二。' },
    { q: '问题三？', a: '回答三。' },
  ],
  ui: {
    inputLabel: '原始 CSV', outputLabel: '清洗结果',
    runLabel: '开始清洗', hint: '文件不会上传服务器',
    // 该文件脚本里用到的所有 msg('xxx') 键都放在这里
  },
},
```

说明：

- `ui` 会被注入到页面 `<html data-ui>`，客户端脚本通过 `msg('键名')` 取当前语言文案，**脚本里不要硬编码中文或英文**。
- 英文文件是 fallback 层：中文漏写某个键时会自动显示英文，不会报错，但交付前建议补齐。
- `faqs` 至少 3 条、`howto.steps` 至少 3 步，构建校验脚本会检查。
- SEO 标题与描述要针对该工具单独撰写，不要批量复制。

---

## 步骤 3：写 UI 组件

新建 `src/tools/<category>/<slug>.astro`：

```astro
---
import Icon from '../../components/Icon.astro';
const { dict, tool } = Astro.props;
const ui = tool.ui, a = dict.actions;
---
<div class="tool-ui">
  <div class="tool-columns">
    <div class="field">
      <label for="x-input">{ui.inputLabel}</label>
      <textarea id="x-input" class="textarea" data-role="input" placeholder="…"></textarea>
    </div>
    <div class="field">
      <div class="output-head">
        <span class="field-label">{ui.outputLabel}</span>
        <button type="button" class="btn btn-ghost btn-sm" data-role="copy">
          <Icon name="copy" size={14} /> {a.copy}
        </button>
      </div>
      <textarea class="textarea" data-role="output" readonly></textarea>
    </div>
  </div>
  <div class="tool-actions">
    <button type="button" class="btn btn-primary" data-role="run">{ui.runLabel}</button>
    <button type="button" class="btn btn-outline" data-role="download" disabled>{a.download}</button>
    <button type="button" class="btn btn-ghost" data-role="clear">{a.clear}</button>
  </div>
  <div class="alert alert-error" data-role="error" hidden></div>
  <div class="status-line" data-role="status"></div>
</div>
```

约定：

- 统一使用 `data-role` 而不是 id，脚本里用 `role('input')` / `role('output')` 取值。
- 必须提供：输入区、**操作按钮**、结果区、清空/重置、错误提示（`data-role="error"`）、复制或下载（适用时）。
- 复用 `global.css` 中的类：`.field / .input / .textarea / .select / .btn / .option-row / .stat-grid / .preview-box / .file-drop` 等，保持视觉统一。
- `ToolShell.astro` 已自动提供 H1、使用说明、FAQ、相关工具、隐私说明、收藏按钮与 JSON-LD，无需重复编写。

---

## 步骤 4：写客户端逻辑

新建 `src/scripts/tools/<slug>.js`，**默认导出 init 函数**：

```js
import { role, on, msg, showError, clearError, setStatus, bindCommonActions, downloadText } from '../utils.js';

export default function init() {
  const input = role('input'), output = role('output'), dl = role('download');

  on(role('run'), 'click', () => {
    clearError();
    if (!input.value.trim()) { showError(msg('pleaseInput')); return; }
    const result = input.value.split('\n').filter((l) => l.trim()).join('\n');
    output.value = result;
    dl.disabled = false;
    setStatus(`${result.split('\n').length} 行`);
  });

  bindCommonActions({
    getCopyText: () => output.value,                       // 自动绑定 data-role="copy"
    getDownload: () => downloadText(output.value, 'result.txt'), // 自动绑定 data-role="download"
    onClear: () => { dl.disabled = true; setStatus(''); },      // 自动绑定 data-role="clear"
  });
}
```

要点：

- `tool-runner.js` 通过 `import.meta.glob('./tools/*.js')` 按 `data-tool` **只加载当前工具的脚本**，Vite 会为它生成独立 chunk；无需在页面里手动引入。
- 复杂算法请抽成纯函数放到 `src/scripts/logic/`，并在 `tests/` 里加单元测试（浏览器与 Node 都能运行）。
- 大依赖（pdf-lib / xlsx / jszip / qrcode）用 `await import('...')` 动态加载，避免拖慢其他页面。
- 文件处理必须走 `FileReader` / Canvas / `pdf-lib` 等浏览器本地 API，**禁止上传**；用 `validateFile()` 校验类型与大小。
- 动态生成的文本一律用 `textContent`，不要用 `innerHTML` 拼接用户输入。
- 文件下载用 `downloadBlob()` / `downloadText()` / `downloadDataUrl()`。

---

## 步骤 5：自检与验证

```bash
npm run check:project   # 组件/脚本/双语文案/图标齐全
npm test                # 纯逻辑单测
npm run build           # 若组件缺失会直接报错，不会生成空页面
npm run verify          # SEO / hreflang / sitemap / 结构化数据
npm run smoke           # 真实浏览器交互（可为新工具追加一条用例）
```

构建成功后会自动新增：

- `/zh/tools/<slug>/` 与 `/en/tools/<slug>/` 两个页面（含 canonical、hreflang、JSON-LD）
- sitemap.xml 中两条 URL
- 首页「最近新增」、分类页、相关工具内链、搜索索引中的对应条目

---

## 参考实现

| 场景 | 参考文件 |
|---|---|
| 实时统计 | `src/tools/text/word-counter.astro` + `src/scripts/tools/word-counter.js` |
| 选项 + 结果 + 下载 | `src/tools/text/remove-duplicate-lines.astro` |
| Canvas 图片处理 | `src/tools/image/image-compressor.astro` + `src/scripts/image-utils.js` |
| 多文件 + 排序 + PDF | `src/tools/files/merge-pdf.astro` + `src/scripts/file-utils.js` |
| 实时计算器 | `src/tools/calculators/unit-converter.astro` |
| 动态大依赖 + 双格式下载 | `src/tools/productivity/qr-code-generator.astro` |

第二阶段储备工具（FOB 报价、CBM 体积、AI 邮件润色等）已在 `src/data/tools.js` 的 `roadmap` 中列出，按上述流程逐个实现即可。
