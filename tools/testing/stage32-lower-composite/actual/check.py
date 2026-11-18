import json,sys,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
p=Path(sys.argv[1]);gold=json.load(open(Path(__file__).with_name('golden.json')));rows=[];fails=[]
for view in ['gray-left','maximum','renderer-above','native-walk']:
 a=json.load(open(p/f'baseline-{view}.json'));b=json.load(open(p/f'candidate-{view}.json'));assert a['ok'] and b['ok'];assert a['camera']==b['camera'];
 for k in ['sceneRGBA','terrainRGBA','camera','physicsSha256','vectorSHA','sourcePathHashes']:assert a[k]==gold[view][k],(view,k,'7ca baseline mismatch')
 for k in ['physicsSha256','vectorSHA','sourcePathHashes']:assert a[k]==b[k]
 assert not a['storage'] and not b['storage'];assert b['routeRows'];assert all(r['route']['nativeLive']==(r['sceneScale']>1.05) and r['route']['sceneScale']==r['sceneScale'] for r in b['routeRows'])
 A=np.array(Image.open(p/f'baseline-{view}.png'));B=np.array(Image.open(p/f'candidate-{view}.png'));T=np.array(Image.open(p/f'baseline-{view}-terrain-mask.png'));U=np.array(Image.open(p/f'candidate-{view}-terrain-mask.png'))
 D=np.any(A!=B,axis=2);TD=np.any(T!=U,axis=2);c=b['camera'];split=max(0,min(b['height'],int(np.floor(c['scale']*1716+b['height']/2-c['y']*c['scale']))));alpha=int(np.sum(A[:,:,3]!=B[:,:,3]));terrainalpha=int(np.sum(T[:,:,3]!=U[:,:,3]));bg=int(np.sum(TD&(T[:,:,3]==0)));upper=int(D[:split].sum());terrainupper=int(TD[:split].sum());tag=b.get('liveTagProbe');lower=b.get('lowerProbe')
 if alpha or terrainalpha or bg or upper or terrainupper:fails.append(view+':alpha/exterior/upper')
 if view in ['gray-left','native-walk'] and (D.any() or TD.any()):fails.append(view+':unaffected route not exact')
 if view in ['maximum','renderer-above']:
  assert lower and lower['maskPositive']>0 and lower['workPositive']>0,'Positive lower application missing'
  if lower['fieldNonopaque']:fails.append(view+':field opacity assumption fails')
  assert b['sceneMaterialStats']['transition']['bufferDimensions'][2]==[1,1],'Unexpected full staged BODY allocation'
 if c['scale']>1.05:
  assert b['sceneMaterialStats']['supersample']['calls']==0
  assert [(t['model'],t['kind']) for t in tag['rows']]==[(m,k) for m in ['raw-primitive','visible-oracle'] for k in ['grass','pale','road']]
  for t in tag['rows']:
   if t['alpha'] or t['aboveSplitChanged'] or t['fullChanged'] or (t['kind']=='road' and t['changed']):fails.append(view+':tag strict '+t['model']+'/'+t['kind'])
  if view=='native-walk':assert all(t['positive']>0 for t in tag['rows'])
 rows.append({'view':view,'sceneChanged':int(D.sum()),'terrainChanged':int(TD.sum()),'alpha':alpha,'terrainAlpha':terrainalpha,'exterior':bg,'aboveSplit':upper,'terrainAboveSplit':terrainupper,'maxRGBDelta':int(abs(A.astype(int)-B.astype(int)).max()),'split':split,'lowerProbe':lower,'tag':tag,'baselineStats':a['sceneMaterialStats'],'candidateStats':b['sceneMaterialStats']})
r={'scope':'Four actual views, lower nonwalk composition model not exact optimization. Structural gates do not authorize all partial-tag or lower RGB changes; independent visual/source-role judgment required. Original 7ca baseline exact to prior real images. No production/performance acceptance.','pass':not fails,'failures':fails,'qualityAccepted':False,'rows':rows};(p/'comparison.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2));assert not fails,fails
