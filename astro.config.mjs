import { defineConfig } from 'astro/config';

// 正式域名 www.toolwild.com，用于 canonical / hreflang / sitemap
// 部署时可用环境变量 SITE_URL 覆盖，例如 SITE_URL=https://www.toolwild.com
const SITE_URL = process.env.SITE_URL || 'https://www.toolwild.com';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  /* i18n：默认语言(简体中文 zh)走根目录，英文走 /en/，不再使用 /zh/ 前缀
   * Astro 5 用 locales 字符串数组 + defaultLocale 表示默认语言；
   * prefixDefaultLocale:false 即把默认语言页面放在 src/pages/ 根下。
   */
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
    fallback: { en: 'zh' },
  },
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      // pdf-lib / xlsx 等库按需动态加载，此处仅放宽提示阈值
      chunkSizeWarningLimit: 900,
    },
  },
});
