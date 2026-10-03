# mumubyte.github.io

基于 [VuePress 1.9](https://v1.vuepress.vuejs.org/zh/) + [vuepress-theme-vdoing](https://github.com/xugaoyi/vuepress-theme-vdoing) 搭建的个人博客。

- 线上地址：https://mumubyte.github.io
- 内容方向：硬件、存储技术、系统与网络，以及杂记随笔

## 技术栈

| 项目 | 版本 / 说明 |
| --- | --- |
| VuePress | 1.9.9 |
| 主题 | vuepress-theme-vdoing 1.12.9（npm 包，本地副本见 `vdoing/`） |
| Node.js | 18.x（CI 使用该版本） |
| 部署 | GitHub Actions → `gh-pages` 分支；也可用 `deploy.sh` 手动部署 |

## 目录结构

```
.
├── docs/                     # 站点内容（VuePress 的 source dir）
│   ├── .vuepress/
│   │   ├── config.ts         # 站点主配置：导航、侧边栏、插件、head
│   │   ├── config/htmlModules.ts   # 自定义 HTML 模块（广告位等）
│   │   ├── public/img/       # 静态资源（logo、favicon、分类配图）
│   │   └── styles/           # palette.styl 变量 / index.styl 样式覆盖
│   ├── 00.目录页/            # 各分类的目录页（Catalogue 组件），permalink 定义在此
│   ├── 03.系统与网络/        # 文章内容，按分类分文件夹，可再分子目录
│   ├── 05.关于/              # 关于页
│   ├── @pages/               # 归档 / 分类 / 标签页
│   └── index.md              # 首页（home: true，features 配三个入口）
├── utils/                    # 辅助脚本（跨平台部署、frontmatter 批处理、百度推送等）
├── vdoing/                   # 主题源码本地副本，配合 npm run publish 发布主题用
├── .github/workflows/ci.yml  # 推送到 main 后自动构建并部署
├── deploy.sh                 # 手动部署脚本（bash 环境，等价于 utils/deploy.js）
└── vercel.json               # Vercel 部署时的静态资源缓存头
```

## 本地开发

```bash
npm install          # 或 yarn
npm run dev          # 启动开发服务器，默认 http://localhost:8080
npm run build        # 构建到 docs/.vuepress/dist
```

> ⚠️ **Windows 用户请使用 `dev:win` / `build:win`。**
> `dev` / `build` 用的是 `export VAR=...` 写法，在 cmd/PowerShell 下会失败。
> `utils/check.js` 会在 `predev` / `prebuild` 阶段检测平台并直接报错提示，避免你手动踩坑。

## 写文章

文章放在与分类对应的文件夹里，分类下还可以再分子目录（如 `01.Windows系统`，会渲染成侧边栏里的可折叠分组）：

```
docs/01.硬件/01.某某主板测试.md
docs/02.存储技术/01.ZFS 池规划.md
docs/03.系统与网络/01.Windows系统/01.Windows11创建共享文件夹.md
docs/04.更多/01.随笔.md
```

**文件夹和文件都必须带 `数字.` 前缀**（`01.` 在最前），主题靠这个序号排序——没有前缀的名字会被判为「序号出错」直接跳过，既不进侧边栏也不进目录页。侧边栏由 `structuring` 模式按目录结构自动生成，命名和层级要规范。

> 目前只有 `03.系统与网络` 建好了，其余分类的内容文件夹需要时再建。

文章头部 frontmatter 参考：

```yaml
---
title: 某某主板测试
date: 2026-10-03 10:00:00
permalink: /pages/a1b2c3/       # 可选，不写则自动生成
categories:
  - 硬件
tags:
  - 测试
author:
  name: mumubyte
  link: https://github.com/mumubyte
---
```

`author` 一般不用手写：`config.ts` 里的 `extendFrontmatter` 会在缺失时自动补上。

### 图片放哪里

统一放在 `docs/.vuepress/public/` 下，用 `/` 开头的绝对路径引用：

```
docs/.vuepress/public/img/sharing/win11-share-01.png
```

```markdown
![共享设置界面](/img/sharing/win11-share-01.png)
```

logo、favicon、分类图标也都在这套目录下（`public/img/`）。建议按文章再建子目录，避免全部堆在 `img/` 里。

**不要**把图片放进 `docs/` 内的内容目录（与文章同级、或另建 `images/` 子目录都不行）。侧边栏生成器会扫描内容目录里的一切，非 md 文件一律抛警告：

| 图片放法 | 构建警告 |
| --- | --- |
| `01.Windows系统/images/x.png` | `该文件 "...\images" 序号出错，请填写正确的序号` |
| `01.Windows系统/x.png` | `该文件 "...\x.png" 序号出错` |
| `01.Windows系统/01.x.png` | `该文件 "...\01.x.png" 非.md格式文件，不支持该文件类型` |

即使加上序号，也只是从「序号出错」换成「非 md 格式」，主题没有提供忽略配置。警告不影响图片显示（相对路径引用同样能渲染），但每次构建都会刷屏，所以还是走 `public/`。该目录被生成器排除，零警告。

> 站点 `base` 为默认的 `/`，`/img/xxx.png` 可直接使用。若将来部署到子路径（如 `https://foo.github.io/bar/`），绝对路径的图片需改用 `$withBase` 包裹，否则会 404。

### 新增顶级分类

需要三步：建内容文件夹 → 在 `docs/00.目录页/` 加一个目录页（`pageComponent: Catalogue`，`data.path` 指向该文件夹）→ 在 `config.ts` 的 `nav` 里加导航项，`link` 填目录页的 `permalink`。

## 部署

**方式一：GitHub Actions（推荐）**

推送到 `main` 分支即触发 `.github/workflows/ci.yml`：安装依赖 → 构建 → 把 `docs/.vuepress/dist` 强推到 `gh-pages` 分支。
仓库的 **Settings → Pages** 里把 Source 设为 `gh-pages` 分支即可。

**方式二：本地手动部署**

```bash
npm run deploy       # 构建后强推到 gh-pages（跨平台，Windows 直接可用）
```

脚本 `utils/deploy.js` 会按平台选择 `build:win` / `build` 完成构建，然后在 `docs/.vuepress/dist` 里临时 `git init` 并 `push -f` 到 `gh-pages`，最后删除 `dist`。

> 原 `deploy.sh` 保留为 `npm run deploy:sh`，仅适用于 Linux/macOS 或 PATH 中有 bash 的环境。
> 它在 Windows 上不可用，原因有二：PowerShell 默认找不到 bash；即使有 bash，脚本内的 `npm run build` 也会被 npm 交给 cmd.exe 执行，而该脚本以 `export VAR=...` 开头，在 cmd 下必然失败。

Vercel 部署的话，`vercel.json` 已为 `/assets/js`、`/assets/css` 配好一年期 immutable 缓存。

## 配置速查

改动主要集中在 [docs/.vuepress/config.ts](docs/.vuepress/config.ts)：

| 想改什么 | 去哪里 |
| --- | --- |
| 域名 / 站点标题描述 | 顶部 `DOMAIN_NAME`、`locales['/']` |
| 导航栏 | `themeConfig.nav` |
| Logo、博主信息、社交图标、页脚 | `themeConfig.logo` / `blogger` / `social` / `footer` |
| 侧边栏 | `themeConfig.sidebar: 'structuring'`（改则目录页数据失效） |
| 搜索 | `plugins` 中的 `thirdparty-search`（已启用）与注释掉的 `fulltext-search` |
| 主题色、明暗模式变量 | `docs/.vuepress/styles/palette.styl` |
| 首页入口卡片 | `docs/index.md` 的 `features` |

主题自身支持但本仓库暂未启用的能力（分类/标签/归档均已开启，其余按需放开即可）：`bodyBgImg` 整站背景图、`updateBar` 最近更新栏、`defaultMode` 默认外观模式 —— 相关开关都以注释形式保留在 `config.ts` 中。

## 工具脚本

```bash
npm run editFm            # 按 utils/config.yml 批量增删改文章 frontmatter
npm run baiduPush         # 生成 urls.txt 并推送给百度（需先配置，见「待办」）
node utils/genFavicon.js  # 生成 favicon（无 npm script，直接跑文件）
```

`utils/config.yml` 用来指定批量处理的路径和要增删改的字段，跑 `editFm` 前先编辑它。

## 待办

- [ ] `docs/05.关于/01.关于.md` 仍是模板占位内容，作者字段还指向 `xugaoyi`，需要替换为本人信息
- [ ] `package.json` 中 `baiduPush` 脚本的域名硬编码为 `https://xugaoyi.com`，应用前改成 `https://mumubyte.github.io`
- [ ] `vuepress-plugin-comment`（Gitalk）已装依赖但未在 `config.ts` 启用，需要评论时补配置

## License

[MIT](LICENSE)。主题版权归 [xugaoyi](https://github.com/xugaoyi) 所有，见 [vdoing/LICENSE](vdoing/LICENSE)。
