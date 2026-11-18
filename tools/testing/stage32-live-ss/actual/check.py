import json,hashlib,sys
from pathlib import Path
from PIL import Image
import numpy as np
p=Path(sys.argv[1]);rows=[];fail=[]
views=['gray-left','portrait-overview','portrait-bottom','landscape-overview','landscape-bottom','desktop-walk','native-walk','maximum','renderer-below','renderer-above']
for view in views:
 a=json.load(open(p/f'baseline-{view}.json'));b=json.load(open(p/f'candidate-{view}.json'));assert a['ok'] and b['ok'];assert a['camera']==b['camera'];assert a['physicsSha256']==b['physicsSha256'];assert a['vectorSHA']==b['vectorSHA'];assert a['sourcePathHashes']==b['sourcePathHashes'];assert not a['storage'] and not b['storage'];live=b['camera']['scale']>1.05
 assert b['routeRows'],'Actual BODY route recording empty'
 for r in b['routeRows']:
  assert r['route'] is not None and r['route']['sceneScale']==r['sceneScale'] and r['route']['nativeLive']==(r['sceneScale']>1.05),'Actual Scene route missing/mismatched'
 A=np.array(Image.open(p/f'baseline-{view}.png'));B=np.array(Image.open(p/f'candidate-{view}.png'));T=np.array(Image.open(p/f'baseline-{view}-terrain-mask.png'));U=np.array(Image.open(p/f'candidate-{view}-terrain-mask.png'))
 changes=np.any(A!=B,axis=2);terrainChanges=np.any(T!=U,axis=2);alpha=int(np.sum(T[:,:,3]!=U[:,:,3]));sceneAlpha=int(np.sum(A[:,:,3]!=B[:,:,3]));bg=int(np.sum(terrainChanges & (T[:,:,3]==0)));ss=b['sceneMaterialStats']['supersample']['calls']
 tag=b.get('liveTagProbe');
 if live:
  assert tag is not None
  for t in tag['rows']:
   if t['alpha'] or (t['model']=='visible-oracle' and t['changed']) or (t['model']=='raw-primitive' and t['fullChanged']):fail.append(view+':tag-'+t['model']+'-'+t['kind'])
  if view=='native-walk':
   assert all(t['positive']>0 for t in tag['rows']),'Native walk must exercise all foreground roles'
 row={'tag':tag,'view':view,'camera':b['camera'],'nativeLive':live,'sceneChanged':int(changes.sum()),'terrainChanged':int(terrainChanges.sum()),'terrainAlphaChanged':alpha,'sceneAlphaChanged':sceneAlpha,'terrainOutsideRGB':bg,'ssCalls':ss,'routeRows':len(b['routeRows']),'renderSamples':b['renderSamples'],'maxChannelDelta':int(np.abs(A.astype(int)-B.astype(int)).max())};rows.append(row)
 if alpha or sceneAlpha or bg:fail.append(view+':alpha/exterior')
 if not live and (changes.any() or terrainChanges.any()):fail.append(view+':cached route not exact')
 if live and ss!=0:fail.append(view+':native route SS still active')
 if view in ['maximum','renderer-above'] and not changes.any():fail.append(view+':candidate effect missing')
coverage=[]
for view in ['coverage-phone-dpr2','coverage-desktop-large']:
 a=json.load(open(p/f'baseline-{view}.json'));b=json.load(open(p/f'candidate-{view}.json'));assert a['ok'] and b['ok'];assert a['coverageProbe'] and b['coverageProbe'];assert a['camera']==b['camera'];assert a['physicsSha256']==b['physicsSha256'];assert a['actualDPR']==b['actualDPR']==(2 if view.endswith('dpr2') else 1)
 A=np.array(Image.open(p/f'baseline-{view}.png'));B=np.array(Image.open(p/f'candidate-{view}.png'));T=np.array(Image.open(p/f'baseline-{view}-terrain-mask.png'));U=np.array(Image.open(p/f'candidate-{view}-terrain-mask.png'))
 assert np.array_equal(A,B) and np.array_equal(T,U),'Capacity fallback must preserve baseline exact'
 assert a['sceneMaterialStats']['supersample']['calls']==b['sceneMaterialStats']['supersample']['calls'],'Capacity fallback changed SS invocation'
 assert a['sceneMaterialStats']['supersample']['calls']>0,'Fallback SS must actually execute'
 assert all(x['sceneMaterialStats']['transition']['skips']>0 and x['sceneMaterialStats']['transition']['lastSkip']=='transition-pixel-cap' for x in [a,b]),'Expected actual pixel-cap fallback not exercised'
 coverage.append({'view':view,'dimensions':[b['width'],b['height']],'dpr':b['actualDPR'],'sceneChanged':int(np.any(A!=B,axis=2).sum()),'terrainAlphaChanged':int(np.sum(T[:,:,3]!=U[:,:,3])),'baselineStats':a['sceneMaterialStats'],'candidateStats':b['sceneMaterialStats'],'scope':'Read-only capacity/fallback diagnostic, not acceptance. No cap increase. Cap-safe candidate keeps old SS and exact fallback output. Existing missing native/internal corrections above the cap remain an unsupported quality limitation, not solved by this test.'})
(p/'coverage-diagnostic.json').write_text(json.dumps({'coverage':coverage,'productionAccepted':False},indent=2))
(p/'comparison.json').write_text(json.dumps({'scope':'Actual10 paired source experiment plus two capacity/fallback probes. Cached route exact; live original source/physics/terrain-union alpha/exterior strict. Changed live RGB requires separate role/foreground/visual review, not blanket approval. Fixed-order render timings diagnostic only.','rows':rows,'failures':fail,'pass':not fail},indent=2));print(json.dumps([{k:v for k,v in r.items() if k!='renderSamples'} for r in rows],indent=2));assert not fail,fail
