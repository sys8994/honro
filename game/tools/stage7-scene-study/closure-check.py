from pathlib import Path
import json,numpy as np
from PIL import Image
P=Path('artifacts/stage7-scene-study');rows=[];failed=False
for view in ['portrait-bl','desktop-br','portrait-tr','desktop-tr','desktop-cut-close']:
 def read(v):return json.loads((P/(v+'-'+view+'.json')).read_text())
 def pic(v,suffix=''):return np.array(Image.open(P/(v+'-'+view+suffix+'.png')).convert('RGBA'))
 baseline,actual,control=map(read,['candidate','closure','expected'])
 contracts=['stageSha256','physicsSha256','sourceSha256','capsSha256','runtimeSha','camera']
 errors=[key for key in contracts if not baseline[key]==actual[key]==control[key]]
 if not baseline['movement']['trajectorySha256']==actual['movement']['trajectorySha256']==control['movement']['trajectorySha256']:errors.append('movement')
 for v in [baseline,actual,control]:
  if not v['ok'] or not v['save']['roundtrip'] or not v['movement']['moved'] or v['errors'] or v['storage'] or v['violations']:errors.append('runtime/save/movement')
 if control['expectedDraws']<=0:errors.append('expected-control-not-used')
 b,a,e=[pic(v,'-screenWorldCache-mask')for v in ['candidate','closure','expected']];source=pic('closure','-sourceEffective-mask')[:,:,3];footprint=pic('closure','-closureEffective-mask')[:,:,3]>0
 changed=np.any(a!=b,axis=2);opaque=changed&(source==255);outside=changed&~footprint;unexpected=np.any(a!=e,axis=2)
 row={'view':view,'contractErrors':errors,'expectedSourceOverMismatchPixels':int(unexpected.sum()),'opaqueSourceChangedPixels':int(opaque.sum()),'outsideNativeClosureFootprintChangedPixels':int(outside.sum()),'sourceAAChangedPixels':int((changed&(source>0)&(source<255)).sum()),'closureTiming':actual['timing'],'expectedTimingControlOnly':control['timing'],'notes':'Source and closure masks replay observed BODY tile transforms through the existing production tile/screen compositor. Static cache comparison excludes dynamic cloud timing. All thresholds remain exact.'}
 for name,mask in [('unexpected',unexpected),('opaque',opaque),('outside',outside)]:
  ys,xs=np.where(mask);row[name+'First']=[{'pixel':[int(x),int(y)],'base':b[y,x].tolist(),'actual':a[y,x].tolist(),'expected':e[y,x].tolist(),'sourceAlpha':int(source[y,x]),'footprint':bool(footprint[y,x])} for y,x in zip(ys[:20],xs[:20])]
 rows.append(row);failed|=bool(errors or unexpected.any() or opaque.any() or outside.any())
(P/'closure-source-over.json').write_text(json.dumps({'passed':not failed,'scope':'Independent raw Canvas underpaint plus unchanged native foreground in actual static Scene cache. Original-vs-lower protected gate remains separate and unchanged. This result alone is not art approval.','rows':rows},indent=2));print(json.dumps(rows,indent=2))
if failed:raise SystemExit(1)
