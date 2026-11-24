import assert from 'node:assert/strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const key='18.rescue-response';
const support='sb-inner-lower-approach';
const point=(v)=>({x:v.x,y:v.y,surfaceId:v.surfaceId,...('support' in v?{support:v.support}:{})});
const group=e=>[e.action.actions,e.honroDensityAlternatives[0]];
export function stage18Events(events){
 const copy=clone(events),e=copy.find(v=>v.id===key);
 assert(e?.honroDensityTrigger?.objectiveDone==='18.rescue','specific old finite rescue response missing');
 assert.equal(e.honroDensityAlternatives.length,1);
 for(const a of group(e)){
  assert.deepEqual(a.map(x=>[x.kind,x.n,x.source]),[['picks',1,key],['minecart',1,key],['bat',1,key]]);
 }
 const coordinates={entry:point(e.entry),groups:group(e).map(a=>a.map(point))};
 for(const target of [e.entry,...group(e).flat()]){
   for(const prop of ['x','y','surfaceId','support'])delete target[prop];
 }
 return {normalized:copy,coordinates};
}
export function verify18Author(a,b){
 assert.deepEqual(b.normalized,a.normalized,'Stage18 must keep all other events and response semantics');
 assert(a.coordinates.groups.flat().every(p=>p.support==='sb-suppression-court'),'unexpected Stage18 baseline'); 
 assert.equal(b.coordinates.entry.surfaceId,support);
 assert(b.coordinates.groups.flat().every(p=>p.surfaceId===support&&p.support===support&&Number.isFinite(p.y)));
 assert.deepEqual(b.coordinates.groups.map(x=>x.map(v=>v.x)),[[4780,5000,4720],[4580,4760,5120]]);
}
export function stage18Runtime(G,b,cst,prof){
 const C=G.HONRO_CORE,D=G.HonroEncounterDensity,output={};
 for(const [label,lower,occupied] of [['normal',false,false],['bellLowered',true,false],['primaryBlocked',false,true]]){
  const e=new C.Engine(clone(b),()=>{},true),q=e.b,ev=q.honroEvents.find(v=>v.id===key),party=e.heroesAlive(),marker=q.honroMarkers.find(v=>v.id==='18.rescue');
  const app={engine:e,stage:cst,profile:prof,actorBoundary:party[0].id,dialogue:null,done:false,event(){},modal:{classList:{contains(){return false}}}};
  assert.equal(ev.honroDensityTrigger.objectiveDone,'18.rescue');assert.equal(!!D.ready(q,ev),false);
  for(const [i,u] of party.entries()){
   const x=marker.x-180+i*85,s=G.HonroMapEngine.surfaceY(q.terrain,x,marker.y,'sb-east-gallery-sill');assert(s);Object.assign(u,{x,y:s.y});
  }
  if(lower){G.HonroStage18Bell.shift(q,q.honroV4Stage18.threatOffset);G.HonroAct23V4Stage18.memory(q).bell.offset=q.honroV4Stage18.threatOffset;}
  if(occupied){party[0].x=ev.action.actions[1].x;party[0].y=ev.action.actions[1].y;}
  q.honroState.act2.done['18.rescue']=true;
  assert.equal(D.ready(q,ev),true);D.prepare(app);
  const w=D.memory(q).warnings[key];assert(w);
  const n=q.units.length;assert.equal(G.HonroAllies.execute(app,ev.action),false);assert.equal(q.units.length,n);
  w.opportunity={id:party[0].id,round:q.round,serial:(w.serial||0)+1};
  const admitted=G.HonroAllies.execute(app,ev.action),spawned=q.units.slice(n);assert.equal(admitted,true);assert.equal(spawned.length,3);
  const route=G.HonroMapEngine.surfaceY(q.terrain,5115,undefined,support);assert(route);
  const clearTo=(u,x,y)=>!e.projectileCollision({x:u.x,y:u.y-u.h*.55},{x,y},1,u.id,[],false)?.terrain;
  output[label]={choice:D.memory(q).entries[key]?.choice,spawned:spawned.map(u=>({id:u.id,x:u.x,y:u.y,routeClear:clearTo(u,5115,route.y-85),rescueClear:occupied?null:party.some(p=>clearTo(u,p.x,p.y-p.h*.55))}))};
  assert.equal(G.HonroAllies.execute(app,ev.action),true);assert.equal(q.units.length,n+3);
 }
 return {cases:output,scope:'real compiled spawn/admission and projectile support; controlled rescue and action-receipt state'};
}
export function verify18Behavior(a,b){
 for(const k of ['normal','bellLowered','primaryBlocked']){
  assert.deepEqual(a.cases[k].spawned.map(x=>x.id),b.cases[k].spawned.map(x=>x.id),'Stage18 runtime spawn IDs altered');
  assert.deepEqual(b.cases[k].spawned.map(x=>x.x),k==='primaryBlocked'?[4580,4760,5120]:[4780,5000,4720]);
 }
 for(const k of ['normal','bellLowered']){
  assert(a.cases[k].spawned.every(x=>!x.routeClear),'baseline route conditions different');
  assert(b.cases[k].spawned.every(x=>x.routeClear&&!x.rescueClear),'need actual west retreat pressure without gallery fire');
 }
}
