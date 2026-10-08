import {beforeGuardianTerrain,guardianTerrainDelta} from './guardian-terrain-history-helpers.mjs';
// Canonical-source, actual Engine input and save-compatibility evidence.
// No normal-combat clear, browser-input or human art approval is implied.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {applyAct1SceneComposition} from '../tools/environment/act1-scene-composition.mjs';
import {beforeGuardianStory,guardianStoryDelta} from './guardian-tree-history-helpers.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,p=plain(g.HONRO_PROJECT),baseline=JSON.parse(await readFile('tests/fixtures/stage10-guardian-baseline.json'));
for(const live of p.stages){const s=plain(live);s.terrains=beforeGuardianTerrain(s.terrains,s.metadata.stageId);const old=baseline.stages.find(v=>v.id===s.id);assert.equal(hash(Object.fromEntries(Object.entries(s).filter(([k])=>!['design','elements'].includes(k)))),old.gameplay,s.id+' full terrain, units, objectives, anchors, events, bounds and state unchanged');if(!['stage-9','stage-10'].includes(s.id)){assert.equal(hash(s.elements),old.elements,s.id+' existing scenery unchanged');assert.equal(hash(s.design),old.design,s.id+' scene design unchanged');}}
for(const a of baseline.library)assert.equal(hash(p.library.find(v=>v.id===a.id)),a.hash,a.id+' existing asset preserved byte-for-byte');
const s=p.stages[9],tree=s.elements.find(e=>e.assetId==='act1-scene:guardian-tree');assert.deepEqual([tree.x,tree.y,tree.scale,tree.depthLayer,tree.layer],[2500,2180,1,'L1','back']);assert(!s.elements.some(e=>e.id==='a1-scene-10-upper-ritual-hall'));
const hall=p.stages[8].elements.find(e=>e.id==='a1-scene-9-east-hall');assert.equal(hall.assetId,'act1-scene:ritual-hall');assert.equal(hall.scale,1.25);assert.equal(p.library.find(a=>a.id===hall.assetId).collision.length,0,'Reused hall never changes paths or actor collision');
assert.deepEqual(plain(await applyAct1SceneComposition(plain(p))),p,'Authoring regenerates the exact canonical project');
assert.deepEqual(plain(g.HonroMaps.normalize(JSON.parse(g.HonroMaps.serialize(p)))),p,'Workshop save/reload keeps guardian metadata');
const before=JSON.parse(await readFile('tests/fixtures/act1-spatial-legacy-save-10.json'));assert.equal(before.b.honroMap?.act1Scene?.guardianTree,undefined);const oldTerrain=JSON.stringify(before.b.terrain);g.HonroStageRules.sanitizeStageBattle(before.b);assert.equal(JSON.stringify(before.b.terrain),oldTerrain,'Existing stage10 saves retain every old surface');
const story=plain(g.HONRO_CONTENT.stages[9]);assert.equal(story.narration[0],guardianStoryDelta.narration.after);assert.equal(story.story.length,6);assert.equal(beforeGuardianStory(story,10).story[5][1],guardianStoryDelta.line.before);
const rows=[],bodies=battlefield(g,11).e.heroesAlive();
for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=battlefield(g,10),u=structuredClone(bodies.find(u=>u.cls===cls)),floor=b.terrain.find(t=>t.id==='outer-yard');Object.assign(u,{x:2200,y:C.topAt(floor,2200),vx:0,vy:0,acted:false});b.units=[u];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
 assert(C.validTerrainContactPose(b.terrain,u),'Clear ground-start pose');const initial={hp:u.hp,move:u.moveLeft},hops=[];
 for(const [x,id]of [[2280,'altar-step-1'],[2450,'altar-step-2'],[2460,'altar-step-3'],[2500,'altar-platform']]){
  assert(e.jump(u),cls+' ordinary jump must launch');let frames=0;for(;frames<360;frames++){if(Math.abs(x-u.x)>1)e.move(Math.sign(x-u.x)*Math.min(1,Math.abs(x-u.x)/(u.walkSpeed*C.STEP)),C.STEP);e.integrateBody(u,C.STEP);if(frames>2&&e.grounded(u))break;}
  const support=e.contactSurface(u.x,u.y-.15,u.y+.15)?.t?.id;assert.equal(support,id,cls+' lands on '+id);assert(Math.abs(x-u.x)<=2);assert.equal(u.hp,initial.hp,'No ascent damage');hops.push({id,x:u.x,y:u.y,frames});
 }
 assert(u.moveLeft>0,'Four branches fit the actual movement budget');rows.push({cls,hops,spent:initial.move-u.moveLeft,damage:initial.hp-u.hp});
}
await mkdir('_local/reports/guardian-tree',{recursive:true});await writeFile('_local/reports/guardian-tree/contracts.json',JSON.stringify({source:baseline.sourceCommit,onlyFourReviewedBoughShapesChanged:true,oldAssetsPreserved:true,regeneration:true,saveRoundtrip:true,legacySave:true,rows,limits:['Native Engine fixtures, no mid-route reposition/refill','Not a normal combat clear or browser-input test']},null,2)+'\n');
console.log('PASS guardian tree: 30 maps preserved outside four exact stage10 bough shapes, old assets preserved, exact regeneration, saves, four bodies climb all four real branches without damage');
