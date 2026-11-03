"""Read-only candidate browser measurements. No production approval, build or deploy."""
import argparse, functools, hashlib, http.server, json, os, re, subprocess, threading
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'shared/assets/monsters/a2'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def validate_sources():
    rows = []
    for manifest_name in ['manifest.candidate.json', 'manifest.alternates.json']:
        file = ASSETS / manifest_name
        if not file.exists():
            if manifest_name == 'manifest.candidate.json':
                raise RuntimeError('Required candidate manifest missing')
            continue
        manifest = json.loads(file.read_text())
        for row in manifest['assets']:
            if not re.fullmatch(r'(?:alternates/)?[\w-]+\.svg', row['file']):
                raise RuntimeError('Unexpected asset filename')
            data = (ASSETS / row['file']).read_bytes()
            if sha(data) != row['sha256'] or len(data) != row['bytes']:
                raise RuntimeError('Source hash/size mismatch: ' + row['id'])
            tree = ET.fromstring(data)
            anchors = controls = subpaths = paths = 0
            for node in tree.iter():
                tag = node.tag.rsplit('}', 1)[-1]
                if tag not in ['svg', 'path'] or any(k in node.attrib for k in ['transform', 'clip-path']):
                    raise RuntimeError('Unsupported SVG structure')
                if tag != 'path':
                    continue
                paths += 1
                d = node.get('d', '')
                if not d or re.search(r'[^MLCQZ\d.,\s+\-]', d):
                    raise RuntimeError('Unsupported path commands')
                if not re.fullmatch(r'#[\da-fA-F]{6}', node.get('fill', '')):
                    raise RuntimeError('Unsupported fill')
                for cmd, args in re.findall(r'([MLCQZ])([^MLCQZ]*)', d):
                    n = len(re.findall(r'[-+]?(?:\d*\.)?\d+', args))
                    if cmd in ['M', 'L']:
                        anchors += n // 2
                        subpaths += int(cmd == 'M')
                    elif cmd == 'Q':
                        anchors += n // 4
                        controls += n // 4
                    elif cmd == 'C':
                        anchors += n // 6
                        controls += n // 3
            if anchors != row['anchors'] or paths != row['paths']:
                raise RuntimeError('Statistics mismatch: ' + row['id'])
            rows.append(dict(id=row['id'], file=row['file'], sha256=sha(data), bytes=len(data),
                             anchors=anchors, controls=controls, subpaths=subpaths, paths=paths,
                             overExisting350AnchorGate=anchors > 350))
    if len(rows) < 16 or len({r['id'] for r in rows}) != len(rows):
        raise RuntimeError('Expected at least 16 unique retained candidate frames')
    return rows

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--cpu-rates', nargs='+', type=int, default=[1])
    p.add_argument('--out', default='_local/reports/a2-art-candidates')
    p.add_argument('--validate-only', action='store_true')
    args = p.parse_args()
    rows = validate_sources()
    if args.validate_only:
        print(json.dumps({'validatedSources': len(rows), 'productionApproval': False, 'rows': rows}, indent=2))
        return
    if any(rate not in [1, 4] for rate in args.cpu_rates):
        raise RuntimeError('Only explicitly labeled 1x and 4x CPU comparison supported')
    out = (ROOT / args.out).resolve()
    if ROOT not in out.parents:
        raise RuntimeError('Report directory must stay in this checkout')
    out.mkdir(parents=True, exist_ok=True)
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    expected = os.getenv('GITHUB_SHA')
    if expected and expected != commit:
        raise RuntimeError('Runner checkout is not the requested exact source commit')
    source_files = ['shared/runtime/monster-vector.js', 'shared/assets/monsters/monsters.runtime.js',
                    'tools/a2-art-qa/qa.js', 'shared/assets/monsters/a2/manifest.candidate.json']
    provenance = {'sourceCommit': commit, 'productionApproval': False,
                  'sourceFiles': {n: sha((ROOT / n).read_bytes()) for n in source_files}, 'assets': rows}
    (out / 'source-provenance.json').write_text(json.dumps(provenance, indent=2))
    from playwright.sync_api import sync_playwright
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=['--enable-precise-memory-info'])
            try:
                for rate in args.cpu_rates:
                    context = browser.new_context(viewport={'width': 1320, 'height': 960}, device_scale_factor=1)
                    page = context.new_page()
                    errors = []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    session = context.new_cdp_session(page)
                    session.send('Emulation.setCPUThrottlingRate', {'rate': rate})
                    page.goto(f'http://127.0.0.1:{server.server_port}/tools/a2-art-qa/', wait_until='networkidle')
                    page.wait_for_function("['ready','failed'].includes(document.documentElement.dataset.qaState)", timeout=60000)
                    if page.get_attribute('html', 'data-qa-state') != 'ready':
                        raise RuntimeError(page.locator('#status').inner_text())
                    page.get_by_role('button', name='Run comparisons', exact=True).click()
                    page.wait_for_function("['complete','failed'].includes(document.documentElement.dataset.qaState)", timeout=240000)
                    page.locator('#proof').screenshot(path=str(out / f'poses-cpu-{rate}x.png'))
                    if page.get_attribute('html', 'data-qa-state') != 'complete' or errors:
                        (out / f'errors-cpu-{rate}x.json').write_text(json.dumps(errors, indent=2))
                        raise RuntimeError(page.locator('#status').inner_text())
                    result = json.loads(page.locator('#result').inner_text())
                    result.update(sourceCommit=commit, syntheticCpuThrottleRate=rate,
                                  throttleLabel='unthrottled CI desktop' if rate == 1 else 'synthetic 4x CPU slowdown — NOT mobile hardware/GPU',
                                  browserVersion=browser.version)
                    (out / f'measurements-cpu-{rate}x.json').write_text(json.dumps(result, indent=2))
                    context.close()
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
    summary = {'sourceCommit': commit, 'rates': args.cpu_rates, 'candidateFrames': len(rows),
               'productionApproval': False, 'result': 'Measurements collected; explicit budget/art/runtime review remains required.'}
    (out / 'summary.json').write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary))

if __name__ == '__main__':
    main()
