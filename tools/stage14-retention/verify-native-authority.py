"""GitHub Actions read-only independent authority for Stage14 retention. Pending pins required."""
import hashlib,io,json,os,re,subprocess,sys,zipfile
from pathlib import Path
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
HERE=Path(__file__).resolve().parent
REPO='sys8994/honro'
BASE='21809dc917101f9ee28672b34d923636ca58e7be'
PAGES=44938122195; DEPLOY=136949539110
fn='NATIVE-PROOF-PINS.json'
pin=json.loads((HERE/fn).read_bytes())
def api(k):return subprocess.check_output(['gh','api',f'repos/{REPO}/'+k],timeout=90)
def get(k):return json.loads(api(k))
def sha(b):return hashlib.sha256(b).hexdigest()
def pt(data):
 b=json.dumps(data,sort_keys=True,ensure_ascii=True,separators=(',',':')).encode()+b'\n'
 p=Path(sys.argv[1])/'authority.json'
 assert p.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 with p.open('xb') as f:f.write(b)
def run_pair(rid,jid,head,branch,job):
 r,j=get(f'actions/runs/{rid}'),get(f'actions/jobs/{jid}')
 assert (r['id'],r['head_sha'],r['head_branch'],r['status'],r['conclusion'])==(rid,head,branch,'completed','success')
 assert r['repository']['full_name']==r['head_repository']['full_name']==REPO
 assert (j['id'],j['run_id'],j['head_sha'],j['name'],j['status'],j['conclusion'])==(jid,rid,head,job,'completed','success')
 return r,j
assert os.getenv('GH_TOKEN') and not os.getenv('GITHUB_TOKEN')
assert get('git/ref/heads/master')['object']['sha']==BASE
_,pagejob=run_pair(PAGES,DEPLOY,BASE,'master','deploy')
assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success'for x in pagejob['steps'])
rid,jid,h=pin['nativeRun'],pin['nativeJob'],pin['nativeHead']
r,j=run_pair(rid,jid,h,pin['nativeBranch'],'native')
assert r['head_commit']['tree_id']==pin['nativeTree'] and r['event']=='push'
assert all(x['conclusion']=='success'for x in j['steps']if 4<=x['number']<=12)
assert pin['expectedCaptures']==336 and pin['expectedComparisons']==28
remote={a['id']:a for a in get(f'actions/runs/{rid}/artifacts')['artifacts']}
assert len(pin['artifacts'])==7
for a in pin['artifacts']:
 x=remote[a['id']]
 assert x['workflow_run']['head_sha']==h and x['workflow_run']['id']==rid
 assert (x['name'],x['size_in_bytes'],x['digest'],x['expired'])==(a['name'],a['bytes'],'sha256:'+a['sha256'],False)
receipt=next(x for x in pin['artifacts']if x['name']=='honro-stage14-exact-native-receipts')
z=api(f"actions/artifacts/{receipt['id']}/zip")
assert receipt['bytes']==len(z) and receipt['sha256']==sha(z)
with zipfile.ZipFile(io.BytesIO(z)) as p:
 assert not p.testzip()
 g,b,s=[p.read(n+'.json')for n in ('GRAPH','BROWSER','SOURCE')]
 graph,browser,source=map(json.loads,(g,b,s))
 assert sha(b)==pin['browserRawSha256']
 assert sha(json.dumps(graph,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode())==pin['graphCanonicalSha256']
 assert graph['base']==source['base']==BASE and source['head']==h and source['candidate']['git']==pin['candidateSourceGit']
 assert browser['status']=='PASS_ACTUAL_STAGE14_ONE_NONWALK_INK_CLOSURE_NO_RELEASE' and not browser['failures']
 assert len(browser['comparisons'])==28 and len(browser['visits'])==18
 assert all(x['pass']for x in browser['comparisons'].values())
 assert all(x['status']=='EXACT_ACTUAL_VISIT'for x in browser['visits'])
 assert sum(len(x['frames'][f]['phases'])for x in browser['visits']for f in x['frames'])==336
pt({'verified':True,'base':BASE,'normalGraph':pin['graphCanonicalSha256'],'browserRaw':pin['browserRawSha256'],
    'run':rid,'job':jid,'head':h,'receipt':receipt['id'],'priorPages':PAGES,'noReleaseAction':True})
