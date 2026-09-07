# Igloo 风格粒子项目：学习入口

核对日期：2026-09-07。

当前根目录首页已补充原站公开生产构建的本地复现，见 [完整复现学习指南](IGLOO.md)。它不是官方开源项目；独立编写的 FORMA 入口已移至 `/forma.html`。

## 查找结果

本次检索没有找到可确认由 Igloo / Abeto 官方发布的完整网站开源仓库。原作者公开了[制作说明](https://www.awwwards.com/igloo-inc-case-study.html)，包含冰晶生成、粒子体积数据、转场和 WebGL UI 的思路。

最符合当前「人物模型变成粒子，并在模型间切换」需求的是 **Cortiz 的 Hologram Particles VFX**。它是第三方实现，重点是粒子部分，未包含原站完整冰雪场景。

| 项目 | 适合学习什么 | 已核对的授权信息 |
| --- | --- | --- |
| [cortiz2894/hologram-particles](https://github.com/cortiz2894/hologram-particles) | GLB 模型采样、立体小球粒子、GPU 物理、模型变形、灯光和调参面板 | 作者称其为免费开源资源；当前快照没有 LICENSE 文件，package.json 也没有 license 字段。产品直接复用前需明确代码及模型授权。 |
| [mmdalipour/particle-morph](https://github.com/mmdalipour/particle-morph) | React 组件封装、GLTF 转粒子、几何形态变化、滚动和拖动交互 | README 与 src/package.json 均标注 MIT；本次没有运行或完成其全部素材授权核查。 |
| [DGFX/codrops-dreamy-particles](https://github.com/DGFX/codrops-dreamy-particles) | WebGL 中用纹理保存粒子位置和速度、鼠标推动、辉光 | 有配套逐步教程；本次没有确认独立 LICENSE，模型来源见上游 Credits。 |

## 已下载的源码

位置：`learning/hologram-particles/`。

- 上游：https://github.com/cortiz2894/hologram-particles
- 分支：`main`
- 下载提交：`26f9cc1c16a51df2b67b4e5caaa50a6fc531c2dc`
- 在线体验：https://hologram-particles.vercel.app/
- 作者视频：https://www.youtube.com/watch?v=iO-P2gEuOUc

保留了上游源码快照；本仓库和发布的压缩包不包含上游嵌套 `.git` 目录，版本信息以上述提交号为准。已完成源码结构检查，尚未为这个独立学习项目安装依赖或验证构建运行。根目录的 FORMA 是另行编写的项目。

## 启动这个学习仓库

从当前项目根目录运行：

```bash
cd learning/hologram-particles
npm install
npm run dev
```

然后打开终端给出的地址，默认 http://localhost:3000。使用支持 WebGPU 的浏览器与设备；该项目的 GPU 计算依赖 WebGPU，不能只根据浏览器能否显示普通 WebGL 页面判断兼容性。本机 Node.js 是 22.23.1。

上游 README 的克隆命令目前指向另一个 `creative-boilerplate` 仓库。若重新下载，应使用：

```bash
git clone https://github.com/cortiz2894/hologram-particles.git
```

## 建议阅读顺序

1. **页面与模型入口**：`src/app/page.tsx` → `src/components/hologramParticles/PlaygroundCanvas.tsx`。先看 `MODELS` 数组，理解选择模型如何改变 `url`。
2. **参数入口**：`src/components/hologramParticles/utils/useHologramControls.ts` 与 `presets.ts`。先调粒子数量、大小、灯光和形变时间，观察各参数的作用。
3. **模型变成粒子**：`ParticlesHologram.tsx` 中约第 87 行的 `sampleGLBGeometry()`。阅读模型尺寸归一化、采样位置与法线。当前代码在各个 Mesh 之间近似平均分配粒子，每个 Mesh 内部再按三角形面积采样；并非按整个模型表面积统一分配。大小差异很大的 Mesh 可能产生密度不均，这是适合改进的位置。
4. **立体粒子渲染**：同文件约第 513 行的 `InstancedMesh`。这里以小型立体几何作为粒子，可以学习表面法线与单颗粒子法线如何影响明暗。
5. **鼠标与回弹**：同文件约第 640 行的 `computePhysics`，以及约第 1431 行的 `renderer.computeAsync()`。重点看粒子速度、偏移、鼠标影响范围与复位力。
6. **模型切换**：同文件约第 1231 行的状态处理。跟踪 `idle → deform-out → morphing → deform-in → idle`，区分目标位置插值与物理偏移。

上述行号对应本次下载的提交；更新上游后以函数名检索为准。

## 第一个练习：换成自己的人物

准备一个自己的 GLB 人物模型，放进 `public/glb/`，例如 `astronaut.glb`。在 `PlaygroundCanvas.tsx` 的 `MODELS` 数组加入对应条目：

```ts
{ id: "astronaut", label: "宇航员", url: "/glb/astronaut.glb" }
```

先确认单个人物能正确采样，再加入第二个人物测试变形。随后依次尝试灯光、鼠标回弹与粒子数量。不要一开始同时修改渲染、物理和页面逻辑，否则很难判断变化由哪部分引起。

## 从学习到产品

建议先做「选择模型 → 调整效果 → 保存配置 → 在展示页加载」的小闭环。之后再加入上传模型、多个场景、移动端性能调整与不支持 WebGPU 的回退方案。

Hologram 项目适合阅读实现与做技术实验；代码复用、随附 BD-1 / BB-8 模型和其他素材用于产品之前，需要分别明确授权。README 标注 MIT 的替代项目也应保留其许可声明，并另外确认模型素材的来源。

补充阅读：[Codrops 的 GPGPU 粒子教程](https://tympanus.net/codrops/2024/12/19/crafting-a-dreamy-particle-effect-with-three-js-and-gpgpu/)。
