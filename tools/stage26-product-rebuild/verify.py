"""Measure received actual viewport comparisons. No screen edge tolerance."""
import hashlib,json,math,os
from pathlib import Path
import numpy as np
from PIL import Image
P=Path(os.environ['STAGE26_QA']); e=P/'evidence'; sha=lambda b:hashlib.sha256(b).hexdigest()
A,B=[json.loads((e/d/'proof.json').read_bytes()) for d in ('A','B')]
assert (A['arm'],B['arm'])==('A','B') and A['release']==B['release']
assert len(A['frames'])==len(B['frames'])==8
assert A['bundledChromium']==B['bundledChromium']=='151.0.7922.34'
assert all(not any(x.get(k) for k in ('exception','scriptErrors','requestFailures')) for v in (A,B) for x in v['problems'])
refs=json.loads((Path(__file__).parent/'registered-v2.json').read_bytes())
def keyed(doc):return {(v['width'],v['view']):v for v in doc}
signed={arm:keyed(f) for arm,f in refs['arms'].items()}
expected={(w,v) for w in (1440,390) for v in ('southwest','southeast','overview-control','west-near')}
assert set(keyed(A['frames']))==set(keyed(B['frames']))==expected and len(expected)==8
for arm,v in zip('AB',(A,B)):
 g=json.loads((P/(arm+'-graph.json')).read_bytes())
 for w in (1440,390):
  actual={x['path']:{n:x[n] for n in ('bytes','sha256')} for x in v['network'] if x['width']==w}
  assert actual=={rel:g['files'][rel] for rel in g['needed']},(arm,w,'exact localhost loaded closure')
for w in (1440,390):
 def audio(v):return {x['path'] for e in v['problems'] if e['width']==w for x in e.get('silentNonVisualMedia',[])}
 assert audio(A)==audio(B),(w,'different incidental silent local BGM paths',audio(A),audio(B))
proof=[]
issues=[]
for key in sorted(expected):
 a,b=[keyed(doc['frames'])[key] for doc in (A,B)]
 for k in ('stage','width','height','view','requested','actual','adjusted','viewport','css','backing','physicsSha256','focus','actorCount','projectStage','tide','clamped','within'):
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
  if a['view'] in ('southwest','southeast'):
   for arm,f,px in zip('AB',(a,b),(x0,y0)):
    pin=signed[arm][(f['width'],f['view'])]
    if f[h]!=pin[h] or sha(px.astype(np.uint8).tobytes())!=pin[h+'RGBA']:
     flags.add(arm+' exact historical v2 hash mismatch')
  if a['view']=='southeast':
   if changedN:flags.add('east control not exact')
  elif a['view'] in ('southwest','west-near'):
   if not changedN:flags.add('no candidate foreground')
   if fmt=='raw' and a['view']=='southwest':
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
(e/'comparison.json').write_text(json.dumps({'kind':'current exact two-source-file candidate, fully rebuilt on both arms, ordinary localhost no override','pairsPerArm':8,'channels':16,'nativeReferenceArtifact':14667891892,'issues':issues,'pairs':proof},indent=2)+'\n')
assert not issues,issues
