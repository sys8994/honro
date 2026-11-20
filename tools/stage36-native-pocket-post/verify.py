from PIL import Image,ImageChops
from pathlib import Path
from hashlib import sha256
import json,os,math
o=Path(os.environ['OUT'])
a,b=([x for x in json.loads((o/k/'proof.json').read_text())['frames']] for k in ['before','after'])
assert len(a)==len(b)==8
report=[]
for x,y in zip(a,b):
 for key in ['stage','view','actual','viewport','physicsSha256','actorCount','css','backing','name']: assert x[key]==y[key],(key,x['name'])
 files=[o/k/x['name'] for k in ['before','after']]
 for f,m in zip(files,[x,y]): assert sha256(f.read_bytes()).hexdigest()==m['rasterSha256']
 im,jm=[Image.open(f).convert('RGB') for f in files]
 d=ImageChops.difference(im,jm)
 z=x['actual']['scale'];v=x['viewport'];l,t=v['left'],v['top']
 roi=(math.floor((2255-l)*z)-2,math.floor((1720-t)*z)-2,math.ceil((2407-l)*z)+2,math.ceil((1809-t)*z)+2)
 changed=outsideStrong=outsideMinor=maxOutside=skyBefore=skyAfter=0
 for yy in range(im.height):
  for xx in range(im.width):
   mag=max(d.getpixel((xx,yy)))
   inside=roi[0]<=xx<roi[2] and roi[1]<=yy<roi[3]
   if mag:
    changed+=1
    if not inside:
     maxOutside=max(maxOutside,mag)
     if mag<=4: outsideMinor+=1
     else: outsideStrong+=1
   if inside:
    skyBefore+=im.getpixel((xx,yy))[2]>130
    skyAfter+=jm.getpixel((xx,yy))[2]>130
 if x['stage']==36:
  r=tuple(n+q for n,q in zip(roi,[-15,-15,15,15]))
  ic,jc=[f.crop(r) for f in (im,jm)]
  pair=Image.new('RGB',(ic.width*2,ic.height));pair.paste(ic,(0,0));pair.paste(jc,(ic.width,0))
  pair.resize((pair.width*3,pair.height*3),Image.Resampling.NEAREST).save(o/('roi-'+x['view']+'.png'))
 report.append(dict(stage=x['stage'],view=x['view'],changed=changed,bbox=d.getbbox(),roi=roi,outsideMinor=outsideMinor,outsideStrong=outsideStrong,maxOutside=maxOutside,skyBefore=skyBefore,skyAfter=skyAfter))
(o/'pixel-proof.json').write_text(json.dumps(report,indent=2))
assert all(q['changed']==0 for q in report if q['stage']==37),report
assert all(q['changed']>0 and q['outsideStrong']==0 and q['skyBefore']>q['skyAfter'] for q in report if q['stage']==36),report
