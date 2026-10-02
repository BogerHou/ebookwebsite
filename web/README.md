# EbookNest · 书径

用中文书籍介绍、目录、原书内页与选书指南帮助读者发现外文原版书。Next.js App Router 提供服务端目录搜索和预生成详情页，资源地址通过服务端接口领取。

## 本地开发

需要 Node.js 24.x。

```bash
cd web
npm ci
npm run dev
```

开发服务默认 http://localhost:3000。复制 `.env.example` 为 `.env.local`，本地将 `SITE_URL` 改为对应开发地址。保持其他服务端变量私有。

```bash
npm run check
npm run build
npm run start
node scripts/test-resource-api.mjs
```

`npm run check` 验证 TypeScript、书目、详细资料、静态SEO、主题检索与站点配置。资源接口测试使用独立端口和测试配置，不修改真实分享映射。

## Vercel 部署

连接 `BogerHou/ebookwebsite`，Root Directory 设为 **web**，框架 Next.js，Node.js **24.x**。安装命令 `npm ci`，构建命令 `npm run build`，输出目录保持框架默认。

在 Production 和需要领取测试的 Preview 环境配置：

| 变量 | 内容 |
|---|---|
| `SITE_URL` | `https://ebooknest.store` |
| `RESOURCE_ACCESS_MODE` | `free` |
| `RESOURCE_LINKS_JSON` | 完整资源映射 JSON；服务端私有变量 |

`RESOURCE_LINKS_JSON` 不使用 `NEXT_PUBLIC_` 前缀。资源映射支持全局 `access_mode` 和按书籍 `id` 索引的 `resources`；每项可含 `url`、`extractionCode`、`expiry`、`enabled`。永久链接的 `expiry` 为 `null`。本地也可用未提交的 `data/resource-links.json`，部署时优先使用环境变量。

公开代码不包含真实网盘地址与提取码。领取接口依赖 Node.js 服务端，不能静态导出。当前免费模式；付费未配置时接口拒绝领取，不接受客户端参数绕过。

修改域名或环境变量后重新部署。Production 使用真实HTTPS origin，Preview 也使用生产 canonical 并设置 noindex。不要将含本地地址的预构建目录上传作为生产版本。

## 域名与DNS

Namecheap 负责注册，Cloudflare 负责 DNS 与网站代理，Vercel 承载网站。将域名加入 Vercel 项目，再按项目实际要求在 Cloudflare 配置根域和 www 记录。当前生产配置中，这两条网站记录均开启代理（Proxied），SSL/TLS 使用 Full (strict)，并由 Cloudflare 与 Vercel 分别提供边缘和源站证书。以 Vercel 控制台显示的记录为准，保留域名现有邮件记录。

根域 `ebooknest.store` 为 canonical，`www.ebooknest.store` 重定向到根域。Cloudflare 分配的两条 nameserver 需配置到 Namecheap Custom DNS。全部变更完成后核对 HTTPS、DNS、站点与资源接口。

## 上线验证

```bash
node scripts/validate-seo.mjs --base https://ebooknest.store --canonical-origin https://ebooknest.store
```

该检查覆盖105个规范页面、搜索和排序变体、canonical、结构化数据、初始HTML、分页、sitemap与robots。资源接口可按私有映射另行验证，不输出真实分享地址或提取码。检查 Preview 时将 `--base` 改为预览地址，保持生产 canonical-origin，并增加 `--preview`。

`/sitemap.xml` 只含公开规范页面，`/robots.txt` 排除资源API。站点可公开访问后可提交 sitemap 到 Search Console，再依据实际索引和性能数据迭代。

## 内容与图片

- `data/catalog.json`：稳定书籍ID、URL、书目、分类与图片。
- `data/book-details.json`：80本详细内容、真实目录选读、具体主题、作者资料、书目与选书比较。
- `data/book-notes.json`：补充阅读建议和关联书目。
- `data/editorial.json`：12个分类导读、6篇选书指南。
- `public/books/`：实际封面与精选内页；不放完整电子书。

作者与编者分别记录，期刊使用 PublicationIssue，图书使用 Book；缺乏可靠证据的书目信息不虚构。PDF页数与原书页数分别展示。指南的内页引用会校验实际图片页码。

书页正文在初始HTML中呈现。目录仅使用24本分页，搜索、排序与页码保存在URL；分类使用独立地址。主题检索、ISBN和编者姓名使用服务端生成的平面搜索词，不向目录客户端传完整详情。
