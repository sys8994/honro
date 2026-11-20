import json,subprocess
from pathlib import Path
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
p=Path('tools/combined-stage7-smoke')
m=json.loads((p/'manifest.json').read_text())
prior='66b0697bad38100f46bae6d8e1e8ca1b8e35ae9b'
target='shared/runtime/terrain-readability.js'
assert git('rev-parse','HEAD^')==m['source'] and git('rev-parse','HEAD^^')==prior
assert git('diff','--name-only',prior,m['source'])==target
assert set(git('diff','--name-only',m['base'],m['source']).splitlines())=={f['path'] for f in m['files']}
for f in m['files']:assert git('rev-parse',m['source']+':'+f['path'])==f['sha'],f
assert set(git('diff','--name-only',m['source'],'HEAD').splitlines())=={'.github/workflows/combined-stage7-smoke.yml',*(str(p/n) for n in ('capture.py','compare.py','stage41.py','stage3.py','verify.py','guard.py','manifest.json'))}
print(git('diff',prior,m['source']))
