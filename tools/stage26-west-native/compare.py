"""Measure received actual viewport comparisons. No screen edge tolerance."""
import hashlib,json,math,os
from pathlib import Path
import numpy as np
from PIL import Image
P=Path(os.environ['STAGE26_QA']); e=P/'evidence'; sha=lambda b:hashlib.sha256(b).hexdigest()
A,B=[json.loads((e/d/'proof.json').read_bytes()) for d in ('A','B')]
assert (A['arm'],B['arm'])==('A','B') and A['release']==B['release']
assert len(A['frames'])==len(B['frames'])==4
proof=[]
issues=[]
for a,b in zip(A['frames'],B['frames']):
 for k in ('stage','width','view','actual','viewport','css','backing','physicsSha256','focus','actorCount','clamped','within'):
  assert a[k]==b[k],k
 assert a['physicsSha256']=='7f756aa46da13a5f71aadbf5a9cbe3f325222bcec00dddf9feb4c85d5af9411c'
 for fmt in ('raw','dom'):
  key='rawPng' if fmt=='raw' else 'name'; h='rawSha256' if fmt=='raw' else 'rasterSha256'
  paths=[e/d/f[key] for d,f in [('A',a),('B',b)]]
  assert all(sha(p.read_bytes())==f[h] for p,f in zip(paths,(a,b)))
  arr=[np.asarray(Image.open(p).convert('RGBA')).astype(int) for p in paths]
  x0,y0=arr; assert x0.shape==y0.shape
  changed=np.any(x0!=y0,axis=2)
  z=a['actual']['scale']; cx=a['css']['w']/2-a['actual']['x']*z; cy=a['css']['h']/2-a['actual']['y']*z
  Y,X=np.indices(changed.shape); X=(X+.5-cx)/z;Y=(Y+.5-cy)/z
  ground=np.interp(X,[-1500,-1000,-500,0,130],[2364.0237037037036,2235.5496296296296,2245.3125,2300,2300])
  allowed=(X>=-1500)&(X<=130)&(Y>=ground+60)&(Y<=3320)
  root=(X>=38)&(X<=160)&(Y>=2050)&(Y<=2360)
  outside=int(np.sum(changed&~allowed));protected=int(np.sum(changed&(root|(Y<ground+60)|(Y>=3380))))
  alpha=int(np.sum(x0[:,:,3]!=y0[:,:,3])); changedN=int(changed.sum())
  r={'width':a['width'],'view':a['view'],'format':fmt,'changed':changedN,'outside':outside,'protected':protected,'alpha':alpha}
  flags=set()
  if outside or protected or alpha: flags.add('signed scope/root/rim/depth/alpha')
  if a['view']=='southeast':
   if changedN:flags.add('east control not exact')
  else:
   if not changedN:flags.add('no candidate foreground')
   if fmt=='raw':
    windows=[]; primary=[]
    lo=math.ceil(cx-1500*z-.5);hi=math.floor(cx+130*z-.5)
    for yy in (2420,2540,2660,3440):
     ri=round(cy+yy*z-.5)
     pair=[round(cx+x*z-.5)for x in (-120,120)]
     d=[float(np.linalg.norm(frame[ri,pair[0],:3]-frame[ri,pair[1],:3]))for frame in arr]
     primary.append({'y':yy,'original':d[0],'candidate':d[1]})
     if yy in (2420,2540) and not d[1]<=.60*d[0]:flags.add('primary change under 40 percent')
     if yy==3440 and d[0]!=d[1]:flags.add('deep sample changed')
     for n in sorted({1,math.floor(80*z),math.ceil(80*z)}):
      ns=np.arange(lo,hi-n+1)
      v=[np.linalg.norm(frame[ri,ns+n,:3]-frame[ri,ns,:3],axis=1)for frame in arr]
      w0,w1=[int(ns[np.argmax(x)]) for x in v]
      top=[float(x.max())for x in v]; windows.append({'y':yy,'pixels':n,'old':top[0],'new':top[1],'peakOldX':(w0+.5-cx)/z,'peakNewX':(w1+.5-cx)/z})
      if top[1]>top[0]:flags.add('actual peak higher')
    r.update(dense=windows,primary=primary)
    if a['width']==1440:
     xx=round(cx+97.9*z-.5); yy=round(cy+2660*z-.5)
     old,new=[[f[yy,xx,:].tolist(),f[yy,xx+1,:].tolist()]for f in arr]
     score=[float(np.linalg.norm(f[yy,xx,:3]-f[yy,xx+1,:3]))for f in arr]
     r['mandatorySameExistingPixel']={'pair':[[xx,yy],[xx+1,yy]],'old':old,'new':new,'oldDelta':score[0],'newDelta':score[1]}
     if score[1]>score[0]:flags.add('existing PC y2660 x97.9 trace delta higher')
  r['holds']=sorted(flags);proof.append(r);issues.extend((a['width'],a['view'],fmt,f)for f in sorted(flags))
(e/'comparison.json').write_text(json.dumps({'kind':'native browser injection diagnostic, not rebuilt candidate','issues':issues,'pairs':proof},indent=2)+'\n')
assert not issues,issues
