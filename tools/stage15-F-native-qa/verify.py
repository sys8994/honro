"""Strict frozen B→F compositor comparison of normal browser PNGs."""
import hashlib,json,re,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from f_asset import STUDY
D=Path(__file__).resolve().parent; W=Path(sys.argv[1])
signed=json.loads((D/'B-native-44844285051.json').read_bytes())
roof=np.asarray(json.loads((D/'roof-contact.json').read_bytes()))
q,w=[json.loads((W/f/'proof.json').read_bytes())for f in 'BF']
source=[json.loads((W/f/'public-source.json').read_bytes())for f in 'BF']
assert all(p['complete'] and p['stage']==15 and p['release']==signed['release'] and
           p['browser']==signed['browser']=='151.0.7922.34' for p in (q,w))
assert all(p['verified'] for p in source)
assert source[0]['build']['fExactWestOnly'] is False and source[1]['build']['fExactWestOnly'] is True
assert source[1]['build']['compiledSiblingCompactPackagesExact'] is True
assert source[1]['build']['strictWestSymbolRestoredEquality'] is True
assert source[0]['aggregate']==source[1]['aggregate'] # ordinary Stage15 chapter packet unchanged
assert source[0]['stageInputs']['selectedOwners']==source[1]['stageInputs']['selectedOwners']
key=lambda d:{r['key']:r for r in d}
bef,a,b=key(signed['frames']),key(q['frames']),key(w['frames'])
assert len(bef)==20 and len(a)==22 and set(a)==set(b) and set(bef)<set(a)
for i,j in zip(q['visits'],w['visits']):
 assert i['complete'] and j['complete'] and i['viewportCSS']==j['viewportCSS']
 assert i['ordinaryContactAndOwners']==j['ordinaryContactAndOwners']
 assert i['roof-detailContactAndOwners']==j['roof-detailContactAndOwners']
 assert i['tileRoutes']==j['tileRoutes']
sha=lambda b:hashlib.sha256(b).hexdigest()
state=('actual','focus','viewport','css','backing','sceneTime','actorCount','physicsSHA256','phase','round','tide','DPR')
rings=[[[(float(x),float(y))for x,y in re.findall(r'(-?[0-9.]+),(-?[0-9.]+)',d)]
         for d in re.findall(r'M([^Z]+)Z',r['d'])]for r in STUDY['worldFaceDomains']]
assert all(len(r)>=3 for poly in rings for r in poly)
rows=[]
for k,old in a.items():
 new=b[k]; past=bef.get(k)
 assert old['phaseReceiptValidated'] and new['phaseReceiptValidated']
 assert all(old[f]==new[f]for f in state),(k,'altered physics/time/pose')
 if past:assert all(old[f]==past[f]for f in state),(k,'frozen B observation drift')
 for mode,name,h in [('DOM','png','pngSHA256'),('raw','raw','rawSHA256')]:
  chain=[(W/f/p[name]).read_bytes()for f,p in zip('BF',(old,new))]
  assert all(sha(z)==p[h]for z,p in zip(chain,(old,new)))
  if past: assert old[h]==past[h],(k,mode,'frozen B official bytes changed')
  aa,bb=[np.asarray(Image.open(W/f/p[name]).convert('RGBA'))for f,p in zip('BF',(old,new))]
  assert aa.shape==bb.shape and aa.shape[:2]==(old['backing'][1],old['backing'][0])
  scale=old['actual']['scale'];l,t=old['viewport']['left'],old['viewport']['top']; hh,ww=aa.shape[:2]
  X=l+(np.arange(ww)+.5)/scale;Y=t+(np.arange(hh)+.5)/scale
  shape=Image.new('L',(ww,hh));draw=ImageDraw.Draw(shape)
  for poly in rings:
   for ring in poly: draw.polygon([((x-l)*scale,(y-t)*scale)for x,y in ring],fill=255)
  owner=np.array(shape.filter(ImageFilter.MaxFilter(5)))>0
  assert not len(roof)==0
  roofY=np.interp(X,roof[:,0],roof[:,1])
  contact=(X[None,:]>=roof[0,0])&(X[None,:]<=roof[-1,0])&(Y[:,None]>=roofY[None,:]-4.)
  # All authored support remains in signed domains; keep contact + cave air separate.
  absbox=(X[None,:]>=740)&(X[None,:]<=1328)&(Y[:,None]>=1200)&(Y[:,None]<=1464)
  dif=np.any(aa!=bb,axis=2)
  rr,cc=np.where(dif)
  out=int((dif&~(owner&absbox)).sum())
  edge=int((dif&contact).sum())
  alpha=int(np.count_nonzero(aa[:,:,3]!=bb[:,:,3]))
  miss=int((dif&(aa[:,:,3]==0)).sum())
  assert (out,edge,alpha,miss)==(0,0,0,0),(k,mode,dict(outside=out,contact=edge,alpha=alpha,air=miss))
  count=int(dif.sum())
  isPC=old['viewportCSS'][0]==1440
  need=100 if old['view']=='roof-detail' or (isPC and old['view']=='ordinary') else 10 if not isPC and old['view'] in ['overview','north'] else 0
  if need: assert count>=need,(k,mode,'no signed visible witness',count)
  if isPC and old['view'] in ('north','northwest','northeast') or not isPC and old['view']=='ordinary':
   assert count==0,(k,mode,'negative camera changed',count)
  rows.append({'key':k,'mode':mode,'changedPixels':count,'signedOutside':out,'trueContact':edge,'alpha':alpha,'air':miss,
               'changedPxBBox':None if len(rr)==0 else [int(cc.min()),int(rr.min()),int(cc.max()+1),int(rr.max()+1)]})
(W/'comparison.json').write_text(json.dumps({'scope':'QA only, frozen B versus F actual Chrome. No product or visual approval.',
 'officialBRun':44844285051,'officialBArtifact':14681853558,'pairs':rows,
 'status':'Native protected pixels and visible witnesses; review new art independently'},indent=2)+'\n')
