import json,sys
from pathlib import Path
from PIL import Image
import numpy as np
p=Path(sys.argv[1]);cfg=json.load(open(Path(__file__).with_name('config.json')));rows=[]
for v in cfg['views']:
 n=v['name'];a=json.load(open(p/f'baseline-{n}.json'));b=json.load(open(p/f'candidate-{n}.json'))
 for r,k in [(a,'baseline'),(b,'candidate')]:
  assert r['ok'] and r['commit']==cfg[k] and r['battleUnchanged'] and r['sourceUnchanged']
  assert not r['storage'] and not r['errors'];assert r['requestedDPR']==v['dpr'];assert r['officialDPR']==min(v['dpr'],1.7)
 for k in ['camera','width','height','terrainSHA','unitsSHA','sourceStageSHA','sourceSymbolSHA']:assert a[k]==b[k],(n,k)
 def im(kind,variant):return np.array(Image.open(p/f'{variant}-{n}-{kind}-mask.png').convert('RGBA'))
 x,y,m=im('body','baseline'),im('body','candidate'),im('foreground','baseline');assert np.array_equal(m,im('foreground','candidate')),(n,'Source/caps mask mutated')
 diff=np.any(x!=y,axis=2);alpha=x[:,:,3]!=y[:,:,3];full=diff&(m[:,:,3]==255);partial=diff&(m[:,:,3]>0)&(m[:,:,3]<255);restored=full&np.all(y==m,axis=2)
 sceneA=np.array(Image.open(p/f'baseline-{n}.png').convert('RGBA'));sceneB=np.array(Image.open(p/f'candidate-{n}.png').convert('RGBA'))
 read=im('terrain','candidate');off=im('readabilityOff','candidate')
 rows.append({'view':n,'normalSceneChangedPixels':int(np.any(sceneA!=sceneB,axis=2).sum()),'bodyChangedPixels':int(diff.sum()),'bodyAlphaChangedPixels':int(alpha.sum()),'sourceFullChanged':int(full.sum()),'sourceFullRestoredExactly':int(restored.sum()),'sourceFullUnresolved':int((full&~restored).sum()),'sourcePartialChanged':int(partial.sum()),'readabilityContributionPixels':int(np.any(read!=off,axis=2).sum()),'gameplayExact':True,'sourceAndCapsDataAndRasterExact':True})
assert rows[0]['bodyChangedPixels']>0,'Expected experiment absent'
json.dump({'contractsPassed':True,'qualityAccepted':False,'scope':'Diagnostic candidate: intended outer alpha removal; remaining original-source partial AA and side join require visual judgment, not waived. No gameplay or source/cap data changes.','rows':rows},open(p/'result.json','w'),indent=2)
print('PASS gameplay/source contracts. Visual quality remains unaccepted; inspect result and screenshots.')
