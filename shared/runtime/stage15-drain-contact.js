(function(G){'use strict';
// One bounded, atomic contact transition for the existing drainage event.
// Candidate search works entirely on a virtual active shape and actor copies.
const C=G.HONRO_CORE,ID='fc15-drained-ledge',RADIUS=192,STEP=8;
const active=b=>b?.mode==='campaign'&&!b.honroCustom&&b.honroStage===15&&b.honroNarrativeRevision===1&&b.honroDrainRevealTerrains?.length===1&&b.honroDrainRevealTerrains[0]===ID;
const live=u=>u&&!u.dead&&u.hp>0&&!u.honroObjectiveTarget;
function plan(b){
 if(!active(b))return{ok:false,reason:'unsupported',affected:[]};
 const source=b.terrain.find(t=>t.id===ID);if(!source)return{ok:false,reason:'missing terrain',affected:[]};
 const inactive=b.terrain.map(t=>t.id===ID?{...t,broken:true}:t),terrain=b.terrain.map(t=>t.id===ID?{...t,broken:false}:t),shape=terrain.find(t=>t.id===ID),units=b.units.map(u=>({...u})),view={...b,terrain,units};
 const affected=units.filter(u=>live(u)&&C.terrainRectIntersects(shape,u.x-u.r-4,u.y-u.h-4,u.r*2+8,u.h+10,.01)&&!C.validTerrainContactPose(terrain,u)&&(C.validTerrainContactPose(inactive,u)||C.terrainRectIntersects(shape,u.x-u.r*.55,u.y-u.h+6,u.r*1.1,Math.max(3,u.h-13),.15))).sort((a,z)=>String(a.id)<String(z.id)?-1:String(a.id)>String(z.id)?1:0);
 const moves=[];
 for(const u of affected){
  if(u.carriedBy!==undefined||u.eaterCapturedBy)return{ok:false,reason:'attached body',affected:affected.map(u=>u.id)};
  const from={x:u.x,y:u.y},p=G.HonroTerrain.place(view,u,{flying:false,maxDistance:RADIUS,step:STEP,verticalWeight:1,accept:(x,y)=>Math.hypot(x-from.x,y-from.y)<=RADIUS&&C.validTerrainContactPose(terrain,{...u,x,y})});
  if(!p)return{ok:false,reason:'no local contact',affected:affected.map(u=>u.id)};
  moves.push({id:u.id,from,to:{x:p.x,y:p.y},distance:Math.hypot(p.x-from.x,p.y-from.y),physicsBefore:{vx:u.vx,vy:u.vy,jumping:u.jumping,airborne:u.airborne}});u.x=p.x;u.y=p.y;
 }
 // Validate the whole proposed result again, before touching the real world.
 if(moves.some(m=>!C.validTerrainContactPose(terrain,units.find(u=>u.id===m.id))))return{ok:false,reason:'final contact',affected:affected.map(u=>u.id)};
 return{ok:true,moves,affected:affected.map(u=>u.id),activate:source.broken};
}
function apply(b,p,source){if(!p.ok)return p;if(!p.activate&&!p.moves.length)return p;
 for(const list of [b.terrain,b.honroWorldTerrain]){const t=list?.find(t=>t.id===ID);if(t)t.broken=false;}
 for(const m of p.moves){const u=b.units.find(u=>u.id===m.id);Object.assign(u,m.to,{vx:0,vy:0,jumping:false,airborne:false});}
 const a=G.HonroAct2.memory(b);a.drainContact={revision:1,radius:RADIUS,step:STEP,source,moves:p.moves};
 return p;
}
function transition(b){return apply(b,plan(b),'drain-event');}
function repairSaved(b){if(!active(b)||b.terrain.find(t=>t.id===ID)?.broken)return{ok:true,affected:[]};const p=plan(b);apply(b,p,'saved-active-contact');return p;}
function safe(app){const b=app.engine.b;return !app.dialogue&&!app.charging&&!app.storyHistoryOpen&&!app.modal?.classList.contains('open')&&!['flight','review','summon','ally'].includes(b.phase)&&!b.projectiles.length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>live(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!app.engine.settleBusy();}
G.HonroStage15Drain={active,plan,transition,repairSaved,safe,radius:RADIUS,step:STEP};
})(globalThis);
