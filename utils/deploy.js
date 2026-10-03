/**
 * 跨平台部署脚本，等价于 deploy.sh。
 *
 * 为什么不用 deploy.sh：
 *   1. Windows 的 PowerShell/cmd 里没有 bash（Git Bash 不默认进 PATH）；
 *   2. 就算用 Git Bash 跑，脚本内部的 `npm run build` 也会被 npm 交给 cmd.exe 执行，
 *      而 build 脚本以 `export VAR=...` 开头，在 cmd 下必然失败。
 *   因此这里用 Node 重写，构建步骤按平台选择 build / build:win。
 *
 * 用法：npm run deploy
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..') // 项目根目录
const distPath = path.join(root, 'docs', '.vuepress', 'dist') // 构建产物路径
const pushBranch = 'gh-pages' // 推送的目标分支

/** 执行命令并把输出直接透传到终端 */
const run = (cmd, cwd = root) =>
  execSync(cmd, { stdio: 'inherit', cwd })

/** 执行命令并取回输出（用于读取 git 信息） */
const capture = (cmd) =>
  execSync(cmd, { cwd: root, encoding: 'utf8' }).trim()

// 1. 构建。Windows 必须走 build:win（见文件头说明）
const buildScript = process.platform === 'win32' ? 'build:win' : 'build'
console.log(`\n[deploy] 开始构建：npm run ${buildScript}\n`)
run(`npm run ${buildScript}`)

if (!fs.existsSync(distPath)) {
  console.error(`\n[deploy] 构建产物不存在：${distPath}\n`)
  process.exit(1)
}

// 2. 取推送地址和提交信息（与 deploy.sh 保持一致）
const pushAddr = capture('git remote get-url --push origin')
const commitInfo = capture('git describe --all --always --long')

// 3. 在构建产物里临时初始化仓库，强推到 gh-pages
//    先清掉上次失败残留的 .git，避免重复 init 后 commit 无事可做而报错
fs.rmSync(path.join(distPath, '.git'), { recursive: true, force: true })

run('git init', distPath)
run('git add -A', distPath)
run(`git commit -m "deploy, ${commitInfo}"`, distPath)
run(`git push -f ${pushAddr} HEAD:${pushBranch}`, distPath)

// 4. 清理构建产物
fs.rmSync(distPath, { recursive: true, force: true })

console.log(`\n[deploy] 完成，已推送到 ${pushBranch} 分支\n`)
