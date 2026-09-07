// Repeatable adaptations of the pinned public production build, not authoring source.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('reference/igloo-assets.json', root), 'utf8'));

async function patch(path, transform) {
  const url = new URL(`public/${path}`, root);
  const original = await readFile(url, 'utf8');
  if (original.includes('/* IGLOO_LOCAL_STUDY */')) {
    console.log(`${path}: already adapted`);
    return;
  }
  const expected = manifest.assets.find(asset => asset.path === path).sha256;
  const actual = createHash('sha256').update(original).digest('hex');
  if (actual !== expected) throw new Error(`Unexpected production build: ${path}`);
  await writeFile(url, `/* IGLOO_LOCAL_STUDY */\n${transform(original)}`);
  console.log(`${path}: adapted for local study`);
}

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Patch anchor changed: ${before}`);
  return source.replace(before, after);
}

await patch('assets/index-2eb69c09.js', source => source.replaceAll('https://www.igloo.inc/', '/'));
await patch('assets/App3D-f554a111.js', source => {
  source = replaceOnce(source, ';class u3{', ';if(globalThis.IGLOO_CONTENT)Object.assign(Be,globalThis.IGLOO_CONTENT);class u3{');
  // A zero derivative gives equal smoothstep edges (undefined in GLSL),
  // producing solid rectangles on SwiftShader. Keep the MSDF interval nonzero.
  source = replaceOnce(source, 'float d=fwidth(signedDist);', 'float d=max(0.00001,fwidth(signedDist));');
  return replaceOnce(source, 'const f=new jF;await f.ready,f.start(),s(()=>!0)',
    'const f=new jF;await f.ready,globalThis.__onIglooReady?.({controller:f,engine:he,events:Q,config:Be}),f.start(),s(()=>!0)');
});
