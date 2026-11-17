"""Partition two authored vector surfaces on a low-contrast geological boundary.
No painted pixels, walking contours or collision are synthesized. The actual native
Boolean intersection is saved. A visual check remains mandatory.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json,subprocess,os,hashlib
from lxml import etree as E
from svgpathtools import parse_path
A=Path(__file__).resolve().parent;R=A.parents[1]
a=np.asarray(Image.open(R/'_local/reports/stage48-region/joint.png').convert('RGBA')).astype(float);b=np.asarray(Image.open(R/'_local/reports/stage48-region/deep.png').convert('RGBA')).astype(float)
h,w=a.shape[:2];cost=np.mean(abs(a[:,:,:3]-b[:,:,:3]),axis=2)+(abs(a[:,:,3]-b[:,:,3]))
# Follow small color differences; cost for turning avoids raster serrations.
def seam(c):
 n,m=c.shape;prev=c[:,0].copy();back=np.zeros((n,m),np.int16)
 for j in range(1,m):
  choices=[]
  for d in range(-2,3):
   ar=np.full(n,1e9);lo=max(0,d);hi=min(n,n+d);ar[lo:hi]=prev[lo-d:hi-d]+abs(d)*1.5;choices.append(ar)
  z=np.stack(choices);idx=z.argmin(0);back[:,j]=np.arange(n)-(idx-2);prev=z.min(0)+c[:,j]
 k=int(prev.argmin());out=[]
 for j in range(m-1,-1,-1):out.append(k);k=int(back[k,j]) if j else k
 return out[::-1]
l=seam(cost[:,:140].T+np.linspace(0,4,140)[:,None]);r=[w-140+x for x in seam(cost[:,w-140:].T+np.linspace(4,0,140)[:,None])];bottom=[450+y for y in seam(cost[450:630,:]+np.linspace(0,3,180)[:,None])]
def reduce(p):
 out=[p[0]]
 for i in range(1,len(p)-1):
  if (p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])!=(p[i+1][0]-p[i][0],p[i+1][1]-p[i][1]):out.append(p[i])
 return out+[p[-1]]
def coords(p):return ' '.join(f'{x*2-350},{y*2+300}'for x,y in reduce(p))
side='M'+coords([(l[y],y)for y in range(h)])+'L'+coords([(r[y],y)for y in reversed(range(h))])+'Z'
base='M-5000,-5000H5000V-5000L'+coords([(x,bottom[x])for x in reversed(range(w))])+'L-5000,5000Z'
# top-left -> top-right -> bottom right to left -> close, no self intersection.
base='M-350,-5000H1886L'+coords([(x,bottom[x])for x in reversed(range(w))])+'Z'
ns='http://www.w3.org/2000/svg';root=E.Element('{'+ns+'}svg',nsmap={None:ns},viewBox='-350 300 2236 1300')
for i,d in enumerate([side,base]):E.SubElement(root,'{'+ns+'}path',id=f'p{i}',d=d,fill='#000')
inp=A/'joint-region-v12-input.svg';out=A/'joint-region-v12-native.svg';E.ElementTree(root).write(str(inp))
subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process',f'--actions=select-all;path-intersection;export-plain-svg;export-filename:{out};export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(A/'joint-region-profile')},capture_output=True,check=True)
paths=[parse_path(p.get('d')).d() for p in E.parse(str(out)).findall('.//{*}path')]
json.dump({'method':'low color-discontinuity partition between two authored native surfaces; actual Inkscape Boolean intersection','clip':paths,'nativeSHA256':hashlib.sha256(out.read_bytes()).hexdigest(),'status':'candidate requires visual review'},open(A/'joint-region-v12.json','w'),indent=2)
