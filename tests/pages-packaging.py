"""Audit output from the official Pages/Jekyll image; never builds or edits game assets."""
import argparse
import hashlib
import io
import json
import re
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIAGNOSTICS = ('game/docs/stage-review/', 'game/docs/art-review/', 'review/')
EXCLUDED = DIAGNOSTICS + ('art/', 'tests/', 'game/tests/')
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


class ResourceURLs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if not value or '${' in value:
                continue  # Runtime-generated URLs are checked by browser requests.
            if key in ('src', 'href', 'poster'):
                self.urls.append(value)
            elif key == 'srcset' and not value.startswith('data:'):
                self.urls.extend(part.strip().split()[0] for part in value.split(',') if part.strip())


def public_dependency_closure(site):
    """Resolve resource URLs/imports, not provenance strings or prose mentioning art/."""
    base = 'https://packaging.invalid/honro/'
    seen, pending = set(), list(PUBLIC)
    def enqueue(owner, value):
        if not value or '${' in value or value.startswith(('#', 'data:', 'blob:')):
            return
        url = urlsplit(urljoin(base + owner, value))
        if url.netloc != 'packaging.invalid':
            return
        assert url.path.startswith('/honro/'), (owner, 'escapes site root', value)
        name = unquote(url.path.removeprefix('/honro/'))
        assert not name.startswith(EXCLUDED), (owner, 'excluded resource URL', value)
        assert (site / name).is_file(), (owner, 'missing resource URL', value)
        if name not in seen:
            pending.append(name)
    while pending:
        name = pending.pop()
        if name in seen:
            continue
        seen.add(name)
        path = site / name
        assert path.is_file(), name
        if path.suffix not in ('.html', '.js', '.mjs', '.css'):
            continue
        text = path.read_text()
        if path.suffix == '.html':
            parser = ResourceURLs()
            parser.feed(text)
            for value in parser.urls:
                enqueue(name, value)
        # Literal fetch/import/URL inputs; dynamic graph and image URLs are checked below/in browser.
        patterns = [r"(?:fetch|import)\s*\(\s*['\"]([^'\"]+)['\"]",
                    r"(?:\.src|\.href)\s*=\s*['\"]([^'\"]+)['\"](?!\s*\+)",
                    r"\bfrom\s*['\"]([^'\"]+)['\"]",
                    r"url\(\s*['\"]?([^)'\"\s]+)"]
        for pattern in patterns:
            for value in re.findall(pattern, text):
                if value.startswith(('.', '/', 'http')) or re.search(r'\.(?:svg|png|webp|jpg|jpeg|mp3)(?:[?#]|$)', value):
                    enqueue(name, value)
    manifest = json.loads((site / 'web/manifest.json').read_text())
    graphs = [manifest['files'], manifest['previousFiles']] + [g['files'] for g in manifest['publishedGenerations']]
    for graph in graphs:
        for item in graph:
            name = item['path']
            assert not name.startswith(EXCLUDED), ('excluded graph dependency', name)
            assert (site / name).is_file() and digest(site / name) == item['sha256'], name
    campaign = json.loads((site / manifest['project']).read_text())
    catalog = campaign['catalog']
    ids = [stage['id'] for stage in catalog]
    stage_numbers = [stage['metadata']['stageId'] for stage in catalog]
    assert len(ids) == len(set(ids)) == 40 and sorted(stage_numbers) == list(range(1, 41)), ids
    return {'staticDependencyFiles': len(seen), 'catalogIds': ids,
            'preexistingTemplateOnlyEntrypoints': [name for name in PUBLIC if name.endswith('/lab.html')]}


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

    closure = public_dependency_closure(site)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(site)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}/honro/'
    errors, bad_responses, rows, excluded_requests, failed_requests = [], [], [], [], []
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
                page.on('request', lambda request: excluded_requests.append(request.url) if unquote(urlsplit(request.url).path).removeprefix('/honro/').startswith(EXCLUDED) else None)
                page.on('requestfailed', lambda request: failed_requests.append({'url': request.url, 'failure': request.failure}))
                page.goto(base + name)
                page.wait_for_function(ready, timeout=60000)
                row = {'entry': name, 'ready': True}
                if name == 'HONRO.html':
                    page.set_viewport_size({'width': 390, 'height': 844})
                    row['mobileTitleVisible'] = page.locator('.honro-title').is_visible()
                    assert row['mobileTitleVisible']
                else:
                    row['stages'] = page.evaluate('HonroWorkshopAPI.getProject().stages.length')
                    ids = page.evaluate('HonroWorkshopAPI.getProject().stages.map(stage => stage.id)')
                    assert sorted(ids) == sorted(closure['catalogIds']), ids
                    assert row['stages'] == len(closure['catalogIds'])
                rows.append(row)
                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)
    assert not errors and not bad_responses and not excluded_requests and not failed_requests, (errors, bad_responses, excluded_requests, failed_requests)
    return {'pages': rows, 'httpEntrypoints': len(PUBLIC), 'pageErrors': errors, 'badResponses': bad_responses, 'excludedRequests': excluded_requests, 'failedRequests': failed_requests, 'functionalEntrypointsChecked': 2}


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
        assert not any(prefix in text for prefix in DIAGNOSTICS), (name, 'public entry references excluded diagnostics')
    bgm = sorted(name for name in before if name.startswith('assets/bgm/') and name.endswith('.mp3'))
    assert len(bgm) == 7 and all(name in after and digest(before[name]) == digest(after[name]) for name in bgm)
    # The BGM review's existing .md URL must remain a byte-identical static file.
    name = 'game/docs/BGM_TITLE_REVIEW.md'
    assert name in after and digest(before[name]) == digest(after[name])
    closure = public_dependency_closure(site)
    byte_total = sum(path.stat().st_size for path in after.values())
    assert byte_total < LIMIT, byte_total
    report = {
        'status': 'passed', 'sourceSha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'configSha256': digest(source / '_config.yml'), 'outputFiles': len(after), 'outputBytes': byte_total,
        'unchangedFiles': len(expected) - len(missing), 'protectedImmutableFiles': len(protected),
        'lastSuccessfulGraphSha': latest['sourceSha'], 'lastSuccessfulGraphFiles': len(latest['files']),
        'publicEntrypoints': list(PUBLIC), 'bgmFiles': bgm, 'excludedPrefixes': list(EXCLUDED),
        'metadataNotPublished': sorted(METADATA), 'historicalMarkdownConvertedToHtml': sorted(HISTORICAL_MARKDOWN),
        'unexpectedChanges': changed, 'dependencyClosure': closure, **archive_sizes(site),
    }
    if args.browser:
        report['browser'] = browser_smoke(site)
    target = ROOT / '_local/reports/pages-packaging/audit.json'
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
