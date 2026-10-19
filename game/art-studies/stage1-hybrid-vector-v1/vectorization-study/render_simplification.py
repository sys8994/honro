#!/usr/bin/env python3
"""One Chromium PNG comparing the preserved 48-color source to its one-pass simplification."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    report = json.loads((HERE / 'simplification-results.json').read_text())
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(REPO)))
    Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
    cells = []
    for label, file, key in [('기존 48색 SVG', 'balanced-48.svg', 'before'), ('48색 · 기하 단순화 1회', 'balanced-48-simplified.svg', 'after')]:
        row = report[key]
        url = base + str((HERE / file).relative_to(REPO))
        cells.append(f'''<section><h2>{label}</h2><p>raw {row['raw_bytes']:,} B · gzip {row['gzip9_bytes']:,} B · {row['path_count']:,} paths · {row['curve_count']:,} curves</p>
        <div class="full"><img src="{url}" alt=""></div><h3>동일 원본 좌표 · 1:1 · x270 / y380</h3>
        <div class="crop"><img src="{url}" alt=""></div></section>''')
    document = '''<!doctype html><html lang="ko"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:20px;background:#262d29;color:#ecebdf;font:14px system-ui,sans-serif}
    h1{font-size:19px;font-weight:500;margin:0 0 16px}main{display:grid;grid-template-columns:repeat(2,887px);gap:18px}
    h2{font-size:17px;font-weight:500;margin:0 0 5px}p{font-size:12px;color:#c1c5b8;margin:0 0 10px}
    .full,.crop{position:relative;width:887px;overflow:hidden;background:#7a8173}.full{height:443.5px}
    .full img{display:block;width:887px;height:443.5px}.crop{height:250px}
    .crop img{position:absolute;width:1774px;height:887px;max-width:none;left:-270px;top:-380px}
    h3{font-size:12px;font-weight:400;margin:13px 0 7px;color:#c1c5b8}footer{font-size:12px;color:#c1c5b8;margin-top:14px}
    </style><h1>48색 벡터 · 동일 배율 비교 · 전체 0.5배</h1><main>''' + ''.join(cells) + '''</main>
    <footer>Bezier chord bound 0.20px + GEOS topology-preserving RDP 1.75px · 단일 설정 · 재트레이싱/색 변경 없음 · 맵 통합 없음</footer></html>'''
    errors = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
            page = browser.new_page(viewport={'width':1832,'height':880}, device_scale_factor=1)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_content(document, wait_until='networkidle')
            page.locator('img').evaluate_all('(images)=>Promise.all(images.map(image=>image.decode()))')
            page.screenshot(path=str(HERE / 'simplification-comparison.png'))
            report['comparison'] = dict(file='simplification-comparison.png', browser='Chromium ' + browser.version,
                                        full_scale=.5, crop_scale=1, crop_source_bounds=[270,380,887,250], page_errors=errors)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (HERE / 'simplification-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report['comparison'], ensure_ascii=False))

if __name__ == '__main__':
    main()
