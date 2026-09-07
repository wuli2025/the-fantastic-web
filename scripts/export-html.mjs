// Export the local Igloo study as one HTML with embedded code, workers and assets.
// Does not change the normal website or its history-based routes.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = resolve(process.argv[2] || `${root}/artifacts/Igloo-standalone.html`);
const manifest = JSON.parse(await readFile(`${root}/reference/igloo-assets.json`, 'utf8'));
const types = { js: 'text/javascript', json: 'application/json', wasm: 'application/wasm', png: 'image/png', jpg: 'image/jpeg', woff: 'font/woff', woff2: 'font/woff2', ogg: 'audio/ogg', ktx2: 'image/ktx2' };
const files = {};
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Standalone patch anchor changed: ${before}`);
  return source.replace(before, after);
}
for (const path of [...manifest.assets.map(asset => asset.path), 'study/content.json']) {
  let data = await readFile(`${root}/public/${path}`);
  if (path === 'assets/App3D-f554a111.js') {
    let source = data.toString('utf8');
    source = replaceOnce(source, 'from"./index-2eb69c09.js"', 'from"igloo:runtime"');
    // A valid virtual origin lets existing loaders construct Request objects.
    // All resource requests are then resolved to embedded Blob URLs.
    source = source.replaceAll('window.location.origin', '"https://igloo.local"');
    source = replaceOnce(source, 'history[(o===s||l?"replace":"push")+"State"](o,null,o)', 'history[(o===s||l?"replace":"push")+"State"](o,null,"#"+o)');
    source = replaceOnce(source, 'o=a(o||location.pathname)', 'o=a(o||location.hash.slice(1)||"/")');
    data = Buffer.from(source);
  }
  files[`/${path}`] = { type: types[path.split('.').pop()] || 'application/octet-stream', data: data.toString('base64') };
}
let html = await readFile(`${root}/index.html`, 'utf8');
html = html.replace(/\s*<link rel="icon"[^>]+>/, '');
html = html.replace(/\s*<script type="module" src="\/src\/igloo\/main.js"><\/script>/, '');
html = html.replace('Igloo Inc. — Local Study', 'Igloo Inc. — 单文件学习版');
html = html.replace(/\s*<a href="\/forma.html">.*?<\/a>/, '');
let entry = await readFile(`${root}/src/igloo/main.js`, 'utf8');
entry = replaceOnce(entry, "script.src = '/assets/index-2eb69c09.js';", "script.src = window.__IGLOO_EMBEDDED_URLS['/assets/index-2eb69c09.js'];");
entry = entry.replace('场景加载失败。请检查本地服务器和 public/assets 资源是否完整，然后刷新页面。', '场景加载失败。请使用新版 Chrome 或 Edge 打开此完整 HTML 文件。');
const runtime = await readFile(`${root}/scripts/portable-runtime.js`, 'utf8');
const escapeScript = source => source.replace(/<\/script/gi, '<\\/script');
const embedded = `<script id="igloo-embedded-assets" type="application/json">${JSON.stringify(files)}</script>\n<script>${escapeScript(runtime)}</script>\n<script type="module">${escapeScript(entry)}</script>\n`;
html = html.replace('</body>', `${embedded}</body>`);
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, html);
console.log(`Exported ${Object.keys(files).length} embedded assets: ${destination} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB)`);
