/** Production App/Engine/save contract; Canvas and viewport are declared doubles.
 * Supported hero poses and finite spirit deaths are fixtures, not playthrough proof. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,C=g.HONRO_CORE,S=g.HonroAct23V4Reviewed15,P=g.HonroAct23V4ReviewedChapters;
const approved=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch15.json','utf8'));
assert.deepEqual(approved.rows,JSON.parse(await readFile('game/docs/story/v4-review/HONRO-CH15-parent-final.json','utf8')).rows);
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_STAGES=[15];g.HONRO_ACT23_V4_REVIEWED_CHAPTERS={15:approved};g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
let app,b,e,paint;
function launch(){const p=h.profileThrough(14);p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+g.HonroStoryContent.version+'-14']=true;app=h.load(p);app.launch(15);bind();}
function bind(){e=app.engine;b=e.b;paint=[];Object.assign(app.scene,{x:5780,y:4510,scale:.75,canvas:{getBoundingClientRect:()=>({width:1200,height:800})},liveWater(){paint.push('canonical-water');}});}
const hero=cls=>V.heroes(b).find(u=>u.cls===cls);
function pose(cls,x,support='act2-floor'){const u=hero(cls),t=b.terrain.find(t=>t.id===support&&!t.broken);Object.assign(u,{x,y:C.topAt(t,x),vx:0,vy:0,airborne:false});assert(C.validTerrainContactPose(b.terrain,u));return u;}
// The chapter prop pass follows the canonical (opaque) shared water pass.
const c=new Proxy({translate(x,y){paint.push({x,y});}}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
function draw(){app.scene.liveWater(c,b);V.draw(app.scene,c,b,e);}
const fact=()=>S.memory(b).continuity?.brokenPulley;
const outcome=()=>{V.recordOutcome(app,true);return app.profile.honroAct23V4History.stages[15].reviewedPhysical;};
function noFact(reason){assert(!fact(),reason);const q=outcome();assert.equal(q.brokenPulleysObserved,false,reason);assert.equal(q.upwardHandsObserved,false);assert.equal(q.proof.brokenPulley,null);}

launch();const pulley=plain(b.honroV4Reviewed15.pulleys[1]);assert(S.submergedPulley(b,pulley));assert(!S.submergedPulley(b,b.honroV4Reviewed15.pulleys[0]));assert(!S.submergedPulley(b,{x:6200,y:4399}));
// A rectangle-only water test would admit this dry-bank point below the bed.
assert(!S.submergedPulley(b,{x:6200,y:4770}));
draw();noFact('remote arrival/camera alone cannot witness a pulley');
pose('mage',6100);draw();noFact('an unrelated hero cannot supply the archer testimony');
pose('archer',5900,'fc15-dry-basin-rim');draw();noFact('actual rim blocks the production terrain ray');
pose('archer',6100);app.scene.x=1000;draw();noFact('off-screen prop');
app.scene.x=5780;app.scene.scale=.1;draw();noFact('unreadable inspection zoom');
app.scene.scale=.75;pose('archer',320);app.scene.x=5780;draw();noFact('nearby camera does not replace observer proximity');
pose('archer',6100);draw();assert(fact());assert.equal(fact().observer,hero('archer').id);assert.equal(fact().sourceRun,b.session);assert.equal(fact().water.y,4540);assert(fact().point.y>fact().water.y&&fact().point.y<fact().water.floor);assert.equal(fact().sight.terrainClear,true);assert.equal(fact().sight.renderedUnderWater,true);
const waterIndex=paint.lastIndexOf('canonical-water');assert(waterIndex>=0);assert(paint.slice(waterIndex+1).some(p=>p?.x===pulley.x&&p.y===pulley.y),'submerged tinted prop painted after opaque shared water');
const receipt=plain(fact()),session=b.session,profileKeys=Object.keys(app.profile).sort(),growth=plain(app.profile.heroes),cleared=plain(app.profile.cleared);
app.stopBattle();app=h.load(plain(app.profile));app.continue();bind();assert.equal(b.session,session);assert.deepEqual(plain(fact()),receipt);assert.deepEqual(Object.keys(app.profile).sort(),profileKeys);assert.deepEqual(plain(app.profile.heroes),growth);assert.deepEqual(plain(app.profile.cleared),cleared);
const physical=outcome();assert.equal(physical.sourceRun,app.profile.honroAct23V4History.stages[15].run);assert.equal(physical.brokenPulleysObserved,true);assert.equal(physical.upwardHandsObserved,false);assert.deepEqual(plain(physical.proof.brokenPulley),receipt);
const serialized=plain(app.profile);assert.deepEqual(serialized.honroAct23V4History.stages[15].reviewedPhysical,plain(physical));

// Saved foreign-run proof is never promoted into this run's history.
launch();S.memory(b).continuity={revision:1,sourceRun:'another-run',brokenPulley:{...receipt,sourceRun:'another-run'}};let q=outcome();assert.equal(q.brokenPulleysObserved,false);assert.equal(q.upwardHandsObserved,false);
launch();S.memory(b).continuity={revision:1,sourceRun:b.session,brokenPulley:{...receipt,sourceRun:'another-run'}};assert.equal(outcome().brokenPulleysObserved,false);
// A loss does not add or replace a durable chapter witness.
launch();pose('archer',6100);draw();V.recordOutcome(app,false);assert(!app.profile.honroAct23V4History?.stages?.[15]);
launch();pose('archer',6100);e.hurt(hero('archer'),999999,hero('mage').id);draw();noFact('early-killed archer cannot observe');
// Old chapter-15 snapshots retain their actual two dry props, without inferred facts.
launch();b.honroV4Reviewed15.pulleys=[{x:2140,y:3800},{x:6200,y:4399}];delete S.memory(b).continuity;pose('archer',6100);draw();noFact('old snapshot has no underwater prop observation');
app.stopBattle();app=h.load(plain(app.profile));app.continue();bind();assert(!fact());assert.equal(outcome().brokenPulleysObserved,false);

// Actual new finite spirits exist, but their basin admission and deaths never
// certify hands below the distant sluice. No invented ghost/gesture substitutes.
launch();h.finish(app);for(const key of ['arrival','wheel','paths','first-drops','repeat-drops','trajectory-guide'])P.apiFor(15).memory(b).events[key]={status:'done',ids:[]};
V.mem(b).done.groove=true;pose('archer',6230,'fc15-water-toe');Object.assign(b,{side:0,phase:'aim'});app.turnNotice=null;V.tick(app,.025);
const pair=S.memory(b).merge.ids;assert.equal(pair.length,2);assert(pair.every(id=>e.unit(id)?.honroType==='ghost'&&e.unit(id)?.honroSpawnSource==='reviewed.15.merge-pair'));
assert(pair.every(id=>Math.abs(e.unit(id).x-V.marker(b,'sluice').x)>3000));draw();assert.equal(outcome().upwardHandsObserved,false);
for(const id of pair)e.hurt(e.unit(id),999999,hero('archer').id);draw();assert.equal(outcome().upwardHandsObserved,false);
assert.deepEqual(approved.rows,JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch15.json','utf8')).rows);
await mkdir('_local/reports/act23-v4-reviewed15-continuity',{recursive:true});await writeFile('_local/reports/act23-v4-reviewed15-continuity/summary.json',JSON.stringify({status:'passed',pulley,receipt,spirits:pair,upwardHandsObserved:false,checks:['real Engine water polygon floor','chapter prop pass after opaque canonical water','actual archer proximity, viewport, readable scale and terrain LOS','unrelated hero/blocked/offscreen/unseen negative guards','save/Continue and unchanged profile/growth/clear keys','loss/foreign-run/old-snapshot rejection','actual finite spirit admission/deaths do not fabricate sluice gesture'],limits:['Canvas/viewport are doubles; parent must resync immutable build and capture submerged prop.','Supported hero poses and spirit deaths are fixtures.','No physical below-sluice spirit placement exists, so upwardHandsObserved remains false.']},null,2)+'\n');
console.log('PASS reviewed15 continuity: actual submerged pulley sight/save/history; no invented below-sluice hands');
