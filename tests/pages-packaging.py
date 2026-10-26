"""Audit output from the official Pages/Jekyll image; never builds or edits game assets."""
import argparse
import hashlib
import io
import json
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = ('game/docs/stage-review/', 'game/docs/art-review/', 'review/')
# Jekyll's built-in metadata filtering, not additional deployment exclusions.
METADATA = {'.gitattributes', '.gitignore', '_config.yml', '.agents/skills/honro-environment/SKILL.md'}
# Existing proposal documents with real YAML frontmatter are rendered as HTML.
# They are not runtime inputs or dependencies of the public game/catalog/demos.
HISTORICAL_MARKDOWN = {'game/docs/ACT3_MAP_OPTIONS.md', 'game/docs/ACT3_MAP_OPTIONS_V01.md'}
PUBLIC = (
    'index.html', 'HONRO.html', 'HONRO_WORKSHOP.html', 'workshop/HONRO_MAP_WORKSHOP.html',
    'tools/character-catalog.html', 'tools/bgm-title-review.html',
    'tools/party-forge/lab.html', 'tools/monster-forge/lab.html', 'tools/actor-forge/lab.html',
    'demos/environment-motion/index.html', 'previews/camp-ux/index.html',
    'game/art-studies/stage1-hybrid-vector-v1/index.html',
    'game/art-studies/stage1-hybrid-vector-v1/catalog.html',
)
LIMIT = 1_000_000_000


def digest(path):
    with path.open('rb') as handle:
        result = hashlib.sha256()
        while block := handle.read(1024 * 1024):
            result.update(block)
        return result.hexdigest()


def inventory(root):
    return {str(path.relative_to(root)): path for path in root.rglob('*') if path.is_file()}


class CountBytes(io.RawIOBase):
    """Count an actual ZIP stream without writing a second large archive."""
    def __init__(self):
        self.bytes = 0
    def writable(self):
        return True
    def seekable(self):
        return False
    def tell(self):
        return self.bytes
    def write(self, data):
        self.bytes += len(data)
        return len(data)


def archive_sizes(site):
    # Same TAR-of-site + level-6 ZIP structure observed in upload-pages-artifact.
    process = subprocess.Popen(['tar', '--dereference', '--hard-dereference', '-C', str(site), '-cf', '-', '.'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    sink = CountBytes()
    tar_bytes = 0
    with zipfile.ZipFile(sink, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        with archive.open('artifact.tar', 'w', force_zip64=True) as entry:
            while block := process.stdout.read(1024 * 1024):
                tar_bytes += len(block)
                entry.write(block)
    error = process.stderr.read().decode()
    assert process.wait() == 0, error
    assert tar_bytes < LIMIT and sink.bytes < LIMIT, (tar_bytes, sink.bytes)
    return {'tarBytes': tar_bytes, 'zipBytes': sink.bytes, 'limitBytes': LIMIT}


def browser_smoke(site):
    from functools import partial
    from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
    from threading import Thread
    from urllib.request import Request, urlopen
    from playwright.sync_api import sync_playwright
    from browser_support import launch

    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass
        def translate_path(self, path):
            return super().translate_path(path.removeprefix('/honro'))

    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(site)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}/honro/'
    errors, bad_responses, rows = [], [], []
    try:
        for name in PUBLIC:
            with urlopen(Request(base + name, method='HEAD')) as response:
                assert response.status == 200, name
        with sync_playwright() as playwright:
            browser = launch(playwright)
            for name, ready in [('HONRO.html', 'window.HonroApp'), ('HONRO_WORKSHOP.html', 'window.HonroWorkshopAPI')]:
                page = browser.new_page(viewport={'width': 1440, 'height': 960})
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.on('response', lambda response: bad_responses.append({'url': response.url, 'status': response.status}) if response.status >= 400 and not response.url.endswith('/favicon.ico') else None)
                page.goto(base + name)
                page.wait_for_function(ready, timeout=60000)
                row = {'entry': name, 'ready': True}
                if name == 'HONRO.html':
                    page.set_viewport_size({'width': 390, 'height': 844})
                    row['mobileTitleVisible'] = page.locator('.honro-title').is_visible()
                    assert row['mobileTitleVisible']
                else:
                    row['stages'] = page.evaluate('HonroWorkshopAPI.getProject().stages.length')
                    assert row['stages'] == 30
                rows.append(row)
                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
    assert not errors and not bad_responses, (errors, bad_responses)
    return {'pages': rows, 'httpEntrypoints': len(PUBLIC), 'pageErrors': errors, 'badResponses': bad_responses}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / '_local/reports/pages-packaging/source')
    parser.add_argument('--site', type=Path, default=ROOT / '_local/reports/pages-packaging/output')
    parser.add_argument('--browser', action='store_true', help='Load packaged game and Workshop in real local Chromium')
    args = parser.parse_args()
    source, site = args.source.resolve(), args.site.resolve()
    assert source.is_dir() and site.is_dir(), 'Run the documented official Pages build first'
    assert not (source / '.nojekyll').exists(), 'Jekyll exclusions require removal of the bypass marker'
    assert (source / '_config.yml').read_bytes() == (ROOT / '_config.yml').read_bytes(), 'Build used a different configuration'
    before, after = inventory(source), inventory(site)
    expected = {name: path for name, path in before.items() if not name.startswith(EXCLUDED)}
    missing = set(expected) - set(after)
    assert missing == METADATA | HISTORICAL_MARKDOWN, sorted(missing)
    changed = [name for name in expected if name in after and digest(expected[name]) != digest(after[name])]
    assert not changed, changed
    expected_html = {str(Path(name).with_suffix('.html')) for name in HISTORICAL_MARKDOWN}
    assert set(after) - set(before) == expected_html, sorted(set(after) - set(before))
    assert not [name for name in after if name.startswith(EXCLUDED)], 'Excluded diagnostics leaked into site'
    assert any(name.startswith('game/docs/art-reviews/') for name in after), 'Do not also exclude the plural sibling'
    manifest = json.loads((source / 'web/manifest.json').read_text())
    graphs = [manifest['files'], manifest['previousFiles']] + [item['files'] for item in manifest['publishedGenerations']]
    protected = {item['path']: item for graph in graphs for item in graph}
    for name, item in protected.items():
        assert name in after, name
        assert after[name].stat().st_size == item['bytes'] and digest(after[name]) == item['sha256'], name
    latest = manifest['publishedGenerations'][0]
    assert all(item['path'] in protected for item in latest['files'])
    for name in PUBLIC:
        assert name in after and digest(before[name]) == digest(after[name]), name
        text = before[name].read_text()
        assert not any(prefix in text for prefix in EXCLUDED), (name, 'public entry references excluded diagnostics')
    bgm = sorted(name for name in before if name.startswith('assets/bgm/') and name.endswith('.mp3'))
    assert len(bgm) == 7 and all(name in after and digest(before[name]) == digest(after[name]) for name in bgm)
    # The BGM review's existing .md URL must remain a byte-identical static file.
    name = 'game/docs/BGM_TITLE_REVIEW.md'
    assert name in after and digest(before[name]) == digest(after[name])
    byte_total = sum(path.stat().st_size for path in after.values())
    assert byte_total < LIMIT, byte_total
    report = {
        'status': 'passed', 'sourceSha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'configSha256': digest(source / '_config.yml'), 'outputFiles': len(after), 'outputBytes': byte_total,
        'unchangedFiles': len(expected) - len(missing), 'protectedImmutableFiles': len(protected),
        'lastSuccessfulGraphSha': latest['sourceSha'], 'lastSuccessfulGraphFiles': len(latest['files']),
        'publicEntrypoints': list(PUBLIC), 'bgmFiles': bgm, 'excludedPrefixes': list(EXCLUDED),
        'metadataNotPublished': sorted(METADATA), 'historicalMarkdownConvertedToHtml': sorted(HISTORICAL_MARKDOWN),
        'unexpectedChanges': changed, **archive_sizes(site),
    }
    if args.browser:
        report['browser'] = browser_smoke(site)
    target = ROOT / '_local/reports/pages-packaging/audit.json'
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
