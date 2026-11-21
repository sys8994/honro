"""B/S actual captures only. On first disagreement retain coordinates and HOLD."""
import hashlib,io,json,math,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
D=Path(__file__).resolve().parent
W=Path(sys.argv[1])
def load(p):return json.loads(p.read_bytes())
signed=load(D/'signed-mask.json')['signedUnionGeoJSON']['coordinates']
ref=load(D/'baseline.json')
a,b=[load(W/arm/'proof.json')for arm in 'BS']
sa,sb=[load(W/arm/'public-source.json')for arm in 'BS']
assert all(x['complete'] and x['stage']==15 and x['release']==ref['release'] and x['browser']==ref['browser']=='151.0.7922.34' for x in (a,b))
assert all(q['verified'] and q['build']['normalCompactBytesUntouched'] and q['build']['fixedBPriorManifest']==ref['priorBuild']['generatedManifest']for q in (sa,sb))
assert sa['stageInputs']==sb['stageInputs'] and sa['aggregate']==sb['aggregate']
assert not sa['build']['generatedChangesRelativeToB'] and len(sb['build']['generatedChangesRelativeToB'])==4
AF,BF,old=[{r['key']:r for r in o['frames']}for o in (a,b,ref)]
assert AF.keys()==BF.keys()==old.keys() and len(AF)==20
def im(arm,name,want):
 p=W/arm/name
 assert p.parent==W/arm
 bb=p.read_bytes();assert hashlib.sha256(bb).hexdigest()==want,p
 return np.asarray(Image.open(io.BytesIO(bb)).convert('RGBA'))
def measure(x,y,l,t,z,g,scope):
 assert x.shape==y.shape
 h,w=x.shape[:2]
 p=Image.new('L',(w,h))
 poly=lambda ps:[((X-l)*z,(Y-t)*z)for X,Y in ps]
 draw=ImageDraw.Draw(p);draw.polygon(poly(signed[0]),fill=255)
 for r in signed[1:]:draw.polygon(poly(r),fill=0)
 raw=np.asarray(p)>0
 supported=(np.asarray(p.filter(ImageFilter.MaxFilter(g*2+1)))>0 if g else raw)
 yworld=t+(np.arange(h)+.5)/z
 # Finite original flat coverage through y6402. Padding is projection support only.
 p1=supported&(yworld[:,None]>=4588.44-g/z)&(yworld[:,None]<=6402+g/z)
 changed=np.any(x!=y,axis=2); alpha=x[:,:,3]!=y[:,:,3]
 outside=changed&~p1;protected=changed&(yworld[:,None]<=4440);air=changed&(x[:,:,3]==0)
 failures=alpha|outside|protected|air
 yy,xx=np.where(failures)
 return {'scope':scope,'pixelsChanged':int(changed.sum()),'fullAlphaDelta':int(alpha.sum()),
  'outsideProjectedSigned':int(outside.sum()),'outsideExactRasterMaskDiagnostic':int((changed&~raw).sum()),
  'playAndContactYlte4440Delta':int(protected.sum()),'originalAirDelta':int(air.sum()),
  'originalInkGuardPixels':g,'failures':int(failures.sum()),'witnesses':[{
    'pixel':[int(i),int(j)],'world':[l+(float(i)+.5)/z,t+(float(j)+.5)/z],
    'B':x[j,i].tolist(),'S':y[j,i].tolist()}for j,i in list(zip(yy,xx))[:24]]}
def cutRGB(im,r):
 return [int((np.abs(im[k,:,:3].astype(np.int16)-im[k-1,:,:3].astype(np.int16)).max(axis=1)>5).sum())for k in range(r-2,r+4)]
frameRows=[];tileRows=[];issues=[];seen=set()
for k in AF:
 u,v,prior=AF[k],BF[k],old[k]
 assert u['phaseReceiptValidated'] and v['phaseReceiptValidated']
 assert all(u[f]==v[f]==prior[f] for f in ('actual','focus','viewport','viewportCSS','css','backing','DPR','sceneTime','actorCount','physicsSHA256','phase','round','tide')),k
 assert u['tileKeys']==v['tileKeys'] and u['tileKeys']
 rs=min(.68,max(.05,2**(math.floor(math.log2(u['actual']['scale']*1.25)*4)/4)))
 assert all(float(t.split(':')[0])==rs for t in u['tileKeys'])
 for mode,p,h in [('raw','raw','rawSHA256'),('DOM','png','pngSHA256')]:
  if u[h]!=prior[h]:issues.append([k,mode,'Frozen B golden hash drift'])
  x,y=[im(arm,frame[p],frame[h])for arm,frame in zip('BS',(u,v))]
  l,t=u['viewport']['left'],u['viewport']['top'];z=u['actual']['scale']
  row=measure(x,y,l,t,z,math.ceil(2*z/rs+1),[k,mode])
  if row['failures'] or (u['view']=='ordinary' and row['pixelsChanged']):issues.append([k,mode,'Protected actual frame pixels changed'])
  if u['viewportCSS']==[390,844] and u['view'] in {'south','southwest','southeast'}:
   edge=round((6400-t)*z);assert edge==436 and len(x[0])==390
   q,r=[cutRGB(g,edge)for g in (x,y)]
   row['onceHorizontalCut']={'endingRows':list(range(edge-2,edge+4)),'B_gt5':q,'S_gt5':r}
   if q[2]!=390 or max(r)>39 or max(r)>=.1*q[2] or not row['pixelsChanged']:
    issues.append([k,mode,'Visible mobile target neither reproduced nor materially removed'])
  frameRows.append(row)
for x,y in zip(a['visits'],b['visits']):
 assert x['viewportCSS']==y['viewportCSS'] and x['ordinaryContactAndOwners']==y['ordinaryContactAndOwners'] and x['tileRoutes']==y['tileRoutes']
 assert x['southTileRoutes'] is None and y['southTileRoutes']['candidate']>0 and y['southTileRoutes']['stock']>0
 assert x['tileFrames'].keys()==y['tileFrames'].keys()
 for k in x['tileFrames']:
  seen.add(k)
  u,v=x['tileFrames'][k],y['tileFrames'][k]
  assert all(u[f]==v[f]for f in ('id','key','left','top','rs'))
  rs=u['rs'];l,t=[u[q]-2/rs for q in ['left','top']]
  p,q=[im(arm,e['path'],e['sha256'])for arm,e in zip('BS',(u,v))]
  assert p.shape==(516,516,4)
  r=measure(p,q,l,t,rs,2,[x['viewportCSS'],k])
  if r['failures']:issues.append([x['viewportCSS'],k,'Native cache RGBA/alpha outside allowed support'])
  if (t+516/rs<=4588.44 or t>6402 or u['top']<0) and r['pixelsChanged']:
   issues.append([x['viewportCSS'],k,'Geometrically unreachable stock tile changed'])
  if x['viewportCSS']==[390,844] and k=='0.0625:-1:0':
   column=round((-5000-l)*rs-.5);assert 0<=column<516
   w=[j for j in range(516) if 5120<=t+(j+.5)/rs<=6410]
   r['previousOfflineAlphaBlocker']={'sourceX':l+(column+.5)/rs,'sampleCount':len(w),'B_alpha':[int(p[j,column,3])for j in w],
    'S_alpha':[int(q[j,column,3])for j in w],'equalFullRGBA':bool(np.array_equal(p[w,column],q[w,column]))}
   if not r['previousOfflineAlphaBlocker']['equalFullRGBA']:issues.append([x['viewportCSS'],k,'Original west outer edge texels altered'])
  tileRows.append(r)
assert len(seen)==63 and any(r.get('previousOfflineAlphaBlocker') for r in tileRows),len(seen)
res={'scope':'Actual native B/S new Scenes, parked first turn, source/cameras frozen, no deployment or art approval',
 'framePairs':len(frameRows),'distinctCacheKeys':len(seen),'cachePairs':len(tileRows),'frameMeasures':frameRows,'tileMeasures':tileRows,'HOLDs':issues,
 'gate':'No release under any outcome; require independent art review'}
(W/'comparison.json').write_text(json.dumps(res,indent=2)+'\n')
assert not issues,issues
