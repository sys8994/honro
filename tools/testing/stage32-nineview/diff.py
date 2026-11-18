import sys,json
from pathlib import Path
from PIL import Image,ImageChops
base,new=map(Path,sys.argv[1:]);rows=[]
for p in sorted(new.glob('registered-*.png')):
 if p.name.endswith('-mask.png'):continue
 view=p.stem.removeprefix('registered-');a=Image.open(base/('baseline-'+view+'.png')).convert('RGBA');b=Image.open(p).convert('RGBA');assert a.size==b.size
 changed=sum(x!=y for x,y in zip(a.getdata(),b.getdata()));diff=ImageChops.difference(a,b);diff.save(new/('difference-'+view+'.png'))
 aa=json.load(open(base/('baseline-'+view+'.json')));bb=json.load(open(new/('registered-'+view+'.json')));assert aa['physicsSha256']==bb['physicsSha256'];assert aa['camera']==bb['camera'];rows.append(dict(view=view,changedPixels=changed,diagnosticOnly=True))
assert len(rows)==9
(new/'before-after.json').write_text(json.dumps(dict(scope='Actual 9f78 vs registered full Scene. Differences retained, NOT a declared-scope preservation pass or art acceptance.',rows=rows),indent=2))
