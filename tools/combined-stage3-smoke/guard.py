import json,subprocess,os
from pathlib import Path
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
m=json.loads(Path('tools/combined-stage3-smoke/manifest.json').read_text())
assert git('rev-parse','HEAD^')==m['source']
assert (os.environ.get('INCLUDE_STAGE14')=='1')==m['includeStage14']
files={f['path']:f['sha'] for f in m['files']}
assert set(git('diff','--name-only',m['base'],m['source']).splitlines())==set(files)
for path,sha in files.items():assert git('rev-parse',m['source']+':'+path)==sha,(path,sha)
qa=set(git('diff','--name-only',m['source'],'HEAD').splitlines())
assert qa=={'.github/workflows/combined-stage3-smoke.yml',*['tools/combined-stage3-smoke/'+n for n in ['launch.py','verify.py','guard.py','manifest.json','stage3.py','stage3-verify.py']]},qa
# Committed runtime baseline must still equal pinned stock; baseline needs no rebuild.
assert not git('diff','--name-only',m['base'],m['source'],'--','HONRO.html','web','game/dist')
p=Path('_local/reports/combined-stage3-smoke');p.mkdir(parents=True,exist_ok=True)
(p/'source-manifest.json').write_text(json.dumps(m,indent=2))
(p/'source-diff.txt').write_text(git('diff',m['base'],m['source']))
print('Exact approved source blobs, unchanged committed compiled baseline and QA-only child verified')
