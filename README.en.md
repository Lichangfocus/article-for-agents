<div align="center">

# Echo 回响

**Every update, echoes.**

**RSS for the agent era** — we want to start an era where creators' content is both easily readable by agents and autonomously subscribable by them

Convert content to AI-readable form · Free links agents read in one `fetch` · Agents subscribe on their own — the moment you publish, they know

[![npm](https://img.shields.io/npm/v/huixiang-cli?label=huixiang-cli&color=cb3837&logo=npm)](https://www.npmjs.com/package/huixiang-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20KV%20%2B%20R2-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Claude Code Skill](https://img.shields.io/badge/Claude%20Code-Skill-d97757)](#-quick-start)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Lichangfocus/huixiang/pulls)

[中文](README.md) | **English**

🌐 **Hosted instance**: [echohx.com](https://echohx.com) · works out of the box, or [self-host](#%EF%B8%8F-self-hosting)

</div>

---

## 💡 Why Echo

**Point one: your writing needs to be easy for agents to read.** More and more reading happens inside AI — people hand articles to Claude, ChatGPT, or Kimi to summarize, translate, or file into a knowledge base. But platforms like WeChat Official Accounts and Xiaohongshu build pages for **humans**: anti-scraping, login walls, JS rendering. An agent trying to read your article is stuck with slow, brittle browser automation — or simply blocked. **Unreadable to agents means absent from the next generation of reading.**

**Point two: agent-era traffic compounds — start collecting it now.** A reader's AI can keep watch on you for them — as long as there's an update source an agent can subscribe to. Provide one early, and your readers become your **first subscribers of the agent era**: every time you publish, their AI fetches it, reads it, and reports back.

## ✨ So Echo does three things

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
- **🧰 Agents do the work, the console does the managing** — publishing/importing all goes through your AI (skill or `a4a` CLI); the admin is a SaaS-style console (email accounts: links, subscribers, account, guidance settings)
- **☁️ Runs on a single Worker** — self-host on Cloudflare Workers + KV + R2; the free tier is plenty for personal use

</details>

## 🚀 Quick start

**Step 1 · Install the skill (tell your AI once)**

> Install this skill for me: https://echohx.com/install

The agent reads the instructions and installs itself. Or do it manually:

```bash
mkdir -p ~/.claude/skills/huixiang-publish && curl -fsSL https://echohx.com/skill.md -o ~/.claude/skills/huixiang-publish/SKILL.md
```

**Step 2 · Hand your AI an article (or a link)**

Tell Claude Code (or any skill-capable agent):

> Turn this article into an AI-readable link: "…full text…"

Or just paste a WeChat / Xiaohongshu link for one-click import:

> Turn this into an AI-readable link: https://mp.weixin.qq.com/s/xxxx

**Step 3 · First run: register an account (~30 s, once)**

The skill walks you through the standard flow:

- Open the [admin](https://echohx.com/admin) → register (**email + username + password**, no email verification yet)
- The username is globally unique and doubles as your author page `/u/<username>`
- The success page gives you a **binding instruction** to paste to your AI (the token is an agent credential — recover it anytime by logging in with email)

Every publish gives you a **short link** (readable by any AI, a web page in browsers), a **QR code**, and **permanent availability**.

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

## 🖥 Admin console

Open [/admin](https://echohx.com/admin) and log in with email (legacy accounts can still use token login). A SaaS-style console with four views: **Links** (search, view/copy, renew, price, delete — demo rows when empty), **Subscribers** (totals, 7-day actives, per-agent mode & last-active), **Account** (username, email, byline, token notes), **Advanced** (subscription guidance settings). Tokens stay in your browser (server stores hashes); passwords are salted PBKDF2.

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
canonical: https://<host>/<id>
author_page: https://<host>/u/<pen-name>
feed: https://<host>/u/<pen-name>/feed.json
---

# Article title

Body…
```

## ⌨️ CLI

The skill is powered by the Echo CLI (npm package `huixiang-cli`, providing both `a4a` and `huixiang` commands), which you can use directly:

```bash
npm install -g huixiang-cli

a4a login <token>               # bind your account (token shown in /admin after register/login)
a4a login --email you@x.com --password …   # or exchange email credentials for a token
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
git clone https://github.com/Lichangfocus/huixiang && cd huixiang
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

Point users at your instance with `a4a login <token> --endpoint https://your.domain`.

## 📡 HTTP API

<details>
<summary>Full API table (management endpoints require <code>Authorization: Bearer &lt;token&gt;</code>)</summary>

| Method | Path | Description |
| --- | --- | --- |
| POST | `/v1/register` | register: `{email, password, username}` → `{token, home_url}` (unique username = homepage) |
| POST | `/v1/login` | email login → issues a fresh agent token (older ones stay valid) |
| GET / PUT | `/v1/me` | view account / change byline & guidance settings |
| POST | `/v1/articles` | publish → `{id, url, expiresAt}` |
| GET | `/v1/articles` | list own articles |
| GET / PUT / DELETE | `/v1/articles/:id` | detail / update / delete |
| POST | `/v1/articles/:id/renew` | convert an old expiring article to permanent (legacy) |
| POST | `/v1/images` | host an image: JSON `{url}` (server-side fetch) or raw bytes → `{url}` |
| GET | `/c/:id` | phrase page: read/subscribe phrases + QR versions (dual rendering, shareable) |
| GET | `/c/:id/read.svg` · `/c/:id/subscribe.svg` · `/u/:username/subscribe.svg` | phrase QR codes (the QR encodes the phrase text) |
| GET | `/c/:id/poster.svg` · `/u/:username/poster.svg` | phrase posters (the phrase is printed on the image — send it to a vision AI and it executes) |
| GET | `/i/:key` | serve a hosted image (content-addressed, long cache) |
| GET | `/u/:pen-name` | author page: Markdown for agents (with subscription guide), HTML for browsers; `.md` suffix forces Markdown |
| GET | `/u/:pen-name/feed.json` | update feed (JSON Feed): `?since=<ISO8601>`, `?sub=<sub_id>` (records liveness), `If-Modified-Since` |
| POST | `/v1/subscriptions` | subscribe (agent-side, no token): `{author, agent?, webhook?}` → `{sub_id, mode}`; with `webhook` = push mode, updates POSTed to the callback |
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

### v0.0.13 · 2026-07-09 — read echoes: authors finally see how many times AI has read them (current)

- Every agent-mode read (200) bumps a per-article counter — "every update resounds" now has a visible number
- New **🤖 reads** column in the admin links view; article pages show "read by AI N times" (social proof)
- Browser views don't count (this counter is for AI); CDN cache hits don't count (conservative undercount)

### v0.0.12 · 2026-07-09 — permanent content + simple rate limiting

- **Articles are now permanent by default**: subscriptions only make sense if content persists — the 7-day TTL was a relic of the anonymous era; existing articles auto-convert next time the author opens the admin / runs list; `renew` now means "convert an old article to permanent"
- **Simple rate limits**: register 5/h, login 20/h, publish 30/day, images 200/day, subscription registration 30/h (KV counters, 429 on excess)
- Copy updated everywhere: no more expiry/renewal; the admin shows "permanent"

### v0.0.11 · 2026-07-09 — phrase posters: send the image to an AI and it just works

- **Image phrases upgraded from QR codes to posters**: the phrase is printed on a branded poster (`/c/<id>/poster.svg`, `/u/<username>/poster.svg`) — readers drop the poster into any vision-capable AI, which OCRs the phrase and executes it; one step fewer than scanning, and the poster itself is shareable content
- **Subscribe phrase is now two-stage**: back-read everything first (full catalog + author overview), then register and set up automated following
- Verified end-to-end with a real simulation: poster OCR → read all 3 articles → register → daily scheduled task created

### v0.0.10 · 2026-07-09 — command phrases: turning "subscribe" into a shareable sentence

- **Insight**: instructions embedded in content get ignored by injection defenses, but words a reader pastes to their own AI are user instructions — so we turned instructions into creator-distributable **command phrases**
- **Two levels**: 📖 read phrase (per article) + 📮 subscribe phrase (per author — executing it walks the agent through registration and automated checking)
- **Three forms**: copyable text, QR codes (`/c/<id>/read.svg`, `/c/<id>/subscribe.svg`, `/u/<username>/subscribe.svg` — the QR encodes the phrase itself), and a shareable **phrase page** `/c/<id>` (dual rendering)
- **Three outlets**: publish responses carry a `commands` field (surfaced by skill/CLI), a per-article phrase dialog in the admin, and an author-level phrase in Account

### v0.0.9 · 2026-07-07 — the product is now named 回响 (Echo)

- Official name: **回响** (English: **Echo**, tech handle `huixiang`) — slogan: **Every update, echoes.**
- Full rename: bilingual README, admin branding, landing/install copy, skill (`huixiang-publish`), npm package (`huixiang-cli`, shipping both `a4a` and `huixiang` commands so nothing breaks), GitHub repo (`Lichangfocus/huixiang`, old URLs redirect)
- Service URL unchanged for now (keeps live links and subscriptions intact); a custom domain will take over after huixiang.ai is registered

### v0.0.8 · 2026-07-07 — the admin becomes a real SaaS console

- **Full product UI** replaces the single-page report: persistent sidebar (Links / Subscribers / Account / Advanced, hash routing) + workspace, Claude coral + cream theme
- **Subscribers view**: totals / 7-day actives + detail table (agent name, push/poll mode, last active) — authors can finally see their AI followers
- Links list: search filter + count, demo rows in the empty state; row actions regrouped as View / Copy / Settings▾ (price, renew, delete)
- Post-registration **binding wizard**: copy a complete binding instruction (so the hand-off to the agent can't be missed), unlocked entry only after copying; forms guard against double submission

### v0.0.7 · 2026-07-07 — email registration accounts + onboarding realignment

- **Registration replaces auto-provisioning**: email + password + unique username (no email verification yet); `/v1/keys` retired (410)
- **Username = homepage address** `/u/<username>`: fixed at registration; changing the byline no longer moves your page; legacy token accounts stay fully compatible
- **Tokens demoted to agent credentials**: issued at register/login (multiple can coexist), recoverable via email login; CLI gains `a4a login <token>` / `--email --password`
- **Onboarding built into the skill**: first use guides registration → user pastes the binding instruction → bind → usage tips; every service run ends with the admin link

### v0.0.6 · 2026-07-07 — webhook push + creator-configurable subscription guidance

- **Push mode (preferred)**: subscriptions can register a `webhook` callback URL — when the author publishes/updates, the server **POSTs the new article JSON immediately**; webhook-capable agents need no scheduled task at all
- **Polling fallback**: agents without a callback URL are guided to a scheduled task, at a frequency the creator configures (default daily)
- **Creator guidance settings**: new admin form (offer push or not; poll frequency 6h/12h/daily/3d/weekly), baked into the guidance served at the author page URL
- Subscriber detail now shows push/poll mode

### v0.0.5 · 2026-07-07 — subscription funnel rerouted: inform the reader, let the user trigger

- **Live-test finding**: mainstream agent harnesses ship prompt-injection defenses — page content that *commands* the agent gets ignored (and the harder it pushes, the more it looks like an attack)
- **The conversion moment moves from agent to user**: articles now open with a reader-facing line — "tell your AI *subscribe to this author for me*"; once the user says it, it's a user instruction the agent will execute
- **The agent note softens to two things**: relay the fact "this author supports AI subscriptions" when summarizing; when the user asks to subscribe, fetch author_page and run its steps (`agent_todo` front matter renamed `agent_note`)
- Author-page execution steps unchanged — by then the agent acts with user authorization and isn't blocked

### v0.0.4 · 2026-07-07 — agent instructions embedded in the HTML rendering too

- **Gap found in live testing**: many agents read articles through browser-style fetchers (Accept: text/html) and get the HTML rendering — where the action instructions previously didn't exist
- Article and author pages now embed an **"instructions for AI agents" block in the HTML footer** (dashed muted box, low-noise for humans), rendered from the same source as the Markdown instructions

### v0.0.3 · 2026-07-07 — stronger subscription prompts: in-article "action instructions"

- **Article footers upgraded to action instructions**: no longer a gentle one-liner — agents are explicitly told to "propose subscribing to the author after reading, don't skip", with branches for agree / decline / already-subscribed / no-scheduler
- **New `agent_todo` front matter field** so the to-do is visible at the metadata level
- **Author-page guide rewritten as an execution checklist**: includes a copy-pasteable scheduled-task prompt template and stresses "registering without creating the task = not subscribed"

### v0.0.2 · 2026-07-07 — subscription loop: registration, dedup guards, subscriber stats

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

The next front door for content is AI. Echo aims to be the distribution layer on the new **author → AI → reader** path. Up next:

- [ ] Real payment providers: authors bring their own WeChat merchant account / aggregator, pluggable
- [ ] Admin panel UI redesign (current one is a minimal working version)
- [ ] Browser extension for one-click capture
- [ ] `llms.txt` and site-level indexing

## 🧑‍💻 Local development

```bash
npm install
npm run dev                                  # http://localhost:8787
A4A_ENDPOINT=http://localhost:8787 node cli/bin/a4a.js login <token>
```

## 📄 License

[MIT](LICENSE)
