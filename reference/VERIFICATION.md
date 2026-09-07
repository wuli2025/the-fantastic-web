# 本地验证记录

## GitHub 上传前复查（2026-09-07）

从用户提供的完整项目 ZIP 展开到独立 Git checkout，执行 `npm ci --no-audit --no-fund`、`npm run build`。构建通过；有 FORMA JS 超过 500 kB 的体积提示，不影响构建完成。122 个构建文件与原网页发布版包中的对应文件逐字节相同。

浏览器复查使用 Node.js 22.23.1、Playwright 及本机 Chromium headless shell（缓存版本 1234），设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`，启用 SwiftShader。默认 Playwright 所需浏览器版本未预装；首次使用完整 Chromium 的检查进程被 SIGTERM 终止，没有完成整套检查。改用 headless shell 后，原验证脚本完整重跑：

- `npm test`：通过。111 个资源存在；桌面开场、滚轮、声音、真实点击冰块、三个详情路由、末尾粒子、详情直达、手机布局与滑动、WebGL 不支持提示均通过。本次实际加载 106 个不同运行资源，无外部请求、缺失请求或受支持模式下浏览器错误。
- `npm run test:forma`：通过。三个角色、键盘/滚轮/拖拽/长按、质量、声音、弹窗焦点、手机模拟、减少动态效果与无 WebGL 提示均通过，无外部运行请求或浏览器错误。
- 网页发布 ZIP 解压后执行自带 `serve.mjs`：首页、FORMA、详情路径回退、JSON 与 WASM 内容类型及缺失 JS 返回 404 均通过。
- 两个 ZIP 的 CRC 完整性检查通过；SHA-256 记录在 `releases/SHA256SUMS.txt`。109 个未修改原站资源与来源清单一致，两个已有补丁的 JS 保持与原包相同。
- 人工查看本次 Igloo 冰屋与 FORMA 宇航员截图，存入 `docs/images/`，用于仓库预览。

仅使用软件渲染及浏览器手机模拟，没有测量真实手机帧率，也没有安装或运行第三方 Hologram 子项目。以下为原包附带的较早验证记录，保留供对照。

## 原包附带记录

验证环境：2026-09-07，Node.js 22.23.1，Playwright Chromium，WebGL 软件渲染；移动端为浏览器触屏模拟，未在实体手机上测量性能。

- `npm run build`：通过，完整资源与两个页面均包含在 `dist/`。
- `npm test`：通过，桌面 1280×800、项目地址直达 960×600、移动端 390×844。
- `npm run test:forma`：通过，保留的人物粒子页面仍支持三种形态、桌面与手机操作、声音、质量切换、弹窗及减少动态效果。
- 冰屋开场、实际滚轮输入、声音开关：通过。
- 实际点击冰块打开项目、点击关闭按钮返回：通过。
- Pudgy Penguins、Overpass、Abstract 三个详情路径与直接刷新：通过。
- 最后粒子场景加载并渲染：通过。
- 手机原生触屏滑动、声音点击、冰块场景与无横向溢出：通过。
- WebGL 2 不可用时的错误提示：通过。
- 阻断外部网络请求后，体验仍能加载；测试中加载了 107 个不同的本地运行资源，无缺失请求和浏览器错误。
- 111 个下载资源均包含在构建中；109 个未修改资源的 SHA-256 与采集清单一致，另外两个 JS 按补丁脚本修改。

截图位于根目录 `artifacts/igloo-desktop-hero.png`、`igloo-desktop-cubes.png`、`igloo-desktop-detail.png`、`igloo-desktop-particles.png`、`igloo-mobile-hero.png` 和 `igloo-mobile-cubes.png`。

文字兼容修正：原站 MSDF 的 `smoothstep` 在导数为零时产生未定义结果。给 `fwidth` 加上非零下限后，原先的白色文字块恢复为字形；已人工查看修正后的桌面、项目详情与手机截图。
