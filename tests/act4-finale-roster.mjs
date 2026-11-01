/** Initial placement/mechanics fixtures only; not whole-stage acceptance. */
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {applyAct4EncounterRevision} from '../shared/act4-encounter-revision.mjs';import {runtime} from '../game/tests/helpers.mjs';import {loadPilotRuntime} from '../tools/stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const original=JSON.parse(await readFile('shared/data/act4/world.json')),p=applyAct4EncounterRevision(original),s=p.stages.find(s=>s.metadata.stageId===40),old=original.stages.find(s=>s.metadata.stageId===40);
assert.deepEqual(s.terrains,old.terrains);assert.deepEqual(s.units.filter(u=>u.team!=='enemy'),old.units.filter(u=>u.team!=='enemy'));assert.deepEqual(s.design.act4.geometry40.boardingRoutes,old.design.act4.geometry40.boardingRoutes);assert.deepEqual(s.design.act4.escort,old.design.act4.escort);assert.equal(s.design.act4.tide.low-s.design.act4.tide.high,350);
const g=await runtime({legacyMaps:false,productionStory:true});await loadPilotRuntime(g);const profile=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(profile);const b=g.HonroMaps.createBattle(s,p,profile,{origin:'campaign'}),e=new g.HONRO_CORE.Engine(b,()=>{},true);g.HonroAct4PilotCombat.attach({engine:e});
const enemies=b.units.filter(u=>u.side===1),boss=enemies.filter(u=>u.boss),minis=enemies.filter(u=>u.honroMidboss);assert.equal(enemies.length,42);assert.equal(new Set(enemies.map(u=>u.id)).size,42);assert.equal(boss.length,1);assert.equal(minis.length,2);assert.equal(b.enemyLimit,6);assert(g.HonroAct4PilotCombat.finale(b,boss[0]));assert.equal(boss[0].honroPilotBudgetBasis.hits,10);
const positions=new Map(enemies.map(u=>[u.id,{x:u.x,y:u.y,hp:u.hp}]));for(let i=0;i<120;i++)e.tick(g.HONRO_CORE.STEP);
const rows=enemies.map(u=>({id:u.id,x:u.x,y:u.y,drift:Math.hypot(u.x-positions.get(u.id).x,u.y-positions.get(u.id).y),hp:u.hp,startHp:positions.get(u.id).hp,grounded:e.grounded(u),separated:g.HonroTerrain.separated(b,u,u.x,u.y,12)}));
await mkdir('_local/reports/act4-finale',{recursive:true});await writeFile('_local/reports/act4-finale/placement.json',JSON.stringify(rows,null,2));
for(const row of rows){assert(row.drift<12,'Initial drift '+JSON.stringify(row));assert.equal(row.hp,row.startHp);assert(row.grounded,'Unsupported '+row.id);assert(row.separated,'Initial overlap '+row.id);}
console.log('PASS42 unique actors,1major/2minis,protected terrain/residents and native initial placement; no full-play claim');

// Controlled native attack fixture: do not count injected observation receipts
// as real UI visibility or a normal player run.
const actor=boss[0],P=g.HonroAct4PilotCombat,target=b.units.find(u=>u.side===0);Object.assign(target,{x:actor.x-210,y:actor.y,vx:0,vy:0});
for(const [cycle,skill]of [[0,'HWD01'],[1,'HWD02']]){
 Object.assign(b,{active:actor.id,side:1,phase:'enemy',queue:[actor.id],projectiles:[]});actor.acted=false;delete actor.aiMove;delete actor.moveTarget;
 Object.assign(P.memory(actor),{phase:'guard',cycles:cycle});P.action(e);assert.equal(P.memory(actor).phase,'telegraph');
 const t=P.memory(actor).target;assert(t);P.action(e);assert.equal(b.projectiles.length,0,'Unseen warning cannot attack');
 Object.assign(t,{seen:true,seenTeamEnd:b.teamEnds?.[0]||0,response:{id:target.id}});b.teamEnds??=[0,0];b.teamEnds[0]++;
 actor.acted=false;P.action(e);assert(b.projectiles.some(p=>p.skill===skill),'Actual native boss pattern '+skill);assert.equal(actor.honroMidboss,false);
}
console.log('PASS two actual native boss casts and unseen-warning refusal; observation receipts injected only for fixture');
