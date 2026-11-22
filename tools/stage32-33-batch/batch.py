"""One normal Stage32+33 B, never mutate a branch or construct a release."""
import copy,hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent; Q=D.parents[1]; P=json.loads((D/'AUTHORITY.json').read_bytes())
M='web/manifest.json'
def no(x,error):
 if not x:raise RuntimeError(error)
def git(at,*args):return subprocess.check_output(['git','-C',str(at),*args],text=True,timeout=150).strip()
def val(x):return {'bytes':len(x),'sha256':hashlib.sha256(x).hexdigest()}
def stamp(x):return {**val(x),'git':hashlib.sha1(f'blob {len(x)}\0'.encode()+x).hexdigest()}
def read(at,name):
 p=at/name
 no(not p.is_symlink() and p.is_file() and p.resolve().is_relative_to(at.resolve()),('nonregular candidate/unsafe path',name))
 return p.read_bytes()
def put(w,k,o):(w/'OUT'/k).write_text(json.dumps(o,indent=2)+'\n')
def main(w):
 r=Path(os.environ['GITHUB_WORKSPACE']); h=os.environ['GITHUB_SHA']; b=Path(w/'B')
 no(P['enabled'] is True and all(re.fullmatch('[a-f0-9]{40}',P[x]) for x in ('head','tree')) and P['pages']['head']==P['head'] and P['pages']['conclusion']=='success' and P['pages']['run']>0 and P['pages']['job']>0,'disabled/unverified exact released Stage7')
 no((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']) and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'wrong repo/ref or unexpected credentials')
 no(git(r,'rev-list','--parents','-1',h).split()==[h,P['head']] and git(r,'rev-parse',P['head']+'^{tree}')==P['tree'] and not git(r,'status','--porcelain=v1'),'wrong exact QA parent/tree')
 no(git(r,'merge-base','--is-ancestor','0b9c7f0746da289dc92474a76173232a3fb91ea8',P['head'])=='' and P['head']!='0b9c7f0746da289dc92474a76173232a3fb91ea8','expected released Stage7 successor')
 paths=P['transport exact Git']
 no(set(git(r,'diff','--name-status','--no-renames',P['head'],h).splitlines())=={'A\t'+x for x in paths},'QA head is not exact add-only overlay')
 for f,v in paths.items():
  s=stamp(read(r,f));no(v=='SELF' and (r/f).resolve()==(D/'AUTHORITY.json').resolve() or s['git']==v,('wrong transport bytes',f))
 for key in ('A','B'):git(r,'worktree','add','--detach',str(w/key),P['head'])
 a=w/'A';no(stamp(read(a,M))==P['manifest'],'exact Stage7 final published manifest needed')
 m=json.loads(read(a,M));c=json.loads(read(a,m['project']))
 no([c['stages'][6],c['stageLibraries'][6]]==list(P['stage07']) and all(val(read(a,x))==pin for x,pin in P['stage07'].items()),'the approved Stage7 public packet is not active')
 for f,x in P['sources'].items():
  old=git(a,'ls-files','--',f)
  no((stamp(read(a,f))['git'] if old else None)==x['old'],('wrong prior product source',f))
  data=read(Q,x['transport'])
  no(stamp(data)['git']==x['new'],('wrong exact authorized combined source',f));(b/f).write_bytes(data)
 actual=set(git(b,'status','--porcelain=v1','--untracked-files=all').splitlines())
 no(actual==({'M '+f if x['old'] else '?? '+f for f,x in P['sources'].items()}),'unexpected product source changed before build')
 put(w,'STAGE33-AUTHORITY.json',{'enabled':True,'base':dict(head=P['head'],tree=P['tree'],manifest=P['manifest'],registry=P['immutable'],pagesRun=P['pages']['run'],pagesJob=P['pages']['job'],publishedAt=P['pages']['utc'])})
 put(w,'SOURCE.json',{'status':'EXACT_3_SOURCE_UNION','base':P['head'],'qaHead':h,'baseTree':P['tree'],'pages':P['pages'],'sources':P['sources'],'stage07':P['stage07']})
def role(s):return re.sub(r'\.[0-9a-f]{16}(?=\.[^.]+$)','',s)
def item(r,v):return val(read(r,v))
def pinset(m):
 x={row['path']:{k:row[k] for k in ['bytes','sha256']} for row in m['files']}
 no(len(x)==len(m['files']),'duplicate active registry paths');return x
def graph(w):
 a,b=w/'A',w/'B';ma,mb=(json.loads(read(r,M)) for r in (a,b));g0,g1=(pinset(t) for t in (ma,mb))
 adds=sorted(set(g1)-set(g0));lost=sorted(set(g0)-set(g1));shared=[k for k in g0.keys()&g1.keys() if g0[k]!=g1[k]]
 put(w,'ACTIVE-PREVIEW.json',dict(added=adds,displaced=lost,changedShared=sorted(shared),active=[len(g0),len(g1)]))
 no(len(g0)==len(g1)==P['active'] and len(adds)==len(lost)==len(P['expectedRoles']) and set(map(role,adds))==set(map(role,lost))==set(P['expectedRoles']) and not shared,'wrong exact regroup/same-path active bytes')
 no(all(item(b,k)==g1[k] and g1[k]['sha256'][:16] in k for k in adds),'normal content-addressed affected files')
 diff=set(git(b,'status','--porcelain=v1','--untracked-files=all').splitlines())
 stable={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
 allow={'M '+x for x in stable}|{'M '+k if x['old'] else '?? '+k for k,x in P['sources'].items()}|{'?? '+k for k in adds}
 no(diff<=allow and all('?? '+k in diff for k in adds),'physically removed/rewritten prior tracked files or unauthorized generated paths')
 registry={}
 for row in [*ma['files'],*ma['previousFiles'],*sum(ma['previousGenerations'],[]),*(x for gen in ma['publishedGenerations']for x in gen['files'])]:
  k=row['path'];pin={x:row[x]for x in ('bytes','sha256')}
  no(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k) and (k not in registry or registry[k]==pin),'unsafe/conflicting retained immutable')
  registry[k]=pin
 no(len(registry)==P['immutable'] and len(ma['publishedGenerations'])==50 and all(item(b,k)==v for k,v in registry.items()),'not all exact prior registered immutable URL bytes preserved')
 immutable=registry
 for k in [*P['stage07'],*P['compat'],P['stage42']]:
  no(k in g0 and k in g1 and item(a,k)==item(b,k)==g0[k],('protected inherited payload bytes',k))
 no(all(ma[k]==mb[k] for k in P['unchangedManifestFields']),'unauthorized manifest pointer or unordered metadata change')
 for k,v in P['sources'].items():no(stamp(read(b,k))['git']==v['new'],('normal build altered source',k))
 pa,pb=(json.loads(read(r,m['project'])) for r,m in ((a,ma),(b,mb)))
 no(len(pa['stages'])==len(pb['stages'])==len(pa['stageLibraries'])==len(pb['stageLibraries'])==50 and pa['stages']==pb['stages'],'all 50 stage maps not preserved')
 canon=copy.deepcopy(pb);canon['stageLibraries'][31]=pa['stageLibraries'][31]
 if 'assetPaths' in canon:
  no(len(canon['assetPaths']['stageLibraries'])==50,'native chapter metadata does not have 50 stages')
  canon['assetPaths']['stageLibraries'][31]=pa['assetPaths']['stageLibraries'][31]
 no(canon==pa and pb['stageLibraries'][31]==P['stage32New'] and pa['compatibility32']==pb['compatibility32'] and pa['compatibility33']==pb['compatibility33'],'compiler campaign data changed outside exact Stage32 packet')
 no(all(item(b,k)==g0[k] for k in pa['stages']+pa['stageLibraries'][:31]+pa['stageLibraries'][32:]),'protected chapter bytes mismatch')
 common=[(pos,ak,bk) for pos,(ak,bk) in enumerate(zip(ma['common'],mb['common']),1) if ak!=bk]
 no(len(ma['common'])==len(mb['common']) and [(role(ak),role(bk)) for _,ak,bk in common]==[(f'web/runtime/ordered-common-{n}.js',)*2 for n in (4,12)],'expected ordered common4/common12 only')
 no(g1[common[0][2]]==P['approvedR6ProfileBytes'],'joined common4 not exact already qualified R6')
 for ak,bk in [(ma['project'],mb['project']),(ma['gameEntry'].split('?')[0],mb['gameEntry'].split('?')[0]),(ma['workshopEntry'].split('?')[0],mb['workshopEntry'].split('?')[0]),(ma['playtest'].split('?')[0],mb['playtest'].split('?')[0])]:
  no(ak in lost and bk in adds and role(ak)==role(bk),'normal compiled entry linkage not exact')
 put(w,'GRAPH.json',{'status':'EXACT_LOCALHOST_NORMAL_CANDIDATE_CLOSURE','base':P['head'],'noDeploy':True,'active':len(g0),'immutablePhysical':len(immutable),'added':adds,'displaced':lost,'ordered':common,'all50Maps49OtherPacketsExact':True,'priorStage07And42Exact':True,
                     'BPaths':{k:stamp(read(b,k)) for k in sorted(set(adds)|stable)}})
def finish(w):
 b=w/'B'
 def get(k):return json.loads((w/'OUT'/k).read_bytes())
 no(get('stage32/BROWSER.json')['status']=='PASS_ACTUAL_R10_PENDING_ART_REVIEW','Stage32 actual art review screen proof failed')
 no(get('stage32/RESUME.json')['status']=='PASS_ACTUAL_STAGE32_R10_ARCHIVED_CURRENT_AND_NEW_COLD_RESUME_PC_M_NO_DEPLOY','Stage32 actual historic and latest saves failed')
 no(get(P['stage33Receipt']['file'])['status']==P['stage33Receipt']['status'],'Stage33 actual restore or peer/Workshop gates failed')
 g=get('GRAPH.json');x={**g['BPaths'],**{k:stamp(read(b,k)) for k in P['sources']}}
 temp=w/'OUT'/'NORMAL-COMBINED-B-PENDING-REVIEW-NO-DEPLOY.zip'
 with zipfile.ZipFile(temp,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=3)as z:
  for k,v in sorted(x.items()):
   data=read(b,k);no(stamp(data)==v,('normal candidate changed after browser',k));z.writestr(k,data)
 put(w,'SEAL.json',{'status':'PASS_STAGE32_STAGE33_NATIVE_POST07_INTEGRATION_REVIEW_REQUIRED_NO_DEPLOY','base':P['head'],'QAHead':os.environ['GITHUB_SHA'],'baseTree':P['tree'],
  'artifact':{temp.name:val(temp.read_bytes())},'files':x,'noDeploy':True})
if __name__=='__main__':{'pre':main,'graph':graph,'seal':finish}[sys.argv[1]](Path(sys.argv[2]))
