import hashlib,json,os,re,shutil,subprocess,sys,time
from pathlib import Path
H=Path(__file__).resolve().parent; P=json.loads((H/'PINS.json').read_bytes()); M='web/manifest.json'; DOCS=('HONRO.html','HONRO_WORKSHOP.html','index.html')
def sha(v):return hashlib.sha256(v).hexdigest()
def fact(v):return {'bytes':len(v),'sha256':sha(v)}
def need(q,c):assert q,c
def get(r,k):assert not k.startswith('/') and '..' not in Path(k).parts;return (r/k).read_bytes()
def read(r,k):return json.loads(get(r,k))
def write(r,k,q):(r/k).write_text(json.dumps(q,indent=2)+'\n')
def git(r,*args):return subprocess.check_output(['git','-C',str(r),*args],timeout=90).decode().strip()
def node(*args,cwd=None):return subprocess.check_output(['node',*map(str,args)],cwd=cwd,timeout=90)
def idx(m):
 q={k['path']:{j:k[j]for j in ('bytes','sha256')} for k in m['files']};assert len(q)==len(m['files']);return q
def pre(w):
 r=Path(os.environ['GITHUB_WORKSPACE']);o=w/'out';head=os.environ['GITHUB_SHA'];base=P['base']
 assert not (os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push','refs/heads/'+P['branch'])
 assert git(r,'rev-list','--parents','-1','HEAD').split()==[head,base] and git(r,'rev-parse',base+'^{tree}')==P['stock']['baseTree']
 acted=set(git(r,'diff','--name-status','--no-renames',base,head).splitlines())
 assert acted=={'A\t'+t for t in P['carrierPaths']},acted
 assert all(git(r,'ls-tree',head,'--',p).startswith('100644 blob ')for p in P['carrierPaths'])
 assert not git(r,'status','--porcelain=v1')
 for side in ('A','B'):git(r,'worktree','add','--detach',str(w/side),base)
 a,b=w/'A',w/'B'
 for key,k in (('manifest',M),('shell','HONRO.html'),('map',P['stock']['s44Map']),('packet',P['stock']['s44Packet']),('retention','shared/web-retention.mjs')):
  assert git(a,'hash-object',k)==P['stock'][key+'Git']
 recipe=json.loads(node(H/'author.mjs','apply',b))
 assert recipe['sourceChange']==P['new']['sourceGit'] and recipe['canonicalArtOnly']
 write(o,'AUTHORITY.json',{'exactBase':base,'baseTree':git(r,'rev-parse',base+'^{tree}'),'qaHead':head,'onlyAdded':sorted(P['carrierPaths']),'sourceRecipe':recipe,'testMode':'previous tracked normal A + exactly one normal B build'})
ROLES={
'packet44':r'web/data/chapter-44-assets\.[0-9a-f]{16}\.json',
'campaign':r'web/data/campaign\.[0-9a-f]{16}\.json','campaign-js':r'web/runtime/campaign\.[0-9a-f]{16}\.js',
'act5-common':r'web/runtime/ordered-common-18\.[0-9a-f]{16}\.js',
'game-js':r'web/entries/game\.[0-9a-f]{16}\.js','game-html':r'web/entries/game\.[0-9a-f]{16}\.html','workshop-js':r'web/entries/workshop\.[0-9a-f]{16}\.js'
}
def names(rows):
 a={}
 for p in sorted(rows):
  match=[k for k,v in ROLES.items() if re.fullmatch(v,p)]
  assert len(match)==1 and match[0] not in a,(p,match)
  a[match[0]]=p
 assert a.keys()==ROLES.keys(),a
 return a
def aliases(x,diff):
 for old,new in diff.items():x=x.replace(new.encode(),old.encode()).replace(Path(new).name.encode(),Path(old).name.encode())
 return x
def strict_source_status(raw, expected):
 # Porcelain -z fields are literal bytes. No strip, splitting path text, casing
 # aliases, slash/Unicode normalization or rename acceptance is permitted.
 assert raw and raw.endswith(b'\0'), 'malformed or empty git status records'
 rows=raw[:-1].split(b'\0')
 got={}
 for b in rows:
  assert b[:3] in (b' M ',b'?? '),('unexpected status header',b[:3])
  path=b[3:].decode('ascii',errors='strict')
  assert path and path not in got and path in expected,('unexpected path or duplicate',path)
  got[path]=b[:2].decode('ascii')
 assert got==expected,('wrong changed-source set or status',got,expected)
 return got
def exact_status(repo):
 argv=['git','-C',str(repo),'status','--porcelain=v1','-z','--untracked-files=all','--','shared','game/src','tools','tests']
 return subprocess.check_output(argv,timeout=90)
def build(w):
 a,b,o=w/'A',w/'B',w/'out';am,bm=read(a,M),read(b,M);ai,bi=idx(am),idx(bm)
 assert git(a,'hash-object',M)==P['stock']['manifestGit'] and not git(a,'status','--porcelain=v1')
 assert all(git(b,'hash-object',k)==v for k,v in P['new']['sourceGit'].items())
 raw=exact_status(b)
 expected={k:('??' if k.endswith('/stage44-west-depth-r9.json') else ' M') for k in P['new']['sourceGit']}
 write(o,'SOURCE-B-PORCELAIN.json',{'expected':expected,'observedHex':raw.hex()})
 assert strict_source_status(raw,expected)==expected
 for root,pool in ((a,ai),(b,bi)):
  for k,v in pool.items():assert fact(get(root,k))==v,k
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 write(o,'OBSERVED-GRAPH.json',dict(removed=sorted(ai.keys()-bi.keys()),added=sorted(bi.keys()-ai.keys())))
 ak,bk=names(ai.keys()-bi.keys()),names(bi.keys()-ai.keys())
 assert ak['packet44']==P['stock']['s44Packet'] and ak['campaign']==P['stock']['campaign'] and ak['act5-common']==P['stock']['act5Common']
 diff={v:bk[k]for k,v in ak.items()}
 ac,bc=[read(x,k['campaign'])for x,k in ((a,ak),(b,bk))]
 assert len(ac['stages'])==len(ac['stageLibraries'])==50 and ac['stages']==bc['stages']
 assert ac['stages'][43]==P['stock']['s44Map'] and ac['stages'][41]==P['stock']['s42Map']
 assert ac['stageLibraries'][41]==bc['stageLibraries'][41]==P['stock']['s42Packet']
 assert ac['stageLibraries'][43]==ak['packet44'] and bc['stageLibraries'][43]==bk['packet44']
 assert ac['stageLibraries'][:43]+ac['stageLibraries'][44:]==bc['stageLibraries'][:43]+bc['stageLibraries'][44:]
 assert ac['assetEncodings']['stageLibraries'][43]==bc['assetEncodings']['stageLibraries'][43]==P['stock']['encoding']
 for k in ('compatibility33','compatibility34'):assert ac.get(k)==bc.get(k)
 assert json.loads(aliases(get(b,bk['campaign']),diff))==ac
 for k in set(ROLES)-{'campaign','packet44','act5-common'}:assert aliases(get(b,bk[k]),diff)==get(a,ak[k]),k
 for k in DOCS:assert aliases(get(b,k),diff)==get(a,k),k
 for k in ('project','playtest','gameEntry','workshopEntry','common','gameOnly','optionalModules','styles'):
  assert am[k]==json.loads(aliases(json.dumps(bm[k]).encode(),diff)),k
 wire=json.loads(node(H/'author.mjs','wire',a,a/ak['packet44'],b/bk['packet44']))
 assert wire['exactRecoveredPacket'] and wire['sourceAssetSha']==P['new']['sourceAssetSHA256']
 assert git(b,'hash-object','shared/web-retention.mjs')==P['stock']['retentionGit']
 assert am['publishedRetention']==bm['publishedRetention']==dict(version=2,windowDays=7,minGraphs=2)
 tx=[int((o/f'BUILD-{i}.txt').read_text())for i in ('BEGIN','END')];assert 0<tx[1]-tx[0]<24*60*1000
 expr='''import {readFileSync}from'node:fs';import{selectPublishedGenerations as s,planWebAssetRetention as p}from'./shared/web-retention.mjs';const[a,b]=process.argv.slice(1,3).map(f=>JSON.parse(readFileSync(f)));const [l,r]=process.argv.slice(3).map(now=>({generations:s(a.publishedGenerations,{now:+now}),obsolete:p(a,b.files,{now:+now}).obsoleteFiles}));if(JSON.stringify(l)!==JSON.stringify(r))throw Error('ambiguous build-time retention expiry');console.log(JSON.stringify(l));'''
 policy=json.loads(node('--input-type=module','-e',expr,a/M,b/M,*tx,cwd=a));assert bm['publishedGenerations']==policy['generations']
 obsolete={k['path']for k in policy['obsolete']};history={p['path']:{y:p[y]for y in ('bytes','sha256')} for l in [am['files'],am['previousFiles'],*am['previousGenerations'],*(x['files']for x in am['publishedGenerations'])]for p in l}
 restored=[]
 for k,v in history.items():
  assert fact(get(a,k))==v,k
  if not (b/k).exists():
   assert k in obsolete and k not in bi and (b/k).parent.is_dir(),k
   shutil.copyfile(a/k,b/k);restored.append(k)
  assert fact(get(b,k))==v,k
 write(o,'RETENTION.json',{'immutablePrior':len(history),'restoredExactHistorical':sorted(restored),'policyVersion':2,'opaqueGraphAuthorizationNotGranted':True})
 graph={'scope':'50 maps and 49 other asset providers unchanged; left visual own field only','wire':wire,'aliasSet':diff,'ar':ak,'br':bk,'shell':{'A':fact(get(a,'HONRO.html')),'B':fact(get(b,'HONRO.html'))},'routes':{}}
 for s,x,active,k in (('A',a,ai,ak),('B',b,bi,bk)):
  graph['routes'][s]={str(i):{f:active[f]for f in {k[j]for j in ('act5-common','game-js','campaign-js','campaign')}|{(ac if s=='A' else bc)['stages'][i-1],(ac if s=='A' else bc)['stageLibraries'][i-1]}}for i in (42,44)}
 write(o,'GRAPH.json',graph)
if __name__=='__main__':
 w=Path(sys.argv[2]).resolve()
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve()) and (w/'out').is_dir()
 {'pre':pre,'build':build}[sys.argv[1]](w)
