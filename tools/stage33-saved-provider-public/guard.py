"""Disabled public proof. No publisher hooks or saved user data."""
import hashlib,json,os,re,subprocess,sys
from pathlib import Path
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_text());M='web/manifest.json'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def pin(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(x,msg):
 if not x:raise RuntimeError(msg)
def rd(r,k):return (r/k).read_bytes()
def sv(w,n,x):(w/'out'/n).write_text(json.dumps(x,indent=2)+'\n')
def git(r,*args):return subprocess.check_output(['git','-C',str(r),*args],timeout=120,text=True).strip()
def inv(rr):
 result={}
 for a in rr:
  p=a['path'];f={k:a[k]for k in ('bytes','sha256')}
  need(p not in result or result[p]==f,'immutable route conflict')
  result[p]=f
 return result
def pre(w):
 r=P['release'];repo=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA']
 need(P['enabled'] is True and all(isinstance(r[k],str) and re.fullmatch('[0-9a-f]{40}',r[k])for k in ('head','tree')) and all(type(r[k])is int and r[k]>0 for k in ('pagesRun','pagesJob')) and re.fullmatch(r'2026-11-22T\d\d:\d\d:\d\d(?:\.\d+)?Z',r['pagesUTC'] or '') and r['head']!=P['head'],'disabled; needs new deployed successor exact pins')
 need(not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'unexpected credentials')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'unexpected QA trigger')
 allowed={'.github/workflows/stage33-saved-provider-public.yml',*(str(D.relative_to(repo)/k)for k in ('PINS.json','old-c60-HONRO.html','observer.json','guard.py','capture.py'))}
 need(git(repo,'show','-s','--format=%P',h)==r['head'] and git(repo,'rev-parse',r['head']+'^{tree}')==r['tree'] and not git(repo,'status','--porcelain=v1') and set(git(repo,'diff','--name-status','--no-renames',r['head'],h).splitlines())=={'A\t'+k for k in allowed},'unexpected source or QA diff')
 need(pin(rd(repo,M))==r['manifest'] and pin(rd(repo,'shared/build.mjs'))==P['sourceCandidate'] and pin(rd(D,'old-c60-HONRO.html'))==P['oldShell'] and pin(rd(D,'observer.json'))==P['observer'],'release/authored/historical source mismatch')
 m=json.loads(rd(repo,M));active=inv(m['files']);registry=inv([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(p for g in m['publishedGenerations']for p in g['files'])])
 need(len(active)==P['requiredRows'] and len(registry)==P['retainedURLs'],'wrong retained registry or active count')
 g=P['graph'];g['currentShellRoutes']={g['currentEntry']:active[g['currentEntry']]};g['currentShell']=fact(rd(repo,'HONRO.html'));g['publishedChangedSlots']={k:active[k]for k in g['add']};g['retainedPriorSlots']={k:registry[k]for k in g['removed']}
 need(m['gameEntry'].split('?')[0]==g['currentEntry'] and m['project']==g['currentProject'] and active[g['newCommon']]==g['sha'] and all(k in active and fact(rd(repo,k))==active[k] for k in g['add']),'not qualified normal active graph')
 old={x['sourceSha']:x for x in m['publishedGenerations']}
 need(P['head'] in old and P['old'] in old and all(k in registry and k not in active and fact(rd(repo,k))==registry[k] for k in g['removed']),'prior 733/c60 graph retention drift')
 c=inv(old[P['old']]['files']);need(all(c[k]==v==fact(rd(repo,k))for k,v in P['oldRoutes'].items()),'historic c60 asset not immutable')
 for peers in g['peers'].values():need(all(v==active[k]==fact(rd(repo,k)) for k,v in peers.items()),'protected peer route mismatch')
 a=w/'A';a.mkdir();(a/'HONRO.html').write_bytes(rd(D,'old-c60-HONRO.html'));(a/'web').symlink_to(repo/'web',target_is_directory=True)
 sv(w,'SOURCE.json',{'oldRoutes':P['oldRoutes'],'release':r,'normal':P['normal'],'currentRetained733':old[P['head']]['sourceSha']})
 sv(w,'GRAPH.json',g)
if __name__=='__main__':pre(Path(sys.argv[1]))
