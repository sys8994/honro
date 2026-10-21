/** Actual projectile integration through the revised quarry. Isolated supported
 * shooter setup; not a normal combat completion or movement check. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const profile=JSON.parse(await readFile(process.env.HONRO_STAGE12_PROFILE||'/tmp/stage12-v3/entry-profile.json','utf8')).profile;
function setup(support,x){const q=battlefield(g,12,{profile:structuredClone(profile)}),u=q.e.heroesAlive().find(u=>u.cls==='archer');Object.assign(u,{x,y:C.topAt(q.b.terrain.find(t=>t.id===support),x),vx:0,vy:0});q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.b.units=q.b.units.filter(v=>v===u||v.side===1);q.e.checkEnd=()=>false;assert(C.validTerrainContactPose(q.b.terrain,u));return{...q,u};}
function integrate(q,aim){const before=new Map(q.b.units.map(u=>[u.id,u.hp])),contacts=[],impact=q.e.impact.bind(q.e);q.e.impact=(p,hit)=>{contacts.push({terrain:hit.terrain?.id,unit:hit.unit?.id,x:hit.x,y:hit.y});return impact(p,hit);};assert(q.e.fire('A01',aim.angle,aim.power));for(let f=0;f<1800&&q.b.projectiles.length;f++)for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p))q.e.stepProjectile(p,C.STEP);return{aim,contacts,damage:q.b.units.filter(u=>before.get(u.id)>u.hp).map(u=>({id:u.id,damage:before.get(u.id)-u.hp}))};}
for(const [support,x,targetId]of [['sq-lower-ground',5900,'sq-f7'],['sq-back-road',7600,'sq-g2'],['sq-west-quarry',4500,'sq-c1'],['sq-north-quarry',7000,'sq-b1']]){
 const q=setup(support,x),target=q.e.unit(targetId);let aim;
 for(const a of q.e.shotSeeds(q.u,C.SKILLS.A01,target))if(q.e.predict(q.u,C.SKILLS.A01,a.angle,a.power,target,false).unit===target.id){aim=a;break;}
 if(!aim){for(let angle=-60;angle<=240&&!aim;angle+=4)for(const power of [.15,.3,.45,.6,.8,1])if(q.e.predict(q.u,C.SKILLS.A01,angle,power,target,false).unit===target.id){aim={angle,power};break;}}
 assert(aim,support+' has a real shot to '+targetId);const shot=integrate(q,aim);assert(shot.damage.some(d=>d.id===targetId&&d.damage>0));rows.push({support,x,y:q.u.y,target:targetId,...shot});
}
const q=setup('sq-back-road',7600),ceiling=integrate(q,{angle:90,power:.35});assert(ceiling.contacts.some(c=>c.terrain==='sq-north-quarry'),'Changed north underside blocks the real upward projectile');rows.push({support:'sq-back-road',x:7600,kind:'north underside solid',...ceiling});
await mkdir('/tmp/stage12-v3/checks',{recursive:true});await writeFile('/tmp/stage12-v3/checks/shots.json',JSON.stringify({pass:true,scope:'Isolated real projectiles; supported setup, other heroes removed; genuine11 ranks/loadout. No resources added, no enemy removed, no normal-combat claim.',rows},null,2));console.log('PASS four real damage lines and revised underside collision');
