"""Create source/build ZIPs and a standalone HTML on the selected desktop."""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('desktop', type=Path)
args = parser.parse_args()
desktop = args.desktop.resolve()
if not desktop.is_dir():
    raise SystemExit(f'Desktop not found: {desktop}')
zip_dir = desktop / 'zip'
zip_dir.mkdir(exist_ok=True)


def available(path):
    if not path.exists():
        return path
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    return path.with_name(f'{path.stem}-{stamp}{path.suffix}')


html = available(desktop / 'Igloo网站-可双击打开.html')
subprocess.run(['node', str(ROOT / 'scripts/export-html.mjs'), str(html)], check=True, cwd=ROOT)
source_zip = available(zip_dir / 'Igloo完整项目.zip')
website_zip = available(zip_dir / 'Igloo网页发布版.zip')
excluded = {'node_modules', '.git', 'artifacts', 'dist', '__pycache__', '.next', '.cache'}

with zipfile.ZipFile(source_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for current, dirs, names in os.walk(ROOT):
        dirs[:] = sorted(d for d in dirs if d not in excluded)
        for name in sorted(names):
            if name == '.DS_Store' or name == '.env' or name.startswith('.env.local'):
                continue
            path = Path(current) / name
            relative = path.relative_to(ROOT).as_posix()
            archive.write(path, f'Igloo学习项目/{relative}')
    archive.writestr('Igloo学习项目/打开项目.txt', (
        '此压缩包包含完整项目代码、原站本地资源、独立 FORMA 人物实验和学习资料。\r\n'
        '未包含 node_modules，避免将 Linux 依赖带到 Windows。\r\n'
        '先解压整个文件夹，再安装 Node.js 22.12+，在文件夹内运行：\r\n'
        'npm install\r\nnpm run dev\r\n'
        '浏览器打开终端显示的地址。\r\n'
        '无需安装即可查看：双击桌面上的 Igloo网站-可双击打开.html。\r\n'
        '原站部分是公开生产构建的本地学习复现，不是官方开源工程。详细来源见 reference/README.md。\r\n'
    ).encode('utf-8-sig'))

with zipfile.ZipFile(website_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted((ROOT / 'dist').rglob('*')):
        if path.is_file():
            archive.write(path, f'Igloo网页发布版/{path.relative_to(ROOT / "dist").as_posix()}')
    archive.write(ROOT / 'scripts/serve-static.mjs', 'Igloo网页发布版/serve.mjs')
    archive.write(ROOT / 'reference/README.md', 'Igloo网页发布版/资源来源.md')
    archive.writestr('Igloo网页发布版/启动网站.cmd', (
        '@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\n'
        'where node >nul 2>nul\r\nif errorlevel 1 (\r\n'
        '  echo 请先安装 Node.js 18 或更新版本；也可以直接打开桌面的单文件 HTML。\r\n'
        '  pause\r\n  exit /b 1\r\n)\r\n'
        'node serve.mjs --open\r\npause\r\n'
    ).encode('utf-8'))
    archive.writestr('Igloo网页发布版/使用说明.txt', (
        '请先完整解压，安装 Node.js 18+ 后双击「启动网站.cmd」。\r\n'
        '此版本无需 npm install；运行窗口保持打开即可。\r\n'
        'index.html 依赖同目录 assets 文件夹，请通过本地服务器访问。\r\n'
        '整个文件夹可以交给支持 SPA 回退的静态网站服务器部署。\r\n'
        '桌面另有包含所有资源的单文件 HTML，可独立双击打开。\r\n'
    ).encode('utf-8-sig'))

for path in [source_zip, website_zip]:
    with zipfile.ZipFile(path) as archive:
        bad = archive.testzip()
        if bad:
            raise RuntimeError(f'Corrupt archive member: {bad}')

result = [{'path': str(path), 'bytes': path.stat().st_size} for path in [source_zip, website_zip, html]]
print(json.dumps(result, ensure_ascii=False, indent=2))
