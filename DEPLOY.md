# ToolNest 部署说明（Cloudflare Pages）

网站是**纯静态站点**（Astro `output: 'static'`），构建产物为 `dist/`，不需要服务器、数据库或付费 API。Cloudflare Pages 免费套餐即可承载。

---

## 一、部署前必须做的两件事

1. **设置正式域名**：在 Cloudflare Pages 项目环境变量中添加 `SITE_URL=https://你的域名`。
   该值用于 canonical、hreflang 与 `sitemap.xml`。未设置时默认是 `https://toolnest.pages.dev`。
   修改后必须重新构建（重新部署一次即可）。
2. **替换联系邮箱**：`src/pages/[lang]/[page].astro` 中的 `hello@toolnest.example.com` 是占位地址，
   反馈表单与建议工具表单会用它生成 mailto 草稿。请改成你的真实邮箱。

---

## 二、方式 A：Git 仓库连接（推荐）

1. 把项目推送到 GitHub（仓库可以是私有的）：
   ```bash
   git init
   git add .
   git commit -m "ToolNest initial release"
   git remote add origin https://github.com/<你的账号>/toolnest.git
   git push -u origin main
   ```
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
3. 选择 GitHub 与刚才的仓库，点击 **Begin setup**。
4. 构建配置：

   | 配置项 | 值 |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `Astro`（或选 `None` 后手动填写下面两项） |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | （留空） |
   | Node.js version | `22`（在项目设置 → Environment variables 中添加 `NODE_VERSION = 22`） |

5. 环境变量（**Settings → Environment variables**）：
   - `SITE_URL` = `https://你的域名`（Production 与 Preview 均可设置）
   - `NODE_VERSION` = `22`
6. 点击 **Save and Deploy**。首次构建约 1–2 分钟，完成后会分配 `*.pages.dev` 域名。
7. **自定义域名**：项目 → **Custom domains** → **Set up a custom domain**，按提示添加 DNS 记录（Cloudflare 托管的域名会自动配置）。
   绑定后把 `SITE_URL` 改成自定义域名并重新部署一次。

> 以后每次 `git push` 到 main 都会自动构建并发布；Pull Request 会生成预览环境。

---

## 三、方式 B：Wrangler CLI 直接上传（不用 Git）

```bash
npm install -D wrangler          # 或使用 npx，不必写入依赖
npx wrangler login
SITE_URL=https://你的域名 npm run build
npx wrangler pages deploy dist --project-name toolnest --branch main
```

首次执行会提示创建项目。适合本地一键发布或 CI 脚本。

---

## 四、方式 C：GitHub Actions（可选）

仓库中已提供 `.github/workflows/deploy.yml`。需要在 GitHub 仓库
**Settings → Secrets and variables → Actions** 中添加：

| 名称 | 类型 | 说明 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API Token，需含「Cloudflare Pages: Edit」权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare Account ID |
| `SITE_URL` | Variable | 正式域名，例如 `https://toolnest.example.com` |

工作流会自动执行：安装依赖 → 单元测试 → 完整性自检 → 构建 → 部署到 Cloudflare Pages。
若使用方式 A 的 Git 集成，请勿同时启用此工作流，避免重复部署。

---

## 五、部署后验证清单

- [ ] `https://你的域名/` 自动跳转到 `/zh/` 或 `/en/`
- [ ] 中英文切换后停留在同一工具页面（例如 `/zh/tools/merge-pdf/` ↔ `/en/tools/merge-pdf/`）
- [ ] 页面源码中的 `canonical` 与 `hreflang` 指向正式域名
- [ ] `https://你的域名/sitemap.xml` 可访问，包含 73 条 URL
- [ ] `https://你的域名/robots.txt` 中的 Sitemap 地址正确
- [ ] 深色模式、收藏、最近使用、备份导出/导入功能正常
- [ ] 手机端打开首页与工具页无横向滚动
- [ ] 任意一个 PDF / 图片工具确认完整本地处理（浏览器开发者工具 Network 中不出现文件上传请求）
- [ ] 安全响应头生效（可用 `curl -I https://你的域名/` 查看 `content-security-policy`）

### 提交搜索引擎

- Google Search Console：添加资源 → 站点地图 → 提交 `sitemap.xml`
- Bing Webmaster Tools：导入 Google 数据或直接提交 sitemap
- 百度搜索资源平台：普通收录 → sitemap → 提交 `sitemap.xml`
  （百度对 `*.pages.dev` 抓取可能较慢，建议绑定自定义域名后再提交）

---

## 六、安全头与缓存（public/_headers）

```
/*            CSP、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy
/assets/*     Cache-Control: public, max-age=31536000, immutable（Astro 带哈希的静态资源）
```

CSP 允许 `'unsafe-inline'` 脚本，仅用于 `<head>` 中防止主题闪烁的极小内联脚本；其余脚本均来自同源静态资源。
如果后续接入统计脚本，需要把对应域名加入 `script-src` / `connect-src`。

---

## 七、常见问题

| 现象 | 原因与处理 |
|---|---|
| canonical 仍指向 `toolnest.pages.dev` | 未设置 `SITE_URL` 或设置后未重新构建 |
| 构建报错 `Node version` | 在环境变量中设 `NODE_VERSION=22`，本机需 Node ≥ 20.3 |
| 直接打开 `dist/zh/tools/x/index.html` 样式丢失 | 静态站点需通过 HTTP 访问（资源为根路径 `/_astro/...`），用 `npm run preview` 或部署后访问 |
| PDF / Excel 工具首次点击稍慢 | 对应库按需动态加载（gzip 约 180 KB），仅首次加载，之后浏览器缓存 |
| 反馈表单点击无反应 | 表单生成 `mailto:` 草稿，需要本机已配置邮件客户端；请替换占位邮箱 |

---

## 附录：本地冒烟测试的素材

`npm run smoke` 会用 Chromium 真实上传文件。若 `/tmp/toolnest-fixtures` 不存在，可先生成：

```bash
python3 - <<'PY'
from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas
from openpyxl import Workbook
import os
d='/tmp/toolnest-fixtures'; os.makedirs(d, exist_ok=True)
img=Image.new('RGB',(800,600),(37,99,235)); ImageDraw.Draw(img).rectangle([100,100,700,500], fill='white')
img.save(d+'/test.png'); img.save(d+'/test.jpg'); img.save(d+'/test.webp')
for name,pages in [('a.pdf',2),('b.pdf',3)]:
    c=canvas.Canvas(d+'/'+name)
    for i in range(pages): c.drawString(72,720,f'{name} page {i+1}'); c.showPage()
    c.save()
wb=Workbook(); ws=wb.active; ws.append(['name','qty']); ws.append(['apple',10]); ws.append(['中文',20]); wb.save(d+'/test.xlsx')
PY
```
