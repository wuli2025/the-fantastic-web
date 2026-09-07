# 参考资源与本地改动

来源：https://www.igloo.inc/ 。采集日期：2026-09-07。

制作方署名在原生产脚本中保留为 Abeto。原作者的[制作说明](https://www.awwwards.com/igloo-inc-case-study.html)介绍了 Three.js、Svelte、GSAP、Vite、自定义冰晶与体积粒子流程。

## 包含的原站文件

`igloo-assets.json` 记录 111 个公开资源的 URL、文件长度和原文件 SHA-256。资源保存在根目录的 `public/assets/`，包括：

- `index-2eb69c09.js`：生产入口、加载动画、Svelte 运行时。
- `App3D-f554a111.js`：编译后的 Three.js 引擎、场景、交互与着色器。
- `geometries/`：Draco 压缩几何。
- `images/`：KTX2、PNG、EXR 纹理，包含粒子体积数据。
- `fonts/`：MSDF 字形信息与字体纹理。
- `audio/`：环境音、音乐和交互音效。
- `libs/` 和 worker 脚本：Draco、Basis 与纹理/字体解码。

这些是浏览器可以公开加载的生产文件，不包含原作者的开发源码、源映射或建模工程，也不意味着项目获得了开源许可。原文件内已有的第三方库许可声明予以保留。

## 本地适配

`scripts/patch-igloo.mjs` 对固定版本执行可重复的补丁：

1. 将入口脚本中的原站绝对资源地址改为本地根路径。
2. 允许 `public/study/content.json` 覆盖内置文案配置。
3. 场景初始化后调用本地钩子，为验证和学习提供 `window.iglooStudy`。
4. 为 MSDF 字体着色器的 `fwidth` 设置非零下限，避免 `smoothstep` 两端相同时在 SwiftShader 中出现整块白色文字。该修正经修改前后的浏览器截图确认。

两个修改过的 JS 文件以 `/* IGLOO_LOCAL_STUDY */` 标记。因此清单中的 SHA-256 对应下载前的原文件，不是补丁后的文件。其他资源保持下载时的字节内容。

本地另行编写的文件包括 `src/igloo/main.js`、根页面、资源脚本、验证脚本和学习文档。FORMA 是此前独立编写的人物粒子实验，未使用上述 Igloo 生产资产。
