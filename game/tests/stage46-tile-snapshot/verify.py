import json, os
from pathlib import Path
from PIL import Image,ImageChops
root=Path(os.environ["OUT"]); proof=json.loads((root/"proof.json").read_text())
frames={r["name"]:r for r in proof["frames"]}; results=[]
assert len(frames)==36
for name,o in frames.items():
 if o['mode']!='original':continue
 name=name.removesuffix('-original')
 c=frames[name+'-candidate']; assert all(o[k]==c[k] for k in ('viewport','canvas','limits','focus','view','scene','setup','occupiedPixels'))
 p,q=[Image.open(root/(name+'-'+mode+'.png')).convert('RGBA') for mode in ('original','candidate')]
 assert ImageChops.difference(p.getchannel('A'),q.getchannel('A')).getbbox() is None
 diff=ImageChops.difference(p.convert("RGB"),q.convert("RGB"))
 box=diff.getbbox()
 # No changed pixels outside the registered existing west-side tile fringes.
 from math import floor, ceil
 zones=[-600,0,600,1200,1800]; scale=o['scene']['scale']*4*o['canvas']['dpr']
 allow=set()
 for x0 in zones:
  mid=(o['canvas']['width']/2+(x0*4-o['scene']['x'])*o['scene']['scale'])*o['canvas']['dpr']
  allow.update(range(floor(mid-1.85*scale)-1, ceil(mid)+1))
 if box:
  for x in range(box[0],box[2]):
   if x not in allow:assert diff.crop((x,0,x+1,p.height)).getbbox() is None,(name,x)

 if o['target']=='west-join':assert box is not None
 if name=='390x1000-west-join':
  from statistics import median
  from math import dist
  def site(im):
   return median(dist(im.getpixel((137,y))[:3],[(a+b)/2 for a,b in zip(im.getpixel((136,y))[:3],im.getpixel((138,y))[:3])]) for y in range(40,760))
  old,new=site(p),site(q)
  assert old>10 and new<3, (old,new)
  results.append({'measuredNativeHairline':{'xCss':137,'sampleY':[40,759],'medianRGBL2Original':old,'medianRGBL2Candidate':new}})
 results.append({'name':name,'alphaIdentical':True,'changedBBox':box,'originalDrawMs':o['drawMs'],'candidateDrawMs':c['drawMs'],'renderedStrips':c['tracked'],'warm':c['warm']})
(root/'invariants.json').write_text(json.dumps(results,indent=2))
