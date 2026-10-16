import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {applyStage28RecordCourt,court28Ground} from '../tools/map-forge/stage28-record-court.mjs';
import {drive} from './tactical-finite-driver.mjs';
const original=JSON.parse(execFileSync('git',['show','d7c1f8457dd33decda5481c7c3b57d8505f6f157:shared/data/campaign.json'],{maxBuffer:80*1024*1024}));
const current=JSON.parse(await readFile('shared/data/campaign.json'));
const authored=applyStage28RecordCourt(original),again=applyStage28RecordCourt(authored);
assert.deepEqual(again,authored,'author must be idempotent');
assert.deepEqual(current,JSON.parse(JSON.stringify(authored)),'checked-in campaign must equal dedicated author');
assert.deepEqual(current.stages.filter(s=>s.metadata.stageId!==28),original.stages.filter(s=>s.metadata.stageId!==28));
assert.deepEqual(current.stages[27].initialState.honroAct3Steps,original.stages[27].initialState.honroAct3Steps);
assert.deepEqual(current.stages[27].units.map(u=>[u.id,u.kind,u.team,u.stageOverrides?.honroAct3Elite]),original.stages[27].units.map(u=>[u.id,u.kind,u.team,u.stageOverrides?.honroAct3Elite]));
const g=await runtime({legacyMaps:false}),A=g.HonroAct3,rows=[];
assert.equal(g.HONRO_PROJECT.stages[27].initialState.honroRecordCourtRevision,1);
const runtimeMap=g.HONRO_PROJECT.stages[27];assert.equal(runtimeMap.initialState.honroAct3Steps.find(q=>q.id==='closure-order').kind,'evidence');assert.equal(runtimeMap.initialState.honroAct3Steps.find(q=>q.id==='suppression-order').kind,'evidence');
for(const cls of ['archer','mage','knight','occultist']){
 const q=battlefield(g,28),{b,e,app}=q;app.actorBoundary={};
 // Explicit enemy-free geometry probe, not a normal resource combat claim.
 b.units=b.units.filter(u=>u.side===0);e.checkEnd=()=>false;A.attach(app,e);
 for(const [who,id]of [['knight','fire-screen'],['archer','water-release']]){
  const u=e.heroesAlive().find(u=>u.cls===who),m=A.marker(b,id),r=drive(g,q,u,[{x:m.x,y:m.y}],{jump:true,strictPose:false});assert(r.passed,JSON.stringify(r.failure));e.select(u.id);assert(A.use(app,m),'actual fire control interaction '+id);
 }
 const u=e.heroesAlive().find(u=>u.cls===cls),xs=cls==='archer'||cls==='mage'?[6040,5570,5140,4540,4180,3500]:[1120,1860,2040,2540,3020,3400,3500];
 const route=drive(g,q,u,xs.map(x=>({x,y:court28Ground(x)})),{jump:true,automaticDrop:true,strictPose:false});assert(route.passed,JSON.stringify(route.failure));rows.push({cls,route});
 for(const def of runtimeMap.design.act3.optionalRoutes){const points=def.points;const to=drive(g,q,u,[{x:points[0].x,y:court28Ground(points[0].x)},...points,...points.slice().reverse()],{jump:true,automaticDrop:true,strictPose:false});assert(to.passed,JSON.stringify(to.failure));rows.push({cls,optional:def.id,result:to});}
}
// Fire deadline remains twelve enemy ends and cannot be reset by repeated ticks.
{const q=battlefield(g,28);A.initialize(q.b);q.app.actorBoundary={};A.tick(q.app,0);q.b.teamEnds[1]=11;A.tick(q.app,0);assert.equal(A.failure(q.b),null);q.b.teamEnds[1]=12;A.tick(q.app,0);assert.match(A.failure(q.b),/불길/);}
await mkdir('review/stage28',{recursive:true});await writeFile('review/stage28/contracts.json',JSON.stringify({scope:'Author isolation/idempotence and actual finite movement with enemies removed; not normal combat. Fire deadline fixture.',passed:true,rows},null,2));console.log('PASS Stage28 author scope, preserved objective/roster, finite four-body control/meeting/veranda round trips and 12-turn deadline');
