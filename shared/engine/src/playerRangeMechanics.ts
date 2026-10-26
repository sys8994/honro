import type {Engine} from './engine';
import type {Projectile} from './types';
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
