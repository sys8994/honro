import json,subprocess,sys
from pathlib import Path
from dag import sha,references
D=Path(__file__).resolve().parent;E=json.load(open(D/'expected.json'));B=E['base'];R=E['rendererPath']
def git(cwd,*arg):return subprocess.check_output(['git','-C',str(cwd),*arg],text=True).strip()
def source(root,stock,target,out):
 p=D/'stage09-deep-floor-scratch.patch'
 assert sha(p.read_bytes())==E['patchSha256']
 assert isinstance(B,str) and len(B)==40 and isinstance(E['stockTree'],str) and len(E['stockTree'])==40,'immutable Stage08 product parent not supplied'
 assert git(root,'rev-parse','HEAD^')==B
 paths=['.github/workflows/stage09-native-floor-receipt.yml']+['tools/stage09-native-floor-receipt/'+x for x in ('capture.py','dag.py','expected.json','guard.py','stage09-deep-floor-scratch.patch')]
 assert git(root,'diff','--name-status',B,'HEAD').splitlines()==['A\t'+x for x in paths]
 for w in (stock,target):
  assert git(w,'rev-parse','HEAD')==B and git(w,'rev-parse','HEAD^{tree}')==E['stockTree']
  assert not git(w,'status','--porcelain')
  assert git(w,'hash-object',R)==E['stockBlob']
  assert git(w,'hash-object','tests/stage02-deep-body-tile.mjs')==E['stage2TestBlob']
  assert git(w,'hash-object','tests/stage08-deep-body-tile.mjs')==E['stage8TestBlob']
 git(target,'apply','--check','--index',str(p))
 git(target,'apply','--index',str(p))
 assert git(target,'diff','--cached','--name-status').splitlines()==['M\t'+R]
 assert not git(target,'diff','--name-only')
 assert git(target,'rev-parse',':'+R)==E['candidateBlob'] and git(target,'hash-object',R)==E['candidateBlob']
 (out/'source-pins.json').write_text(json.dumps({'stock':B,'targetBase':B,'sourcePath':R,'exactStockBlob':E['stockBlob'],'exactTargetBlob':E['candidateBlob'],'committedProductEdits':0,'expectedQAOnly':paths},indent=2)+'\n')
def built(roots,out):
 A,Bd=[references(x) for x in roots]
 for label,d in [('stock',A),('target',Bd)]:
  d.pop('referenceDocument')
  (out/(label+'-built-dag.json')).write_text(json.dumps(d,indent=2)+'\n')
 assert A['reachableCount']==E['stockGraphPaths'] and A['reachablePathsSHA256']==E['stockGraphPathSHA256']
 assert A['entry']==E['stockEntry'] and A['htmlSHA256']==E['stockHTML']
 assert A['campaign']==Bd['campaign']==E['shared']
 assert A['reachable'][E['stockCommon15']['path']]==E['stockCommon15']
 for d in (A,Bd):
  for s,x in E['leaf'].items():
   assert d['selected'][int(s)]==x,(s,d['selected'][int(s)],x)
 a,b=A['reachable'],Bd['reachable'];key=lambda k:k.split('.')[-2]
 deleted=sorted(set(a)-set(b));added=sorted(set(b)-set(a))
 same=all(a[k]==b[k] for k in set(a)&set(b))
 assert same and len(deleted)==len(added)==2,(same,deleted,added)
 assert set(deleted)=={A['entry']['path'],E['stockCommon15']['path']},deleted
 new=next(k for k in added if k.startswith('web/runtime/ordered-common-15.'))
 assert set(added)=={Bd['entry']['path'],new}
 h=[(roots[i]/'HONRO.html').read_bytes() for i in (0,1)]
 e=[(roots[i]/d['entry']['path']).read_bytes() for i,d in enumerate((A,Bd))]
 q=A['entry']['path'].encode();assert h[0].count(q)==1 and h[0].replace(q,Bd['entry']['path'].encode())==h[1]
 oa=E['stockCommon15']['path'].rsplit('/',1)[-1].encode();ob=new.rsplit('/',1)[-1].encode()
 assert e[0].count(oa)==1 and e[0].replace(oa,ob)==e[1]
 t=(roots[1]/new).read_text();before=(roots[0]/E['stockCommon15']['path']).read_text()
 assert '_stage9DeepFloorTileLandmark' not in before and '_stage9DeepFloorTileLandmark' in t
 assert '_stage2DeepBodyTileLandmark' in before and '_stage2DeepBodyTileLandmark' in t
 assert t.count('_stage9DeepFloorTileLandmark')==2
 assert all(t.count(k)==before.count(k)==2 for k in ('_stage2DeepBodyTileLandmark','_stage8DeepBodyTileLandmark'))
 (out/'approved-dag-diff.json').write_text(json.dumps({'removed':deleted,'added':added,'allOtherBytesExact':same,'stageLeaves':E['leaf'],'targetCompiledRenderer':new,'stockCompiledRenderer':E['stockCommon15']['path']},indent=2)+'\n')
 if any(not (roots[i]/R).exists() for i in (0,1)):raise RuntimeError('renderer source missing')
 for i,x in enumerate(roots):
  assert git(x,'hash-object',R)==[E['stockBlob'],E['candidateBlob']][i]
if __name__=='__main__':
 mode,*s=sys.argv[1:];p=list(map(Path,s))
 if mode=='source':source(*p)
 elif mode=='built':built(p[:2],p[2])
 else:raise SystemExit(mode)
