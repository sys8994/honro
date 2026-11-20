import json, os, pathlib, hashlib
from PIL import Image,ImageChops
P=pathlib.Path(os.environ['OUT'])
meta={v:json.loads((P/v/'proof.json').read_text()) for v in ('stock','candidate')}
A,B=({(f['stage'],f['width'],f['view']):f for f in meta[v]['frames']} for v in ('stock','candidate'))
assert len(A)==len(B)==16 and A.keys()==B.keys()
checks=[]
for k,a in A.items():
 b=B[k]
 assert a['actual']==b['actual'] and a['viewport']==b['viewport'] and a['physicsSha256']==b['physicsSha256'],k
 p,q=(P/v/f['name'] for v,f in [('stock',a),('candidate',b)])
 assert hashlib.sha256(p.read_bytes()).hexdigest()==a['rasterSha256']
 assert hashlib.sha256(q.read_bytes()).hexdigest()==b['rasterSha256']
 x,y=Image.open(p).convert('RGB'),Image.open(q).convert('RGB')
 delta=ImageChops.difference(x,y); maxdelta=max(m[1] for m in delta.getextrema())
 def row(world):return max(0,min(x.height,int((world-a['viewport']['top'])*a['actual']['scale'])))
 upper=delta.crop((0,0,x.width,row(6700)-1)) if row(6700)>1 else None
 lower=delta.crop((0,row(8500)+2,x.width,x.height)) if row(8500)+2<x.height else None
 m=dict(key=k,maxRGB=maxdelta,deltaBBox=delta.getbbox(),upperMaxRGB=max((m[1] for m in upper.getextrema()),default=0) if upper else 0,lowerMaxRGB=max((m[1] for m in lower.getextrema()),default=0) if lower else 0)
 checks.append(m)
 (P/'paired-checks.json').write_text(json.dumps(checks,indent=2))
assert all(m['maxRGB']<=1 for m in checks if m['key'][0]==29),checks
assert all(m['upperMaxRGB']<=1 and m['lowerMaxRGB']<=1 for m in checks if m['key'][0]==30),checks
for v in ('southwest','southeast'):assert next(m for m in checks if m['key']==(30,390,v))['maxRGB']>5,v
print('Compared 16 stock/candidate view pairs and matching gameplay/water hashes.')
