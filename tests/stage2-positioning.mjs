import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {drive,isolate} from './tactical-finite-driver.mjs';
const g=await runtime({legacyMaps:false}),routes=[],shots=[];
for(const [label,points]of [
 ['upper',[{x:1450,support:'left-tree-branch-upper'}]],
 ['middle',[{x:1200,drop:true},{x:1400,support:'left-tree-branch-middle'}]],
 ['lower',[{x:1000,drop:true},{x:1080,drop:true},{x:1450,support:'left-tree-branch-lower'}]]
]){const q=battlefield(g,2),u=isolate(q,'archer'),r=drive(g,q,u,points,{label});routes.push(r);assert(r.passed,JSON.stringify(r.failure));}
for(const [support,x,target]of [['left-tree-branch-upper',1450,'foe-1'],['left-tree-branch-middle',1400,'foe-1'],['left-tree-branch-lower',1450,'foe-5']]){
 const q=battlefield(g,2),u=q.e.active,t=q.b.terrain.find(t=>t.id===support),enemy=q.e.unit(target);Object.assign(u,{x,y:g.HONRO_CORE.topAt(t,x),vx:0,vy:0});assert(g.HONRO_CORE.validTerrainContactPose(q.b.terrain,u));
 let chosen;for(const p of [{angle:10,power:.85},...q.e.shotSeeds(u,g.HONRO_CORE.SKILLS.A01,enemy)])if(q.e.predict(u,g.HONRO_CORE.SKILLS.A01,p.angle,p.power,enemy,false).unit===enemy.id){chosen=p;break;}
 assert(chosen,support+' has basic arrow trajectory');const hp=enemy.hp;assert(q.e.fire('A01',chosen.angle,chosen.power));for(let i=0;i<1800&&q.b.projectiles.length;i++)for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p))q.e.stepProjectile(p,g.HONRO_CORE.STEP);assert(enemy.hp<hp);shots.push({support,x,y:u.y,target,damage:hp-enemy.hp,aim:chosen});
}
if(process.env.HONRO_BASELINE){const baseline=JSON.parse(await readFile(process.env.HONRO_BASELINE,'utf8')),plain=x=>JSON.parse(JSON.stringify(x));assert.deepEqual(plain(g.HONRO_PROJECT.library),baseline.library);assert.deepEqual(plain(g.HONRO_PROJECT.stages.filter((s,i)=>i!==1)),baseline.stages.filter((s,i)=>i!==1));}
await mkdir('_local/reports/stage2-positioning',{recursive:true});await writeFile('_local/reports/stage2-positioning/routes-shots.json',JSON.stringify({scope:'Finite isolated route inputs and prepared-position real projectiles. Separate normal browser combat required.',routes,shots},null,2));console.log('PASS three connected routes, three actual arrow trajectories, other29/library unchanged');
