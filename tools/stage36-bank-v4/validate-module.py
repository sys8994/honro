"""Focused stage36 source/functional preservation and declared contact error."""
import json,hashlib,sys
from pathlib import Path
import numpy as np
f=Path(sys.argv[1]);p=json.loads(f.read_text());s=next(s for s in p['stages']if s['id']=='stage-36');b=json.load(open('_local/reports/sea-silhouette-v3/project.json'));old=next(s for s in b['stages']if s['id']=='stage-36');keys=['units','events','encounters','objectives','markers','initialState','playBounds','terrainBounds'];parity={k:s.get(k)==old.get(k)for k in keys};assert all(parity.values())
def profile(stage):return sorted([q for q in stage['terrains'][0]['points']if q['y']<10000],key=lambda q:q['x'])
a=profile(old);n=profile(s);floor=lambda q,x:float(np.interp(x,[v['x']for v in q],[v['y']for v in q]));err=max(abs(floor(a,x)-floor(n,x))for x in np.arange(1970,3190.001,.25));assert err<1e-5
instances={}
for id in ['a4-36-house-2570','a4-36-door-4']:
 x=next(e for e in s['elements']if e['id']==id);y=next(e for e in old['elements']if e['id']==id);instances[id]={k:x.get(k)==y.get(k)for k in ['x','y','scale','rotation','snap','layer','depthLayer']};assert all(instances[id].values())
door=next(e for e in s['elements']if e['id']=='a4-36-door-4');assert door['assetId']=='a4:door'
origDoor=next(a for a in b['library']if a['id']==old['design']['vectorDoorAssetId']);newDoor=next(a for a in p['library']if a['id']==s['design']['vectorDoorAssetId'])
def geometry(v):
 if isinstance(v,dict):return {k:geometry(x)for k,x in v.items()if k not in ['fill','stroke']}
 if isinstance(v,list):return [geometry(x)for x in v]
 return v
assert geometry(origDoor['vector'])==geometry(newDoor['vector']);assert origDoor['params']['act4DoorForeshortening']==newDoor['params']['act4DoorForeshortening']
r={'sourceByteSHA256':hashlib.sha256(f.read_bytes()).hexdigest(),'functionalFieldsByteEquivalent':parity,'protectedCourtyardWorld':[1970,3190],'courtyardMaxSupportDeltaWorld':err,'serializationToleranceWorld':1e-5,'protectedInstanceTransformParity':instances,'doorMechanicalAssetId':door['assetId'],'doorVectorGeometryUnchanged':True,'doorForeshorteningUnchanged':True,'terrainDomain':[min(q['x']for q in n),max(q['x']for q in n),max(q['y']for q in s['terrains'][0]['points'])],'ordinaryDoorLifecycle':'not proved by static test; actual input replay required'};out=Path('art/stage36-bank-silhouette-v4/protected-contact-proof.json');out.write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
