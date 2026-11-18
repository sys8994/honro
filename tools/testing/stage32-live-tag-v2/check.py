import json,hashlib,sys
from pathlib import Path
from PIL import Image
import numpy as np
p=Path(sys.argv[1]);rows=[];fail=[]
views=['maximum','renderer-above','native-walk']
golden=json.load(open(Path(__file__).with_name('prior-golden.json')))['outputs']
for view in views:
 for mode in ['baseline','candidate']:
  stem=mode+'-'+view; now=json.load(open(p/(stem+'.json')));old=golden[stem]
  for key in ['sceneRGBA','terrainRGBA','camera','physicsSha256','vectorSHA','sourcePathHashes','provenance']:assert now[key]==old[key],(stem,key,'prior actual mismatch')
  for suffix,key in [('.png','pngSHA256'),('-terrain-mask.png','terrainPNG_SHA256')]:assert hashlib.sha256((p/(stem+suffix)).read_bytes()).hexdigest()==old[key],(stem,key)
 a=json.load(open(p/f'baseline-{view}.json'));b=json.load(open(p/f'candidate-{view}.json'));assert a['ok'] and b['ok'];assert a['camera']==b['camera'];assert a['physicsSha256']==b['physicsSha256'];assert a['vectorSHA']==b['vectorSHA'];assert a['sourcePathHashes']==b['sourcePathHashes'];assert not a['storage'] and not b['storage'];live=b['camera']['scale']>1.05
 assert b['routeRows'],'Actual BODY route recording empty'
 for r in b['routeRows']:
  assert r['route'] is not None and r['route']['sceneScale']==r['sceneScale'] and r['route']['nativeLive']==(r['sceneScale']>1.05),'Actual Scene route missing/mismatched'
 A=np.array(Image.open(p/f'baseline-{view}.png'));B=np.array(Image.open(p/f'candidate-{view}.png'));T=np.array(Image.open(p/f'baseline-{view}-terrain-mask.png'));U=np.array(Image.open(p/f'candidate-{view}-terrain-mask.png'))
 changes=np.any(A!=B,axis=2);terrainChanges=np.any(T!=U,axis=2);alpha=int(np.sum(T[:,:,3]!=U[:,:,3]));sceneAlpha=int(np.sum(A[:,:,3]!=B[:,:,3]));bg=int(np.sum(terrainChanges & (T[:,:,3]==0)));ss=b['sceneMaterialStats']['supersample']['calls']
 tag=b.get('liveTagProbe');
 if live:
  assert tag is not None
  assert [(t['model'],t['kind']) for t in tag['rows']]==[(m,k) for m in ['raw-primitive','visible-oracle'] for k in ['grass','pale','road']],'Six nonvacuous role rows required'
  for t in tag['rows']:
   if t['alpha'] or (t['model']=='visible-oracle' and t['changed']) or (t['model']=='raw-primitive' and t['fullChanged']):fail.append(view+':tag-'+t['model']+'-'+t['kind'])
  if view=='native-walk':
   assert all(t['positive']>0 for t in tag['rows']),'Native walk must exercise all foreground roles'
 row={'tag':tag,'view':view,'camera':b['camera'],'nativeLive':live,'sceneChanged':int(changes.sum()),'terrainChanged':int(terrainChanges.sum()),'terrainAlphaChanged':alpha,'sceneAlphaChanged':sceneAlpha,'terrainOutsideRGB':bg,'ssCalls':ss,'routeRows':len(b['routeRows']),'renderSamples':b['renderSamples'],'maxChannelDelta':int(np.abs(A.astype(int)-B.astype(int)).max())};rows.append(row)
 if alpha or sceneAlpha or bg:fail.append(view+':alpha/exterior')
 if not live and (changes.any() or terrainChanges.any()):fail.append(view+':cached route not exact')
 if live and ss!=0:fail.append(view+':native route SS still active')
 if view in ['maximum','renderer-above'] and not changes.any():fail.append(view+':candidate effect missing')

(p/'comparison.json').write_text(json.dumps({'scope':'Corrected four-branch visible tag model, three live paired views. Six Scene and six terrain outputs exact to prior actual12 run. Remaining nine views retained only from prior run, not rerun. GEOS model evidence is not universal original foreground equivalence.','priorRun':44268810252,'rows':rows,'failures':fail,'pass':not fail},indent=2));print(json.dumps(rows,indent=2));assert not fail,fail
