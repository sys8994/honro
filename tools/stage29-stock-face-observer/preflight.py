"""Exact detached Stage29 stock only. The R6 parent is an observer dependency, not candidate B."""
import json,os,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'stage28-poster-native'))
import guard as r6
BASE=r6.P['base'];TREE=r6.P['tree']
PARENT='47d9fe32f4210e8d09e74eb97a534cfcae6f3ffd'
PARENT_TREE='0fc99ea52a7a2e324ecd437784b2bf7a1f789add'
BRANCH='refs/heads/qa/stage29-stock-face-observer-acb51'
QA={'.github/workflows/stage29-stock-face-observer.yml',*(f'tools/stage29-stock-face-observer/{i}'for i in ('preflight.py','capture.py','watch.js','PARK-NEAR.js','owner.js'))}
F='web/runtime/ordered-common-17.9a592f68229e4289.js'
CF='web/data/chapter-29-assets.03bec5fbcabe5e35.json'; MAP='web/data/chapter-29.9c23e7ce4d1312d3.json'
OWNER='act3-handoff:29:west-bank'
def pre(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',BRANCH)
 root=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA'];git=r6.git
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert git(root,'rev-list','--parents','-n1','HEAD').decode().split()==[head,PARENT] and git(root,'rev-parse',PARENT+'^{tree}').decode().strip()==PARENT_TREE
 assert git(root,'rev-parse',BASE+'^{tree}').decode().strip()==TREE
 assert not git(root,'status','--porcelain=v1','-z')
 assert set(git(root,'diff','--name-status','--no-renames',PARENT,head).decode().splitlines())=={'A\t'+k for k in QA}
 for k in QA:assert git(root,'ls-tree',head,'--',k).decode().split()[:2]==['100644','blob']
 a=w/'A';git(root,'worktree','add','--detach',str(a),BASE)
 assert not git(a,'status','--porcelain=v1','-z')
 mf=r6.rd(a,r6.MF);assert r6.stamp(mf)==r6.P['manifest']
 m=json.loads(mf);active=r6.inv(m)
 for k,v in active.items():assert r6.facts(r6.rd(a,k))==v,k
 for k,v in r6.P['shells'].items():assert r6.facts(r6.rd(a,k))==v
 fp=r6.rd(a,F);assert b'function faceTile(asset,row,density)'in fp and b'ctx.globalCompositeOperation="destination-in"'in fp
 asset=json.loads(r6.rd(a,CF));r=[x for x in asset if x['id']==OWNER]
 assert len(r)==1 and r[0]['collision']==[] and r[0]['params']['contactMapping'][:2]==[[0,687,0,2700],[205,687,1150,2700]] and r[0]['params']['blendFace'] is True
 floor=next(x for x in json.loads(r6.rd(a,MAP))['terrains']if x['id']=='a3-foundation')
 assert {'x':-500,'y':2611.1328125}in floor['points'] and {'x':0,'y':2700}in floor['points']
 r6.save(w/'out/GRAPH.json',{'base':BASE,'tree':TREE,'runnerHead':head,'active':{**active,**r6.P['shells'],r6.MF:r6.facts(mf)},'owner':OWNER,'required':[CF,MAP,F],
  'historicalActualSource':[44922966956,14715185043], 'nearOldOriginalArtifact':14693595393,'noCandidateOrBuild':True})
if __name__=='__main__':pre(Path(sys.argv[1]).resolve())
