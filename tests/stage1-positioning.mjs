import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {drive,isolate} from './tactical-finite-driver.mjs';
const g=await runtime({legacyMaps:false}),rows=[];
for(const route of ['upper','lower']){
 const q=battlefield(g,1),u=isolate(q,'archer');
 const entrance=[{x:690,jumpTo:{x:930}}];
 const pts=route==='upper'?[{x:1060,jumpTo:{x:1120,support:'pine-branch-west'}},{x:1620},{x:1950},{x:1950,drop:true},{x:2150}]:[{x:1100,drop:true},{x:1350,support:'forest-floor'},{x:1800,support:'forest-floor'},{x:2150,support:'forest-floor'}];
 const result=drive(g,q,u,[...entrance,...pts],{label:route,strictPose:true});rows.push(result);console.log(route,result.passed,result.failure,result.poses);
}
await mkdir('_local/reports/stage1-positioning',{recursive:true});await writeFile('_local/reports/stage1-positioning/routes.json',JSON.stringify(rows,null,2));assert(rows.every(r=>r.passed));
// Source preservation: compare the exact deployed compiled project, not a rewritten golden.
const {readFile}=await import('node:fs/promises');
if(process.env.HONRO_BASELINE){const baseline=JSON.parse(await readFile(process.env.HONRO_BASELINE,'utf8')),plain=x=>JSON.parse(JSON.stringify(x));assert.deepEqual(plain(g.HONRO_PROJECT.library),baseline.library);assert.deepEqual(plain(g.HONRO_PROJECT.stages.slice(1)),baseline.stages.slice(1));console.log('PASS other 29 chapters and shared library unchanged');}
const shots=[];
for(const [support,x]of [['forest-floor',1180],['pine-branch-west',1620]]){
 const q=battlefield(g,1),u=q.e.active,t=q.b.terrain.find(t=>t.id===support);Object.assign(u,{x,y:g.HONRO_CORE.topAt(t,x),vx:0,vy:0});assert(g.HONRO_CORE.validTerrainContactPose(q.b.terrain,u));
 let chosen;outer:for(const enemy of q.e.alive(1))for(const a of q.e.shotSeeds(u,g.HONRO_CORE.SKILLS.A01,enemy))if(q.e.predict(u,g.HONRO_CORE.SKILLS.A01,a.angle,a.power,enemy,false).unit===enemy.id){chosen={enemy,a};break outer;}
 assert(chosen,support+' basic arrow angle');const hp=chosen.enemy.hp;assert(q.e.fire('A01',chosen.a.angle,chosen.a.power));for(let i=0;i<1800&&q.b.projectiles.length;i++)for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p))q.e.stepProjectile(p,g.HONRO_CORE.STEP);
 assert(chosen.enemy.hp<hp);shots.push({support,x,target:chosen.enemy.id,damage:hp-chosen.enemy.hp,aim:chosen.a});
}
await writeFile('_local/reports/stage1-positioning/shots.json',JSON.stringify({scope:'Prepared supported positions, real basic-arrow projectiles; not a full combat completion',shots},null,2));console.log('PASS actual lower/upper arrows',shots);
