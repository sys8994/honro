"""Read-only runner, exact immutable predecessors and verified R6 normal graph."""
import hashlib,json,os,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'stage28-poster-native'))
import guard as r6
REPO='sys8994/honro'
REF='refs/heads/qa/stage28-stage3-clock-readonly-r6'
HEAD='47d9fe32f4210e8d09e74eb97a534cfcae6f3ffd'
TREE='0fc99ea52a7a2e324ecd437784b2bf7a1f789add'
R6_GRAPH='3c197b0251f30df3fbb4ef5c8b797dc2ff130298bd00acaeccb600b1851d94aa'
T1='shared/runtime/time-of-day.js'
T2='shared/data/timeline.json'
CLOUD_ROLE='web/runtime/ordered-common-16.3d9993bd92d5eb93.js'
CLOUD_FACT={'bytes':177610,'sha256':'3d9993bd92d5eb93572f4b05fe9da2f19d4202c7a3e24ba767a5274ca3364f2c'}
QA={'.github/workflows/stage28-stage3-clock-readonly.yml',*(f'tools/stage28-stage3-clock/{k}' for k in ('preflight.py','control.py','clock.js','observe-cloud.js'))}
def pre(w):
 root=Path(os.environ['GITHUB_WORKSPACE']); h=os.environ['GITHUB_SHA'];git=r6.git;P=r6.P
 assert not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(REPO,'push',REF)
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert git(root,'rev-list','--parents','-n1','HEAD').decode().split()==[h,HEAD]
 assert git(root,'rev-parse',HEAD+'^{tree}').decode().strip()==TREE
 assert git(root,'rev-parse',P['base']+'^{tree}').decode().strip()==P['tree']
 assert not git(root,'status','--porcelain=v1','-z')
 assert set(git(root,'diff','--name-status','--no-renames',HEAD,h).decode().splitlines())=={'A\t'+k for k in QA}
 for k in QA:assert git(root,'ls-tree',h,'--',k).decode().split()[:2]==['100644','blob']
 assert r6.stamp(git(root,'show',P['base']+':'+r6.MF))==P['manifest']
 for name in ('A','B'):
  t=w/name;git(root,'worktree','add','--detach',str(t),P['base'])
  assert git(t,'rev-parse','HEAD').decode().strip()==P['base'] and not git(t,'status','--porcelain=v1','-z')
  assert r6.stamp(r6.rd(t,P['sourcePath']))==P['sourceA']
 (w/'B'/P['sourcePath']).write_bytes(r6.patch(r6.rd(w/'A',P['sourcePath'])))
 assert git(w/'B','diff','--name-status').decode().splitlines()==['M\t'+P['sourcePath']]
 r6.save(w/'out/PREFLIGHT.json',{'r6Head':HEAD,'r6Tree':TREE,'qaHead':h,'productBase':P['base'],'sourceA':P['sourceA'],'sourceB':P['sourceB'],
  'normalGuard':r6.facts((r6.Q/'guard.py').read_bytes()),'historicalR6StillHOLD':True,'releaseAction':False})
def built(w):
 r6.built(w)
 g=json.loads((w/'out/GRAPH.json').read_bytes())
 canonical=json.dumps(g,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()
 assert r6.sha(canonical)==R6_GRAPH, 'complete official R6 graph not exact'
 # The exact active compiled role must have the live cloud and day/night methods,
 # and remain byte-identical between both served compilations.
 for name in ('A','B'):
  root=w/name
  assert g['active'+name][CLOUD_ROLE]==CLOUD_FACT
  s=r6.rd(root,CLOUD_ROLE); assert r6.facts(s)==CLOUD_FACT and b'_honroClouds' in s and b'HonroTimeOfDay' in s and b'performance.now()' in s
  c=r6.rd(root,T1); tl=r6.rd(root,T2)
  assert r6.blob(c)=='0703b87f0c5e28695c642d9d1ed70f8ec76fbee6' and r6.blob(tl)=='20013516c13d45b235a02a930c2ff2842f77b16f'
  assert json.loads(tl)['stages']['3']['start']=='18:50' and b'st.x+=(st.v+4)*dt' in c
 r6.save(w/'out/GRAPH-IDENTITY.json',{'canonicalSHA256':R6_GRAPH,'originalR6ReceiptRawSHA256':'678e8394c958444eb2f704b2f30933268d6aa53eafc415ea689cbef19c9e62db','originalR6Run':44931823134,'originalR6Artifact':14718321360,'role':CLOUD_ROLE,'facts':CLOUD_FACT,'identicalControlledBuild':True})
if __name__=='__main__':{'pre':pre,'built':built}[sys.argv[1]](Path(sys.argv[2]).resolve())
