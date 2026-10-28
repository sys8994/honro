import type {Engine} from './engine';
import type {Battle,Unit,Water} from './types';
import {flyingEnemy} from './enemyAI';
import {validTerrainContactPose} from './locomotion';
import {environmentalLoss} from './contribution';

/** Only authored policies are hazards. Decorative/conductive blue water stays inert. */
function exempt(u:Unit){return u.waterTraversal==='aquatic'||u.waterTraversal==='flying'||flyingEnemy(u);}
function floor(w:Water,x:number){const ps=w.bottom||[];for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x||1);}return w.y+w.depth;}
export function deepWaterAt(b:Battle,u:Unit){if(exempt(u))return undefined;return b.waters.find(w=>w.id&&w.policy&&w.policy.mode!=='shallow'&&w.frozen<=0&&u.x>w.x&&u.x<w.x+w.w&&u.y>=w.y+(w.policy.submergeDepth??45)&&u.y-u.h<floor(w,u.x)+20);}
export function waterBlocked(b:Battle,u:Unit){return !!u.waterRecovery||!!deepWaterAt(b,u);}
function shore(e:Engine,u:Unit,w:Water,side:'left'|'right'){
 const anchors=w.policy?.mode==='recover'?w.policy.shores[side]:[];
 const contact=(x:number,y:number,support:string)=>{
  if(side==='left'?x>=w.x:x<=w.x+w.w)return;
  const c=e.contactSurface(x,y-16,y+16);
  if(!c||c.t.id!==support||!validTerrainContactPose(e.b.terrain,{...u,x,y:c.y}))return;
  return {x,y:c.y,support};
 };
 const occupied=(p:{x:number;y:number})=>e.b.units.some(v=>v!==u&&!v.dead&&v.hp>0&&!v.eaterCapturedBy&&!v.waterRecovery&&Math.abs(v.x-p.x)<v.r+u.r+4&&v.y>p.y-u.h&&v.y-v.h<p.y);
 // Prefer the exact authored points. No actor is moved or overlapped to clear one.
 for(const a of anchors){const p=contact(a.x,a.y,a.support);if(p&&Math.abs(p.y-a.y)<=.15&&!occupied(p))return p;}
 // The same low shore has room beyond a named point. Follow its connected,
 // exposed contact contour only: <=96 horizontal, <=16 vertical; no high ledge,
 // opposite bank, seam jump or intervening solid/unsupported gap may be crossed.
 for(const a of anchors)for(let d=12;d<=96;d+=12)for(const direction of [side==='left'?-1:1,side==='left'?1:-1]){
  const x=a.x+direction*d,p=contact(x,a.y,a.support);if(!p||occupied(p))continue;
  let connected=true;
  for(let step=0;step<=d;step+=6)if(!contact(a.x+direction*step,a.y,a.support)){connected=false;break;}
  if(connected)return p;
 }
}
function stopRitual(e:Engine,u:Unit){const b=e.b as Battle&{honroState?:{ritual?:{active:boolean;holderId:string};waterfallSight?:boolean}};if(b.honroState?.ritual?.holderId===u.id){b.honroState.ritual.active=false;b.honroState.waterfallSight=false;(globalThis as any).HonroStage5WaterGeometry?.setOpen(b,false);}}
export function tickWaterHazards(e:Engine,dt:number){
 const b=e.b;if(b.phase==='won'||b.phase==='lost')return;
 for(const u of b.units){
  if(u.dead||u.hp<=0||u.eaterCapturedBy)continue;
  if(u.waterRecovery){
   const r=u.waterRecovery,w=b.waters.find(w=>w.id===r.zoneId);
   r.elapsed+=dt;u.vx=u.vy=0;
   // Short visible drift above the surface. Timer and receipt survive Continue.
   if(w){u.x=r.entryX+(r.side==='left'?-1:1)*Math.min(24,r.elapsed*35);u.y=w.y+u.h*.45;}
   if(r.elapsed<.65)continue;
   const p=w&&shore(e,u,w,r.side);
   if(!p)continue; // All nominated shores occupied/invalid: wait, never teleport elsewhere or damage twice.
   Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,jumping:false,airborne:false,fallApexY:p.y,impactCooldown:.5});delete u.waterRecovery;e.skipWaterTurn(u);
   e.fx('ring',u.x,u.y,'#b3d8d2',35);e.emit('change');e.emit('save',{name:'waterHazard'});continue;
  }
  if(exempt(u))continue;
  u.waterEntrySides??={};
  for(const w of b.waters)if(w.id&&w.policy&&w.policy.mode!=='shallow'){
   const near=Math.min(Math.abs(u.x-w.x),Math.abs(u.x-w.x-w.w))<140&&Math.abs(u.y-w.y)<170;
   if(u.side===0&&near&&!u.waterWarnings?.includes(w.id)){(u.waterWarnings??=[]).push(w.id);e.message(w.policy.mode==='recover'?'깊은 물 · 최대HP '+Math.round(w.policy.damageFraction*100)+'% 피해 · 행동 종료 · 진입한 쪽 낮은 물가로 복귀':'깊은 심연 · 추락 시 전투불능');}
   if(u.x<=w.x)u.waterEntrySides[w.id]='left';else if(u.x>=w.x+w.w)u.waterEntrySides[w.id]='right';
  }
  const w=deepWaterAt(b,u);if(!w||!w.id||!w.policy||w.policy.mode==='shallow')continue;
  const side=u.waterEntrySides[w.id]||(u.x<(w.x+w.w*.5)?'left':'right');
  stopRitual(e,u);
  const before=u.hp,loss=w.policy.mode==='lethal'?u.hp:Math.ceil(u.maxHp*w.policy.damageFraction);
  u.hp=Math.max(0,u.hp-loss);environmentalLoss(b,u,before);u.hurt=.7;
  Object.assign(u,{vx:0,vy:0,moveLeft:0,jumping:false,airborne:false,moving:0});
  delete u.platformDrop;delete u.moveTarget;delete u.aiMove;delete u.meleeAction;delete u.beastAction;delete u.meleeFollow;delete u.retreat;delete u.shove;
  e.fx('burst',u.x,w.y,'#c2e6df',70);e.fx('text',u.x,w.y-u.h,'#edd2b0',18,'−'+(before-u.hp));
  if(u.hp===0){u.dead=true;if(u.side===1&&!u.summoned&&!u.honroObjectiveTarget){b.kills++;const contributor=Object.entries(u.damageBy).sort((a,b)=>b[1]-a[1])[0];e.rewardKill(u,contributor?e.unit(contributor[0]):undefined);}}
  else u.waterRecovery={zoneId:w.id,side,entryX:u.x,elapsed:0};
  e.message(u.name+(u.dead?' · 깊은 물에서 전투불능':' · 깊은 물에 휩쓸림 · 행동 종료'));
  e.endWaterAction(u);e.emit('change');e.emit('save',{name:'waterHazard'});
 }
}
