/** Initial full-body/8s idle contracts. Not a normal-play or art approval. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage22Vertical,V22_GROUPS} from '../tools/map-forge/apply-stage22-vertical.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),g=await runtime({legacyMaps:false});
if(!g.HonroStage22Vertical)vm.runInContext(await readFile('shared/runtime/stage22-vertical.js','utf8'),g);
const oldStage=JSON.parse(await readFile('tests/fixtures/vertical-stages/before-stages.json','utf8')).stages.find(s=>s.metadata.stageId===22);
assert(oldStage&&!oldStage.initialState.honroVerticalStage22Revision,'Explicit immutable horizontal22 fixture');
assert.equal(oldStage.units.filter(u=>u.team==='enemy').length,20);
const C=g.HONRO_CORE,base=g.HONRO_PROJECT,p=await authorStage22Vertical(base,g),s=p.stages[21],rows=[];
// Do not normalize a broken canonical input by reauthoring it before checking.
// Art is deliberately separate; every actual gameplay field must round-trip.
const gameplayKeys=['terrains','units','markers','routes','events','initialState','encounters','anchors','width','height','camera','terrainBounds','playBounds','terrainDomainVersion','materials','objectives'];
function canonicalExact(raw){for(const key of gameplayKeys)assert.deepEqual(plain(raw[key]??null),plain(s[key]??null),'Raw canonical vs author gameplay '+key);}
canonicalExact(base.stages[21]);
for(const [id,mutate] of [['enemy-pose',s=>s.units.find(u=>u.team==='enemy').x++],['activation-radius',s=>s.initialState.honroVerticalStage22Activation['register-rise'].radius++],['entry-pose',s=>s.initialState.honroVerticalStage22Spec.entries['act3-response-22-0'].members[0].x++]]){const corrupt=plain(base.stages[21]);mutate(corrupt);assert.throws(()=>canonicalExact(corrupt),'Canonical corruption must not be normalized: '+id);}
assert.equal(JSON.stringify(p.stages.filter(s=>s.metadata.stageId!==22)),JSON.stringify(base.stages.filter(s=>s.metadata.stageId!==22)));
assert.deepEqual(plain(await authorStage22Vertical(p,g)),plain(p),'Idempotent encounter author');
assert.deepEqual(plain(s.initialState.honroAct3Steps),plain(oldStage.initialState.honroAct3Steps));
assert.equal(s.units.filter(u=>u.team==='enemy').length,26);assert.equal(s.units.filter(u=>u.stageOverrides?.honroAct3Elite).length,6);
assert.equal(g.HonroSpaceLayout.validate(s).length,0);assert.equal(g.HonroTerrainDomain.validate(s).length,0);
assert.equal(s.initialState.honroActiveLimit,3);assert.equal(s.initialState.honroVerticalStage22PopulationCap,35);
assert.equal(s.events.reduce((n,e)=>n+e.action.n,0),7);
for(const ev of s.events){const old=oldStage.events.find(e=>e.id===ev.id);for(const key of ['id','once','when'])assert.deepEqual(plain(ev[key]),plain(old[key]));for(const key of ['type','kind','n','source','act3Authored','elite'])assert.equal(ev.action[key],old.action[key]);assert.deepEqual([ev.entry.x,ev.entry.y],[ev.action.x,ev.action.y]);assert.notDeepEqual([ev.action.x,ev.action.y],[old.action.x,old.action.y]);assert(ev.action.support.startsWith('v22-'));}
for(const difficulty of Object.keys(C.DIFFICULTIES)){
 const profile=C.defaults();profile.recruited=['archer','mage','knight','occultist'];profile.settings.difficulty=difficulty;for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(22).entryLevel);
 const b=g.HonroMaps.createBattle(s,p,profile),raw=JSON.stringify(b.units.map(u=>[u.id,u.x,u.y,u.hp])),actors=plain(b.units);g.HonroStageRules.sanitizeStageBattle(b);assert.equal(JSON.stringify(b.units.map(u=>[u.id,u.x,u.y,u.hp])),raw,'No silent pose repair');const e=new C.Engine(b,()=>{},true);
 for(let n=0;n<960;n++)e.tick(C.STEP);
 for(const u of b.units){const a=actors.find(v=>v.id===u.id);assert.equal(u.hp,a.hp,'Idle HP '+u.id);assert(Math.hypot(u.x-a.x,u.y-a.y)<.01,'Idle position '+u.id);assert(C.validTerrainContactPose(b.terrain,u),'Ground contact '+u.id);assert.equal(g.HonroStage8Bier.terrainBlockers(e,u).length,0,'Full body '+u.id);}
 for(const[i,u]of b.units.entries())for(const v of b.units.slice(i+1))assert(!(Math.abs(u.x-v.x)<u.r+v.r+5&&u.y-u.h<v.y&&u.y>v.y-v.h),'Body overlap '+u.id+'/'+v.id);
 assert.equal(e.alive(1).filter(u=>u.elite).length,6);assert.equal(g.HonroEncounters.populationCap(b),35);assert.equal(b.enemyLimit,3);assert.equal(b.honroGrowth.limit.combat,g.HonroProgression.budget(22).combat);assert(Math.abs(b.honroGrowth.weight-(26+6*.6+7+2*.8))<1e-9);
 const app={engine:e,stage:g.HONRO_CONTENT.stages[21]},entries=[];for(const[source,at]of Object.entries(b.honroVerticalStage22Spec.entries)){const n=at.members.length,action={source,n,kind:at.members[0].kind};for(const[choice,q]of [at,...at.alternates].entries()){const before=JSON.stringify(b);assert(g.HonroStage22Vertical.formation(app,action,q),'Full formation '+source+'/'+choice);assert.equal(JSON.stringify(b),before,'Pure preflight '+source);entries.push({source,choice,n,air:q.members.every(m=>m.air),supported:true});}}
 rows.push({difficulty,actors:b.units.length,initial:26,elites:6,populationCap:35,enemyLimit:3,idleSeconds:8,weight:b.honroGrowth.weight,combatBudget:b.honroGrowth.limit.combat,entries});
}
const dir=process.argv.find(a=>a.startsWith('--out-dir='))?.slice(10)||'_local/reports/vertical-stages';await mkdir(dir,{recursive:true});await writeFile(dir+'/stage22-composition.json',JSON.stringify({passed:true,scope:'Full authored initial roster, exact compilation, all-difficulty idle and pure finite-entry body probes. No actual tactical or normal-play proof.',groups:V22_GROUPS.map(g=>({id:g.id,count:g.members.length,purpose:g.purpose})),rows},null,2)+'\n');console.log('PASS Stage22 composition',rows.map(({entries,...r})=>r));
