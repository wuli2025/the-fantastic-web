// Runs inside the exported HTML. Every scene asset is embedded in that file.
(() => {
  const payload = document.getElementById('igloo-embedded-assets');
  const files = JSON.parse(payload.textContent);
  const urls = Object.create(null);
  const decoder = new TextDecoder();
  const bytes = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const text = path => decoder.decode(bytes(files[path].data));
  const blob = (content, type) => URL.createObjectURL(new Blob([content], { type }));

  function installFetch(assetURLs) {
    const original = globalThis.fetch.bind(globalThis);
    const resolve = value => {
      try {
        const url = new URL(typeof value === 'string' ? value : value.url || String(value), 'https://igloo.local/');
        if (url.protocol === 'blob:' || url.protocol === 'data:') return null;
        return assetURLs[decodeURI(url.pathname)] || null;
      } catch { return null; }
    };
    globalThis.fetch = (input, init) => original(resolve(input) || input, init);
    return resolve;
  }

  for (const [path, file] of Object.entries(files)) {
    if (!path.endsWith('.js')) urls[path] = blob(bytes(file.data), file.type);
  }
  // Workers have their own global scope. Install the same embedded-asset lookup.
  for (const [path, file] of Object.entries(files)) {
    if (path.endsWith('.js') && !path.endsWith('/index-2eb69c09.js') && !path.endsWith('/App3D-f554a111.js')) {
      // file:// workers have opaque origins and cannot fetch the page's Blob URLs.
      // Give image/EXR workers only their required assets as data URLs instead.
      const workerAssets = {};
      for (const [assetPath, asset] of Object.entries(files)) {
        if ((path.includes('bitmapworker-') && /\.(png|jpe?g)$/.test(assetPath)) ||
            (path.includes('exrworker-') && assetPath.endsWith('.exr'))) {
          workerAssets[assetPath] = `data:${asset.type};base64,${asset.data}`;
        }
      }
      const prefix = /\/[^/]*worker-[^/]+\.js$/.test(path) ? `(${installFetch.toString()})(${JSON.stringify(workerAssets)});\n` : '';
      urls[path] = blob(prefix + text(path), 'text/javascript');
    }
  }
  const resolveAsset = installFetch(urls);
  const NativeWorker = window.Worker;
  window.Worker = class extends NativeWorker {
    constructor(url, options) { super(resolveAsset(url) || url, options); }
  };

  let loader = text('/assets/index-2eb69c09.js');
  loader = loader.replace('import("./App3D-f554a111.js")', 'import("igloo:scene")');
  for (const [path, url] of Object.entries(urls)) {
    if (/\.woff2?$/.test(path)) loader = loader.replaceAll(path, url);
  }
  urls['/assets/index-2eb69c09.js'] = blob(loader, 'text/javascript');
  urls['/assets/App3D-f554a111.js'] = blob(text('/assets/App3D-f554a111.js'), 'text/javascript');
  const imports = document.createElement('script');
  imports.type = 'importmap';
  imports.textContent = JSON.stringify({ imports: {
    'igloo:runtime': urls['/assets/index-2eb69c09.js'],
    'igloo:scene': urls['/assets/App3D-f554a111.js'],
  } });
  document.head.append(imports);
  window.__IGLOO_EMBEDDED_URLS = urls;
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.href = urls['/assets/favicon32-af94112f.png'];
  document.head.append(icon);
  payload.remove();
})();
