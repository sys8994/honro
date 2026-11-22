import hashlib
from pathlib import Path
import json
D=Path(__file__).resolve().parent
P=json.loads((D/"PINS.json").read_bytes())
KEY=b'||b.honroStage===46&&["a5-left-cliff","a5-right-cliff"]'
INSERT=b'||b.honroStage===41&&b.honroCanonical===true&&b.honroCustom===false&&b.honroMapOrigin==="campaign"&&b.honroAuthoredId==="stage-41"&&group.id==="a5-lower-road"&&p.x===250&&z.x===250&&p.y===2785&&z.y===2343.75&&b.terrain?.some(t=>t.id===group.id&&!t.broken&&t.oneWay===false&&t.honroAct5Painted===true)'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def mk(b):
 need(fact(b)==P['route'][P['runtime']] and b.count(KEY)==1,'exact common18 bytes/one uniquely identified source insertion required')
 z=b.replace(KEY,INSERT+KEY,1);need(z.replace(INSERT,b'',1)==b,'nonlocal or irreversible JS update')
 if P['compiledCandidate']:need(fact(z)==P['compiledCandidate'],'expected B compiled exact patch differs')
 return z

OBS="""()=>{
 const b=HonroApp.engine.b,stage=HONRO_PROJECT.stages.find(x=>x.id==='stage-41');
 if(!stage||b.honroStage!==41||b.honroCanonical!==true||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||b.honroAuthoredId!=='stage-41')throw Error('not canonical Stage41');
 const match=(x)=>x.walkable===false&&x.a.x===250&&x.z.x===250&&x.a.y===2785&&x.z.y===2343.75;
 const g=HonroTerrainReadability.prepare(b).groups.find(g=>g.id==='a5-lower-road'),t=b.terrain.find(t=>t.id==='a5-lower-road'),q=HonroEdgeClosureQA;
 const a=HONRO_PROJECT.library.find(a=>a.id==='act5:near:41');
 if(!g||!t||t.broken||t.oneWay!==false||t.honroAct5Painted!==true||!a?.campExterior||!a.vector||!q)throw Error('missing native outlined ground, original physical object, or authored art');
 return {sourceClosure:g.segments.filter(match).length, omitted:q.removed.filter(x=>x.id===g.id&&match(x)).length,
  otherOmissions:q.removed.filter(x=>!(x.id===g.id&&match(x))),walks:g.segments.filter(x=>x.walkable),kept:q.keptWalkableCount,
  physics:HONRO_CORE.poly(t),walkableRemoved:q.walkableRemoved};
}"""
