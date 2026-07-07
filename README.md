<div align="center">

# article-for-agents · a4a

**AI 时代的内容分发：让你的读者成为 agent 时代的第一波订阅者**

内容转 AI 易读格式 · 免费短链一次 `fetch` 即读 · agent 读完引导订阅，你一更新就推送给它

[![npm](https://img.shields.io/npm/v/a4a-cli?label=a4a-cli&color=cb3837&logo=npm)](https://www.npmjs.com/package/a4a-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20KV%20%2B%20R2-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Claude Code Skill](https://img.shields.io/badge/Claude%20Code-Skill-d97757)](#30-秒上手)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Lichangfocus/article-for-agents/pulls)

**中文** | [English](README.en.md)

🌐 **官方实例**: [article-for-agents.lichangin.workers.dev](https://article-for-agents.lichangin.workers.dev) · 开箱即用，也可[自部署](#-自部署)

</div>

---

## 💡 为什么需要 a4a

**观点一：你的文章需要能被 agent 轻松读到。** 越来越多的阅读发生在 AI 里——读者把文章丢给 Claude、豆包、ChatGPT、Kimi 去总结、翻译、存进知识库。但公众号、小红书的页面是给「人」看的：反爬、登录墙、JS 渲染，agent 想读你的文章只能靠浏览器自动化，又慢又脆，甚至根本读不到。**对 agent 不可读，就是在下一代阅读入口里缺席。**

**观点二：agent 时代的流量，现在就该开始积累。** 读者的 AI 可以替他持续关注你——前提是有一个 agent 能订阅的更新源。越早提供，你的读者就越早成为你在 **agent 时代的第一波订阅者**：你一更新，他们的 AI 就会拉取阅读、报告给主人。

## ✨ 所以 a4a 做了三件事

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
- **🧰 三种用法** — 对 AI 说一句话（skill）/ `a4a` CLI / 网页后台，全部自动开户免注册
- **☁️ 一个 Worker 跑起来** — Cloudflare Workers + KV + R2 自部署，免费额度足够个人使用

</details>

## 🚀 30 秒上手

**第 1 步 · 安装 skill（对你的 AI 说一句话，只需一次）**

> 帮我安装这个 skill：https://article-for-agents.lichangin.workers.dev/install

agent 会自己读取安装指令并完成安装。也可以自己用一行命令装：

```bash
mkdir -p ~/.claude/skills/a4a-publish && curl -fsSL https://article-for-agents.lichangin.workers.dev/skill.md -o ~/.claude/skills/a4a-publish/SKILL.md
```

**第 2 步 · 把文章（或链接）丢给你的 AI**

对 Claude Code（或任何支持 skill 的 agent）说：

> 把这篇文章转成 AI 可读链接：《……文章原文……》

或者直接给链接（公众号 / 小红书图文），一键搬运：

> 把这篇转成 AI 可读链接：https://mp.weixin.qq.com/s/xxxx

正文自动抓取转 Markdown，图片自动搬到 a4a 图床。

**第 3 步 · 完成**

首次运行时 skill 会自动完成开户——无需注册页、无需邮箱密码：

- 🔑 自动创建账号（一个 token，即唯一凭证，**请妥善保存**）
- ✍️ 自动分配笔名（新文章的默认作者，后台可改）
- 🏠 自动生成作者主页 `/u/<笔名>`

之后每次运行，你得到：

- **短链接**：发给任何 AI 都能直接读全文，浏览器打开是网页
- **二维码**：可直接放进公众号文章
- **有效期 7 天**：过期自动失效，后台一键续期

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

打开 [/admin](https://article-for-agents.lichangin.workers.dev/admin)，粘贴 token 登录（`a4a token` 查看），可以：

- 查看/复制自己发布的所有链接（临期标红）
- 一键**续期**（重置为 7 天）、**定价**、删除
- 修改**笔名**（新文章的默认作者，也是主页地址）

token 只保存在你的浏览器本地，服务端仅存哈希。

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
expires: 2026-07-13T03:32:13.449Z
canonical: https://<host>/<id>
author_page: https://<host>/u/<笔名>
feed: https://<host>/u/<笔名>/feed.json
---

# 文章标题

正文……
```

## ⌨️ 手动用法（CLI）

skill 背后是 `a4a` CLI，也可以直接使用：

```bash
npm install -g a4a-cli

a4a init                        # 自动开户（分配笔名 + token + 主页）
a4a publish 文章.md              # 发布 → URL + 二维码
a4a publish "https://mp.weixin.qq.com/s/xxxx"       # 公众号一键搬运（图片自动托管）
a4a publish "https://www.xiaohongshu.com/explore/…" # 小红书图文一键搬运
a4a grab "<链接>"                # 只抓取转 Markdown 输出，不发布
a4a publish 文章.md --price 3    # 付费文章（AI 访问返回 402 + 支付二维码）
a4a list                        # 列出我的文章（含有效期）
a4a update <id> 新版本.md        # 更新（URL 不变，有效期重置）
a4a renew <id>                  # 续期 7 天
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
git clone https://github.com/Lichangfocus/article-for-agents && cd article-for-agents
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
| `LINK_TTL_DAYS` | `7` | 链接有效期（天） |
| `MAX_IMAGE_BYTES` | `5242880` | 单张托管图片大小上限 |

用户指向你的实例：`a4a init --endpoint https://你的域名`。

## 📡 HTTP API

<details>
<summary>展开完整 API 表（管理接口需要 <code>Authorization: Bearer &lt;token&gt;</code>）</summary>

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/keys` | 开户，返回 `{token, authorName, home_url}`（无需认证） |
| GET / PUT | `/v1/me` | 查看 / 修改笔名（笔名唯一，兼作主页地址） |
| POST | `/v1/articles` | 发布 → `{id, url, expiresAt}` |
| GET | `/v1/articles` | 列出自己的文章 |
| GET / PUT / DELETE | `/v1/articles/:id` | 详情 / 更新 / 删除 |
| POST | `/v1/articles/:id/renew` | 续期 |
| POST | `/v1/images` | 托管图片：JSON `{url}`（服务端代抓）或图片二进制直传 → `{url}` |
| GET | `/i/:key` | 读取托管图片（内容寻址，长缓存） |
| GET | `/u/:笔名` | 作者主页：agent 得 Markdown（含订阅指引），浏览器得 HTML；`.md` 后缀强制 Markdown |
| GET | `/u/:笔名/feed.json` | 订阅源（JSON Feed）：支持 `?since=<ISO8601>`、`?sub=<sub_id>`（记录活跃）与 `If-Modified-Since` |
| POST | `/v1/subscriptions` | 订阅登记（agent 侧，无需 token）：`{author}` → `{sub_id, poll}` |
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

### v0.0.4 · 2026-07-07 —— HTML 版同样内嵌 agent 指令（当前）

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

内容的下一个入口是 AI。a4a 想成为**作者 → AI → 读者**这条新链路上的分发层。接下来：

- [ ] 真实收款 provider：作者自带微信商户号 / 聚合支付，可插拔接入
- [ ] Webhook 主动推送（作者更新 → 回调订阅方 URL，作为 feed 轮询的补充）
- [ ] 浏览器插件一键采集
- [ ] `llms.txt` 与站点级索引
- [ ] 公共实例防滥用（频率限制）

## 🧑‍💻 本地开发

```bash
npm install
npm run dev                                  # http://localhost:8787
A4A_ENDPOINT=http://localhost:8787 node cli/bin/a4a.js init
```

## 📄 License

[MIT](LICENSE)
