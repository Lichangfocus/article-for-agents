// 抓取公众号/小红书文章 → Markdown。
// 在用户本机运行（住宅 IP + 正常 UA），比服务端抓取可靠得多；
// 图片托管交给服务端 /v1/images（见 a4a.js 的发布流程）。

import TurndownService from 'turndown'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export function isGrabbableUrl(s) {
  return /^https?:\/\//i.test((s || '').trim())
}

export function detectPlatform(url) {
  let host
  try {
    host = new URL(url).hostname
  } catch {
    return null
  }
  if (host === 'mp.weixin.qq.com') return 'wechat'
  if (host.endsWith('xiaohongshu.com') || host === 'xhslink.com') return 'xhs'
  return null
}

async function fetchPage(url) {
  let res
  try {
    res = await fetch(url, {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9',
      },
      redirect: 'follow',
    })
  } catch (e) {
    throw new Error(`无法访问 ${url}: ${e.message}`)
  }
  if (!res.ok) throw new Error(`页面返回 HTTP ${res.status}（${url}）`)
  return { html: await res.text(), finalUrl: res.url || url }
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** 取 <meta name|property="key" content="..."> 的所有值（兼容属性顺序颠倒） */
function metaContents(html, key) {
  const out = []
  const re = /<meta\s[^>]*>/gi
  let m
  while ((m = re.exec(html))) {
    const tag = m[0]
    const nameM = tag.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i)
    if (!nameM || nameM[1] !== key) continue
    const contentM = tag.match(/content\s*=\s*["']([^"']*)["']/i)
    if (contentM) out.push(decodeEntities(contentM[1]))
  }
  return out
}

function metaContent(html, key) {
  return metaContents(html, key)[0]
}

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    hr: '---',
  })
  td.remove(['script', 'style', 'noscript'])
  return td
}

/** 从生成的 Markdown 里收集图片 URL（顺序、去重） */
export function collectImages(markdown) {
  const urls = []
  const re = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g
  let m
  while ((m = re.exec(markdown))) {
    if (!urls.includes(m[1])) urls.push(m[1])
  }
  return urls
}

// ---------- 微信公众号 ----------

/** 提取 id="js_content" 那个 div 的 innerHTML（配平 <div> 嵌套） */
function extractJsContent(html) {
  const idAt = html.indexOf('id="js_content"')
  if (idAt < 0) return null
  const open = html.lastIndexOf('<div', idAt)
  if (open < 0) return null
  const bodyStart = html.indexOf('>', idAt) + 1
  const re = /<div\b|<\/div>/g
  re.lastIndex = bodyStart
  let depth = 1
  let m
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1
    if (depth === 0) return html.slice(bodyStart, m.index)
  }
  return null
}

function parseWeChat(html, url) {
  const content = extractJsContent(html)
  if (!content) {
    for (const [sign, why] of [
      ['该内容已被发布者删除', '文章已被发布者删除'],
      ['此内容因违规无法查看', '文章因违规无法查看'],
      ['链接已过期', '链接已过期'],
      ['环境异常', '微信风控拦截（环境异常，需完成验证）'],
      ['当前环境异常', '微信风控拦截（环境异常，需完成验证）'],
    ]) {
      if (html.includes(sign)) throw new Error(`抓取失败：${why}`)
    }
    throw new Error('未找到正文（js_content）。页面结构可能已变化，或需要在浏览器中打开')
  }
  const title =
    metaContent(html, 'og:title') ||
    decodeEntities((html.match(/<h1[^>]*class="rich_media_title"[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').trim() ||
    decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim()
  const author =
    metaContent(html, 'og:article:author') ||
    decodeEntities((html.match(/id="js_name"[^>]*>([\s\S]*?)<\/a>/) || [])[1] || '').trim() ||
    undefined

  // 懒加载图片的真实地址在 data-src
  const cleaned = content.replace(/<img([^>]*?)\bdata-src=/gi, '<img$1 src=')
  let markdown = makeTurndown().turndown(cleaned)
  markdown = markdown.replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (!markdown) throw new Error('正文转换结果为空（可能是纯图片/视频内容）')
  return { platform: 'wechat', title, author, markdown, images: collectImages(markdown), source: url }
}

// ---------- 小红书（图文笔记）----------

function parseXhsState(html) {
  const m = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/)
  if (!m) return null
  try {
    const state = JSON.parse(m[1].replace(/\bundefined\b/g, 'null'))
    const map = state?.note?.noteDetailMap || {}
    const id = state?.note?.firstNoteId || Object.keys(map)[0]
    return map?.[id]?.note || null
  } catch {
    return null
  }
}

function parseXhs(html, url) {
  const note = parseXhsState(html)
  let title, desc, author
  let images = []
  if (note) {
    title = (note.title || '').trim()
    desc = note.desc || ''
    author = note.user?.nickname || note.user?.nickName
    images = (note.imageList || [])
      .map((i) => i.urlDefault || i.url || (i.infoList || []).map((v) => v.url).pop())
      .filter(Boolean)
  } else {
    // 兜底：小红书的 meta 用的是 name= 而非 property=
    title = metaContent(html, 'og:title')
    desc = metaContent(html, 'description') || ''
    images = metaContents(html, 'og:image')
  }
  if (!title && !desc) {
    throw new Error('无法解析小红书页面：可能触发了反爬或需要登录。请在浏览器中打开后把内容复制给我')
  }
  // 话题标签 #美食[话题]# → #美食
  desc = decodeEntities(desc).replace(/#([^#\[\]\n]+)\[话题\]#/g, '#$1').trim()
  const parts = []
  if (desc) parts.push(desc)
  if (images.length) parts.push(images.map((u, i) => `![图 ${i + 1}](${u})`).join('\n\n'))
  const markdown = parts.join('\n\n')
  if (!markdown) throw new Error('笔记内容为空（可能是视频笔记，暂不支持）')
  return { platform: 'xhs', title: title || undefined, author, markdown, images: collectImages(markdown), source: url }
}

// ---------- 入口 ----------

/**
 * 抓取一个链接 → { platform, title, author, markdown, images, source }
 * markdown 中的图片仍指向平台图床，托管/重写由调用方完成。
 */
export async function grab(url) {
  url = url.trim()
  let platform = detectPlatform(url)
  if (!platform) {
    throw new Error(
      '暂只支持微信公众号（mp.weixin.qq.com）和小红书（xiaohongshu.com / xhslink.com）链接。\n' +
        '其他来源请把文章原文直接提供给我（AI agent 也可以自行用浏览器打开该页面，提取正文后按普通文章发布）'
    )
  }
  const { html, finalUrl } = await fetchPage(url)
  // xhslink 短链会 302 到 xiaohongshu.com；以落地页判定
  platform = detectPlatform(finalUrl) || platform
  return platform === 'wechat' ? parseWeChat(html, url) : parseXhs(html, url)
}
