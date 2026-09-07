# The Fantastic Web · Igloo 与人物粒子学习项目

包含 Igloo 冰屋、冰块项目展示、滚动转场与粒子社交场景的本地复现，以及独立编写的 FORMA 人物粒子实验。可在本地运行、阅读实现说明，并修改自己的文案、人物与交互。

**[下载两个原始安装包](https://github.com/wuli2025/the-fantastic-web/releases/tag/v1.0.0)** · **[效果实现原理](docs/HOW_IT_WORKS.zh-CN.md)** · **[适合修改的位置与示例](docs/CUSTOMIZE.zh-CN.md)**

> Igloo 部分使用原站公开生产构建，不是官方开源工程；原作者未压缩组件和建模工程不在包内。FORMA 有完整可读源码。资源来源与本地改动见 [reference/README.md](reference/README.md)。

## 下载哪个包

| 下载 | 大小 | 适合谁 | 打开方法 |
| --- | --- | --- | --- |
| [Igloo网页发布版.zip](https://github.com/wuli2025/the-fantastic-web/releases/download/v1.0.0/Igloo%E7%BD%91%E9%A1%B5%E5%8F%91%E5%B8%83%E7%89%88.zip) | 17.03 MiB | 想先体验网页 | 完整解压，安装 Node.js 18+，Windows 双击 `启动网站.cmd` |
| [Igloo完整项目.zip](https://github.com/wuli2025/the-fantastic-web/releases/download/v1.0.0/Igloo%E5%AE%8C%E6%95%B4%E9%A1%B9%E7%9B%AE.zip) | 21.16 MiB | 想修改源码与研究效果 | 解压后执行 `npm install`、`npm run dev` |

这是网站工程与静态发布包，不是 EXE 安装程序。两个 Release 附件按提供的原包上传；本次新增的中文文档和文档勘误在 GitHub 源码中。详细打开方式、校验值与部署限制见 [下载说明](docs/DOWNLOADS.zh-CN.md)。

## 从 GitHub 源码启动

源码开发需要 Node.js 22.12+，也支持 20.19+；可使用 Node.js 22 系列。

```bash
git clone https://github.com/wuli2025/the-fantastic-web.git
cd the-fantastic-web
npm ci
npm run dev
```

- Igloo 完整体验：<http://localhost:5173/>
- FORMA 人物粒子：<http://localhost:5173/forma.html>

端口被占用时以终端显示的地址为准。使用支持 WebGL 2 的浏览器；通过本地服务器打开，不能直接双击普通 `index.html`。所需 Igloo 运行资源已在 `public/assets/` 中，安装依赖后日常运行不需要重新访问原站。

## 能看到什么，怎样操作

Igloo：滚轮、上下方向键或触屏滑动推进场景；点击冰块进入项目详情，点击关闭返回；SOUND 切换声音；末尾粒子响应鼠标，社交按钮默认仍连接原站配置的网址。

FORMA：滚轮、角色按钮或方向键切换宇航员、舞者与奔跑者；移动鼠标扰动粒子，拖动旋转，长按或空格散开；手机滑动切换；SOUND 开启生成式环境音；HQ / LQ 切换 48,000 / 18,000 个人物粒子。

## 学习与修改入口

| 文件 | 内容 |
| --- | --- |
| [docs/HOW_IT_WORKS.zh-CN.md](docs/HOW_IT_WORKS.zh-CN.md) | 冰晶材质、滚动合成、体积粒子、人物采样、GPU 变形、鼠标与声音的原理 |
| [docs/CUSTOMIZE.zh-CN.md](docs/CUSTOMIZE.zh-CN.md) | 修改优先级、参数速查、配色、第四个人物、GLB 与性能改进 |
| [public/study/content.json](public/study/content.json) | Igloo 文案、链接、文字颜色、资源名称与部分布局配置 |
| [src/forms.js](src/forms.js) | FORMA 人物几何、表面采样、基础颜色 |
| [src/scene.js](src/scene.js) | FORMA 着色器、聚散、鼠标响应、相机与环境 |
| [src/main.js](src/main.js) | FORMA 滚轮、拖拽、触屏、键盘、弹窗 |
| [forma.html](forma.html)、[src/style.css](src/style.css) | FORMA 文案、按钮和响应式布局 |
| [learning/IGLOO.md](learning/IGLOO.md) | `iglooStudy` 调试接口和资源格式 |
| [learning/README.md](learning/README.md) | 第三方 Hologram 源码阅读与独立启动方式 |

Igloo 原字体图集不支持任意中文；模型、纹理和体积资源有固定格式。初学时先改文案和链接；需要大幅改变人物与视觉时，从 FORMA 源码开始更方便。

## 构建与验证

```bash
npm run build
npm run preview
```

构建结果在 `dist/`，包含两个网页入口。正式服务器需部署在站点根路径，并让不存在的页面路径回退到 `index.html`，以支持 `/portfolio/...` 详情直达。当前版本尚未适配 GitHub Pages 项目子路径；上传仓库本身不会自动发布可访问的网站。

```bash
npx playwright install chromium
npm test
npm run test:forma
```

已有 Chromium 时可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。检查内容与限制见 [验证记录](reference/VERIFICATION.md)。第三方 `learning/hologram-particles/` 不在根工程的构建和测试范围内。

## 其他工具

`npm run export:html` 可生成 `artifacts/Igloo-standalone.html`，内嵌 Igloo 运行资源，供支持 WebGL 2 的 Chrome / Edge 单文件打开；不包含 FORMA。当前两个原始 ZIP 附件不附带这个单文件 HTML。

`python3 scripts/package-desktop.py "桌面路径"` 可重新制作压缩包和单文件 HTML，发布版取自最近一次构建。`npm run sync:reference` 则重新下载清单固定版本并验证哈希、应用本地补丁；日常开发无需运行。重新同步会覆盖对原站生产资产的直接修改。

原站代码、品牌、模型、纹理和音效的权利归相应权利人；本仓库保留来源与已有许可声明，没有为这些第三方资产另行授予开源许可。
