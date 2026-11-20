import hashlib,json
from pathlib import Path
from PIL import Image
import numpy as np
p=Path('_local/reports/stage28-one-off')
a,b=[json.loads((p/n/'proof.json').read_text())['frames'] for n in ('stock','candidate')]
rows=[];failures=[]
expected=[{'id':'a3-foundation','a':{'x':16200,'y':9000},'z':{'x':-9000,'y':9000},'walkable':False}]
modes=('stock','candidate')
def load(t,k):
 return np.asarray(Image.open(p/t/k).convert('RGB'),dtype=np.int16)
for u,v in zip(a,b,strict=True):
 k=u['name'];s=u['stage'];target=s==28 and u['width']==390
 for f in ('name','actual','adjusted','focus','viewport','css','backing','physicsSha256','stageSourceSha256'):
  assert u[f]==v[f],(k,f)
 assert u['owner'] is None
 assert bool(v['owner'])==(s==28)
 if s==28:
  assert v['owner']['layer']=='structural-back' and v['owner']['collision']==0 and v['owner']['sockets']==0 and not v['owner']['foreground']
  assert v['owner']['visible']==target
 gone=[]
 for g,h in zip(u['ink'],v['ink'],strict=True):
  assert g['id']==h['id'] and [r for r in g['segments'] if r['walkable']]==[r for r in h['segments'] if r['walkable']]
  assert all(r in g['segments'] for r in h['segments'])
  gone.extend([{'id':g['id'],**r} for r in g['segments'] if r not in h['segments']])
 assert gone==(expected if s==28 else []),(k,gone)
 if s==7:assert not any(g['id']=='root-floor' and any(not r['walkable'] and r['a']=={'x':5732.24,'y':5069.18} and r['z']=={'x':-1200,'y':5069.18} for r in g['segments']) for g in u['ink'])
 if s==41:assert not any(g['id']=='a5-lower-road' and any(not r['walkable'] and r['a']=={'x':250,'y':2785} and r['z']=={'x':250,'y':2343.75} for r in g['segments']) for g in u['ink'])
 x,y=[load(t,k) for t in modes]
 delta=np.abs(x-y).max(axis=2);yy,xx=np.where(delta)
 bbox=[int(xx.min()),int(yy.min()),int(xx.max())+1,int(yy.max())+1] if xx.size else None
 row={'name':k,'pixelDiffBounds':bbox,'changedPixels':int(xx.size),'onlyExpectedInkRemoved':gone,'exactSameActualCameraAndPhysics':True};rows.append(row)
 if not target:
  if bbox is not None: failures.append((k,'control pixels changed',bbox))
  continue
 if not bbox or bbox[1]<629 or bbox[3]>648:failures.append((k,'changed outside allowed lower19 rows',bbox))
 stem=k.removesuffix('.png')
 for t,im in zip(modes,(x,y)):
  d=json.loads((p/t/(stem+'-raster.json')).read_text())
  r=load(t,stem+'-backing.png');w=load(t,stem+'-viewport.png')
  if d['ancestors'][0]['rect']['top']!=0 or d['ancestors'][0]['rect']['left']!=0:failures.append((k,t,'unexpected DOM offset'))
  if not (np.array_equal(r[629:648],im[629:648]) and np.array_equal(w[629:648],im[629:648])):failures.append((k,t,'lower rows not exactly same in raw backing, DOM and browser viewport'))
  a0=np.asarray(d['rawRows']['rgba']).reshape(-1,390,4)
  if not np.array_equal(a0[:,:,:3],im[644:648]):failures.append((k,t,'raw RGBA does not match lower screenshot RGB'))
 if np.any(load('stock',stem+'-backing.png')[:629]!=load('candidate',stem+'-backing.png')[:629]):failures.append((k,'raw changed above y629'))
 row['approvedCandidatePackedOwnerMatches']=json.loads((p/'candidate'/(stem+'-raster.json')).read_text())['loadedOwnerNormalizedToForeSha256']=='923611967851986cab7b851e60994851ae809fbc6c15107c0563c2002884d6dc'
 row['lastRowRGBLumaMax']=float(y[647].mean(axis=1).max())
 row['seamMeanJumps']=[float(np.abs(y[i]-y[i-1]).mean()) for i in range(629,635)]
 if not row['approvedCandidatePackedOwnerMatches'] or y[632:648].mean(axis=2).max()>72 or max(row['seamMeanJumps'])>7:failures.append((k,'missing owner, remaining grey or visible seam'))
(p/'paired-result.json').write_text(json.dumps({'rows':rows,'failures':failures,'stageScope':'unmodified 787206f6 stock vs exact b8124596 candidate; no scratch product source patch'},indent=2))
print(rows,failures)
assert not failures,failures
