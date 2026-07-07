// a4a 管理后台（单页，无外部依赖）。设计语言：Claude 珊瑚橘 + 米白纸感，简约卡片式。
// 注意：本文件模板里不要出现反引号与 "${"，内部 JS 一律用字符串拼接。

export const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>a4a 后台 — 内容分发管理</title>
<style>
:root {
  --bg: #FAF9F5;
  --card: #FFFFFF;
  --ink: #2D2A24;
  --muted: #8A8272;
  --line: #E8E3D8;
  --accent: #D97757;
  --accent-dk: #C4633F;
  --accent-soft: #FBF1EC;
  --danger: #C4432B;
  --ok: #2E7D4F;
}
* { box-sizing: border-box; accent-color: var(--accent); }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.6; }
a { color: var(--accent-dk); text-decoration: none; }
a:hover { text-decoration: underline; }

.topbar { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.4rem; border-bottom: 1px solid var(--line); background: var(--card); }
.brand { display: flex; align-items: center; gap: .55rem; font-weight: 600; font-size: 1.02rem; letter-spacing: .01em; }
.brand .dot { width: .72rem; height: .72rem; border-radius: 50%; background: var(--accent); }
.brand small { color: var(--muted); font-weight: 400; }
.whoami { color: var(--muted); font-size: .88rem; display: flex; align-items: center; gap: .8rem; }

.wrap { max-width: 60rem; margin: 1.6rem auto 4rem; padding: 0 1.2rem; }
.narrow { max-width: 26rem; margin: 3.5rem auto; padding: 0 1.2rem; }

.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 1.3rem 1.5rem; margin-bottom: 1.1rem; box-shadow: 0 1px 2px rgba(60,50,30,.04); }
.card h2 { margin: 0 0 .8rem; font-size: 1.02rem; font-weight: 600; }
.card h2 .sub { color: var(--muted); font-weight: 400; font-size: .85rem; margin-left: .5rem; }

input, select { width: 100%; padding: .6rem .75rem; font-size: .95rem; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: var(--ink); margin-bottom: .65rem; }
input:focus, select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
select { width: auto; margin: 0; padding: .35rem .5rem; font-size: .86rem; }

button { font: inherit; cursor: pointer; border-radius: 9px; border: 1px solid var(--line); background: #fff; color: var(--ink); padding: .42rem .95rem; font-size: .88rem; }
button:hover { border-color: var(--accent); color: var(--accent-dk); }
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; padding: .58rem 1.35rem; font-weight: 500; }
button.primary:hover { background: var(--accent-dk); border-color: var(--accent-dk); color: #fff; }
button:disabled { opacity: .5; cursor: default; }
button.ghost { border: none; background: none; color: var(--muted); padding: .3rem .4rem; }
button.ghost:hover { color: var(--danger); }

.tabs { display: flex; gap: .4rem; margin-bottom: 1.1rem; background: var(--bg); border-radius: 10px; padding: .3rem; }
.tabs button { flex: 1; border: none; background: none; padding: .5rem 0; border-radius: 8px; color: var(--muted); }
.tabs button.active { background: var(--card); color: var(--ink); font-weight: 600; box-shadow: 0 1px 3px rgba(60,50,30,.08); }

.auth-logo { text-align: center; margin-bottom: 1.4rem; }
.auth-logo .dot { display: inline-block; width: .9rem; height: .9rem; border-radius: 50%; background: var(--accent); margin-right: .5rem; }
.auth-logo h1 { display: inline; font-size: 1.25rem; letter-spacing: .01em; }
.auth-logo p { color: var(--muted); font-size: .88rem; margin: .4rem 0 0; }

.hint { color: var(--muted); font-size: .84rem; }
.msg { min-height: 1.4rem; font-size: .87rem; color: var(--danger); margin-top: .4rem; }
.msg.good { color: var(--ok); }

details.alt { margin-top: 1rem; color: var(--muted); font-size: .86rem; }
details.alt summary { cursor: pointer; }
details.alt input { margin-top: .6rem; }

.steps { counter-reset: step; }
.step { display: flex; gap: .9rem; margin-bottom: 1.15rem; }
.step .n { flex: none; width: 1.7rem; height: 1.7rem; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: .88rem; font-weight: 600; margin-top: .1rem; }
.step .n.todo { background: var(--line); color: var(--muted); }
.step h3 { margin: 0 0 .3rem; font-size: .98rem; }
.step p { margin: .25rem 0; font-size: .9rem; }
.bindbox { background: var(--bg); border: 1px dashed var(--accent); border-radius: 10px; padding: .8rem 1rem; font-size: .92rem; word-break: break-all; margin: .55rem 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: var(--muted); font-size: .8rem; font-weight: 500; padding: .45rem .5rem; border-bottom: 1px solid var(--line); }
td { padding: .6rem .5rem; border-bottom: 1px solid var(--bg); font-size: .9rem; vertical-align: top; }
tr:hover td { background: var(--bg); }
.pill { display: inline-block; padding: .05rem .55rem; border-radius: 99px; font-size: .76rem; background: var(--bg); color: var(--muted); }
.pill.paid { background: var(--accent-soft); color: var(--accent-dk); }
.expiring { color: var(--danger); }
.row-actions { white-space: nowrap; }
.row-actions button { margin-left: .25rem; padding: .22rem .6rem; font-size: .8rem; }

.acctline { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem 1.6rem; color: var(--muted); font-size: .86rem; padding: .2rem .3rem 1rem; }
.acctline b { color: var(--ink); font-weight: 600; }
button.mini { padding: .05rem .45rem; font-size: .74rem; border-radius: 6px; }

details.adv { margin-top: .4rem; color: var(--muted); font-size: .88rem; }
details.adv summary { cursor: pointer; padding: .5rem .3rem; }
details.adv .inner { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: .9rem 1.2rem; margin-top: .4rem; }

details.dd { display: inline-block; position: relative; }
details.dd summary { list-style: none; cursor: pointer; border: 1px solid var(--line); border-radius: 9px; padding: .22rem .6rem; font-size: .8rem; background: #fff; }
details.dd summary::-webkit-details-marker { display: none; }
details.dd summary:hover { border-color: var(--accent); color: var(--accent-dk); }
details.dd .ddmenu { position: absolute; right: 0; top: 1.9rem; background: #fff; border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 6px 18px rgba(60,50,30,.12); z-index: 10; display: flex; flex-direction: column; min-width: 7rem; overflow: hidden; }
details.dd .ddmenu button { border: none; border-radius: 0; text-align: left; padding: .5rem .9rem; font-size: .84rem; background: #fff; }
details.dd .ddmenu button:hover { background: var(--bg); color: var(--ink); }
details.dd .ddmenu button.danger { color: var(--danger); }

tr.demo td { color: var(--muted); }
tr.demo a { color: var(--muted); pointer-events: none; }
.demo-note { text-align: center; color: var(--muted); font-size: .86rem; padding: .9rem 0 .2rem; }

.inline-cfg { display: flex; align-items: center; flex-wrap: wrap; gap: .7rem; font-size: .9rem; }
#flash { position: fixed; left: 50%; bottom: 2rem; transform: translateX(-50%); background: var(--ink); color: #fff; padding: .55rem 1.1rem; border-radius: 10px; font-size: .88rem; opacity: 0; transition: opacity .25s; pointer-events: none; max-width: 90vw; }
#flash.show { opacity: .96; }
.empty { text-align: center; color: var(--muted); padding: 2.2rem 0; font-size: .92rem; }
footer.pagefoot { text-align: center; color: var(--muted); font-size: .8rem; margin-top: 2.5rem; }
</style>
</head>
<body>

<div class="topbar">
  <div class="brand"><span class="dot"></span>a4a <small>· article for agents · 内容分发后台</small></div>
  <div class="whoami" id="topWho" style="display:none"><span id="topName"></span><button onclick="logout()">退出</button></div>
</div>

<!-- 登录 / 注册 -->
<div class="narrow" id="login">
  <div class="auth-logo">
    <span class="dot"></span><h1>a4a 后台</h1>
    <p>把文章变成人和 AI 都能读的链接，让读者的 AI 订阅你</p>
  </div>
  <div class="card">
    <div class="tabs">
      <button id="tabLogin" class="active" onclick="showTab('login')">登录</button>
      <button id="tabReg" onclick="showTab('reg')">注册新账号</button>
    </div>
    <div id="loginForm">
      <input type="email" id="loginEmail" placeholder="邮箱">
      <input type="password" id="loginPassword" placeholder="密码">
      <button class="primary" id="btnLogin" style="width:100%" onclick="loginEmail()">登录</button>
      <details class="alt"><summary>用 Agent 接入 token 登录（agent / 老账号）</summary>
        <input type="password" id="token" placeholder="a4a_...">
        <button onclick="login()" style="width:100%">token 登录</button>
      </details>
    </div>
    <div id="regForm" style="display:none">
      <p class="hint" style="margin-top:0">注册后获得：唯一用户名（也是你的作者主页地址）+ Agent 接入 token。前期无需邮箱验证。</p>
      <input type="email" id="regEmail" placeholder="邮箱">
      <input type="text" id="regUsername" placeholder="用户名（唯一 · 主页 /u/用户名 · 注册后不可改）">
      <input type="password" id="regPassword" placeholder="密码（至少 8 位）">
      <button class="primary" id="btnReg" style="width:100%" onclick="register()">创建账号</button>
    </div>
    <div id="authMsg" class="msg"></div>
  </div>
</div>

<!-- 注册成功：绑定向导 -->
<div class="narrow" id="onboard" style="display:none;max-width:34rem">
  <div class="card">
    <h2 style="font-size:1.15rem">🎉 注册成功，欢迎 <span id="obName"></span>！</h2>
    <p class="hint">还差最后一步：让你的 AI 绑定这个账号，之后发布就全靠它了。</p>
    <div class="steps" style="margin-top:1.1rem">
      <div class="step">
        <div class="n">1</div>
        <div style="flex:1">
          <h3>复制下面这句话，原样发给你的 AI</h3>
          <p class="hint">Claude Code、豆包、任何能执行命令的 AI 都可以。</p>
          <div class="bindbox" id="bindText"></div>
          <button class="primary" id="btnCopy" onclick="copyBind()">📋 复制绑定指令</button>
          <div class="msg good" id="copyMsg"></div>
        </div>
      </div>
      <div class="step">
        <div class="n todo">2</div>
        <div style="flex:1">
          <h3>AI 回复「绑定成功」后，发布就是一句话的事</h3>
          <p class="hint">把文章原文或公众号 / 小红书链接丢给它：「把这篇转成在线链接」。</p>
        </div>
      </div>
      <div class="step">
        <div class="n todo">3</div>
        <div style="flex:1">
          <h3>管理都在本后台</h3>
          <p class="hint">续期 / 定价 / 删除、改署名、订阅引导设置。你的作者主页：<a id="obHome" target="_blank"></a>（读者发给自己的 AI 即可订阅你）。</p>
        </div>
      </div>
    </div>
    <button class="primary" id="btnEnter" onclick="enterPanel()" disabled>先复制上面的指令 ↑</button>
  </div>
</div>

<!-- 管理面板 -->
<div class="wrap" id="panel" style="display:none">
  <div class="acctline">
    <span>👤 <b id="acctName">—</b></span>
    <span>署名 <b id="authorName">—</b> <button class="mini" onclick="editName()">改</button></span>
    <span id="homeWrap" style="display:none">主页 <a id="homeUrl" target="_blank"></a></span>
    <span id="subsWrap" style="display:none">🤖 AI 订阅者 <b id="subsCount">0</b></span>
  </div>

  <div class="card">
    <h2>我的链接 <span class="sub">默认有效期 7 天，「续期」重置为 7 天 · 把文章丢给你的 AI 即可新增</span></h2>
    <table id="tbl">
      <thead><tr><th>标题</th><th>链接</th><th>价格</th><th>发布</th><th>有效期至</th><th style="text-align:right">操作</th></tr></thead>
      <tbody id="rows"></tbody>
    </table>
    <div id="demoNote" class="demo-note" style="display:none">↑ 以上为示例数据。把文章原文或公众号/小红书链接丢给你的 AI，说「把这篇转成在线链接」，第一条真实链接就会出现在这里。</div>
  </div>

  <details class="adv">
    <summary>⚙️ 高级设置 · 订阅引导（作用于主页里给 AI 的订阅指引）</summary>
    <div class="inner">
      <div class="inline-cfg">
        <label><input type="checkbox" id="cfgWebhook" style="width:auto;margin:0 .3rem 0 0"> 优先引导推送（webhook，更新即达）</label>
        <span>轮询频率建议
          <select id="cfgPoll">
            <option value="6">每 6 小时</option>
            <option value="12">每 12 小时</option>
            <option value="24">每天</option>
            <option value="72">每 3 天</option>
            <option value="168">每周</option>
          </select>
        </span>
        <button onclick="saveGuideCfg()">保存</button>
      </div>
    </div>
  </details>

  <footer class="pagefoot">a4a · 让你的读者成为 agent 时代的第一波订阅者</footer>
</div>

<div id="flash"></div>

<script>
const $ = (id) => document.getElementById(id)
const tokenOf = () => localStorage.getItem('a4a_token') || ''

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { authorization: 'Bearer ' + tokenOf(), 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || ('HTTP ' + res.status))
  return data
}

async function authApi(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || ('HTTP ' + res.status))
  return data
}

function showTab(t) {
  $('loginForm').style.display = t === 'login' ? 'block' : 'none'
  $('regForm').style.display = t === 'reg' ? 'block' : 'none'
  $('tabLogin').className = t === 'login' ? 'active' : ''
  $('tabReg').className = t === 'reg' ? 'active' : ''
  $('authMsg').textContent = ''
}

// 防双击：提交期间禁用按钮
async function withBusy(btnId, labelBusy, fn) {
  const btn = $(btnId)
  if (btn.disabled) return
  const orig = btn.textContent
  btn.disabled = true
  btn.textContent = labelBusy
  try { await fn() } finally { btn.disabled = false; btn.textContent = orig }
}

function register() {
  withBusy('btnReg', '创建中…', async () => {
    try {
      const data = await authApi('/v1/register', {
        email: $('regEmail').value.trim(),
        username: $('regUsername').value.trim(),
        password: $('regPassword').value,
      })
      localStorage.setItem('a4a_token', data.token)
      $('login').style.display = 'none'
      $('obName').textContent = data.username
      $('bindText').textContent = '帮我绑定 a4a 账号，token 是 ' + data.token + ' ，服务端是 ' + location.origin + ' 。绑定完成后告诉我怎么发布文章。'
      $('obHome').textContent = decodeURIComponent(data.home_url)
      $('obHome').href = data.home_url
      $('onboard').style.display = 'block'
      window.scrollTo(0, 0)
    } catch (e) { $('authMsg').textContent = '注册失败: ' + e.message }
  })
}

function loginEmail() {
  withBusy('btnLogin', '登录中…', async () => {
    try {
      const data = await authApi('/v1/login', { email: $('loginEmail').value.trim(), password: $('loginPassword').value })
      localStorage.setItem('a4a_token', data.token)
      refresh()
    } catch (e) { $('authMsg').textContent = '登录失败: ' + e.message }
  })
}

function login() {
  const t = $('token').value.trim()
  if (!t) return
  localStorage.setItem('a4a_token', t)
  refresh()
}

async function copyBind() {
  await navigator.clipboard.writeText($('bindText').textContent)
  $('copyMsg').textContent = '✅ 已复制。现在切到你的 AI，粘贴发送，等它回复「绑定成功」。'
  const be = $('btnEnter')
  be.disabled = false
  be.textContent = '我已发给 AI · 进入管理后台 →'
}

function enterPanel() {
  $('onboard').style.display = 'none'
  refresh()
}

function logout() {
  localStorage.removeItem('a4a_token')
  $('panel').style.display = 'none'
  $('onboard').style.display = 'none'
  $('topWho').style.display = 'none'
  $('login').style.display = 'block'
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

async function refresh() {
  if (!tokenOf()) return
  let data
  try {
    data = await api('GET', '/v1/articles')
  } catch (e) {
    $('authMsg').textContent = '登录失败: ' + e.message
    logout()
    return
  }
  $('login').style.display = 'none'
  $('panel').style.display = 'block'
  api('GET', '/v1/me').then((me) => {
    $('authorName').textContent = me.authorName || '（未设置）'
    $('acctName').textContent = me.username ? me.username + (me.email ? '（' + me.email + '）' : '') : 'token 账号（早期）'
    $('topWho').style.display = 'flex'
    $('topName').textContent = me.username || me.authorName || ''
    if (me.home_url) {
      $('homeWrap').style.display = ''
      $('homeUrl').textContent = decodeURIComponent(me.home_url).replace(/^https?:\\/\\//, '')
      $('homeUrl').href = me.home_url
    }
    $('cfgWebhook').checked = me.offerWebhook !== false
    $('cfgPoll').value = String(me.pollIntervalHours || 24)
  }).catch(() => {})
  api('GET', '/v1/subscribers').then((s) => {
    if (s.total > 0) {
      $('subsWrap').style.display = ''
      $('subsCount').textContent = s.total + '（近 7 天活跃 ' + s.active_7d + '）'
    }
  }).catch(() => {})
  renderRows(data.articles)
}

function articleRow(a, isDemo) {
  const soon = Date.now() + 2 * 86400e3
  const tr = document.createElement('tr')
  if (isDemo) tr.className = 'demo'
  const expCls = !isDemo && Date.parse(a.expiresAt) < soon ? 'expiring' : ''
  const actions = isDemo
    ? '<button disabled>查看</button> <button disabled>复制</button> <button disabled>设置</button>'
    : '<button onclick="window.open(\\'/' + a.id + '\\', \\'_blank\\')">查看</button> ' +
      '<button onclick="copyUrl(\\'' + a.id + '\\')">复制</button> ' +
      '<details class="dd"><summary>设置 ▾</summary><div class="ddmenu">' +
        '<button onclick="setPrice(\\'' + a.id + '\\',' + (a.price || 0) + ')">定价</button>' +
        '<button onclick="renew(\\'' + a.id + '\\')">续期 7 天</button>' +
        '<button class="danger" onclick="del(\\'' + a.id + '\\')">删除</button>' +
      '</div></details>'
  tr.innerHTML =
    '<td>' + (isDemo ? '<span class="pill">示例</span> ' : '') + esc(a.title) + '</td>' +
    '<td><a href="/' + a.id + '" target="_blank">/' + a.id + '</a></td>' +
    '<td>' + (a.price ? '<span class="pill paid">¥' + a.price.toFixed(2) + '</span>' : '<span class="pill">免费</span>') + '</td>' +
    '<td class="hint">' + a.createdAt.slice(0, 10) + '</td>' +
    '<td class="' + expCls + '">' + (a.expiresAt || '—').slice(0, 10) + '</td>' +
    '<td class="row-actions" style="text-align:right">' + actions + '</td>'
  return tr
}

function renderRows(articles) {
  const rows = $('rows')
  rows.innerHTML = ''
  const empty = !articles.length
  $('demoNote').style.display = empty ? 'block' : 'none'
  if (empty) {
    const day = 86400e3
    const demo = [
      { id: 'AbC12xYz', title: '为什么你的下一个读者是一个 AI', price: 0, createdAt: new Date(Date.now() - day).toISOString(), expiresAt: new Date(Date.now() + 6 * day).toISOString() },
      { id: 'Qw34ErTy', title: '给 AI 读的文章，应该怎么写？三条实践笔记', price: 3, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * day).toISOString() },
    ]
    for (const a of demo) rows.appendChild(articleRow(a, true))
    return
  }
  for (const a of articles) rows.appendChild(articleRow(a, false))
}

// 点击别处时收起「设置」下拉
document.addEventListener('click', (e) => {
  document.querySelectorAll('details.dd[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open') })
})

async function editName() {
  const cur = $('authorName').textContent
  const name = prompt('新署名（新文章的默认作者；注册制账号的主页地址固定为 /u/<用户名>，不受影响）:', cur)
  if (!name || name.trim() === cur) return
  try { await api('PUT', '/v1/me', { authorName: name.trim() }); flash('署名已更新'); refresh() }
  catch (e) { flash('更新失败: ' + e.message) }
}

async function saveGuideCfg() {
  try {
    await api('PUT', '/v1/me', { offerWebhook: $('cfgWebhook').checked, pollIntervalHours: parseInt($('cfgPoll').value, 10) })
    flash('订阅引导设置已保存，主页指引已同步更新')
  } catch (e) { flash('保存失败: ' + e.message) }
}

async function copyUrl(id) {
  await navigator.clipboard.writeText(location.origin + '/' + id)
  flash('已复制 ' + location.origin + '/' + id)
}

async function setPrice(id, cur) {
  const v = prompt('设定价格（元，0 = 免费）。付费文章对 AI 返回 402 + 支付二维码：', cur)
  if (v === null) return
  const price = parseFloat(v)
  if (isNaN(price) || price < 0) { flash('价格无效'); return }
  try { await api('PUT', '/v1/articles/' + id, { price }); flash(price > 0 ? '已定价 ¥' + price.toFixed(2) : '已设为免费'); refresh() }
  catch (e) { flash('定价失败: ' + e.message) }
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
  const el = $('flash')
  el.textContent = text
  el.className = 'show'
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { el.className = '' }, 3200)
}

// 回车提交
$('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') loginEmail() })
$('regPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') register() })

refresh()
</script>
</body>
</html>`
