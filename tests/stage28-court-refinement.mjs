/** Local roof-loop fixtures using production Engine inputs; not combat. */
import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';import {followVerticalRoute} from './vertical-route-helpers.mjs';
import {applyStage28RecordCourt,court28Ground as ground} from '../tools/map-forge/stage28-record-court.mjs';
const g=await runtime({legacyMaps:false}),base=JSON.parse(await fs.readFile(process.argv[2]||'shared/data/campaign.json','utf8')),p=applyStage28RecordCourt(base),s=p.stages.find(s=>s.metadata.stageId===28),old=base.stages.find(s=>s.metadata.stageId===28),rows=[];
assert.deepEqual(p.stages.filter(s=>s.metadata.stageId!==28),base.stages.filter(s=>s.metadata.stageId!==28));
assert.deepEqual(s.markers,old.markers);assert.deepEqual(s.units,old.units);assert.deepEqual(s.events,old.events);assert.deepEqual(s.initialState,old.initialState);assert.deepEqual(applyStage28RecordCourt(p),p);
for(const cls of ['archer','mage','knight','occultist']){
 const b=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'}),e=new g.HONRO_CORE.Engine(b,()=>{},true),u=b.units.find(u=>u.side===0&&u.cls===cls),q={b,e};b.units=[u];b.queue=[u.id];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 const roof=(id,x)=>{const t=b.terrain.find(t=>t.honroElementId==='s28-'+id);assert(t?.oneWay);return{x,y:g.HONRO_CORE.topAt(t,x),support:t.id};};
 const run=(label,anchors)=>{Object.assign(u,{x:anchors[0].x,y:anchors[0].y,vx:0,vy:0,airborne:false,jumping:false});const r=followVerticalRoute(g,q,u,{anchors});assert(r.passed,JSON.stringify({cls,label,...r.failed}));rows.push({cls,label,...r});};
 const drop=id=>{const hp=u.hp;assert(e.drop());for(let n=0;n<700&&(!e.grounded(u)||u.platformDrop);n++)e.tick(1/120);assert.equal(e.contactSurface(u.x,u.y-2,u.y+2)?.t.id,id);assert.equal(u.hp,hp);};
 run('west-service-canopy',[{x:2450,y:ground(2450),jumpTo:{x:2450,y:2380,support:'s28-west-veranda'}},{x:2450,y:2380,jumpTo:roof('west-service-canopy',2450)},roof('west-service-canopy',2750)]);drop('s28-west-veranda');drop('a3-foundation');
 run('east-annex-roof',[{x:4510,y:ground(4510),jumpTo:roof('annex-west-awning',4510)},{...roof('annex-west-awning',4510),jumpTo:roof('east-record-annex-roof',4510)},roof('east-record-annex-roof',5020)]);drop('s28-annex-east-awning:collision:0');drop('s28-east-loading-veranda');drop('a3-foundation');
 run('court-hip-roof',[{x:3310,y:ground(3310),jumpTo:{x:3310,y:2220,support:'s28-roof-access-court-lower'}},{x:3310,y:2220,jumpTo:{x:3410,y:2050,support:'s28-roof-access-court-upper'}},{x:3410,y:2050,jumpTo:roof('raised-open-record-hall-roof',3410)},roof('raised-open-record-hall-roof',3760)]);drop('a3-foundation');
 assert(b.terrain.filter(t=>t.honroElementCollision).every(t=>t.oneWay));
}
await fs.mkdir('_local/reports/act3-rework-20261017/stage28',{recursive:true});await fs.writeFile('_local/reports/act3-rework-20261017/stage28/focused-checks.json',JSON.stringify({passed:true,scope:'Four bodies, finite ordinary move/jump/drop, isolated enemy-free local loops. Markers/units/events/initialState unchanged; no full combat claim.',rows},null,2));console.log('PASS Stage28 local canopy/annex/court roof loops and preserved objectives');
