"""Read-only exact published bytes in one detached A checkout; no candidate/build."""
import hashlib,json,os,subprocess,sys
from pathlib import Path
Q=Path(__file__).resolve().parent
P=json.loads((Q/'PINS.json').read_bytes())
MF='web/manifest.json'
QA={'.github/workflows/stage28-stock-warm.yml',*(f'tools/stage28-stock-warm/{s}'for s in ('PINS.json','guard.py','capture.py','sequence.py','park.js','observe.js','stock-observer.json'))}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def stamp(b):return {**facts(b),'git':hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()}
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=140)
def save(f,x):f.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def rd(r,k):
 assert not k.startswith('/') and not ({'?', '#'}&set(k)) and '..' not in Path(k).parts
 x=r/k;assert x.resolve().is_relative_to(r) and not x.is_symlink();return x.read_bytes()
def guard(w):
 assert not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 root=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA'];base=P['base']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(P['repo'],'push',P['branch'])
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert git(root,'rev-list','--parents','-n1','HEAD').decode().split()==[head,base]
 assert git(root,'rev-parse',base+'^{tree}').decode().strip()==P['tree']
 assert not git(root,'status','--porcelain=v1','-z')
 assert set(git(root,'diff','--name-status','--no-renames',base,head).decode().splitlines())=={f'A\t{k}'for k in QA}
 for k in QA: assert git(root,'ls-tree',head,'--',k).decode().split()[:2]==['100644','blob']
 for k,v in P['originalObserver'].items():assert sha(rd(Q,k))==v
 a=w/'A';git(root,'worktree','add','--detach',str(a),base)
 assert git(a,'rev-parse','HEAD^{tree}').decode().strip()==P['tree'] and not git(a,'status','--porcelain=v1','-z')
 assert stamp(rd(a,P['sourcePath']))==P['sourceA']
 mf=rd(a,MF);assert stamp(mf)==P['manifest']
 m=json.loads(mf)
 active={r['path']:{k:r[k]for k in ('bytes','sha256')}for r in m['files']}
 assert len(m['files'])==len(active)==810
 for name, expected in active.items():assert facts(rd(a,name))==expected,name
 runtime=P['baseCompiledRuntime']
 assert active[runtime]==P['nativeRuntime'] and runtime in m['common']
 required=P['reference']['requests']
 for k,v in P['shells'].items():assert facts(rd(a,k))==v
 for k,v in required.items():assert facts(rd(a,k))==v and (k=='HONRO.html'or active[k]==v)
 save(w/'out/GRAPH.json',{'acb':base,'tree':P['tree'],'qaHead':head,'exactManifest':P['manifest'],'runtime':runtime,'nativeRuntime':P['nativeRuntime'],'active':{**active,**{MF:facts(mf),**P['shells']}}})
if __name__=='__main__':guard(Path(sys.argv[1]).resolve())
