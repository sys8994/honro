"""One normal Stage32+33 B, never mutate a branch or construct a release."""
import copy,hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent; Q=D.parents[1]; P=json.loads((D/'AUTHORITY.json').read_bytes())
M='web/manifest.json'
def no(x,error):
 if not x:raise RuntimeError(error)
def git(at,*args):return subprocess.check_output(['git','-C',str(at),*args],text=True,timeout=150).strip()
def worktree_changes(at, *, observe_normal_cleanup=False):
 raw=subprocess.check_output(['git','-C',str(at),'status','--porcelain=v1','-z','--untracked-files=all'],timeout=120)
 rows=raw.decode('utf-8').split('\0'); no(rows[-1]=='','unterminated status output')
 result=set()
 for x in rows[:-1]:
  no(len(x)>3 and x[2]==' ' and x[:2] in ((' M','??',' D') if observe_normal_cleanup else (' M','??')),('unexpected Git XY/path',x))
  name=x[3:]
  no(re.fullmatch('[A-Za-z0-9_./-]+',name) and (x[:2].strip()+' '+name) not in result,('unsafe/duplicate changed path',name))
  result.add(x[:2].strip()+' '+name)
 return result
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
 actual=worktree_changes(b)
 expected={'M '+f if x['old'] else '?? '+f for f,x in P['sources'].items()}
 put(w,'SOURCE-STATUS.json',{'observed':sorted(actual),'expected':sorted(expected),'exact':actual==expected})
 no(actual==expected,'unexpected product source changed before build')
 put(w,'STAGE33-AUTHORITY.json',{'enabled':True,'base':dict(head=P['head'],tree=P['tree'],manifest=P['manifest'],registry=P['immutable'],pagesRun=P['pages']['run'],pagesJob=P['pages']['job'],publishedAt=P['pages']['utc'])})
 put(w,'SOURCE.json',{'status':'EXACT_3_SOURCE_UNION','base':P['head'],'qaHead':h,'baseTree':P['tree'],'pages':P['pages'],'sources':P['sources'],'stage07':P['stage07']})
def role(s):return re.sub(r'\.[0-9a-f]{16}(?=\.[^.]+$)','',s)
def item(r,v):return val(read(r,v))
def pinset(m):
 x={row['path']:{k:row[k] for k in ['bytes','sha256']} for row in m['files']}
 no(len(x)==len(m['files']),'duplicate active registry paths');return x
def prior_registry(m):
 registry={}
 for row in [*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(x for gen in m['publishedGenerations']for x in gen['files'])]:
  k=row['path'];pin={x:row[x]for x in ('bytes','sha256')}
  no(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k) and (k not in registry or registry[k]==pin),'unsafe/conflicting retained immutable')
  registry[k]=pin
 return registry
def planned_cleanup(a,b,ma,mb,reg,w):
 for path,v in P['retentionSource'].items():
  no(stamp(read(a,path))['git']==stamp(read(b,path))['git']==v,('stock retention driver/source drift',path))
 times=[int((w/'OUT'/('BUILD-'+edge+'-MS')).read_text())for edge in ('START','END')]
 no(0<times[0]<=times[1] and times[1]-times[0]<=600000,'bad captured normal build clock')
 tool="""import {pathToFileURL} from 'node:url';import {readFileSync as fs} from 'node:fs';
 const [src,pa,pb,t0,t1]=process.argv.slice(1);const [a,b]=[pa,pb].map(p=>JSON.parse(fs(p)));
 const {planWebAssetRetention,selectPublishedGenerations}=await import(pathToFileURL(src));
 const plan=now=>({...planWebAssetRetention(a,b.files,{now}),publishedGenerations:selectPublishedGenerations(a.publishedGenerations,{now})});
 console.log(JSON.stringify([plan(+t0),plan(+t1)]));"""
 lo,hi=json.loads(subprocess.check_output(['node','--input-type=module','-e',tool,str(a/'shared/web-retention.mjs'),str(a/M),str(b/M),*[str(t)for t in times]],timeout=90))
 no(lo==hi,'retention expiry crossed during the actual normal build; no promotion')
 for k in ('previousFiles','previousGenerations','publishedGenerations'):
  no(lo[k]==mb[k],('exact stock compiler metadata pruning not observed',k))
 known={x['sourceSha']for x in ma['publishedGenerations']}
 obsolete={}
 for row in lo['obsoleteFiles']:
  k=row['path'];seen={x:row[x]for x in ('bytes','sha256')}
  no(k not in obsolete and k in reg and seen==reg[k] and item(a,k)==seen,('obsolete is not prior known exact immutable',k))
  obsolete[k]=seen
 expiry=sorted(known-{x['sourceSha']for x in lo['publishedGenerations']})
 digest=''.join(f"{k}\t{v['bytes']}\t{v['sha256']}\n" for k,v in sorted(obsolete.items())).encode()
 no({'count':len(obsolete),'bytes':sum(x['bytes']for x in obsolete.values()),'sha256':val(digest)['sha256'],'expiredMetadata':expiry}==P['expectedCleanup'],'stock retention result differs from exact e702 observed prior scope')
 return {'clock':times,'obsolete':obsolete,'expiredMetadata':expiry}
def restore_disposable(a,b,deletions,planned,immutable,active):
 no(deletions==set(planned) and deletions<=set(immutable)-set(active),'actual removals do not exactly match stock retention plan or are active/nonregistry paths')
 no(all(not (b/k).exists() and not (b/k).is_symlink() for k in deletions),'tracked removed paths no longer physically absent')
 # Compare all still-present historic bodies before any write, including unaffected active assets.
 no(all(item(b,k)==v for k,v in immutable.items() if k not in deletions),'historical bytes unexpectedly modified before restoration')
 no(all(immutable[k]==planned[k]==item(a,k) for k in deletions),'exact original A bytes changed')
 for k in sorted(deletions):
  dest=b/k
  no(dest.parent.resolve().is_relative_to(b.resolve()) and dest.parent.is_dir() and not dest.parent.is_symlink(),('unsafe restore directory',k))
  with dest.open('xb') as f:f.write(read(a,k))
def graph(w):
 a,b=w/'A',w/'B';ma,mb=(json.loads(read(r,M)) for r in (a,b));g0,g1=(pinset(t) for t in (ma,mb))
 adds=sorted(set(g1)-set(g0));lost=sorted(set(g0)-set(g1));shared=[k for k in g0.keys()&g1.keys() if g0[k]!=g1[k]]
 put(w,'ACTIVE-PREVIEW.json',dict(added=adds,displaced=lost,changedShared=sorted(shared),active=[len(g0),len(g1)]))
 no(len(g0)==len(g1)==P['active'] and len(adds)==len(lost)==len(P['expectedRoles']) and set(map(role,adds))==set(map(role,lost))==set(P['expectedRoles']) and not shared,'wrong exact regroup/same-path active bytes')
 no(all(item(b,k)==g1[k] and g1[k]['sha256'][:16] in k for k in adds),'normal content-addressed affected files')
 no(adds==P['r2Active']['added'] and lost==P['r2Active']['displaced'],'exact independently authenticated R2 active outputs drifted')
 diff=worktree_changes(b,observe_normal_cleanup=True)
 stable={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
 allow={'M '+x for x in stable}|{'M '+k if x['old'] else '?? '+k for k,x in P['sources'].items()}|{'?? '+k for k in adds}
 deleted={x[2:] for x in diff if x.startswith('D ')}
 put(w,'PRE-RESTORE-GIT.json',{'status':sorted(diff),'deleted':sorted(deleted),'allowedPostRestoreNoDeletions':sorted(allow)})
 no((diff-{'D '+x for x in deleted})<=allow and all('?? '+k in diff for k in adds),'unexpected status outside normal active/source')
 immutable=prior_registry(ma)
 no(len(immutable)==P['immutable'] and len(ma['publishedGenerations'])==50,'wrong exactly attested published registry')
 raw_normal=read(b,M)
 cleanup=planned_cleanup(a,b,ma,mb,immutable,w)
 restore_disposable(a,b,deleted,cleanup['obsolete'],immutable,g1)
 no(worktree_changes(b)==diff-{'D '+x for x in deleted},'immutable-only restoration altered some other byte/status')
 no(read(b,M)==raw_normal and all(item(b,k)==v for k,v in immutable.items()) and all(item(b,k)==g1[k] for k in adds),'all historical/normal asset bytes not preserved')
 put(w,'RETENTION-BUILD.json',{'status':'NATIVE_CLEANUP_OBSERVED_EXACT_THEN_SCRATCH_REPAIRED','clock':cleanup['clock'],'expiredMetadata':cleanup['expiredMetadata'],
  'policy':P['retentionSource'],'planExact':True,'previousAllowedOnly':True,'actualDeletedAndRestored':{k:immutable[k]for k in sorted(deleted)},'retainedAll':len(immutable),'rawGeneratedManifestIdentical':val(raw_normal)})
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
