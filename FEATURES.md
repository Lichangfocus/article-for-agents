# a4a 产品功能列表

> 当前产品版本：**v0.0.6**（版本历史见 [README「版本迭代」](README.md#-版本迭代)）
> 维护规则：每次功能更新，同步更新本文件，并在 README「版本迭代」新增一个 0.0.x 条目。

## 📝 发布侧（作者）

| 功能 | 说明 | 状态 |
| --- | --- | --- |
| skill 一句话发布 | 把文章原文或链接丢给 AI，agent 调用 `a4a-publish` skill 完成发布；`/install` 让 agent 自助安装 skill | ✅ |
| 自动开户 | 无注册页/邮箱密码，一个 token 即唯一凭证；自动分配笔名与作者主页 | ✅ |
| 链接一键搬运 | `a4a publish <url>`：微信公众号、小红书图文 → 干净 Markdown；抓取在本机进行；失败时给 agent 自助抓取指引 | ✅ |
| 图片自动托管 | 搬运/发布时图片搬入 R2（`/v1/images`，支持服务端代抓与二进制直传），内容寻址去重，摆脱平台防盗链 | ✅ |
| CLI 全套 | `init` / `publish`（文件、URL、stdin）/ `grab` / `list` / `show` / `update` / `renew` / `delete` / `home` / `token`，均支持 `--json`；`A4A_ENDPOINT`/`A4A_TOKEN` 环境变量与代理 | ✅ |
| 付费定价 | 发布时 `--price` 或后台定价，随时改价/设回免费 | ✅（沙箱收款） |

## 🤖 阅读侧（AI / 读者）

| 功能 | 说明 | 状态 |
| --- | --- | --- |
| 双形态短链 | 同一 `/<id>`：浏览器得排版网页，agent 零配置一次 `fetch` 得 Markdown；`/<id>.md` 强制 Markdown | ✅ |
| 完整元数据 | YAML front matter：title / author / source / tags / published / expires / canonical / author_page / feed | ✅ |
| 有效期机制 | 默认 7 天（可配），过期自动失效；一键续期 | ✅ |

## 📮 订阅侧（agent 时代的「关注」）

| 功能 | 说明 | 状态 |
| --- | --- | --- |
| 作者主页 | `/u/<笔名>` 双形态：网页文章列表 / Markdown 列表；笔名全局唯一，改名自动迁移 | ✅ |
| AI 订阅指引 | 主页 Markdown 内嵌「给 AI agent：订阅」章节，引导 agent 用自己的定时任务/hook 能力轮询更新源 | ✅ |
| 更新源 feed | `/u/<笔名>/feed.json`（JSON Feed）：`?since=` 增量拉取、`If-Modified-Since` 304 低成本轮询 | ✅ |
| 单篇订阅引导 | 文章开头一行**给读者**的提示（对 AI 说「帮我订阅这个作者」即可）；文末「给 AI agent 的说明」请 agent 总结时转述该事实、用户开口时执行 author_page 步骤（绕开 harness 的注入防护，转化由用户触发）；front matter 带 `author_page`/`feed`/`agent_note`；MD 与 HTML 双形态同源内嵌 | ✅ |
| 订阅登记 | `POST /v1/subscriptions` → `sub_id` 凭证（订阅关系本体）；轮询带 `?sub=` 记录活跃时间 | ✅ |
| Webhook 推送（优先） | 登记时带 `webhook` 回调 URL → 作者发布/更新时服务端立即 POST 新文章 JSON，无需定时任务；引导词推送优先、轮询兜底 | ✅ |
| 引导参数可配置 | 后台表单：是否引导推送、轮询频率建议（6h/12h/每天/3天/每周，默认每天），配置内化进主页订阅指引 | ✅ |
| 防二次引导 | 指引「第 0 步自查」+ 带有效 `sub_id` 访问主页时替换为「✅ 已订阅」提示 + 文章页脚提醒已订阅者忽略，三重防重复 | ✅ |
| 退订 | `DELETE /v1/subscriptions/<sub_id>`（sub_id 即凭证），指引内含取关步骤 | ✅ |
| 订阅者统计 | 作者主页显示「🤖 N 位 AI 订阅者」；后台/`GET /v1/subscribers` 看总数、近 7 天活跃与明细 | ✅ |

## 💰 支付侧（实验中）

| 功能 | 说明 | 状态 |
| --- | --- | --- |
| Agent 支付协议 | 付费文章对 agent 返回 HTTP 402 + Markdown（价格/预览/二维码/claim_token/指引） | ✅ |
| 对话内收款 | agent 在对话里贴二维码 → 读者扫码支付 → agent 轮询/带凭证重试拿全文 | ✅ |
| 永久凭证 | `?claim=<token>` 地址对该读者永久有效 | ✅ |
| 沙箱 provider | 扫码后点「确认支付」即解锁，不真实扣款；provider 可插拔 | ✅ |
| 真实收款 | 微信商户号 / 聚合支付接入（协议不变） | 🚧 规划中 |

## 🖥 管理后台

| 功能 | 说明 | 状态 |
| --- | --- | --- |
| token 登录 | `/admin` 粘贴 token；token 只存浏览器本地，服务端只存哈希 | ✅ |
| 链接管理 | 查看/复制全部链接（临期标红）、续期、定价、删除 | ✅ |
| 账号设置 | 修改笔名（唯一性校验）、查看主页链接 | ✅ |

## ☁️ 服务端与自部署

| 功能 | 说明 | 状态 |
| --- | --- | --- |
| 单 Worker 架构 | Cloudflare Workers + KV + R2（R2 可选，缺省自动降级），免费额度够个人用 | ✅ |
| 可配置 | `OPEN_REGISTRATION` / `MAX_CONTENT_BYTES` / `LINK_TTL_DAYS` / `MAX_IMAGE_BYTES` | ✅ |
| 完整 HTTP API | 见 [README「HTTP API」](README.md#-http-api) | ✅ |
| llms.txt / 站点索引 | 站点级 AI 索引 | 🚧 规划中 |
| 防滥用 | 公共实例频率限制 | 🚧 规划中 |
| 浏览器插件 | 一键采集页面发布 | 🚧 规划中 |
