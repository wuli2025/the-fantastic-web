"""Download the pinned public Igloo build used by the local study.

Run only when refreshing the reference assets; normal dev/build is fully local.
Requires Python 3 and curl. Original asset rights remain with their owners.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'reference/igloo-assets.json'


def download(asset):
    url = urlparse(asset['url'])
    path = Path(asset['path'])
    if url.scheme != 'https' or url.netloc != 'www.igloo.inc' or path.is_absolute() or '..' in path.parts or path.parts[0] != 'assets':
        raise ValueError(f'Unexpected asset path: {asset}')
    dest = ROOT / 'public' / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    temp = dest.with_name(dest.name + '.download')
    subprocess.run([
        'curl', '-fsSL', '--retry', '3', '--max-time', '120',
        '-A', 'Mozilla/5.0', '-e', 'https://www.igloo.inc/',
        asset['url'], '-o', str(temp),
    ], check=True, capture_output=True)
    content = temp.read_bytes()
    digest = hashlib.sha256(content).hexdigest()
    if asset.get('sha256') and asset['sha256'] != digest:
        temp.unlink()
        raise ValueError(f'Upstream asset changed: {path}; inspect before updating the manifest')
    temp.replace(dest)
    return {**asset, 'bytes': len(content), 'sha256': digest}


if __name__ == '__main__':
    manifest = json.loads(MANIFEST.read_text())
    downloaded = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(download, asset): asset for asset in manifest['assets']}
        for future in concurrent.futures.as_completed(futures):
            downloaded.append(future.result())
            if len(downloaded) % 10 == 0:
                print(f"Downloaded {len(downloaded)}/{len(futures)} assets", flush=True)
    manifest['assets'] = sorted(downloaded, key=lambda asset: asset['path'])
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    size = sum(asset['bytes'] for asset in downloaded) / 1024 / 1024
    print(f'Downloaded and verified {len(downloaded)} assets ({size:.1f} MiB).')
