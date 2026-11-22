"""Stage42 independent bridge; intentionally disabled until the actual joint Pages base is pinned."""
from guard import P,A,H,M,PR,IDX,SRC,rd,fact,blob,save,git,edit_range
from pathlib import Path
import json,re,sys
h=lambda v:bool(isinstance(v,str) and re.fullmatch('[0-9a-f]{40}',v))
def exact_file(root,pin,name):
 raw=rd(root,name)
 assert len(raw)==pin['bytes'] and blob(raw)==pin['git'],name
 return raw
def parent(a,b):
 assert P['enabled'] is True and all(h(A[n])for n in ('head','tree'))
 assert A['pages']['conclusion']=='success' and A['pages']['head']==A['head']
 assert all(A['pages'][x]for x in ('id','job','publishedAt'))
 assert git(a,'rev-parse','HEAD')==git(b,'rev-parse','HEAD')==A['head']
 assert git(a,'rev-parse','HEAD^{tree}')==git(b,'rev-parse','HEAD^{tree}')==A['tree']
 assert not git(a,'status','--porcelain=v1'),'locked exact current A'
 exact_file(a,A['manifest'],M)
def pre(a,b,w):
 parent(a,b)
 assert fact(rd(a,A['packet']['42']))==P['packetA']
 assert blob(rd(a,PR['path']))==PR['stockGit']
 nxt=rd(b,PR['path']);assert blob(nxt)==PR['candidateGit'] and fact(nxt)['sha256']==PR['candidateSHA256'],'insert exact combined profile before Stage42 author'
 assert all(len(rd(a,x['file']))==x['bytes'] and blob(rd(a,x['file']))==x['git']for x in A['source'])
 n=rd(a,SRC['file']);assert rd(b,SRC['file'])==n
 ledger=json.loads(rd(a,'shared/data/terrain-path-optimization.json'))
 assert not any(x['id']==P['asset'] for x in ledger),'Stage42 source unexpectedly governed by terrain optimization ledger'
 new=edit_range(n)
 assert blob(new)==P['sourceCandidate']['git'] and len(new)==P['sourceCandidate']['bytes']
 (b/SRC['file']).write_bytes(new);(w/'out').mkdir(parents=True,exist_ok=True)
 save(w,'SOURCE.json',{'base':A['head'],'file':SRC['file'],'previous':{**fact(n),'git':blob(n)},'candidate':{**fact(new),'git':blob(new)},'combinedProfile':{**fact(nxt),'git':blob(nxt)}})
def graph(a,b,history,w):
 parent(a,b)
 assert git(history,'rev-parse','HEAD')==H['head'] and git(history,'rev-parse','HEAD^{tree}')==H['tree']
 exact_file(history,H['manifest'],M)
 pa=A['packet']['42'];pb='web/data/chapter-42-assets.'+P['packetB']['sha256'][:16]+'.json'; mp=A['map']['42']
 assert fact(rd(a,pa))==fact(rd(history,pa))==P['packetA'] and fact(rd(b,pb))==P['packetB']
 routes={}; projects={}
 for k,t,packet in [('A',a,pa),('B',b,pb),('H',history,pa)]:
  m=json.loads(rd(t,M));e=m['gameEntry'].split('?')[0];project=m['project'];p=json.loads(rd(t,project));projects[k]=p
  assert len(p['stages'])==50 and len(p['stageLibraries'])==50 and p['stages'][IDX]==mp and p['stageLibraries'][IDX]==packet
  rr=re.findall(rb'\.\./runtime/(campaign\.[a-f0-9]{16}\.js)',rd(t,e));assert len(rr)==1
  loader='web/runtime/'+rr[0].decode()
  assert Path(project).name.encode() in rd(t,loader)
  prof=next(f for f in m['common']if '/ordered-common-4.'in f)
  if k=='A':
   assert (e,loader,project,prof)==(A['entry'],A['loader'],A['campaign'],PR['expectedOldChunk'])
  if k=='B':
   s=rd(t,prof)
   assert all(x in s for x in (b'needsLegacy32Art',b'needsLegacy33Art',b'stage46LosslessRef',b'mayRestoreStage42CompactedArt',PR['previous'].encode(),PR['current'].encode()))
  if k=='H':
   assert (e,loader,project)==(H['entry'],H['loader'],H['campaign'])
  refs=(e,loader,project,mp,packet,prof)
  i={x['path']:{z:x[z] for z in ('bytes','sha256')}for x in m['files']}
  routes[k]={f:fact(rd(t,f))for f in ('HONRO.html',*refs)}
  assert all(routes[k][f]==i[f]for f in refs)
 x,y=projects['A'],projects['B']
 assert x['stages']==y['stages'] and rd(a,mp)==rd(b,mp)==rd(history,mp)
 unchanged=[j for j in range(50)if j not in (31,IDX)]
 assert all(x['stageLibraries'][j]==y['stageLibraries'][j] and rd(a,x['stageLibraries'][j])==rd(b,y['stageLibraries'][j]) for j in unchanged)
 peers={n:{'map':x['stages'][n-1],'packet':x['stageLibraries'][n-1]}for n in (21,33,40,46)}
 for v in peers.values():assert rd(a,v['map'])==rd(b,v['map'])
 save(w,'GRAPH.json',{'routes':routes,'signed48OtherStagePackets':True,'signed50MapRoutes':True,'exactStage42Map':mp,
 'peerRoutes':peers,'BPacket':pb,'stockPacket':pa,'BPacketBytes':P['packetB']['bytes'],'scope':'Stage32 isolated peer proof owns its separate changed route; no product write'})
if __name__=='__main__':
 method,*pp=sys.argv[1:]
 {'pre':pre,'graph':graph}[method](*map(Path,pp))
