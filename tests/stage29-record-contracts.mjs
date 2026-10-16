import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage29Record} from '../tools/map-forge/stage29-record-court.mjs';
import {drive,isolate} from './tactical-finite-driver.mjs';
const g=await runtime({legacyMaps:false}),p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),base=JSON.parse(execFileSync('git',['show','d7c1f8457dd33decda5481c7c3b57d8505f6f157:shared/data/campaign.json'],{maxBuffer:60e6})),s=p.stages[28],old=base.stages[28],rows=[];
assert.equal(JSON.stringify(p.stages.filter(t=>t.metadata.stageId!==29)),JSON.stringify(base.stages.filter(t=>t.metadata.stageId!==29)));
assert.equal(JSON.stringify(authorStage29Record(g,p)),JSON.stringify(p),'Idempotent author');
for(const k of ['honroAct3Steps','honroRouteSpec','honroObjectiveRevision','honroStoryCanonRevision'])assert.deepEqual(s.initialState[k],old.initialState[k],k);
assert.deepEqual(s.units.map(u=>[u.id,u.kind,u.team,u.stageOverrides?.honroAct3Elite]),old.units.map(u=>[u.id,u.kind,u.team,u.stageOverrides?.honroAct3Elite]));
assert.deepEqual(s.events.map(v=>[v.id,v.once,v.when,v.action.kind,v.action.n]),old.events.map(v=>[v.id,v.once,v.when,v.action.kind,v.action.n]));
assert(!g.HONRO_PROJECT.stages[28].terrains.some(t=>t.id.startsWith('quest-upper-sluice')),'Build must not reinsert obsolete ramps');
const natural=battlefield(g,29);const before=natural.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}));for(let i=0;i<240;i++)natural.e.tick(g.HONRO_CORE.STEP);for(const row of before){const u=natural.b.units.find(v=>v.id===row.id);assert.equal(u.hp,row.hp,'Initial pose cannot damage '+row.id);assert(Math.abs(u.y-row.y)<4,'Grounding '+row.id+' '+u.y+'/'+row.y);}
rows.push({case:'source isolation, goals/rosters/waves, idempotence, fresh build, initial natural grounding',passed:true});
for(const cls of ['archer','mage','knight','occultist'])for(const route of ['A','B']){const q=battlefield(g,29),u=isolate(q,cls);q.b.terrain.find(t=>t.id==='old-door').broken=true; // Explicit open-door geometry fixture, NOT quest/normal combat proof.
 const common=s.design.act3.requiredRoute,branch=s.design.questRoutes.traversal[route];const points=[...common,...branch,...branch.slice().reverse().map(({jumpTo,...p})=>p),...common.slice().reverse()];
 const r=drive(g,q,u,points,{automaticDrop:true,label:route});rows.push({case:cls+' route '+route+' round trip',scope:'Enemy-free open-door finite-budget geometry isolation, not normal completion',...r});console.log(cls,route,r.passed,r.failure?.message);}
await writeFile('review/stage29/contracts.json',JSON.stringify({passed:rows.every(r=>r.passed),rows},null,2));assert(rows.every(r=>r.passed),'Route failures recorded');
