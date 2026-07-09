// a4a 管理后台（单页 SaaS 布局，无外部依赖）。
// 设计：Claude 珊瑚橘 + 米白纸感；左侧持久导航 + 右侧工作区四视图（内容链接/订阅者/账号/高级设置）。
// 注意：本文件模板里不要出现反引号与 "${"，内部 JS 一律用字符串拼接。

export const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>回响 · 内容分发后台</title>
<style>
:root {
  --bg: #FAF9F5;
  --side: #F3F0E8;
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
html, body { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; line-height: 1.6; }
a { color: var(--accent-dk); text-decoration: none; }
a:hover { text-decoration: underline; }

/* ---------- 应用壳：侧边栏 + 工作区 ---------- */
.app { display: none; min-height: 100vh; }
.app.on { display: flex; }
.side { width: 232px; flex: none; background: var(--side); border-right: 1px solid var(--line); display: flex; flex-direction: column; padding: 1.1rem .8rem; position: sticky; top: 0; height: 100vh; }
.side .brand { display: flex; align-items: center; gap: .5rem; font-weight: 700; font-size: 1.05rem; padding: .2rem .6rem 1.1rem; }
.side .brand .dot { width: .7rem; height: .7rem; border-radius: 50%; background: var(--accent); }
.side .brand small { color: var(--muted); font-weight: 400; font-size: .72rem; }
.nav { display: flex; flex-direction: column; gap: .15rem; }
.nav a { display: flex; align-items: center; gap: .6rem; padding: .5rem .7rem; border-radius: 9px; color: var(--ink); font-size: .92rem; text-decoration: none; border-left: 3px solid transparent; }
.nav a:hover { background: rgba(255,255,255,.7); text-decoration: none; }
.nav a.active { background: var(--card); font-weight: 600; border-left-color: var(--accent); box-shadow: 0 1px 3px rgba(60,50,30,.07); }
.nav a .ic { width: 1.2rem; text-align: center; }
.side .grow { flex: 1; }
.userchip { display: flex; align-items: center; gap: .55rem; padding: .55rem .7rem; border-top: 1px solid var(--line); font-size: .85rem; }
.userchip .avatar { width: 1.9rem; height: 1.9rem; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; flex: none; }
.userchip .who { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.userchip button { padding: .18rem .55rem; font-size: .76rem; }

.main { flex: 1; min-width: 0; padding: 1.6rem 2rem 3rem; }
.pagehead { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; flex-wrap: wrap; }
.pagehead h1 { margin: 0; font-size: 1.25rem; }
.pagehead p { margin: .15rem 0 0; color: var(--muted); font-size: .86rem; }
.view { display: none; max-width: 62rem; }
.view.on { display: block; }

/* ---------- 通用组件 ---------- */
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 1.2rem 1.4rem; margin-bottom: 1rem; box-shadow: 0 1px 2px rgba(60,50,30,.04); }
input, select { padding: .55rem .75rem; font-size: .93rem; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: var(--ink); }
input:focus, select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
button { font: inherit; cursor: pointer; border-radius: 9px; border: 1px solid var(--line); background: #fff; color: var(--ink); padding: .42rem .95rem; font-size: .88rem; }
button:hover { border-color: var(--accent); color: var(--accent-dk); }
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 500; }
button.primary:hover { background: var(--accent-dk); border-color: var(--accent-dk); color: #fff; }
button:disabled { opacity: .5; cursor: default; }
.pill { display: inline-block; padding: .05rem .55rem; border-radius: 99px; font-size: .76rem; background: var(--bg); color: var(--muted); }
.pill.paid { background: var(--accent-soft); color: var(--accent-dk); }
.pill.push { background: #EAF3EC; color: var(--ok); }
.hint { color: var(--muted); font-size: .84rem; }
.msg { min-height: 1.4rem; font-size: .87rem; color: var(--danger); margin-top: .4rem; }
.msg.good { color: var(--ok); }
.statline { display: flex; gap: 2.2rem; margin-bottom: 1rem; }
.stat b { font-size: 1.35rem; font-weight: 700; display: block; line-height: 1.2; }
.stat span { color: var(--muted); font-size: .8rem; }

/* 表格 */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .8rem; }
.toolbar input { width: 16rem; max-width: 100%; padding: .42rem .7rem; font-size: .86rem; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: var(--muted); font-size: .78rem; font-weight: 500; padding: .45rem .5rem; border-bottom: 1px solid var(--line); }
td { padding: .6rem .5rem; border-bottom: 1px solid var(--bg); font-size: .9rem; vertical-align: middle; }
tr:hover td { background: var(--bg); }
tr.demo td { color: var(--muted); }
tr.demo a { color: var(--muted); pointer-events: none; }
.expiring { color: var(--danger); }
.row-actions { white-space: nowrap; text-align: right; }
.row-actions button { margin-left: .25rem; padding: .22rem .6rem; font-size: .8rem; }
.demo-note { text-align: center; color: var(--muted); font-size: .86rem; padding: .9rem 0 .2rem; }
.empty { text-align: center; color: var(--muted); padding: 2rem 0; font-size: .92rem; }

/* 设置下拉 */
details.dd { display: inline-block; position: relative; }
details.dd summary { list-style: none; cursor: pointer; border: 1px solid var(--line); border-radius: 9px; padding: .22rem .6rem; font-size: .8rem; background: #fff; display: inline-block; }
details.dd summary::-webkit-details-marker { display: none; }
details.dd summary:hover { border-color: var(--accent); color: var(--accent-dk); }
details.dd .ddmenu { position: absolute; right: 0; top: 1.9rem; background: #fff; border: 1px solid var(--line); border-radius: 10px; box-shadow: 0 6px 18px rgba(60,50,30,.12); z-index: 10; display: flex; flex-direction: column; min-width: 7.5rem; overflow: hidden; }
details.dd .ddmenu button { border: none; border-radius: 0; text-align: left; padding: .5rem .9rem; font-size: .84rem; background: #fff; margin: 0; }
details.dd .ddmenu button:hover { background: var(--bg); color: var(--ink); }
details.dd .ddmenu button.danger { color: var(--danger); }

/* 表单行（账号/高级设置） */
.frow { display: flex; align-items: center; gap: .8rem; padding: .65rem 0; border-bottom: 1px solid var(--bg); flex-wrap: wrap; }
.frow:last-child { border-bottom: none; }
.frow .lab { width: 9.5rem; flex: none; color: var(--muted); font-size: .86rem; }
.frow .val { flex: 1; min-width: 12rem; }
.frow input[type=text] { width: 14rem; }

/* ---------- 登录 / 注册 / 向导（居中卡片） ---------- */
.narrow { max-width: 26rem; margin: 3.5rem auto; padding: 0 1.2rem; }
.narrow .card { padding: 1.4rem 1.6rem; }
.auth-logo { text-align: center; margin-bottom: 1.4rem; }
.auth-logo .dot { display: inline-block; width: .9rem; height: .9rem; border-radius: 50%; background: var(--accent); margin-right: .5rem; }
.auth-logo h1 { display: inline; font-size: 1.25rem; }
.auth-logo p { color: var(--muted); font-size: .88rem; margin: .4rem 0 0; }
.narrow input { width: 100%; margin-bottom: .65rem; }
.tabs { display: flex; gap: .4rem; margin-bottom: 1.1rem; background: var(--bg); border-radius: 10px; padding: .3rem; }
.tabs button { flex: 1; border: none; background: none; padding: .5rem 0; border-radius: 8px; color: var(--muted); }
.tabs button.active { background: var(--card); color: var(--ink); font-weight: 600; box-shadow: 0 1px 3px rgba(60,50,30,.08); }
details.alt { margin-top: 1rem; color: var(--muted); font-size: .86rem; }
details.alt summary { cursor: pointer; }
details.alt input { margin-top: .6rem; }
.steps .step { display: flex; gap: .9rem; margin-bottom: 1.15rem; }
.steps .n { flex: none; width: 1.7rem; height: 1.7rem; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: .88rem; font-weight: 600; margin-top: .1rem; }
.steps .n.todo { background: var(--line); color: var(--muted); }
.steps h3 { margin: 0 0 .3rem; font-size: .98rem; }
.steps p { margin: .25rem 0; font-size: .9rem; }
.bindbox { background: var(--bg); border: 1px dashed var(--accent); border-radius: 10px; padding: .8rem 1rem; font-size: .92rem; word-break: break-all; margin: .55rem 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

/* 口令弹层 */
#cmdMask { position: fixed; inset: 0; background: rgba(45,42,36,.35); z-index: 50; display: none; }
#cmdMask.on { display: flex; align-items: center; justify-content: center; }
.cmdbox { background: var(--card); border-radius: 16px; padding: 1.4rem 1.6rem; width: min(34rem, 92vw); max-height: 86vh; overflow-y: auto; box-shadow: 0 18px 50px rgba(45,42,36,.25); }
.cmdbox h2 { margin: 0 0 .2rem; font-size: 1.05rem; }
.cmdbox .sub { color: var(--muted); font-size: .84rem; margin-bottom: 1rem; }
.cmditem { margin-bottom: 1.1rem; }
.cmditem h3 { margin: 0 0 .35rem; font-size: .92rem; }
.cmdtext { background: var(--bg); border: 1px dashed var(--line); border-radius: 10px; padding: .7rem .9rem; font-size: .88rem; line-height: 1.55; word-break: break-all; }
.cmditem .ops { margin-top: .45rem; display: flex; gap: .6rem; align-items: center; }
#flash { position: fixed; left: 50%; bottom: 2rem; transform: translateX(-50%); background: var(--ink); color: #fff; padding: .55rem 1.1rem; border-radius: 10px; font-size: .88rem; opacity: 0; transition: opacity .25s; pointer-events: none; max-width: 90vw; z-index: 99; }
#flash.show { opacity: .96; }

@media (max-width: 760px) {
  .app.on { display: block; }
  .side { width: auto; height: auto; position: static; flex-direction: row; align-items: center; gap: .6rem; padding: .6rem .8rem; overflow-x: auto; }
  .side .brand { padding: 0 .4rem 0 0; }
  .nav { flex-direction: row; }
  .nav a { border-left: none; padding: .35rem .6rem; white-space: nowrap; }
  .side .grow, .userchip .who { display: none; }
  .userchip { border: none; padding: 0; }
  .main { padding: 1.1rem 1rem 3rem; }
  .frow .lab { width: 100%; }
}
</style>
</head>
<body>

<!-- 登录 / 注册 -->
<div class="narrow" id="login">
  <div class="auth-logo">
    <span class="dot"></span><h1>回响</h1>
    <p>每一次更新，都有回响 —— 把文章变成人和 AI 都能读的链接</p>
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
    <h2 style="font-size:1.15rem;margin-top:0">🎉 注册成功，欢迎 <span id="obName"></span>！</h2>
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
          <p class="hint">你的作者主页：<a id="obHome" target="_blank"></a>（读者发给自己的 AI 即可订阅你）。</p>
        </div>
      </div>
    </div>
    <button class="primary" id="btnEnter" onclick="enterPanel()" disabled>先复制上面的指令 ↑</button>
  </div>
</div>

<!-- ============ 应用壳 ============ -->
<div class="app" id="app">
  <aside class="side">
    <div class="brand"><span class="dot"></span>回响 <small>内容分发</small></div>
    <nav class="nav">
      <a href="#links" data-view="links" class="active"><span class="ic">🔗</span>内容链接</a>
      <a href="#subs" data-view="subs"><span class="ic">📮</span>订阅者</a>
      <a href="#account" data-view="account"><span class="ic">👤</span>账号管理</a>
      <a href="#adv" data-view="adv"><span class="ic">⚙️</span>高级设置</a>
    </nav>
    <div class="grow"></div>
    <div class="userchip">
      <div class="avatar" id="avatarTxt">a</div>
      <div class="who" id="topName">—</div>
      <button onclick="logout()">退出</button>
    </div>
  </aside>

  <main class="main">

    <!-- 视图：内容链接 -->
    <section class="view on" id="view-links">
      <div class="pagehead">
        <div><h1>内容链接</h1><p>默认有效期 7 天，「续期」重置为 7 天 · 把文章丢给你的 AI 即可新增</p></div>
      </div>
      <div class="card">
        <div class="toolbar">
          <input type="text" id="q" placeholder="搜索标题 / 链接 id…" oninput="renderRows()">
          <span class="hint" id="countHint"></span>
        </div>
        <table>
          <thead><tr><th>标题</th><th>链接</th><th>价格</th><th>发布</th><th>有效期至</th><th style="text-align:right">操作</th></tr></thead>
          <tbody id="rows"></tbody>
        </table>
        <div id="demoNote" class="demo-note" style="display:none">↑ 以上为示例数据。把文章原文或公众号/小红书链接丢给你的 AI，说「把这篇转成在线链接」，第一条真实链接就会出现在这里。</div>
      </div>
    </section>

    <!-- 视图：订阅者 -->
    <section class="view" id="view-subs">
      <div class="pagehead">
        <div><h1>订阅者</h1><p>读者的 AI 订阅了你——它们会在你更新时自动来读（push 为推送直达，poll 为定时轮询）</p></div>
      </div>
      <div class="statline">
        <div class="stat"><b id="stTotal">0</b><span>订阅者总数</span></div>
        <div class="stat"><b id="stActive">0</b><span>近 7 天活跃</span></div>
      </div>
      <div class="card">
        <table>
          <thead><tr><th>Agent</th><th>模式</th><th>订阅时间</th><th>最近活跃</th></tr></thead>
          <tbody id="subRows"></tbody>
        </table>
        <div id="subEmpty" class="empty" style="display:none">还没有订阅者。<br>把你的作者主页 <a id="subHomeLink" target="_blank"></a> 分享出去，读者把它发给自己的 AI 说「关注这个作者」即可。</div>
      </div>
    </section>

    <!-- 视图：账号管理 -->
    <section class="view" id="view-account">
      <div class="pagehead"><div><h1>账号管理</h1><p>身份、署名与凭证</p></div></div>
      <div class="card">
        <div class="frow"><span class="lab">用户名</span><span class="val"><b id="accUsername">—</b> <span class="hint">唯一，注册后不可改</span></span></div>
        <div class="frow"><span class="lab">邮箱</span><span class="val" id="accEmail">—</span></div>
        <div class="frow"><span class="lab">文章署名</span><span class="val"><input type="text" id="accAuthor"> <button onclick="saveAuthor()">保存</button> <span class="hint">新文章的默认作者名，可随时改</span></span></div>
        <div class="frow"><span class="lab">作者主页</span><span class="val"><a id="accHome" target="_blank"></a> <span class="hint">发给 AI 可被订阅</span></span></div>
        <div class="frow"><span class="lab">订阅口令</span><span class="val"><button onclick="showAuthorCmd()">查看 / 复制</button> <span class="hint">贴到任何地方，读者粘给 AI 即可订阅你</span></span></div>
        <div class="frow"><span class="lab">Agent 接入 token</span><span class="val hint">出于安全不再显示。换机器 / 换 agent 时：退出后用邮箱重新登录，会签发新 token（旧 token 仍有效）。</span></div>
      </div>
    </section>

    <!-- 视图：高级设置 -->
    <section class="view" id="view-adv">
      <div class="pagehead"><div><h1>高级设置</h1><p>订阅引导——作用于你主页里给 AI 的订阅指引</p></div></div>
      <div class="card">
        <div class="frow"><span class="lab">推送模式引导</span><span class="val"><label><input type="checkbox" id="cfgWebhook" style="margin-right:.35rem">优先引导支持 webhook 的 agent 使用推送（你一更新即时送达）</label></span></div>
        <div class="frow"><span class="lab">轮询频率建议</span><span class="val">
          <select id="cfgPoll">
            <option value="6">每 6 小时</option>
            <option value="12">每 12 小时</option>
            <option value="24">每天</option>
            <option value="72">每 3 天</option>
            <option value="168">每周</option>
          </select>
          <span class="hint">给不支持推送的 agent 的检查频率</span>
        </span></div>
        <div class="frow"><span class="lab"></span><span class="val"><button class="primary" onclick="saveGuideCfg()">保存设置</button></span></div>
      </div>
    </section>

  </main>
</div>

<!-- 分发口令弹层 -->
<div id="cmdMask" onclick="if(event.target===this)closeCmd()">
  <div class="cmdbox">
    <h2>📣 分发口令</h2>
    <div class="sub" id="cmdSub">把口令贴进文章末尾/评论区/社群，读者复制粘给自己的 AI 即生效。</div>
    <div class="cmditem">
      <h3>📖 阅读口令 <span class="hint">读这一篇</span></h3>
      <div class="cmdtext" id="cmdRead"></div>
      <div class="ops"><button class="primary" onclick="copyCmd('cmdRead', this)">复制</button><a id="cmdReadQr" target="_blank">二维码版</a></div>
    </div>
    <div class="cmditem">
      <h3>📮 订阅口令 <span class="hint">持续关注你——这是给读者的「关注」按钮</span></h3>
      <div class="cmdtext" id="cmdSub2"></div>
      <div class="ops"><button class="primary" onclick="copyCmd('cmdSub2', this)">复制</button><a id="cmdSubQr" target="_blank">二维码版</a></div>
    </div>
    <div class="cmditem">
      <h3>🔗 口令页 <span class="hint">一个链接装下以上全部，可直接分享</span></h3>
      <div class="cmdtext" id="cmdPage"></div>
      <div class="ops"><button class="primary" onclick="copyCmd('cmdPage', this)">复制链接</button></div>
    </div>
    <p style="text-align:right;margin:0"><button onclick="closeCmd()">关闭</button></p>
  </div>
</div>

<div id="flash"></div>

<script>
const $ = (id) => document.getElementById(id)
let ME = {}
const tokenOf = () => localStorage.getItem('a4a_token') || ''
let ARTICLES = []

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

// ---------- 视图切换 ----------
function switchView(v) {
  document.querySelectorAll('.view').forEach((el) => el.classList.remove('on'))
  const target = $('view-' + v) || $('view-links')
  target.classList.add('on')
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === v))
}
window.addEventListener('hashchange', () => switchView(location.hash.replace('#', '') || 'links'))
document.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => switchView(a.dataset.view)))

// ---------- 登录 / 注册 ----------
function showTab(t) {
  $('loginForm').style.display = t === 'login' ? 'block' : 'none'
  $('regForm').style.display = t === 'reg' ? 'block' : 'none'
  $('tabLogin').className = t === 'login' ? 'active' : ''
  $('tabReg').className = t === 'reg' ? 'active' : ''
  $('authMsg').textContent = ''
}

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
      $('bindText').textContent = '帮我绑定「回响」账号（CLI 是 huixiang-cli，命令 a4a），token 是 ' + data.token + ' ，服务端是 ' + location.origin + ' 。绑定完成后告诉我怎么发布文章。'
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
  $('app').classList.remove('on')
  $('onboard').style.display = 'none'
  $('login').style.display = 'block'
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

// ---------- 数据加载 ----------
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
  $('app').classList.add('on')
  switchView(location.hash.replace('#', '') || 'links')
  ARTICLES = data.articles
  renderRows()

  api('GET', '/v1/me').then((me) => {
    ME = me
    const who = me.username || me.authorName || 'token 账号'
    $('topName').textContent = who
    $('avatarTxt').textContent = who.slice(0, 1).toUpperCase()
    $('accUsername').textContent = me.username || '（早期 token 账号，无用户名）'
    $('accEmail').textContent = me.email || '（早期 token 账号，无邮箱）'
    $('accAuthor').value = me.authorName || ''
    if (me.home_url) {
      $('accHome').textContent = decodeURIComponent(me.home_url).replace(/^https?:\\/\\//, '')
      $('accHome').href = me.home_url
      $('subHomeLink').textContent = decodeURIComponent(me.home_url).replace(/^https?:\\/\\//, '')
      $('subHomeLink').href = me.home_url
    }
    $('cfgWebhook').checked = me.offerWebhook !== false
    $('cfgPoll').value = String(me.pollIntervalHours || 24)
  }).catch(() => {})

  api('GET', '/v1/subscribers').then((s) => {
    $('stTotal').textContent = s.total
    $('stActive').textContent = s.active_7d
    const tb = $('subRows')
    tb.innerHTML = ''
    $('subEmpty').style.display = s.subscribers.length ? 'none' : 'block'
    for (const x of s.subscribers) {
      const tr = document.createElement('tr')
      tr.innerHTML =
        '<td>' + esc(x.agent || '（未署名 agent）') + ' <span class="hint">' + esc(x.id) + '</span></td>' +
        '<td>' + (x.mode === 'push' ? '<span class="pill push">push 推送</span>' : '<span class="pill">poll 轮询</span>') + '</td>' +
        '<td class="hint">' + x.createdAt.slice(0, 10) + '</td>' +
        '<td class="hint">' + (x.lastSeenAt || '').slice(0, 16).replace('T', ' ') + '</td>'
      tb.appendChild(tr)
    }
  }).catch(() => {})
}

// ---------- 链接表格 ----------
function articleRow(a, isDemo) {
  const soon = Date.now() + 2 * 86400e3
  const tr = document.createElement('tr')
  if (isDemo) tr.className = 'demo'
  const expCls = !isDemo && Date.parse(a.expiresAt) < soon ? 'expiring' : ''
  const actions = isDemo
    ? '<button disabled>查看</button> <button disabled>复制</button> <button disabled>设置</button>'
    : '<button onclick="window.open(\\'/' + a.id + '\\', \\'_blank\\')">查看</button> ' +
      '<button onclick="copyUrl(\\'' + a.id + '\\')">复制</button> ' +
      '<button onclick="showCmd(\\'' + a.id + '\\', \\'' + esc(a.title).replace(/'/g, '') + '\\')">口令</button> ' +
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
    '<td class="row-actions">' + actions + '</td>'
  return tr
}

function renderRows() {
  const rows = $('rows')
  rows.innerHTML = ''
  const q = ($('q').value || '').trim().toLowerCase()
  const list = ARTICLES.filter((a) => !q || a.title.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
  $('countHint').textContent = q ? list.length + ' / ' + ARTICLES.length + ' 条' : ARTICLES.length + ' 条链接'
  const showDemo = !ARTICLES.length
  $('demoNote').style.display = showDemo ? 'block' : 'none'
  if (showDemo) {
    $('countHint').textContent = '0 条链接'
    const day = 86400e3
    const demo = [
      { id: 'AbC12xYz', title: '为什么你的下一个读者是一个 AI', price: 0, createdAt: new Date(Date.now() - day).toISOString(), expiresAt: new Date(Date.now() + 6 * day).toISOString() },
      { id: 'Qw34ErTy', title: '给 AI 读的文章，应该怎么写？三条实践笔记', price: 3, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * day).toISOString() },
    ]
    for (const a of demo) rows.appendChild(articleRow(a, true))
    return
  }
  for (const a of list) rows.appendChild(articleRow(a, false))
}

// ---------- 操作 ----------
async function saveAuthor() {
  const name = $('accAuthor').value.trim()
  if (!name) { flash('署名不能为空'); return }
  try { await api('PUT', '/v1/me', { authorName: name }); flash('署名已更新') }
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

// ---------- 分发口令 ----------
function pubName() { return ME.username || ME.authorName || '' }

function showCmd(id, title) {
  document.querySelectorAll('.cmditem').forEach((el) => { el.style.display = '' })
  const o = location.origin
  $('cmdRead').textContent = '请帮我读这篇文章《' + title + '》并总结要点：' + o + '/' + id + ' （这是 AI 可读链接，直接请求即得全文）'
  $('cmdReadQr').href = o + '/c/' + id + '/read.svg'
  const n = pubName()
  if (n) {
    $('cmdSub2').textContent = '请帮我订阅作者「' + n + '」的更新：读取 ' + o + '/u/' + n + ' 并执行页内「给 AI agent 的订阅执行步骤」（登记订阅、建立自动检查），之后有新文章第一时间告诉我。'
    $('cmdSubQr').href = o + '/c/' + id + '/subscribe.svg'
  }
  $('cmdPage').textContent = o + '/c/' + id
  $('cmdMask').classList.add('on')
}

function closeCmd() { $('cmdMask').classList.remove('on') }

// 账号级：只展示订阅口令（阅读/口令页区块隐藏）
function showAuthorCmd() {
  const n = pubName()
  if (!n) { flash('还没有用户名'); return }
  const o = location.origin
  document.querySelectorAll('.cmditem')[0].style.display = 'none'
  document.querySelectorAll('.cmditem')[2].style.display = 'none'
  $('cmdSub2').textContent = '请帮我订阅作者「' + n + '」的更新：读取 ' + o + '/u/' + n + ' 并执行页内「给 AI agent 的订阅执行步骤」（登记订阅、建立自动检查），之后有新文章第一时间告诉我。'
  $('cmdSubQr').href = o + '/u/' + encodeURIComponent(n) + '/subscribe.svg'
  $('cmdMask').classList.add('on')
}

async function copyCmd(elId, btn) {
  await navigator.clipboard.writeText($(elId).textContent)
  btn.textContent = '✅ 已复制'
  setTimeout(() => { btn.textContent = elId === 'cmdPage' ? '复制链接' : '复制' }, 1800)
}

// 点击别处收起「设置」下拉
document.addEventListener('click', (e) => {
  document.querySelectorAll('details.dd[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open') })
})

// 回车提交
$('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') loginEmail() })
$('regPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') register() })

refresh()
</script>
</body>
</html>`
