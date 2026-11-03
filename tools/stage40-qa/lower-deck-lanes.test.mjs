/** Isolated boss-phase formation on existing terrain. Ordinary foes are omitted
 * explicitly, so this does NOT prove arrival, full combat or stage completion. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
const {C,g,b}=await createFinale(),z=JSON.parse(JSON.stringify(b));z.units=z.units.filter(u=>u.side!==1||u.honroAct4FinaleBoss);
const poses={knight:[1935,3327.719143],mage:[2480,3600],archer:[2800,3600],occultist:[2260,3600]};
for(const u of z.units)if(poses[u.id])Object.assign(u,{x:poses[u.id][0],y:poses[u.id][1],vx:0,vy:0,jumping:false,airborne:false,acted:false});
const results=[];
for(const cls of ['mage','archer','occultist']){z.active=cls;z.side=0;z.phase='aim';const e=new C.Engine(JSON.parse(JSON.stringify(z)),()=>{},true),u=e.unit(cls),boss=e.b.units.find(v=>v.honroAct4FinaleBoss),contact=e.contactSurface(u.x,u.y-8,u.y+10);assert.equal(contact.t.id,'a4-return-deck');assert(g.HonroTerrain.separated(e.b,u,u.x,u.y,12),cls+' body overlap');let found;
 outer:for(const id of u.loadout){const s=C.SKILLS[id];if(s.passive||id==='O13')continue;for(const aim of e.shotSeeds(u,s,boss).slice(0,12)){const r=evaluateLegalCast(C,e.b,cls,id,aim.angle,aim.power);if(r.safe&&r.targets.includes(boss.id)&&r.enemyDamage>0){found={cls,skill:id,aim,damage:r.enemyDamage,friendly:r.friendlyDamage,targets:r.targets};break outer;}}}
 assert(found,cls+' no safe demonstrated lower-deck boss shot');results.push(found);console.log('FOUND',JSON.stringify(found));
}
const support=z.units.find(u=>u.id==='occultist');for(const [id]of Object.entries(poses)){const u=z.units.find(u=>u.id===id);assert(Math.hypot(u.x-support.x,u.y-support.y)<650,'support cannot cover '+id);}
console.log(JSON.stringify({scope:'Boss-phase posed formation, not arrival/play proof',results,supportRangeCoversFour:true},null,2));
