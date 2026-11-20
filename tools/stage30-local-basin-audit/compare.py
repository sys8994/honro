import os,json,hashlib,math
from pathlib import Path
from PIL import Image,ImageChops
p=Path(os.environ['OUT']);meta={v:json.loads((p/v/'proof.json').read_text()) for v in ['stock','candidate']};a,b=[{(f['stage'],f['width'],f['view']):f for f in meta[v]['frames']} for v in ['stock','candidate']];assert len(a)==len(b)==20 and a.keys()==b.keys();checks=[];fail=[]
for k,x in a.items():
 y=b[k];assert all(x[v]==y[v] for v in ['actual','viewport','physicsSha256','assetBounds','assetPlaced','actorCount','css','backing']),k
 ims=[]
 for v,f in [('stock',x),('candidate',y)]:
  file=p/v/f['name'];assert hashlib.sha256(file.read_bytes()).hexdigest()==f['rasterSha256'];ims.append(Image.open(file).convert('RGBA'))
 d=ImageChops.difference(ims[0],ims[1]);r={'key':k,'deltaBBox':d.convert('RGB').getbbox(),'maxRGBA':[z[1] for z in d.getextrema()]};checks.append(r)
 if r['maxRGBA'][3]!=0 or k[0]==29 and any(r['maxRGBA']):fail.append(k)
 if k[0]==30 and k[2]=='water-close':
  z=x['actual']['scale'];v=x['viewport'];w,h=d.size
  for spec,bounds in [('insideBasin',[6120,6005,7330,6620]),('physicalRiverInterior',[6460,6580,7210,7200])]:
   l,t,rr,bb=bounds;reg=(max(0,math.ceil((l-v['left'])*z)+2),max(0,math.ceil((t-v['top'])*z)+2),min(w,math.floor((rr-v['left'])*z)-2),min(h,math.floor((bb-v['top'])*z)-2))
   assert reg[2]>reg[0] and reg[3]>reg[1]
   r[spec]={'bounds':reg,'maxRGBA':[c[1] for c in d.crop(reg).getextrema()]}
   if any(r[spec]['maxRGBA']):fail.append([k,spec])
(p/'paired-checks.json').write_text(json.dumps(checks,indent=2))
assert not fail,fail
print('20 camera/state pairs; preserved basin interior, physical pool, and Stage29 six raw pixel controls.')
