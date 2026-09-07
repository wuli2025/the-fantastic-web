import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:4174';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { cwd: root, stdio: 'pipe' });
let serverOutput = '';
server.stdout.on('data', data => serverOutput += data);
server.stderr.on('data', data => serverOutput += data);
let browser;
const errors = [];
const externalRequests = [];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function ready(page) {
  await page.goto(`${base}/forma.html`);
  await page.locator('#scene[data-ready="true"]').waitFor({ timeout: 30000 });
  await page.locator('#loading.loaded').waitFor({ state: 'attached' });
  await page.locator('#loading').waitFor({ state: 'hidden' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  assert.equal(await page.locator('#fallback').isVisible(), false, 'WebGL scene should render');
}
function track(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
}
async function selected(page, index) {
  await expect(page.locator(`.form-option[data-form="${index}"]`)).toHaveAttribute('aria-pressed', 'true');
  assert.equal(await page.locator('.form-option[aria-pressed="true"]').count(), 1);
  assert.equal(await page.locator('#figure-number').textContent(), String(index + 1).padStart(3, '0'));
  if (index !== 0) assert.equal(await page.locator('#scene').getAttribute('data-form'), String(index));
}

try {
  let available = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(`Preview server exited: ${serverOutput}`);
    try { available = (await fetch(base)).ok; } catch {}
    if (available) break;
    await wait(250);
  }
  assert.ok(available, 'Preview server should start; run npm run build first');
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await desktop.addInitScript(() => {
    window.__webglDrawCalls = 0;
    for (const method of ['drawArrays', 'drawElements']) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        window.__webglDrawCalls++;
        return original.apply(this, args);
      };
    }
  });
  track(desktop);
  await ready(desktop);
  await selected(desktop, 0);
  assert.match(await desktop.locator('#particle-count').textContent(), /48,000/);
  await desktop.screenshot({ path: `${root}/artifacts/desktop-explorer.png` });
  for (const [index, name] of [[1, 'dancer'], [2, 'runner']]) {
    await desktop.locator(`.form-option[data-form="${index}"]`).click();
    await selected(desktop, index);
    await desktop.waitForTimeout(2200);
    await desktop.screenshot({ path: `${root}/artifacts/desktop-${name}.png` });
  }
  await desktop.locator('#explore').click();
  await selected(desktop, 0);
  await desktop.keyboard.press('ArrowRight');
  await selected(desktop, 1);
  await desktop.keyboard.press('ArrowLeft');
  await selected(desktop, 0);
  await desktop.mouse.move(960, 440);
  await desktop.mouse.wheel(0, 200);
  await selected(desktop, 1);
  await desktop.waitForTimeout(2300);
  await desktop.mouse.down();
  await desktop.waitForTimeout(1100);
  await desktop.screenshot({ path: `${root}/artifacts/desktop-dispersed.png` });
  await desktop.mouse.up();
  await desktop.mouse.move(960, 440);
  await desktop.mouse.down();
  await desktop.mouse.move(1110, 440, { steps: 12 });
  await desktop.mouse.up();
  await desktop.locator('#quality-toggle').click();
  assert.match(await desktop.locator('#particle-count').textContent(), /18,000/);
  await desktop.locator('#quality-toggle').click();
  assert.match(await desktop.locator('#particle-count').textContent(), /48,000/);
  await desktop.locator('#sound-toggle').click();
  assert.equal(await desktop.locator('#sound-toggle').getAttribute('aria-pressed'), 'true');
  await desktop.locator('#sound-toggle').click();
  assert.equal(await desktop.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
  await desktop.locator('#about-open').click();
  assert.equal(await desktop.locator('#about-dialog').isVisible(), true);
  const pausedBefore = await desktop.evaluate(() => window.__webglDrawCalls);
  assert.ok(pausedBefore > 0, 'The scene issues WebGL draw calls');
  await desktop.waitForTimeout(300);
  assert.equal(await desktop.evaluate(() => window.__webglDrawCalls), pausedBefore, 'The scene pauses behind the information dialog');
  await desktop.keyboard.press('Escape');
  assert.equal(await desktop.locator('#about-dialog').isVisible(), false);
  assert.equal(await desktop.evaluate(() => document.activeElement.id), 'about-open');
  console.log('✓ Desktop: 3 forms, wheel, keyboard, drag, hold, quality, audio, dialog and focus');
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  track(mobile);
  await ready(mobile);
  assert.match(await mobile.locator('#particle-count').textContent(), /18,000/);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Mobile page should not overflow horizontally');
  await mobile.screenshot({ path: `${root}/artifacts/mobile-explorer.png` });
  const session = await mobile.context().newCDPSession(mobile);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 310, y: 490 }] });
  for (let x = 290; x >= 150; x -= 20) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 490 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await selected(mobile, 1);
  await mobile.locator('.form-option[data-form="2"]').tap();
  await selected(mobile, 2);
  await mobile.locator('#sound-toggle').tap();
  await expect(mobile.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  await mobile.locator('#sound-toggle').tap();
  await expect(mobile.locator('#sound-toggle')).toHaveAttribute('aria-pressed', 'false');
  await mobile.locator('#quality-toggle').tap();
  await expect(mobile.locator('#particle-count')).toContainText('48,000');
  await mobile.locator('#quality-toggle').tap();
  await expect(mobile.locator('#particle-count')).toContainText('18,000');
  await mobile.locator('#about-open').tap();
  await mobile.waitForTimeout(350);
  await expect(mobile.locator('#about-dialog')).toBeVisible();
  await mobile.locator('#about-close').tap();
  await expect(mobile.locator('#about-dialog')).toBeHidden();
  await mobile.waitForTimeout(2200);
  await mobile.screenshot({ path: `${root}/artifacts/mobile-runner.png` });
  await mobile.setViewportSize({ width: 360, height: 640 });
  await mobile.screenshot({ path: `${root}/artifacts/mobile-small.png` });
  const footer = await mobile.locator('.footer').boundingBox();
  assert.ok(footer.y + footer.height <= 640, 'Small-screen footer stays visible');
  console.log('✓ Mobile: native touch swipe, buttons, low quality default, 390px and 360px layouts');
  await mobile.close();

  const reduced = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  track(reduced);
  await ready(reduced);
  const still = await reduced.locator('#scene').screenshot();
  await reduced.waitForTimeout(350);
  assert.ok(still.equals(await reduced.locator('#scene').screenshot()), 'Reduced motion removes idle animation');
  await reduced.locator('.form-option[data-form="2"]').click();
  await selected(reduced, 2);
  console.log('✓ Accessibility: reduced motion, selected state, keyboard navigation and modal focus');
  await reduced.close();

  const fallback = await browser.newPage();
  fallback.on('pageerror', error => errors.push(error.message));
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).includes('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  await fallback.goto(`${base}/forma.html`);
  await fallback.locator('#fallback').waitFor();
  await fallback.locator('#loading').waitFor({ state: 'hidden' });
  await fallback.locator('#about-open').click();
  await fallback.keyboard.press('Escape');
  assert.equal(await fallback.locator('#loading').isVisible(), false);
  console.log('✓ Unsupported WebGL: visible recovery message, loader dismissed, dialog usable');

  assert.deepEqual(errors, [], 'No browser errors');
  assert.deepEqual(externalRequests, [], 'All runtime code, fonts and assets are local');
  console.log('✓ No console errors or external runtime requests. Screenshots saved in artifacts/.');
} finally {
  await browser?.close();
  server.kill();
}
