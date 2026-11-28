# ToolNest 部署说明（Cloudflare Pages）

**正式域名：`https://www.toolwild.com`**

网站是**纯静态站点**（Astro `output: 'static'`），构建产物为 `dist/`，不需要服务器、数据库或付费 API。Cloudflare Pages 免费套餐即可承载。

> ## ⚠️ 重要更正（2026-11-28 实测）
>
> **`toolnest.pages.dev` 不是本项目的站点，而是第三方已占用的 React 应用**（页面加载 `/static/js/main.c8078379.js`、`manifest.json`，标题 `ToolNest`，与本项目 Astro 产物无关）。该子域是 Cloudflare Pages 的全局命名空间，先到先得。
>
> **绝对不要把 `www.toolwild.com` 的 CNAME 指向 `toolnest.pages.dev`**，否则域名会打开别人的网站。
>
> 本项目目前**只推送到了 GitHub，尚未部署到 Cloudflare Pages**。必须先创建自己的 Pages 项目、拿到后台分配的 `<项目名>.pages.dev`，再做域名绑定。正确顺序见下：
>
> **① 部署站点（第三节）→ ② 后台绑定自定义域（第四节）→ ③ Spaceship 写 CNAME → ④ 根域 301**

---

## 一、当前状态（实测）

| 项目 | 结果 |
|---|---|
| 权威 DNS（NS） | `launch1.spaceship.net`、`launch2.spaceship.net` → DNS 托管在 **Spaceship** |
| `toolwild.com`（根域） | A 记录 `34.216.117.25` / `54.149.79.189`，HTTP 200、HTTPS 不可用 → 注册商停放页 |
| `www.toolwild.com` | `NXDOMAIN`，**尚未添加任何解析记录** |
| `toolnest.pages.dev` | 已有 A 记录，返回第三方 React SPA，**不可作为 CNAME 目标** |
| `toolwild.pages.dev` | `NXDOMAIN`（空闲），推荐用作本项目名 |
| GitHub 仓库 | `leonwu518/toolnest`，`main` = `fce82d2`，本地与远程一致；最新 CI `46107066201` 为 `success` |
| Cloudflare Pages | 尚未创建本项目；仓库未配置 `CLOUDFLARE_*` Secrets，CI 的部署步骤按设计跳过（构建验证仍全绿） |

---

## 二、代码侧已完成（无需再改）

| 配置项 | 当前值 | 说明 |
|---|---|---|
| `SITE_URL` 默认值 | `https://www.toolwild.com` | `astro.config.mjs`、`src/lib/site.js`、工具页兜底值均为该域名；canonical、hreflang、`sitemap.xml`、`og:url`、JSON-LD 全部跟随它 |
| 环境变量覆盖 | `SITE_URL` | 部署平台仍建议显式设置为 `https://www.toolwild.com` |
| 联系邮箱 | `hello@toolwild.com` | `src/pages/[lang]/[page].astro` 中反馈表单生成 `mailto:` 草稿；需配置邮箱或邮件转发才能真正收信 |
| Pages 项目名 | 默认 `toolwild` | `.github/workflows/deploy.yml` 用 `CLOUDFLARE_PROJECT_NAME` 变量覆盖，不再写死被占用的 `toolnest` |

本地验证：`SITE_URL=https://www.toolwild.com npm run build && npm run verify`。

---

## 三、第 1 步：把站点部署到 Cloudflare Pages

先完成部署，后台才会分配 `<项目名>.pages.dev`，这是后面 CNAME 的唯一正确目标值。

### 方式 A：Git 仓库连接（推荐，一次配置自动发布）

1. 代码已在 GitHub：`https://github.com/leonwu518/toolnest`，分支 `main`。
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**。
3. 选择 GitHub 与仓库 `leonwu518/toolnest`，点击 **Begin setup**。
4. 构建配置：

   | 配置项 | 值 |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `Astro`（或选 `None` 后手动填写下面两项） |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | （留空） |
   | Node.js version | `22` |

5. 环境变量（**Settings → Environment variables**）：
   - `SITE_URL` = `https://www.toolwild.com`（Production 与 Preview 均可设置）
   - `NODE_VERSION` = `22`
6. 项目名填 **`toolwild`**（实测该子域空闲）。若被占用，Cloudflare 会自动分配 `<项目名>-<随机>.pages.dev`，**以后台实际显示为准**。
7. 点击 **Save and Deploy**。首次构建约 1–2 分钟，完成后访问 `https://<项目名>.pages.dev/zh/` 确认是本项目的中英文页面。

> 以后每次 `git push` 到 `main` 都会自动构建并发布；Pull Request 会生成预览环境。
> 采用方式 A 时，请勿同时启用方式 C 的 GitHub Actions 部署，避免重复发布。

### 方式 B：Wrangler CLI 直接上传（不用 Git）

```bash
npm install -D wrangler          # 或使用 npx，不必写入依赖
npx wrangler login
SITE_URL=https://www.toolwild.com npm run build
npx wrangler pages deploy dist --project-name toolwild --branch main
```

首次执行会提示创建项目。适合本地一键发布。

### 方式 C：GitHub Actions（可选）

仓库已提供 `.github/workflows/deploy.yml`。在 GitHub 仓库
**Settings → Secrets and variables → Actions** 中添加：

| 名称 | 类型 | 说明 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API Token，需含「Cloudflare Pages: Edit」权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare Account ID |
| `SITE_URL` | Variable | `https://www.toolwild.com` |
| `CLOUDFLARE_PROJECT_NAME` | Variable（可选） | Pages 项目名，默认 `toolwild` |

工作流：安装依赖 → 单元测试 → 完整性自检 → 构建 → 产物校验；仅在配置了两个 Secrets 后才继续 `pages deploy`。未配置时仍完成全部构建验证并标记成功，不会留下失败记录。

---

## 四、第 2 步：绑定自定义域 + DNS 解析

### 方案 A（推荐，改动最小）：只启用 `www`，DNS 留在 Spaceship

1. 在 **Cloudflare Pages 项目 → Custom domains → Set up a domain** 输入 `www.toolwild.com` 并继续。
   **必须先在后台发起绑定**；只手动加 CNAME 而不关联域名会导致访问返回 `522`。
2. 后台显示的 CNAME 目标值就是第三节拿到的 **`<项目名>.pages.dev`**（例如 `toolwild.pages.dev`）。
   **不要填 `toolnest.pages.dev`**——那是别人的站点。
3. 登录 [Spaceship](https://www.spaceship.com/) → **Advanced DNS** → 选中 `toolwild.com` → **Add record**：

   | Type | Name | Points to | TTL |
   |---|---|---|---|
   | `CNAME` | `www` | `toolwild.pages.dev`（以 Cloudflare 后台显示为准） | 3600 |

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

预期：CNAME 返回指向**自己项目的** `*.pages.dev`；`canonical`、`og:url`、sitemap 的 `<loc>` 与 `xhtml:link` 均为 `https://www.toolwild.com/...`。

---

## 五、部署后验证清单

- [ ] `https://www.toolwild.com/` 自动跳转到 `/zh/` 或 `/en/`
- [ ] `https://toolwild.com/` 301 跳转到 `https://www.toolwild.com/`（或按方案 B 反向统一）
- [ ] 中英文切换后停留在同一工具页面（例如 `/zh/tools/merge-pdf/` ↔ `/en/tools/merge-pdf/`）
- [ ] 页面源码中的 `canonical` 与 `hreflang` 指向 `https://www.toolwild.com`
- [ ] `https://www.toolwild.com/sitemap.xml` 可访问，包含 79 条 URL
- [ ] `https://www.toolwild.com/robots.txt` 中的 Sitemap 地址为 `https://www.toolwild.com/sitemap.xml`
- [ ] 深色模式、收藏、最近使用、备份导出/导入功能正常
- [ ] 手机端打开首页与工具页无横向滚动
- [ ] 任意一个 PDF / 图片工具确认完整本地处理（开发者工具 Network 中不出现文件上传请求）
- [ ] 安全响应头生效（`curl -I https://www.toolwild.com/` 查看 `content-security-policy`）

### 提交搜索引擎

- Google Search Console：添加资源 → 站点地图 → 提交 `sitemap.xml`
- Bing Webmaster Tools：导入 Google 数据或直接提交 sitemap
- 百度搜索资源平台：普通收录 → sitemap → 提交 `sitemap.xml`

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
| 打开域名看到别人的 `ToolNest` React 网站 | CNAME 误填成 `toolnest.pages.dev`（第三方已占用）。改成自己项目的 `<项目名>.pages.dev`，并确认 Pages 后台自定义域已绑定 |
| `www.toolwild.com` 返回 `522` | 只手动加了 CNAME、没有先在 Pages 后台 **Custom domains** 发起绑定；先在后台关联域名再改 DNS |
| `*.pages.dev` 打不开或内容不对 | 项目尚未部署或部署到了别的项目名；按第三节重新部署，并核对后台显示的默认域名 |
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
