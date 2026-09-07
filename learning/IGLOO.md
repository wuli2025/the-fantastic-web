# 怎么学习这份完整复现

先运行根目录 `npm run dev`。首页是完整原站公开构建的本地复现，`/forma.html` 是可直接阅读源码的人物实验。两者的用途不同：前者帮助观察完整效果和资源组织，后者方便从建模、粒子采样到交互逐步修改。

## 页面怎样启动

```text
index.html
  → src/igloo/main.js
  → public/study/content.json
  → public/assets/index-2eb69c09.js（原站入口）
  → public/assets/App3D-f554a111.js（原站生产构建）
  → 本地模型、纹理、字体和音效
```

原站的文字、按钮和背景基本都在 WebGL 中绘制，所以查看 DOM 并不会看到普通网页那样的大量标题、段落、卡片。不要通过修改普通 CSS 来寻找冰块材质或粒子形态的入口。

## 第一项练习：改一个项目

在 `public/study/content.json` 中找到第一项 `cubes`，修改 `title` 与 `interior.content` 为英文测试文字，刷新页面，滚到第一个冰块并点击查看。文本使用原站 MSDF 字库，中文需要新的字库资源。

保留 `obj`、`innerobject`、`interior.obj` 和 `hash`，先验证自己理解了内容与资源的区别，再开始改资源。

## 第二项练习：观察滚动场景

页面加载完成后，在浏览器开发者工具控制台输入：

```js
iglooStudy.state              // 当前滚动位置、场景进度、详情状态
iglooStudy.goToScene(0)        // 冰屋
iglooStudy.goToScene(1)        // 冰块项目
iglooStudy.goToScene(2)        // 粒子社交场景
```

场景之间有动画，等转场结束后再进行下一项操作。在冰块场景还可以调用：

```js
iglooStudy.openProject(0)
iglooStudy.closeProject()
```

`iglooStudy.controller` 与 `iglooStudy.engine` 暴露了原站运行中的对象供观察，包括 Three.js renderer、各场景和材质。它们是调试接口，字段会随原生产构建变化，不是稳定的第三方 API。

## 第三项练习：理解模型格式

| 资源 | 这份复现中的作用 |
| --- | --- |
| `.drc` | Draco 压缩几何，加载后成为场景中的网格 |
| `.ktx2` | GPU 纹理容器，既保存表面图像，也保存噪声、查找表和粒子体积数据 |
| `.json` + 字体 `.ktx2` | 字形位置、排版参数和 MSDF 字体图集 |
| `.exr` | 高动态范围环境纹理 |
| `.ogg` | 音乐和音效 |
| `.glb` | 一体化 3D 资产格式；第三方 Hologram 项目用它采样粒子，此原站构建没有通用的 GLB 替换入口 |

原站最后的粒子形态使用 `images/volumes/` 中的体积数据，并非把 GLB 放进文件夹就能替换。重做人物通常需要建立自己的模型采样流程，或生成与原站着色器兼容的体积纹理。

## 要继续换人物

- 在可读源码里实验：修改根目录 `src/forms.js`，浏览 `/forma.html`。已有宇航员、舞者和奔跑者的程序化生成过程。
- 用现成 GLB：阅读已下载的 `learning/hologram-particles/`，从 `PlaygroundCanvas.tsx` 的 `MODELS` 和 `ParticlesHologram.tsx` 的 `sampleGLBGeometry()` 开始。其依赖尚未安装，启动方式和授权核对见旁边的 `README.md`。
- 研究原站的冰雪效果：结合原作者制作说明，在浏览器 Sources 中格式化 `App3D-f554a111.js` 阅读材质和 GLSL。格式化只能改善排版，无法恢复原始变量名、组件和建模工程。
