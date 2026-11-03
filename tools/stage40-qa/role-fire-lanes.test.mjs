/** Synthetic simultaneous role poses, real authored terrain and enemies.
 * Proves candidate firing geometry, not arrival or natural-play acceptance. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
const {C,b}=await createFinale(),z=JSON.parse(JSON.stringify(b));
const poses={knight:[1218.776462,2766.112352],occultist:[1519.876763,2799.986136],archer:[2139.248259,2575.351144],mage:[2388.99288,2414.918761]};
for(const u of z.units)if(poses[u.id])Object.assign(u,{x:poses[u.id][0],y:poses[u.id][1],vx:0,vy:0,jumping:false,airborne:false,acted:false});
const results=[];
for(const cls of ['archer','mage']){z.active=cls;z.side=0;z.phase='aim';const e=new C.Engine(JSON.parse(JSON.stringify(z)),()=>{},true),u=e.unit(cls),targets=e.b.units.filter(v=>v.id.startsWith('final40-dock-right-'));let found;
 outer:for(const id of u.loadout){const s=C.SKILLS[id];if(s.passive)continue;for(const t of targets)for(const aim of e.shotSeeds(u,s,t).slice(0,8)){const r=evaluateLegalCast(C,e.b,cls,id,aim.angle,aim.power);if(r.safe&&r.enemyDamage>0&&r.targets.some(id=>id.startsWith('final40-dock-right-'))){found={cls,skill:id,aim,damage:r.enemyDamage,targets:r.targets};break outer;}}}
 assert(found,cls+' has no demonstrated safe cross-level firing lane');results.push(found);
}
console.log(JSON.stringify({scope:'Synthetic firing positions; not full gameplay',results},null,2));
