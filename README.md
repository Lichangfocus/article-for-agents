<div align="center">

# 回响 · huixiang

**每一次更新，都有回响。**

**Agent 时代的 RSS** —— 我们想开启这样一个时代：创作者的内容既能被 agent 方便地读到，也能被 agent 自主订阅

内容转 AI 易读格式 · 免费短链一次 `fetch` 即读 · agent 自主订阅，你一更新它第一时间知道

[![npm](https://img.shields.io/npm/v/huixiang-cli?label=huixiang-cli&color=cb3837&logo=npm)](https://www.npmjs.com/package/huixiang-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20KV%20%2B%20R2-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Claude Code Skill](https://img.shields.io/badge/Claude%20Code-Skill-d97757)](#30-秒上手)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Lichangfocus/huixiang/pulls)

**中文** | [English](README.en.md)

🌐 **官方实例**: [article-for-agents.lichangin.workers.dev](https://article-for-agents.lichangin.workers.dev) · 开箱即用，也可[自部署](#-自部署)

</div>

---

## 💡 为什么需要「回响」

**观点一：你的文章需要能被 agent 轻松读到。** 越来越多的阅读发生在 AI 里——读者把文章丢给 Claude、豆包、ChatGPT、Kimi 去总结、翻译、存进知识库。但公众号、小红书的页面是给「人」看的：反爬、登录墙、JS 渲染，agent 想读你的文章只能靠浏览器自动化，又慢又脆，甚至根本读不到。**对 agent 不可读，就是在下一代阅读入口里缺席。**

**观点二：agent 时代的流量，现在就该开始积累。** 读者的 AI 可以替他持续关注你——前提是有一个 agent 能订阅的更新源。越早提供，你的读者就越早成为你在 **agent 时代的第一波订阅者**：你一更新，他们的 AI 就会拉取阅读、报告给主人。

## ✨ 所以「回响」做了三件事

**1 · 📦 把各种内容转成 AI 易读的形态**
粘贴公众号 / 小红书链接（或直接给原文），自动转成干净 Markdown + 元数据；图片一并搬离防盗链图床，托管到与文章同源的图床。

**2 · 🔗 给出免费的在线链接，agent 一次 `fetch` 即读**
同一个短链接，两种形态，零配置零 header：

| 谁打开 | 看到什么 |
| --- | --- |
| 👤 读者（浏览器） | 排版好的网页 |
| 🤖 agent（一次 `fetch`） | 干净 Markdown + YAML 元数据（标题/作者/来源/有效期） |

**3 · 📮 agent 读完，引导它订阅你**
每篇文章都指向你的作者主页 `/u/<笔名>`；agent 读到内嵌的订阅指引后，会用它自己的定时任务能力盯住你的更新源——**只要你在平台更新，就会推送到读者的 agent 去阅读**。这是 AI 时代的「关注」按钮。

<details>
<summary><b>还有一些配套能力</b></summary>

- **💰 Agent 支付协议** — 付费文章对 AI 返回 HTTP 402 + 对话内二维码，读者扫码、AI 自动解锁全文（当前沙箱）
- **🧰 Agent 全流程 + 网页后台** — 发布/搬运全部交给 AI（skill 或 `a4a` CLI）；后台是 SaaS 式管理台（邮箱注册登录：链接管理、订阅者、账号、订阅引导设置）
- **☁️ 一个 Worker 跑起来** — Cloudflare Workers + KV + R2 自部署，免费额度足够个人使用

</details>

## 🚀 30 秒上手

**第 1 步 · 安装 skill（对你的 AI 说一句话，只需一次）**

> 帮我安装这个 skill：https://article-for-agents.lichangin.workers.dev/install

agent 会自己读取安装指令并完成安装。也可以自己用一行命令装：

```bash
mkdir -p ~/.claude/skills/huixiang-publish && curl -fsSL https://article-for-agents.lichangin.workers.dev/skill.md -o ~/.claude/skills/huixiang-publish/SKILL.md
```

**第 2 步 · 把文章（或链接）丢给你的 AI**

对 Claude Code（或任何支持 skill 的 agent）说：

> 把这篇文章转成 AI 可读链接：《……文章原文……》

或者直接给链接（公众号 / 小红书图文），一键搬运：

> 把这篇转成 AI 可读链接：https://mp.weixin.qq.com/s/xxxx

正文自动抓取转 Markdown，图片自动搬到回响图床。

**第 3 步 · 首次使用：注册账号（约 30 秒，仅一次）**

skill 会引导你完成标准注册流程：

- 打开 [后台](https://article-for-agents.lichangin.workers.dev/admin) → 注册（**邮箱 + 用户名 + 密码**，前期免邮箱验证）
- 用户名全局唯一，就是你的作者主页地址 `/u/<用户名>`
- 注册成功页把「**绑定指令**」复制给你的 AI → 绑定完成（token 是 agent 接入凭证，忘了随时邮箱登录找回）

之后每次运行，你得到：

- **短链接**：发给任何 AI 都能直接读全文，浏览器打开是网页
- **二维码**：可直接放进公众号文章
- **永久有效**：链接不过期，订阅你的 AI 任何时候都能读到

## 📮 作者主页与 AI 订阅

每个作者自动拥有主页 `https://<host>/u/<笔名>`（`a4a home` 查看）：

- **浏览器打开**：文章列表网页
- **AI 请求**：Markdown 版列表 + 内嵌的**订阅指引**——引导 agent 用它自己的自动化能力（Claude Code 的 scheduled tasks / hooks、cron 等）建一个定时任务，周期性拉取 `/u/<笔名>/feed.json?since=<上次检查时间>`，有新文章就通知它的用户或自动阅读
- **feed.json**：JSON Feed 格式的机器更新源，支持 `?since=` 增量拉取和 `If-Modified-Since`（无更新返回 304，轮询近乎零成本）

订阅是一个**有登记的闭环**：agent 订阅时先 `POST /v1/subscriptions` 拿到 `sub_id` 凭证，轮询 feed 时带上它——服务端因此知道谁在订阅、是否活跃；agent 再次带着 `sub_id` 访问主页时，看到的不再是订阅引导而是「✅ 已订阅，勿重复创建」（配合指引里的「第 0 步自查」，双保险防止重复订阅、反复打扰用户）；退订用 `DELETE /v1/subscriptions/<sub_id>`。作者在主页和后台能看到自己的 **AI 订阅者数量**。

也就是说：读者把你的主页链接发给他的 AI，说一句「关注这个作者」，AI 就能替他盯更新——**这是 AI 时代的「关注/订阅」按钮**。每篇文章的 Markdown 里也带有 `author_page` / `feed` 字段和一行指引，AI 读完单篇即可发现作者主页。

## 💰 付费文章与 Agent 支付（实验中）

发布时加 `--price 3.00`（或在后台「定价」）即为付费文章。AI 访问时的完整协议：

1. agent `GET /<id>` → **HTTP 402** + Markdown 响应体：含价格、内容预览、支付二维码图片 URL、`claim_token` 和下一步指引
2. agent 在对话框里贴出二维码：读者手机扫码 → 打开支付页 → 完成支付
3. agent 轮询 `/pay/<pid>/status` 或直接带凭证重试 `GET /<id>?claim=<token>` → 200 全文
4. 带凭证的地址对该读者**永久有效**

> ⚠️ 当前为**模拟支付（沙箱）**：扫码后点「确认支付」即解锁，不真实扣款。支付 provider 是可插拔的，
> 真实收款（微信商户号 / 聚合支付）接入后协议不变；未来 agent 自带钱包（x402 等）也是同一个 402 响应。

## 🖥 后台管理

打开 [/admin](https://article-for-agents.lichangin.workers.dev/admin) 邮箱登录（老 token 账号可用 token 登录入口），SaaS 式管理台，四个视图：

- **内容链接**：搜索、查看/复制、定价、删除（永久有效）；空态有示例数据
- **订阅者**：总数与近 7 天活跃、每个订阅 agent 的名字 / push·poll 模式 / 最近活跃
- **账号管理**：用户名（唯一，即主页地址）、邮箱、文章署名（可改）、token 说明
- **高级设置**：订阅引导配置（推送优先开关、轮询频率建议）

token 只保存在你的浏览器本地，服务端仅存哈希；密码加盐 PBKDF2 存储。

## 🤖 AI / 读者侧如何工作

把链接直接发给 AI 即可，无需任何说明。对 agent 而言：

```
GET /<id>              → text/markdown（默认，零 header）
GET /<id>.md           → 强制 Markdown（浏览器里也返回原文）
GET /u/<笔名>          → 作者全部文章 + 订阅指引
GET /u/<笔名>/feed.json → 机器更新源（?since= 增量）
```

返回格式（YAML front matter + 正文）：

```markdown
---
title: "文章标题"
author: "笔名"
source: "https://mp.weixin.qq.com/s/..."
published: 2026-07-06T03:32:13.449Z
canonical: https://<host>/<id>
author_page: https://<host>/u/<笔名>
feed: https://<host>/u/<笔名>/feed.json
---

# 文章标题

正文……
```

## ⌨️ 手动用法（CLI）

skill 背后是回响 CLI（npm 包 `huixiang-cli`，提供 `a4a` 与 `huixiang` 两个命令），也可以直接使用：

```bash
npm install -g huixiang-cli

a4a login <token>               # 绑定账号（token 在 /admin 注册或登录后显示）
a4a login --email 邮箱 --password 密码   # 或直接邮箱登录换 token
a4a publish 文章.md              # 发布 → URL + 二维码
a4a publish "https://mp.weixin.qq.com/s/xxxx"       # 公众号一键搬运（图片自动托管）
a4a publish "https://www.xiaohongshu.com/explore/…" # 小红书图文一键搬运
a4a grab "<链接>"                # 只抓取转 Markdown 输出，不发布
a4a publish 文章.md --price 3    # 付费文章（AI 访问返回 402 + 支付二维码）
a4a list                        # 列出我的文章（含有效期）
a4a update <id> 新版本.md        # 更新（URL 不变，有效期重置）
a4a delete <id>                 # 删除
a4a home                        # 查看作者主页链接（发给 AI 可订阅更新）
a4a token                       # 查看 token 和后台地址
cat 文章.md | a4a publish -      # stdin 发布
a4a publish 文章.md --json       # JSON 输出（供脚本/AI 调用）
```

标题、作者、标签自动从 front matter 或首个 `# 标题` 提取，可用 `--title` / `--author` / `--source`（原文链接）/ `--tags` 覆盖。链接搬运时抓取在**本机**进行（住宅 IP，比服务端抓取可靠），图片经服务端搬入 R2；`--no-images` 可跳过图片托管。支持 `A4A_ENDPOINT` / `A4A_TOKEN` 环境变量与 `HTTP(S)_PROXY` 代理。

## ☁️ 自部署

服务端是单个 Cloudflare Worker + KV（+ 可选 R2），免费额度足够个人使用：

```bash
git clone https://github.com/Lichangfocus/huixiang && cd huixiang
npm install

cd server
npx wrangler kv namespace create A4A_KV
# 把输出的 id 填入 server/wrangler.jsonc 的 kv_namespaces[0].id
npx wrangler r2 bucket create a4a-images
# 图片托管用。需在 Cloudflare 控制台启用 R2（有免费额度）；
# 不想要图片托管可删掉 wrangler.jsonc 的 r2_buckets 段，功能自动降级（图片保留外链）
npx wrangler deploy
```

配置项（`server/wrangler.jsonc` 的 `vars`）：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `OPEN_REGISTRATION` | `true` | 是否允许自助开户 |
| `MAX_CONTENT_BYTES` | `1048576` | 单篇正文大小上限 |
| `MAX_IMAGE_BYTES` | `5242880` | 单张托管图片大小上限 |

用户指向你的实例：`a4a login <token> --endpoint https://你的域名`。

## 📡 HTTP API

<details>
<summary>展开完整 API 表（管理接口需要 <code>Authorization: Bearer &lt;token&gt;</code>）</summary>

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/register` | 注册：`{email, password, username}` → `{token, home_url}`（用户名唯一，即主页地址） |
| POST | `/v1/login` | 邮箱登录 → 签发新的 Agent 接入 token（旧 token 仍有效） |
| GET / PUT | `/v1/me` | 查看账号 / 修改署名与订阅引导设置 |
| POST | `/v1/articles` | 发布 → `{id, url, expiresAt}` |
| GET | `/v1/articles` | 列出自己的文章 |
| GET / PUT / DELETE | `/v1/articles/:id` | 详情 / 更新 / 删除 |
| POST | `/v1/articles/:id/renew` | 把带有效期的旧文章转为永久（历史兼容） |
| POST | `/v1/images` | 托管图片：JSON `{url}`（服务端代抓）或图片二进制直传 → `{url}` |
| GET | `/c/:id` | 口令页：阅读/订阅口令 + 二维码版（双形态渲染，可直接分享） |
| GET | `/c/:id/read.svg` · `/c/:id/subscribe.svg` · `/u/:用户名/subscribe.svg` | 口令二维码（内容即口令文本） |
| GET | `/c/:id/poster.svg` · `/u/:用户名/poster.svg` | 口令海报（口令印在图上，发图给 AI 即可执行） |
| GET | `/i/:key` | 读取托管图片（内容寻址，长缓存） |
| GET | `/u/:笔名` | 作者主页：agent 得 Markdown（含订阅指引），浏览器得 HTML；`.md` 后缀强制 Markdown |
| GET | `/u/:笔名/feed.json` | 订阅源（JSON Feed）：支持 `?since=<ISO8601>`、`?sub=<sub_id>`（记录活跃）与 `If-Modified-Since` |
| POST | `/v1/subscriptions` | 订阅登记（agent 侧，无需 token）：`{author, agent?, webhook?}` → `{sub_id, mode}`；带 `webhook` = 推送模式，更新即时 POST 到回调 |
| DELETE | `/v1/subscriptions/:id` | 退订（sub_id 即凭证） |
| GET | `/v1/subscribers` | 作者查看订阅者统计：总数、近 7 天活跃、明细 |
| GET | `/:id` | 公开阅读：agent 得 Markdown，浏览器得 HTML；付费文章无凭证时返回 402 |
| GET | `/:id.md` | 公开阅读：始终 Markdown |
| GET | `/:id?claim=<token>` | 付费文章 + 已付凭证 → 全文 |
| GET / POST | `/pay/:pid` · `/pay/:pid/confirm` | 支付页 / 确认支付（当前沙箱） |
| GET | `/pay/:pid/status` · `/pay/:pid/qr.svg` | 支付状态轮询 / 二维码图片 |
| GET | `/skill.md` | 下载发布 skill |
| GET | `/install` | 给 agent 的 skill 安装指令（丢给 AI 即可自助安装） |
| GET | `/admin` | 网页后台 |

</details>

## 🧭 版本迭代

> 每次功能更新都会在这里新增一个版本号（0.0.x）并附更新介绍。完整功能清单见 [FEATURES.md](FEATURES.md)。

### v0.0.12 · 2026-07-09 —— 内容永续 + 简单限流（当前）

- **文章默认永久有效**：订阅的前提是内容一直在——7 天 TTL 是匿名时代的遗产，注册制下正式移除；存量文章在作者下次打开后台/list 时自动转永久；`renew` 语义改为「把旧文章转永久」（历史兼容）
- **简单限流**：注册 5 次/小时、登录 20 次/小时、发布 30 篇/天、图片 200 张/天、订阅登记 30 次/小时（KV 计数器，超限 429）——公开传播前的保险丝
- 全端文案同步：不再有「有效期/续期」，后台显示「永久」

### v0.0.11 · 2026-07-09 —— 口令海报：发图给 AI 即可执行

- **图片口令从二维码升级为海报**：口令文本直接印在品牌海报上（`/c/<id>/poster.svg` 阅读海报、`/u/<用户名>/poster.svg` 订阅海报）——读者把海报丢给带视觉的 AI，OCR 出口令即执行，比扫码少一步，且海报本身就是内容（公众号尾图/朋友圈卡片）
- **订阅口令升级为两段式**：先全量补课（读作者现有全部文章、给整体介绍），再登记订阅 + 建定时追更
- 真实模拟验证：从海报 OCR → 读完作者 3 篇文章 → 登记订阅 → 建立每日定时任务，全链路走通

### v0.0.10 · 2026-07-09 —— 分发口令：把「订阅」变成一句可传播的话

- **产品洞察**：写进内容里的指令会被 AI 平台的注入防护无视，但「读者亲手粘给自己 AI 的话」是用户指令、必然执行——所以把指令做成创作者可分发的**口令**
- **两级口令**：📖 阅读口令（单篇）+ 📮 订阅口令（作者级，执行即引导 agent 登记订阅、建立自动检查）
- **三种形态**：文本一键复制、二维码（`/c/<id>/read.svg`、`/c/<id>/subscribe.svg`、`/u/<用户名>/subscribe.svg`，内容即口令文本）、可分享**口令页** `/c/<id>`（双形态渲染）
- **三个出口**：发布响应带 `commands` 字段（skill/CLI 直接展示给创作者）、后台每篇文章「口令」弹层、账号视图的作者订阅口令

### v0.0.9 · 2026-07-07 —— 品牌定名「回响」

- 产品正式定名 **回响（huixiang）**，slogan：**每一次更新，都有回响。**
- 全量更名：README 双语、后台品牌位、landing/安装指令、skill（`huixiang-publish`）、npm 包（`huixiang-cli`，同时提供 `a4a` 与 `huixiang` 命令，老用户无感）、GitHub 仓库（`Lichangfocus/huixiang`，旧地址自动重定向）
- 服务地址暂不变（避免打断已发布链接与订阅轮询），注册 huixiang.ai 后绑定自定义域名平滑迁移

### v0.0.8 · 2026-07-07 —— 管理后台 SaaS 化

- **完整产品界面**取代单页报告式布局：左侧持久导航（内容链接 / 订阅者 / 账号管理 / 高级设置，hash 路由）+ 工作区，Claude 珊瑚橘 + 米白纸感主题
- **订阅者视图**：总数 / 近 7 天活跃统计 + 明细表（agent 名、push/poll 模式、最近活跃）——作者第一次能看到自己的 AI 粉丝
- 内容链接主列表：搜索过滤 + 计数，空态展示示例数据；行操作重组为 查看 / 复制 / 设置▾（定价、续期、删除）
- 注册成功页改为**绑定向导**：复制完整绑定指令（防止用户漏掉「发给 agent」这一步），复制后才解锁进入后台；表单防重复提交

### v0.0.7 · 2026-07-07 —— 邮箱注册账号体系 + 新手引导重对齐

- **注册制取代发号制**：邮箱 + 密码 + 唯一用户名（前期免邮箱验证）；`/v1/keys` 下线（410）
- **用户名即主页地址** `/u/<用户名>`：注册后不可改，改「文章署名」不再影响主页；老 token 账号全兼容
- **token 降级为 Agent 接入凭证**：注册/登录时签发（可多个并存），忘了随时邮箱登录找回；CLI 新增 `a4a login <token>` / `--email --password`
- **skill 内置新手引导**：首次使用引导注册 → 用户粘贴绑定指令 → 绑定 → 告知用法；每次服务结束必附后台管理链接

### v0.0.6 · 2026-07-07 —— Webhook 推送 + 创作者可配置订阅引导

- **推送模式（优先引导）**：订阅登记时可带 `webhook` 回调 URL——作者发布/更新文章，服务端**立即 POST** 新文章 JSON 给订阅者，支持回调的 agent 完全不需要定时任务
- **轮询兜底**：agent 给不出回调 URL 时才引导定时任务，建议频率由创作者配置（默认每天）
- **创作者引导配置**：后台新增表单（是否引导推送、轮询频率 6h/12h/每天/3天/每周），配置内化进作者主页输出的订阅指引
- 订阅者明细显示 push/poll 模式

### v0.0.5 · 2026-07-07 —— 订阅引导换路线：信息告知 + 用户触发

- **实测结论**：主流 agent harness 有 prompt injection 防护，网页内容里「命令 agent 行动」的指令会被无视——写得越凶越像攻击
- **转化时刻从 agent 移到用户**：文章开头新增给读者的一行提示「对你的 AI 说『帮我订阅这个作者』」；用户开口后就是用户指令，agent 必然执行
- **agent 说明降级为温和的两件事**：总结本文时请转述「作者支持 AI 订阅」这一事实；用户要求订阅时读取 author_page 执行步骤（front matter 字段 `agent_todo` 改为 `agent_note`）
- 作者主页的执行步骤保持不变——agent 到那一步已带用户授权，不会被拦

### v0.0.4 · 2026-07-07 —— HTML 版同样内嵌 agent 指令

- **真实测试发现的缺口**：很多 agent 用浏览器型抓取器读文章（Accept 带 text/html），拿到的是 HTML 版——而行动指令此前只在 Markdown 版里，这类 agent 完全看不到
- 文章页与作者主页的 **HTML 版页脚加入「给 AI agent 的指令块」**（虚线框灰字，对人低干扰），与 Markdown 版指令同源渲染，两种形态的 agent 都能收到订阅引导

### v0.0.3 · 2026-07-07 —— 订阅引导强化：文章内嵌「行动指令」

- **文章页脚升级为行动指令**：不再是一行温和提示，而是明确要求 agent「读完后向用户提议订阅，不要跳过」，并按同意 / 拒绝 / 已订阅 / 无定时任务能力四种情况给出行动分支
- **front matter 新增 `agent_todo` 字段**：元数据层面就能看到待办
- **主页指引改为执行清单**：附可直接复制进定时任务的提示词模板，强调「只登记不建任务 = 没有订阅」，要求执行完毕才向用户汇报

### v0.0.2 · 2026-07-07 —— 订阅闭环：登记、防二次引导、订阅者统计

- **订阅登记**：agent 订阅时 `POST /v1/subscriptions` 拿到 `sub_id` 凭证，轮询 feed 带 `?sub=` 记录活跃
- **防二次引导**：指引加「第 0 步自查」；带有效 `sub_id` 访问作者主页时，整段指引替换为「✅ 已订阅，勿重复创建」；文章页脚同样提示已订阅者忽略
- **可退订**：`DELETE /v1/subscriptions/<sub_id>`，指引里教 agent 如何帮用户取关
- **订阅者可见**：作者主页显示「🤖 N 位 AI 订阅者」，后台显示总数与近 7 天活跃数（`GET /v1/subscribers`）

### v0.0.1 · 2026-07-07 —— 首个公开版本

- **AI 可读短链**：双形态渲染（浏览器网页 / agent Markdown + 元数据），7 天有效期可续期
- **一句话发布**：skill 自助安装 + 自动开户免注册 + `a4a` CLI + 网页后台
- **链接一键搬运**：公众号 / 小红书图文 → 干净 Markdown（本机抓取，失败有 agent 自助指引）
- **图片自动托管**：R2 内容寻址，摆脱平台防盗链图床
- **作者主页与 AI 订阅**：`/u/<笔名>` + feed.json（`?since` / 304）+ 内嵌订阅指引，agent 自建定时任务盯更新
- **Agent 支付协议**：HTTP 402 + 对话内二维码 + claim 永久凭证（沙箱 provider）

## 🗺 愿景与路线图

内容的下一个入口是 AI。回响想成为**作者 → AI → 读者**这条新链路上的分发层。接下来：

- [ ] 真实收款 provider：作者自带微信商户号 / 聚合支付，可插拔接入
- [ ] 后台 `/admin` UI 重设计（当前为最简可用版）
- [ ] 浏览器插件一键采集
- [ ] `llms.txt` 与站点级索引

## 🧑‍💻 本地开发

```bash
npm install
npm run dev                                  # http://localhost:8787
A4A_ENDPOINT=http://localhost:8787 node cli/bin/a4a.js login <token>
```

## 📄 License

[MIT](LICENSE)
