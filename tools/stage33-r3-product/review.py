"""Compare all captures without turning the historical R3 strict audit into a pass."""
import json
from pathlib import Path
from PIL import Image,ImageChops
from guard import sha
from metrics import pixels,raster,P
NATIVE_ARCHIVE='a8f6ae2de425e7cdd697cdfecf4c0889ba13ddf92ea5f19cc6ce32f000e8be66'
KNOWN={(1439,480):((76,85,106,255),(77,84,103,255)),(1439,481):((83,106,154,255),(83,106,153,255))}
def change(i0,i1,pose,covered,raw):
 assert i0.size==i1.size
 d=ImageChops.difference(i0,i1)
 cs=d.split(); r=ImageChops.lighter(ImageChops.lighter(cs[0],cs[1]),cs[2])
 outside=[]; alpha=sum(n>0 for n in cs[3].getdata())
 w,h=r.size; viewport=pose['viewport']; x,y=viewport['left'],viewport['top']
 # Ordinary/CSS captures use the native scene scale; device backing pixels use the exact canvas size.
 z=pose['actual']['scale']; dw,dh=pose['backing']
 rx=dw/pose['css'][0] if raw else 1; ry=dh/pose['css'][1] if raw else 1
 # Rounding the backing dimension is not itself a new support bound.
 sx,sy=z*rx,z*ry; count=0
 for i,n in enumerate(r.getdata()):
  if not n:continue
  count+=1; u,v=i%w,i//w
  xl,yt=x+u/sx,y+v/sy; xr,yb=xl+1/sx,yt+1/sy
  if covered and -3240<=xl<=xr<=10630 and 4800<=yt<=yb<=5950:continue
  A=i0.getpixel((u,v)); B=i1.getpixel((u,v))
  outside.append({'xy':[u,v],'world':[xl,yt,xr,yb],'A':A,'B':B,'signedChannelDelta':[b-a for a,b in zip(A,B)]})
 return {'RGBChanged':count,'alphaChangedAnywhere':alpha,'outsideCount':len(outside),'outside':outside,'rasterBoundsRatio':[rx,ry]}

def review_pairs(out,p,decode,save):
 old={'north','east','south','southwest','southeast'}
 names=sorted(k[2:] for k in p['frames'] if k.startswith('A-'))
 complete=len(names)==20 and len(p['frames'])==40 and len(p['visits'])==8 and all(v['status']=='CAPTURED' for v in p['visits'])
 pending=[]; alpha_or_state=[]; required_visual=[]
 for k in names:
  if 'B-'+k not in p['frames']:continue
  n=k.rsplit('-',1)[1]; dpr2='-dpr2-' in k
  a,b=(p['frames'][v+'-'+k]for v in ('A','B'))
  assert all(a[z]==b[z]for z in ('actual','viewport','physics','tide','actualTerrainIDs','unitCount','css','backing','phase','round','dpr'))
  assert a['sourceOwner']['low']['declared']==b['sourceOwner']['low']['declared']
  dd=b['sourceOwner']['deep']['declared']['id']
  assert a['sourceOwner']['mid']==[x for x in b['sourceOwner']['mid']if x!=dd]
  assert a['actualDrawOwnerIDs']==[x for x in b['actualDrawOwnerIDs']if x!=dd]
  exact_whole=n in ('north','ordinary') or n=='east' and k.startswith('s33-1440')
  rb={'wholeProtected':exact_whole,'withinArmColdWarmBytes':{v:f['steadyEqualsCold'] for v,f in zip('AB',(a,b))}}
  p['comparisons'][k]=rb
  for fld in ('cold_raw','cold_dom','steady_raw','steady_dom'):
   x0,x1=[(out/f[fld]).read_bytes()for f in (a,b)]
   assert all(sha(x)==f[fld+'SHA256'] for x,f in zip((x0,x1),(a,b)))
   i0,i1=map(decode,(x0,x1))
   m=change(i0,i1,a,not exact_whole,fld.endswith('raw'))
   rb[fld]=m
   if not dpr2 and n in old:
    mm=pixels(i0,i1,a,exact_whole)
    if n in ('south','southwest','southeast'):
     r=raster(i0,i1,a)
     good=(r['oldBoundaryAColumns']>=.80*r['testedColumns'] and r['oldBoundaryBLongest']<=.60*r['oldBoundaryALongest'] and r['oldBoundaryBColumns']<=.70*r['oldBoundaryAColumns'] and r['warmBrightBChangedColumns']<=.05*r['testedColumns'] and r['warmBrightBLongest']<=(8 if i0.width==1440 else 3))
     mm['raster']=r; mm['oldCutAndHalo']=good;mm['strict']&=good
    m['legacyDiagnosticSameRules']=mm
   if m['alphaChangedAnywhere'] or exact_whole and m['RGBChanged']:
    alpha_or_state.append([k,fld,'whole protected or alpha'])
   unexpected=[]
   for v in m['outside']:
    xy=tuple(v['xy']); values=(tuple(v['A']),tuple(v['B']))
    authored_witness=(k=='s33-1440x900-southeast' and KNOWN.get(xy)==values)
    v['classification']='historic exact same-owner native-AA witness' if authored_witness else 'unclassified (do not treat as accepted)'
    if not authored_witness:unexpected.append(xy)
   if unexpected:pending.append([k,fld,'outside unclassified',len(unexpected)])
   if not exact_whole and n in ('south','southwest','southeast','lower') and not m['RGBChanged']:
    alpha_or_state.append([k,fld,'target missing'])
   if fld=='steady_raw' and n in ('south','southwest','southeast','shore','lower'):
    zz=a['actual']['scale']*m['rasterBoundsRatio'][1]; top=a['viewport']['top']
    u=max(0,int((4750-top)*zz)); v=min(i0.height,int((5980-top)*zz)+1)
    if v>u:
     cmp=Image.new('RGBA',(i0.width,2*(v-u)+3),(25,28,34,255))
     for j,im in enumerate((i0,i1)):cmp.paste(im.crop((0,u,i0.width,v)),(0,j*(v-u+3)))
     fn=k+'-actual-A-top-B-bottom-1x.png'
     cmp.save(out/fn);required_visual.append(fn)
   # Artifact bounds: no silent clipping of discrepant pixels. Huge failures receive full coordinate records separately.
   if len(m['outside'])>64:
    fname=k+'-'+fld+'-full-raw-outside.json';save(out/fname,m['outside'])
    m['outsideExactFile']=fname;m['outside']=m['outside'][:64]
  save(out/'RECEIPT.json',p)
 old_gates=[m[f]['legacyDiagnosticSameRules']['strict'] for k,m in p['comparisons'].items() if '-dpr2-' not in k and k.rsplit('-',1)[1]in old for f in ('cold_raw','cold_dom','steady_raw','steady_dom')]
 return {'complete':complete,'visualMachineProtection':not bool(alpha_or_state or pending),
   'newUnclassifiedOutside':pending,'hardProtectionFailures':alpha_or_state,
   'legacySignedStrictSeparately':len(old_gates)==40 and all(old_gates),'legacyDiagnosticPreviouslyFailedUnchanged':True,
   'exactHistoricNativeObservationSHA256':NATIVE_ARCHIVE,'human1xReviewRequired':required_visual,
   'naturalInteractionPhasePending':True,'offstageEvidence':'exact 49 map/packet and shared active bytes in GRAPH-DELTA.json; not a gameplay sweep','publicationAuthorization':False}
