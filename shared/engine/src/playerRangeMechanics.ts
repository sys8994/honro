import type {Engine,Prediction} from './engine';
import type {Battle,Projectile,Skill,Unit,Vec} from './types';
import {STEP} from './math';
import {playerRangeApplies} from './playerRange';
import {convergeAt} from './occultMechanics';

/** Terminal effects reuse ordinary damage/collision rules. No extra damage for
 * arrow children, and O05 divides its existing burst inside returningWraith. */
export function endPlayerFlight(e:Engine,p:Projectile){
 if(p.mode==='summonBolt'){e.remove(p);return true;}
 if(p.mode==='reverseGhost'||p.mode==='convergeSpirit')return false;
 if(p.mode==='spiritConverge'){convergeAt(e,p);return true;}
 if(p.skill[0]==='O'){
  if(p.mode.startsWith('summon'))e.impact(p,{x:p.x,y:p.y,t:0,n:{x:0,y:-1}});
  else {e.blast(p.x,p.y,p.blast,p.damage,p.owner,false,p);e.remove(p);}
 }else e.remove(p);
 return true;
}

/** Finite soul flights and their saved budgets use live steps for the guide,
 * rather than a second approximation of their new airburst/return lifecycle. */
export function playerRangePrediction(e:Engine,u:Unit,s:Skill,angle:number,power:number,ignoreUnits=false,target?:Unit):Prediction|null{
 if(e.rangePredicting||s.cls!=='occultist'||!playerRangeApplies(u,s))return null;
 const b=structuredClone(e.b),Sim=e.constructor as new(b:Battle)=>Engine,sim=new Sim(b),actor=sim.unit(u.id)!;
 sim.rangePredicting=true;
 Object.assign(b,{active:u.id,phase:'aim',side:0,projectiles:[],volley:undefined});
 Object.assign(actor,{loadout:[s.id],focus:10000,maxFocus:10000,cooldowns:{},acted:false,airborne:false});
 if(ignoreUnits)b.units=b.units.filter(v=>v.id===actor.id);
 sim.grounded=()=>true;sim.canAct=()=>true;sim.fire(s.id,angle,power);
 let unit:string|undefined,terrain:string|undefined,closest=99999;
 const impact=sim.impact.bind(sim);sim.impact=(p,h)=>{if(h.unit)unit=h.unit.id;if(h.terrain)terrain=h.terrain.id;return impact(p,h);};
 const collision=sim.projectileCollision.bind(sim);sim.projectileCollision=(...args)=>{const h=collision(...args);if(h?.terrain)terrain=h.terrain.id;return h;};
 const p=b.projectiles[0],points:Vec[]=[];if(!p)return{points,x:u.x,y:u.y,closest:99999};
 let apex:Vec|undefined;
 for(let i=0;i<1460&&b.projectiles.includes(p);i++){
  sim.stepProjectile(p,STEP);if(target)closest=Math.min(closest,Math.hypot(p.x-target.x,p.y-target.y+target.h*.5));if(!apex&&p.apex)apex={x:p.x,y:p.apexY??p.y};
  if(i%3===0||!b.projectiles.includes(p)||p.wraithState==='manifest')points.push({x:p.x,y:p.y});
  if(p.wraithState==='manifest')break;
 }
 return{points,x:p.x,y:p.y,closest,apex,unit,terrain};
}
