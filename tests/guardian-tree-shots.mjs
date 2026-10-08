// Real projectiles across the new stage10 boughs with all terrain retained.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
for(const cls of ['archer','mage'])for(const direction of ['up','down']){
 const {b,e}=battlefield(g,10),top=b.terrain.find(t=>t.id==='altar-platform'),ground=b.terrain.find(t=>t.id==='outer-yard'),high={x:2800,y:C.topAt(top,2800)},low={x:2960,y:C.topAt(ground,2960)},u=C.makeUnit(cls,0,0,0,{id:'guardian-shooter'}),target=C.makeUnit('knight',1,0,0,{id:'guardian-target'});
 Object.assign(u,direction==='up'?low:high);Object.assign(target,direction==='up'?high:low);b.units=[u,target];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;assert(e.grounded(u));assert(e.grounded(target));const skill=C.SKILLS[C.baseSkill(cls)],before=target.hp;
 let aim=e.shotSeeds(u,skill,target).find(a=>e.predict(u,skill,a.angle,a.power,target,false).unit===target.id);
 if(!aim)outer:for(const power of [.2,.35,.5,.65,.8,1])for(let angle=-85;angle<=265;angle+=2)if(e.predict(u,skill,angle,power,target,false).unit===target.id){aim={angle,power};break outer;}
 assert(aim,cls+'/'+direction+' clear bough firing lane');assert(e.fire(skill.id,aim.angle,aim.power));for(let frame=0;frame<1800&&b.projectiles.length;frame++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 assert(target.hp<before,cls+'/'+direction+' live projectile damages supported target');rows.push({cls,direction,aim,damage:before-target.hp,high,low});
}
const {b}=battlefield(g,10);for(const [id,x]of [['altar-step-1',2300],['altar-step-2',2730],['altar-step-3',2180],['altar-platform',2800]]){const t=b.terrain.find(t=>t.id===id),y=C.topAt(t,x),below={x,y:y+40},above={x,y:y-40};assert.equal(C.segmentProjectileTerrain(below,above,t,3),null,id+' upward projectile passage');assert(C.segmentProjectileTerrain(above,below,t,3),id+' downward projectile top collision');}
await mkdir('_local/reports/guardian-tree',{recursive:true});await writeFile('_local/reports/guardian-tree/shots.json',JSON.stringify({rows,allFourTopOnlySurfaces:true,limits:['Isolated live-projectile fixtures, not normal combat clear']},null,2)+'\n');console.log('PASS four actual high/low arrow/qi shots and all four new bough top-only projectile contacts');
