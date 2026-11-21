"""Read-only GitHub Actions authority for combined Stage7/Stage14 exact evidence."""
import hashlib,io,json,os,re,subprocess,sys,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO='sys8994/honro'
BASE='cd8f69d5be1243f6647379ce4a8f6bad1a50234c'
BASE_TREE='40a38ef4fe45ea488620f73207e50e854f372e45'
PAGES=44945703929;DEPLOY=136972798562;STAMP='2026-11-21T20:21:37.5936392Z'
NATIVE=44946041088;NJOB=136973446445;NHEAD='166e3eda1de77600604c83f246f07759fe684b57'
NTREE='091a9274f4d114edca9afc80d121737aad42c42b'
P=HERE/'NATIVE-PROOF-PINS.json'
pin=json.loads(P.read_bytes())
def api(k):return subprocess.check_output(['gh','api','-X','GET',f'repos/{REPO}/'+k],timeout=90)
def get(k):return json.loads(api(k))
def sha(b):return hashlib.sha256(b).hexdigest()
def canonical(x):return json.dumps(x,sort_keys=True,ensure_ascii=True,separators=(',',':')).encode()
def stamp(b):return {'bytes':len(b),'sha256':sha(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def authority_data(a):
 return canonical(a)+b'\n'
def run_pair(rid,jid,head,branch,job):
 r,j=get(f'actions/runs/{rid}'),get(f'actions/jobs/{jid}')
 assert (r['id'],r['head_sha'],r['head_branch'],r['status'],r['conclusion'])==(rid,head,branch,'completed','success')
 assert r['repository']['full_name']==r['head_repository']['full_name']==REPO
 assert (j['id'],j['run_id'],j['head_sha'],j['name'],j['status'],j['conclusion'])==(jid,rid,head,job,'completed','success')
 return r,j
def main(w):
 assert pin['enabled'] is True,'DISABLED: full official normal/PNG/Stage14 cross-preservation required'
 assert pin['conclusion']==pin['actualBrowserSignedResult']=='success'
 assert pin['independentEvidence']['storedPNGs']==192 and pin['independentEvidence']['observedPhases']==384 and pin['independentEvidence']['stage14WholePriorPhaseExact']==16
 assert re.fullmatch('[a-f0-9]{64}',pin['independentEvidence']['independentJSONSHA256'])
 assert os.getenv('GH_TOKEN') and not os.getenv('GITHUB_TOKEN')
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert get('git/ref/heads/master')['object']['sha']==BASE
 p,j=run_pair(PAGES,DEPLOY,BASE,'master','deploy')
 assert p['name']=='pages build and deployment' and p['head_commit']['tree_id']==BASE_TREE
 assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success' for x in j['steps'])
 log=api(f'actions/jobs/{DEPLOY}/logs')
 assert len(log)<2**20
 lines=log.decode().splitlines()
 start=[i for i,t in enumerate(lines)if 'Created deployment for '+BASE in t]
 end=[i for i,t in enumerate(lines)if t.startswith(STAMP+' ')and 'Reported success!'in t]
 assert len(start)==len(end)==1 and start[0]<end[0]
 assert (pin['base'],pin['priorPages'],pin['nativeRun'],pin['nativeJob'],pin['nativeHead'],pin['nativeTree'])==(BASE,PAGES,NATIVE,NJOB,NHEAD,NTREE)
 r,j=run_pair(NATIVE,NJOB,NHEAD,pin['nativeBranch'],'native')
 assert r['head_commit']['tree_id']==NTREE and r['event']=='push' and r['path']=='.github/workflows/stage7-west-closure.yml'
 assert len([x for x in j['steps'] if 4<=x['number']<=12 and x['conclusion']=='success'])==9
 assert (pin['expectedCaptures'],pin['expectedComparisons'])==(384,32)
 c=get(f'git/commits/{NHEAD}')
 assert [a['sha']for a in c['parents']]==[BASE] and c['tree']['sha']==NTREE
 remote={a['id']:a for a in get(f'actions/runs/{NATIVE}/artifacts?per_page=100')['artifacts']}
 assert len(pin['artifacts'])==len(remote)==7
 for a in pin['artifacts']:
  x=remote[a['id']]
  assert x['workflow_run']['head_sha']==NHEAD and x['workflow_run']['id']==NATIVE
  assert (x['name'],x['size_in_bytes'],x['digest'],x['expired'])==(a['name'],a['bytes'],'sha256:'+a['sha256'],False)
 receipt=next(a for a in pin['artifacts']if a['name']=='honro-stage7-after-stage14-exact-native-receipts')
 z=api(f"actions/artifacts/{receipt['id']}/zip")
 assert receipt['bytes']==len(z) and receipt['sha256']==sha(z)
 with zipfile.ZipFile(io.BytesIO(z))as zz:
  assert zz.testzip()is None and len(zz.namelist())==len(set(zz.namelist()))
  g,b,s=[zz.read(k+'.json')for k in ('GRAPH','BROWSER','SOURCE')]
 graph,browser,source=map(json.loads,(g,b,s))
 assert sha(b)==pin['browserRawSha256'] and sha(canonical(graph))==pin['graphCanonicalSha256']
 assert graph['base']==source['base']==BASE and source['head']==NHEAD
 assert source['candidate']['git']==pin['candidateSourceGit']=='aa4ccbcaa8a2ae6160330c1134f1596c9f4be6f8'
 assert graph['identical50MapsPacketsGraphics'] and graph['onlySingleCompiledModuleCodeChanged']
 assert graph['stage14SourceAndCompiledModuleRemainExact']==pin['stage14Scope']
 n=pin['expectedCombinedCommon16']
 assert graph['activeB'][n['path']]=={k:n[k]for k in ('bytes','sha256')}
 assert browser['status']=='PASS_ACTUAL_STAGE7_WEST_AND_STAGE14_PRESERVED_NO_RELEASE' and not browser['failures']
 f=browser['comparisons'];v=browser['visits']
 assert len(f)==32 and len(v)==12 and len([x for x in v if x['case'].startswith('s14-')])==6
 assert all(x['status']=='EXACT_ACTUAL_VISIT'and not x['networkErrors'] for x in v)
 pngs={p['path'] for x in v for y in x['frames'].values()for p in y['phases'].values()};assert len(pngs)==192
 assert sum(len(y['phases'])for x in v for y in x['frames'].values())==384
 def exact(x):
  return x['pass'] and len(x['phases'])==4 and all(y['pass']and y['priorOfficialSamePhaseRGBAExact'] and y['stockRepeatRGBAExact'] and y['geometryAndCacheFootprintExact']and y['outside']==y['alpha']==0 for y in x['phases'].values())
 assert all(exact(x) for x in f.values())
 peer={k for k in f if k.startswith('s14-')};assert len(peer)==16 and all(y['changed']==0 for k in peer for y in f[k]['phases'].values())
 assert {k for k,x in f.items()if any(y['changed']>0 for y in x['phases'].values())}=={'s07-1440x900-west','s07-1440x900-southwest','s07-390x844-west','s07-390x844-northwest','s07-390x844-southwest'}
 data=authority_data({'verified':True,'base':BASE,'normalGraph':pin['graphCanonicalSha256'],'browserRaw':pin['browserRawSha256'],
   'run':NATIVE,'job':NJOB,'head':NHEAD,'receipt':receipt['id'],'priorPages':PAGES,'verifiedPublishedAt':STAMP,
   'independent':pin['independentEvidence'],'stage14IdenticalPoses':16,'noReleaseAction':True})
 assert stamp(data)==pin['independentlyVerifiedAuthorityReceipt']
 with (w/'authority.json').open('xb')as f:f.write(data)
if __name__=='__main__':main(Path(sys.argv[1]).resolve())
