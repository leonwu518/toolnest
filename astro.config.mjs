import { defineConfig } from 'astro/config';

// 正式域名 www.toolwild.com，用于 canonical / hreflang / sitemap
// 部署时可用环境变量 SITE_URL 覆盖，例如 SITE_URL=https://www.toolwild.com
const SITE_URL = process.env.SITE_URL || 'https://www.toolwild.com';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
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
