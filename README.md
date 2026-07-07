# article-for-agents (a4a)

**AI 时代的内容分发：把你的文章变成任何 AI 一次 `fetch` 就能读的链接。**

越来越多的内容消费发生在 AI 里——读者把文章丢给 Claude、豆包、ChatGPT、Kimi 去总结、翻译、存进知识库。但微信公众号、小红书等平台的文章是给「人」看的：反爬、登录墙、JS 渲染，AI 想读一篇文章只能靠浏览器自动化，又慢又脆，甚至根本读不到。

a4a 让作者为文章发布一份 **AI 可读副本**：一个短链接，人打开是排版好的网页，AI 请求返回带元数据的干净 Markdown。内容第一次可以同时面向两种读者分发。

> **官方实例**: https://article-for-agents.lichangin.workers.dev · 开箱即用，也可[自部署](#自部署)

## 30 秒上手

**第 1 步 · 安装 skill（对你的 AI 说一句话，只需一次）**

> 帮我安装这个 skill：https://article-for-agents.lichangin.workers.dev/install

agent 会自己读取安装指令并完成安装。也可以自己用一行命令装：

```bash
mkdir -p ~/.claude/skills/a4a-publish && curl -fsSL https://article-for-agents.lichangin.workers.dev/skill.md -o ~/.claude/skills/a4a-publish/SKILL.md
```

**第 2 步 · 把文章丢给你的 AI**

对 Claude Code（或任何支持 skill 的 agent）说：

> 把这篇文章转成 AI 可读链接：《……文章原文……》

**第 3 步 · 完成**

首次运行时 skill 会自动完成开户——无需注册页、无需邮箱密码：

- 🔑 自动创建账号（一个 token，即唯一凭证，**请妥善保存**）
- ✍️ 自动分配笔名（新文章的默认作者，后台可改）
- 🖥 自动配好后台地址

之后每次运行，你得到：

- **短链接**：发给任何 AI 都能直接读全文，浏览器打开是网页
- **二维码**：可直接放进公众号文章
- **有效期 7 天**：过期自动失效，后台一键续期

## 后台管理

打开 [/admin](https://article-for-agents.lichangin.workers.dev/admin)，粘贴 token 登录（`a4a token` 查看），可以：

- 查看/复制自己发布的所有链接（临期标红）
- 一键**续期**（重置为 7 天）、删除
- 修改**笔名**（新文章的默认作者）

token 只保存在你的浏览器本地，服务端仅存哈希。

## AI / 读者侧如何工作

把链接直接发给 AI 即可，无需任何说明。对 agent 而言：

```
GET /<id>      → text/markdown（默认，零 header）
GET /<id>.md   → 强制 Markdown（浏览器里也返回原文）
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
---

# 文章标题

正文……
```

## 手动用法（CLI）

skill 背后是 `a4a` CLI，也可以直接使用：

```bash
npm install -g a4a-cli

a4a init                        # 自动开户（分配笔名 + token）
a4a publish 文章.md              # 发布 → URL + 二维码
a4a list                        # 列出我的文章（含有效期）
a4a update <id> 新版本.md        # 更新（URL 不变，有效期重置）
a4a renew <id>                  # 续期 7 天
a4a delete <id>                 # 删除
a4a token                       # 查看 token 和后台地址
cat 文章.md | a4a publish -      # stdin 发布
a4a publish 文章.md --json       # JSON 输出（供脚本/AI 调用）
```

标题、作者、标签自动从 front matter 或首个 `# 标题` 提取，可用 `--title` / `--author` / `--source`（原文链接）/ `--tags` 覆盖。支持 `A4A_ENDPOINT` / `A4A_TOKEN` 环境变量与 `HTTP(S)_PROXY` 代理。

## 自部署

服务端是单个 Cloudflare Worker + KV，免费额度足够个人使用：

```bash
git clone https://github.com/Lichangfocus/article-for-agents && cd article-for-agents
npm install

cd server
npx wrangler kv namespace create A4A_KV
# 把输出的 id 填入 server/wrangler.jsonc 的 kv_namespaces[0].id
npx wrangler deploy
```

配置项（`server/wrangler.jsonc` 的 `vars`）：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `OPEN_REGISTRATION` | `true` | 是否允许自助开户 |
| `MAX_CONTENT_BYTES` | `1048576` | 单篇正文大小上限 |
| `LINK_TTL_DAYS` | `7` | 链接有效期（天） |

用户指向你的实例：`a4a init --endpoint https://你的域名`。

## HTTP API

管理接口需要 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/keys` | 开户，返回 `{token, authorName}`（无需认证） |
| GET / PUT | `/v1/me` | 查看 / 修改笔名 |
| POST | `/v1/articles` | 发布 → `{id, url, expiresAt}` |
| GET | `/v1/articles` | 列出自己的文章 |
| GET / PUT / DELETE | `/v1/articles/:id` | 详情 / 更新 / 删除 |
| POST | `/v1/articles/:id/renew` | 续期 |
| GET | `/:id` | 公开阅读：agent 得 Markdown，浏览器得 HTML |
| GET | `/:id.md` | 公开阅读：始终 Markdown |
| GET | `/skill.md` | 下载发布 skill |
| GET | `/install` | 给 agent 的 skill 安装指令（丢给 AI 即可自助安装） |
| GET | `/admin` | 网页后台 |

## 愿景与路线图

内容的下一个入口是 AI。a4a 想成为**作者 → AI → 读者**这条新链路上的分发层：

- [x] AI 可读短链 + 双形态渲染（v0.1）
- [x] skill 一键发布 + 自动开户 + 网页后台（v0.2）
- [ ] **Agent 支付**：AI 读取付费内容时代表读者付费，作者获得收入（下个版本）
- [ ] 粘贴公众号链接自动抓取转 Markdown
- [ ] 作者主页 `/u/<笔名>`：一个 URL 列出全部文章，方便 AI 批量收录
- [ ] 图片托管（R2）
- [ ] 浏览器插件一键采集
- [ ] `llms.txt` 与站点级索引
- [ ] 公共实例防滥用（频率限制）

## 本地开发

```bash
npm install
npm run dev                                  # http://localhost:8787
A4A_ENDPOINT=http://localhost:8787 node cli/bin/a4a.js init
```

## License

MIT
