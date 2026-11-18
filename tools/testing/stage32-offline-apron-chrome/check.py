import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
p=Path(sys.argv[1]);rows=[]
for view in ['maximum','renderer-above']:
 a=json.load(open(p/('baseline-'+view+'.json')));b=json.load(open(p/('candidate-'+view+'.json')))
 assert a['ok'] and b['ok']
 for k in ['camera','physicsSha256','vectorSHA','sourcePathHashes','width','height','actualDPR']:assert a[k]==b[k],k
 assert not a['storage'] and not b['storage'] and a['renderPure'] and b['renderPure']
 row={'view':view,'qualityAccepted':False,'tagOracle':'Not evaluated in this bounded backend diagnostic'}
 split=max(0,min(a['height'],int(a['camera']['scale']*1716+a['height']/2-a['camera']['y']*a['camera']['scale'])))
 for suffix in ['', '-terrain-mask']:
  A=np.asarray(Image.open(p/('baseline-'+view+suffix+'.png')).convert('RGBA'));B=np.asarray(Image.open(p/('candidate-'+view+suffix+'.png')).convert('RGBA'));d=np.any(A!=B,axis=2)
  r={'changed':int(d.sum()),'alpha':int((A[:,:,3]!=B[:,:,3]).sum()),'aboveSplit':int(d[:split].sum()),'maxRGB':int(np.abs(A[:,:,:3].astype(int)-B[:,:,:3]).max()),'emptyChanged':int((d&(A[:,:,3]==0)).sum())}
  assert r['alpha']==0 and r['aboveSplit']==0 and r['emptyChanged']==0,r
  row[suffix or 'scene']=r
 S0=np.asarray(Image.open(p/('baseline-'+view+'.png')).convert('RGBA'));S1=np.asarray(Image.open(p/('candidate-'+view+'.png')).convert('RGBA'));T0=np.asarray(Image.open(p/('baseline-'+view+'-terrain-mask.png')).convert('RGBA'))
 row['sceneChangedOutsideTerrain']=int((np.any(S0[:,:,:3]!=S1[:,:,:3],axis=2)&(T0[:,:,3]==0)).sum())
 assert row['sceneChangedOutsideTerrain']==0,row
 rows.append(row)
(p/'offline-result.json').write_text(json.dumps({'scope':'Two actual source-overridden Scene pairs. Alpha/upper gates only; manual visual and foreground contribution review required. Not product acceptance.','rows':rows},indent=2));print(json.dumps(rows))
