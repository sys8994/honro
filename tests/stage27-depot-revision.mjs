/** Geometry probes preserve enemies and victory rules; direct poses/move refill
 * isolate traversal. They are not a normal-resource campaign completion. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
import {applyStage27Distortion} from '../tools/map-forge/stage27-depot-distortion.mjs';
import {applyStage27Depot} from '../tools/map-forge/stage27-depot-revision.mjs';
const p=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const base=JSON.parse(execFileSync('git',['show','d7c1f8457dd33decda5481c7c3b57d8505f6f157:shared/data/campaign.json'],{encoding:'utf8',maxBuffer:80e6}));
assert.deepEqual(JSON.parse(JSON.stringify(applyStage27Distortion(applyStage27Depot(base)))),p,'Reproducible isolated authoring');assert.deepEqual(applyStage27Depot(p),p,'Idempotent');
for(let i=0;i<30;i++)if(i!==26)assert.deepEqual(p.stages[i],base.stages[i]);
for(const a of base.library)assert.deepEqual(p.library.find(x=>x.id===a.id),a,'Historical asset unchanged');
const s=p.stages[26],old=base.stages[26];for(const key of['crossings','walkingComponents','reinforcements','requiredRoute','storyAnomaly','voidEncounter'])assert.deepEqual(s.design.act3[key],old.design.act3[key]);
for(const key of['markers','objectives','materials','terrains'])assert.deepEqual(s[key],old[key]);
assert.deepEqual({...s.initialState,honroDepotTerrainRevision:undefined},{...old.initialState,honroDepotTerrainRevision:undefined});
assert.equal(s.design.act3.crossings.length,4);
assert.deepEqual(s.design.act3.voidEncounter,{revision:1,trigger:{left:3370,right:4230,y:3050},seam:{x:3850,y:3050,w:150},supportId:'gallery-6:collision:0'});
assert.deepEqual(s.elements.filter(e=>/anomaly|recess|drip/.test(e.id)),old.elements.filter(e=>/anomaly|recess|drip/.test(e.id)));
const g=await runtime({legacyMaps:false}),rows=[];
for(const cls of['archer','mage'])for(const reverse of[false,true]){const{b,e}=battlefield(g,27),u=b.units.find(u=>u.side===0&&u.cls===cls),before=b.units.length;
 const points=s.design.act3.depotRevision.routes[0].points.map(([x,y])=>({x,y}));if(reverse)points.reverse();Object.assign(u,{...points[0],vx:0,vy:0,airborne:false,jumping:false});const result=traverse(g,b,e,u,points,{jump:false});assert.equal(result.failed,null,JSON.stringify(result));assert.equal(b.units.length,before);rows.push({cls,reverse,result});}
const{b,e}=battlefield(g,27),cart=b.units.find(u=>u.kind==='minecart'||u.cls==='minecart');
const geometry=b.terrain.find(t=>t.id==='stage27-depot-r1:cargo-incline:collision:0');assert(geometry);assert.equal(g.HONRO_CORE.topAt(geometry,5160),4750);
await mkdir('review/stage27',{recursive:true});await writeFile('review/stage27/focused-checks.json',JSON.stringify({baseline:'d7c1f8457dd33decda5481c7c3b57d8505f6f157',scope:'geometry probes, not normal combat completion',rows,unchangedOtherStages:29,unchangedHistoricalAssets:base.library.length,crossings:4},null,2)+'\n');console.log('PASS stage27 isolated reproducibility, 29 unchanged stages, old assets/objectives/event contract, 4 two-way basic walk probes');
