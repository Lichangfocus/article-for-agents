import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { cors } from 'hono/cors'
import { marked } from 'marked'

type Env = {
  A4A_KV: KVNamespace
  OPEN_REGISTRATION: string
  MAX_CONTENT_BYTES: string
  LINK_TTL_DAYS: string
}

type Vars = {
  owner: string
}

type Article = {
  id: string
  title: string
  content: string
  author?: string
  source?: string
  tags?: string[]
  lang?: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  owner: string
}

type IndexEntry = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

type AppEnv = { Bindings: Env; Variables: Vars }

const app = new Hono<AppEnv>()

// ---------- helpers ----------

const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function randomB62(len: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  let out = ''
  for (const b of bytes) out += B62[b % 62]
  return out
}

async function sha256hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function articleKey(id: string) {
  return `art:${id}`
}
function indexKey(owner: string) {
  return `idx:${owner}`
}
function tokenKey(hash: string) {
  return `key:${hash}`
}

function ttlSeconds(env: Env): number {
  const days = parseInt(env.LINK_TTL_DAYS || '7', 10)
  return days * 86400
}

function json(c: Context, status: number, body: unknown) {
  return c.json(body as object, status as 200)
}

function yamlEscape(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`
}

/** The canonical machine-readable representation of an article. */
function toMarkdown(a: Article, origin: string): string {
  const lines = ['---']
  lines.push(`title: ${yamlEscape(a.title)}`)
  if (a.author) lines.push(`author: ${yamlEscape(a.author)}`)
  if (a.source) lines.push(`source: ${yamlEscape(a.source)}`)
  if (a.tags?.length) lines.push(`tags: [${a.tags.map(yamlEscape).join(', ')}]`)
  if (a.lang) lines.push(`lang: ${yamlEscape(a.lang)}`)
  lines.push(`published: ${a.createdAt}`)
  lines.push(`expires: ${a.expiresAt}`)
  lines.push(`canonical: ${origin}/${a.id}`)
  lines.push('---')
  return `${lines.join('\n')}\n\n# ${a.title}\n\n${a.content.trim()}\n`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Browsers send an Accept header that explicitly prefers text/html; fetch()/curl/agents don't. */
function wantsHtml(c: Context): boolean {
  const accept = c.req.header('accept') ?? ''
  return accept.includes('text/html')
}

async function loadIndex(kv: KVNamespace, owner: string): Promise<IndexEntry[]> {
  return (await kv.get<IndexEntry[]>(indexKey(owner), 'json')) ?? []
}

async function saveIndex(kv: KVNamespace, owner: string, idx: IndexEntry[]): Promise<void> {
  await kv.put(indexKey(owner), JSON.stringify(idx))
}

// ---------- auth ----------

async function requireAuth(c: Context<AppEnv>, next: Next) {
  const auth = c.req.header('authorization') ?? ''
  const m = auth.match(/^Bearer\s+(\S+)$/i)
  if (!m) return json(c, 401, { error: 'missing_token', message: 'Set Authorization: Bearer <token>' })
  const hash = await sha256hex(m[1])
  const exists = await c.env.A4A_KV.get(tokenKey(hash))
  if (!exists) return json(c, 401, { error: 'invalid_token', message: 'Unknown token. Run `a4a init` to get one.' })
  c.set('owner', hash)
  await next()
}

// ---------- API ----------

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }))

app.post('/v1/keys', async (c) => {
  if (c.env.OPEN_REGISTRATION !== 'true') {
    return json(c, 403, { error: 'registration_closed', message: 'This instance does not allow self-registration.' })
  }
  const token = `a4a_${randomB62(32)}`
  const hash = await sha256hex(token)
  await c.env.A4A_KV.put(tokenKey(hash), JSON.stringify({ createdAt: new Date().toISOString() }))
  return json(c, 201, { token })
})

app.use('/v1/articles', requireAuth)
app.use('/v1/articles/*', requireAuth)

type ArticleInput = {
  title?: unknown
  content?: unknown
  author?: unknown
  source?: unknown
  tags?: unknown
  lang?: unknown
}

function validateInput(c: Context<AppEnv>, body: ArticleInput, requireAll: boolean): string | null {
  if (requireAll || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return 'title must be a non-empty string'
    if (body.title.length > 500) return 'title too long (max 500 chars)'
  }
  if (requireAll || body.content !== undefined) {
    if (typeof body.content !== 'string' || !body.content.trim()) return 'content must be a non-empty string'
    const max = parseInt(c.env.MAX_CONTENT_BYTES || '1048576', 10)
    if (new TextEncoder().encode(body.content).length > max) return `content too large (max ${max} bytes)`
  }
  for (const f of ['author', 'source', 'lang'] as const) {
    if (body[f] !== undefined && (typeof body[f] !== 'string' || (body[f] as string).length > 500))
      return `${f} must be a string (max 500 chars)`
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== 'string') || body.tags.length > 20)
      return 'tags must be an array of up to 20 strings'
  }
  return null
}

app.post('/v1/articles', async (c) => {
  let body: ArticleInput
  try {
    body = await c.req.json<ArticleInput>()
  } catch {
    return json(c, 400, { error: 'bad_json', message: 'Request body must be JSON' })
  }
  const err = validateInput(c, body, true)
  if (err) return json(c, 400, { error: 'invalid_input', message: err })

  const owner = c.get('owner')
  const ttl = ttlSeconds(c.env)
  const now = new Date()
  const article: Article = {
    id: randomB62(8),
    title: (body.title as string).trim(),
    content: body.content as string,
    author: body.author as string | undefined,
    source: body.source as string | undefined,
    tags: body.tags as string[] | undefined,
    lang: body.lang as string | undefined,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
    owner,
  }
  await c.env.A4A_KV.put(articleKey(article.id), JSON.stringify(article), { expirationTtl: ttl })
  const idx = await loadIndex(c.env.A4A_KV, owner)
  idx.unshift({
    id: article.id,
    title: article.title,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    expiresAt: article.expiresAt,
  })
  await saveIndex(c.env.A4A_KV, owner, idx)

  const origin = new URL(c.req.url).origin
  return json(c, 201, {
    id: article.id,
    url: `${origin}/${article.id}`,
    markdown_url: `${origin}/${article.id}.md`,
    expiresAt: article.expiresAt,
    admin_url: `${origin}/admin`,
  })
})

app.get('/v1/articles', async (c) => {
  const owner = c.get('owner')
  const idx = await loadIndex(c.env.A4A_KV, owner)
  // KV 会自动清掉过期正文；这里顺手把索引里的过期条目也清掉
  const now = Date.now()
  const live = idx.filter((e) => !e.expiresAt || Date.parse(e.expiresAt) > now)
  if (live.length !== idx.length) await saveIndex(c.env.A4A_KV, owner, live)
  const origin = new URL(c.req.url).origin
  return json(c, 200, {
    articles: live.map((e) => ({ ...e, url: `${origin}/${e.id}` })),
  })
})

async function loadOwnArticle(c: Context<AppEnv>): Promise<Article | null> {
  const id = c.req.param('id') as string
  const article = await c.env.A4A_KV.get<Article>(articleKey(id), 'json')
  if (!article || article.owner !== c.get('owner')) return null
  return article
}

app.get('/v1/articles/:id', async (c) => {
  const article = await loadOwnArticle(c)
  if (!article) return json(c, 404, { error: 'not_found', message: 'No such article under your token' })
  const { owner: _omit, ...rest } = article
  return json(c, 200, rest)
})

app.put('/v1/articles/:id', async (c) => {
  const article = await loadOwnArticle(c)
  if (!article) return json(c, 404, { error: 'not_found', message: 'No such article under your token' })
  let body: ArticleInput
  try {
    body = await c.req.json<ArticleInput>()
  } catch {
    return json(c, 400, { error: 'bad_json', message: 'Request body must be JSON' })
  }
  const err = validateInput(c, body, false)
  if (err) return json(c, 400, { error: 'invalid_input', message: err })

  if (typeof body.title === 'string') article.title = body.title.trim()
  if (typeof body.content === 'string') article.content = body.content
  for (const f of ['author', 'source', 'lang'] as const) {
    if (typeof body[f] === 'string') article[f] = body[f] as string
  }
  if (Array.isArray(body.tags)) article.tags = body.tags as string[]
  const ttl = ttlSeconds(c.env)
  article.updatedAt = new Date().toISOString()
  article.expiresAt = new Date(Date.now() + ttl * 1000).toISOString()

  await c.env.A4A_KV.put(articleKey(article.id), JSON.stringify(article), { expirationTtl: ttl })
  const idx = await loadIndex(c.env.A4A_KV, article.owner)
  const entry = idx.find((e) => e.id === article.id)
  if (entry) {
    entry.title = article.title
    entry.updatedAt = article.updatedAt
    entry.expiresAt = article.expiresAt
    await saveIndex(c.env.A4A_KV, article.owner, idx)
  }
  return json(c, 200, { id: article.id, updatedAt: article.updatedAt, expiresAt: article.expiresAt })
})

// 续期：不改内容，重置有效期
app.post('/v1/articles/:id/renew', async (c) => {
  const article = await loadOwnArticle(c)
  if (!article) return json(c, 404, { error: 'not_found', message: 'No such article under your token' })
  const ttl = ttlSeconds(c.env)
  article.expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
  await c.env.A4A_KV.put(articleKey(article.id), JSON.stringify(article), { expirationTtl: ttl })
  const idx = await loadIndex(c.env.A4A_KV, article.owner)
  const entry = idx.find((e) => e.id === article.id)
  if (entry) {
    entry.expiresAt = article.expiresAt
    await saveIndex(c.env.A4A_KV, article.owner, idx)
  }
  return json(c, 200, { id: article.id, expiresAt: article.expiresAt })
})

app.delete('/v1/articles/:id', async (c) => {
  const article = await loadOwnArticle(c)
  if (!article) return json(c, 404, { error: 'not_found', message: 'No such article under your token' })
  await c.env.A4A_KV.delete(articleKey(article.id))
  const idx = await loadIndex(c.env.A4A_KV, article.owner)
  await saveIndex(c.env.A4A_KV, article.owner, idx.filter((e) => e.id !== article.id))
  return json(c, 200, { deleted: article.id })
})

// ---------- public reading ----------

const LANDING_MD = `# article-for-agents

把你的文章变成 AI 一次 fetch 就能读的 URL。

- 读一篇文章: GET /<id> (返回 Markdown) 或 GET /<id>.md
- 发布文章: 使用 a4a CLI (npm: a4a-cli)，见开源项目 article-for-agents
- 管理已发布的链接: /admin

You are likely an AI agent. Every article on this host is served as clean
Markdown with YAML front matter at GET /<id> — no browser automation needed.
`

app.get('/', (c) => {
  if (!wantsHtml(c)) return c.text(LANDING_MD, 200, { 'content-type': 'text/markdown; charset=utf-8' })
  return c.html(renderPage('article-for-agents', marked.parse(LANDING_MD) as string))
})

// ---------- 后台管理页 ----------

const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>a4a 后台 — 管理我的链接</title>
<style>
body { max-width: 52rem; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.6; color: #222; }
h1 { font-size: 1.4rem; }
input[type=password], input[type=text] { width: 100%; box-sizing: border-box; padding: .5rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 6px; }
button { padding: .35rem .8rem; border: 1px solid #ccc; border-radius: 6px; background: #fff; cursor: pointer; font-size: .85rem; }
button:hover { background: #f3f3f3; }
button.primary { background: #0969da; color: #fff; border-color: #0969da; }
table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
th, td { text-align: left; padding: .5rem .4rem; border-bottom: 1px solid #eee; font-size: .9rem; vertical-align: top; }
.muted { color: #888; font-size: .85rem; }
.expiring { color: #c4432b; }
.msg { margin: .8rem 0; color: #0969da; }
a { color: #0969da; text-decoration: none; }
.row-actions button { margin-right: .3rem; }
</style>
</head>
<body>
<h1>📝 a4a 后台 — 管理我的链接</h1>
<div id="login">
  <p class="muted">粘贴你的 token 登录（在电脑上运行 <code>a4a token</code> 查看）。token 只保存在本浏览器。</p>
  <input type="password" id="token" placeholder="a4a_...">
  <p><button class="primary" onclick="login()">登录</button></p>
</div>
<div id="panel" style="display:none">
  <p class="muted">链接默认有效期 7 天，过期自动失效；点「续期」重置为 7 天。 <a href="#" onclick="logout();return false">退出登录</a></p>
  <div id="msg" class="msg"></div>
  <table id="tbl" style="display:none">
    <thead><tr><th>标题</th><th>链接</th><th>发布</th><th>有效期至</th><th></th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
  <p id="empty" class="muted" style="display:none">还没有发布过文章。运行 <code>a4a publish 文章.md</code> 发布第一篇。</p>
</div>
<script>
const $ = (id) => document.getElementById(id)
const tokenOf = () => localStorage.getItem('a4a_token') || ''

async function api(method, path) {
  const res = await fetch(path, { method, headers: { authorization: 'Bearer ' + tokenOf() } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || ('HTTP ' + res.status))
  return data
}

function login() {
  const t = $('token').value.trim()
  if (!t) return
  localStorage.setItem('a4a_token', t)
  refresh()
}

function logout() {
  localStorage.removeItem('a4a_token')
  $('panel').style.display = 'none'
  $('login').style.display = 'block'
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

async function refresh() {
  if (!tokenOf()) return
  let data
  try {
    data = await api('GET', '/v1/articles')
  } catch (e) {
    $('msg').textContent = '登录失败: ' + e.message
    logout()
    $('msg').textContent && setTimeout(() => { $('msg').textContent = '' }, 4000)
    return
  }
  $('login').style.display = 'none'
  $('panel').style.display = 'block'
  const rows = $('rows')
  rows.innerHTML = ''
  $('tbl').style.display = data.articles.length ? 'table' : 'none'
  $('empty').style.display = data.articles.length ? 'none' : 'block'
  const soon = Date.now() + 2 * 86400e3
  for (const a of data.articles) {
    const tr = document.createElement('tr')
    const expCls = Date.parse(a.expiresAt) < soon ? 'expiring' : ''
    tr.innerHTML =
      '<td>' + esc(a.title) + '</td>' +
      '<td><a href="/' + a.id + '" target="_blank">/' + a.id + '</a></td>' +
      '<td class="muted">' + a.createdAt.slice(0, 10) + '</td>' +
      '<td class="' + expCls + '">' + (a.expiresAt || '—').slice(0, 10) + '</td>' +
      '<td class="row-actions">' +
        '<button onclick="copyUrl(\\'' + a.id + '\\')">复制链接</button>' +
        '<button onclick="renew(\\'' + a.id + '\\')">续期</button>' +
        '<button onclick="del(\\'' + a.id + '\\')">删除</button>' +
      '</td>'
    rows.appendChild(tr)
  }
}

async function copyUrl(id) {
  await navigator.clipboard.writeText(location.origin + '/' + id)
  flash('已复制 ' + location.origin + '/' + id)
}

async function renew(id) {
  try { const r = await api('POST', '/v1/articles/' + id + '/renew'); flash('已续期至 ' + r.expiresAt.slice(0, 10)); refresh() }
  catch (e) { flash('续期失败: ' + e.message) }
}

async function del(id) {
  if (!confirm('确定删除 /' + id + ' ？删除后链接立即失效。')) return
  try { await api('DELETE', '/v1/articles/' + id); flash('已删除'); refresh() }
  catch (e) { flash('删除失败: ' + e.message) }
}

let flashTimer
function flash(text) {
  $('msg').textContent = text
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { $('msg').textContent = '' }, 4000)
}

refresh()
</script>
</body>
</html>`

app.get('/admin', (c) => c.html(ADMIN_HTML))

app.get('/:idmd{[0-9A-Za-z]+\\.md}', async (c) => {
  const id = c.req.param('idmd').slice(0, -3)
  return serveMarkdown(c, id)
})

app.get('/:id{[0-9A-Za-z]+}', async (c) => {
  const id = c.req.param('id')
  if (!wantsHtml(c)) return serveMarkdown(c, id)

  const article = await c.env.A4A_KV.get<Article>(articleKey(id), 'json')
  if (!article) return c.html(renderPage('Not found', '<p>文章不存在或已删除。</p>'), 404)
  const origin = new URL(c.req.url).origin
  const meta = [
    article.author && `作者: ${escapeHtml(article.author)}`,
    `发布: ${article.createdAt.slice(0, 10)}`,
    article.expiresAt && `有效期至: ${article.expiresAt.slice(0, 10)}`,
    article.source && `<a href="${escapeHtml(article.source)}" rel="noopener">原文</a>`,
  ]
    .filter(Boolean)
    .join(' · ')
  const bodyHtml = `
<article>
<h1>${escapeHtml(article.title)}</h1>
<p class="meta">${meta}</p>
${marked.parse(article.content) as string}
</article>
<footer>
<p>🤖 AI 可直接读取本文的 Markdown 版本: <a href="${origin}/${id}.md">${origin}/${id}.md</a><br>
把上面这个链接（或本页链接）直接发给任何 AI 助手即可。</p>
</footer>`
  return c.html(renderPage(article.title, bodyHtml))
})

async function serveMarkdown(c: Context<AppEnv>, id: string) {
  const article = await c.env.A4A_KV.get<Article>(articleKey(id), 'json')
  if (!article) {
    return c.text('Article not found.\n', 404, { 'content-type': 'text/plain; charset=utf-8' })
  }
  const origin = new URL(c.req.url).origin
  return c.text(toMarkdown(article, origin), 200, {
    'content-type': 'text/markdown; charset=utf-8',
    'cache-control': 'public, max-age=60',
  })
}

function renderPage(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
body { max-width: 42rem; margin: 2rem auto; padding: 0 1rem; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.75; color: #222; }
.meta { color: #888; font-size: .9rem; }
img { max-width: 100%; }
pre { overflow-x: auto; background: #f6f6f6; padding: .8rem; border-radius: 6px; }
code { background: #f6f6f6; padding: .1em .3em; border-radius: 4px; }
footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; color: #888; font-size: .85rem; }
a { color: #0969da; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

export default app
