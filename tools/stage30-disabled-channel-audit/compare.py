import os,json,hashlib
from pathlib import Path
from PIL import Image,ImageChops
p=Path(os.environ['OUT']);meta={v:json.loads((p/v/'proof.json').read_text()) for v in ['stock','candidate']};a,b=[{(f['stage'],f['width'],f['view']):f for f in meta[v]['frames']} for v in ['stock','candidate']];assert len(a)==len(b)==16 and a.keys()==b.keys();checks=[]
for k,x in a.items():
 y=b[k];assert all(x[v]==y[v] for v in ['actual','viewport','physicsSha256','assetBounds','assetPlaced','actorCount','css','backing']),k
 ims=[]
 for v,f in [('stock',x),('candidate',y)]:
  file=p/v/f['name'];assert hashlib.sha256(file.read_bytes()).hexdigest()==f['rasterSha256'];ims.append(Image.open(file).convert('RGBA'))
 d=ImageChops.difference(ims[0],ims[1]);r={'key':k,'deltaBBox':d.convert('RGB').getbbox(),'maxRGBA':[z[1] for z in d.getextrema()]};checks.append(r)
 if k[0]==29:assert not any(r['maxRGBA']),r
(p/'paired-checks.json').write_text(json.dumps(checks,indent=2));print('16 exact camera/state pairs; Stage29 six raw pixel controls exact. Stage30 differences measured without artistic pass assumption.')
