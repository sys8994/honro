import json,math
from pathlib import Path
M=1024**2
out=[]
for name,w,h,d in [('phoneDPR2',390,696,2),('phoneDPR3',390,696,3),('desktop1080',1920,1080,1),('desktop4K',3840,2160,1)]:
 W,H=w*d,h*d;P=W*H;poses=[]
 for cy in [1342,1650]:
  z=1.65;t=d*(h/2+(1716-cy)*z);y0=max(0,min(H,math.floor(t)));y1=min(H,math.ceil(d*(h/2+(1988.8-cy)*z))+2);B=max(0,y1-y0)
  fresh=4*P+8*max(W*B,1)+4
  # Cached path remains1MiPixel capped, thus stagedBody<=4MiB. SS2 canvases<=8MiB.
  retained=4*P+(8*W*B if B else 8*M)+12*M
  poses.append(dict(scale=z,cameraY=cy,split=y0,roiRows=B,roiPixels=W*B,materialBytes=4*P,twoROIBytes=8*max(W*B,1),freshBytes=fresh,withCachedStagedAndSSBytes=retained,withCachedMiB=retained/M))
 full=12*P+12*M
 out.append(dict(name=name,css=[w,h],dpr=d,physical=[W,H],pixels=P,current1MiPixelTransitionAllowed=P<=M,material8MiPixelAllowed=P<=8*M,poses=poses,fullHeightTwoROIWithCachedBytes=full,fullHeightTwoROIWithCachedMiB=full/M,fits48MiBFull=full<=48*M))
r={'scope':'Hypothetical allocation plan only; frozen bdb9 currently rejects all four by1MiPixel gate','cachedStagedMaxBytes':4*M,'retainedSSMaxBytes':8*M,'proposedLiveLogicalStudyBudget':48*M,'rows':out}
Path(__file__).with_name('table.json').write_text(json.dumps(r,indent=2))
for r in out:print(r['name'],[(p['cameraY'],p['roiRows'],round(p['freshBytes']/M,2),round(p['withCachedMiB'],2))for p in r['poses']],round(r['fullHeightTwoROIWithCachedMiB'],2))
