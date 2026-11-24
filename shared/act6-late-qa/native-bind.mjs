// Instance-only native shim. Install privately AFTER a trusted real App mount.
// No global prototype, persisted map event, profile, or legacy campaign edit.
const marks = new WeakMap();
export const nativeFacts=(engine,p)=>marks.get(engine)?.facts.get(p)??null;
const methods=['fire','stepProjectile','collision','impact','applyCurse','tick','move','wait'];
export function mountNativeObservation({app,engine,packet,hooks}){
 if(!hooks||![58,59].includes(packet?.id)||engine!==app.engine||marks.has(engine)||!methods.every(k=>typeof engine[k]==='function'))return null;
 if(!hooks.afterOwnerMounted(app,engine,packet))return null;
 const id=packet.id,b=engine.b,shots=new Map(),facts=new WeakMap(), saved=new Map();
 let stepping=null,impacting=null,attached=true;
 for(const k of methods)saved.set(k,{fn:engine[k],own:Object.getOwnPropertyDescriptor(engine,k)});
 const base=(k,...args)=>saved.get(k).fn.apply(engine,args);
 const live=()=>attached&&app.engine===engine&&engine.b===b&&app.stageId===id&&!['won','lost','transition'].includes(b.phase);
 const verifiedShot=(p)=>{const s=shots.get(p.shot);return s&&s.owner===p.owner&&s.skill===p.skill&&!p.autonomous&&b.projectiles.includes(p)?s:null;};
 marks.set(engine,{facts});
 engine.fire=function(skill,...rest){
  const actor=engine.active,n=b.shot,r=base('fire',skill,...rest);
  if(live()&&r&&actor?.side===0&&!actor.summoned&&b.shot===n+1)shots.set(b.shot,Object.freeze({owner:actor.id,skill,shot:b.shot}));
  return r;
 };
 engine.stepProjectile=function(p,...rest){
  const prior=stepping;const shot=live()?verifiedShot(p):null;
  stepping=shot?{p,shot,hits:new WeakSet()}:null;
  try{return base('stepProjectile',p,...rest);}finally{stepping=prior;}
 };
 engine.collision=function(...args){
  const hit=base('collision',...args);
  // args[8] is the stock projectile flag; args[9] is the exact moving attack.
  if(live()&&stepping&&args[8]===true&&args[9]===stepping.p&&hit)stepping.hits.add(hit);
  return hit;
 };
 engine.impact=function(p,h,...rest){
  const prev=impacting;
  const fact=live()&&stepping?.p===p&&h&&stepping.hits.has(h)&&verifiedShot(p);
  impacting=fact?{p,fact,aliveBefore:new Set(b.units.filter(x=>x.side===1&&x.hp>0&&!x.dead))}:null;
  if(fact){facts.set(p,fact);hooks.atImpact(app,engine,p,h);}
  try{return base('impact',p,h,...rest);}
  finally{if(fact)facts.delete(p);impacting=prev;}
 };
 engine.applyCurse=function(target,owner,kind,...rest){
  const b0=[target?.curseOwner,target?.curseAttack,target?.curseArmor,target?.curseTurns];
  const out=base('applyCurse',target,owner,kind,...rest);
  const b1=[target?.curseOwner,target?.curseAttack,target?.curseArmor,target?.curseTurns];
  if(live()&&impacting?.fact?.skill==='O06'&&impacting.fact.owner===owner?.id&&kind==='weak'&&impacting.aliveBefore.has(target)){
   if(target?.curseOwner===owner.id&&b1.some((x,i)=>x!==b0[i]))hooks.afterCurse(app,engine,owner,target,kind,impacting.p);
   else if(target.dead&&target.hp===0)hooks.afterNeutralize?.(app,engine,owner,target,impacting.p);
  }
  return out;
 };
 const update=()=>{if(live()){hooks.afterPosition(app,engine);hooks.afterTurn(app,engine);}};
 engine.tick=function(...args){const out=base('tick',...args);update();return out;};
 engine.move=function(...args){const out=base('move',...args);update();return out;};
 engine.wait=function(...args){
  if(!live())return base('wait',...args);
  return hooks.handleProvenWait(app,engine,engine.active,()=>base('wait',...args));
 };
 const installed=new Map(methods.map(k=>[k,engine[k]]));
 return Object.freeze({
  // This function is retained inside the private App input command handler;
  // pass the actual native actor object only, never IDs from DOM payload.
  interact(action){if(!live()||b.side!==0||!engine.canAct())return false;return hooks.acceptedInteract(app,engine,action,engine.active)===true;},
  afterConfirmedLanding:update,
  dispose(){if(!attached)return;attached=false;shots.clear();marks.delete(engine);
   for(const [k,{own}] of saved){if(engine[k]===installed.get(k)){if(own)Object.defineProperty(engine,k,own);else delete engine[k];}}
   hooks.onStop(app);
  }
 });
}
