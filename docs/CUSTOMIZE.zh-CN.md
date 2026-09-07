# 修改指南：从哪里改，改完会发生什么

先用 `npm run dev` 运行工程。Igloo 的改动看 `/`，FORMA 的改动看 `/forma.html`；两套入口不要混淆。以下数值是当前代码值，建议值是实验起点，不是所有设备的最佳参数。

## 1. 最值得先改的地方

| 想要的变化 | 修改位置 | 难度 | 预期结果与边界 |
| --- | --- | --- | --- |
| 展示自己的项目 | `public/study/content.json` 的 `manifesto`、`cubes` | 低 | 改 Igloo 文案；原字体图集不支持任意汉字 |
| 换项目/社交链接 | 同文件的 `social`、`interior.links`、`links[].url` | 低 | 按钮跳转地址改变 |
| 改 FORMA 标题和品牌色 | `forma.html`、`src/style.css` | 低 | HTML 文案、排版、按钮颜色改变 |
| 改人物颜色 | `src/forms.js` 的三种颜色和 `src/scene.js` 的 `hot` | 低 | 基础配色和变形高亮分别改变 |
| 改切换速度 | `src/scene.js` 的 `dt / 1.65` | 低 | 数值小则变形快 |
| 改鼠标排斥范围/力度 | 同文件顶点着色器的 `.62` / `.19` | 低 | 指针扰动变宽或变强 |
| 改人物姿势/配件 | `src/forms.js` 的 `explorer/dancer/runner` | 中 | 零件坐标决定形状；采样权重决定细节密度 |
| 增加第 4 个人物 | `forms.js`、`forma.html`、`audio.js`、`style.css` | 中 | 需要同步数据、按钮、音高和布局 |
| 增加真实 GLB 人物 | 第三方项目的 `PlaygroundCanvas.tsx`、`ParticlesHologram.tsx` | 中 | 已有加载/采样入口，使用 WebGPU |
| 改 Igloo 冰块形状或材质 | DRC 模型、配套纹理、生产脚本材质 | 高 | 需符合现有 UV、属性和资源加载约定 |
| 更换 Igloo 粒子为任意模型 | 体积导出流程、KTX2、原站模拟着色器 | 高 | 不是给 `vdb` 填一个 GLB 路径 |
| 新增完整 Igloo 场景 | 控制器、合成器、路由、声音与动画 | 高 | JSON 中加一项通常不够 |

建议先做自己的 FORMA 配色和文案，再换姿势与模型，最后考虑完整冰雪叙事。它的可读源码更适合作为长期开发基础。

## 2. 十分钟练习：改成自己的作品介绍

编辑完整的 [`public/study/content.json`](../public/study/content.json)，依次修改：

```text
manifesto.title                 → "////// My Studio"
manifesto.text                  → 自己的英文简介
cubes[0].title                  → "PROJECT_01 My Portfolio"
cubes[0].interior.content       → 自己的项目介绍
cubes[0].interior.links[0].link → 自己的作品网址
```

上面是“字段 → 值”的说明，不是可以整段替换文件的 JSON。第一次练习保留 `hash`、`obj`、`innerobject`、`interior.obj` 和全部其他字段。嵌套配置是浅合并，删掉同一对象里的字段可能导致运行失败。

刷新后等待开场结束，滚到冰块场景，点开第一项检查正文。修改 `colorTitle`、`colorText`、`colorProjectTitle`、`colorProjectText` 可以分别观察不同文字层级；修改 `volume` 影响音量，默认 `muted: true`。

`gridSize` 等是 UI 网格/布局配置，**不是粒子数量**。`links[].scale` 是末尾对应形体的比例参数。原有项目数、模型名、路由和场景逻辑有联系，不建议最初就随意删掉数组项。

## 3. FORMA 常用参数速查

在 [`src/scene.js`](../src/scene.js) 用右侧关键词搜索，比依赖行号更稳。

| 关键词 / 当前值 | 含义 | 可以怎样试 |
| --- | --- | --- |
| `dt / 1.65` | 变形持续时间，约 1.65 秒 | 改为 `dt / 2.5`，观察更慢的聚散 |
| `flow * .012` | 静止形态的细小流动 | 改为 `.005` 更安静，`.025` 更活跃 |
| `0.5 + aSeed * 1.35` | 变形中途的旋涡位移 | 两项都减半，观察更紧凑的转场 |
| `smoothstep(.0, .62, dist)` | 鼠标影响半径 | `.62` 改成 `.85`，扩大作用区域 |
| `* .19 * uMotion` | 鼠标位移强度 | `.19` 改成 `.12`，更柔和 |
| `1.0 + aSeed * 2.7` | 散开的径向距离 | 减少 `2.7`，避免长按后散得过远 |
| `1 - Math.exp(-dt * 5)` | 散开/旋转跟随的缓动速度 | `5` 改成 `3`，反应更柔和 |
| `gl_PointSize`、`uSize` | 点的屏幕尺寸 | 同时考虑 `resize()` 会重新设置 `uSize` |
| `vec3 hot = vec3(.94, .31, .105)` | 转场和扰动时的暖色高亮 | 可改为蓝色方向的 RGB 值 |
| `this.count = 48000`、`18000` | HQ / LQ 人物绘制数量 | 先试 36,000 / 12,000，保持低档不大于总数 |
| `setPixelRatio` | 像素比 | 高档上限 2；降低对高分屏的影响通常很明显 |
| `camera.position`、`resize()` | 相机和人物摆放 | 先改视野角或人物缩放，再调整横向位置 |

点大小公式还包括透视缩放及 `clamp` 上下限：只改一个系数，可能会被上限截住。像素比是线性尺寸倍率，屏幕像素数量随其平方变化。

低质量目前通过 `setDrawRange()` 绘制前 18,000 点；即使选 LQ，仍会先采样完整人物。如果主要卡在“初次打开”，可以按设备决定初始化总数，或把采样结果预生成；只改 LQ 绘制范围不能解决所有加载卡顿。

## 4. 配色要分别改三层

1. **界面**：`src/style.css` 的 `:root` 中 `--orange`、`--muted`、背景色等。
2. **人物基础颜色**：`src/forms.js` 顶部 `silver`、`charcoal`、`orange`。
3. **粒子动态高亮与环境**：`src/scene.js` 的 `hot`、`addAtmosphere()` 中尘埃/地面/圆环颜色。

只改 CSS 的 `--orange` 不会改变 GPU 中的粒子高亮。可以先将 `hot` 改成 `vec3(.20, .65, 1.0)` 观察冷色转场，再配合人物和界面的颜色统一风格；这是调色示例，不是物理色彩校准。

## 5. 改姿势与增加人物

`limb(a, b, radiusA, radiusB)` 的 `a`、`b` 是肢体端点。例如调整宇航员上臂和前臂时，共享的肘关节坐标必须一起改变，否则会脱节。坐标系中 Y 向上；先对照现有人物尺寸和地面高度修改。

新增人物时需要同步：

- `src/forms.js`：新增形体函数，将其加入 `[explorer, dancer, runner]`，并增加 `formInfo` 条目。输出仍要具有相同数量的坐标和颜色。
- `forma.html`：新增 `.form-option` 按钮，`data-form="3"` 对应第 4 项。
- `src/style.css`：当前人物选择器采用三列布局，新增后调整列数和手机布局。
- `src/audio.js`：`morph(index)` 使用两个三项音高数组，需要补第 4 项，否则新索引得到 `undefined`。
- `src/scene.js`：`setForm()` 有前三个人物的默认角度分支，可以为新人设定角度。

`selectForm()` 已按 `formInfo.length` 循环索引，但这不代表按钮、音频和布局都会自动增加。现有 FORMA 验证脚本也针对三个角色；扩展后应补充新角色的切换验证。

## 6. 用 GLB 做写实人物

现成入口在 [`PlaygroundCanvas.tsx`](../learning/hologram-particles/src/components/hologramParticles/PlaygroundCanvas.tsx)：

```ts
const MODELS: ModelOption[] = [
  { id: "bd1", label: "BD-1", url: "/glb/bd1.glb" },
  { id: "bb8", label: "BB-8", url: "/glb/bb8.glb" },
  { id: "astronaut", label: "宇航员", url: "/glb/astronaut.glb" },
];
```

模型放进 **该子项目** 的 `public/glb/`。它也已有本地文件选择逻辑，利用 `URL.createObjectURL(file)` 加载 GLB。随后从子项目目录安装依赖和启动：

```bash
cd learning/hologram-particles
npm install
npm run dev
```

此项目需要其 WebGPU 计算路径可用。本次没有为它安装依赖或验证运行；它也不会出现在根项目 `npm run build` 的两个页面中。

值得改进的采样细节：`sampleGLBGeometry()` 先做居中、缩放和落地；**每个 Mesh 分到的点数近似相等**，然后 Mesh 内按面积采样。对于“很小的纽扣是独立 Mesh、大躯干是另一个 Mesh”的模型，密度会不均。可改为按变换后的各 Mesh 表面积分配点数，并妥善处理取整余数。

另外，静态表面采样不会自动得到骨骼动画。若需要跑动中的人物点云，需要额外把骨骼变换或逐帧采样结果接入粒子系统。该第三方快照没有明确 LICENSE 文件，模型与代码来源说明见 [学习入口](../learning/README.md)。

## 7. 如果想长期开发，哪些重构最有价值

| 改进 | 解决的问题 | 可落地做法 |
| --- | --- | --- |
| 集中效果配置 | 数值散在 JS 与 GLSL，调色容易漏项 | 把数量、速度、颜色、影响范围汇总，动态值通过 uniforms 传入 |
| 自动生成角色按钮 | 添加人物要同步 HTML 和数组 | 用同一份角色配置生成按钮、文案、音高与默认角度 |
| 加 GLB 采样适配层 | 程序化人物细节有限 | 将 GLB 输出统一成 `positions/colors`，保持后续变形接口 |
| 离线生成点云或 Worker 采样 | 初始化时主线程计算可能卡顿 | 预生成数据；对纯数值计算迁移线程，评估额外传输成本 |
| 加调参面板与预设导出 | 每次都手工改代码效率低 | 把参数接入 UI，保存为 JSON，展示页读取固定预设 |
| 按设备设置质量 | 单看屏幕宽度不能判断 GPU 性能 | 用帧耗时决定降档，并保留手动开关 |
| 建自己的相机时间线 | 复杂滚动故事难以维护 | 独立配置场景段落、镜头起止和缓动，再处理场景合成 |

若要做个人作品集或产品官网，FORMA 的 HTML 内容层也更方便加入可选择的正文、中文排版和正常链接。Igloo 的压缩脚本适合研究和固定版本小范围适配；DevTools 格式化可以帮助阅读，但无法恢复原始组件、变量名和建模工程。

## 8. 修改后如何确认

```bash
npm run build
npm test
npm run test:forma
```

`npm test` 检查 Igloo，`test:forma` 检查 FORMA。首次需要 `npx playwright install chromium`。除了脚本通过，也应看修改效果在桌面和手机尺寸下的画面。

- 改文案：检查开场、项目详情、按钮目标及换行。
- 改粒子：检查静止、切换中途、长按、松开、低质量模式。
- 加人物：检查所有按钮、循环切换、键盘及音效。
- 改服务器：检查 `/portfolio/pudgy-penguins` 直达与刷新，以及资源是否返回正确类型。

本项目使用 `/assets/`、`/study/` 和 `/portfolio/` 等根路径。**上传 GitHub 只代表托管文件**；直接把当前构建放到 GitHub Pages 的 `/the-fantastic-web/` 子路径还需要资源前缀和路由回退适配，单改 Vite `base` 不足以修复原生产脚本中的路径。下载和部署方式见 [下载说明](DOWNLOADS.zh-CN.md)。
