"""Local setup and audit only. Does not fetch, build, launch, or write refs; uses isolated detached worktree metadata for B."""
import hashlib,json,os,re,subprocess,sys,tarfile,tempfile
from pathlib import Path
D=Path(__file__).resolve().parent
def need(k,msg):
 if not k:raise RuntimeError(msg)
def read(p):return json.loads(p.read_bytes())
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def fact(data):return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def authorization(pins):
 base=read(D/'PINS.json');p=read(pins);need(p.pop('enabled',None) is True,'DISABLED: explicit root-local authorization needed')
 base.pop('enabled');need(p==base,'only enable flag can change in copied authorization')
 return p
def git(repo,*args):return subprocess.check_output(['git','-C',str(repo),*args],timeout=60).decode().strip()
def original(root,p):
 v=(root/'web/manifest.json').read_bytes()
 need({**fact(v),'git':blob(v)}==p['base']['manifest'],'wrong original web manifest')
 for f,r in p['source'].items():need(blob((root/r['path']).read_bytes())==r['stock'],'wrong original source '+f)
def verify_detached(w,p):
 root=w/'B';meta=root/'.git';b=p['base']
 need(meta.is_file() and not meta.is_symlink() and meta.read_text().startswith('gitdir: '),'missing real Git-managed scratch B')
 head=git(root,'rev-parse','HEAD');tree=git(root,'rev-parse','HEAD^{tree}')
 sym=subprocess.run(['git','-C',str(root),'symbolic-ref','-q','HEAD'],capture_output=True,timeout=25)
 need(head==b['head'] and tree==b['tree'] and sym.returncode==1 and not sym.stdout and not sym.stderr,
      'B is not detached at exact historical parent')
 need(Path(git(root,'rev-parse','--show-toplevel')).resolve()==root and not git(root,'diff','--cached','--name-only'),
      'wrong isolated B, or staged writes')
 return {'bHead':head,'bHeadTree':tree,'bDetached':True,'bOwnToplevel':True,'indexUnchanged':True}
def setup(w,repo,p):
 need(not w.exists() and w.is_relative_to(Path('/tmp')),'use fresh dedicated /tmp path only')
 b=p['base'];need(git(repo,'rev-parse',b['head']+'^{tree}')==b['tree'],'missing/wrong read-only exact f6 Git object')
 qHead=git(repo,'rev-parse','HEAD');qStatus=git(repo,'status','--porcelain','--untracked-files=all')
 need(not qStatus,'original QA checkout must start pristine')
 w.mkdir();(w/'out').mkdir()
 with tempfile.TemporaryFile() as t:
  subprocess.run(['git','-C',str(repo),'archive',b['head']],stdout=t,check=True,timeout=180)
  t.seek(0);root=w/'A';root.mkdir()
  with tarfile.open(fileobj=t)as tf:tf.extractall(root,filter='data')
 original(w/'A',p)
 # Reuse local Git objects (including true commit/tree) with hooks and prompts disabled.
 B=w/'B';env={**os.environ,'GIT_TERMINAL_PROMPT':'0','GIT_NO_LAZY_FETCH':'1'}
 subprocess.run(['git','-C',str(repo),'-c','core.hooksPath=/dev/null','-c','maintenance.auto=false','worktree','add','--detach',str(B),b['head']],
                check=True,timeout=180,env=env)
 worktree=verify_detached(w,p);original(B,p)
 need(not git(B,'status','--porcelain','--untracked-files=all'),'B exact Git checkout was not pristine')
 for f,r in p['source'].items():
  n=(D/'signed'/f).read_bytes()
  need(blob(n)==r['candidate'] and fact(n)=={k:r[k] for k in ('bytes','sha256')},'wrong prototype '+f)
  (B/r['path']).write_bytes(n)
 paths=set(git(B,'diff','--name-status','--no-renames').splitlines())
 want={'M\t'+r['path'] for r in p['source'].values()}
 need(paths==want and not git(B,'ls-files','--others','--exclude-standard'),'B exact two-source patch or unrelated new path missing')
 same=git(repo,'rev-parse','HEAD')==qHead and git(repo,'status','--porcelain','--untracked-files=all')==qStatus
 need(same,'QA checkout changed')
 write(w/'out'/'WORKTREE.json',{**worktree,'aHasNoGitMetadata':not (w/'A'/'.git').exists(),'qaCheckoutHead':qHead,
      'qaCheckoutPristine':same,'bSourceOnlyBeforeBuild':sorted(x.split('\t',1)[1] for x in paths),'postBuildVerified':False})
 write(w/'out'/'SOURCE.json',{'A':b,'B':p['source'],'deploy':False})
def closure(w,p):
 A,B=w/'A',w/'B';original(A,p)
 for r in p['source'].values():need(blob((B/r['path']).read_bytes())==r['candidate'],'wrong post-build prototype source')
 def snapshot(root):
  m=read(root/'web/manifest.json')
  a={r['path']:{k:r[k] for k in ('bytes','sha256')}for r in m['files']}
  need(len(a)==len(m['files'])==811 and all(re.fullmatch(r'[\w.\-/]+',k) and k.startswith('web/') and not set(k.split('/'))&{'..','.'} for k in a),'unsafe/duplicate/changed active closure')
  for k,v in a.items():
   file=root/k;need(file.is_file() and not file.is_symlink() and fact(file.read_bytes())==v,'compiled bytes differ '+k)
  return {'manifest':m,'active':a,'shell':fact((root/'HONRO.html').read_bytes()),'workshopShell':fact((root/'HONRO_WORKSHOP.html').read_bytes())}
 a,b=map(snapshot,(A,B));aa,bb=a['active'],b['active'];ma,mb=a['manifest'],b['manifest']
 c=set(aa)&set(bb);need(all(aa[k]==bb[k] for k in c),'immutable active address overwritten')
 displaced=set(aa)^set(bb)
 need(displaced and all(re.fullmatch(r'web/(runtime/ordered-(?:common|game)-\d+|entries/(?:game|workshop))\.[a-f0-9]{16}\.(?:html|js)',k) for k in displaced),'detected unrelated generated output')
 ca=read(A/ma['project']);need(ma['project']==mb['project'] and ma['project'] in c and len(ca['stages'])==len(ca['stageLibraries'])==50 and set(ca['stages']+ca['stageLibraries'])<=c,'a stage map or packet changed')
 x=p['stage40'];need(ca['stages'][39]==x['map'] and ca['stageLibraries'][39]==x['descriptorOrPacket'] and all(aa[k]==bb[k]==v for k,v in x['files'].items()),'wrong f6 Stage40 exact split')
 ds=read(A/x['descriptorOrPacket']);needed=x['parts']
 need([k['path'] for k in ds['parts']]==needed and fact(b''.join((A/k).read_bytes() for k in needed))=={k:ds[k] for k in ('bytes','sha256')},'f6 Stage40 complete payload mismatch')
 write(w/'out'/'GRAPH-PRE.json',{'a':a,'b':b,'aonly':sorted(set(aa)-c),'bonly':sorted(set(bb)-c),'same50':True})
if __name__=='__main__':
 need(len(sys.argv)>=4,'usage: local.py {setup|closure} /tmp/fresh-work AUTH.json [known-local-git-root]')
 op,work,auth=sys.argv[1:4];p=authorization(Path(auth));w=Path(work).resolve()
 need(w.is_relative_to(Path('/tmp')),'dedicated /tmp only')
 if op=='setup' and len(sys.argv)==5:setup(w,Path(sys.argv[4]).resolve(),p)
 elif op=='closure' and len(sys.argv)==4:closure(w,p)
 else:raise ValueError('unsupported invocation')
