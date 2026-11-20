import json
from pathlib import Path
from PIL import Image,ImageChops
import numpy as np
p=Path('_local/reports/stage28-one-off')
a,b=[json.loads((p/n/'proof.json').read_text())['frames'] for n in ('stock','candidate')]
rows=[];failures=[]
for x,y in zip(a,b,strict=True):
 k=x['name']
 for f in ('name','actual','adjusted','focus','viewport','css','backing','physicsSha256','stageSourceSha256'):
  assert x[f]==y[f],(k,f)
 p0,p1=[Image.open(p/n/k).convert('RGB') for n in ('stock','candidate')]
 diff=ImageChops.difference(p0,p1);bbox=diff.getbbox()
 delta=np.abs(np.asarray(p0,dtype=np.int16)-np.asarray(p1,dtype=np.int16)).max(axis=2)
 row={'name':k,'matchedActualCameraPhysicsAndUnrelatedStageSource':True,'owner':y['owner'],'pixelDiffBounds':bbox,'maxChannelDelta':int(delta.max()),'pixelsOverOne':int((delta>1).sum())}; rows.append(row)
 target=x['stage']==28 and x['width']==390
 if not target:
  if bbox is not None:failures.append((k,'expected pixel identical',bbox))
  if y['owner'] and y['owner']['visible']:failures.append((k,'owner visible outside scoped portraits'))
  continue
 if not y['owner'] or not y['owner']['visible']:failures.append((k,'no visible QA owner'))
 if not bbox or bbox[1]<627:failures.append((k,'unexpected pixel bounds',bbox))
 img=np.asarray(p1,dtype=np.int16)
 stem=k.removesuffix('.png')
 raw=np.asarray(Image.open(p/'candidate'/(stem+'-backing.png')).convert('RGB'),dtype=np.int16)
 full=np.asarray(Image.open(p/'candidate'/(stem+'-viewport.png')).convert('RGB'),dtype=np.int16)
 diag=json.loads((p/'candidate'/(stem+'-raster.json')).read_text())
 if not (np.array_equal(raw[629:648],img[629:648]) and np.array_equal(full[629:648],img[629:648])):failures.append((k,'raw/main viewport lower rows disagree'))
 row['topUnchangedToRow626Inclusive']=bool(not delta[:627].any())
 row['rawLastRowOver72']=int((raw[647].mean(axis=1)>72).sum())
 row['wholeViewportLastRowOver72']=int((full[647].mean(axis=1)>72).sum())
 row['loadedVectorSha256']=diag.get('loadedVectorSha256')
 row['loadedOwnerNormalizedToForeSha256']=diag.get('loadedOwnerNormalizedToForeSha256')
 row['transitionMeanRGB']=[img[i].mean(axis=0).round(3).tolist() for i in range(627,636)]
 last=img[632:648].mean(axis=2)
 row['topJoinMaxChannelDelta']=int(delta[560:595].max())
 row['topJoinMeanChannelDelta']=float(delta[560:595].mean())
 if row['topJoinMaxChannelDelta']>10:failures.append((k,'new high-contrast material at upper join',row['topJoinMaxChannelDelta']))
 row['lowerLumaMaximum']=float(last.max())
 row['oldCutMeanRowJumps']=[float(np.abs(img[i]-img[i-1]).mean()) for i in range(629,635)]
 if last.max()>72:failures.append((k,'far grey or new straight cut present'))
 if max(row['oldCutMeanRowJumps'])>7:failures.append((k,'old seam is still visible',row['oldCutMeanRowJumps']))
(p/'paired-result.json').write_text(json.dumps({'rows':rows,'failures':failures},indent=2));print('verification',rows,failures)
assert not failures,failures
