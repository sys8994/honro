import type {Engine} from './engine';
import type {Unit,Skill,Projectile} from './types';
import {passiveRank} from './progression';
import {SALHEUN_TURNS,SALHEUN_RATIO,JUCHEON_DISCOUNT,JUCHEON_EFFECT,JUCHEON_THRESHOLD} from './warriorData';
import {SKILLS} from './data';

export function jucheonBoost(u:Unit,s:Skill){const r=passiveRank(u,'MP05');return u.cls==='mage'&&r&&u.jucheonReady&&s.cls==='mage'&&s.cost>0?JUCHEON_EFFECT[r-1]:0;}
export function passiveCost(u:Unit,s:Skill,cost:number){
 if(jucheonBoost(u,s))cost*=1-JUCHEON_DISCOUNT[passiveRank(u,'MP05')-1];
 if(u.cls==='knight'&&u.harmony&&s.martial)cost*=.75;
 return Math.max(0,Math.round(cost));
}
/** Own action clock, including misses/wait; review and retreat must not age it twice. */
export function arrowTurn(e:Engine,u:Unit){
 if(u.side!==0||u.summoned||u.cls!=='archer')return;
 const token=`${e.b.round}:${e.b.teamEnds[0]}`;if(u.arrowTurnToken===token)return;
 u.arrowTurnToken=token;u.arrowTurn=(u.arrowTurn||0)+1;
 const r=passiveRank(u,'AP05'),keep=r?SALHEUN_TURNS[r-1]:0;
 for(const t of e.b.units){const h=t.salheun?.[u.id];if(!h)continue;h.entries=h.entries.filter(v=>u.arrowTurn!-v.turn<=keep);if(t.dead||!h.entries.length)delete t.salheun![u.id];}
}
export function recordSalheun(e:Engine,p:Projectile|undefined,u:Unit,t:Unit,actual:number,direct:boolean){
 const r=passiveRank(u,'AP05');
 if(!r||u.cls!=='archer'||u.summoned||t.side!==1||!p||!direct||p.followup||p.secondary||!SKILLS[p.skill]?.redesigned||SKILLS[p.skill].cls!=='archer'||actual<=0)return;
 const turn=u.arrowTurn||1;u.arrowTurn=turn;
 t.salheun??={};const h=t.salheun[u.id]??={entries:[],action:-1,recorded:0,cap:0,projectiles:[]};
 h.entries=h.entries.filter(v=>turn-v.turn<=SALHEUN_TURNS[r-1]);
 const first=h.action!==p.shot;
 if(first){h.action=p.shot;h.recorded=0;h.cap=Math.max(actual,p.rootDamage||p.damage)*1.5;h.projectiles=[];}
 // Snapshot past turns before recording this action. Echo has a separate source
 // and never re-enters projectile on-hit, critical, healing or history paths.
 const echo=first?h.entries.reduce((sum,v)=>{const age=turn-v.turn;return sum+(age>=1? v.damage*SALHEUN_RATIO[r-1]*Math.pow(.55,age-1):0);},0):0;
 const weight=h.projectiles.length===0?1:.35;
 if(!h.projectiles.includes(p.id)){
  h.projectiles.push(p.id);const eligible=Math.max(0,Math.min(actual*weight,h.cap-h.recorded));h.recorded+=eligible;
  let bucket=h.entries.find(v=>v.turn===turn);if(!bucket){bucket={turn,damage:0};h.entries.push(bucket);}bucket.damage+=eligible;
 }
 if(echo>0&&t.hp>0){t.salheunFlash=.22;e.emit('fx',{name:'inkLine',x:t.x-9,y:t.y-t.h*.55,x2:t.x+14,y2:t.y-t.h*.55-7,color:'#af8372',size:1.2});e.emit('sound',{name:'arrowhit'});e.hurt(t,echo,u.id,false,undefined,undefined,'salheun');}
 if(t.hp<=0)delete t.salheun;
}
export function beginPlayerCast(e:Engine,u:Unit,s:Skill,actualKiSpent:number){
 arrowTurn(e,u);
 const boost=jucheonBoost(u,s),r=passiveRank(u,'MP05');
 if(u.cls==='mage'&&r&&s.cls==='mage'&&s.cost>0){
  if(boost){u.jucheon=0;u.jucheonReady=false;}
  else if(actualKiSpent>0){u.jucheon=Math.min(JUCHEON_THRESHOLD[r-1],(u.jucheon||0)+actualKiSpent);if(u.jucheon>=JUCHEON_THRESHOLD[r-1]){u.jucheonReady=true;e.fx('circulation',u.x,u.y-u.h*.5,'#cbd8d2',u.h*.65);e.emit('sound',{name:'qiReflect'});e.message('주천완성 · 다음 도술 강화');}}
 }
 if(u.side===0&&u.cls==='knight'&&s.martial){
  const hadHarmony=!!u.harmony;u.harmony=false;
  const rank=passiveRank(u,'SP04');if(rank){
   u.swordChain??=[];if(!u.swordChain.includes(s.branch!))u.swordChain.push(s.branch!);
   if(u.swordChain.length===3){u.swordChain=[];u.harmony=true;u.focus=Math.min(u.maxFocus,u.focus+u.maxFocus*(.05+.00625*rank));u.martialGuard={round:e.b.round,reduction:.10};e.fx('text',u.x,u.y-u.h-18,'#cad4cd',16,'합세');e.emit('sound',{name:'sword'});}
  }
  return {effectBoost:0,harmony:hadHarmony};
 }
 return {effectBoost:boost,harmony:false};
}
export function cleanupPassiveHistory(e:Engine){for(const u of e.b.units){if(u.dead)delete u.salheun;if(['won','lost'].includes(e.b.phase)){delete u.salheun;delete u.arrowTurn;delete u.arrowTurnToken;u.jucheon=0;u.jucheonReady=false;}}}
