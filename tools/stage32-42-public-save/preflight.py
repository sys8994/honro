"""Freeze author/preexisting game and exact historical fixtures before anonymous actual browser."""
import pathlib,hashlib,subprocess as s,json,os,sys
D=pathlib.Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes())
root=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve();w=pathlib.Path(sys.argv[1]).resolve()
R=P['release'];base=R['head']; head=os.environ['GITHUB_SHA']
def n(v,m):
 if not v:raise RuntimeError(m)
def g(*a,cwd=root):return s.check_output(['git',*a],text=True,timeout=100,cwd=cwd).strip()
def f(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def api(k):return json.loads(s.check_output(['gh','api','repos/sys8994/honro/'+k],timeout=90))
n(P['enabled'] and os.environ['GITHUB_REF']==P['qaRef'] and os.environ['GITHUB_EVENT_NAME']=='push','unexpected QA activation')
n(w.is_relative_to(pathlib.Path(os.environ['RUNNER_TEMP']).resolve()) and w.name=='stage32-42-public-save','unsafe worktree')
n(g('rev-list','--parents','-1','HEAD')==head+' '+base and g('rev-parse',base+'^{tree}')==R['tree'],'wrong sole release authority')
adds={'.github/workflows/stage32-stage42-public-save.yml',*(f'tools/stage32-42-public-save/{x}'for x in ['PINS.json','observer.json','preflight.py','probe.py'])}
n(set(g('diff','--name-status','--no-renames',base,head).splitlines())=={'A\t'+p for p in adds} and not g('status','--porcelain'),'non-QA content touched')
p,j,b=api('actions/runs/'+str(R['pages'])),api('actions/jobs/'+str(R['job'])),api('branches/master')
n(p['head_sha']==j['head_sha']==b['commit']['sha']==base and p['conclusion']==j['conclusion']=='success' and j['name']=='deploy' and j['run_id']==R['pages'] and j['completed_at']==R['pagesCompletedUTC'] and any(t['name']=='Deploy to GitHub Pages' and t['conclusion']=='success'for t in j['steps']),'proven exact live Pages required')
for i,v in P['history'].items():
 cwd=w/f'H{i}';master=v['head']
 n(g('rev-parse',master+'^{tree}')==v['tree'],'wrong historical bytes')
 s.run(['git','worktree','add','--detach',str(cwd),master],check=True,timeout=180,cwd=root)
 n(g('rev-parse','HEAD',cwd=cwd)==master and not g('status','--porcelain',cwd=cwd) and f((cwd/'web/manifest.json').read_bytes())==v['manifest'] and f((cwd/'HONRO.html').read_bytes())==v['shell'],'historical source must be exact, frozen')
 n(all(f((cwd/k).read_bytes())==datum for k,datum in v['routes'].items()),'wrong historical served route bytes')
