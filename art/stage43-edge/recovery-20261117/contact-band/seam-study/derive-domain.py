"""Choose a native clip termination through matching deep/contact material.
PNG inputs are read-only native raster measurements; only SVG/JSON clip geometry
is authored. No raster repainting, texture stretching or repeating tiles.
"""
from pathlib import Path
from PIL import Image
from lxml import etree as E
import numpy as np,json,subprocess,os
p=Path(__file__).parent;root=p.parent;n='{http://www.w3.org/2000/svg}'
a=np.asarray(Image.open(p/'contact.png').convert('RGBA'),dtype=np.float64);b=np.asarray(Image.open(p/'deep.png').convert('RGBA'),dtype=np.float64)
a[:,:,:3]*=a[:,:,3:4]/255;b[:,:,:3]*=b[:,:,3:4]/255
lo,hi=30,221 # source y810..1000, away from image termination at1020
err=np.mean(abs(a-b),axis=2)[lo:hi];lum=np.mean((a[:,:,:3]+b[:,:,:3])/2,axis=2)[lo:hi]
ys=np.arange(lo,hi)+780;cost=err*2+lum*.014+((ys[:,None]-900)**2)*.0001
h,w=cost.shape;prev=np.zeros((w,h),np.int8);dp=cost[:,0].copy();offsets=list(range(-2,3))
for x in range(1,w):
 cand=[]
 for dy in offsets:
  v=np.full(h,np.inf)
  if dy<0:v[-dy:]=dp[:h+dy]
  elif dy>0:v[:h-dy]=dp[dy:]
  else:v=dp.copy()
  cand.append(v+abs(dy)*.15)
 c=np.stack(cand);ix=np.argmin(c,axis=0);prev[x]=np.asarray(offsets,dtype=np.int8)[ix];dp=cost[:,x]+c[ix,np.arange(h)]
y=int(np.argmin(dp));path=[0]*w;path[-1]=y
for x in range(w-1,0,-1):y+=int(prev[x,y]);path[x-1]=y
points=[(x,int(y+lo+780))for x,y in enumerate(path)]
# Drop only exactly collinear grid vertices, preserving measured geometry.
simple=[]
for v in points:
 while len(simple)>1:
  aa,bb=simple[-2:]
  if (bb[0]-aa[0])*(v[1]-bb[1])==(bb[1]-aa[1])*(v[0]-bb[0]):simple.pop()
  else:break
 simple.append(v)
d=f'M0 650H2172V{simple[-1][1]} '+ ' '.join(f'L{x} {y}'for x,y in reversed(simple))+' Z'
asset=json.loads((root/'stage43-recovery-contact-band/v5-optimized/asset-contact-v5.json').read_text());asset['vector']['clips']['contact-domain']=[d];asset['params']['reviewStatus']='UNAPPROVED source-correspondence seam termination study';(p/'asset.json').write_text(json.dumps(asset,separators=(',',':'))+'\n')
t=E.parse(str(root/'stage43-recovery-contact-band/v5-optimized/composed-import.svg'));clips=t.findall('.//'+n+'clipPath[@id="contact-domain"]');assert len(clips)==1
for q in list(clips[0]):clips[0].remove(q)
E.SubElement(clips[0],n+'path',d=d);f=p/'composed.svg';t.write(str(f));env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'};subprocess.run(['inkscape',str(f),'--export-filename='+str(p/'composed.png')],env=env,capture_output=True,check=True)
selected=err[np.asarray(path),np.arange(w)];(p/'report.json').write_text(json.dumps({'method':'Source-correspondence native clip boundary, DP through actual matching material; all protected clips and color geometry unchanged','sourceRange':[min(y for x,y in points),max(y for x,y in points)],'vertices':len(simple),'meanRGBAErrorAtBoundary':float(selected.mean()),'exactMatchBoundaryFraction':float(np.mean(selected==0)),'sourceUnchanged':True,'productionChanged':False,'status':'visual review pending'},indent=2))
print((p/'report.json').read_text())
