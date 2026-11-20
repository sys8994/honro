import json,re,subprocess,sys
from pathlib import Path
from dag import sha,references
D=Path(__file__).resolve().parent;E=json.load(open(D/'expected.json'));B=E['base'];R=E['rendererPath'];P=json.load(open(D/'chunks.json'))
def git(cwd,*arg):return subprocess.check_output(['git','-C',str(cwd),*arg],text=True).strip()
def source(root,stock,target,out):
 assert isinstance(B,str) and re.fullmatch(r'[0-9a-f]{40}',B) and isinstance(E['stockTree'],str) and re.fullmatch(r'[0-9a-f]{40}',E['stockTree']),'verified Stage09 product parent pending'
 assert all(isinstance(v,str) and re.fullmatch(r'[0-9a-f]{40}',v) for v in E['protectedTests'].values())
 assert git(root,'rev-parse','HEAD^')==B
 names={'capture.py','dag.py','expected.json','guard.py','snapshot.py','summary.py','recompose.mjs','chunks.json',*(p['patch'] for p in E['patches'])}
 paths=['.github/workflows/deep-four-native-floor-receipt.yml']+['tools/deep-four-native-floor-receipt/'+x for x in sorted(names)]
 assert git(root,'diff','--name-status',B,'HEAD').splitlines()==['A\t'+x for x in paths]
 for w in (stock,target):
  assert git(w,'rev-parse','HEAD')==B and git(w,'rev-parse','HEAD^{tree}')==E['stockTree']
  assert not git(w,'status','--porcelain') and git(w,'hash-object',R)==E['stockBlob']
  assert all(git(w,'hash-object',k)==v for k,v in E['protectedTests'].items())
 for row in E['patches']:
  p=D/row['patch'];assert sha(p.read_bytes())==row['sha256']
  assert git(target,'rev-parse',':'+R)==row['fromGitBlob']
  git(target,'apply','--check','--index',str(p))
  git(target,'apply','--index',str(p))
  assert git(target,'rev-parse',':'+R)==row['toGitBlob']
  assert git(target,'diff','--cached','--name-status').splitlines()==['M\t'+R]
  assert not git(target,'diff','--name-only')
 assert git(target,'rev-parse',':'+R)==E['candidateBlob'] and git(target,'hash-object',R)==E['candidateBlob']
 (out/'source-pins.json').write_text(json.dumps({'stock':B,'targetBase':B,'sourcePath':R,'exactStockBlob':E['stockBlob'],'exactTargetBlob':E['candidateBlob'],'patches':E['patches'],'committedProductEdits':0,'expectedQAOnly':paths},indent=2)+'\n')

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
 assert same and len(deleted)==len(added)==4,(same,deleted,added)
 for mode,g,changed in [('stock',A,deleted),('target',Bd,added)]:
  v=P[mode]
  assert g['entry']==v['entry'] and g['htmlSHA256']==v['htmlSHA256']
  assert set(changed)=={v['entry']['path'],*(x['path']for x in v['chunks'])}
  assert all(g['reachable'][x['path']]==x for x in v['chunks'])
 assert P['stock']['chunks'][0]==E['stockCommon15']
 new=P['target']['chunks'][0]['path']
 # The threshold moved complete source modules. No replacement is allowed
 # without exact official reconstructed binaries and exact URL-only HTML/entry.
 subprocess.run(['node',str(D/'recompose.mjs'),*map(str,roots),str(out)],check=True,timeout=90)
 assert (out/'recomposition-receipt.json').is_file()
 t=(roots[1]/new).read_text();before=(roots[0]/E['stockCommon15']['path']).read_text()
 prior=['_stage2DeepBodyTileLandmark','_stage8DeepBodyTileLandmark','_stage9DeepFloorTileLandmark']
 newMethods=['_stage4DeepBodyTileLandmark','_stage5DeepBankTileLandmark','_stage6DeepRoadBodyTileLandmark','_stage10DeepFloorTileLandmark']
 assert all(t.count(k)==before.count(k)==2 for k in prior)
 assert all(t.count(k)==2 and k not in before for k in newMethods)
 (out/'approved-dag-diff.json').write_text(json.dumps({'removed':deleted,'added':added,'allOtherBytesExact':same,'stageLeaves':E['leaf'],'targetCompiledRenderer':new,'stockCompiledRenderer':E['stockCommon15']['path']},indent=2)+'\n')
 if any(not (roots[i]/R).exists() for i in (0,1)):raise RuntimeError('renderer source missing')
 for i,x in enumerate(roots):
  assert git(x,'hash-object',R)==[E['stockBlob'],E['candidateBlob']][i]
if __name__=='__main__':
 mode,*s=sys.argv[1:];p=list(map(Path,s))
 if mode=='source':source(*p)
 elif mode=='built':built(p[:2],p[2])
 else:raise SystemExit(mode)
