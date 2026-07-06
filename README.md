# article-for-agents (a4a)

**把你的文章变成 AI 一次 `fetch` 就能读的 URL。**

微信公众号、小红书等平台的文章是给「人」看的：有反爬、要登录、要渲染 JS。AI agent 想读一篇文章，往往只能靠浏览器自动化——又慢又脆。

a4a 让作者为自己的文章发布一份 **AI 可读副本**：

1. 作者用 CLI 上传文章正文（Markdown）
2. 得到一个永久 URL + 二维码
3. 读者把 URL 丢给任何 AI（Claude、豆包、ChatGPT、Kimi…），AI 一次 HTTP GET 就能拿到干净的 Markdown 全文，直接总结、翻译、存入知识库

同一个 URL 对人和 AI 都友好：浏览器打开是排版好的网页，agent 请求返回带 YAML front matter 的纯 Markdown。

## 推荐用法：装 skill，让 AI 替你发布

如果你在用 Claude Code（或其他支持 skill 的 agent），装上发布 skill 后，
把文章原文丢给 AI 说一句「转成 AI 可读链接」即可：

```bash
cp -r skills/a4a-publish ~/.claude/skills/
```

skill 会自动安装 CLI、注册、整理正文成 Markdown、发布，然后把链接、有效期、后台地址报给你。

## 手动用法（CLI）

```bash
npm install -g a4a-cli

a4a init                      # 注册并保存 token（只需一次）
a4a publish 我的文章.md        # 发布 → 输出 URL 和二维码
```

发布后你会得到形如 `https://<host>/ttV5rTiW` 的链接：

- **有效期 7 天**（实例可配置），到期自动失效，可随时续期
- 放进公众号文章末尾 / 简介 / 二维码里
- 读者复制给任何 AI 助手即可读取全文

## 后台管理

打开 `https://<host>/admin`，粘贴 token（`a4a token` 查看）登录，
即可查看、复制、**续期**、删除自己发布的所有链接。token 只存在浏览器本地。

### 更多命令

```bash
a4a list                        # 列出我发布的文章（含有效期）
a4a show <id>                   # 查看详情
a4a update <id> 新版本.md        # 更新（URL 不变，有效期重置）
a4a renew <id>                  # 续期 7 天
a4a delete <id>                 # 删除
a4a token                       # 显示 token 和后台地址
cat 文章.md | a4a publish -     # 从 stdin 发布
a4a publish 文章.md --json      # JSON 输出（供脚本/AI agent 调用）
```

标题、作者、标签会自动从 Markdown front matter 或首个 `# 一级标题` 提取，也可用 `--title` / `--author` / `--tags` / `--source`（原文链接）覆盖。

CLI 本身对 AI 友好：所有命令支持 `--json`，支持 stdin，支持 `A4A_ENDPOINT` / `A4A_TOKEN` 环境变量——你可以直接让 Claude Code / Cursor 等 agent 替你发布内容。

## 读者 / AI 如何使用

把链接直接发给 AI 即可。对 agent 而言：

```
GET https://<host>/<id>      → text/markdown（默认，无需任何 header）
GET https://<host>/<id>.md   → 强制 Markdown（浏览器里也返回原文）
```

返回格式：

```markdown
---
title: "文章标题"
author: "作者"
source: "https://mp.weixin.qq.com/s/..."
published: 2026-07-03T10:21:32.823Z
expires: 2026-07-10T10:21:32.823Z
canonical: https://<host>/<id>
---

# 文章标题

正文……
```

## 自部署

服务端是单个 Cloudflare Worker + KV，免费额度足够个人使用：

```bash
git clone <this-repo> && cd article-for-agents
npm install

cd server
npx wrangler kv namespace create A4A_KV
# 把输出的 id 填入 server/wrangler.jsonc 的 kv_namespaces[0].id
npx wrangler deploy
```

部署后让用户指向你的实例：

```bash
a4a init --endpoint https://article-for-agents.<你的子域>.workers.dev
```

配置项（`server/wrangler.jsonc` 的 `vars`）：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `OPEN_REGISTRATION` | `true` | 是否允许任何人 `POST /v1/keys` 自助获取 token |
| `MAX_CONTENT_BYTES` | `1048576` | 单篇正文大小上限 |
| `LINK_TTL_DAYS` | `7` | 链接有效期（天），到期 KV 自动删除 |

## HTTP API

所有管理接口需要 `Authorization: Bearer <token>`。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/v1/keys` | 注册，返回 `{token}`（无需认证） |
| POST | `/v1/articles` | 发布 `{title, content, author?, source?, tags?, lang?}` → `{id, url}` |
| GET | `/v1/articles` | 列出自己的文章 |
| GET | `/v1/articles/:id` | 文章详情（含正文） |
| PUT | `/v1/articles/:id` | 部分更新（有效期重置） |
| POST | `/v1/articles/:id/renew` | 续期 |
| DELETE | `/v1/articles/:id` | 删除 |
| GET | `/admin` | 网页后台（token 登录） |
| GET | `/:id` | 公开阅读：agent 得 Markdown，浏览器得 HTML |
| GET | `/:id.md` | 公开阅读：始终 Markdown |

## 本地开发

```bash
npm install
npm run dev                                  # wrangler dev, http://localhost:8787
A4A_ENDPOINT=http://localhost:8787 node cli/bin/a4a.js init
```

## 路线图

- [ ] 粘贴公众号链接自动抓取转 Markdown
- [ ] 图片上传（R2）与图床代理
- [ ] 浏览器插件一键采集（绕过所有平台反爬）
- [ ] 作者主页 `/u/<name>`：一个 URL 列出全部文章，方便 AI 批量收录
- [ ] `llms.txt` 与站点级索引
- [ ] 公共实例的滥用防护（频率限制、举报）

## License

MIT
