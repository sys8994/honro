from pathlib import Path
from PIL import Image
import numpy as np,json,xml.etree.ElementTree as E,copy,subprocess
P=Path(__file__).parent;N='{http://www.w3.org/2000/svg}';a=np.array(Image.open('stage7-semantic-study/mask/grass.png'))[:,:,3]>0;a[:912]=False
# Extract exact pixel-cell union boundary. No paint image is changed.
edges={}
def add(p,q):edges.setdefault(p,[]).append(q)
H,W=a.shape
for y,x in zip(*np.where(a)):
 x=int(x);y=int(y)
 if y==0 or not a[y-1,x]:add((x,y),(x+1,y))
 if x==W-1 or not a[y,x+1]:add((x+1,y),(x+1,y+1))
 if y==H-1 or not a[y+1,x]:add((x+1,y+1),(x,y+1))
 if x==0 or not a[y,x-1]:add((x,y+1),(x,y))
loops=[]
while edges:
 start=next(iter(edges));p=start;loop=[]
 while True:
  loop.append(p);qs=edges[p];q=qs.pop()
  if not qs:del edges[p]
  p=q
  if p==start:break
 # remove only collinear vertices, preserve all pixel-cell coverage
 keep=[]
 for i,p in enumerate(loop):
  before=loop[i-1];after=loop[(i+1)%len(loop)]
  if (p[0]-before[0])*(after[1]-p[1])!=(p[1]-before[1])*(after[0]-p[0]):keep.append(p)
 loops.append(keep)
# Reverse mask boundary winding for complement in an outer rectangle.
ds=['M-1200 0H2648V3600H-1200Z']
for loop in loops:ds.append('M'+'L'.join(f'{x} {y}' for x,y in reversed(loop))+'Z')
(P/'geometry.json').write_text(json.dumps({'sourceMask':'mask/grass.png alpha>0, original source-space1x semantic halo; y>=912 only','loops':len(loops),'vertices':sum(map(len,loops)),'pathChars':sum(map(len,ds)),'changedPaintImages':False,'paths':ds},indent=2))
for name in ['full','portrait-left','desktop-right','join','source-contact']:
 s=E.parse('stage7-semantic-study/lateral-edit/'+name+'.svg').getroot();defs=s.find(N+'defs');clip=E.SubElement(defs,N+'clipPath',id='source-fixed-grass-complement',clipPathUnits='userSpaceOnUse')
 E.SubElement(clip,N+'path',d=' '.join(ds))
 # locate ONLY previous generated central field image carrying diagnostic editable mask.
 hit=0
 for parent in s.iter():
  for child in list(parent):
   if child.tag==N+'image' and child.get('mask')=='url(#editable)':
    i=list(parent).index(child);parent.remove(child);child.attrib.pop('mask');child.set('clip-path','url(#source-fixed-grass-complement)');g=E.Element(N+'g',{'clip-path':'url(#nonwalk-envelope)'});g.append(child);parent.insert(i,g);hit+=1
 assert hit==1,hit
 E.ElementTree(s).write(P/(name+'.svg'));subprocess.run(['inkscape',str(P/(name+'.svg')),'--export-filename='+str(P/(name+'.png'))],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print({'loops':len(loops),'vertices':sum(map(len,loops)),'chars':sum(map(len,ds))})
