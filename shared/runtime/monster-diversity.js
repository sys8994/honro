(function(G){'use strict';
// Authored identities share the old slot, footprint, HP and event/goal keys.
const expected=u=>u.honroVariant||u.honroType;
const allowed=u=>u?.side===1&&!u.honroObjectiveTarget&&!u.boss&&!u.honroMidboss&&!u.honroFinalBoss&&
 !u.honroAct2Boss&&!u.honroStage29Boss&&!u.honroPilotMidboss&&!u.honroAct4WreckBoss&&!u.honroAct4FinaleBoss&&!u.honroAct4RewardTag;
const airLike=new Set(['bat','crow','lantern','resonance','echo','monkVessel','bellCluster']);
const generic=new Set(['hound','boar','stag','bat','crow','ghost','lantern','shade','mourner','warden','human']);
const roleNames=new Set(['marksman','device','pursuer','vanguard']);
const data=()=>G.HONRO_MONSTER_DIVERSITY;
function waterfront(b,u){
 const policies=(b.honroAct4Design?.waterPolicies||[]).filter(z=>z.kind==='recover')
  .map(z=>({x:z.x1,w:z.x2-z.x1,y:b.honroAct4Design?.tide?.high??z.surface}));
 return [...policies,...(b.waters||[]).filter(w=>w.kind==='water')].some(w=>
  Number.isFinite(w.y)&&u.x>=w.x-210&&u.x<=w.x+w.w+210&&Math.abs(u.y-w.y)<=575);
}
function selectGeneric(b,u,key,label){
 const def=G.HonroWorld.archetypes[key];
 if(!def||u.honroSpirit||u.honroEcho)return false;
 if(airLike.has(expected(u))!==!!def.flying){
  // Coastal air patrols use a lifted, clear perch above the authored position.
  if(b.honroStage<31||b.honroStage>40||!def.flying||u.fixed)return false;
  const from={x:u.x,y:u.y-10},to={x:u.x,y:u.y-170};
  if(!G.HONRO_CORE.flightClear({b},u,to)||b.terrain.some(t=>!t.broken&&G.HONRO_CORE.segmentTerrain(from,to,t,u.r*.55)))return false;
  u.y=to.y;
  u.spawnY=to.y;
  u.fixed=true;
  u.honroAct4WaterTrait='airborne';
 }
 const rank=Math.max(1,...u.loadout.map(id=>u.ranks?.[id]||1));
 Object.assign(u,{name:label||def.name,honroType:def.look,honroVariant:def.variant||key,
  cls:def.cls,role:def.role,loadout:[...def.skills],intent:def.intent,
  ranks:{...u.ranks,...Object.fromEntries(def.skills.map(id=>[id,rank]))}});
 // The existing slot already carries its encounter-specific vitality.
 if(key==='bat'||key==='crow')u.honroAirborneBalanceRevision=1;
 delete u.existenceDefense;
 G.HONRO_CORE.migrateEnemySkills(u);
 return true;
}
function change(b,u,key,label,group,fresh){
 if(!allowed(u)||u.honroMonsterSpecies)return false;
 const roster=G.HonroMonsterRoster;
 if(!generic.has(key)){
  if(key==='mulgwishin'&&!waterfront(b,u))return false;
  if((key==='geuseundae'||key==='dueoksini'||roleNames.has(key))&&G.HONRO_CORE.flyingEnemy(u))return false;
  if(!roster.canDiversify(b,u,key,fresh))return false;
 }else if(!selectGeneric(b,u,key,label))return false;
 delete u.honroMonsterEffectSkill;
 delete u.honroMonsterPattern;
 if(generic.has(key))roster.prepareSpawn(b,u);
 else roster.applyIdentity(u,key,label,group);
 u.honroMonsterDiversityKind=key;
 return true;
}
function prepare(b){
 const spec=data()?.[b.honroStage];
 if(!spec||!b.honroCanonical||b.honroCustom||b.honroMonsterDiversityRevision||
    G.HONRO_MONSTER_REWORK_DISABLED===true)return;
 b.honroMonsterDiversityRevision=1;
 b.honroMonsterReworkRevision=1;
 if(spec.waves)b.honroMonsterDiversityWaves=structuredClone(spec.waves);
 const required=new Set(Object.values(b.honroMap?.act5?.required||{}).flat());
 const byId=new Map(b.units.map(u=>[u.id,u]));
 for(const [id,base,key,label,group] of spec.slots||[]){
  const u=byId.get(id);
  if(u&&!required.has(id)&&expected(u)===base)change(b,u,key,label,group,true);
 }
}
function spawn(b,u,source,index){
 const entry=b.honroMonsterDiversityWaves?.[source]?.[index];
 if(!entry)return;
 const [key,label,group]=Array.isArray(entry)?entry:[entry];
 change(b,u,key,label,group);
}
G.HonroMonsterDiversity={prepare,spawn,definitions:data};
})(globalThis);
