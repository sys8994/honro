"""Prepare a release branch from pinned source/artifact semantics, never write master."""
import hashlib,json,re,shutil,subprocess,sys
from pathlib import Path
pins=json.loads(Path(sys.argv[1]).read_bytes())
src,target,out=map(Path,sys.argv[2:])
out.mkdir(parents=True,exist_ok=True)
def run(cwd,*cmd): return subprocess.check_output(['git','-C',str(cwd),*cmd],text=True).strip()
u=lambda s:hashlib.sha256(json.dumps(s,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
sha=lambda raw:hashlib.sha256(raw).hexdigest()
assert run(src,'rev-parse','HEAD')==pins['sha']
assert run(src,'rev-parse','HEAD^{tree}')==pins['root']
assert run(target,'rev-parse','HEAD')==pins['baseMaster']
paths=[]
for f in pins['source']:
    p=f['path']
    assert p.startswith('shared/') or p=='game/engine/build.mjs'
    assert '..' not in Path(p).parts and run(src,'rev-parse','HEAD:'+p)==f['sha']
    paths.append(p)
assert len(paths)==len(set(paths))==100
assert run(target,'rev-parse',pins['planRef']+':'+pins['planPath'])==pins['planBlob']
run(target,'checkout',pins['sha'],'--',*paths)
run(target,'checkout',pins['planRef'],'--',pins['planPath'])
baseline=json.loads((target/'web/manifest.json').read_bytes())
m=json.loads((src/'web/manifest.json').read_bytes())
fields=('project','gameEntry','workshopEntry','playtest','common','gameOnly','files','optionalModules','styles','workshopStyle')
assert u({k:m[k] for k in fields})==pins['activeGraphSHA256'],'Clean production runtime graph differs from verified candidate'
assert m['project']==baseline['project'],'Existing chapters or Workshop graph changed'
def copy_changed(p):
    assert '..' not in Path(p).parts and not Path(p).is_absolute()
    a,b=src/p,target/p
    if not b.exists() or sha(a.read_bytes())!=sha(b.read_bytes()):
        b.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(a,b)
        return True
    return False
wrote=[]
for f in m['files']:
    p=f['path'];assert re.fullmatch(r'web/[A-Za-z0-9._/-]+',p)
    b=(src/p).read_bytes()
    assert len(b)==f['bytes'] and sha(b)==f['sha256'],p
    if copy_changed(p):wrote.append(p)
for p in ['HONRO.html','index.html','HONRO_WORKSHOP.html','web/manifest.json']:
    if copy_changed(p):wrote.append(p)
assert {'HONRO.html','index.html','web/manifest.json'}<=set(wrote)
assert sum('act6-qa-chapter-' in w for w in wrote)==10
assert len([w for w in wrote if 'ordered-game-24-normal51.' in w])==1
assert len([w for w in wrote if 'web/entries/game-normal51.' in w])==1
for row in m['publishedGenerations']:
    for f in row['files']:
        assert (target/f['path']).is_file(),f['path']
run(target,'add','--',*wrote)
actual=set(run(target,'diff','--cached','--name-only').splitlines())
assert actual==set(paths+[pins['planPath']]+wrote),sorted(actual.symmetric_difference(paths+[pins['planPath']]+wrote))
assert not run(target,'diff','--cached','--name-only','--diff-filter=D')
with (out/'RELEASE-READBACK.json').open('w') as f:
    json.dump({'source':pins['sha'],'parent':pins['baseMaster'],'activeGraphSHA256':pins['activeGraphSHA256'],
      'manifestSHA256':sha((target/'web/manifest.json').read_bytes()),'files':len(actual),'addedProductionAssets':wrote,'stageCount':10,
      'preexistingCampaignManifest':m['project']},f,indent=2)
