/** North admission boundary only. Initial completed release/opening narrative
 * receipts and initial party poses are explicit fixtures, not reached gameplay.
 * After App.launch no memory, HP, resources or coordinates are assigned. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {createCompactProject} from '../tools/map-forge/stage11-compact-project.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,project=createCompactProject(g,g.HONRO_PROJECT,'B-open'),stage=project.stages.find(s=>s.metadata.stageId===11),hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const geometry=g.HonroMaps.compile(stage,project);
for(const [i,u]of stage.units.filter(u=>u.team==='player').entries()){u.x=3900+i*80;u.y=g.HONRO_CORE.topAt(geometry.terrain.find(t=>t.id==='compact-floor'),u.x);}
const fixtureEvents=Object.fromEntries(['arrival','thread','approach','advance','low-beast','high-sightline','cover-guide','spirit-release'].map(id=>[id,{status:'done',ids:[],proof:{},fixture:true}]));
stage.initialState.honroState.act23v4={revision:1,done:{'11.thread':true},holds:{},events:{},checkpoints:[],slots:{},sceneDone:{},reviewed11:{revision:1,events:fixtureEvents,positions:{},ambient:{count:8,elapsed:0,distance:0}}};
g.HONRO_PROJECT=project;
let app=h.load(h.profileThrough(10));app.launch(11);h.finish(app);app.close();
const e=app.engine,b=e.b,S=g.HonroAct23V4Chapter11,V=g.HonroAct23V4,initial=plain(b),rows=[];
for(let i=0;i<120&&!S.memory(b).north.warned;i++){V.tick(app,.025);if(app.dialogue)h.finish(app);}
assert(S.memory(b).north.warned,'initial northern party fixture receives warning');
assert.equal(S.memory(b).north.ids.length,0,'warning alone creates no spirits');
for(let i=0;i<120;i++){V.tick(app,.025);if(app.dialogue)h.finish(app);S.tick(app,.025);if(Object.keys(S.memory(b).north.offered).length)break;}
const before=plain(S.memory(b).north),actor=e.active;
rows.push({phase:'before-response',active:actor?.id,canAct:e.canAct(),noncombatWalk:e.noncombatWalk(),offered:before.offered,ended:before.ended,ids:before.ids});
assert(Object.keys(before.offered).length,'real canAct opportunity must be observed');
assert.equal(before.ids.length,0);
e.wait();
const phaseAfterWait=b.phase;
let reviewTicks=0;
for(;reviewTicks<240&&!Object.keys(S.memory(b).north.ended).length;reviewTicks++){e.tick(g.HONRO_CORE.STEP);if(app.dialogue)h.finish(app);}
const ended=plain(S.memory(b).north.ended);
for(let i=0;i<120&&!S.memory(b).north.admitted;i++){if(app.dialogue)h.finish(app);S.tick(app,.025);}
const after=plain(S.memory(b).north),born=b.units.filter(u=>u.honroSpawnSource==='reviewed.11.north-pair');
rows.push({phase:'after-defend',phaseAfterWait,reviewTicks,ended,admitted:after.admitted,ids:after.ids,born:born.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))});
const result={scope:'Initial four northern poses and completed release/opening narrative receipts are a declared stage fixture. Actual App launch, observed canAct opportunity and Engine.wait/finishAction boundary, then physical admission. No post-launch memory/HP/resource/position edits; not normal travel or full-stage proof.',stageHash:hash(stage),physicalSourceHash:hash(await readFile('shared/runtime/act23-v4-ch11-scenes.js','utf8')),initialSnapshotHash:hash(initial),partyInitial:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.spawnX,y:u.spawnY})),populationCap:g.HonroEncounters.populationCap(b),rows,exactNorthPair:born.length===2&&new Set(born.map(u=>u.id)).size===2,responseEnded:Object.keys(ended).length>0,unverified:['Actual whole-stage release-to-north traversal with normal input','Action budgets/damage/difficulty','Browser play, saved warning boundary and deployment']};
await mkdir('_local/reports/act2-redesign-20261109/compact-north',{recursive:true});await writeFile('_local/reports/act2-redesign-20261109/compact-north/result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
assert.equal(result.responseEnded,true);assert.equal(result.exactNorthPair,true);assert.equal(result.populationCap,24);
