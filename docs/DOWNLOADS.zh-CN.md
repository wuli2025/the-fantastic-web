# 下载、运行与部署

## 已发布的原包

发布页：[v1.0.0](https://github.com/wuli2025/the-fantastic-web/releases/tag/v1.0.0)。两个附件来自用户提供的桌面 `zip` 目录，按原始字节上传。源码仓库另外增加了原理文档、修改指南、下载说明与文档勘误。

| 文件 | 字节数 | 大小 |
| --- | ---: | ---: |
| [Igloo完整项目.zip](https://github.com/wuli2025/the-fantastic-web/releases/download/v1.0.0/Igloo%E5%AE%8C%E6%95%B4%E9%A1%B9%E7%9B%AE.zip) | 22,191,460 | 21.16 MiB |
| [Igloo网页发布版.zip](https://github.com/wuli2025/the-fantastic-web/releases/download/v1.0.0/Igloo%E7%BD%91%E9%A1%B5%E5%8F%91%E5%B8%83%E7%89%88.zip) | 17,852,960 | 17.03 MiB |

这两个文件不是系统安装器，也没有附带 Node.js。想先看效果，使用网页发布版；想改代码，克隆本仓库或下载完整项目。GitHub 自动提供的 “Source code” 压缩包来自仓库标签，与上述原始附件不是同一份 ZIP。

## 网页发布版：不用 npm install

1. 下载并完整解压 `Igloo网页发布版.zip`，保留所有目录。
2. 本机需要 Node.js 18 或更新版本；它只是用来启动包内本地服务器。
3. Windows 双击 `启动网站.cmd`，脚本运行 `node serve.mjs --open`。
4. 浏览器通常打开 `http://127.0.0.1:5177/`，端口被占用时自动尝试后续端口，以终端打印地址为准。
5. FORMA 位于同一地址的 `/forma.html`。保持运行窗口打开，结束时按 Ctrl+C。

macOS / Linux 可在解压后的目录运行：

```bash
node serve.mjs
```

然后手工打开终端显示的网址。普通 `index.html` 依赖模块脚本、资源请求和路由，不支持直接双击打开。

## 完整项目：用于开发

开发构建所需版本比上面的静态服务器更高：Node.js 22.12+，或 20.19+。从工程目录运行：

```bash
npm ci
npm run dev
```

默认访问 `http://localhost:5173/` 和 `http://localhost:5173/forma.html`。`npm ci` 根据锁文件安装依赖；原包说明中的 `npm install` 也可使用。

需要静态构建时：

```bash
npm run build
node scripts/serve-static.mjs dist
```

此本地服务器支持详情路径回退；`npm run preview` 也可预览构建。`learning/hologram-particles/` 是独立的第三方学习项目，不会随根工程自动启动。

原包中有“桌面另有单文件 HTML”的旧提示，它指打包时的桌面环境。**GitHub 的这两个 ZIP 附件没有该 HTML**；如需自行生成，可在完整工程安装依赖后运行 `npm run export:html`。

## 校验下载是否完整

Release 同时提供 `SHA256SUMS.txt`，仓库中也有 [校验文件](../releases/SHA256SUMS.txt)。两个原包的 SHA-256：

```text
ce13d82cd4c45f0aeca36617575cf8c97551c5df6f7a0a94b68eb4d1a29ee65e  Igloo完整项目.zip
e7c431f4b280da60ae4f4c6ed6a3527662c7a4f602401b5e15f0f302b0c53319  Igloo网页发布版.zip
```

Windows PowerShell：

```powershell
Get-FileHash '.\Igloo完整项目.zip' -Algorithm SHA256
Get-FileHash '.\Igloo网页发布版.zip' -Algorithm SHA256
```

Linux 在两个 ZIP 和校验文件所在目录执行 `sha256sum -c SHA256SUMS.txt`。macOS 可分别执行 `shasum -a 256 文件名`。

## 发布到自己的域名

部署目标是 `dist/` 的内容或网页发布版静态文件。服务器需要满足：

- 内容挂载在域名根路径，`/assets/`、`/study/` 能正确请求。
- `/portfolio/pudgy-penguins` 等页面路径直达和刷新时返回 `index.html`。
- 存在的静态资源正常返回；缺失的脚本、纹理应返回 404，避免把 HTML 当作 JS 或模型加载。
- `.js`、`.wasm` 等返回合适的内容类型。

当前未开通 GitHub Pages。常见项目地址 `https://wuli2025.github.io/the-fantastic-web/` 具有子路径，现有原站生产脚本还包含根路径，不能仅设置 Vite `base` 就认为适配完成。原包上传与在线网站部署是两项独立工作。

## 原包与仓库的差异

仓库基于完整项目包展开，省略了第三方学习目录中的 `.claude/settings.local.json` 本地工具权限配置；原 ZIP 本身保持原样。新增 `docs/`、`releases/` 和仓库 README，修正了学习文档对采样分配方式及嵌套 Git 信息的描述。运行代码和原站资源保持与原包一致。

`node_modules/`、`dist/`、测试产物、ZIP 和本地环境配置均不作为源码提交。压缩包通过 Releases 提供，避免重复计入 Git 历史。
