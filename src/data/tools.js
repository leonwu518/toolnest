// 工具注册表 —— 新增工具的第 1 步：在此追加一条记录。
// slug 同时决定：页面 URL、Astro UI 组件路径、客户端脚本路径、i18n 键名。
//   UI:      src/tools/<category>/<slug>.astro
//   Script:  src/scripts/tools/<slug>.js
//   i18n:    src/i18n/{zh,en}.js -> tools.<slug>
export const tools = [
  // ---------- A. 文本工具 ----------
  { slug: 'word-counter',           category: 'text',         icon: 'type',        popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-08' },
  { slug: 'remove-duplicate-lines', category: 'text',         icon: 'list-filter', popular: false, recommended: false, isNew: false, addedAt: '2025-01-08' },
  { slug: 'case-converter',         category: 'text',         icon: 'case-upper',  popular: false, recommended: true,  isNew: false, addedAt: '2025-01-08' },
  { slug: 'text-diff',              category: 'text',         icon: 'git-compare', popular: false, recommended: false, isNew: true,  addedAt: '2025-03-12' },
  { slug: 'json-formatter',         category: 'text',         icon: 'braces',      popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-08' },

  // ---------- B. 图片工具 ----------
  { slug: 'image-compressor',       category: 'image',        icon: 'minimize-2',  popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-15' },
  { slug: 'image-resizer',          category: 'image',        icon: 'maximize-2',  popular: true,  recommended: false, isNew: false, addedAt: '2025-01-15' },
  { slug: 'image-converter',        category: 'image',        icon: 'refresh-cw',  popular: false, recommended: false, isNew: false, addedAt: '2025-01-22' },

  // ---------- C. 文件工具 ----------
  { slug: 'merge-pdf',              category: 'files',        icon: 'files',       popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-22' },
  { slug: 'split-pdf',              category: 'files',        icon: 'scissors',    popular: false, recommended: false, isNew: false, addedAt: '2025-02-04' },
  { slug: 'image-to-pdf',           category: 'files',        icon: 'file-image',  popular: true,  recommended: true,  isNew: false, addedAt: '2025-02-04' },
  { slug: 'excel-to-csv',           category: 'files',        icon: 'table',       popular: false, recommended: false, isNew: true,  addedAt: '2025-03-12' },

  // ---------- D. 计算器 ----------
  { slug: 'percentage-calculator',  category: 'calculators',  icon: 'percent',     popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-08' },
  { slug: 'profit-margin-calculator', category: 'calculators', icon: 'trending-up', popular: false, recommended: false, isNew: false, addedAt: '2025-02-18' },
  { slug: 'unit-converter',         category: 'calculators',  icon: 'ruler',       popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-15' },
  { slug: 'date-calculator',        category: 'calculators',  icon: 'calendar-days', popular: false, recommended: false, isNew: true,  addedAt: '2025-03-12' },

  // ---------- E. 开发工具 ----------
  { slug: 'url-encoder-decoder',    category: 'developer',    icon: 'link',        popular: false, recommended: false, isNew: false, addedAt: '2025-02-18' },
  { slug: 'base64-encoder-decoder', category: 'developer',    icon: 'binary',      popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-15' },
  { slug: 'color-converter',        category: 'developer',    icon: 'palette',     popular: false, recommended: false, isNew: false, addedAt: '2025-02-18' },

  // ---------- F. 效率工具 ----------
  { slug: 'qr-code-generator',      category: 'productivity', icon: 'qr-code',        popular: true,  recommended: true,  isNew: false, addedAt: '2025-01-22' },
  { slug: 'excel-formula-helper',   category: 'productivity', icon: 'function-square', popular: false, recommended: false, isNew: true,  addedAt: '2026-11-27' },
  { slug: 'csv-cleaner',            category: 'productivity', icon: 'list-checks',    popular: false, recommended: false, isNew: true,  addedAt: '2026-11-27' },
  { slug: 'batch-text-processor',   category: 'productivity', icon: 'layers',         popular: false, recommended: false, isNew: true,  addedAt: '2026-11-27' },
];

export const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));
export const toolSlugs = tools.map((t) => t.slug);

export const toolsByCategory = (id) => tools.filter((t) => t.category === id);
export const popularTools = () => tools.filter((t) => t.popular);
export const recommendedTools = () => tools.filter((t) => t.recommended);
export const newTools = () => [...tools].filter((t) => t.isNew).sort((a, b) => b.addedAt.localeCompare(a.addedAt));

// 相关工具：同分类优先，再按注册顺序补齐，最多 6 个（保证内链结构合理）
export function relatedTools(slug, limit = 6) {
  const current = toolBySlug[slug];
  if (!current) return [];
  const same = tools.filter((t) => t.category === current.category && t.slug !== slug);
  const rest = tools.filter((t) => t.category !== current.category && t.slug !== slug);
  return [...same, ...rest].slice(0, limit);
}

// 第二阶段储备工具（仅用于分类页展示路线图，不生成页面、不伪装成可用工具）
export const roadmap = {
  business: ['fob-quote-calculator', 'trade-profit-calculator', 'moq-quote-calculator', 'cbm-calculator', 'carton-quantity-calculator', 'gross-net-weight-calculator', 'product-cost-calculator', 'lead-time-calculator'],
  ai: ['email-polisher', 'product-title-generator', 'selling-points-generator', 'seo-keyword-generator', 'prompt-generator'],
  // productivity 三个工具（Excel 公式助手 / CSV 数据清洗 / 批量文本处理）已上线，从路线图移除
};
