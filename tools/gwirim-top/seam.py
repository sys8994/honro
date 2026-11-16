from pathlib import Path
import numpy as np,json,subprocess,os
from PIL import Image
from lxml import etree as E
p=Path('art/gwirim-top');a=np.asarray(Image.open(p/'source.png').convert('RGBA')).astype(float);b=np.asarray(Image.open(p/'canopy-registered.png').convert('RGBA')).astype(float)
# Choose a continuous joining boundary in the overlapping crown. This is not a new silhouette.
lo,hi=8,130;xs=np.arange(0,2172,3);c=np.mean(abs(a[lo:hi+1,xs,:3]*a[lo:hi+1,xs,3,None]/255-b[lo:hi+1,xs,:3]*b[lo:hi+1,xs,3,None]/255),axis=2)+abs(a[lo:hi+1,xs,3]-b[lo:hi+1,xs,3])*.8
c+=abs(np.arange(lo,hi+1)[:,None]-65)*.015
v=c[:,0].copy();back=np.zeros(c.shape,dtype=int)
for x in range(1,len(xs)):
 nv=np.zeros(len(v))
 for y in range(len(v)):
  ys=np.arange(max(0,y-3),min(len(v),y+4));score=v[ys]+abs(ys-y)*.15;k=ys[np.argmin(score)];nv[y]=score.min()+c[y,x];back[y,x]=k
 v=nv
y=int(v.argmin());ys=[y+lo]
for x in range(len(xs)-1,0,-1):y=back[y,x];ys.append(y+lo)
ys=ys[::-1];pts=list(zip(xs.tolist(),map(int,ys)));pts.append((2172,int(ys[-1])));(p/'seam.json').write_text(json.dumps(pts))
# Original compound alpha keeps all existing holes and lower-source boundary.
orig=json.load(open('shared/assets/environment/act5/stage44-upper-clip.json'))
print(type(orig),str(orig)[:60])
ns='http://www.w3.org/2000/svg'
def intersect(name,alpha,d,box):
 r=E.Element('svg',xmlns=ns,viewBox=box);E.SubElement(r,'path',id='a',d=alpha);E.SubElement(r,'path',id='s',d=d);E.ElementTree(r).write(str(p/(name+'-input.svg')))
 subprocess.run(['/usr/bin/inkscape',str(p/(name+'-input.svg')),'--batch-process','--actions=select-by-id:a,s;path-intersection;select-clear;export-plain-svg;export-filename:'+str(p/(name+'-raw.svg'))+';export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},check=True,capture_output=True)
base='M'+'L'.join(f'{x} {y}' for x,y in pts)+'L2172 1000H0Z'
intersect('base-clip',orig[0],base,'0 0 2172 724')
alpha=E.parse(str(p/'alpha-optimized.svg')).find('.//{*}path').get('d')
gpts=[(x*.713+3,(y+2)*.713+500.5) for x,y in pts];cap='M0 0H1549V'+str(gpts[-1][1])+'L'+'L'.join(f'{x:.3f} {y:.3f}' for x,y in reversed(gpts))+'L0 '+str(gpts[0][1])+'Z'
intersect('cap-clip',alpha,cap,'0 0 1549 1015')
