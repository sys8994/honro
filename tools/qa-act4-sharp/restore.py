"""Restore and verify fixed lossless candidates for local QA; never publish output."""
import base64, hashlib, json, lzma, subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[2]
source = 'e0e3428e18c6c4d820a41cb9cf0794df55a7e997'
def read(path):
    return subprocess.check_output(['git', 'show', f'{source}:art/act4-sharp-candidates/{path}'], cwd=root)
out = root / '_local/reports/act4-sharp-browser-inputs'
out.mkdir(parents=True, exist_ok=True)
for n in (31,33,34,35,36,37,38):
    meta = json.loads(read(f'stage{n}.manifest.json'))
    encoded = read(f'stage{n}.candidate.json.xz.b64').strip()
    assert len(encoded) == meta['base64Chars']
    compressed = base64.b64decode(encoded, validate=True)
    assert len(compressed) == meta['xzBytes'] and hashlib.sha256(compressed).hexdigest() == meta['xzSha256']
    raw = lzma.decompress(compressed)
    assert len(raw) == meta['rawBytes'] and hashlib.sha256(raw).hexdigest() == meta['rawSha256']
    (out / f'stage{n}.json').write_bytes(raw)
    print(n, len(raw), meta['rawSha256'])
