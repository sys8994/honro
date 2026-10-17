/** Focused fresh-map geometry fixture, not combat or full campaign verification. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {followVerticalRoute} from './vertical-route-helpers.mjs';
import {authorFamily24,ground} from '../tools/map-forge/stage24-family-compound.mjs';
const g=await runtime({legacyMaps:false}),base=JSON.parse(await fs.readFile('shared/data/campaign.json','utf8'));
const p=process.argv[2]?JSON.parse(await fs.readFile(process.argv[2],'utf8')):JSON.parse(JSON.stringify(authorFamily24(base,g))),s=p.stages.find(s=>s.metadata.stageId===24),old=base.stages.find(s=>s.metadata.stageId===24),rows=[];
assert.deepEqual(s.initialState.honroAct3Steps,old.initialState.honroAct3Steps);
assert.deepEqual(s.markers,old.markers);assert.deepEqual(s.units,old.units);
assert.deepEqual(s.events,old.events);assert.deepEqual(p.stages.filter(s=>s.metadata.stageId!==24),base.stages.filter(s=>s.metadata.stageId!==24));
for(const cls of ['archer','mage','knight','occultist']){
 const b=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'}),e=new g.HONRO_CORE.Engine(b,()=>{},true),u=b.units.find(u=>u.side===0&&u.cls===cls),q={b,e};b.units=[u];b.queue=[u.id];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 const roof=(id,x)=>{const t=b.terrain.find(t=>t.honroElementId===id);return{x,y:g.HONRO_CORE.topAt(t,x),support:t.id};};
 const run=(label,anchors)=>{Object.assign(u,{x:anchors[0].x,y:anchors[0].y,vx:0,vy:0,airborne:false,jumping:false});const r=followVerticalRoute(g,q,u,{anchors});assert(r.passed,JSON.stringify({cls,label,...r.failed}));rows.push({cls,label,...r});};
 run('hall-local-roof',[{x:1740,y:ground(1740),jumpTo:{x:1740,y:2350,support:'family24-hall-west-step'}},{x:1740,y:2350,jumpTo:roof('ancestral-family-hall',1740)},roof('ancestral-family-hall',2500),{...roof('ancestral-family-hall',2500),jumpTo:roof('ancestral-family-hall',2600)}]);
 assert(e.drop());for(let n=0;n<700&&(!e.grounded(u)||u.platformDrop);n++)e.tick(1/120);assert.equal(e.contactSurface(u.x,u.y-2,u.y+2).t.id,'hall-east-side-wing:collision:0');assert(e.drop());for(let n=0;n<700&&(!e.grounded(u)||u.platformDrop);n++)e.tick(1/120);assert.equal(e.contactSurface(u.x,u.y-2,u.y+2).t.id,'family24-hall-east-step');
 run('shrine-local-roof',[{x:4550,y:ground(4550),jumpTo:{x:4560,y:2205,support:'family24-shrine-west-porch'}},{x:4560,y:2205,jumpTo:roof('family-ancestral-shrine',4650)},roof('family-ancestral-shrine',5195)]);
 assert(e.drop());for(let n=0;n<700&&(!e.grounded(u)||u.platformDrop);n++)e.tick(1/120);assert.equal(e.contactSurface(u.x,u.y-2,u.y+2).t.id,'family24-shrine-east-porch');assert(e.drop());for(let n=0;n<700&&(!e.grounded(u)||u.platformDrop);n++)e.tick(1/120);assert.equal(e.contactSurface(u.x,u.y-2,u.y+2).t.id,'a3-foundation');
 run('garden-gallery',[{x:2820,y:ground(2820),jumpTo:{x:2890,y:2440+30*70/260,support:'family24-garden-gallery'}},{x:3120,y:2510},{x:3960,y:2510},{x:4190,y:2537.6,dropTo:{x:4300,y:ground(4300),stepOffX:4230,support:'a3-foundation'}}]);
 assert(b.terrain.filter(t=>t.honroElementCollision).every(t=>t.oneWay));
}
await fs.mkdir('_local/reports/act3-rework-20261017/stage24',{recursive:true});await fs.writeFile('_local/reports/act3-rework-20261017/stage24/focused-checks.json',JSON.stringify({passed:true,scope:'Four bodies, finite ordinary move/jump/drop in independent enemy-free local fixtures. Objective/event/unit contract equality. Not normal combat.',rows},null,2));console.log('PASS stage24 compound local roof/gallery routes and preserved objectives');
