import json, os
from pathlib import Path
from PIL import Image,ImageChops
root=Path(os.environ["OUT"]); proof=json.loads((root/"proof.json").read_text())
frames={r["name"]:r for r in proof["frames"]}; results=[]
assert len(frames)==24
for name,o in frames.items():
 if o['mode']!='original':continue
 name=name.removesuffix('-original')
 c=frames[name+'-candidate']; assert all(o[k]==c[k] for k in ('viewport','canvas','limits','focus','view','scene','setup','occupiedPixels'))
 p,q=[Image.open(root/(name+'-'+mode+'.png')).convert('RGBA') for mode in ('original','candidate')]
 assert ImageChops.difference(p.getchannel('A'),q.getchannel('A')).getbbox() is None
 diff=ImageChops.difference(p.convert("RGB"),q.convert("RGB"))
 box=diff.getbbox()
 if o['target'] in ('east-join',):assert box is None,(name,box)
 if o['target']=='west-join':assert box is not None
 results.append({'name':name,'alphaIdentical':True,'changedBBox':box})
(root/'invariants.json').write_text(json.dumps(results,indent=2))
