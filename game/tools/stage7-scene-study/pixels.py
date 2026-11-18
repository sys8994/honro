from pathlib import Path
import json,os,numpy as np
from PIL import Image
P=Path('artifacts/stage7-scene-study');cfg=json.loads((Path(__file__).resolve().parents[1]/'stage7-svg-study/config.json').read_text());f=np.array(cfg['rootFloor']);gx0,gy0,gx1,gy1=cfg['gap'];rows=[];failed=False
for view in ['portrait-bl','desktop-br','portrait-tr','desktop-tr','desktop-cut-close']:
 if os.environ.get('STAGE7_CONTROLS')=='1' and view not in ['desktop-br','portrait-tr','portrait-bl']:continue
 r=json.loads((P/('candidate-'+view+'.json')).read_text());a=np.array(Image.open(P/('candidate-'+view+'.png')).convert('RGBA'));b=np.array(Image.open(P/('original-'+view+'.png')).convert('RGBA'));H,W=a.shape[:2];c=r['camera'];sc=c['scale']*3.13;xx=(np.arange(W)-W/2)/sc+c['x']/3.13;yy=(np.arange(H)-H/2)/sc+c['y']/3.13
 protected=(xx[None,:]>=9)&(xx[None,:]<1434)&(yy[:,None]>=0)&(yy[:,None]<=np.interp(xx,f[:,0],f[:,1])[None,:]+24)
 gap=(xx[None,:]<=gx1)&(xx[None,:]+1/sc>=gx0)&(yy[:,None]<=gy1)&(yy[:,None]+1/sc>=gy0);changed=np.any(a!=b,axis=2);bad=changed&protected&~gap;ys,xs=np.where(bad);row={'view':view,'sourcePixelsPerScreenPixel':1/sc,'protectedPixels':int(protected.sum()),'changedProtectedOutsideGap':int(bad.sum()),'changedWholeScene':int(changed.sum()),'maxChannelDifference':int(np.abs(a.astype(int)-b.astype(int)).max()),'firstFailures':[{'pixel':[int(x),int(y)],'source':[float(xx[x]),float(yy[y])],'original':b[y,x].tolist(),'candidate':a[y,x].tolist()} for y,x in zip(ys[:20],xs[:20])]};rows.append(row);failed|=bool(bad.any())
(P/'scene-protection.json').write_text(json.dumps({'scope':'Same actual Scene/camera/source placement, strict original protected region A/B outside explicit gap footprint; no art acceptance from numeric pass alone','rows':rows,'passed':not failed},indent=2));print(json.dumps(rows,indent=2))
if failed:raise SystemExit(1)
