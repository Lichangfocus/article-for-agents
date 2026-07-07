---
name: a4a-publish
description: 把文章原文发布成 AI 可读的短链接（7 天有效）。当用户说「把这篇文章转成 AI 可读链接」「发布到 a4a」「生成一个给 AI 看的链接」，或粘贴/给出一篇文章并要求生成可分享给 AI 的 URL 时使用。
---

# a4a-publish：把文章变成 AI 可读的短链接

你的任务：接收用户提供的文章内容，通过 `a4a` CLI 发布，返回一个短链接。
这个链接任何 AI 一次 HTTP GET 就能读到干净的 Markdown 全文（含标题/作者/来源等元数据的
YAML front matter），**有效期 7 天**，可在网页后台续期和管理。

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

### 3. 整理文章内容

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
- 图片：平台图床外链对 AI 无用且可能防盗链，保留 alt 文字即可，并提醒用户图片暂不托管

### 4. 发布

```bash
a4a publish /path/to/article.md --json
```

需要更新已发布的文章时用 `a4a update <id> <file>`（URL 不变），续期用 `a4a renew <id>`。

### 5. 向用户报告

必须包含：

1. **短链接**（`url` 字段）— 告诉用户把它发给任何 AI（Claude、豆包、ChatGPT、Kimi…）即可读全文
2. **有效期**（`expiresAt`，7 天）— 到期链接失效
3. **后台管理** — 打开 `<endpoint>/admin`，粘贴 `a4a token` 显示的 token 登录，可以查看、复制、续期、删除自己的所有链接
4. **首次使用时**（刚跑过 `a4a init`）：明确展示 token 并提醒用户妥善保存 —— token 是唯一凭证，没有账号密码找回机制，token 丢失 = 链接无法管理

## 排错

- `未找到 token` → 运行 `a4a init`
- `无法连接` → 检查 endpoint（`a4a token` 可查看当前配置）；自部署实例确认已 `wrangler deploy`
- `无法确定标题` → 加 `--title "标题"` 重试
- 正文超过 1MB → 建议拆篇发布
