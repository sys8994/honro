from PIL import Image
from pathlib import Path
import json,sys,hashlib,math
p=Path(sys.argv[1]);rows=[]; errors=[]
def frames(v):return {r['name']:r for r in json.loads((p/v/'proof.json').read_text())['frames']}
a,b=frames('baseline'),frames('candidate')
def load(v,n,kind,r):
 f=p/v/n
 if kind=='RAW':f=p/v/(n+'.raw.png')
 if r:
  g=p/v/(n+('.raw.repeat.png' if kind=='RAW' else '.repeat.png'))
  if g.exists():f=g
 return Image.open(f).convert('RGBA')
def delta(a,b,r):
 W,H=a.size;d=[];outside=0
 for i,(x,y) in enumerate(zip(a.getdata(),b.getdata())):
  if x==y:continue
  ax,ay=i%W,i//W;d.append((ax,ay))
  if not(r[0]<=ax<=r[2] and r[1]<=ay<=r[3]):outside+=1
 return dict(changed=len(d),outside=outside,bbox=[min(x for x,y in d),min(y for x,y in d),max(x for x,y in d),max(y for x,y in d)] if d else None)
expected={
 'baseline':['318fd4ae47d6233f86074ac3851eb2c9637d7d98b9e0901e78cac2317e92dfdd','45f74106fa5c98d3bef39bbeeba67c0739c6ba3329a010bbdce71c86ce3d4348'],
 'candidate':['d1425a0ab1aa933205af00dc6324f54f987e246e826a503ad302adcd4c79b70c','055ca87952e08069fedcbd325d97455760ec5f9fa286ff94df13dd5c276f7c49']}
for n,x in a.items():
 if n not in b: errors.append('missing '+n);continue
 y=b[n];stage=x['stage'];view=x['view']
 g0=x['catalog']['ground'];g1=y['catalog']['ground']
 for variant,items in [('baseline',g0),('candidate',g1)]:
  if stage==12 and ([i['asset'] for i in items]!=expected[variant] or any(i['placementCount']==0 or any(h!=i['asset'] for h in i['activeHashes']) for i in items)):
   errors.append('Loaded target hash mismatch '+variant+' '+n+' '+str(items))
 if any(x['catalog'][k]!=y['catalog'][k] for k in ('stage','mapStage','groupIds','activeAssetIds','stageHash')):errors.append('Stage catalog or placement changed '+n)
 cam=x['actual']; W=x['css']['w']; H=x['css']['h'];s=cam['scale']
 # Conservative integer pixel coverage of the exact registered tail domain; no channel tolerance.
 R=[math.floor((-5000-cam['x'])*s+W/2),math.floor((10498-cam['y'])*s+H/2),math.ceil((11000-cam['x'])*s+W/2)-1,math.ceil((30100-cam['y'])*s+H/2)-1]
 for mode in ['RAW','DOM']:
  A,AA,B,BB=[load(v,n,mode,r) for v in ['baseline','candidate'] for r in [False,True]]
  for f,G,GG in [(x,A,AA),(y,B,BB)]:
   captured=f['rawDigests'] if mode=='RAW' else None
   if mode=='RAW' and ['sha256:'+hashlib.sha256(z.tobytes()).hexdigest() for z in (G,GG)]!=captured:errors.append('raw digest mismatch '+n)
   if not (f['repeatRawHashSame'] if mode=='RAW' else f['repeatSameEncoded']) or G.tobytes()!=GG.tobytes():errors.append('repeated capture changed '+n+' '+mode)
  z=delta(A,B,R); zz=delta(AA,BB,R)
  pair=dict(stage=stage,view=view,browserWidth=x['width'],mode=mode,expectedProjectedRect=R,firstPair=z,repeatPair=zz,cloudValid=all(i['x']==i['v']==0 and i['restored'] and i['read']>0 and i['write']>0 for i in x['cloudReceipts']+y['cloudReceipts']))
  rows.append(pair)
  if not pair['cloudValid'] or x['physicsSha256']!=y['physicsSha256'] or any(x[k]!=y[k] for k in ('actual','requested','viewport','css','backing')):errors.append('Invalid camera/state/phase '+n)
  if z!=zz or z['outside'] or (stage==13 and z['changed']):errors.append('Strict A/B mismatch '+n+' '+mode+' '+str(z))
  if stage==12 and view in ('bottom-left','bottom-right') and z['changed']!={'bottom-left':12004,'bottom-right':4964}[view]:errors.append('Narrow prior diagnostic changed '+n+' '+mode+' '+str(z))
(p/'integration-comparison.json').write_text(json.dumps(dict(rows=rows,errors=errors),indent=2))
print('validated rows',len(rows),'issues',errors)
assert len(a)==len(b)==40 and len(rows)==80 and not errors,errors
