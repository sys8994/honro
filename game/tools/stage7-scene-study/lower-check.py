from pathlib import Path
import json,numpy as np
from PIL import Image
P=Path('artifacts/stage7-scene-study');rows=[];failed=False
for view in ['portrait-bl','desktop-br','portrait-tr','desktop-tr','desktop-cut-close']:
 def meta(v):return json.loads((P/f'{v}-{view}.json').read_text())
 def pic(v,key):return np.array(Image.open(P/f'{v}-{view}-{key}-mask.png').convert('RGBA'))
 variants=['lower-base','candidate','lower-expected'];m=[meta(v)for v in variants];errors=[]
 for key in ['stageSha256','physicsSha256','sourceSha256','capsSha256','runtimeSha','camera','lowerRole','rimReference']:
  if not m[0][key]==m[1][key]==m[2][key]:errors.append(key)
 for z in m:
  if not z['ok']or not z['save']['roundtrip']or z['errors']or z['storage']or z['violations']:errors.append('runtime/save')
 if len({z['movement']['trajectorySha256']for z in m})!=1:errors.append('movement')
 if m[2]['expectedDraws']<=0:errors.append('independent expected unused')
 masks=['lowerEffective','lowerOnBlackEffective','lowerOnWhiteEffective','capsEffective','sourceEffective','rimEffective','foregroundEffective']
 for mask in masks:
  if any(not np.array_equal(pic('candidate',mask),pic(v,mask))for v in ['lower-base','lower-expected']):errors.append('replay '+mask)
 b,a,e=[pic(v,'screenWorldCache')for v in variants];changed=np.any(a!=b,axis=2);unexpected=np.any(a!=e,axis=2);lower=pic('candidate','lowerEffective')[:,:,3];caps=pic('candidate','capsEffective')[:,:,3]
 black=pic('candidate','lowerOnBlackEffective').astype(int);white=pic('candidate','lowerOnWhiteEffective').astype(int);t=white[:,:,:3]-black[:,:,:3]
 valid=(black[:,:,3]==255)&(white[:,:,3]==255)&np.all((t>=0)&(t<=255),axis=2);coverage=valid&np.any(t<255,axis=2)
 outside=changed&(lower==0);unresolved=outside&~coverage;capChanges=changed&(caps>0)
 # The unchanged source-fixed-grass-complement is an actual clipping hole of
 # this replayed lower layer. Outside-layer test therefore protects those holes
 # with endpoint evidence only for quantized AA, never a broad RGB tolerance.
 row={'view':view,'contractErrors':errors,'changedPixels':int(changed.sum()),'expectedMismatch':int(unexpected.sum()),'rawOutsideLowerFootprint':int(outside.sum()),'provenCoverageDespiteAlphaZero':int((outside&coverage).sum()),'unresolvedOutside':int(unresolved.sum()),'changedCaps':int(capChanges.sum()),'scope':'Only existing nonwalk-envelope intersect existing source-fixed-grass-complement material coverage. Original source remains intact; intentional nonwalking lower paint is allowed. Actual source/caps/rim/source clips and physics unchanged. Original floor+24 gate remains separate mandatory test.'}
 rows.append(row);failed|=bool(errors or unexpected.any()or unresolved.any()or capChanges.any())
(P/'lower-role-protection.json').write_text(json.dumps({'passed':not failed,'rows':rows,'artAccepted':False},indent=2));print(json.dumps(rows,indent=2))
if failed:raise SystemExit(1)
