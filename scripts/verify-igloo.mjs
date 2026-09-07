import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:4175';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { cwd: root, stdio: 'pipe' });
let output = '';
server.stdout.on('data', data => output += data);
server.stderr.on('data', data => output += data);
const errors = [], external = [], failed = [];
const loaded = new Set();
let browser;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function observe(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    if (response.url().startsWith(`${base}/assets/`)) loaded.add(response.url());
  });
  await page.route('**/*', route => {
    const url = route.request().url();
    if (/^https?:/.test(url) && !url.startsWith(`${base}/`)) {
      external.push(url);
      return route.abort();
    }
    return route.continue();
  });
}
async function ready(page, path = '/') {
  await page.goto(`${base}${path}`);
  await page.waitForFunction(() => window.iglooStudy?.state.section !== null && window.iglooStudy?.state.ready, null, { timeout: 120000 });
  assert.equal(await page.locator('#load-error').isVisible(), false);
  // The original renderer is in a closed ShadowRoot, so DOM locators cannot see it.
  assert.ok(await page.evaluate(() => {
    const renderer = iglooStudy.engine.renderer;
    return renderer.domElement.isConnected && renderer.domElement.width > 0 && renderer.info.render.calls > 0;
  }), 'The attached WebGL canvas performs actual draw calls');
}
async function shot(page, name) {
  await page.screenshot({ path: `${root}/artifacts/igloo-${name}.png` });
}
async function uiPoint(page, name) {
  return page.evaluate(name => {
    const scene = iglooStudy.controller.uiScene;
    const mesh = scene.getObjectByName(name);
    if (!mesh?.geometry) throw new Error(`Missing UI mesh: ${name}`);
    mesh.geometry.computeBoundingBox();
    const point = mesh.geometry.boundingBox.getCenter(mesh.position.clone());
    point.applyMatrix4(mesh.matrixWorld).project(scene.camera);
    return { x: (point.x + 1) * innerWidth / 2, y: (1 - point.y) * innerHeight / 2 };
  }, name);
}
async function clickUI(page, name, touch = false) {
  const { x, y } = await uiPoint(page, name);
  if (touch) await page.touchscreen.tap(x, y);
  else { await page.mouse.move(x, y); await page.mouse.click(x, y); }
}

try {
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error(`Preview failed: ${output}`);
    try { if ((await fetch(base)).ok) break; } catch {}
    if (i === 79) throw new Error('Build the project before running tests');
    await wait(250);
  }
  const manifest = JSON.parse(await readFile(`${root}/reference/igloo-assets.json`, 'utf8'));
  for (const asset of manifest.assets) assert.ok((await stat(`${root}/dist/${asset.path}`)).size > 0, `Built asset: ${asset.path}`);
  console.log(`✓ All ${manifest.assets.length} original runtime assets included in dist`);
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  await mkdir(`${root}/artifacts`, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await observe(page);
  await ready(page);
  await shot(page, 'desktop-hero');
  const start = await page.evaluate(() => iglooStudy.state.scroll);
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 500);
  await page.waitForFunction(y => iglooStudy.controller.scroll.targetY2 > y + 0.05, start);
  const muted = await page.evaluate(() => iglooStudy.controller.audioController._controller.muted);
  await clickUI(page, 'sound');
  await page.waitForFunction(wasMuted => iglooStudy.controller.audioController._controller.muted !== wasMuted, muted);
  await clickUI(page, 'sound');
  await page.waitForFunction(wasMuted => iglooStudy.controller.audioController._controller.muted === wasMuted, muted);
  console.log('✓ Desktop: ice intro, real wheel input and sound toggle');

  await page.evaluate(() => iglooStudy.goToScene(1));
  await page.waitForFunction(() => Math.abs(iglooStudy.state.scroll - 2.35) < 0.02, null, { timeout: 45000 });
  await page.waitForTimeout(2200);
  await shot(page, 'desktop-cubes');
  const cubePoint = await page.evaluate(() => {
    const scene = iglooStudy.controller.scrollComposers[1].passes[0].scene;
    const mesh = scene.cubes[0].mesh;
    const p = mesh.geometry.boundingBox.getCenter(mesh.position.clone()).applyMatrix4(mesh.matrixWorld).project(scene.camera);
    return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
  });
  await page.mouse.move(cubePoint.x, cubePoint.y);
  await page.waitForTimeout(300);
  await page.mouse.click(cubePoint.x, cubePoint.y);
  await page.waitForFunction(() => iglooStudy.state.section === 'project', null, { timeout: 60000 });
  assert.match(page.url(), /\/portfolio\/pudgy-penguins$/);
  await shot(page, 'desktop-detail');
  await clickUI(page, 'close');
  await page.waitForFunction(() => iglooStudy.state.section === 'home' && !iglooStudy.state.detailOpen, null, { timeout: 60000 });
  console.log('✓ Real cube click opens project; close button returns to the scene');

  for (const index of [1, 2]) {
    await page.evaluate(index => iglooStudy.openProject(index), index);
    await page.waitForFunction(() => iglooStudy.state.section === 'project', null, { timeout: 60000 });
    assert.match(page.url(), index === 1 ? /\/portfolio\/overpass$/ : /\/portfolio\/abstract$/);
    await page.evaluate(() => iglooStudy.closeProject());
    await page.waitForFunction(() => iglooStudy.state.section === 'home' && !iglooStudy.state.detailOpen, null, { timeout: 60000 });
  }
  console.log('✓ All three project routes open and close');
  await page.evaluate(() => iglooStudy.goToScene(2));
  await page.waitForFunction(() => iglooStudy.state.scenes[2].visible && iglooStudy.state.scenes[2].progress > 0.7, null, { timeout: 60000 });
  await page.waitForTimeout(3500);
  assert.ok(await page.evaluate(() => iglooStudy.controller.scrollComposers[2].passes[0].scene.containerparticles.mesh.visible));
  await page.mouse.move(530, 380);
  await page.mouse.move(710, 440, { steps: 16 });
  await shot(page, 'desktop-particles');
  console.log('✓ Particle scene renders after the full-scene transition');
  await page.close();

  const deep = await browser.newPage({ viewport: { width: 960, height: 600 } });
  await observe(deep);
  await ready(deep, '/portfolio/abstract');
  assert.equal(await deep.evaluate(() => iglooStudy.state.detailOpen), true);
  assert.equal(await deep.evaluate(() => iglooStudy.controller.detailIndex), 2);
  await deep.close();
  console.log('✓ Direct project URL survives a fresh page load');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await observe(mobile);
  await ready(mobile);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await shot(mobile, 'mobile-hero');
  const mobileMuted = await mobile.evaluate(() => iglooStudy.controller.audioController._controller.muted);
  await clickUI(mobile, 'sound', true);
  await mobile.waitForFunction(muted => iglooStudy.controller.audioController._controller.muted !== muted, mobileMuted);
  await clickUI(mobile, 'sound', true);
  const beforeSwipe = await mobile.evaluate(() => iglooStudy.controller.scroll.targetY2);
  const session = await mobile.context().newCDPSession(mobile);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 600 }] });
  for (let y = 570; y >= 280; y -= 30) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mobile.waitForFunction(y => Math.abs(iglooStudy.controller.scroll.targetY2 - y) > 0.05, beforeSwipe);
  await mobile.evaluate(() => iglooStudy.goToScene(1));
  await mobile.waitForFunction(() => Math.abs(iglooStudy.state.scroll - 2.35) < 0.02, null, { timeout: 45000 });
  await mobile.waitForTimeout(1500);
  await shot(mobile, 'mobile-cubes');
  await mobile.close();
  console.log('✓ Mobile: portrait layout, native swipe, sound tap and ice cube scene');

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).includes('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  await fallback.goto(base);
  await fallback.locator('#load-error').waitFor({ state: 'visible' });
  assert.match(await fallback.locator('#load-error-message').textContent(), /WebGL 2/);
  assert.equal(await fallback.locator('#load-error a').getAttribute('href'), '/forma.html');
  await fallback.close();
  assert.deepEqual(failed, [], 'No missing runtime assets');
  assert.deepEqual(external, [], 'The experience loads with all external requests blocked');
  assert.deepEqual(errors, [], 'No browser errors in supported mode');
  assert.ok(loaded.size > 90, `Loaded ${loaded.size} distinct local runtime assets`);
  console.log(`✓ Unsupported WebGL message; ${loaded.size} local assets loaded; no external requests or browser errors`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
