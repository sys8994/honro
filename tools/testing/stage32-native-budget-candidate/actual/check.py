import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
p=Path(sys.argv[1]);rows=[]
for view in ['maximum','gray-left','phone-dpr2','phone-dpr3','desktop1080']:
 a=json.load(open(p/f'baseline-{view}.json'));b=json.load(open(p/f'candidate-{view}.json'));assert a['ok'] and b['ok']
 for k in ['camera','physicsSha256','vectorSHA','sourcePathHashes','sceneRGBA','terrainRGBA']:assert a[k]==b[k],(view,k)
 for suffix in ['','-terrain-mask']:
  A=np.array(Image.open(p/f'baseline-{view}{suffix}.png'));B=np.array(Image.open(p/f'candidate-{view}{suffix}.png'));assert np.array_equal(A,B),(view,suffix)
 expected={'maximum':(1331,763,1),'gray-left':(1331,763,1),'phone-dpr2':(390,696,2),'phone-dpr3':(390,696,3),'desktop1080':(1920,1080,1)}[view]
 for result in [a,b]:
  assert (result['cssWidth'],result['cssHeight'],result['actualDPR'])==expected
  assert (result['width'],result['height'])==(expected[0]*expected[2],expected[1]*expected[2])
  assert result['routeRows'] and all(r['route']['nativeLive']==(r['sceneScale']>1.05) and r['route']['sceneScale']==r['sceneScale'] for r in result['routeRows'])
  if expected[2]>1:assert any(r['canvas']==[expected[0]*expected[2],expected[1]*expected[2]] and abs(r['matrix'][0]-result['camera']['scale']*expected[2])<1e-5 for r in result['routeRows'] if r['sceneScale']>1.05)
 assert not b['storage'] and b['routeRows'];assert all(r['canvas'][0]*r['canvas'][1]<=1048576 for r in a['routeRows'] if r['sceneScale']<=1.05),'Testreference cached cap would differ';s=b['sceneMaterialStats'];assert s['totalLogicalBytes']<=48*1024*1024
 if b['camera']['scale']>1.05:
  assert s['nativeBudget']['admitted']>0 and s['nativeBudget']['last']['admitted'];assert (view=='maximum' or s['supersample']['calls']==0)
  assert s['nativeJunction']['calls']>0 and b['lowerProbe']['workPositive']>0 and b['lowerProbe']['targetDifferencePixels']>0
  assert b['lowerProbe']['fieldNonopaque']==0 and b['lowerProbe']['targetAlphaChanged']==0
  assert s['transition']['bufferDimensions'][1:]==[[1,1],[1,1]]
  tag=b['liveTagProbe'];assert [(x['model'],x['kind']) for x in tag['rows']]==[(m,k) for m in ['raw-primitive','visible-oracle'] for k in ['grass','pale','road']]
  assert all(x['changed']==x['alpha']==0 for x in tag['rows'])
 else:assert s['nativeBudget']['admitted']==0
 assert len(a['budgetLifecycle'])==len(b['budgetLifecycle'])
 for x,y in zip(a['budgetLifecycle'],b['budgetLifecycle']):
  assert x['scale']==y['scale'] and x['frameHash']==y['frameHash'];assert y['stats']['totalLogicalBytes']<=48*1024*1024
 if view=='maximum':
  assert [x['scale'] for x in b['budgetLifecycle']]==[.6,1.65,.6,1.65]
  assert b['budgetLifecycle'][0]['stats']['supersample']['calls']==b['budgetLifecycle'][1]['stats']['supersample']['calls'];assert b['budgetLifecycle'][2]['stats']['supersample']['calls']==b['budgetLifecycle'][3]['stats']['supersample']['calls'];assert b['budgetLifecycle'][0]['frameHash']==b['budgetLifecycle'][2]['frameHash'];assert b['budgetLifecycle'][1]['frameHash']==b['budgetLifecycle'][3]['frameHash']
 fallbackDiff=None
 if view in ['phone-dpr2','phone-dpr3','desktop1080']:
  old=json.load(open(p/f'fallback-{view}.json'));assert old['ok'];assert all(old[k]==b[k] for k in ['camera','physicsSha256','vectorSHA','sourcePathHashes']);assert old['sceneMaterialStats']['transition']['lastSkip']=='transition-pixel-cap';assert old['sceneMaterialStats']['supersample']['calls']>0
  B=np.array(Image.open(p/f'candidate-{view}.png'));O=np.array(Image.open(p/f'fallback-{view}.png'));OT=np.array(Image.open(p/f'fallback-{view}-terrain-mask.png'));U=np.array(Image.open(p/f'candidate-{view}-terrain-mask.png'));assert np.array_equal(O[:,:,3],B[:,:,3]);assert np.array_equal(OT[:,:,3],U[:,:,3]);fallbackDiff={'sceneChanged':int(np.any(O!=B,axis=2).sum()),'terrainChanged':int(np.any(OT!=U,axis=2).sum()),'maxDelta':int(np.abs(O.astype(int)-B.astype(int)).max())};assert fallbackDiff['sceneChanged']>0
 rows.append({'fallbackDifference':fallbackDiff,'view':view,'exactReference':True,'actualDPR':b['actualDPR'],'candidateStats':s,'lowerProbe':b['lowerProbe'],'lifecycle':b['budgetLifecycle']})
(p/'comparison.json').write_text(json.dumps({'pass':True,'qualityAccepted':False,'scope':'Budget policy exact versus test-only230b with8MP cap. High-DPR reference is not previously accepted quality; actual before/after original fallback and visual review still required. Logical helper bytes only. SameScene cache/native transitions, not full App stage lifecycle.', 'rows':rows},indent=2))
print('PASS five paired views and retained cache/native roundtrip')
