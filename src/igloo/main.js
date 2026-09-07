// Local entry point. The scene is the original public production build.
const errorPanel = document.querySelector('#load-error');
const errorMessage = document.querySelector('#load-error-message');
function showError(message) {
  errorMessage.textContent = message;
  errorPanel.hidden = false;
}
document.querySelector('#reload').addEventListener('click', () => location.reload());

window.__onIglooReady = ({ controller, engine, events, config }) => {
  // Learning interface: inspect the engine and navigate during development.
  window.iglooStudy = {
    controller,
    engine,
    config,
    get state() {
      return {
        ready: true,
        scroll: controller.scroll.y,
        total: controller.scroll.total,
        section: controller.currentSection,
        detailOpen: controller.isDetailOpen,
        scenes: controller.scrollComposers.map(composer => {
          const scene = composer.passes[0].scene;
          return { name: scene.constructor.name, height: scene.height, top: scene.__top, visible: scene.isSceneVisible, progress: scene.progress };
        }),
      };
    },
    goToScene(index) {
      if (!Number.isInteger(index) || index < 0 || index > 2) throw new RangeError('Scene index must be 0, 1, or 2');
      if (controller.isDetailOpen) throw new Error('Close the project before changing scenes');
      controller.stopAutoCenter();
      const top = controller.scrollComposers.slice(0, index).reduce((sum, composer) => sum + composer.passes[0].scene.height, 0);
      const scene = controller.scrollComposers[index].passes[0].scene;
      const offset = index === 2 ? scene.finalScrollAutocenter * (scene.height + 1) - 1 : 0;
      controller.centerScroll(top + offset, 1.2);
    },
    openProject(index) {
      const project = config.cubes[index];
      if (!project) throw new RangeError('Unknown project');
      events.emit('webgl_switch_scene', `/portfolio/${project.hash}`);
    },
    closeProject() { events.emit('webgl_switch_scene', '/'); },
  };
  document.documentElement.dataset.iglooReady = 'true';
  errorPanel.hidden = true;
  window.dispatchEvent(new CustomEvent('igloo:ready'));
};

try {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) throw new Error('此体验需要 WebGL 2。请使用支持硬件加速的现代浏览器。');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  const response = await fetch('/study/content.json');
  if (!response.ok) throw new Error(`内容文件加载失败 (${response.status})`);
  window.IGLOO_CONTENT = await response.json();
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/assets/index-2eb69c09.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('本地场景脚本加载失败。'));
    document.head.append(script);
  });
} catch (error) {
  console.error('Igloo local study could not start:', error);
  showError(error.message || '加载失败，请刷新页面重试。');
}
window.addEventListener('unhandledrejection', () => {
  if (!window.iglooStudy) showError('场景加载失败。请检查本地服务器和 public/assets 资源是否完整，然后刷新页面。');
});
