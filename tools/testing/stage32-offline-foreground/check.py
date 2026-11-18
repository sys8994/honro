import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
p=Path(sys.argv[1]);rows=[]
for view in ['native-walk','coverage-phone-dpr3','coverage-desktop-large']:
 a=json.load(open(p/('baseline-'+view+'.json')));b=json.load(open(p/('candidate-'+view+'.json')))
 assert a['ok'] and b['ok']
 for k in ['camera','physicsSha256','vectorSHA','sourcePathHashes','width','height','actualDPR']:assert a[k]==b[k],k
 assert not a['storage'] and not b['storage'] and a['renderPure'] and b['renderPure']
 assert a['actualDPR']==(3 if view=='coverage-phone-dpr3' else 1)
 row={'view':view,'qualityAccepted':False,'tagOracle':'Raw source-order versus offline color-role contribution evaluated on native-walk and separate D1 lower direct probe; not universal actual-color AA proof'}
 split=max(0,min(a['height'],int(a['camera']['scale']*a['actualDPR']*1716+a['height']/2-a['camera']['y']*a['camera']['scale']*a['actualDPR'])))
 for suffix in ['', '-terrain-mask']:
  A=np.asarray(Image.open(p/('baseline-'+view+suffix+'.png')).convert('RGBA'));B=np.asarray(Image.open(p/('candidate-'+view+suffix+'.png')).convert('RGBA'));d=np.any(A!=B,axis=2)
  r={'changed':int(d.sum()),'alpha':int((A[:,:,3]!=B[:,:,3]).sum()),'aboveSplit':int(d[:split].sum()),'maxRGB':int(np.abs(A[:,:,:3].astype(int)-B[:,:,:3]).max()),'emptyChanged':int((d&(A[:,:,3]==0)).sum())}
  assert r['alpha']==0 and r['aboveSplit']==0 and r['emptyChanged']==0,r
  row[suffix or 'scene']=r
 S0=np.asarray(Image.open(p/('baseline-'+view+'.png')).convert('RGBA'));S1=np.asarray(Image.open(p/('candidate-'+view+'.png')).convert('RGBA'));T0=np.asarray(Image.open(p/('baseline-'+view+'-terrain-mask.png')).convert('RGBA'))
 row['sceneChangedOutsideTerrain']=int((np.any(S0[:,:,:3]!=S1[:,:,:3],axis=2)&(T0[:,:,3]==0)).sum())
 assert row['sceneChangedOutsideTerrain']==0,row
 if view=='native-walk':
  assert row['scene']['changed']==0 and row['-terrain-mask']['changed']==0,row
  tag=b['liveTagProbe'];assert len(tag['rows'])==3 and len(tag['lower']['rows'])==3
  for t in tag['rows']:assert t['positive']>0 and t['changed']==0 and t['alpha']==0,t
  for t in tag['lower']['rows']:assert t['aboveSplitChanged']==0 and t['alpha']==0 and t['fullChanged']==0,t
  row['contributionDiagnostic']=tag
 rows.append(row)
(p/'offline-result.json').write_text(json.dumps({'scope':'Three actual source-overridden Scene pairs, with bounded raw contribution probes. Alpha/upper/walk/DPR gates; manual lower partial contribution and visual review still required. Not product acceptance.','rows':rows},indent=2));print(json.dumps(rows))
