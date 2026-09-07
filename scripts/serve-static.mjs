// Small local server for the exported build. Requires Node.js 18 or newer.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(process.argv.slice(2).find(arg => !arg.startsWith('--')) || '.');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.ktx2': 'image/ktx2' };
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = resolve(root, `.${path}`);
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    let info;
    try {
      info = await stat(file);
      if (info.isDirectory()) { file = resolve(file, 'index.html'); info = await stat(file); }
    } catch {
      if (extname(path)) { response.writeHead(404).end('Not found'); return; }
      file = resolve(root, 'index.html');
      info = await stat(file);
    }
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Content-Length': info.size });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch { response.writeHead(400).end('Unable to serve this path'); }
});
let port = 5177;
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && port < 5197) server.listen(++port, '127.0.0.1');
  else { console.error(error.message); process.exitCode = 1; }
});
server.on('listening', () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`Website: ${url}\nKeep this window open. Press Ctrl+C to stop.`);
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const child = spawn('cmd.exe', ['/c', 'start', '', url], { stdio: 'ignore', windowsHide: true });
    child.on('error', () => console.log(`Open ${url} in your browser.`));
    child.unref();
  }
});
server.listen(port, '127.0.0.1');
