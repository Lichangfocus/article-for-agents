<div align="center">

# article-for-agents · a4a

**Content distribution for the AI era: make your readers your first subscribers of the agent age**

Convert content to AI-readable form · Free links agents read in one `fetch` · Agents get guided to subscribe — every update is pushed to them

[![npm](https://img.shields.io/npm/v/a4a-cli?label=a4a-cli&color=cb3837&logo=npm)](https://www.npmjs.com/package/a4a-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20KV%20%2B%20R2-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Claude Code Skill](https://img.shields.io/badge/Claude%20Code-Skill-d97757)](#-quick-start)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Lichangfocus/article-for-agents/pulls)

[中文](README.md) | **English**

🌐 **Hosted instance**: [article-for-agents.lichangin.workers.dev](https://article-for-agents.lichangin.workers.dev) · works out of the box, or [self-host](#%EF%B8%8F-self-hosting)

</div>

---

## 💡 Why a4a

**Point one: your writing needs to be easy for agents to read.** More and more reading happens inside AI — people hand articles to Claude, ChatGPT, or Kimi to summarize, translate, or file into a knowledge base. But platforms like WeChat Official Accounts and Xiaohongshu build pages for **humans**: anti-scraping, login walls, JS rendering. An agent trying to read your article is stuck with slow, brittle browser automation — or simply blocked. **Unreadable to agents means absent from the next generation of reading.**

**Point two: agent-era traffic compounds — start collecting it now.** A reader's AI can keep watch on you for them — as long as there's an update source an agent can subscribe to. Provide one early, and your readers become your **first subscribers of the agent era**: every time you publish, their AI fetches it, reads it, and reports back.

## ✨ So a4a does three things

**1 · 📦 Convert any content into an AI-readable form**
Paste a WeChat / Xiaohongshu link (or the raw text); it becomes clean Markdown + metadata, with images moved off hotlink-blocking CDNs onto same-origin hosting.

**2 · 🔗 Give it a free online link any agent can `fetch`**
One short link, two renderings, zero config and zero headers:

| Who opens it | What they get |
| --- | --- |
| 👤 Reader (browser) | A nicely rendered web page |
| 🤖 Agent (single `fetch`) | Clean Markdown + YAML metadata (title/author/source/expiry) |

**3 · 📮 After reading, guide the agent to subscribe to you**
Every article points to your author page `/u/<pen-name>`; the embedded guide teaches the agent to use its own scheduling ability to watch your feed — **whenever you publish here, it gets pushed to your readers' agents to read**. The "Follow" button of the AI era.

<details>
<summary><b>Plus the supporting cast</b></summary>

- **💰 Agent payment protocol** — paid articles answer AIs with HTTP 402 + an in-chat QR code; the reader scans, pays, and the AI unlocks the full text (sandbox for now)
- **🧰 Three ways in** — tell your AI one sentence (skill) / the `a4a` CLI / a web admin panel; all with automatic sign-up, no registration form
- **☁️ Runs on a single Worker** — self-host on Cloudflare Workers + KV + R2; the free tier is plenty for personal use

</details>

## 🚀 Quick start

**Step 1 · Install the skill (tell your AI once)**

> Install this skill for me: https://article-for-agents.lichangin.workers.dev/install

The agent reads the instructions and installs itself. Or do it manually:

```bash
mkdir -p ~/.claude/skills/a4a-publish && curl -fsSL https://article-for-agents.lichangin.workers.dev/skill.md -o ~/.claude/skills/a4a-publish/SKILL.md
```

**Step 2 · Hand your AI an article (or a link)**

Tell Claude Code (or any skill-capable agent):

> Turn this article into an AI-readable link: "…full text…"

Or just paste a WeChat / Xiaohongshu link for one-click import:

> Turn this into an AI-readable link: https://mp.weixin.qq.com/s/xxxx

**Step 3 · Done**

On first run the skill signs you up automatically — no registration page, no email/password:

- 🔑 Account created (one token — the only credential, **keep it safe**)
- ✍️ Pen name assigned (default author for new articles, editable in the admin panel)
- 🏠 Author home page generated at `/u/<pen-name>`

Every publish gives you a **short link** (readable by any AI, a web page in browsers), a **QR code**, and a **7-day TTL** (renewable in one click).

## 📮 Author pages & AI subscriptions

Every author gets `https://<host>/u/<pen-name>` (see yours with `a4a home`):

- **Browser**: a web page listing your articles
- **AI request**: a Markdown listing plus an embedded **subscription guide** — it teaches the agent to use its own automation (Claude Code scheduled tasks / hooks, cron, …) to periodically pull `/u/<pen-name>/feed.json?since=<last-check>` and act on new articles
- **feed.json**: a JSON Feed, with `?since=` incremental fetching and `If-Modified-Since` (304 on no change — polling is nearly free)

Subscribing is a **registered loop**: the agent first `POST /v1/subscriptions` to get a `sub_id` credential and polls the feed with it — so the server knows who subscribes and who's active. When the agent revisits the author page carrying its `sub_id`, it sees "✅ already subscribed — don't re-create" instead of the pitch (paired with the guide's "step 0 self-check", a double guard against duplicate subscriptions and re-prompting the user). Unsubscribe with `DELETE /v1/subscriptions/<sub_id>`. Authors see their **AI subscriber count** on their page and in the admin panel.

A reader sends your page to their AI and says "follow this author" — the AI keeps watch. Every article's Markdown also carries `author_page` / `feed` fields, so reading one article is enough for an AI to discover the author.

## 💰 Paid articles & agent payments (experimental)

Publish with `--price 3.00` (or set a price in the admin panel). The protocol, from the AI's side:

1. Agent `GET /<id>` → **HTTP 402** with a Markdown body: price, preview, QR-code image URL, `claim_token`, and next steps
2. Agent shows the QR code in chat; the reader scans and pays on their phone
3. Agent polls `/pay/<pid>/status` or retries `GET /<id>?claim=<token>` → 200 full text
4. The claim URL stays valid for that reader **permanently**

> ⚠️ Currently a **sandbox**: scanning and clicking "confirm" unlocks without a real charge. Payment providers are pluggable — real ones (WeChat Pay merchant accounts, aggregators) keep the same protocol, and so will agent wallets (x402 etc.).

## 🖥 Admin panel

Open [/admin](https://article-for-agents.lichangin.workers.dev/admin) and paste your token (`a4a token` shows it) to view/copy all your links (expiring soon highlighted), renew, price, delete, and change your pen name. The token stays in your browser; the server stores only a hash.

## 🤖 How AIs read it

Just send the link — no explanation needed. For agents:

```
GET /<id>                    → text/markdown (default, zero headers)
GET /<id>.md                 → force Markdown (even in a browser)
GET /u/<pen-name>            → all articles + subscription guide
GET /u/<pen-name>/feed.json  → machine-readable updates (?since= incremental)
```

Response format (YAML front matter + body):

```markdown
---
title: "Article title"
author: "Pen name"
source: "https://mp.weixin.qq.com/s/..."
published: 2026-07-06T03:32:13.449Z
expires: 2026-07-13T03:32:13.449Z
canonical: https://<host>/<id>
author_page: https://<host>/u/<pen-name>
feed: https://<host>/u/<pen-name>/feed.json
---

# Article title

Body…
```

## ⌨️ CLI

The skill is powered by the `a4a` CLI, which you can use directly:

```bash
npm install -g a4a-cli

a4a init                        # auto sign-up (pen name + token + home page)
a4a publish article.md          # publish → URL + QR code
a4a publish "https://mp.weixin.qq.com/s/xxxx"       # one-click WeChat import (images hosted)
a4a publish "https://www.xiaohongshu.com/explore/…" # Xiaohongshu photo-note import
a4a grab "<link>"               # fetch & convert to Markdown only, no publish
a4a publish article.md --price 3 # paid article (AIs get 402 + payment QR)
a4a list                        # list my articles (with expiry)
a4a update <id> new.md          # update (URL unchanged, TTL reset)
a4a renew <id>                  # renew for 7 days
a4a delete <id>                 # delete
a4a home                        # show my author page URL
a4a token                       # show token & admin URL
cat article.md | a4a publish -  # publish from stdin
a4a publish article.md --json   # JSON output (for scripts/AIs)
```

Title/author/tags are extracted from front matter or the first `# heading`; override with `--title` / `--author` / `--source` / `--tags`. Link imports fetch locally and push images through the server into R2; skip hosting with `--no-images`. `A4A_ENDPOINT` / `A4A_TOKEN` env vars and `HTTP(S)_PROXY` are supported.

## ☁️ Self-hosting

The server is a single Cloudflare Worker + KV (+ optional R2):

```bash
git clone https://github.com/Lichangfocus/article-for-agents && cd article-for-agents
npm install

cd server
npx wrangler kv namespace create A4A_KV
# put the returned id into kv_namespaces[0].id in server/wrangler.jsonc
npx wrangler r2 bucket create a4a-images
# for image hosting (enable R2 in the Cloudflare dashboard; free tier available).
# Don't want it? Delete the r2_buckets block — the feature degrades gracefully.
npx wrangler deploy
```

Config (`vars` in `server/wrangler.jsonc`):

| Var | Default | Meaning |
| --- | --- | --- |
| `OPEN_REGISTRATION` | `true` | allow self-service sign-up |
| `MAX_CONTENT_BYTES` | `1048576` | max article body size |
| `LINK_TTL_DAYS` | `7` | link TTL in days |
| `MAX_IMAGE_BYTES` | `5242880` | max hosted image size |

Point users at your instance with `a4a init --endpoint https://your.domain`.

## 📡 HTTP API

<details>
<summary>Full API table (management endpoints require <code>Authorization: Bearer &lt;token&gt;</code>)</summary>

| Method | Path | Description |
| --- | --- | --- |
| POST | `/v1/keys` | sign up → `{token, authorName, home_url}` (no auth) |
| GET / PUT | `/v1/me` | view / change pen name (unique; doubles as home-page address) |
| POST | `/v1/articles` | publish → `{id, url, expiresAt}` |
| GET | `/v1/articles` | list own articles |
| GET / PUT / DELETE | `/v1/articles/:id` | detail / update / delete |
| POST | `/v1/articles/:id/renew` | renew |
| POST | `/v1/images` | host an image: JSON `{url}` (server-side fetch) or raw bytes → `{url}` |
| GET | `/i/:key` | serve a hosted image (content-addressed, long cache) |
| GET | `/u/:pen-name` | author page: Markdown for agents (with subscription guide), HTML for browsers; `.md` suffix forces Markdown |
| GET | `/u/:pen-name/feed.json` | update feed (JSON Feed): `?since=<ISO8601>`, `?sub=<sub_id>` (records liveness), `If-Modified-Since` |
| POST | `/v1/subscriptions` | subscribe (agent-side, no token): `{author}` → `{sub_id, poll}` |
| DELETE | `/v1/subscriptions/:id` | unsubscribe (the sub_id is the credential) |
| GET | `/v1/subscribers` | author-side subscriber stats: total, 7-day active, detail |
| GET | `/:id` | public read: Markdown for agents, HTML for browsers; 402 for unpaid articles |
| GET | `/:id.md` | public read: always Markdown |
| GET | `/:id?claim=<token>` | paid article + claim → full text |
| GET / POST | `/pay/:pid` · `/pay/:pid/confirm` | payment page / confirm (sandbox) |
| GET | `/pay/:pid/status` · `/pay/:pid/qr.svg` | payment status polling / QR image |
| GET | `/skill.md` | download the publishing skill |
| GET | `/install` | skill install instructions for agents |
| GET | `/admin` | web admin panel |

</details>

## 🧭 Version history

> Every feature update adds a new version number (0.0.x) here with release notes. Full feature list: [FEATURES.md](FEATURES.md) (Chinese).

### v0.0.2 · 2026-07-07 — subscription loop: registration, dedup guards, subscriber stats (current)

- **Subscription registration**: agents `POST /v1/subscriptions` to get a `sub_id` credential; polling the feed with `?sub=` records liveness
- **No double-prompting**: the guide gains a "step 0 self-check"; visiting the author page with a valid `sub_id` replaces the guide with "✅ already subscribed, don't re-create"; article footers tell subscribed agents to ignore the pitch
- **Unsubscribe**: `DELETE /v1/subscriptions/<sub_id>`, with unfollow steps in the guide
- **Visible subscribers**: author pages show "🤖 N AI subscribers"; the admin panel shows totals and 7-day actives (`GET /v1/subscribers`)

### v0.0.1 · 2026-07-07 — first public version

- **AI-readable short links**: dual rendering (web page for browsers / Markdown + metadata for agents), 7-day renewable TTL
- **One-sentence publishing**: self-installing skill + registration-free sign-up + `a4a` CLI + web admin
- **One-click import**: WeChat / Xiaohongshu → clean Markdown (fetched locally, with agent fallback instructions)
- **Automatic image hosting**: content-addressed R2, free of hotlink-blocking platform CDNs
- **Author pages & AI subscriptions**: `/u/<pen-name>` + feed.json (`?since` / 304) + embedded guide for agents to set up their own scheduled watch
- **Agent payment protocol**: HTTP 402 + in-chat QR + permanent claim tokens (sandbox provider)

## 🗺 Vision & roadmap

The next front door for content is AI. a4a aims to be the distribution layer on the new **author → AI → reader** path. Up next:

- [ ] Real payment providers: authors bring their own WeChat merchant account / aggregator, pluggable
- [ ] Webhook push (author update → callback to subscriber URLs, complementing feed polling)
- [ ] Browser extension for one-click capture
- [ ] `llms.txt` and site-level indexing
- [ ] Abuse protection for public instances (rate limiting)

## 🧑‍💻 Local development

```bash
npm install
npm run dev                                  # http://localhost:8787
A4A_ENDPOINT=http://localhost:8787 node cli/bin/a4a.js init
```

## 📄 License

[MIT](LICENSE)
