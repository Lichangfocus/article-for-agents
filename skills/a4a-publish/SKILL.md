---
name: a4a-publish
description: 把文章原文或公众号/小红书链接发布成 AI 可读的短链接（7 天有效）。当用户说「把这篇文章转成 AI 可读链接」「发布到 a4a」「生成一个给 AI 看的链接」「搬运这篇公众号/小红书」，或粘贴/给出一篇文章（或其链接）并要求生成可分享给 AI 的 URL 时使用。
---

# a4a-publish：把文章变成 AI 可读的短链接

你的任务：接收用户提供的文章内容**或公众号/小红书链接**，通过 `a4a` CLI 发布，返回一个短链接。
这个链接任何 AI 一次 HTTP GET 就能读到干净的 Markdown 全文（含标题/作者/来源等元数据的
YAML front matter），**有效期 7 天**，可在网页后台续期和管理。图片会自动搬到 a4a 的图床
（平台图床对 AI 防盗链），作者还会获得一个主页 `/u/<笔名>`，AI 可通过它订阅更新。

## 步骤

### 1. 确认 CLI 可用

```bash
a4a --help || npm install -g a4a-cli
```

如果用户是在 article-for-agents 仓库内，也可以直接用 `node cli/bin/a4a.js` 代替 `a4a`。

### 2. 确认已注册（只需一次）

```bash
a4a token --json || a4a init
```

`a4a init` 会自动注册（无需邮箱密码）：自动分配一个笔名（新文章的默认作者，
可在后台修改）并把 token 存到 `~/.config/a4a/config.json`。
如果用户指定了自部署实例，加 `--endpoint <url>`。

### 3a. 输入是链接（公众号 / 小红书）→ 一键搬运

用户给的是 `mp.weixin.qq.com` 或 `xiaohongshu.com` / `xhslink.com` 链接时，直接：

```bash
a4a publish "<链接>" --json
```

CLI 会自动抓取正文转 Markdown、把图片搬到 a4a 图床（防盗链外链→同源可读）、带上 source 发布。
只想看抓取结果不发布时用 `a4a grab "<链接>"`；不想托管图片加 `--no-images`。

**抓取失败时的 fallback**（反爬/需登录/视频笔记等，错误信息会说明原因）：
用你自己的能力打开该页面（浏览器工具、WebFetch 等），提取标题、作者和正文转成 Markdown，
然后按下面 3b 的普通流程发布（`--source` 填原链接）。再不行就请用户把原文粘贴给你。

### 3b. 输入是文章原文 → 整理内容

把用户给的原文整理成干净的 Markdown，写入临时文件：

- 用户直接粘贴了正文 → 原样保留内容，不要改写、删节或润色正文
- 内容是富文本/HTML 片段 → 转成等价 Markdown（保留标题层级、列表、链接、代码块）
- 开头加 front matter（能确定的字段才写）：

```markdown
---
title: 文章标题
author: 作者名
source: https://mp.weixin.qq.com/s/...   # 原文链接，如果用户提供了
tags: [标签1, 标签2]
---

正文……
```

- 没有明确标题时，从内容中提炼一个，并向用户说明
- 图片：如果原文里有可访问的图片 URL，保留 `![](url)` 即可——发布后可用
  `POST <endpoint>/v1/images`（Bearer token，body `{"url": "..."}`）逐张托管并替换；
  拿不到图片时保留 alt 文字

### 4. 发布

```bash
a4a publish /path/to/article.md --json
```

需要更新已发布的文章时用 `a4a update <id> <file>`（URL 不变），续期用 `a4a renew <id>`。

**付费文章**：用户要求收费/定价时加 `--price <元>`（如 `--price 3.00`）。
付费文章被 AI 访问时会返回 HTTP 402 和支付二维码，读者扫码支付后 AI 自动拿到全文；
后台可随时改价或设回免费。向用户说明当前为模拟支付（沙箱），不会真实扣款。

### 5. 向用户报告

必须包含：

1. **短链接**（`url` 字段）— 告诉用户把它发给任何 AI（Claude、豆包、ChatGPT、Kimi…）即可读全文
2. **有效期**（`expiresAt`，7 天）— 到期链接失效
3. **后台管理** — 打开 `<endpoint>/admin`，粘贴 `a4a token` 显示的 token 登录，可以查看、复制、续期、删除自己的所有链接
4. **首次使用时**（刚跑过 `a4a init`）：明确展示 token 并提醒用户妥善保存 —— token 是唯一凭证，没有账号密码找回机制，token 丢失 = 链接无法管理
5. **作者主页**（`a4a home` 可查看，形如 `<endpoint>/u/<笔名>`）— 告诉用户：读者把主页链接发给
   自己的 AI，AI 会读到全部文章列表和订阅指引，可以设置定时任务持续关注更新（相当于 AI 时代的「关注作者」）

## 排错

- `未找到 token` → 运行 `a4a init`
- `无法连接` → 检查 endpoint（`a4a token` 可查看当前配置）；自部署实例确认已 `wrangler deploy`
- `无法确定标题` → 加 `--title "标题"` 重试
- 正文超过 1MB → 建议拆篇发布
