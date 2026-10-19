#!/usr/bin/env python3
"""Render the original and the two fixed SVG samples in Chromium to ONE comparison PNG.
No app UI, game tests or benchmark. Uses already-installed Playwright/Chromium.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import html
import json
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    report = json.loads((HERE / 'results.json').read_text())
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(REPO)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}/'
    samples = [dict(file=report['source'], label='승인 원본 PNG', details='1774 × 887 · 원본 투명도')]
    for row in report['candidates']:
        samples.append(dict(file=str((HERE / row['file']).relative_to(REPO)),
                            label=f"{row['palette_limit']}색 SVG",
                            details=f"{row['path_count']:,} paths · raw {row['raw_bytes']:,} B · gzip {row['gzip9_bytes']:,} B"))
    cells = []
    for sample in samples:
        url = html.escape(base + sample['file'])
        cells.append(f'''<section><h2>{sample['label']}</h2><p>{sample['details']}</p>
        <div class="full"><img src="{url}" alt=""></div>
        <h3>동일 원본 좌표 확대 · 1:1 · x270 / y380</h3>
        <div class="crop"><img src="{url}" alt=""></div></section>''')
    document = '''<!doctype html><html lang="ko"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;padding:20px;background:#262d29;color:#ecebdf;font:14px system-ui,sans-serif}
    h1{font-size:19px;font-weight:500;margin:0 0 16px}main{display:grid;grid-template-columns:repeat(3,887px);gap:18px}
    h2{font-size:17px;font-weight:500;margin:0 0 5px}p{font-size:12px;color:#c1c5b8;margin:0 0 10px}
    .full,.crop{position:relative;width:887px;overflow:hidden;background:#7a8173}.full{height:443.5px}
    .full img{display:block;width:887px;height:443.5px}.crop{height:250px}
    .crop img{position:absolute;width:1774px;height:887px;max-width:none;left:-270px;top:-380px}
    h3{font-size:12px;font-weight:400;margin:13px 0 7px;color:#c1c5b8}footer{font-size:12px;color:#c1c5b8;margin-top:14px}
    </style><h1>승인 balanced 원화 → 24 / 48색 벡터 표본 · 전체는 모두 0.5배</h1><main>''' + ''.join(cells) + '''</main>
    <footer>vtracer 0.6.15 · 동일 spline / speckle 설정 · raster reference 0 · 두 결과 모두 용량·복잡도 부적합 · 맵에 통합하지 않음</footer></html>'''
    errors = []
    failed = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
            page = browser.new_page(viewport={'width':2737,'height':880}, device_scale_factor=1)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: failed.append({'url':response.url,'status':response.status}) if response.status >= 400 else None)
            page.set_content(document, wait_until='networkidle')
            page.locator('img').evaluate_all('(images)=>Promise.all(images.map(image=>image.decode()))')
            page.screenshot(path=str(HERE / 'comparison.png'))
            report['browser_render'] = dict(browser='Chromium ' + browser.version,
                                           image='comparison.png', size=[2737,880],
                                           full_scale=0.5, crop_scale=1,
                                           crop_source_bounds=[270,380,887,250],
                                           page_errors=errors, http_errors=failed)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (HERE / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report['browser_render'], ensure_ascii=False))

if __name__ == '__main__':
    main()
