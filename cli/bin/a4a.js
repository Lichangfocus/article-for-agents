#!/usr/bin/env node
// a4a — article-for-agents CLI
// 把文章发布成 AI 一次 fetch 就能读的 URL。

import { parseArgs } from 'node:util'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import qrcode from 'qrcode-terminal'

const DEFAULT_ENDPOINT = 'https://article-for-agents.lichangin.workers.dev'
const CONFIG_DIR = join(homedir(), '.config', 'a4a')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const HELP = `a4a — 把文章发布成 AI 一次 fetch 就能读的 URL

用法:
  a4a init [--endpoint <url>]         注册并保存 token（只需一次）
  a4a publish <file.md | url | ->     发布文章，输出 URL 和二维码
      [--title <t>] [--author <a>] [--source <原文链接>] [--tags a,b] [--no-qr]
      [--price 3.00]                  付费文章（元）：AI 访问时返回 402 + 支付二维码
      [--no-images]                   （链接发布时）不托管图片，保留平台外链
  a4a grab <url>                      只抓取转 Markdown 输出，不发布
  a4a list                            列出我发布的文章
  a4a show <id>                       查看文章详情（含正文）
  a4a update <id> <file.md | ->       更新文章内容
      [--title <t>] [--author <a>] [--source <url>] [--tags a,b]
  a4a renew <id>                      续期（重置为 7 天有效）
  a4a delete <id>                     删除文章
  a4a home                            显示我的作者主页链接（发给 AI 可订阅更新）
  a4a token                           显示 token 和后台地址（用于网页登录）

通用选项:
  --json        以 JSON 输出结果（供脚本/AI 使用）
  --endpoint    覆盖服务端地址（也可用环境变量 A4A_ENDPOINT）
  --token       覆盖 token（也可用环境变量 A4A_TOKEN）

示例:
  a4a publish "https://mp.weixin.qq.com/s/xxxx"      # 公众号一键搬运（图片自动托管）
  a4a publish "https://www.xiaohongshu.com/explore/…" # 小红书图文
  a4a publish draft.md --source "https://mp.weixin.qq.com/s/xxxx"
  cat draft.md | a4a publish - --title "我的文章" --json
`

const isUrl = (s) => /^https?:\/\//i.test((s || '').trim())

function fail(msg, asJson) {
  if (asJson) console.error(JSON.stringify({ error: msg }))
  else console.error(`错误: ${msg}`)
  process.exit(1)
}

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 })
}

function resolveConn(values) {
  const config = loadConfig()
  const endpoint = (values.endpoint || process.env.A4A_ENDPOINT || config.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '')
  const token = values.token || process.env.A4A_TOKEN || config.token
  return { endpoint, token, config }
}

async function api(conn, method, path, body, { needAuth = true } = {}) {
  if (needAuth && !conn.token) fail('未找到 token，请先运行 `a4a init`', false)
  const headers = { 'content-type': 'application/json' }
  if (conn.token) headers.authorization = `Bearer ${conn.token}`
  let res
  try {
    res = await fetch(conn.endpoint + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (e) {
    fail(`无法连接 ${conn.endpoint}: ${e.message}`, false)
  }
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    fail(`服务端返回了非 JSON 响应 (HTTP ${res.status}): ${text.slice(0, 200)}`, false)
  }
  if (!res.ok) fail(data.message || data.error || `HTTP ${res.status}`, false)
  return data
}

function readInput(fileArg) {
  if (fileArg === '-') return readFileSync(0, 'utf8')
  if (!existsSync(fileArg)) fail(`文件不存在: ${fileArg}`, false)
  return readFileSync(fileArg, 'utf8')
}

/** 从 Markdown 里提取 front matter 的 title / 首个一级标题，并返回剩余正文 */
function extractTitle(raw) {
  let content = raw
  let title
  let author
  let source
  let tags

  const fm = content.match(/^---\n([\s\S]*?)\n---\n?/)
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)$/)
      if (!m) continue
      const val = m[2].trim().replace(/^["']|["']$/g, '')
      if (m[1] === 'title') title = val
      if (m[1] === 'author') author = val
      if (m[1] === 'source') source = val
      if (m[1] === 'tags') tags = val.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    }
    content = content.slice(fm[0].length)
  }

  const h1 = content.match(/^#\s+(.+)$/m)
  if (!title && h1) title = h1[1].trim()
  if (h1) content = content.replace(h1[0], '')

  return { title, author, source, tags, content: content.trim() }
}

function printPublished(result, values) {
  if (values.json) {
    console.log(JSON.stringify(result, null, 2))
    return
  }
  console.log(`\n✅ 已发布`)
  console.log(`\n  ${result.url}`)
  console.log(`\n把这个链接发给任何 AI（Claude/豆包/ChatGPT…），它都能直接读取全文。`)
  if (result.expiresAt) console.log(`有效期至 ${result.expiresAt.slice(0, 10)}（可在 ${result.admin_url || '后台'} 登录续期/管理）`)
  if (!values['no-qr']) {
    console.log('')
    qrcode.generate(result.url, { small: true })
  }
}

// ---------- 图片托管（配合服务端 /v1/images）----------

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function uploadImage(conn, imgUrl) {
  const auth = { authorization: `Bearer ${conn.token}` }
  // 先让服务端代抓（省本地流量）；上游封锁数据中心 IP 时本地下载后直传
  let res = await fetch(`${conn.endpoint}/v1/images`, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ url: imgUrl }),
  })
  if (res.status === 501) {
    const e = new Error('该实例未配置图片托管（R2）')
    e.disabled = true
    throw e
  }
  if (!res.ok) {
    const imgRes = await fetch(imgUrl, { headers: { 'user-agent': BROWSER_UA } })
    if (!imgRes.ok) throw new Error(`下载图片失败 HTTP ${imgRes.status}`)
    res = await fetch(`${conn.endpoint}/v1/images`, {
      method: 'POST',
      headers: { ...auth, 'content-type': 'application/octet-stream' },
      body: Buffer.from(await imgRes.arrayBuffer()),
    })
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`)
  return data
}

/** 把 markdown 里的平台图床图片搬到 a4a 实例，返回重写后的 markdown */
async function hostImages(conn, markdown, images) {
  let done = 0
  for (const u of images) {
    try {
      const r = await uploadImage(conn, u)
      markdown = markdown.split(u).join(r.url)
      done++
      process.stderr.write(`  图片托管 ${done}/${images.length}\n`)
    } catch (e) {
      if (e.disabled) {
        process.stderr.write(`⚠️ ${e.message}，图片保留平台外链（对 AI 可能不可读）\n`)
        return markdown
      }
      process.stderr.write(`⚠️ 图片托管失败，保留外链: ${u.slice(0, 80)} (${e.message})\n`)
    }
  }
  return markdown
}

/** Node 的 fetch 默认不走 HTTP(S)_PROXY；国内访问 workers.dev 常需代理，这里补上 */
async function setupProxy() {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy
  if (!proxy) return
  try {
    const { EnvHttpProxyAgent, setGlobalDispatcher } = await import('undici')
    setGlobalDispatcher(new EnvHttpProxyAgent())
  } catch {
    // undici 不可用时按无代理继续，连不上会在 api() 里报错
  }
}

async function main() {
  await setupProxy()
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      title: { type: 'string' },
      author: { type: 'string' },
      source: { type: 'string' },
      tags: { type: 'string' },
      lang: { type: 'string' },
      price: { type: 'string' },
      endpoint: { type: 'string' },
      token: { type: 'string' },
      json: { type: 'boolean', default: false },
      'no-qr': { type: 'boolean', default: false },
      'no-images': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  const [cmd, ...rest] = positionals
  if (values.help || !cmd) {
    console.log(HELP)
    process.exit(cmd ? 0 : 1)
  }

  const conn = resolveConn(values)

  switch (cmd) {
    case 'init': {
      const existing = loadConfig()
      if (existing.token && !values.endpoint) {
        console.log(`已有配置 (${CONFIG_PATH})，endpoint: ${existing.endpoint || DEFAULT_ENDPOINT}`)
        console.log('如需重新注册，请先删除该文件。')
        return
      }
      const data = await api(conn, 'POST', '/v1/keys', undefined, { needAuth: false })
      saveConfig({ endpoint: conn.endpoint, token: data.token })
      if (values.json) {
        console.log(JSON.stringify({ ok: true, endpoint: conn.endpoint, config: CONFIG_PATH, authorName: data.authorName, admin_url: data.admin_url, home_url: data.home_url, token: data.token }))
      } else {
        console.log(`✅ 已注册并保存 token 到 ${CONFIG_PATH}`)
        console.log(`   服务端: ${conn.endpoint}`)
        console.log(`   笔名:   ${data.authorName}（新文章的默认作者，可在后台修改）`)
        if (data.home_url) console.log(`   主页:   ${data.home_url}（发给 AI 可订阅你的更新）`)
        console.log(`   后台:   ${data.admin_url || conn.endpoint + '/admin'}（用 token 登录，token 用 \`a4a token\` 查看）`)
        console.log(`   ⚠️ token 是唯一凭证，请妥善保存`)
        console.log(`   现在可以运行: a4a publish 你的文章.md`)
      }
      return
    }

    case 'publish': {
      const fileArg = rest[0]
      if (!fileArg) fail('用法: a4a publish <file.md | url | ->', values.json)
      let body
      if (isUrl(fileArg)) {
        // 链接发布：抓取公众号/小红书 → Markdown → 图片托管 → 发布
        if (!conn.token) fail('未找到 token，请先运行 `a4a init`', values.json)
        const { grab } = await import('../lib/grab.js')
        process.stderr.write(`抓取 ${fileArg} …\n`)
        let g
        try {
          g = await grab(fileArg)
        } catch (e) {
          fail(e.message, values.json)
        }
        let content = g.markdown
        if (!values['no-images'] && g.images.length) {
          content = await hostImages(conn, content, g.images)
        }
        const title = values.title || g.title
        if (!title) fail('抓取到的内容没有标题，请用 --title 指定', values.json)
        body = {
          title,
          content,
          author: values.author || g.author,
          source: values.source || fileArg,
          tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : undefined,
          lang: values.lang,
          price: values.price !== undefined ? parseFloat(values.price) : undefined,
        }
      } else {
        const raw = readInput(fileArg)
        const extracted = extractTitle(raw)
        const title = values.title || extracted.title
        if (!title) fail('无法确定标题：请在文中加一级标题（# 标题），或用 --title 指定', values.json)
        body = {
          title,
          content: extracted.content,
          author: values.author || extracted.author,
          source: values.source || extracted.source,
          tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : extracted.tags,
          lang: values.lang,
          price: values.price !== undefined ? parseFloat(values.price) : undefined,
        }
      }
      if (body.price !== undefined && (isNaN(body.price) || body.price < 0)) fail('--price 必须是 ≥0 的数字（元）', values.json)
      const result = await api(conn, 'POST', '/v1/articles', body)
      printPublished(result, values)
      if (!values.json && body.price > 0) console.log(`💰 付费文章（¥${body.price.toFixed(2)}）：AI 访问会先收到支付二维码，读者扫码后解锁。`)
      return
    }

    case 'grab': {
      const url = rest[0]
      if (!url || !isUrl(url)) fail('用法: a4a grab <公众号/小红书链接>', values.json)
      const { grab } = await import('../lib/grab.js')
      let g
      try {
        g = await grab(url)
      } catch (e) {
        fail(e.message, values.json)
      }
      if (values.json) {
        console.log(JSON.stringify(g, null, 2))
        return
      }
      const fm = ['---']
      if (g.title) fm.push(`title: ${g.title}`)
      if (g.author) fm.push(`author: ${g.author}`)
      fm.push(`source: ${url}`)
      fm.push('---')
      console.log(`${fm.join('\n')}\n\n${g.markdown}`)
      return
    }

    case 'home': {
      const data = await api(conn, 'GET', '/v1/me')
      if (values.json) console.log(JSON.stringify(data, null, 2))
      else if (data.home_url) {
        console.log(`作者主页: ${data.home_url}`)
        console.log('把这个链接发给任何 AI：它能读到你的全部文章列表和订阅指引（AI 可设定时任务持续关注你的更新）。')
      } else {
        console.log('还没有笔名，先运行 `a4a init` 或在后台设置笔名。')
      }
      return
    }

    case 'list': {
      const data = await api(conn, 'GET', '/v1/articles')
      if (values.json) {
        console.log(JSON.stringify(data, null, 2))
        return
      }
      if (!data.articles.length) {
        console.log('还没有发布过文章。运行 `a4a publish <file.md>` 发布第一篇。')
        return
      }
      for (const a of data.articles) {
        const price = a.price ? `  ¥${a.price.toFixed(2)}` : ''
        console.log(`${a.id}  ${a.createdAt.slice(0, 10)}  有效期至 ${(a.expiresAt || '—').slice(0, 10)}${price}  ${a.title}`)
        console.log(`          ${a.url}`)
      }
      return
    }

    case 'show': {
      const id = rest[0]
      if (!id) fail('用法: a4a show <id>', values.json)
      const data = await api(conn, 'GET', `/v1/articles/${id}`)
      if (values.json) console.log(JSON.stringify(data, null, 2))
      else {
        console.log(`# ${data.title}\n`)
        console.log(`id: ${data.id}  发布: ${data.createdAt}  更新: ${data.updatedAt}`)
        if (data.author) console.log(`作者: ${data.author}`)
        if (data.source) console.log(`原文: ${data.source}`)
        console.log(`\n${data.content}`)
      }
      return
    }

    case 'update': {
      const [id, fileArg] = rest
      if (!id || !fileArg) fail('用法: a4a update <id> <file.md | ->', values.json)
      const raw = readInput(fileArg)
      const extracted = extractTitle(raw)
      const body = {
        content: extracted.content,
        title: values.title || extracted.title,
        author: values.author || extracted.author,
        source: values.source || extracted.source,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : extracted.tags,
        price: values.price !== undefined ? parseFloat(values.price) : undefined,
      }
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k])
      const data = await api(conn, 'PUT', `/v1/articles/${id}`, body)
      if (values.json) console.log(JSON.stringify(data, null, 2))
      else console.log(`✅ 已更新 ${data.id} (${data.updatedAt})`)
      return
    }

    case 'renew': {
      const id = rest[0]
      if (!id) fail('用法: a4a renew <id>', values.json)
      const data = await api(conn, 'POST', `/v1/articles/${id}/renew`)
      if (values.json) console.log(JSON.stringify(data, null, 2))
      else console.log(`✅ 已续期至 ${data.expiresAt.slice(0, 10)}`)
      return
    }

    case 'token': {
      if (!conn.token) fail('未找到 token，请先运行 `a4a init`', values.json)
      if (values.json) console.log(JSON.stringify({ token: conn.token, endpoint: conn.endpoint, admin_url: `${conn.endpoint}/admin` }))
      else {
        console.log(`token:    ${conn.token}`)
        console.log(`后台地址: ${conn.endpoint}/admin  （粘贴 token 登录）`)
      }
      return
    }

    case 'delete': {
      const id = rest[0]
      if (!id) fail('用法: a4a delete <id>', values.json)
      const data = await api(conn, 'DELETE', `/v1/articles/${id}`)
      if (values.json) console.log(JSON.stringify(data, null, 2))
      else console.log(`✅ 已删除 ${data.deleted}`)
      return
    }

    default:
      fail(`未知命令: ${cmd}\n\n${HELP}`, false)
  }
}

main()
