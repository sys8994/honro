/** Stage18 only. A saved, owner-scoped ritual; no body terrain or input lock. */
import type {Engine,Collision} from './engine';
import type {Battle,Unit,Projectile,Vec,Terrain} from './types';
import {segRect,clamp} from './math';
import {SKILLS} from './data';
import {rollDamage} from './damageVariance';
import {projectileCredit} from './contribution';
export type RitualKind='seal'|'echo'|'binding';
export interface KeeperZone {serial:number;kind:RitualKind;phase:'warning'|'active';x:number;y:number;w:number;h:number;direction:number;connection:Vec;warnAction:number;expires:number;returned?:boolean;damage:number;roll:number;shot:number;opportunities?:string[];target?:string;targetOpportunity?:boolean;}
export interface KeeperRitual {version:1;owner:string;next:number;serial:number;playerActions:number;suppressed:number;zone?:KeeperZone;cast?:{elapsed:number};}
const OWNER='act2-keeper',kinds:RitualKind[]=['seal','echo','binding'];
const state=(b:Battle)=>(b as any).keeperRitual as KeeperRitual|undefined;
export function keeperEligible(b:Battle,u?:Unit){return !!u&&(b as any).honroStage===18&&!(b as any).honroCustom&&b.mode==='campaign'&&u.id===OWNER&&u.side===1&&!u.dead&&!(u as any).honroSubdued&&u.hp>1;}
export function keeperBindingReplaced(u:Unit){delete (u as any).keeperBinding;}
function clearBindings(b:Battle){for(const u of b.units){const own=(u as any).keeperBinding;if(!own)continue;if(u.bound===1)u.bound=0;delete (u as any).keeperBinding;}}
export function clearKeeperRitual(b:Battle){const r=state(b);if(r){delete r.zone;delete r.cast;r.suppressed=0;}clearBindings(b);}
export function initializeKeeperRitual(b:Battle){
 if((b as any).honroStage!==18||(b as any).honroCustom||b.mode!=='campaign'){clearKeeperRitual(b);delete (b as any).keeperRitual;return;}
 const u=b.units.find(u=>u.id===OWNER);if(!keeperEligible(b,u)||['won','lost'].includes(b.phase)){clearKeeperRitual(b);return;}
 if(state(b)&&!validateKeeperRitual(b)){clearKeeperRitual(b);delete (b as any).keeperRitual;}
 (b as any).keeperRitual??={version:1,owner:OWNER,next:0,serial:0,playerActions:0,suppressed:0};
}
export function validateKeeperRitual(b:Battle){const r=state(b);if(!r)return true;const num=(v:any,min=0,max=1e9)=>Number.isFinite(v)&&v>=min&&v<=max;
 if(r.version!==1||r.owner!==OWNER||![r.next,r.serial,r.playerActions,r.suppressed].every(v=>Number.isSafeInteger(v)&&num(v))||r.next>2||r.suppressed>1)return false;
 const z=r.zone;if(z&&((z.opportunities!==undefined&&(!Array.isArray(z.opportunities)||z.opportunities.length>20||z.opportunities.some(id=>!b.units.some(u=>u.id===id))))||z.target!==undefined&&!b.units.some(u=>u.id===z.target)||z.targetOpportunity!==undefined&&typeof z.targetOpportunity!=='boolean'||!kinds.includes(z.kind)||!['warning','active'].includes(z.phase)||!num(z.serial)||!num(z.x,-200,b.width+200)||!num(z.y,-200,b.height+200)||!num(z.w,1,320)||!num(z.h,1,320)||!z.connection||!num(z.connection.x,-200,b.width+200)||!num(z.connection.y,-200,b.height+200)||![-1,1].includes(z.direction)||![z.warnAction,z.expires,z.damage,z.roll,z.shot].every(v=>num(v))||z.damage>50000||z.roll>2||z.returned!==undefined&&typeof z.returned!=='boolean'))return false;
 return !r.cast||b.side===1&&b.phase==='flight'&&b.active===OWNER&&num(r.cast.elapsed,0,.81);
}
export function keeperCastBusy(b:Battle){return !!state(b)?.cast;}
function interrupt(e:Engine){const r=state(e.b);if(!r)return;delete r.zone;delete r.cast;r.suppressed=1;e.fx('spark',e.unit(OWNER)!.x,e.unit(OWNER)!.y-70,'#91a998',26);e.message('봉음 연결이 끊겼다.');e.emit('change');}
export function keeperPressure(e:Engine,u:Unit,source:string,loss:number){if(u.id===OWNER&&(u.hp<=1||u.dead||(u as any).honroSubdued)){clearKeeperRitual(e.b);return;}const owner=e.unit(source);if(loss>0&&keeperEligible(e.b,u)&&owner&&e.allegiance(owner)===0&&Math.hypot(owner.x-u.x,owner.y-u.y)<190)interrupt(e);}
export function beginKeeperRitual(e:Engine,u:Unit,target:Unit){
 if(!keeperEligible(e.b,u))return false;initializeKeeperRitual(e.b);const r=state(e.b)!;
 // Ordinary paid navigation may approach from outside. No cross-map curse.
 if(Math.abs(target.x-u.x)>1050||Math.abs(target.y-u.y)>450)return false;
 if(r.suppressed){r.suppressed=0;u.intent='봉음 연결 회복';e.finishAction();return true;}
 const b=e.b,kind=kinds[r.next];r.next=(r.next+1)%3;r.serial++;b.shot++;u.lastAct=b.round;u.facing=target.x>=u.x?1:-1;
 const direction=u.facing,front=u.x+direction*160,ground=e.contactSurface(front,u.y-130,u.y+240)?.y??u.y;
 const x=kind==='binding'?clamp(target.x-125,10,b.width-260):clamp(front-8,10,b.width-26),y=kind==='binding'?target.y-14:ground-180;
 const roll=rollDamage(b,SKILLS.H2KEEPER),damage=e.effective(SKILLS.H2KEEPER,u).damage*.55;
 r.zone={serial:r.serial,kind,phase:'warning',x,y,w:kind==='binding'?250:16,h:kind==='binding'?28:180,direction,connection:{x:u.x+direction*76,y:u.y-76},warnAction:r.playerActions,expires:b.teamEnds[0]+1,damage,roll,shot:b.shot,opportunities:[],target:target.id,targetOpportunity:false};
 r.cast={elapsed:0};b.phase='flight';b.turnAge=b.resolveAge=0;u.anim=.9;u.intent={seal:'봉음 결계 · 예고',echo:'되울림 · 방향 예고',binding:'바닥 결박 · 예고'}[kind];
 e.onAttackStart?.(u.id);e.message(u.intent);e.emit('sound',{name:'qiRebound'});e.emit('change');e.emit('save');return true;
}
export function tickKeeperRitual(e:Engine,dt:number){const r=state(e.b);if(!r)return;const owner=e.unit(r.owner);
 if(!keeperEligible(e.b,owner)||['won','lost'].includes(e.b.phase)){clearKeeperRitual(e.b);return;}
 if(r.zone?.phase==='warning'&&e.b.side===0&&e.b.phase==='aim'){const z=r.zone,ready=(v?:Unit)=>!!v&&!v.dead&&!v.acted&&!v.enthrall&&!v.airborne&&!v.fixed&&!v.platformDrop&&v.meleeFollow!=='ready'&&v.moveLeft>0;if(e.active&&ready(e.active)&&e.canAct()){z.opportunities??=[];if(!z.opportunities.includes(e.active.id))z.opportunities.push(e.active.id);}if(ready(e.unit(z.target||'')))z.targetOpportunity=true;}
 if(r.cast){r.cast.elapsed+=dt;if(r.cast.elapsed>=.8)delete r.cast;}
 if(r.zone&&e.b.teamEnds[0]>=r.zone.expires){delete r.zone;clearBindings(e.b);}
 for(const u of e.b.units)if((u as any).keeperBinding&&u.bound===0)delete (u as any).keeperBinding;
}
export function keeperActionCompleted(e:Engine,u?:Unit){const r=state(e.b);if(!r||!u||u.side!==0||u.summoned)return;r.playerActions++;
 const z=r.zone,owner=e.unit(r.owner);if(!z||z.phase!=='warning'||r.playerActions<=z.warnAction||!z.opportunities?.includes(u.id)||z.kind==='binding'&&!z.targetOpportunity||!keeperEligible(e.b,owner))return;
 z.phase='active';e.message({seal:'봉음 결계 · 낮은 사선 차단',echo:'되울림 · 한 발 반환',binding:'바닥 결박'}[z.kind]);
 if(z.kind==='binding'){
  const p={id:e.b.nextId++,skill:'H2KEEPER',mode:'keeperBinding',owner:owner!.id,side:owner!.side,attackSide:e.allegiance(owner!),shot:z.shot,damageRoll:z.roll,damage:z.damage,skillRank:1,x:z.x,y:z.y,vx:0,vy:0,body:false} as Projectile;projectileCredit(e.b,p,owner!);
  for(const v of e.heroesAlive())if(v.x>=z.x&&v.x<=z.x+z.w&&Math.abs(v.y-(z.y+14))<55){if(v.bound===0){v.bound=1;(v as any).keeperBinding=OWNER;}e.hurt(v,z.damage,owner!.id,true,p,{x:v.x,y:v.y});}
 }
 e.emit('change');
}
function reflectable(p?:Projectile){return !p||!p.body&&!(p as any).keeperReturned&&!p.mode.startsWith('summon')&&!['returningWraith','return','crescent','phaseWraith'].includes(p.mode)&&p.skill!=='O05';}
export function keeperCollision(e:Engine,a:Vec,z:Vec,pad:number,owner:string,p?:Projectile):Collision|null{
 const r=state(e.b),q=r?.zone;const source=e.unit(owner);if(!q||!source||!keeperEligible(e.b,e.unit(r!.owner))||p?.body||e.allegiance(source)!==0)return null;
 let best:Collision|null=null;
 const take=(kind:'connection'|'seal'|'echo',x:number,y:number,w:number,h:number)=>{const hit=segRect(a,z,x,y,w,h,pad);if(hit&&(!best||hit.t<best.t)){const terrain={id:'keeper-ritual:'+kind,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,indestructible:true} as Terrain;best={...hit,x:a.x+(z.x-a.x)*hit.t,y:a.y+(z.y-a.y)*hit.t,terrain,keeperRitual:kind};}};
 take('connection',q.connection.x-18,q.connection.y-18,36,36);
 if(q.phase==='active'&&q.kind!=='binding'&&(q.kind!=='echo'||!q.returned&&reflectable(p)&&(z.x-a.x)*q.direction<-.000001))take(q.kind,q.x,q.y,q.w,q.h);
 return best;
}
export function keeperEchoVelocity(v:Vec,direction:number){const speed=Math.hypot(v.x,v.y)*.84;return{x:direction*Math.max(speed*.65,Math.abs(v.x)*.84),y:v.y*.32};}
export function keeperImpact(e:Engine,p:Projectile,h:Collision){if(!h.keeperRitual||p.body)return false;const r=state(e.b),z=r?.zone;
 if(h.keeperRitual==='connection'){interrupt(e);e.remove(p);return true;}
 if(h.keeperRitual==='echo'&&z&&!z.returned&&reflectable(p)){
  const keeper=e.unit(OWNER)!;z.returned=true;(p as any).keeperReturned=true;(p as any).keeperEchoOrigin={owner:p.owner,side:p.side,shot:p.shot};
  const v=keeperEchoVelocity({x:p.vx,y:p.vy},z.direction);p.vx=v.x;p.vy=v.y;p.x=h.x+z.direction*(p.radius+12);p.y=h.y;
  p.owner=keeper.id;p.side=keeper.side;p.attackSide=e.allegiance(keeper);p.hit=[];p.returnX=keeper.x;p.returnY=keeper.y;
  for(const key of ['honroReportSource','honroContributionOwner','honroWeakOwner','honroWeakFactor','friendlyFireApplied'])delete (p as any)[key];projectileCredit(e.b,p,keeper);
  e.fx('spark',h.x,h.y,'#8da99b',22);e.emit('sound',{name:'qiRebound'});return true;
 }
 return false; // Seal is an ordinary visible solid face for weapon impacts.
}
