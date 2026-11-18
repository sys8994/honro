import json,sys
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np
from boundary import classify
p=Path(sys.argv[1]);cfg=json.load(open(Path(__file__).with_name('config.json')));rows=[]
for v in cfg['views']:
 n=v['name'];a=json.load(open(p/f'baseline-{n}.json'));b=json.load(open(p/f'candidate-{n}.json'))
 for r,k in [(a,'baseline'),(b,'candidate')]:
  assert r['ok'] and r['commit']==cfg[k] and r['battleUnchanged'] and r['sourceUnchanged']
  assert not r['storage'] and not r['errors'];assert r['requestedDPR']==v['dpr'] and r['officialDPR']==min(v['dpr'],1.7)
 for k in ['camera','width','height','terrainSHA','unitsSHA','sourceStageSHA','sourceSymbolSHA','worldWidth','rimGroups','bodyPose']:assert a[k]==b[k],(n,k)
 def im(kind,variant):return np.array(Image.open(p/f'{variant}-{n}-{kind}-mask.png').convert('RGBA'))
 x,y,m=im('body','baseline'),im('body','candidate'),im('foreground','baseline');assert np.array_equal(m,im('foreground','candidate')),(n,'Source/caps data raster changed')
 cap=im('caps','baseline');assert np.array_equal(cap,im('caps','candidate'));region=im('allowedEdit','baseline');assert np.array_equal(region,im('allowedEdit','candidate'))
 allowed=region[:,:,3]>0;guard=np.array(Image.fromarray((allowed*255).astype('uint8')).filter(ImageFilter.MaxFilter(7)))>0
 diff=np.any(x!=y,axis=2);alpha=x[:,:,3]!=y[:,:,3];assert not np.any(alpha),(n,'Final BODY alpha changed')
 ys,xs=np.where(diff&~allowed);boundaryPixels=[classify(v,b,int(px),int(py),x[py,px],y[py,px],cap[py,px]) for px,py in zip(xs,ys)];assert not np.any(diff&(cap[:,:,3]>0)),(n,'Exposed cap pixels changed')
 normalA=np.array(Image.open(p/f'baseline-{n}.png').convert('RGBA'));normalB=np.array(Image.open(p/f'candidate-{n}.png').convert('RGBA'))
 normalDiff=np.any(normalA!=normalB,axis=2);terrainDiff=np.any(im('terrain','baseline')!=im('terrain','candidate'),axis=2);offDiff=np.any(im('readabilityOff','baseline')!=im('readabilityOff','candidate'),axis=2)
 for k,d in [('normal',normalDiff),('actorfree',terrainDiff),('readabilityOff',offDiff)]:assert not np.any(d&~guard),(n,k,'Scene change outside explicit edit area + 3 physical-pixel guard')
 rimA,rimB=im('rimOnly','baseline'),im('rimOnly','candidate');assert np.array_equal(rimA,rimB),(n,'Unchanged rim geometry/style/raster differs');assert np.any(rimB[:,:,3]>0) and np.any(im('terrain','candidate')!=im('readabilityOff','candidate')),(n,'Missing positive rim')
 full=diff&(m[:,:,3]==255);partial=diff&(m[:,:,3]>0)&(m[:,:,3]<255)
 rows.append(dict(view=n,normalSceneChangedPixels=int(normalDiff.sum()),bodyChangedPixels=int(diff.sum()),finalBodyAlphaChangedPixels=0,bodyOutsideWhiteMaskBoundaryDiagnostics=boundaryPixels,bodyOutsideApprovedGeometricBoundaryBandChangedPixels=0,capsChangedPixels=0,normalSceneOutsideExplicitPlanesWith3PixelGuardChangedPixels=0,actualRimGeometryAndRasterExact=True,sourceFullColorChangedInsideExplicitNonwalkPlanes=int(full.sum()),sourcePartialColorChangedInsideExplicitNonwalkPlanes=int(partial.sum()),gameplayExact=True))
assert sum(r['bodyChangedPixels'] for r in rows)>0,'Expected repair absent'
json.dump(dict(contractsPassed=True,qualityAccepted=False,scope='Only the explicit old/new union of7 nonwalk attachment faces may change source colors. Source data/caps/physics/final BODY alpha remain exact; actual Scene outside those planes +3 physical-pixel sampling guard remains exact. Art must be manually judged in actual Scene, especially lower-join-native endpoint.',rows=rows),open(p/'result.json','w'),indent=2)
print('PASS strict final alpha/foreground/gameplay/actual outside-region contracts; quality remains unaccepted pending visual review.')
