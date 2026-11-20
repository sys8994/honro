from PIL import Image, ImageChops
from pathlib import Path
import json,sys,hashlib
p=Path(sys.argv[1])
def frames(v):return {f['name']:f for f in json.loads((p/v/'proof.json').read_text())['frames']}
a,b=frames('baseline'),frames('candidate')
def power(v,fn,domain,n):
 s=('.repeat' if n else '')+'.png' if domain=='DOM' else '.raw'+('.repeat' if n else '')+'.png'
 return Image.open(p/v/(fn if domain=='DOM' and not n else fn+s)).convert('RGBA')
def delta(a,b):
 d=ImageChops.difference(a,b)
 mask=[any(x) for x in d.getdata()]
 pos=[(i%d.width,i//d.width) for i,z in enumerate(mask) if z]
 return dict(changed=len(pos),outside=sum(y<663 for x,y in pos),bbox=(min(x for x,y in pos),min(y for x,y in pos),max(x for x,y in pos),max(y for x,y in pos)) if pos else None,max=max(u[1] for u in d.getextrema()))
rows=[]
for n,x in a.items():
 if n not in b:continue
 y=b[n]
 for mode in ['RAW','DOM']:
  A,AA,B,BB=[power(v,n,mode,i) for v in ['baseline','candidate'] for i in [0,1]]
  if mode=='RAW':
   assert ['sha256:'+hashlib.sha256(img.tobytes()).hexdigest() for img in (A,AA)]==x['rawDigests']
   assert ['sha256:'+hashlib.sha256(img.tobytes()).hexdigest() for img in (B,BB)]==y['rawDigests']
  r=dict(stage=x['stage'],view=x['view'],mode=mode,baselineRepeat=delta(A,AA),candidateRepeat=delta(B,BB),firstPair=delta(A,B),secondPair=delta(AA,BB),stateSame=x['physicsSha256']==y['physicsSha256'],viewSame=all(x[k]==y[k] for k in ('actual','requested','viewport','css','backing')),phaseSame=all(i['x']==i['v']==0 and i['restored'] and i['read']>0 and i['write']>0 for i in x['cloudReceipts']+y['cloudReceipts']))
  rows.append(r)
(p/'clock-exact-comparison.json').write_text(json.dumps(rows,indent=2))
print(json.dumps(rows,indent=2))
assert len(rows)==8 and all(r['phaseSame'] and r['stateSame'] and r['viewSame'] and r['baselineRepeat']['changed']==r['candidateRepeat']['changed']==0 and all(z['changed']==0 if r['stage']==13 else z['changed']>0 and z['outside']==0 for z in (r['firstPair'],r['secondPair'])) for r in rows),'Exact gate failed (do not discount any pixel)'
