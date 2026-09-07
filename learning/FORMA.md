# FORMA · 形态之间

参考 [Igloo Inc.](https://www.igloo.inc/) 的沉浸式 3D 与粒子交互，制作的独立人物主题版本。当前实现聚焦人物粒子展厅：宇航员、舞者、奔跑者；没有复刻原站的冰屋、冰块项目展示或完整滚动叙事。

## 运行

需要 Node.js 22.12+（或 Node.js 20.19+）。

```bash
npm install
npm run dev
```

打开 http://localhost:5173/forma.html（原站本地复现现在占用根首页）。安装依赖后，字体、人物和动画均在本地加载，无需 Google Fonts 或模型 CDN。请通过本地服务器打开，不能直接双击 HTML。

## 交互

- 滚轮、底部人物按钮、方向键：在三个角色间切换。
- 鼠标移动：局部扰动粒子；拖动：旋转人物。
- 长按场景或按空格：粒子散开，松开后重新聚合。
- 手机水平或垂直滑动：切换角色。
- SOUND：手动开启 / 关闭生成式环境音，默认关闭。
- HQ / LQ：48,000 / 18,000 粒子切换，手机默认低精度。
- 关于实验：操作说明；支持 Escape 关闭和焦点返回。

## 构建与验证

```bash
npm run build
npx playwright install chromium
npm run test:forma
```

`dist/` 是可部署的静态站点。测试自动启动 4174 端口的预览服务器，验证桌面、手机手势、声音、弹窗、减少动态效果与 WebGL 不支持时的提示，并将截图存入 `artifacts/`。若使用已安装的 Chromium，可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。

## 修改位置

- `src/forms.js`：三个人物的程序化建模、采样、配色、名称和描述。每种形态具有相同数量的目标点，方便增补和替换。
- `src/scene.js`：Three.js 场景、GPU 粒子变形着色器、鼠标扰动与环境效果。
- `src/main.js`：切换、拖拽、触屏、键盘与页面交互。
- `src/audio.js`：浏览器内生成的环境音。
- `src/style.css`、`forma.html`：版式、文字和响应式样式。

人物使用程序化几何，未使用第三方人物模型。若追求写实面部、复杂服饰或电影级冰晶折射，需要后续制作更精细的模型与材质。真实设备性能取决于 GPU；当前提供精度切换、后台暂停和系统减少动态效果支持。

视觉与交互参考：[Igloo Inc.](https://www.igloo.inc/) · [原作者制作说明](https://www.awwwards.com/igloo-inc-case-study.html)。品牌、文案、人物几何与本项目代码独立编写；字体依其安装包内许可证使用。
