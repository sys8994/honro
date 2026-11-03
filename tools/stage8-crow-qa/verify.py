"""Exact source and normal-build receipt for an intermediate Stage8 repair test."""
import hashlib,json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/stage8-crow-qa';OUT.mkdir(parents=True,exist_ok=True)
SOURCE='6b00abe2308275410c2947412c1cd0c7d62b733d';BASE='7d2655bc3f88a7b20fb2d6ea1bc4c611583e9a15';TREE='f917a28a1b361225bd8b015515a6b109e4441ad1'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
assert git('show','-s','--format=%T',SOURCE)==TREE
assert git('show','-s','--format=%P',SOURCE)==BASE
subprocess.check_call(['git','merge-base','--is-ancestor',SOURCE,'HEAD'],cwd=ROOT)
allowed_prefixes=('tests/monster-natural-','tests/fixtures/monster-natural/','tools/monster-a1-qa/','tools/stage8-crow-qa/')
changed=git('diff','--name-only',SOURCE,'HEAD').splitlines()
assert all(p.startswith(allowed_prefixes) or p=='.github/workflows/monster-a1-natural-qa.yml' for p in changed),changed
for p in ['shared/data/campaign.json','tools/map-forge/stage8-bier.mjs','tools/stage31/production-package.json']:
 assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show',SOURCE+':'+p],cwd=ROOT),p+' source changed'
q=json.loads((ROOT/'tools/monster-a1-qa/request.json').read_text())
assert sha('tools/stage31/production-package.json')==q['expected']['stage31PackageSha256']
project=json.loads((ROOT/'shared/data/campaign.json').read_text());stage=next(s for s in project['stages'] if s.get('metadata',{}).get('stageId')==8)
entry=stage['initialState']['honroStage8BierSpec']['entries']['stage8-settled-crows'];assert (entry['x'],entry['y'],entry['spacing'])==(6170,3930,220)
proof={'candidate':SOURCE,'candidateTree':TREE,'qaCommit':git('rev-parse','HEAD'),'base':BASE,'qaOnlyChanges':changed,'scope':'INTERMEDIATE A1 plus Stage8 authored repair natural replay; not final combined A2/Stage9/17 acceptance','entry':entry,'originalGatedRun':41559612732,'originalNaturalRun':41576630241}
if '--built' in sys.argv:
 runtime=git('rev-parse','HEAD:shared/runtime/main.js');assert runtime==git('rev-parse',SOURCE+':shared/runtime/main.js')
 proof['generated']={p:sha(p) for p in ['HONRO.html','HONRO_WORKSHOP.html','web/manifest.json','tools/stage31/production-package.json']}
 assert sha('HONRO.html')!=q['expected']['htmlSha256'],'Stale pre-repair HTML served'
 q.update(candidate=SOURCE,source=SOURCE,scope=proof['scope'],public=False);q['expected']['htmlSha256']=sha('HONRO.html');q['expected']['manifestSha256']=sha('web/manifest.json')
 (OUT/'request.json').write_text(json.dumps(q,indent=2)+'\n')
(OUT/('built-provenance.json' if '--built' in sys.argv else 'source-provenance.json')).write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
