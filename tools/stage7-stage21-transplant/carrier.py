"""Exact add-only carrier. Can only prepare local CI worktrees and seal successful QA."""
import json, os, sys, zipfile
from pathlib import Path
from transplant import (HOME, SOURCE, BASE_OLD, check_config, locked_base, prepare, built,
                        git, oid, parse, require, stamp, write)
REF='refs/heads/qa/stage7-closure-after-stage21-42879'
BASE='42879fcbb740fb2167a21e6ec9288bd63432a2f0'
TREE='032ad6463b99a1aa2aec93ab988c6692801dc890'
W=Path(sys.argv[2]).resolve()
C=parse(HOME/'NEXT.json');H=Path(os.environ['GITHUB_WORKSPACE']).resolve()
Q='tools/stage7-stage21-transplant/'
QA={'.github/workflows/stage7-closure-after-stage21.yml',*(Q+k for k in (
 'NEXT.json','NEXT.disabled.json','PINS.json','PREFLIGHT.json','STAGE21-OFFICIAL.json','STAGE35-PUBLIC-BYTES.json',
 'entry.json','native-witness.js','r2-guard-unchanged.py','stage21-control.py','stage21-observer.json','transplant.py','views.py','carrier.py'))}

def guards():
 require(os.environ['GITHUB_REPOSITORY']=='sys8994/honro' and os.environ['GITHUB_REF']==REF and
         os.environ['GITHUB_EVENT_NAME']=='push','wrong non-release carrier event/ref')
 check_config(C,normal_qa=True)
 require(C['base']==BASE and C['baseTree']==TREE and git(H,'rev-list','--parents','-n1',BASE).decode().split()==[BASE,BASE_OLD],
         'unexpected Stage21 parent/root')
 require(oid(H,'HEAD')==os.environ['GITHUB_SHA'] and
         git(H,'rev-list','--parents','-n1','HEAD').decode().split()==[os.environ['GITHUB_SHA'],C['source']],
         'QA carrier not direct child of exact product-only commit')
 require(not git(H,'status','--porcelain=v1','-z'),'dirty CI carrier')
 require(set(git(H,'diff','--no-renames','--name-status',C['source'],'HEAD').decode().splitlines())==
         {'A\t'+k for k in QA},'not exactly add-only strict QA paths')
 require(parse(HOME/'STAGE21-OFFICIAL.json')['common17']==C['stage21']['common17'],'independent prior approved common17 mismatch')
def pre():
 guards();prepare(C,H,W)
def ready():
 guards();built(C,H,W)
def seal():
 guards();locked_base(C,H)
 O=W/'out'
 stage7=parse(O/'BROWSER.json');stage21=parse(O/'STAGE21-CONTROL.json');normal=parse(O/'NORMAL-PINS.json')
 require(stage7['status']=='PASS_EXACT_SCOPED_STAGE7_FALSE_BOTTOM_LINE' and len(stage7['frames'])==14 and
   not stage7['latePixelGateMismatches'],'required Stage7 live A/B not complete')
 require(stage21['complete'] and len(stage21['cases'])==8 and not stage21['mismatches'],'required Stage21 approved control incomplete')
 require(len(normal)==8 and all(stamp((W/'B'/p).read_bytes())==v for p,v in normal.items()),'candidate runtime or manifest bytes drift')
 n=O/'B-EXACT-NORMAL-GENERATED-DELTA-NOT-DEPLOYED.zip'
 with zipfile.ZipFile(n,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in sorted(normal):z.writestr(p,(W/'B'/p).read_bytes())
 with zipfile.ZipFile(n) as z:require(set(z.namelist())==normal.keys() and all(stamp(z.read(p))==v for p,v in normal.items()),'sealed zip mismatch')
 write(O/'NORMAL-SEAL-NOT-PUBLISHED.json',{'activeBase':C['base'],'builtProduct':C['source'],'qaHead':os.environ['GITHUB_SHA'],
   'source':SOURCE,'generated':normal,'notRetainedOrPublished':True,'zip':stamp(n.read_bytes()),'receipts':{
    p:stamp((O/p).read_bytes())for p in ('SOURCE.json','GRAPH.json','BROWSER.json','STAGE21-CONTROL.json')}})

if __name__=='__main__':{'pre':pre,'built':ready,'seal':seal}[sys.argv[1]]()
