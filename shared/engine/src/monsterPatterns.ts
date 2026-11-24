import type {Battle,Projectile,Unit,Vec} from './types';
import type {Engine} from './engine';
import {SKILLS} from './data';
import {segmentTerrain,terrainRectIntersects} from './math';
import {sweepBodyTerrain} from './locomotion';

const rules={
 geuseundae:['몸을 부풀린다',460,158,'area',.90],
 dokkaebibul:['불씨가 모인다',650,138,'merge',.82],
 eoduksini:['그림자 강타',480,122,'area',.82],
 sonmalmyeong:['옮는 매듭',580,105,'knot',.62],
 gaekgwi:['어깨로 달려든다',430,94,'lane',.68],
 dueoksini:['팔 내려찍기',385,149,'area',1.02],
 yagwanggwi:['물건에 손을 뻗는다',425,94,'theft',.55],
 mulgwishin:['물가로 당긴다',550,102,'lane',.63],
 geuseunsae:['기예 봉인',665,105,'seal',.60],
 muyeo:['다음 표적 지목',800,106,'omen',.64],
 boar:['직선 돌진',310,84,'lane',.87],
 stag:['뿔 횡쓸기',285,119,'lane',.82],
 sniper:['조준 저격',1200,75,'lane',.92],
 shield:['방패 밀어치기',290,88,'lane',.85],
 mourner:['상여추 낙하',815,120,'area',.90],
 lantern:['혼무',760,108,'mist',.76],
 pick:['곡괭이 직선 찍기',350,88,'lane',.90],
 cart:['선로 전진',435,99,'lane',.87],
 resonance:['공명 파동',670,136,'area',.86],
 naruWarden:['나루장승 진흙 횡쓸기',430,123,'lane',.80],
 bridgeWarden:['교각귀 잔해 낙하',610,142,'area',.84],
 vanguard:['방패 전위 돌진',460,108,'lane',.96],
 marksman:['사격대 곡사',980,116,'area',.95],
 device:['장치 범위 회전',630,141,'area',.91],
 pursuer:['통로 돌진',490,111,'lane',.93],
 bierRepair:['시종의 수리 연결',785,110,'repair',.75],
 sodanOmen:['점괘 · 고정 지점',910,136,'area',.85]
} as const;
export type MonsterPatternKind=keyof typeof rules;
export type MonsterPhase='windup'|'release'|'recover'|'grow'|'shrink'|'merge'|'attach'|'spread'|'steal'|'lure'|'seal'|'link';
export type MonsterVariant='giant'|'burning'|'cursed'|'hungry'|'captain';
type Shape='area'|'lane'|'merge'|'knot'|'theft'|'seal'|'omen'|'mist'|'repair';
export interface MonsterWindup {
 serial:number; kind:MonsterPatternKind; target:string; label:string; shape:Shape;
 origin:Vec; impact:Vec; radius:number; direction:number; damage:number; offered:string[];
 answered:string[]; seen:boolean; teamEnd:number; skill?:string; linked?:string;
}
interface MergePart extends Vec {id:string;maxHp:number;hp:number;bound:number;}
export interface MonsterState {
 recovery?:boolean; cooldown?:number; repaired?:number; fed?:number; nextCast?:number; lastGrowthShot?:string; growthRound?:number;
 guardFace?:number; exposedUntil?:number; attachedTo?:string; attachedOrigin?:Vec;
 merge?:MergePart[]; mergedInto?:string; lifted?:{key:string;sieve:Vec;expiry:number};
 omen?:{source:string;target:string;expiry:number;point:Vec;radius:number};
}
export interface MonsterCondition {
 kind:'attachment'|'knot'|'seal'|'weak'; source:string; serial:number; expiry:number;
 skill?:string; factor?:number; withheld?:number; previous?:string;
}
const live=(u?:Unit):u is Unit=>!!u&&!u.dead&&u.hp>0&&!u.eaterCapturedBy;
const enemy=(u?:Unit):u is Unit=>live(u)&&u.side===1&&!u.enthrall;
const hero=(u?:Unit):u is Unit=>live(u)&&u.side===0&&!u.summoned&&!u.enthrall;
const fresh=(b:Battle)=>b.honroMonsterReworkRevision===1;
const state=(u:Unit):MonsterState=>u.honroMonsterState??={};
const center=(u:Unit)=>({x:u.x,y:u.y-u.h*.44});
// Great darkness (stage 46): its slam reaches only the shade zone around its feet.
export const darknessZone=(u:Unit)=>380+100*(((u as any).honroMonsterGrowth||1)-1);
const distance=(p:Vec,q:Vec)=>Math.hypot(p.x-q.x,p.y-q.y);
const validKind=(k?:string):k is MonsterPatternKind=>!!k&&Object.hasOwn(rules,k);
const clear=(e:Engine,a:Vec,b:Vec)=>!e.collisionTerrain(a,b,0).some(t=>!t.broken&&!!segmentTerrain(a,b,t,0));
function trajectoryClear(e:Engine,a:Vec,b:Vec,lob:boolean){
 if(clear(e,a,b))return true;
 if(!lob)return false;
 const rise=Math.min(170,Math.abs(b.x-a.x)*.22);
 const top=Math.min(a.y,b.y)-rise,c={x:(a.x+b.x)*.5,y:top};
 return clear(e,a,c)&&clear(e,c,b);
}
type Waterfront=Battle&{honroAct4Design?:{waterPolicies?:{kind:string;x1:number;x2:number;surface:number}[]};
 honroAct4PreviewState?:{tide?:{surface?:number}}};
function wetAt(b:Battle,x:number,y:number,r:number){
 if(b.waters.some(w=>x+r>w.x&&x-r<w.x+w.w&&y>=w.y-5&&y<w.y+w.depth+20))return true;
 const coast=b as Waterfront;
 return !!coast.honroAct4Design?.waterPolicies?.some(z=>x+r>z.x1&&x-r<z.x2&&y>=(coast.honroAct4PreviewState?.tide?.surface??z.surface)-5);
}
function signal(e:Engine,u:Unit,phase:MonsterPhase,targetId?:string,point=center(u)){
 const kind=u.honroMonsterPattern;
 if(!kind)return;
 e.emit('monsterPattern',{id:u.id,kind,phase,targetId,x:point.x,y:point.y});
}
function say(e:Engine,u:Unit,label:string,phase:MonsterPhase,targetId?:string,point?:Vec){
 u.intent=label;
 e.message(u.name+' · '+label);
 signal(e,u,phase,targetId,point);
}
function laneDistance(p:Vec,a:Vec,b:Vec){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
 return Math.hypot(a.x+t*dx-p.x,a.y+t*dy-p.y);
}
function groundShift(e:Engine,u:Unit,dir:number,amount:number,stayDry=true){
 if(u.fixed||u.airborne||u.jumping||u.summonFloating||!e.grounded(u))return 0;
 let travelled=0;
 while(travelled<amount){
  const step=Math.min(4,amount-travelled),x=u.x+step*dir;
  const top=e.surface(x,u.y-9,u.y+9);
  if(!top||x<u.r+20||x>e.b.width-u.r-20)break;
  const p={x,y:top.y};
  if(!e.surface(x-u.r,p.y-16,p.y+16)||!e.surface(x+u.r,p.y-16,p.y+16))break;
  if(stayDry&&wetAt(e.b,x,p.y,u.r))break;
  if(e.b.units.some(v=>v!==u&&live(v)&&!v.summonFloating&&!v.honroMonsterState?.mergedInto&&Math.abs(v.x-x)<u.r+v.r&&p.y>v.y-v.h+2&&p.y-u.h<v.y-2))break;
  if(sweepBodyTerrain(e.b.terrain,u,u,p)||e.collisionTerrain(u,p,u.r).some(t=>!t.broken&&!t.oneWay&&terrainRectIntersects(t,x-u.r,p.y-u.h,u.r*2,u.h-.5,0)))break;
  u.x=x;u.y=p.y;
  travelled+=step;
 }
 if(travelled){
  u.vx=u.vy=0;u.moving=.12;
  delete u.moveTarget;
 }
 return travelled;
}
function push(e:Engine,u:Unit,dir:number,budget:number){
 if(u.honroMonsterPushAt===e.b.teamEnds[1]||u.enemySoftBind||u.enemyPush||u.honroMonsterCondition?.kind==='attachment')return;
 if(groundShift(e,u,dir,budget)>0)u.honroMonsterPushAt=e.b.teamEnds[1];
}
function waveRange(e:Engine,u:Unit,kind:MonsterPatternKind){
 const [ ,range,radius ]=rules[kind],growth=kind==='eoduksini'?u.honroMonsterGrowth||1:1;
 const vast=(u as any).honroGreatDarkness;if(vast)return {range:darknessZone(u),radius:radius*(1+(growth-1)*.35)};
 return {range,radius:radius*(1+(growth-1)*.1)*(u.honroMonsterVariant==='giant'?1.12:1)};
}
function attackDamage(e:Engine,u:Unit,k:MonsterPatternKind){
 const skill=u.loadout.map(id=>SKILLS[id]).find(s=>s&&!s.passive&&s.damage>0);
 const dmg=skill?e.effective(skill,u).damage:45*u.attack;
 return Math.max(1,dmg*rules[k][4]*(1+((k==='eoduksini'?u.honroMonsterGrowth||1:1)-1)*.15));
}
export function monsterPatternResponse(e:Engine){
 if(!fresh(e.b)||!e.canAct())return;
 const current=e.active;
 if(!hero(current)||current.stunnedRound===e.b.round||current.meleeFollow==='ready')return;
 for(const owner of e.b.units){
  const w=owner.honroMonsterWindup;
  if(!w?.seen||!enemy(owner))continue;
  if(!w.offered.includes(current.id))w.offered.push(current.id);
 }
}
export function observeMonsterPattern(e:Engine,id:string,serial:number){
 const w=e.unit(id)?.honroMonsterWindup;
 if(w?.serial!==serial)return false;
 w.seen=true;monsterPatternResponse(e);return true;
}
function recover(e:Engine,u:Unit,w:MonsterWindup,label='헛친 뒤 빈틈'){
 const s=state(u);
 s.exposedUntil=e.b.teamEnds[0]+1;s.cooldown=1;
 say(e,u,label,'recover',w.target,w.impact);
}
function offerOmen(e:Engine,u:Unit,target:Unit){
 const linked=e.b.units.find(v=>v!==u&&enemy(v)&&!v.fixed&&!v.honroObjectiveTarget&&!v.honroMonsterState?.omen&&distance(v,u)<625&&clear(e,center(v),center(u)));
 if(linked&&hero(target))return linked.id;
}
function isWaterfront(e:Engine,u:Unit){
 const coast=e.b as Waterfront,stageWater=coast.honroAct4Design?.waterPolicies||[];
 return stageWater.some(z=>z.kind==='recover'&&u.x>=z.x1-210&&u.x<=z.x2+210&&
  Math.abs(u.y-(coast.honroAct4PreviewState?.tide?.surface??z.surface))<=700)||
  e.b.waters.some(w=>w.kind==='water'&&u.x>=w.x-210&&u.x<=w.x+w.w+210&&Math.abs(u.y-w.y)<=700);
}
function repairAlly(e:Engine,u:Unit){
 const map=e.b as Battle&{honroState?:{stage8Bier?:{completedOnce?:number;status?:string}}};
 if(!map.honroState?.stage8Bier?.completedOnce||(state(u).repaired||0)>=2)return;
 const candidates=e.b.units.filter(v=>v!==u&&enemy(v)&&!v.honroObjectiveTarget&&(v.boss||v.honroType==='bier')&&v.hp<v.maxHp&&distance(v,u)<925);
 return candidates.find(v=>clear(e,center(u),center(v)))?.id;
}
function formMerge(e:Engine,u:Unit){
 const s=state(u);
 const rest=e.b.units.filter(v=>v!==u&&enemy(v)&&v.honroMonsterPattern==='dokkaebibul'&&v.honroMonsterGroup===u.honroMonsterGroup&&!v.honroMonsterWindup&&
  !v.honroMonsterState?.mergedInto&&!v.honroMonsterState?.merge&&distance(v,u)<=465&&clear(e,center(u),center(v))).slice(0,2);
 if(!rest.length)return false;
 const all=[u,...rest];
 s.merge=all.map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,bound:v.bound,x:v.x,y:v.y}));
 u.hp=all.reduce((hp,v)=>hp+v.hp,0);
 u.maxHp=all.reduce((hp,v)=>hp+v.maxHp,0);
 u.bound=Math.max(...all.map(v=>v.bound));
 for(const v of rest){
  state(v).mergedInto=u.id;v.x=u.x;v.y=u.y;v.vx=v.vy=0;
  delete v.aiMove;delete v.moveTarget;
 }
 return true;
}
function undoMerge(e:Engine,u:Unit,source=''){
 const s=u.honroMonsterState,parts=s?.merge;if(!parts||!s)return;
 delete s.merge;
 const hp=Math.max(0,u.hp),total=parts.reduce((n,p)=>n+p.hp,0);
 // Use the original contribution of each living flame so merging never heals a wounded part.
 for(const p of parts){
  const v=e.unit(p.id);if(!v)continue;
  delete state(v).mergedInto;v.maxHp=p.maxHp;v.bound=Math.min(v.bound,p.bound);
  if(v!==u){v.x=p.x;v.y=p.y;}
  if(hp>0)v.hp=hp*p.hp/total;
  else if(v!==u&&!v.dead)e.hurt(v,v.hp+v.shield+10,source,false,undefined,undefined,'environment');
 }
 if(!hp)u.hp=0;
}
export function monsterRedirect(e:Engine,u:Unit,owner:string){
 if(!fresh(e.b)||!u.honroMonsterState?.mergedInto)return u;
 const lead=e.unit(u.honroMonsterState.mergedInto);
 return lead&&lead.id!==owner&&enemy(lead)&&lead.honroMonsterState?.merge?lead:u;
}
function condition(e:Engine,u:Unit,w:MonsterWindup,next:MonsterCondition['kind'],skill?:string){
 if(u.honroMonsterCondition||u.enemySoftBind||u.enemyControlGrace||u.honroMonsterPushAt===e.b.teamEnds[1])return false;
 u.honroMonsterCondition={kind:next,source:e.active!.id,serial:w.serial,expiry:e.b.teamEnds[0]+1,skill};
 if(next==='attachment'){
  const source=e.active!,s=state(source);
  s.attachedTo=u.id;s.attachedOrigin={x:source.x,y:source.y};
  u.honroMonsterCondition.factor=.68;
 }
 if(next==='knot')u.honroMonsterCondition.previous=u.id;
 return true;
}
export function clearMonsterCondition(e:Engine,u:Unit){
 const a=u.honroMonsterCondition;
 if(!a)return;
 if(a.withheld&&!u.acted)u.moveLeft=Math.min(u.maxMove*(u.bound>0?.45:1),u.moveLeft+a.withheld);
 if(a.kind==='attachment'){
  const o=e.unit(a.source),s=o?.honroMonsterState;
  if(o&&s?.attachedTo===u.id){
   if(s.attachedOrigin)Object.assign(o,s.attachedOrigin);
   delete s.attachedOrigin;delete s.attachedTo;
  }
 }
 delete u.honroMonsterCondition;
}
export function monsterMovementBudget(e:Engine,u:Unit){
 const a=u.honroMonsterCondition;
 if(!fresh(e.b)||!a?.factor||u.acted)return;
 const cap=Math.min(u.moveLeft,u.maxMove*a.factor);
 a.withheld=u.moveLeft-cap;u.moveLeft=cap;
}
export function monsterSkillBlocked(b:Battle,u:Unit,s:SkillLike|undefined){
 return !!s&&fresh(b)&&u.honroMonsterCondition?.kind==='seal'&&u.honroMonsterCondition.skill===s.id;
}
type SkillLike={id:string};
export function recordMonsterSkill(e:Engine,u:Unit,id:string){
 if(fresh(e.b)&&hero(u))u.honroLastCombatSkill=id;
 else if(fresh(e.b)&&enemy(u)&&u.honroMonsterState?.omen)delete u.honroMonsterState.omen;
}
export function monsterPriorityTarget(e:Engine,u:Unit){
 if(!fresh(e.b))return;
 const mark=u.honroMonsterState?.omen;
 if(!mark){
  if(u.honroMonsterVariant!=='hungry')return;
  return e.heroesAlive().filter(t=>t.hp<t.maxHp*.60&&distance(u,t)<820&&clear(e,center(u),center(t)))
   .sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
 }
 const t=e.unit(mark.target);
 if(!hero(t)||!enemy(e.unit(mark.source))||mark.expiry<e.b.teamEnds[0]||distance(center(t),mark.point)>mark.radius||
  !clear(e,center(u),center(t))){delete state(u).omen;return;}
 return t;
}
export function monsterActionCompleted(e:Engine,u?:Unit){
 if(!fresh(e.b)||!hero(u)||u.acted||e.b.side!==0||u.stunnedRound===e.b.round||u.meleeFollow==='ready')return;
 for(const owner of e.b.units){
  const w=owner.honroMonsterWindup;
  if(w?.seen&&w.offered.includes(u.id)&&!w.answered.includes(u.id))w.answered.push(u.id);
 }
 const a=u.honroMonsterCondition;
 if(a?.kind==='attachment'||a?.kind==='seal'||a?.kind==='weak')clearMonsterCondition(e,u);
}
function refund(e:Engine,u:Unit){
 const s=u.honroMonsterState,v=s?.lifted;
 if(!v||!s)return;
 delete s.lifted;
 e.b.items[v.key]=(e.b.items[v.key]||0)+1;
}
function steal(e:Engine,u:Unit,target:Unit,w:MonsterWindup){
 const key=['focus','heal','ward'].find(k=>e.b.items[k]>0);
 if(!key||state(u).lifted)return;
 const x=u.x-w.direction*155,top=e.surface(x,u.y-105,u.y+105),p={x:top?x:u.x,y:top?.y??u.y};
 e.b.items[key]--;
 state(u).lifted={key,sieve:p,expiry:e.b.teamEnds[1]+2};
 groundShift(e,u,-w.direction,140);
 say(e,u,'소모품을 낚아챘다 · 쓰러뜨리거나 체로 유인하면 반환','steal',target.id,p);
}
function support(e:Engine,u:Unit,t:Unit){
 const same=u.honroMonsterVariant==='captain'&&u.honroType;
 if(!same&&u.honroMonsterPattern!=='mourner'||e.b.round%3!==1)return false;
 const s=state(u);
 if(s.fed===e.b.round)return false;
 const ally=e.b.units.find(v=>v!==u&&enemy(v)&&!v.acted&&(!same||v.honroType===same)&&distance(v,u)<510&&clear(e,center(u),center(v)));
 if(!ally)return false;
 s.fed=e.b.round;
 if(same){
  ally.shield=Math.max(ally.shield,Math.min(32,Math.round(ally.maxHp*.05)));
  ally.shieldUntil=e.b.teamEnds[0]+1;
 }else{
  const i=e.b.queue.indexOf(ally.id),at=e.b.queue.indexOf(u.id);
  if(i<=at||at<0)return false;
  e.b.queue.splice(i,1);e.b.queue.splice(at+1,0,ally.id);
 }
 say(e,u,same?'같은 무리에게 방호':'곡소리 · 동료의 차례를 앞당긴다','link',ally.id,center(t));
 e.finishAction();return true;
}
export function readyMonsterWarning(b:Battle,u:Unit){
 const w=u.honroMonsterWindup;
 return fresh(b)&&enemy(u)&&!!w&&w.seen&&w.answered.includes(w.target)&&b.teamEnds[0]>w.teamEnd;
}
function variantPattern(u:Unit):MonsterPatternKind|undefined{
 if(u.honroMonsterPattern)return u.honroMonsterPattern;
 if(u.honroMonsterVariant==='giant')return 'pursuer';
 if(u.honroMonsterVariant==='burning'||u.honroMonsterVariant==='cursed')return 'lantern';
}
// Great darkness (2026-11-24): it acts every enemy turn. Each turn it lands the blow it marked
// last turn on every hero still inside the mark, then marks the next one at once, so the answer
// is to move out (or break it with one heavy hit). Near the shade it slams and throws heroes
// out; heroes shooting from ledges in reach are grabbed and dragged toward it.
const DARK_REACH=1250,DARK_RISE=900;
function darkTarget(e:Engine,u:Unit){
 const origin={x:u.x,y:u.y-60};
 return e.b.units.filter(v=>hero(v)&&v.y>u.y-DARK_RISE&&v.y<u.y+260&&distance(origin,center(v))<=DARK_REACH)
  .sort((a,c)=>distance(origin,center(a))-distance(origin,center(c)))[0];
}
function prepareDarkness(e:Engine,u:Unit){
 if(u.stunnedRound===e.b.round||(u.stun||0)>0)return false;
 const t=darkTarget(e,u);if(!t)return false;
 const g=u.honroMonsterGrowth||1,near=Math.abs(t.x-u.x)<=darknessZone(u)+t.r,dir=t.x>=u.x?1:-1;
 const heroes=e.b.units.filter(hero),mean=heroes.reduce((n,v)=>n+v.maxHp,0)/Math.max(1,heroes.length);
 const label=near?'그림자 강타':'그림자 손아귀',impact=center(t);
 u.honroMonsterWindup={serial:e.b.nextId++,kind:'eoduksini',target:t.id,label,shape:'area',origin:{x:u.x,y:u.y-60},impact,
  radius:near?240*(1+(g-1)*.35):165+25*(g-1),direction:dir,damage:Math.round(mean*(near?.34:.24)*(1+(g-1)*.15)),
  offered:[],answered:[],seen:false,teamEnd:e.b.teamEnds[0]};
 u.facing=dir;say(e,u,label+' · 예고','windup',t.id,impact);
 e.finishAction();return true;
}
function resolveDarkness(e:Engine,u:Unit,w:MonsterWindup){
 delete u.honroMonsterWindup;
 const b=e.b;
 if(b.teamEnds[0]<=w.teamEnd||u.stunnedRound===b.round||(u.stun||0)>0){recover(e,u,w,'정해 둔 공격을 거뒀다');e.finishAction();return true;}
 u.anim=1;let hit=0;
 for(const v of b.units){
  if(!hero(v))continue;
  const d=distance(center(v),w.impact);if(d>w.radius+v.r)continue;
  const hp=v.hp;e.hurt(v,w.damage*(.75+.25*(1-Math.min(1,d/w.radius))),u.id,false,undefined,w.origin,'normal',undefined,{attackSide:1});
  if(v.hp>=hp)continue;hit++;
  if(w.label==='그림자 강타')push(e,v,Math.sign(v.x-u.x)||w.direction,95);
  else push(e,v,Math.sign(u.x-v.x)||-w.direction,120);
 }
 e.fx('ring',w.impact.x,w.impact.y,'#7a62b0',w.radius);e.emit('sound',{name:'hit'});
 say(e,u,hit?w.label:'헛친 그림자',hit?'release':'recover',w.target,w.impact);
 if(!prepareDarkness(e,u))e.finishAction();
 return true;
}
export function prepareMonsterPattern(e:Engine,u:Unit,t:Unit){
 const k=variantPattern(u);if(!fresh(e.b)||!enemy(u)||!hero(t))return false;
 if(support(e,u,t))return true;
 if((u as any).honroGreatDarkness)return prepareDarkness(e,u);
 if(!validKind(k))return false;
 const s=state(u);
 if(s.cooldown){s.cooldown--;return false;}
 if(k==='yagwanggwi'&&s.lifted||k==='gaekgwi'&&s.attachedTo||k==='mulgwishin'&&!isWaterfront(e,u))return false;
 if(u.stunnedRound===e.b.round||(u.stun||0)>0)return false;
 const [baseLabel,,,baseShape]=rules[k],origin=(u as any).honroGreatDarkness?{x:u.x,y:u.y-60}:center(u),impact=center(t),{range,radius}=waveRange(e,u,k);
 const baseTitle=u.honroMonsterPattern?baseLabel:u.honroMonsterVariant==='giant'?'큰 내려찍기':u.honroMonsterVariant==='burning'?'불씨 낙하':'약화하는 혼불';
 const second=(s.nextCast||0)%2===1;
 const alternate=k==='naruWarden'||k==='bridgeWarden';
 const shape:Shape=alternate&&second?k==='naruWarden'?'area':'lane':baseShape;
 const label=alternate&&second?k==='naruWarden'?'진흙 밀기':'교각 횡쓸기':baseTitle;
 if(k==='sodanOmen'){
  const map=e.b as Battle&{honroState?:{sodanCoop?:boolean}};
  if(map.honroState?.sodanCoop)return false;
 }
 const dir=t.x>=u.x?1:-1;
 if(distance(origin,impact)>range||Math.abs(origin.y-impact.y)>(shape==='lane'&&k!=='sniper'?110:440))return false;
 const lob=k==='sniper'||k==='marksman'||k==='mourner'||k==='bridgeWarden';
 if(!trajectoryClear(e,origin,impact,lob))return false;
 if(e.b.units.some(v=>v!==u&&enemy(v)&&(v.honroMonsterWindup?.target===t.id||v.enemyEffectCast?.target===t.id)))return false;
 if(e.b.units.filter(v=>(v.honroMonsterWindup||v.enemyEffectCast)&&enemy(v)).length>=2)return false;
 const linked=shape==='omen'||k==='sodanOmen'?offerOmen(e,u,t):shape==='repair'?repairAlly(e,u):undefined;
 if((shape==='omen'||shape==='repair'||k==='sodanOmen')&&!linked)return false;
 if(alternate)s.nextCast=(s.nextCast||0)+1;
 const last=t.honroLastCombatSkill;
 const alternative=shape==='seal'&&last&&SKILLS[last]&&!SKILLS[last].basic&&
  !['A01','M01','S00','S01','O01'].includes(last)&&t.loadout.includes(last)&&
  t.loadout.some(id=>id!==last&&SKILLS[id]&&!SKILLS[id].passive&&e.cooldownLeft(t,id)===0&&e.canAfford(SKILLS[id],t));
 if(shape==='seal'&&!alternative)return false;
 u.honroMonsterWindup={serial:e.b.nextId++,kind:k,target:t.id,label,shape,origin,impact,radius,direction:dir,damage:attackDamage(e,u,k),
  offered:[],answered:[],seen:false,teamEnd:e.b.teamEnds[0],skill:alternative?last:undefined,linked};
 u.facing=dir;if(k==='shield'||k==='vanguard')s.guardFace=dir;
 say(e,u,label+' · 예고','windup',t.id,impact);
 e.finishAction();return true;
}
export function monsterTurn(e:Engine,u?:Unit){
 if(!fresh(e.b)||!enemy(u))return false;
 const s=u.honroMonsterState,w=u.honroMonsterWindup;
 if(s?.mergedInto||s?.attachedTo){e.finishAction();return true;}
 if(s?.recovery){delete s.recovery;e.finishAction();return true;}
 if(!w)return false;
 if((u as any).honroGreatDarkness)return resolveDarkness(e,u,w);
 delete u.honroMonsterWindup;
 const b=e.b,t=e.unit(w.target),wasMerged=!!s?.merge;
 const shifted=distance(center(u),w.origin)>65;
 const ready=hero(t)&&(w.kind!=='sodanOmen'||enemy(e.unit(w.linked||'')))&&w.seen&&w.answered.includes(t.id)&&b.teamEnds[0]>w.teamEnd&&!shifted;
 if(!ready||u.stunnedRound===b.round||(u.stun||0)>0){
  recover(e,u,w,'정해 둔 공격을 거뒀다');e.finishAction();return true;
 }
 delete state(u).guardFace;
 if(w.shape==='merge'&&!s?.merge&&formMerge(e,u)){
  say(e,u,'불씨들이 한데 뭉쳤다','merge',t.id,w.impact);
 }else if(w.shape==='omen'){
  const ally=e.unit(w.linked||'');
  if(enemy(ally)&&distance(center(t),w.impact)<=w.radius&&clear(e,center(u),center(ally))){
   state(ally).omen={source:u.id,target:t.id,expiry:b.teamEnds[0]+1,point:w.impact,radius:w.radius};
   say(e,u,'예고한 적 한 기가 표적을 좇는다','link',t.id,w.impact);
  }else recover(e,u,w);
 }else if(w.shape==='repair'){
  const ally=e.unit(w.linked||'');
  if(enemy(ally)&&repairAlly(e,u)===ally.id){
   const amount=Math.min(ally.maxHp-ally.hp,Math.round(ally.maxHp*.035));
   if(amount>0){state(u).repaired=(state(u).repaired||0)+1;ally.hp+=amount;e.fx('ring',ally.x,ally.y-ally.h*.4,'#c1c4a3',w.radius);}
   say(e,u,'시종의 수리','link',ally.id,center(ally));
  }else recover(e,u,w);
 }else{
  let hit=false;
  const lob=w.kind==='sniper'||w.kind==='marksman'||w.kind==='mourner'||w.kind==='bridgeWarden';
  u.anim=1;
  if(['boar','cart','vanguard','pursuer'].includes(w.kind))groundShift(e,u,w.direction,Math.min(105,Math.abs(w.impact.x-w.origin.x)*.35));
  for(const v of b.units){
   if(!hero(v)||!w.answered.includes(v.id)||v.stunnedRound===b.round)continue;
   const p=center(v),d=w.shape==='lane'?laneDistance(p,w.origin,w.impact):distance(p,w.impact);
   const anchor=w.shape==='lane'?w.origin:w.impact;
   if(d>w.radius+v.r||!clear(e,anchor,p)||!trajectoryClear(e,w.origin,w.impact,lob))continue;
   const hp=v.hp;e.hurt(v,w.damage*(.67+.33*(1-Math.min(1,d/w.radius))),u.id,false,undefined,w.origin,'normal',undefined,{attackSide:1});
   if(v.hp>=hp||!hero(v))continue;
   hit=true;
   if(w.kind==='mulgwishin')push(e,v,Math.sign(w.origin.x-v.x),88);
   else if(['stag','naruWarden','dueoksini','vanguard'].includes(w.kind))push(e,v,w.direction,60);
   if(v!==t)continue;
   if(w.kind==='gaekgwi'&&condition(e,v,w,'attachment'))signal(e,u,'attach',v.id);
   if(w.shape==='seal'&&w.skill&&condition(e,v,w,'seal',w.skill))signal(e,u,'seal',v.id);
   if(u.honroMonsterVariant==='cursed')condition(e,v,w,'weak');
   if(w.shape==='theft')steal(e,u,v,w);
   if(w.shape==='knot'&&condition(e,v,w,'knot'))signal(e,u,'link',v.id);
  }
  e.fx('ring',w.impact.x,w.impact.y,'#c5ac79',w.radius);e.emit('sound',{name:'hit'});
  if(u.honroMonsterVariant==='burning'){
   const top=e.surface(w.impact.x,w.impact.y,w.impact.y+160);
   if(top)b.zones.push({id:b.nextId++,kind:'fire',x:w.impact.x,y:top.y,radius:Math.min(69,w.radius),owner:u.id,side:1,attackSide:1,
    damage:w.damage*.18,expires:b.round+1});
  }
  if(w.shape==='mist'&&u.honroMonsterPattern==='lantern')b.honroMonsterMist={point:w.impact,radius:w.radius,until:b.teamEnds[0]+1};
  if(!hit||u.honroMonsterVariant==='giant'||['dueoksini','device','boar','vanguard','pursuer','geuseundae'].includes(w.kind))recover(e,u,w);
  else say(e,u,w.label,'release',t.id,w.impact);
 }
 if(w.kind==='marksman')groundShift(e,u,-w.direction,105);
 if(wasMerged&&w.shape==='merge')undoMerge(e,u);
 state(u).cooldown=1;
 e.finishAction();return true;
}
export function monsterDefense(e:Engine,u:Unit,from?:Vec){
 if(!fresh(e.b))return 1;
 const s=u.honroMonsterState;
 if(s?.exposedUntil!==undefined&&s.exposedUntil>e.b.teamEnds[0])return 1.14;
 if(from&&enemy(u)&&s?.guardFace&&Math.sign(from.x-u.x)===s.guardFace&&Math.abs(from.y-center(u).y)<145)return .73;
 return 1;
}
export function monsterHit(e:Engine,u:Unit,owner:string,direct:boolean,p:Projectile|undefined,loss:number){
 if(!fresh(e.b))return;
 const source=e.unit(owner);
 if(u.dead&&u.honroMonsterState?.merge)undoMerge(e,u,owner);
 if(u.dead&&u.honroMonsterState?.lifted)refund(e,u);
 if(!enemy(u)||!source||e.allegiance(source)!==0||loss<=0)return;
 const w=u.honroMonsterWindup;
 if(w&&direct&&((u as any).honroGreatDarkness?loss>=u.maxHp*.06:(!u.boss||loss>=u.maxHp*.12||w.kind==='sodanOmen'))){
  delete u.honroMonsterWindup;delete state(u).guardFace;state(u).recovery=true;
  recover(e,u,w,'준비가 끊겼다');
 }
 if(direct&&u.honroMonsterState?.attachedTo){
  const t=e.unit(u.honroMonsterState.attachedTo);if(t)clearMonsterCondition(e,t);
 }
 if(direct){
  for(const v of e.b.units){
   const mark=v.honroMonsterState?.omen;
   if(mark&&(u===v||mark.source===u.id))delete state(v).omen;
   const other=v.honroMonsterWindup;
   if(other?.linked===u.id&&other.kind==='sodanOmen'){
    delete v.honroMonsterWindup;state(v).recovery=true;recover(e,v,other,'점괘 연결이 끊겼다');
   }
  }
 }
 if(u.honroMonsterPattern==='eoduksini'&&(p||direct)){
  const s=state(u),shot=(source.summonOwner||p?.owner||owner)+':'+(p?.shot??e.b.shot);
  if(s.lastGrowthShot===shot)return;
  s.lastGrowthShot=shot;s.growthRound=e.b.teamEnds[0];
  const n=u.honroMonsterGrowth||1;
  if(n<3){u.honroMonsterGrowth=n+1;say(e,u,'그림자가 자란다','grow');}
 }
}
function roundConditions(e:Engine){
 const b=e.b;
 for(const u of b.units){
  const s=u.honroMonsterState,a=u.honroMonsterCondition;
  if(a?.kind==='knot'&&hero(u)&&enemy(e.unit(a.source))){
   clearMonsterCondition(e,u);
   const next=b.units.find(v=>v!==u&&hero(v)&&!v.honroMonsterCondition&&!v.enemySoftBind&&
    Math.abs(v.y-u.y)<78&&distance(v,u)<=190&&clear(e,center(v),center(u)));
   const target=next||u;
   if(next)signal(e,e.unit(a.source)!,'spread',next.id);
   e.hurt(target,Math.max(8,target.maxHp*.045),a.source,false,undefined,center(u),'normal',undefined,{attackSide:1});
  }
  if(u.honroMonsterPattern==='eoduksini'&&enemy(u)&&b.teamEnds[0]>0&&s?.growthRound!==b.teamEnds[0]-1&&!((u as any).honroGreatDarkness&&s?.growthRound===b.teamEnds[0]-2)&&(u.honroMonsterGrowth||1)>1){
   u.honroMonsterGrowth!--;say(e,u,'그림자가 가라앉는다','shrink');
  }
  if(s?.lifted&&b.teamEnds[1]>=s.lifted.expiry)refund(e,u);
 }
}
export function monsterRound(e:Engine){
 if(!fresh(e.b)||e.b.side!==1)return;
 roundConditions(e);
}
export function tickMonsterPatterns(e:Engine){
 const b=e.b;if(!fresh(b))return;
 monsterPatternResponse(e);
 for(const u of b.units){
  const s=u.honroMonsterState,a=u.honroMonsterCondition,w=u.honroMonsterWindup;
  if(s?.mergedInto){
   const leader=e.unit(s.mergedInto);
   if(!leader?.honroMonsterState?.merge)delete s.mergedInto;
   else{u.x=leader.x;u.y=leader.y;continue;}
  }
  if(s?.merge&&!enemy(u))undoMerge(e,u);
  if(w&&(!enemy(u)||!hero(e.unit(w.target)))){
   delete u.honroMonsterWindup;delete state(u).guardFace;
  }
  if(a&&(!hero(u)||!enemy(e.unit(a.source))||a.expiry+1<e.b.teamEnds[0]))clearMonsterCondition(e,u);
  if(s?.attachedTo){
   const v=e.unit(s.attachedTo);
   if(hero(v)&&v.honroMonsterCondition?.source===u.id){u.x=v.x-v.facing*v.r*.6;u.y=v.y-v.h*.49;u.vx=u.vy=0;}
   else{
    if(s.attachedOrigin)Object.assign(u,s.attachedOrigin);
    delete s.attachedOrigin;delete s.attachedTo;
   }
  }
  if(s?.lifted){
   if(!enemy(u))refund(e,u);
   else if(e.heroesAlive().some(v=>distance(v,s.lifted!.sieve)<105&&Math.abs(v.y-s.lifted!.sieve.y)<55)){
    const p=s.lifted.sieve;refund(e,u);s.exposedUntil=b.teamEnds[0]+1;s.recovery=true;
    say(e,u,'체를 세느라 멈췄다 · 물건 회수','lure',undefined,p);
   }
  }
 }
 if(b.honroMonsterMist&&b.honroMonsterMist.until<=b.teamEnds[0])delete b.honroMonsterMist;
}
export function finishMonsterPatterns(e:Engine){
 if(!fresh(e.b))return;
 for(const u of e.b.units){
  refund(e,u);clearMonsterCondition(e,u);if(u.honroMonsterState?.merge)undoMerge(e,u);
  delete u.honroMonsterWindup;
 }
 delete e.b.honroMonsterMist;
}
export function validateMonsterPatterns(b:Battle){
 if(!fresh(b))return;
 const finite=(v?:Vec)=>v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=-200&&v.x<=b.width+200&&v.y>=-1800&&v.y<=b.height+200;
 const ids=(v:unknown)=>Array.isArray(v)&&v.length<=16&&v.every(id=>typeof id==='string');
 for(const u of b.units){
  const w=u.honroMonsterWindup;
  if(w&&(!validKind(w.kind)||w.kind!==variantPattern(u)||!finite(w.origin)||!finite(w.impact)||
    !Number.isFinite(w.damage)||w.damage<0||!Number.isFinite(w.radius)||w.radius<1||w.radius>365||
    w.shape!==rules[w.kind][3]&&!(w.kind==='naruWarden'&&w.shape==='area')&&!(w.kind==='bridgeWarden'&&w.shape==='lane')||!ids(w.offered)||!ids(w.answered)))delete u.honroMonsterWindup;
  if(u.honroMonsterGrowth&&![1,2,3].includes(u.honroMonsterGrowth))delete u.honroMonsterGrowth;
  if(u.honroMonsterCondition&&!b.units.some(v=>v.id===u.honroMonsterCondition?.source))delete u.honroMonsterCondition;
 }
}
