"""Stage40 C2 exact release-tree assembly. No ref write; use clean disposable checkout only."""
import io,json,hashlib,os,stat,subprocess as s,sys,zipfile
from pathlib import Path
P=json.loads(Path(__file__).with_name('PINS.json').read_bytes());B=P['base'];T=P['baseTree'];A=P['aliases'];S=P['source'];M='web/manifest.json';SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
def need(x,m):
 if not x:raise RuntimeError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(('blob '+str(len(b))+'\x00').encode()+b).hexdigest()
def git(d,*args):
 e={k:v for k,v in os.environ.items() if k not in ('GH_TOKEN','GITHUB_TOKEN','RELEASE_TOKEN') and not k.startswith('GIT_CONFIG_')}
 return s.check_output(['git','-C',str(d),'--no-optional-locks',*args],env=e,text=True,timeout=150).strip()
def at(d,k):
 p=d/k;need(p.resolve()==p and p.is_file() and stat.S_ISREG(p.lstat().st_mode),'unexpected path '+k);return p.read_bytes()
def reg(m):
 out={}
 rows=m['files']+m['previousFiles']+sum(m['previousGenerations'],[])+[r for g in m['publishedGenerations'] for r in g['files']]
 for r in rows:
  k=r['path'];need(k.startswith(('web/data/','web/runtime/','web/entries/','web/graphics/','web/fonts/','web/styles/')) and '/' not in k[4:].split('/',1)[-1] and '\\' not in k and '..' not in k,'invalid manifest path '+k)
  f={i:r[i]for i in('bytes','sha256')};need(k not in out or out[k]==f,'registry duplicate with different bytes');out[k]=f
 return out
def files(m):return {x['path'] for x in m['files']}
def extract(path):
 data=path.read_bytes();need(fact(data)==P['outer'],'native artifact SHA/size')
 with zipfile.ZipFile(io.BytesIO(data)) as z:
  q=z.namelist();need(len(q)==len(set(q)) and sum(i.file_size for i in z.infolist())<35<<20 and z.testzip() is None,'QA artifact invalid')
  b={k:z.read(k) for k in P['proofs']};need({k:sha(v)for k,v in b.items()}==P['proofs'],'wrong native receipts')
  a,n=json.loads(b['NORMAL-GRAPH.json']),json.loads(b['NATIVE-ACCEPTANCE.json'])
  need(a['status']=='PASS_EXACT_C2_CANONICAL_NO_DEPLOY' and a['base']==B and a['aliases']==A,'wrong canonical graph')
  need(n['status']=='PASS_EXACT_CANONICAL_C2_NATIVE_ART_AND_ALL_DEVICE_SAVES' and set(n['cases'])=={'PC','M'},'no actual complete native truth')
  for c in n['cases'].values():
   need(set(c['continue'])=={'H','B','C'} and all(x['reSaved'] and x['routes'] for x in c['continue'].values()) and c['fresh'],'missing device saves/pictures')
  p=b['C2-COMPILED-QA-ONLY.zip'];need(fact(p)==a['normalQaZip'],'wrong inner archive')
 with zipfile.ZipFile(io.BytesIO(p)) as z:
  names=SHELL|set(A.values())|{M};need(len(z.namelist())==11 and set(z.namelist())==names and sum(i.file_size for i in z.infolist())<16<<20 and z.testzip() is None,'bad compiled bundle')
  return {k:z.read(k) for k in names}
def plan(repo,package,origin_files,out):
 need(git(repo,'remote','get-url','origin')=='https://github.com/sys8994/honro','wrong origin')
 need(git(repo,'ls-remote','--exit-code','origin','refs/heads/master')==B+'\trefs/heads/master','stale live base')
 need(git(repo,'rev-parse',B+'^{tree}')==T and not out.exists(),'wrong stock or receipt path')
 f=extract(package);out.mkdir();w=out/'base'
 git(repo,'-c','core.hooksPath=/dev/null','worktree','add','--detach',str(w),B)
 need(not git(w,'status','--porcelain') and git(w,'rev-parse','HEAD^{tree}')==T,'not clean pinned content')
 oldb=at(w,M);need(fact(oldb)==P['baseManifest'],'entire old manifest is not pinned')
 m,q=json.loads(oldb),json.loads(f[M]); old,act=reg(m),{x['path']:{k:x[k] for k in ('bytes','sha256')} for x in q['files']}
 need(len(old)==1308 and len(act)==808 and set(files(m))-set(files(q))==set(A) and set(files(q))-set(files(m))==set(A.values()),'unexpected manifest transition')
 keep={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 change={'project','gameEntry','workshopEntry','playtest','common','files'}
 need({k:v for k,v in m.items() if k not in change|keep}=={k:v for k,v in q.items() if k not in change|keep},'nonactive runtime manifest changed')
 for k in ('project','gameEntry','workshopEntry'):need(q[k]==A[m[k]],'active root link differs '+k)
 pp=m['playtest'].removesuffix('?embedded=1');need(m['playtest']==pp+'?embedded=1' and q['playtest']==A[pp]+'?embedded=1','embedded path differs')
 need(q['common']==[A.get(x,x) for x in m['common']],'other common runtime changed')
 need(all(fact(at(w,k))==v for k,v in old.items()),'missing prior immutable physical bytes')
 for k,v in act.items(): need(v==(fact(f[k]) if k in f else old.get(k)),'generated active value unauthorized '+k)
 oldProject=json.loads(at(w,m['project'])); newProject=json.loads(f[q['project']])
 ww=list(oldProject['stageLibraries']);ww[39]=A[ww[39]]
 need(len(ww)==50 and len(oldProject['stages'])==50 and newProject=={**oldProject,'stageLibraries':ww},'non-Stage40 campaign changed')
 kept={**q,**{x:m[x] for x in keep}}; prev={r['path'] for r in m['previousFiles']}
 kept['previousFiles']=[*m['previousFiles'],*(dict(path=k,**old[k]) for k in sorted(old) if k not in act and k not in prev)]
 final=reg(kept);need(len(final)==1315 and all(final[k]==x for k,x in old.items()),'previous immutable lost')
 f[M]=(json.dumps(kept,ensure_ascii=False,indent=2)+'\n').encode()
 for k,v in S.items():
  dest=w/k
  need((dest.exists() and blob(at(w,k))==v['before']) if v['before'] else not dest.exists(),'canonical source moved '+k)
  f[k]=at(origin_files,k);need(blob(f[k])==v['after'],'approved source SHA mismatch '+k)
 additions=set(A.values())|{k for k,v in S.items() if v['before'] is None}
 for k,v in f.items():
  p=w/k;need(p.resolve()==p and not p.is_symlink() and p.exists()==(k not in additions),'unexpected destination '+k);p.write_bytes(v)
 need(all(fact(at(w,k))==x for k,x in final.items()),'final literal retention failed')
 git(w,'add','--',*sorted(f)); want={'A\t'+k for k in additions}|{'M\t'+k for k in f if k not in additions}
 need(len(want)==13 and set(git(w,'diff','--cached','--name-status','--no-renames',B).splitlines())==want,'unexpected candidate stage')
 tree=git(w,'write-tree');print(tree)
 (out/'ASSEMBLY.json').write_text(json.dumps({'status':'PLAN_ONLY_NO_COMMIT_NO_PUSH','base':B,'tree':tree,'files':{k:{**fact(v),'git':blob(v)} for k,v in f.items()},'diff':sorted(want),'retained':len(final)},indent=2)+'\n')
if __name__=='__main__':
 need(P['enabled'] and len(sys.argv)==5,'disabled or wrong invocation')
 plan(*(Path(x).resolve() for x in sys.argv[1:]))
