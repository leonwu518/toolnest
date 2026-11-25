import { defineConfig } from 'astro/config';

// 部署时通过环境变量 SITE_URL 指定正式域名，用于 canonical / hreflang / sitemap
// 例如 Cloudflare Pages: SITE_URL=https://your-domain.com
const SITE_URL = process.env.SITE_URL || 'https://toolnest.pages.dev';

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
