# ToolNest 部署说明（Cloudflare Pages）

**正式域名：`https://www.toolwild.com`**

网站是**纯静态站点**（Astro `output: 'static'`），构建产物为 `dist/`，不需要服务器、数据库或付费 API。Cloudflare Pages 免费套餐即可承载。

---

## 一、站点配置（代码里已完成）

| 配置项 | 当前值 | 说明 |
|---|---|---|
| `SITE_URL` 默认值 | `https://www.toolwild.com` | `astro.config.mjs`、`src/lib/site.js`、工具页兜底值均为该域名；canonical、hreflang、`sitemap.xml`、`og:url`、JSON-LD 全部跟随它 |
| 环境变量覆盖 | `SITE_URL` | 部署平台仍建议显式设置为 `https://www.toolwild.com`，换域名时改这里并重新构建 |
| 联系邮箱 | `hello@toolwild.com` | `src/pages/[lang]/[page].astro` 中反馈/建议表单生成 `mailto:` 草稿；需在该域名配置邮箱或邮件转发后才能真正收信 |

本地验证：`SITE_URL=https://www.toolwild.com npm run build && npm run verify`。

---

## 二、域名解析（DNS）

### 当前状态（已实测）

| 项目 | 结果 |
|---|---|
| 权威 DNS（NS） | `launch1.spaceship.net`、`launch2.spaceship.net` → 域名 DNS 托管在 **Spaceship** |
| `toolwild.com`（根域） | 有 A 记录 `34.216.117.25` / `54.149.79.189`，HTTP 200、HTTPS 不可用 → 注册商停放页 |
| `www.toolwild.com` | `NXDOMAIN`，**尚未添加任何解析记录** |

### 方案 A（推荐，改动最小）：只启用 `www`

1. 先在 **Cloudflare Pages 项目 → Custom domains → Set up a domain** 输入 `www.toolwild.com` 并继续。
   **必须先在后台发起绑定**；只手动加 CNAME 而不关联域名会导致访问返回 `522`。
2. 后台会给出 CNAME 的目标值，格式为 `<项目名>.pages.dev`（本项目默认 `toolnest.pages.dev`，以 Cloudflare 实际显示为准）。
3. 登录 [Spaceship](https://www.spaceship.com/) → **Advanced DNS** → 选中 `toolwild.com` → **Add record**：

   | Type | Name | Points to | TTL |
   |---|---|---|---|
   | `CNAME` | `www` | `toolnest.pages.dev` | 3600 |

   `Name` 只填 `www`，不要填完整域名，Spaceship 会自动补全。
4. 回到 Cloudflare 等待自定义域状态变为 **Active**（证书自动签发，通常几分钟到几小时）。
5. 根域 `toolwild.com`：在 Spaceship 用 **URL Forwarding** 设 301 跳转到 `https://www.toolwild.com`。
   不建议直接把根域 CNAME 指向 Pages —— Cloudflare 规定 apex 域必须先成为 Cloudflare zone，见方案 B。

### 方案 B（根域也交给 Cloudflare，可用 apex 作为主域）

1. Cloudflare Dashboard → **Add a site** → 输入 `toolwild.com`，记下分配的两个 nameservers。
2. Spaceship → 把 Nameservers 改为 **Custom**，填入这两个值。生效后 DNS 记录全部在 Cloudflare 管理，Spaceship 里的记录不再生效。
3. Pages → **Custom domains** 添加 `toolwild.com`（apex，Cloudflare 会自动创建 CNAME）与 `www.toolwild.com`。
4. 用 Cloudflare **Redirect Rules** 把根域与 `www` 统一到规范域名；同时把 `SITE_URL` 改成最终选定的规范域名并重新构建。

> 本项目当前固定以 `www.toolwild.com` 为规范域名。若改用 apex，需要同步修改 `astro.config.mjs`、`src/lib/site.js` 与 `src/pages/[lang]/tools/[slug].astro` 的默认值，否则 canonical 会与访问域名不一致。

### 验证解析是否生效

```bash
# 查 CNAME（阿里云 DoH，国内可用）
curl -s "https://dns.alidns.com/resolve?name=www.toolwild.com&type=CNAME"
# 查站点与安全头
curl -I https://www.toolwild.com/
curl -s https://www.toolwild.com/robots.txt
curl -s https://www.toolwild.com/sitemap.xml | grep -c "<loc>"
```

预期：CNAME 返回指向 `*.pages.dev`；`canonical`、`og:url`、sitemap 的 `<loc>` 与 `xhtml:link` 均为 `https://www.toolwild.com/...`。

---

## 三、方式 A：Git 仓库连接（推荐）

1. 把项目推送到 GitHub（仓库 `leonwu518/toolnest`，分支 `main`）：
   ```bash
   git remote add origin https://github.com/leonwu518/toolnest.git
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
   - `SITE_URL` = `https://www.toolwild.com`（Production 与 Preview 均可设置）
   - `NODE_VERSION` = `22`
6. 点击 **Save and Deploy**。首次构建约 1–2 分钟，完成后会分配 `*.pages.dev` 域名。
7. 按[第二节](#二域名解析dns)绑定 `www.toolwild.com`。

> 以后每次 `git push` 到 main 都会自动构建并发布；Pull Request 会生成预览环境。

---

## 四、方式 B：Wrangler CLI 直接上传（不用 Git）

```bash
npm install -D wrangler          # 或使用 npx，不必写入依赖
npx wrangler login
SITE_URL=https://www.toolwild.com npm run build
npx wrangler pages deploy dist --project-name toolnest --branch main
```

首次执行会提示创建项目。适合本地一键发布或 CI 脚本。

---

## 五、方式 C：GitHub Actions（可选）

仓库中已提供 `.github/workflows/deploy.yml`。需要在 GitHub 仓库
**Settings → Secrets and variables → Actions** 中添加：

| 名称 | 类型 | 说明 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API Token，需含「Cloudflare Pages: Edit」权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare Account ID |
| `SITE_URL` | Variable | `https://www.toolwild.com` |

工作流会自动执行：安装依赖 → 单元测试 → 完整性自检 → 构建 → 产物校验。
仅在配置了 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID` 后才继续部署到 Cloudflare Pages；
未配置时工作流仍完成全部构建验证并标记成功，不会留下失败记录。

若使用方式 A 的 Git 集成，请勿同时启用此工作流，避免重复部署。

---

## 六、部署后验证清单

- [ ] `https://www.toolwild.com/` 自动跳转到 `/zh/` 或 `/en/`
- [ ] `https://toolwild.com/` 301 跳转到 `https://www.toolwild.com/`（或按方案 B 反向统一）
- [ ] 中英文切换后停留在同一工具页面（例如 `/zh/tools/merge-pdf/` ↔ `/en/tools/merge-pdf/`）
- [ ] 页面源码中的 `canonical` 与 `hreflang` 指向 `https://www.toolwild.com`
- [ ] `https://www.toolwild.com/sitemap.xml` 可访问，包含 79 条 URL
- [ ] `https://www.toolwild.com/robots.txt` 中的 Sitemap 地址为 `https://www.toolwild.com/sitemap.xml`
- [ ] 深色模式、收藏、最近使用、备份导出/导入功能正常
- [ ] 手机端打开首页与工具页无横向滚动
- [ ] 任意一个 PDF / 图片工具确认完整本地处理（浏览器开发者工具 Network 中不出现文件上传请求）
- [ ] 安全响应头生效（`curl -I https://www.toolwild.com/` 查看 `content-security-policy`）

### 提交搜索引擎

- Google Search Console：添加资源 → 站点地图 → 提交 `sitemap.xml`
- Bing Webmaster Tools：导入 Google 数据或直接提交 sitemap
- 百度搜索资源平台：普通收录 → sitemap → 提交 `sitemap.xml`

---

## 七、安全头与缓存（public/_headers）

```
/*            CSP、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy
/assets/*     Cache-Control: public, max-age=31536000, immutable（Astro 带哈希的静态资源）
```

CSP 允许 `'unsafe-inline'` 脚本，仅用于 `<head>` 中防止主题闪烁的极小内联脚本；其余脚本均来自同源静态资源。
如果后续接入统计脚本，需要把对应域名加入 `script-src` / `connect-src`。

---

## 八、常见问题

| 现象 | 原因与处理 |
|---|---|
| `www.toolwild.com` 返回 `522` | 只手动加了 CNAME、没有先在 Pages 后台 **Custom domains** 发起绑定；先在后台关联域名再改 DNS |
| 自定义域长期停在 `Pending` / 证书未签发 | 检查 CNAME 是否生效、是否存在限制 CA 的 CAA 记录；Spaceship 的停放 A 记录不影响 `www` |
| `www` 仍显示注册商停放页 | CNAME 尚未生效或填成了完整域名（`www.toolwild.com`）；`Name` 只需填 `www` |
| canonical 指向别的域名 | 设置了不同的 `SITE_URL` 或设置后未重新构建；生产环境变量统一为 `https://www.toolwild.com` |
| 根域直接 CNAME 到 Pages 不生效 | Cloudflare 要求 apex 域先加入 Cloudflare zone 并改 NS；根域改用 URL Forwarding 或走方案 B |
| 构建报错 `Node version` | 在环境变量中设 `NODE_VERSION=22`，本机需 Node ≥ 20.3 |
| 直接打开 `dist/zh/tools/x/index.html` 样式丢失 | 静态站点需通过 HTTP 访问（资源为根路径 `/_astro/...`），用 `npm run preview` 或部署后访问 |
| PDF / Excel 工具首次点击稍慢 | 对应库按需动态加载（gzip 约 180 KB），仅首次加载，之后浏览器缓存 |
| 反馈表单点击无反应 | 表单生成 `mailto:` 草稿，需要本机已配置邮件客户端；请为 `hello@toolwild.com` 配置实际收信 |

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
