"""Register actual Inkscape material trace inside unchanged canonical terrain.
Three distinct source strips map once each. No collision/outline geometry authored.
Only artwork is warped to the existing contact; base palette merges into substrate.
"""
import json,gzip,hashlib,copy,math,os,re
from pathlib import Path
import xml.etree.ElementTree as E
import numpy as np
from PIL import Image
from scipy.ndimage import median_filter,uniform_filter1d
from svgpathtools import parse_path,CubicBezier,QuadraticBezier,Line
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'art/act2-near-vector-candidates/stage20-contact-v3';OUT=ROOT/'_local/stage20-contact-v3';OUT.mkdir(exist_ok=True)
source=ART/'inkscape-raw.svg.gz'
raw=gzip.decompress(source.read_bytes());r=E.fromstring(raw);im=np.array(Image.open(ART/'source.png'));H,W=im.shape[:2]
stage=json.loads(gzip.decompress((ROOT/'art/act2-near-vector-candidates/stage20-exit-v1/source/effective-stage.json.gz').read_bytes()));floor=next(t for t in stage['terrains'] if t['id']=='act2-floor');points=floor['points'];ix=floor['properties']['honroWalkEdges'];px=np.array([points[i]['x'] for i in ix]+[points[ix[-1]+1]['x']]);py=np.array([points[i]['y'] for i in ix]+[points[ix[-1]+1]['y']])
rows=[(0,235),(236,477),(478,H)];tops=[]
for lo,hi in rows:
 alpha=im[lo:hi,:,3]>128;top=alpha.argmax(axis=0)+lo;ok=alpha.any(axis=0);top=np.interp(np.arange(W),np.flatnonzero(ok),top[ok]);tops.append(uniform_filter1d(median_filter(top,size=21),size=31))
SCALE=float(os.environ.get('HONRO_CONTACT_SCALE','.72'))
def mappt(z,strip):
 x=np.clip(z.real,24,W-24);wx=strip*3000+(x-24)/(W-48)*3000
 y=np.interp(wx,px,py)+4+(z.imag-np.interp(x,np.arange(W),tops[strip]))*(3000/(W-48))*SCALE
 return complex(wx,y)
def pair(z):return f'{z.real:.4f},{z.imag:.4f}'
def warp(sub,strip):
 out=['M'+pair(mappt(sub[0].start,strip))]
 for seg in sub:
  if isinstance(seg,Line):out+=['L'+pair(mappt(seg.end,strip))]
  elif isinstance(seg,CubicBezier):out+=['C'+','.join(pair(mappt(z,strip)) for z in [seg.control1,seg.control2,seg.end])]
  elif isinstance(seg,QuadraticBezier):out+=['Q'+','.join(pair(mappt(z,strip)) for z in [seg.control,seg.end])]
  else:raise ValueError(type(seg))
 if sub.isclosed():out+=['Z']
 return ''.join(out)
warped=[[],[],[]];counts=[]
for color,group in enumerate(r):
 if color<2:continue # darker source substrate becomes existing body, avoids straight bottom seam
 for path in group:
  for sub in parse_path(path.get('d')).continuous_subpaths():
   x0,x1,y0,y1=sub.bbox();strip=next((i for i,(lo,hi) in enumerate(rows) if lo<=(y0+y1)/2<hi),None)
   if strip is None:raise ValueError('outside strips')
   palette={2:'#3c535c',3:'#536e75',4:'#788b89'}
   warped[strip].append({'tag':'path','d':warp(sub,strip),'fill':palette[color],'stroke':'none'})
# Macro fields are distinct authored panels, each used once, not tiled.
macro=[[],[]];referenceMacro=[[],[]]
def macropt(z,panel,mw,mh):
 if panel==0:
  wx=float(np.interp(z.real/mw,[0,.12,.88,1],[-6000,0,9000,15000]));surface=float(np.interp(wx,px,py));wy=surface-20+(29820-surface)*(max(0,z.imag/mh)**2)
 else:
  # Rotate the distinct portrait source to the roof's long horizontal mass.
  wx=-6000+z.imag/mh*10290;wy=-1900+(1-z.real/mw)*5700
 return complex(wx,wy)
def compact(sub,fn,digits=1):
 def protected(z):return abs(z.imag-float(np.interp(z.real,px,py)))<32
 def rnd(z,keep=False):return complex(round(z.real,6 if keep else digits),round(z.imag,6 if keep else digits))
 def fmt(z):return ','.join(format(v,'.6f').rstrip('0').rstrip('.') or '0' for v in [z.real,z.imag])
 p=fn(sub[0].start);prev=rnd(p,protected(p));out=['M'+fmt(prev)]
 for seg in sub:
  points=[fn(seg.end)] if isinstance(seg,Line) else [fn(seg.control1),fn(seg.control2),fn(seg.end)]
  keep=protected(fn(seg.start)) or any(protected(z) for z in points)
  points=[rnd(z,keep) for z in points];end=points[-1]
  if isinstance(seg,Line):out+=['l'+fmt(end-prev)]
  elif isinstance(seg,CubicBezier):out+=['c'+','.join(fmt(z-prev) for z in points)]
  else:raise ValueError(type(seg))
  prev=end
 if sub.isclosed():out+=['z']
 text=''.join(out)
 # Lossless lexical compaction: implicit repeated commands and sign separators.
 text=re.sub(r'(?<![0-9.])(-?)0\.',r'\1.',text)
 text=re.sub(r',(?=-)', '', text)
 tokens=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)',text);out=[];last=None;number=False
 for token in tokens:
  if token.isalpha():
   if token not in 'MmZz' and token==last:continue
   out.append(token);last=token;number=False
  else:
   if number and not token.startswith(('-', '+')):out.append(' ')
   out.append(token);number=True
 return ''.join(out)
referenceContact=copy.deepcopy(warped)
# Contact curves retain their original high precision: extra quantization failed
# the strict protected color-edge test at entry; no tolerance relaxation.
for panel,name in enumerate(['dense','roof']):
 mr=E.fromstring(gzip.decompress((ART/name/'inkscape-raw.svg.gz').read_bytes()));mw,mh=Image.open(ART/name/'source.png').size
 for color,gp in enumerate(mr):
  if color==0:continue
  for pi,path in enumerate(gp):
   for sub in parse_path(path.get('d')).continuous_subpaths():
    d=compact(sub,lambda z:macropt(z,panel,mw,mh));assert len(d)<60000,len(d)
    referenceMacro[panel].append({'tag':'path','d':compact(sub,lambda z:macropt(z,panel,mw,mh),digits=6),'fill':['#283b46','#30464f','#3a5059','#485e66','#526b72'][color],'stroke':'none'})
    macro[panel].append({'tag':'path','d':d,'fill':['#283b46','#30464f','#3a5059','#485e66','#526b72'][color],'stroke':'none','partition':f'{panel}-{color}-{pi}'})
def compounds(nodes):
 groups={}
 for n in nodes:groups.setdefault((n['fill'],n.get('partition','')),[]).append(n['d'])
 result=[]
 for (fill,_partition),ds in groups.items():
  # Conservative spatial connectivity: holes/overlaps remain one fill operation.
  bounds=[parse_path(d).bbox() for d in ds];parents=list(range(len(ds)))
  def root(i):
   while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
   return i
  for i,a in enumerate(bounds):
   for j in range(i):
    b=bounds[j]
    if a[0]<=b[1] and b[0]<=a[1] and a[2]<=b[3] and b[2]<=a[3]:parents[root(i)]=root(j)
  connected={}
  for i,d in enumerate(ds):connected.setdefault(root(i),[]).append(d)
  if sum(map(len,ds))<=240000:connected={0:ds}
  for texts in connected.values():
   parts=[];cur=''
   for d in texts:
    if len(cur)+len(d)>60000:parts.append(cur);cur=''
    cur+=d
   if cur:parts.append(cur)
   assert len(parts)<=32 and sum(map(len,parts))<=240000,(fill,len(parts),sum(map(len,parts)))
   result.append({'tag':'path','dParts':parts,'fill':fill,'stroke':'none','fillRule':'nonzero'})
 return result
# Reference geometry is an art-measurement input, never a production asset.
(OUT/'high-precision-reference.json').write_text(json.dumps({'macro':referenceMacro,'contact':referenceContact,'scope':'High precision unbudgeted art reference only; production assets still enforce unchanged limits.'},separators=(',',':')))
warped=[compounds(ns) for ns in warped];macro=[compounds(ns) for ns in macro]
parts=['outer-v1','west-v2','east-v2']
for part,strip in zip(parts,range(3)):
 p=OUT/part;p.mkdir(exist_ok=True)
 a=json.loads(gzip.decompress((ART/f'baseline-{part}.json.gz').read_bytes()))
 if part=='outer-v1':
  a['vector']['clips']['floorMaterial']=[a['vector']['clips']['canonicalSolid'][0]]
  a['vector']['root']={'tag':'g','clipPath':'floorMaterial','children':macro[0]}
 elif part=='west-v2':
  a['vector']['clips']['roofMaterial']=[a['vector']['clips']['canonicalSolid'][1]]
  a['vector']['root']={'tag':'g','clipPath':'roofMaterial','children':macro[1]}
  a['bounds']={'x':-6000,'y':-1900,'w':10290,'h':5700};a['reference']['bounds']=copy.deepcopy(a['bounds']);a['reference']['heightM']=95;a['reference']['foot']={'x':-6000,'y':3800}
 else:
  a['vector']['root']={'tag':'g','children':sum(warped,[])}
  old=a['bounds'];a['bounds']={'x':min(0,old['x']),'y':min(1700,old['y']),'w':max(9000,old['x']+old['w'])-min(0,old['x']),'h':max(4900,old['y']+old['h'])-min(1700,old['y'])};a['reference']['bounds']=copy.deepcopy(a['bounds']);a['reference']['heightM']=a['bounds']['h']/60
 def count(n):return 1+sum(count(c) for c in n.get('children',[]))
 a['params']['nodeCount']=count(a['vector']['root'])
 a['params']['contactMaterialSource']='stage20-contact-v3';a['params']['contactMaterialStrip']=strip
 (p/'native.json').write_text(json.dumps(a,separators=(',',':')))
 for f in ['placement.json','pixel-config.json']:(p/f).write_bytes((ROOT/f'art/act2-near-vector-candidates/stage20-exit-v1/{part}'/f).read_bytes())
 counts.append({'contactStrip':strip,'drawingAsset':'stage20-east-v2','compoundFills':len(warped[strip]),'bytes':sum(sum(map(len,p['dParts'])) for p in warped[strip])})
(OUT/'registration.json').write_text(json.dumps({'sourceSha256':hashlib.sha256((ART/'source.png').read_bytes()).hexdigest(),'inkscapeRawSha256':hashlib.sha256(raw).hexdigest(),'sourceStripRows':rows,'worldRanges':[[0,3000],[3000,6000],[6000,9000]],'counts':counts,'scope':'Material warp only; canonical collision/contact clip unchanged. Darkest two source bands use existing substrate to avoid horizontal bottom border.','scale':SCALE},indent=2));print(counts)
