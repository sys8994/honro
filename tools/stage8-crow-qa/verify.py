"""Exact source and unpublished UI-preview receipt; not a release gate."""
import hashlib,json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/stage8-crow-qa';OUT.mkdir(parents=True,exist_ok=True)
SOURCE='4ba62e439ee5382b3db2e6b0080038c8ae16f5d4';BASE='fece7f62d05e06e13d8d66cd0a193127984c1a03';TREE='53df4325bc02a41ce80a6d3e136b38d06aa6398b'
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
def sha(p):return hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
assert git('show','-s','--format=%T',SOURCE)==TREE
assert git('show','-s','--format=%P',SOURCE)==BASE
subprocess.check_call(['git','merge-base','--is-ancestor',SOURCE,'HEAD'],cwd=ROOT)
allowed_prefixes=('tests/monster-natural-','tests/fixtures/monster-natural/','tools/monster-a1-qa/','tools/stage8-crow-qa/')
changed=git('diff','--name-only',SOURCE,'HEAD').splitlines()
assert all(p.startswith(allowed_prefixes) or p=='.github/workflows/monster-a1-natural-qa.yml' for p in changed),changed
for p in ['shared/data/campaign.json','shared/runtime/stage8-bier.js','shared/runtime/objectives.js','tools/map-forge/stage8-bier.mjs','tools/stage31/production-package.json']:
 assert (ROOT/p).read_bytes()==subprocess.check_output(['git','show',SOURCE+':'+p],cwd=ROOT),p+' source changed'
q=json.loads((ROOT/'tools/monster-a1-qa/request.json').read_text())
assert sha('tools/stage31/production-package.json')==q['expected']['stage31PackageSha256']
project=json.loads((ROOT/'shared/data/campaign.json').read_text());stage=next(s for s in project['stages'] if s.get('metadata',{}).get('stageId')==8)
entry=stage['initialState']['honroStage8BierSpec']['entries']['stage8-settled-crows'];assert (entry['x'],entry['y'],entry['spacing'])==(6170,3930,220)
proof={'candidate':SOURCE,'candidateTree':TREE,'qaCommit':git('rev-parse','HEAD'),'base':BASE,'qaOnlyChanges':changed,'scope':'UNPUBLISHED UI diagnostic: genuine 6b checkpoint under pending-crow presentation repair; not normal build or final combined acceptance','entry':entry,'originalGatedRun':41559612732,'originalNaturalRun':41576630241}
if '--built' in sys.argv:
 runtime=git('rev-parse','HEAD:shared/runtime/main.js');assert runtime==git('rev-parse',SOURCE+':shared/runtime/main.js')
 proof['generated']={p:sha(p) for p in ['HONRO.html','HONRO_WORKSHOP.html','web/manifest.json','tools/stage31/production-package.json']}
 assert sha('HONRO.html')!=q['expected']['htmlSha256'],'Stale pre-repair HTML served'
 q.update(candidate=SOURCE,source=SOURCE,scope=proof['scope'],public=False,buildMode='unpublished-ui-preview',checkpointSource='6b00abe2308275410c2947412c1cd0c7d62b733d');q['expected']['runtimeSha256']=subprocess.check_output(['node','--input-type=module','-e',"import {runtimeDigest} from './tools/stage31/probes.mjs';console.log(await runtimeDigest())"],cwd=ROOT,text=True).strip();proof['runtimeSha256']=q['expected']['runtimeSha256'];q['expected']['htmlSha256']=sha('HONRO.html');q['expected']['manifestSha256']=sha('web/manifest.json')
 (OUT/'request.json').write_text(json.dumps(q,indent=2)+'\n')
(OUT/('built-provenance.json' if '--built' in sys.argv else 'source-provenance.json')).write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
