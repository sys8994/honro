"""Stage17 actual AA-footprint confirmation shape. QA only."""
import json,hashlib,os,sys
from pathlib import Path
H=Path(__file__).resolve().parent
sys.path.insert(0,str(H.parent/'stage17-west-recess'))
import guard as native
P=json.loads((H/'SCOPE.json').read_bytes())
ROOT=native.ROOT; BASE=native.B
NATIVE='c0db5119816c7e58f3a52b0d57c2dec30821da1b'
REF='refs/heads/qa/stage17-footprint-confirmation-2c4'
QA={'.github/workflows/stage17-footprint.yml',*['tools/stage17-footprint/'+x for x in ('scope.py','probe.py','SCOPE.json','rect-atlas.js')]}
def own(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',REF)
 h=os.environ['GITHUB_SHA'];git=native.git
 assert git(ROOT,'rev-parse','HEAD').decode().strip()==h and git(ROOT,'status','--porcelain=v1','-z')==b''
 for old,new,files in ((BASE,NATIVE,native.QA),(NATIVE,h,QA)):
  assert git(ROOT,'rev-list','--parents','-n1',new).decode().split()==[new,old]
  assert set(git(ROOT,'diff','--no-renames','--name-status',old,new).decode().splitlines())=={'A\t'+k for k in files}
  assert all(git(ROOT,'ls-tree',new,'--',k).decode().split()[:2]==['100644','blob']for k in files)
 assert git(ROOT,'rev-parse',BASE+'^{tree}').decode().strip()==native.TREE
 return h
native.auth=own
def build(w):
 native.compiled(w)
 g=json.loads((w/'out/GRAPH.json').read_bytes())
 s=hashlib.sha256(json.dumps(g,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()
 assert s==P['graphSHA256'],'normal graph differs from R2 real asset inputs'
if __name__=='__main__':{'pre':native.pre,'built':build}[sys.argv[1]](Path(sys.argv[2]).resolve())
