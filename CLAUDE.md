# article-for-agents 开发约定

## 版本迭代规则（每次功能更新必须执行）

每当完成一次**产品功能更新**（新增/修改用户可感知的能力），必须同时做三件事：

1. **README.md「🧭 版本迭代」**：在最上方新增一个版本条目，版本号在上一条基础上 +1
   （0.0.1 → 0.0.2 → 0.0.3 …），格式：`### v0.0.x · YYYY-MM-DD —— 一句话主题`，
   下面用列表写清本次更新内容；把上一条标题里的「（当前）」移到新条目
2. **FEATURES.md**：同步更新产品功能列表（新功能加行、规划中的改 ✅、开头的当前版本号）
3. **README.en.md「🧭 Version history」**：同步英文条目

纯 bug 修复 / 重构 / 文档改动不加版本号。产品版本号（0.0.x）独立于 npm 包
`a4a-cli` 和各 package.json 的版本号，互不同步。

## 其他约定

- `skills/a4a-publish/SKILL.md` 是源文件，改完后复制到 `.claude/skills/a4a-publish/SKILL.md` 保持一致
- 服务端改动后跑 `cd server && npx tsc --noEmit`；CLI 改动后跑 `node --check cli/bin/a4a.js`
- 本地联调：`npm run dev`（http://localhost:8787），CLI 用
  `A4A_ENDPOINT=http://localhost:8787 A4A_TOKEN=<token> node cli/bin/a4a.js …`；
  不要动用户的 `~/.config/a4a/config.json`，测试账号用 `curl -X POST /v1/keys` 现开
- 服务端是单文件 `server/src/index.ts`（Hono + KV + R2）；CLI 是 `cli/bin/a4a.js` + `cli/lib/`
