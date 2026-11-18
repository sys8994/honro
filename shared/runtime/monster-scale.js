(function(G){'use strict';
// Monster body scale (2026-11-18 plan, game/docs/planning/monster-scale-20261118).
// New campaign battles only: a saved battle keeps the body stored in it.
// Drawn size follows u.h (renderer scale = h / art baseHeight) and the hit
// rectangle is 2r × h, so one change moves art, hit area and HP together.
// Every enlargement is fitted to the spot: if the head or body would meet
// solid terrain the unit steps down toward its old size instead.
const C=G.HONRO_CORE,REVISION=1,PX_PER_M=60.6; // hero h92 draws 103px = 1.7 m
// Drawn height / body h for each art (measured with the game renderer).
const RATIO={hound:.97,boar:.97,stag:1.05,human:1.05,possessedArcher:1.15,possessedGuard:1.15,archiveFiend:1.15,gateMaster:1.33,kilnFiend:1.23,archerMaster:1.29,
 mourner:.92,shade:1.02,warden:1.12,dueoksini:1.01,eoduksini:.64,eoduksini2:.76,eoduksini3:1,geuseundae:.99,geuseunsae:1.01,mulgwishin:1.12,
 marksman:1.21,vanguard:1,device:1.05,pursuer:1.13};
// [drawn metres, HP multiplier, walk-speed multiplier]. Flying, swarm and human-size kinds are absent on purpose.
const SPECIES={
 boar:[1.7,1.15,1],stag:[2.4,1.15,1],possessedArcher:[2.0,1.1,1],possessedGuard:[2.1,1.1,1],archiveFiend:[2.0,1.1,1],
 shade:[2.3,1.15,1],mourner:[2.3,1.35,.9],mulgwishin:[2.4,1.2,1],marksman:[2.2,1.1,1],geuseunsae:[2.4,1.15,1],geuseundae:[1.8,1.15,1],
 eoduksini:[1.6,1.3,1],warden:[3.8,1.25,.85],dueoksini:[3.6,1.6,.8],vanguard:[2.8,1.5,.85],device:[2.8,1.5,.85],pursuer:[3.0,1.1,.9],
};
const GROWTH={eoduksini:[1.6,3.0,4.8]},EXPANDED={geuseundae:4.0};
// Named mid-bosses/bosses: [drawn metres, HP multiplier]. Roles decide size.
const NAMED={'midboss-stage6':[6.5,1.3],'midboss-stage3':[6.5,1.3],'final40-tide-keeper-1':[7.5,1.3]};
// Story figures keep the body their scenes were staged with.
const KEEP=new Set(['stage29-hantaerok']);
const ROLE_MID={warden:5.5,vanguard:5.5,marksman:4.5,pursuer:4.2,shade:4.0};
const NOT=new Set(['bat','crow','lantern','ghost','dokkaebibul','hound','human','muyeo','sonmalmyeong','gaekgwi','yagwanggwi','picks','minecart','resonance']);
const disabled=()=>G.HONRO_MONSTER_SCALE_DISABLED===true;
const OFF_STAGES=new Set(); // per-stage switch (stage ids) for measurement or rollback
const alive=u=>u&&!u.dead&&u.hp>0;
function look(u){
 const s=u.honroMonsterSpecies;if(s)return s;
 const v=u.honroVariant;if(RATIO[v]||SPECIES[v]||NOT.has(v))return v;
 return u.honroType==='beast'?(v||'stag'):u.honroType;
}
function eligible(b,u){
 return b?.honroMonsterScaleRevision===REVISION&&u?.side===1&&alive(u)&&!u.summoned&&!u.enthrall&&!u.honroObjectiveTarget&&
  !(u.fixed&&C.flyingEnemy?.(u))&&!u.honroAct4WreckBoss&&u.id!=='boss'&&!KEEP.has(u.id)&&!u.honroFinalBoss&&!u.honroMonsterState?.attachedTo&&!u.honroMonsterState?.mergedInto;
}
function art(u){const k=look(u);if(k==='eoduksini')return u.honroMonsterGrowth>=3?'eoduksini3':u.honroMonsterGrowth>=2?'eoduksini2':k;return RATIO[k]?k:RATIO[u.honroVariant]?u.honroVariant:u.honroType;}
const hOf=(m,u)=>Math.round(m*PX_PER_M/(u.honroGreatDarkness?1:RATIO[art(u)]||1)); // the darkness always draws the full-height rig
// Clear height above a standing pose, ignoring one-way strips (locomotion lets heads pass them).
function headroom(b,u,r=u.r){
 let clear=Infinity;
 for(const dx of [-.6,0,.6]){const x=u.x+r*dx;
  for(const t of b.terrain){if(t.broken||t.oneWay)continue;if(x<t.x-1||x>t.x+t.w+1)continue;
   const v=C.poly(t);for(let i=0;i<v.length;i++){const a=v[i],c=v[(i+1)%v.length];if((a.x-x)*(c.x-x)>0||a.x===c.x)continue;
    const y=a.y+(c.y-a.y)*(x-a.x)/(c.x-a.x);if(y<u.y-14)clear=Math.min(clear,u.y-y);}}}
 return clear;
}
function fits(b,u,h,r){
 if(u.fixed)return headroom(b,u,r)>=h+6; // standing fliers/hoverers: room only
 if(headroom(b,u,r)<h+6)return false;
 return C.validTerrainContactPose?C.validTerrainContactPose(b.terrain,{...u,h,r}):true;
}
// Try the target, then evenly smaller steps, never below the current body.
function fitted(b,u,h,r){
 if(h<=u.h)return null;
 for(const k of [1,.85,.7,.55,.4]){const hh=Math.round(u.h+(h-u.h)*k),rr=Math.round(u.r+(r-u.r)*k);if(fits(b,u,hh,rr))return{h:hh,r:rr,step:k};}
 return null;
}
function rFor(u,scale,cap){return Math.min(cap,Math.max(u.r,Math.round(u.r*Math.pow(scale,.6))));}
function record(b,u,info){(b.honroMonsterScaleLog??=[]).push({id:u.id,look:look(u),...info});if(b.honroMonsterScaleLog.length>200)b.honroMonsterScaleLog.shift();}
function grow(b,u,metres,hpMul,speedMul,cap,why){
 const target=hOf(metres,u),scale=target/u.h;if(scale<=1.02){u.honroMonsterScale={v:REVISION,why,kept:true,base:{h:u.h,r:u.r},rest:u.h};return;}
 const fit=fitted(b,u,target,rFor(u,scale,cap));
 if(!fit){u.honroMonsterScale={v:REVISION,why,kept:true,base:{h:u.h,r:u.r},rest:u.h};record(b,u,{why,result:'no-room',target});return;}
 const base={h:u.h,r:u.r},ratio=fit.h/u.h,hpGain=1+(hpMul-1)*Math.min(1,(ratio-1)/Math.max(.01,scale-1));
 Object.assign(u,{h:fit.h,r:fit.r});
 if(hpGain>1.001){const full=u.hp>=u.maxHp;u.maxHp=Math.round(u.maxHp*hpGain);u.hp=full?u.maxHp:Math.round(u.hp*hpGain);if(Number.isFinite(u.combatBaseHp))u.combatBaseHp*=hpGain;}
 if(speedMul<1){if(Number.isFinite(u.walkSpeed))u.walkSpeed*=speedMul;if(Number.isFinite(u.maxMove)){u.maxMove=Math.round(u.maxMove*speedMul);u.moveLeft=Math.min(u.moveLeft??u.maxMove,u.maxMove);}}
 u.honroMonsterScale={v:REVISION,why,base,rest:fit.h,step:fit.step,hp:+hpGain.toFixed(3)};
 if(fit.step<1)record(b,u,{why,result:'reduced',step:fit.step,target,h:fit.h});
}
function apply(b,u){
 if(!eligible(b,u)||u.honroMonsterScale||OFF_STAGES.has(b.honroStage))return;
 const named=NAMED[u.id];
 // A body standing at an objective (bier knots, seals) keeps its authored
 // size so the line of fire to that objective stays as the stage was tuned.
 if(!named&&b.units.some(t=>t.honroObjectiveTarget&&alive(t)&&Math.abs(t.x-u.x)<t.r+u.r+200&&Math.abs(t.y-u.y)<220)){u.honroMonsterScale={v:REVISION,why:'objective-cover',kept:true,base:{h:u.h,r:u.r},rest:u.h};return;}
 if(named){grow(b,u,named[0],named[1],.8,64,'named');return;}
 const key=look(u);
 if(u.honroMidboss||u.boss){const m=ROLE_MID[key]||ROLE_MID[u.honroType];if(m){grow(b,u,m,1.3,.8,60,'midboss');return;}}
 const row=SPECIES[key];if(!row){u.honroMonsterScale={v:REVISION,why:'species',kept:true};return;}
 let [m,hp,speed]=row;const giant=u.honroMonsterVariant==='giant';
 if(GROWTH[key])m=GROWTH[key][Math.max(0,Math.min(2,(u.honroMonsterGrowth||1)-1))];
 if(giant){m*=1.35;hp*=1.25;}
 grow(b,u,m,hp,speed,giant?52:46,giant?'giant':'species');
}
function prepare(b){
 if(disabled()||!b||b.honroMonsterScaleRevision||b.honroMapOrigin!=='campaign'||b.honroCustom||!b.honroCanonical)return;
 b.honroMonsterScaleRevision=REVISION;
 for(const u of b.units)apply(b,u);
 addDarkness(b);
}
// Growth/expansion move the body with the art. Runs at the mission tick; a
// size that does not fit the spot stays at the largest one that does.
function sync(b){
 if(b?.honroMonsterScaleRevision!==REVISION)return;
 for(const u of b.units){
  if(!u.honroMonsterScale){apply(b,u);continue;} // late arrivals from any spawn path
  const sc=u.honroMonsterScale;if(!eligible(b,u)||!sc?.base)continue;
  const key=u.honroMonsterSpecies;let m=null;
  if(u.honroGreatDarkness)m=DARK_GROWTH[Math.max(0,Math.min(2,(u.honroMonsterGrowth||1)-1))];
  else if(GROWTH[key])m=GROWTH[key][Math.max(0,Math.min(2,(u.honroMonsterGrowth||1)-1))];
  else if(EXPANDED[key])m=u.honroMonsterWindup?EXPANDED[key]:0;
  if(m===null)continue;
  const want=Math.max(m?hOf(m,u):0,key in EXPANDED?sc.rest:sc.base.h);if(Math.abs(want-u.h)<2)continue;
  if(want<u.h){u.h=want;continue;}
  const fit=fitted(b,u,want,u.r);if(fit)u.h=fit.h;
 }
}
// Great darkness (큰 어둠): optional, stationary, not a victory condition.
// Body 10 → 13 → 16 m; grows when struck or when a hero ends an action in its
// shade zone, sinks after two quiet rounds (engine monsterPatterns). Its slam
// is the eoduksini windup, measured from its feet and limited to the zone.
// Art is the existing eoduksini3 rig for now (dedicated art: user's decision).
const DARK_GROWTH=[10,13,16],DARK={46:{x:3160,y:5700,id:'great-darkness-46'}};
const zone=u=>380+100*((u.honroMonsterGrowth||1)-1);
function inZone(u,v){return Math.abs(v.x-u.x)<=zone(u)+(v.r||0)&&v.y>u.y-u.h&&v.y<u.y+160;}
function floorAt(b,x,y){let best=null;for(const t of b.terrain){if(t.broken)continue;for(const f of C.terrainSurfaces?.(t,x)||[])if(f.y>=y-260&&f.y<=y+400&&(best===null||Math.abs(f.y-y)<Math.abs(best-y)))best=f.y;}return best;}
function addDarkness(b){
 const spot=DARK[b.honroStage];if(!spot||b.units.some(u=>u.honroGreatDarkness))return;
 const tpl=b.units.find(u=>u.side===1&&alive(u)&&!u.fixed&&!u.honroMidboss&&!u.boss&&!u.honroObjectiveTarget&&!u.summoned);
 const y=floorAt(b,spot.x,spot.y);if(!tpl||y===null){(b.honroMonsterScaleLog??=[]).push({id:spot.id,result:'no-spot'});return;}
 const u=structuredClone(tpl),h=Math.round(DARK_GROWTH[0]*PX_PER_M);
 for(const k of Object.keys(u))if(/^honro(Monster|Cluster|Act5|Spawn|Contribution|Xp)/.test(k)||/^(aiMove|moveTarget|enemyEffect)/.test(k))delete u[k];
 Object.assign(u,{id:spot.id,name:'큰 어둠',x:spot.x,y,spawnX:spot.x,spawnY:y,h,r:90,facing:-1,vx:0,vy:0,fixed:false,elite:false,boss:0,
  hp:Math.round(tpl.maxHp*10),maxHp:Math.round(tpl.maxHp*10),combatBaseHp:(tpl.combatBaseHp||tpl.maxHp)*10,armor:Math.max(tpl.armor||0,.1),
  loadout:[],maxMove:0,moveLeft:0,walkSpeed:0,awake:false,aggroUntil:-1,group:-460,xpBudget:0,xpGranted:0,honroXpWeight:0,damageBy:{},
  intent:'우물 바닥에 웅크린 그림자',honroType:'shade',honroVariant:'shade',honroMonsterSpecies:'eoduksini',honroMonsterPattern:'eoduksini',honroMonsterGrowth:1,
  honroGreatDarkness:{v:1,optional:true},honroContributionId:spot.id});
 u.honroMonsterScale={v:REVISION,why:'great-darkness',base:{h,r:90},rest:h};
 b.units.push(u);
}
// Ending an action inside the shade feeds it, like a strike does.
const lastActive=new WeakMap();
function shade(app){
 const b=app?.engine?.b;if(!b||b.honroMonsterScaleRevision!==REVISION)return;
 const dead=b.units.find(v=>v.honroGreatDarkness&&!alive(v));if(dead&&!b.honroEquipmentFacts?.greatDarkness)(b.honroEquipmentFacts??={}).greatDarkness=dead.id; // reward hook: item choice pending
 const u=b.units.find(v=>v.honroGreatDarkness&&alive(v));if(!u)return;
 const prev=lastActive.get(b),now=b.active;if(prev===now)return;lastActive.set(b,now);
 const hero=b.units.find(v=>v.id===prev&&v.side===0&&!v.summoned&&alive(v));if(!hero||!inZone(u,hero))return;
 const s=(u.honroMonsterState??={});s.growthRound=b.teamEnds?.[0]??0;
 if((u.honroMonsterGrowth||1)<3){u.honroMonsterGrowth=(u.honroMonsterGrowth||1)+1;app.engine.fx?.('text',u.x,u.y-u.h*.5,'#b6a6d8',22,'그림자가 자란다');}
}
// It wakes only for heroes in its shade (Act 5 activation range is otherwise wide).
function hookWake(){
 const a=G.HonroAct5;if(!a?.wakeEligible||a.wakeEligible.honroDarkness)return;
 const wake=a.wakeEligible;a.wakeEligible=function(b,e,allies,range){if(e?.honroGreatDarkness)return allies.some(v=>v.side===0&&inZone(e,v));return wake.call(this,b,e,allies,range);};a.wakeEligible.honroDarkness=true;
}
// First sight of a very large body: one short camera hold on it.
function reveal(app){
 const b=app?.engine?.b;if(b?.honroMonsterScaleRevision!==REVISION||app.dialogue||!app.scene?.focusUnit)return;
 for(const u of b.units){const sc=u.honroMonsterScale;if(!sc||sc.kept||sc.revealed||u.h<250||!alive(u)||!u.awake)continue;
  sc.revealed=true;app.scene.focusUnit(u.id,1500);return;}
}
G.HonroMonsterScale={REVISION,addDarkness,DARK,prepare,apply,sync,headroom,look,SPECIES,NAMED,ROLE_MID,OFF_STAGES};
// Later finite waves and act-5 reserves use the same path.
const diversity=G.HonroMonsterDiversity;
if(diversity){const spawn=diversity.spawn;diversity.spawn=function(b,u,...rest){const out=spawn.call(this,b,u,...rest);apply(b,u);return out;};}
const roster=G.HonroMonsterRoster;
const mission=G.HonroMission;
if(mission?.tick){const tick=mission.tick;mission.tick=function(app,dt){const out=tick.call(this,app,dt);try{hookWake();sync(app?.engine?.b);shade(app);reveal(app);}catch{}return out;};}
if(roster){const prep=roster.prepareSpawn;roster.prepareSpawn=function(b,u){const out=prep.call(this,b,u);apply(b,u);return out;};}
})(globalThis);
