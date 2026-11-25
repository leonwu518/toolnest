# ToolNest — A Smart Toolbox for Everyday Work

一个面向中国及全球用户的**免费在线工具平台**：文本、图片、PDF/文件、计算器、开发工具与效率工具，全部在浏览器本地处理，不上传文件、无需注册、无后端、无付费 API。

- 框架：Astro 5（静态生成）+ 原生 HTML / CSS / JavaScript
- 图标：Lucide（构建期内联为静态 SVG，运行时零图标 JS）
- 依赖：`pdf-lib`（PDF）、`xlsx` / SheetJS（Excel）、`jszip`（打包）、`qrcode`（二维码），均**按需动态加载**
- 部署：Cloudflare Pages 等任意静态托管
- 双语：`/zh/` 与 `/en/` 独立路由、独立 Title/Description、canonical + hreflang

---

## 一、快速开始

环境要求：Node.js ≥ 20.3（本项目在 v22.13 上开发与测试）。

```bash
npm install          # 安装依赖
npm run dev          # 本地开发，默认 http://localhost:4321
npm run build        # 静态构建，输出到 dist/
npm run preview      # 预览构建产物
```

打开 `http://localhost:4321/` 会自动根据浏览器语言/本地偏好跳转到 `/zh/` 或 `/en/`（加 `?noauto` 可停留在语言选择页）。

### 测试与自检

| 命令 | 作用 |
|---|---|
| `npm test` | 23 项纯逻辑单元测试（文本、编码、计算、单位、日期、颜色、文件） |
| `npm run check:project` | 校验 20 个工具的组件/脚本/中英文文案/Lucide 图标是否齐全 |
| `npm run build` | 生成 73 个静态页面 |
| `npm run verify` | 校验构建产物的 SEO 元信息、hreflang、结构化数据、sitemap、JS 分包 |
| `npm run smoke` | 真实 Chromium 交互测试：20 个工具功能、下载、双语、主题、收藏、移动端布局 |
| `npm run gen:icons` | 从 `lucide-static` 重新生成 `src/data/icons.json` |

> `npm run smoke` 需要系统安装 Chromium（`/usr/bin/chromium`）与测试素材；脚本会自动启动本地静态服务器，素材可用 `scripts/` 中的 Python 片段生成（见部署文档附录）。

---

## 二、目录结构

```
src/
├── components/          # Header / Footer / ToolCard / SearchBox / LanguageSwitch
│   ├── ToolShell.astro  #   工具页统一模板：面包屑、H1、收藏、说明、FAQ、相关工具、JSON-LD
│   ├── Icon.astro       #   静态内联 Lucide 图标
│   └── ...
├── layouts/MainLayout.astro   # HTML 骨架：主题初始化、SEO、搜索索引、客户端文案注入
├── data/
│   ├── tools.js         # ★ 工具注册表（新增工具第 1 步）
│   ├── categories.js    # 八大分类
│   └── icons.json       # 构建期生成的 Lucide 图标数据
├── i18n/
│   ├── zh.js / en.js            # 站点级文案（导航、首页、页脚、辅助页）
│   ├── zh-tools.js / en-tools.js# ★ 20 个工具的名称/SEO/说明/FAQ/界面文案
│   └── index.js                 # 字典合并与 fallback
├── lib/site.js          # URL 生成、canonical、hreflang、语言切换
├── scripts/
│   ├── site-client.js   # 全站交互：主题、菜单、搜索、收藏、最近使用、首页个人区块
│   ├── storage.js       # localStorage 封装（只存工具标识与偏好，不存文件内容）
│   ├── utils.js         # DOM / 复制 / 下载 / 文件校验 / Toast / 文案 msg()
│   ├── tool-runner.js   # 按 data-tool 动态 import 对应工具脚本（每工具独立 chunk）
│   ├── image-utils.js / file-utils.js   # 图片与文件工具共用逻辑
│   ├── logic/*.js       # 纯函数核心算法（可被 Node 单测）
│   └── tools/*.js       # ★ 20 个工具的客户端逻辑（每个 0.7–5 KB）
├── tools/               # ★ 20 个工具的 UI 组件，按分类分目录
│   ├── text/  image/  files/  calculators/  developer/  productivity/
├── styles/global.css    # 设计系统：浅/深主题、响应式、统一控件
└── pages/
    ├── index.astro                    # 根路径语言选择页
    ├── [lang]/index.astro             # 双语首页
    ├── [lang]/tools/[slug].astro      # 40 个工具页（20 工具 × 2 语言）
    ├── [lang]/category/[category].astro # 16 个分类页
    ├── [lang]/[page].astro            # 14 个辅助页
    ├── sitemap.xml.js / robots.txt.js # SEO 端点
public/                  # favicon.svg、_headers（安全头 / 缓存）
scripts/                 # 自检、构建校验、冒烟测试、图标生成
tests/                   # 单元测试
```

---

## 三、首批 20 个工具

| 分类 | 工具 | 中文路由 |
|---|---|---|
| 文本 | Word Counter 字数统计 | `/zh/tools/word-counter/` |
| 文本 | Remove Duplicate Lines 文本去重 | `/zh/tools/remove-duplicate-lines/` |
| 文本 | Case Converter 大小写转换 | `/zh/tools/case-converter/` |
| 文本 | Text Diff 文本对比 | `/zh/tools/text-diff/` |
| 文本 | JSON Formatter 格式化 | `/zh/tools/json-formatter/` |
| 图片 | Image Compressor 图片压缩 | `/zh/tools/image-compressor/` |
| 图片 | Image Resizer 尺寸调整 | `/zh/tools/image-resizer/` |
| 图片 | Image Converter 格式转换 | `/zh/tools/image-converter/` |
| 文件 | Merge PDF 合并 | `/zh/tools/merge-pdf/` |
| 文件 | Split PDF 拆分 | `/zh/tools/split-pdf/` |
| 文件 | Image to PDF 图片转 PDF | `/zh/tools/image-to-pdf/` |
| 文件 | Excel to CSV | `/zh/tools/excel-to-csv/` |
| 计算器 | Percentage Calculator 百分比 | `/zh/tools/percentage-calculator/` |
| 计算器 | Profit Margin Calculator 利润率 | `/zh/tools/profit-margin-calculator/` |
| 计算器 | Unit Converter 单位换算 | `/zh/tools/unit-converter/` |
| 计算器 | Date Calculator 日期计算 | `/zh/tools/date-calculator/` |
| 开发 | URL Encoder / Decoder | `/zh/tools/url-encoder-decoder/` |
| 开发 | Base64 Encoder / Decoder | `/zh/tools/base64-encoder-decoder/` |
| 开发 | Color Converter 颜色转换 | `/zh/tools/color-converter/` |
| 效率 | QR Code Generator 二维码 | `/zh/tools/qr-code-generator/` |

把 `/zh/` 换成 `/en/` 即为英文页面，共 40 个工具页。AI 工具与外贸工厂工具为第二阶段规划，在对应分类页展示路线图，**没有伪装成可用功能**。

---

## 四、个人使用体验（全部本地）

- 收藏工具、最近使用、常用工具排序（按使用次数）、深色模式记忆、语言偏好 → `localStorage`
- `/zh/data/` 与 `/en/data/` 提供：状态查看、**备份导出 JSON**、**备份导入恢复**、**一键清除所有本地数据**
- 不保存任何用户输入的文本、图片、PDF、Excel 等文件内容
- 收藏与最近使用区块在首页自动渲染；切换语言停留在当前工具页面

---

## 五、SEO 与安全

- 每个工具页：独立 Title / Meta Description、单一 H1、使用说明、3 条以上 FAQ、相关工具内链、`SoftwareApplication` + `FAQPage` + `BreadcrumbList` 结构化数据
- 每页 canonical、zh / en / x-default hreflang、Open Graph、WebSite JSON-LD
- `sitemap.xml`（73 条 URL，含 hreflang）、`robots.txt`、语义化内部链接
- 静态生成、工具脚本按工具独立分包；`pdf-lib` / `xlsx` / `jszip` / `qrcode` 仅在使用对应工具时加载
- `public/_headers`：CSP、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy、资源长期缓存
- 文件类型与大小校验；所有动态文本使用 `textContent` / 转义，避免 HTML 注入；前端不含任何 API 密钥

---

## 六、配置

复制 `.env.example` 为 `.env` 或修改部署环境变量：

```
SITE_URL=https://your-domain.com
```

`SITE_URL` 决定 canonical、hreflang 与 sitemap 中的绝对地址。**部署到正式域名后必须设置并重新构建**，否则默认使用 `https://toolnest.pages.dev`。

联系邮箱为占位地址 `hello@toolnest.example.com`，位于 `src/pages/[lang]/[page].astro`（反馈/建议表单生成 mailto 草稿），上线前请替换为真实邮箱。

---

## 七、相关文档

- [Cloudflare Pages 部署说明](./DEPLOY.md)
- [新增工具操作指南](./ADDING-TOOLS.md)

开源依赖许可证：Astro（MIT）、pdf-lib（MIT）、SheetJS（Apache-2.0）、JSZip（MIT/GPLv3）、qrcode（MIT）、Lucide（ISC）。
