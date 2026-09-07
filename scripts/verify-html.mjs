import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const file = resolve(process.argv[2] || 'artifacts/Igloo-standalone.html');
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1100, height: 700 }, offline: true });
const page = await context.newPage();
const errors = [], network = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
context.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
async function ready(section) {
  await page.waitForFunction(section => window.iglooStudy?.state.section === section, section, { timeout: 120000 });
  assert.equal(await page.locator('#load-error').isVisible(), false);
}
async function clickUI(name) {
  const point = await page.evaluate(name => {
    const scene = iglooStudy.controller.uiScene;
    const mesh = scene.getObjectByName(name);
    mesh.geometry.computeBoundingBox();
    const p = mesh.geometry.boundingBox.getCenter(mesh.position.clone()).applyMatrix4(mesh.matrixWorld).project(scene.camera);
    return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
  }, name);
  await page.mouse.click(point.x, point.y);
}
try {
  await page.goto(pathToFileURL(file).href);
  await ready('home');
  assert.ok(await page.evaluate(() => iglooStudy.engine.renderer.info.render.calls > 0));
  console.log('✓ Standalone HTML renders the ice scene with the browser offline');
  const muted = await page.evaluate(() => iglooStudy.controller.audioController._controller.muted);
  await clickUI('sound');
  await page.waitForFunction(value => iglooStudy.controller.audioController._controller.muted !== value, muted);
  await clickUI('sound');
  await page.waitForFunction(value => iglooStudy.controller.audioController._controller.muted === value, muted);
  console.log('✓ Embedded audio and sound controls work');
  await page.evaluate(() => iglooStudy.goToScene(1));
  await page.waitForFunction(() => Math.abs(iglooStudy.state.scroll - 2.35) < 0.02, null, { timeout: 45000 });
  await page.evaluate(() => iglooStudy.openProject(0));
  await ready('project');
  assert.match(page.url(), /#\/portfolio\/pudgy-penguins$/);
  await page.reload();
  await ready('project');
  assert.equal(await page.evaluate(() => iglooStudy.state.detailOpen), true);
  await clickUI('close');
  await ready('home');
  console.log('✓ File-compatible project links, refresh and close controls work');
  await page.evaluate(() => iglooStudy.goToScene(2));
  await page.waitForFunction(() => iglooStudy.state.scenes[2].visible && iglooStudy.state.scenes[2].progress > 0.7, null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => iglooStudy.controller.scrollComposers[2].passes[0].scene.containerparticles.currentLink === 1);
  await page.waitForTimeout(1000);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => iglooStudy.controller.scrollComposers[2].passes[0].scene.containerparticles.currentLink === 0);
  console.log('✓ Embedded particle shapes switch using keyboard controls');
  assert.deepEqual(network, [], 'No HTTP requests required');
  assert.deepEqual(errors, [], 'No browser errors');
  console.log('✓ Single-file export passes offline checks without a local server');
} finally { await browser.close(); }
