import json
from pathlib import Path
from PIL import Image,ImageChops
import numpy as np
p=Path('_local/reports/stage28-one-off')
a,b=[json.loads((p/n/'proof.json').read_text())['frames'] for n in ('stock','candidate')]
rows=[];failures=[]
expected=[{'id':'a3-foundation','a':{'x':16200,'y':9000},'z':{'x':-9000,'y':9000},'walkable':False}]
for x,y in zip(a,b,strict=True):
 k=x['name']
 for f in ('name','actual','adjusted','focus','viewport','css','backing','physicsSha256','stageSourceSha256','owner'):
  assert x[f]==y[f],(k,f)
 removed=[]
 for u,v in zip(x['ink'],y['ink'],strict=True):
  assert u['id']==v['id'],k
  assert [s for s in u['segments'] if s['walkable']]==[s for s in v['segments'] if s['walkable']],k
  assert all(s in u['segments'] for s in v['segments']),k
  removed.extend([{'id':u['id'],**s} for s in u['segments'] if s not in v['segments']])
 assert removed==(expected if x['stage']==28 else []),(k,removed)
 p0,p1=[Image.open(p/n/k).convert('RGB') for n in ('stock','candidate')]
 bbox=ImageChops.difference(p0,p1).getbbox()
 delta=np.abs(np.asarray(p0,dtype=np.int16)-np.asarray(p1,dtype=np.int16)).max(axis=2)
 row={'name':k,'matchedActualCameraPhysicsAndStageSource':True,'pixelDiffBounds':bbox,
      'removedInk':removed,'allWalkableInkIdentical':True,'pixelsOverOne':int((delta>1).sum())}; rows.append(row)
 target=x['stage']==28 and x['width']==390
 if not target:
  if x['stage']==7:
   g=[s for z in x['ink'] if z['id']=='root-floor' for s in z['segments'] if not s['walkable'] and s['a']=={'x':5732.24,'y':5069.18} and s['z']=={'x':-1200,'y':5069.18}]
   assert not g,k
  if x['stage']==41:
   g=[s for z in x['ink'] if z['id']=='a5-lower-road' for s in z['segments'] if not s['walkable'] and s['a']=={'x':250,'y':2785} and s['z']=={'x':250,'y':2343.75}]
   assert not g,k
  if bbox is not None:failures.append((k,'expected pixel identical',bbox))
  continue
 stem=k.removesuffix('.png')
 m=json.loads((p/'stock'/(stem+'-independent-stroke-mask.json')).read_text())
 assert m['segment']=={k:v for k,v in expected[0].items() if k!='id'}
 mask=np.zeros((m['ph'],m['pw']),dtype=np.uint8)
 for r in m['spans']:mask[r['y']]=r['alpha']
 covered=mask>0;changed=delta>0
 row['nativeMaskRows']={str(i):int(covered[i].sum()) for i in range(m['ph']) if covered[i].any()}
 row['nativeAA629AlphaRange']=[int(mask[629].min()),int(mask[629].max())]
 row['outsideMaskChangedPixels']=int((changed&~covered).sum())
 row['maskCoveredPixels']=int(covered.sum());row['changedPixels']=int(changed.sum())
 row['insideMaskButUnchanged']=int((covered&~changed).sum())
 if not bbox or row['outsideMaskChangedPixels'] or row['insideMaskButUnchanged']:failures.append((k,'independent native mask does not match changes',row))
 if not covered[629].any() or np.any(changed[629]&~covered[629]):failures.append((k,'y629 not proven native AA'))
 diags=[json.loads((p/t/(stem+'-raster.json')).read_text()) for t in ('stock','candidate')]
 for f in ('loadedOwnerSha256','loadedVectorSha256','loadedOwnerNormalizedToForeSha256','servedStageBlobs'):
  assert diags[0][f]==diags[1][f],(k,f)
 row['loadedVectorSha256']=diags[1]['loadedVectorSha256']
 img=np.asarray(p1,dtype=np.int16)
 raw=np.asarray(Image.open(p/'candidate'/(stem+'-backing.png')).convert('RGB'),dtype=np.int16)
 full=np.asarray(Image.open(p/'candidate'/(stem+'-viewport.png')).convert('RGB'),dtype=np.int16)
 if not(np.array_equal(img[627:648],raw[627:648]) and np.array_equal(img[627:648],full[627:648])):failures.append((k,'lower rows raw/locator/whole mismatch'))
 row['lowerLumaMaximum']=float(img[632:648].mean(axis=2).max())
 row['seamMeanRGB']=[img[i].mean(axis=0).round(3).tolist() for i in range(627,636)]
 row['seamMeanJumps']=[float(np.abs(img[i]-img[i-1]).mean()) for i in range(629,635)]
 if row['lowerLumaMaximum']>72 or max(row['seamMeanJumps'])>7:failures.append((k,'gray bottom or visible seam remains'))
(p/'paired-result.json').write_text(json.dumps({'rows':rows,'failures':failures},indent=2));print(rows,failures)
assert not failures,failures
