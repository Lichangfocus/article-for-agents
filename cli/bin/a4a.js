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
  a4a publish <file.md | ->           发布文章，输出 URL 和二维码
      [--title <t>] [--author <a>] [--source <原文链接>] [--tags a,b] [--no-qr]
  a4a list                            列出我发布的文章
  a4a show <id>                       查看文章详情（含正文）
  a4a update <id> <file.md | ->       更新文章内容
      [--title <t>] [--author <a>] [--source <url>] [--tags a,b]
  a4a renew <id>                      续期（重置为 7 天有效）
  a4a delete <id>                     删除文章
  a4a token                           显示 token 和后台地址（用于网页登录）

通用选项:
  --json        以 JSON 输出结果（供脚本/AI 使用）
  --endpoint    覆盖服务端地址（也可用环境变量 A4A_ENDPOINT）
  --token       覆盖 token（也可用环境变量 A4A_TOKEN）

示例:
  a4a publish draft.md --source "https://mp.weixin.qq.com/s/xxxx"
  cat draft.md | a4a publish - --title "我的文章" --json
`

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
      endpoint: { type: 'string' },
      token: { type: 'string' },
      json: { type: 'boolean', default: false },
      'no-qr': { type: 'boolean', default: false },
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
        console.log(JSON.stringify({ ok: true, endpoint: conn.endpoint, config: CONFIG_PATH, authorName: data.authorName, admin_url: data.admin_url, token: data.token }))
      } else {
        console.log(`✅ 已注册并保存 token 到 ${CONFIG_PATH}`)
        console.log(`   服务端: ${conn.endpoint}`)
        console.log(`   笔名:   ${data.authorName}（新文章的默认作者，可在后台修改）`)
        console.log(`   后台:   ${data.admin_url || conn.endpoint + '/admin'}（用 token 登录，token 用 \`a4a token\` 查看）`)
        console.log(`   ⚠️ token 是唯一凭证，请妥善保存`)
        console.log(`   现在可以运行: a4a publish 你的文章.md`)
      }
      return
    }

    case 'publish': {
      const fileArg = rest[0]
      if (!fileArg) fail('用法: a4a publish <file.md | ->', values.json)
      const raw = readInput(fileArg)
      const extracted = extractTitle(raw)
      const title = values.title || extracted.title
      if (!title) fail('无法确定标题：请在文中加一级标题（# 标题），或用 --title 指定', values.json)
      const body = {
        title,
        content: extracted.content,
        author: values.author || extracted.author,
        source: values.source || extracted.source,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()) : extracted.tags,
        lang: values.lang,
      }
      const result = await api(conn, 'POST', '/v1/articles', body)
      printPublished(result, values)
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
        console.log(`${a.id}  ${a.createdAt.slice(0, 10)}  有效期至 ${(a.expiresAt || '—').slice(0, 10)}  ${a.title}`)
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
