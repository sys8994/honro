"""Strict frozen B→V3 compositor comparison of normal browser PNGs."""
import hashlib,json,math,re,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from floor_asset import STUDY
D=Path(__file__).resolve().parent; W=Path(sys.argv[1])
signed=json.loads((D/'B-native-44844285051.json').read_bytes())
floor=np.asarray(STUDY['playContact'])
q,w=[json.loads((W/f/'proof.json').read_bytes())for f in 'BV']
source=[json.loads((W/f/'public-source.json').read_bytes())for f in 'BV']
assert all(p['complete'] and p['stage']==15 and p['release']==signed['release'] and
           p['browser']==signed['browser']=='151.0.7922.34' for p in (q,w))
assert all(p['verified'] for p in source)
assert source[0]['build']['vExactOuterOnly'] is False and source[1]['build']['vExactOuterOnly'] is True
assert source[1]['build']['compiledSiblingCompactPackagesExact'] is True
assert source[1]['build']['strictOuterSingleSymbolRestoredEquality'] is True
assert source[1]['build']['ledgerOnlySignedDisplacedOriginalPaths'] is True
assert source[1]['build']['originalOptimizedPathsByteIdentical'] is True
assert source[0]['aggregate']==source[1]['aggregate'] # ordinary Stage15 chapter packet unchanged
assert source[0]['stageInputs']['selectedOwners']==source[1]['stageInputs']['selectedOwners']
key=lambda d:{r['key']:r for r in d}
bef,a,b=key(signed['frames']),key(q['frames']),key(w['frames'])
assert len(bef)==20 and len(a)==22 and set(a)==set(b) and set(bef)<set(a)
for i,j in zip(q['visits'],w['visits']):
 assert i['complete'] and j['complete'] and i['viewportCSS']==j['viewportCSS']
 assert i['ordinaryContactAndOwners']==j['ordinaryContactAndOwners']
 assert i['ground-detailContactAndOwners']==j['ground-detailContactAndOwners']
 assert i['tileRoutes']==j['tileRoutes']
sha=lambda b:hashlib.sha256(b).hexdigest()
state=('actual','focus','viewport','css','backing','sceneTime','actorCount','physicsSHA256','phase','round','tide','DPR')
rings=[ring for _fill,ring in STUDY['polygons']]
assert len(rings)==9 and all(len(r)>=3 for r in rings)

def scope_stats(aa,bb,old):
  scale=old['actual']['scale'];l,t=old['viewport']['left'],old['viewport']['top']; hh,ww=aa.shape[:2]
  X=l+(np.arange(ww)+.5)/scale;Y=t+(np.arange(hh)+.5)/scale
  shape=Image.new('L',(ww,hh));draw=ImageDraw.Draw(shape)
  for ring in rings:draw.polygon([((x-l)*scale,(y-t)*scale)for x,y in ring],fill=255)
  owner=np.array(shape.filter(ImageFilter.MaxFilter(5)))>0
  floorY=np.interp(X,floor[:,0],floor[:,1])
  # Require a real protected buffer above/on AND just inside the walkable lip.
  contact=(X[None,:]>=floor[0,0])&(X[None,:]<=floor[-1,0])&(Y[:,None]<=floorY[None,:]+12.)
  x0,y0,x1,y1=STUDY['signedWorldBox']
  absbox=(X[None,:]>=x0)&(X[None,:]<=x1)&(Y[:,None]>=y0)&(Y[:,None]<=y1)
  dif=np.any(aa!=bb,axis=2)
  rr,cc=np.where(dif)
  out=int((dif&~(owner&absbox)).sum());edge=int((dif&contact).sum())
  alpha=int(np.count_nonzero(aa[:,:,3]!=bb[:,:,3]))
  miss=int((dif&(aa[:,:,3]==0)).sum())
  return (out,edge,alpha,miss,int(dif.sum()),
    None if not len(rr) else [int(cc.min()),int(rr.min()),int(cc.max()+1),int(rr.max()+1)])
rows=[]
for k,old in a.items():
 new=b[k]; past=bef.get(k)
 assert old['phaseReceiptValidated'] and new['phaseReceiptValidated']
 assert all(old[f]==new[f]for f in state),(k,'altered physics/time/pose')
 if past:assert all(old[f]==past[f]for f in state),(k,'frozen B observation drift')
 for mode,name,h in [('DOM','png','pngSHA256'),('raw','raw','rawSHA256')]:
  chain=[(W/f/p[name]).read_bytes()for f,p in zip('BV',(old,new))]
  assert all(sha(z)==p[h]for z,p in zip(chain,(old,new)))
  if past: assert old[h]==past[h],(k,mode,'frozen B official bytes changed')
  aa,bb=[np.asarray(Image.open(W/f/p[name]).convert('RGBA'))for f,p in zip('BV',(old,new))]
  # Raw backing pixels are integer-rounded by canvas; an element screenshot
  # includes the enclosing CSS bounds. They are separate physical surfaces.
  if mode=='raw':
   expected=tuple(old['backing'])
  else:
   assert old['DPR']==1 and new['DPR']==1
   expected=(math.ceil(old['css']['w']),math.ceil(old['css']['h']))
  assert aa.shape==bb.shape and aa.shape[:2]==expected[::-1],(k,mode,aa.shape,bb.shape,expected)
  out,edge,alpha,miss,count,bbox=scope_stats(aa,bb,old)
  assert (out,edge,alpha,miss)==(0,0,0,0),(k,mode,dict(outside=out,contact=edge,alpha=alpha,air=miss))
  isPC=old['viewportCSS'][0]==1440
  need=100 if old['view'] in ('ordinary','ground-detail') else 10 if old['view']=='overview' else 0
  if need: assert count>=need,(k,mode,'no signed visible witness',count)
  if isPC and old['view'] in ('north','northwest','northeast','south','southwest','southeast'):
   assert count==0,(k,mode,'negative PC camera changed',count)
  rows.append({'key':k,'mode':mode,'changedPixels':count,'signedOutside':out,'trueContact':edge,'alpha':alpha,'air':miss,
               'changedPxBBox':bbox})
(W/'comparison.json').write_text(json.dumps({'scope':'QA only, frozen B versus foreground V3 actual Chrome. No product or visual approval.',
 'officialBRun':44844285051,'officialBArtifact':14681853558,'pairs':rows,
 'status':'Native protected pixels and visible witnesses; review new art independently'},indent=2)+'\n')
