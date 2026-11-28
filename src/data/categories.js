import { tools } from './tools.js';

// 一级分类定义。新增分类只需在此追加一条，并在 i18n 中补充 categories.<id> 文案。
export const categories = [
  { id: 'text', icon: 'type', order: 1, accent: 'blue' },
  { id: 'image', icon: 'image', order: 2, accent: 'violet' },
  { id: 'files', icon: 'file-stack', order: 3, accent: 'amber' },
  { id: 'calculators', icon: 'calculator', order: 4, accent: 'emerald' },
  { id: 'ai', icon: 'sparkles', order: 5, accent: 'rose' },
  { id: 'developer', icon: 'code', order: 6, accent: 'cyan' },
  { id: 'productivity', icon: 'zap', order: 7, accent: 'indigo' },
  { id: 'business', icon: 'globe', order: 8, accent: 'orange' },
];

export const categoryIds = categories.map((c) => c.id);
export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

/** 已上线的分类：至少有一个工具。导航、首页与 sitemap 只展示这些，规划中分类不产生空页面。 */
export const activeCategories = categories.filter((c) => tools.some((t) => t.category === c.id));
export const activeCategoryIds = activeCategories.map((c) => c.id);
