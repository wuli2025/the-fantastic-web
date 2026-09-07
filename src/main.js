import '@fontsource/ibm-plex-mono/latin-400.css';
import './style.css';
import { ParticleScene } from './scene.js';
import { formInfo } from './forms.js';
import { AmbientAudio } from './audio.js';

const $ = (selector) => document.querySelector(selector);
const container = $('#scene');
const loading = $('#loading');
const dialog = $('#about-dialog');
const sound = new AmbientAudio();
let selected = 0;
let scene;
let wheelSum = 0;
let wheelLock = 0;
let lastWheelTime = 0;
let holdTimer;
let burstTimer;
let drag = null;

function onPress(button, action) {
  let touch = null;
  let lastTouchPress = -Infinity;
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') touch = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  button.addEventListener('pointercancel', () => { touch = null; });
  button.addEventListener('pointerup', event => {
    if (touch?.id === event.pointerId && Math.hypot(event.clientX - touch.x, event.clientY - touch.y) < 12) {
      // Some mobile browsers suppress the compatibility click immediately after a swipe.
      // Handle a real touch release, then ignore only its duplicate compatibility click.
      lastTouchPress = performance.now();
      action(event);
    }
    touch = null;
  });
  button.addEventListener('click', event => {
    if (event.detail !== 0 && performance.now() - lastTouchPress < 700) return;
    action(event);
  });
}

function selectForm(index) {
  index = (index + formInfo.length) % formInfo.length;
  if (index === selected) return;
  selected = index;
  scene?.setForm(index);
  const info = formInfo[index];
  document.querySelectorAll('.form-option').forEach((button, i) => {
    button.classList.toggle('active', i === index);
    button.setAttribute('aria-pressed', String(i === index));
  });
  $('#figure-number').textContent = String(index + 1).padStart(3, '0');
  $('#figure-code').textContent = info.code;
  $('#scene-caption').textContent = info.caption;
  $('#form-announcement').textContent = `当前形态：${info.name}`;
  sound.morph(index);
}

function releasePointer() {
  clearTimeout(holdTimer);
  scene?.burst(false);
  container.style.cursor = '';
  drag = null;
}

// Yield once so the loading screen can paint before procedural geometry is sampled.
requestAnimationFrame(() => setTimeout(() => {
  try {
    scene = new ParticleScene(container, {
      onQualityChange(high, count) {
        $('#particle-count').textContent = `${count.toLocaleString('en-US')} PARTICLES`;
        $('.quality-label').textContent = high ? 'HQ' : 'LQ';
        $('#quality-toggle').setAttribute('aria-label', `当前${high ? '高' : '低'}精度，${count}粒子，点击切换`);
      },
      onReady() { loading.classList.add('loaded'); },
      onUnsupported() {
        loading.classList.add('loaded');
        $('#fallback').hidden = false;
        $('#interaction-hint').hidden = true;
        $('#quality-toggle').disabled = true;
      },
    });
    if (scene.geometry && selected !== 0) scene.setForm(selected);
  } catch (error) {
    console.error('Particle scene could not start:', error);
    loading.classList.add('loaded');
    $('#fallback').hidden = false;
  }
}, 40));

document.querySelectorAll('.form-option').forEach(button => onPress(button, () => selectForm(Number(button.dataset.form))));
onPress($('#explore'), () => selectForm(selected + 1));
onPress($('#quality-toggle'), () => scene?.setQuality(!scene.highQuality));
onPress($('#sound-toggle'), async () => {
  try {
    const enabled = await sound.toggle();
    $('#sound-toggle').setAttribute('aria-pressed', String(enabled));
    $('#sound-toggle').setAttribute('aria-label', enabled ? '关闭环境音' : '开启环境音');
    $('#sound-label').textContent = enabled ? 'SOUND ON' : 'SOUND OFF';
  } catch {
    $('#sound-label').textContent = 'AUDIO UNAVAILABLE';
  }
});

onPress($('#about-open'), () => { releasePointer(); dialog.showModal(); scene?.pause(true); });
onPress($('#about-close'), () => dialog.close());
dialog.addEventListener('close', () => { scene?.pause(false); $('#about-open').focus(); });
let backdropPressed = false;
dialog.addEventListener('pointerdown', event => {
  const r = dialog.getBoundingClientRect();
  backdropPressed = event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom);
});
dialog.addEventListener('click', event => {
  // Require the gesture to begin on the backdrop, so the opener's touch cannot close it.
  if (!backdropPressed || event.target !== dialog) return;
  backdropPressed = false;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});

window.addEventListener('wheel', event => {
  if (dialog.open || event.ctrlKey) return;
  event.preventDefault();
  const now = performance.now();
  if (now < wheelLock) return;
  if (now - lastWheelTime > 220 || Math.sign(event.deltaY) !== Math.sign(wheelSum)) wheelSum = 0;
  lastWheelTime = now;
  wheelSum += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  if (Math.abs(wheelSum) >= 65) {
    selectForm(selected + Math.sign(wheelSum));
    wheelSum = 0; wheelLock = now + 1200;
  }
}, { passive: false });

container.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, touch: event.pointerType === 'touch', moved: false };
  container.setPointerCapture(event.pointerId);
  scene?.setPointer(event.clientX, event.clientY);
  holdTimer = setTimeout(() => { if (drag && !drag.moved) scene?.burst(true); }, 260);
});
container.addEventListener('pointermove', event => {
  scene?.setPointer(event.clientX, event.clientY);
  if (!drag) return;
  if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) {
    drag.moved = true; clearTimeout(holdTimer); scene?.burst(false);
  }
  if (!drag.touch) scene?.rotate(event.clientX - drag.lastX);
  drag.lastX = event.clientX;
});
container.addEventListener('pointerup', event => {
  if (drag?.touch) {
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) selectForm(selected + (dx < 0 ? 1 : -1));
    else if (Math.abs(dy) > 55 && Math.abs(dy) > Math.abs(dx)) selectForm(selected + (dy < 0 ? 1 : -1));
  }
  releasePointer();
  if (event.pointerType === 'touch') scene?.clearPointer();
});
container.addEventListener('pointercancel', releasePointer);
container.addEventListener('lostpointercapture', releasePointer);
container.addEventListener('pointerleave', () => { if (!drag) scene?.clearPointer(); });
window.addEventListener('blur', releasePointer);
window.addEventListener('keydown', event => {
  if (dialog.open || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); selectForm(selected + 1); }
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); selectForm(selected - 1); }
  else if (event.code === 'Space' && !event.repeat && !event.target.closest('button,a')) {
    event.preventDefault(); scene?.burst(true);
    clearTimeout(burstTimer); burstTimer = setTimeout(() => scene?.burst(false), 1600);
  }
});
window.addEventListener('keyup', event => { if (event.code === 'Space') { clearTimeout(burstTimer); scene?.burst(false); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) releasePointer(); sound.visibility(document.hidden); });

if (import.meta.hot) import.meta.hot.dispose(() => { scene?.dispose(); sound.dispose(); });
