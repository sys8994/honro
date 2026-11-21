"""Native numbers only. Any protected pixel/alpha/state mismatch is a hold."""
import hashlib,json,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
D=Path(__file__).resolve().parent
W=Path(sys.argv[1])
Q=json.loads((D/'mask.json').read_bytes())
reference=json.loads((D/'baseline.json').read_bytes())
A,B=[json.loads((W/f/'proof.json').read_bytes())for f in 'AB']
source=[json.loads((W/f/'public-source.json').read_bytes())for f in 'AB']
assert all(p['complete'] and p['stage']==15 and p['release']==reference['release'] and
           p['browser']=='151.0.7922.34' for p in (A,B))
assert all(p['verified'] and p['build']['normalCompactBytesUntouched'] for p in source)
assert source[0]['stageInputs']==source[1]['stageInputs'] and source[0]['aggregate']==source[1]['aggregate']
key=lambda d:{r['key']:r for r in d}
a,b,old=key(A['frames']),key(B['frames']),key(reference['frames'])
assert set(a)==set(b)==set(old) and len(a)==20
assert all(v['tileRoutes'] is None for v in A['visits'])
assert len(B['visits'])==2 and all(v['tileRoutes']['candidate']>0 and v['tileRoutes']['lowerStock']>0 for v in B['visits'])
sha=lambda b:hashlib.sha256(b).hexdigest()
rows=[];holds=[]
for k in a:
 x,z=a[k],b[k]
 assert all(x[f]==z[f] for f in ('actual','focus','viewport','css','backing','sceneTime','actorCount','physicsSHA256','phase','round','tide','DPR'))
 assert all(x[f]==old[k][f] for f in ('actual','viewport','backing','css','actorCount','physicsSHA256')),(k,'signed stock geometry/state drift')
 for mode,name,h in [('DOM','png','pngSHA256'),('raw','raw','rawSHA256')]:
  flags=[]
  png=[(W/f/p[name]).read_bytes()for f,p in zip('AB',(x,z))]
  assert all(sha(k)==p[h]for k,p in zip(png,(x,z)))
  if h in old[k] and x[h]!=old[k][h]: flags+=['current 2939958 signed browser stock PNG differs']
  aa,bb=[np.asarray(Image.open(W/f/p[name]).convert('RGBA')).astype(int)for f,p in zip('AB',(x,z))]
  assert aa.shape==bb.shape
  size=(aa.shape[1],aa.shape[0]); vl,vt=x['viewport']['left'],x['viewport']['top'];scale=x['actual']['scale']
  pix=lambda p:((p[0]-vl)*scale,(p[1]-vt)*scale)
  mask=Image.new('L',size); draw=ImageDraw.Draw(mask)
  for p in Q['polygons']:
   draw.polygon([pix(q) for q in p[0]],fill=255)
   for r in p[1:]:draw.polygon([pix(q)for q in r],fill=0)
  # Predeclared two-device-pixel raster support for signed ownership edges only;
  # NEVER excuses any protected positive y, off-mask, isolated source, or alpha delta.
  native=np.array(mask.filter(ImageFilter.MaxFilter(5)))>0
  h=np.arange(size[1]); wy=vt+(h+.5)/scale
  support=native&(wy[:,None]>=-2102-2/scale)&(wy[:,None]<0)
  changed=np.any(aa!=bb,axis=2)
  alpha=int((aa[:,:,3]!=bb[:,:,3]).sum()); lower=int(changed[wy>=0,:].sum())
  outside=int((changed&~support).sum())
  if alpha or lower or outside:flags+=['outside signed native roof/alpha/play bytes changed']
  if not support.any() and changed.any():flags+=['camera with no potential changed']
  r={'key':k,'format':mode,'changed':int(changed.sum()),'alphaDelta':alpha,'yGe0Delta':lower,'outsideSignedROI':outside,'issues':flags}
  if x['viewportCSS'][0]==1440 and x['view'] in {'north','northwest','northeast'}:
   edge=round((-2100-vt)*scale)
   assert 0<edge<aa.shape[0]
   leaps=[np.max(np.abs(q[edge,:,:3]-q[edge-1,:,:3]),axis=1)for q in (aa,bb)]
   before,after=[int((v>=2).sum())for v in leaps]
   r['oldRoofCut']={'rowEdge':edge,'columnsGt1DN':[before,after],'maxDN':[int(v.max())for v in leaps]}
   if before<0.90*size[0] or after>0.30*before or not changed.any():flags+=['old artificial north seam not materially reduced']
  rows.append(r);holds.extend((k,mode,s)for s in flags)
(W/'comparison.json').write_text(json.dumps({'scope':'Actual rebuilt first-turn camera A/B; strict signed protection; prototype not release or visual acceptance.',
 'framesPerArm':20,'nativeWrites':False,'pairs':rows,'holds':holds,
 'delivery':'HOLD even on pixel pass until actual three-camera visual judgement'},indent=2)+'\n')
assert not holds,holds
