# 本地验证记录

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
