"""Read authority, make detached QA arm worktrees only, and verify rebuilt stock."""
import os,sys
from pathlib import Path
from guard import facts,read,obj,txt,git,save,inventory,BASE,TREE,CANON,P
BR='refs/heads/qa/stage33-r3-2c4-normal'
QA='tools/stage33-r3-product'
FILES={'.github/workflows/stage33-r3-2c4-normal.yml',*(f'{QA}/{n}' for n in ('PINS.json','POSES.json','RECIPE.json','prepare.mjs','guard.py','metrics.py','park.js','capture.py','review.py','preflight.py'))}
def pre(w):
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve(); head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',BR)
 assert txt(root,'rev-list','--parents','-1',head).split()==[head,BASE]
 assert txt(root,'rev-parse',BASE+'^{tree}')==TREE and not git(root,'status','--porcelain=v1','-z')
 assert set(txt(root,'diff','--name-status','--no-renames',BASE,head).splitlines())=={'A\t'+f for f in FILES}
 assert all(txt(root,'ls-tree',head,'--',f).split()[:2]==['100644','blob'] for f in FILES)
 assert facts(git(root,'show',BASE+':'+CANON))==P['manifest']
 for k in ('A','stock-rebuild','B'):git(root,'worktree','add','--detach',str(w/k),BASE)
 save(w/'out'/'GATE.json',{'base':BASE,'tree':TREE,'head':head,'onlyAdded':sorted(FILES),'scope':'isolated QA-only, no publication'})
def stock(w):
 a,b=w/'A',w/'stock-rebuild'
 for r in (a,b):
  assert txt(r,'rev-parse','HEAD')==BASE and txt(r,'rev-parse','HEAD^{tree}')==TREE and not txt(r,'branch','--show-current')
 z=[obj(read(r,CANON))for r in (a,b)]
 drop=('previousFiles','previousGenerations')
 assert {k:v for k,v in z[0].items()if k not in drop}=={k:v for k,v in z[1].items()if k not in drop},'normal stock build active graph or published registry is not the exact baseline'
 for path,f in inventory(z[0]).items():
  assert all(facts(read(r,path))==f for r in(a,b)),path
 for x in ('HONRO.html','HONRO_WORKSHOP.html','index.html'):
  assert read(a,x)==read(b,x),x
 save(w/'out'/'STOCK-BUILD.json',{'standardBuildActiveAndShellExact':True,'protectedPublishedRecords':len(z[0]['publishedGenerations']),'activeAssets':len(z[0]['files']),'separateExactPublishedBaselineServed':True})
if __name__=='__main__':
 w=Path(sys.argv[2]).resolve(); rr=Path(os.environ['RUNNER_TEMP']).resolve()
 assert w!=rr and w.is_relative_to(rr) and (w/'out').is_dir()
 {'pre':pre,'stock':stock}[sys.argv[1]](w)
