/** Production placement/spawn/save regression. Explicit natural-body projection
 * and extra occupancy fixtures; NOT normal-play or browser evidence. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
import {bierEntrySpec} from '../tools/map-forge/stage8-bier.mjs';
const h=await appHarness(),{g,C}=h,S=g.HonroStage8Bier,source='stage8-settled-crows';
const fixture=JSON.parse(await readFile('tests/fixtures/stage8-late-crows/natural-r18-occupancy.json'));
const authored=bierEntrySpec()[source],project=JSON.parse(await readFile('shared/data/campaign.json'));
const stage=project.stages.find(s=>s.metadata?.stageId===8);
assert.deepEqual(stage.initialState.honroStage8BierSpec.entries[source],authored);
assert.equal(authored.spacing,220);assert.equal(authored.alternates[0].spacing,220);
const event=stage.events.find(e=>e.id===source);assert.equal(event.action.n,3);assert.equal(event.once,true);assert.equal(event.action.spacing,220);
let now=10000;g.performance={now:()=>now};
function setup(){const p=plain(fixture.profile);const app=h.load(p);app.launch(8);h.finish(app);now+=3000;
 const b=app.engine.b;Object.assign(b,plain(fixture.battleFields));for(const t of b.terrain)if(fixture.brokenTerrainIds.includes(t.id)){t.broken=true;t.hp=0;}b.projectiles=[];b.volley=null;
 app.engine=new C.Engine(b,()=>{},true);app.done=false;app.dialogue=null;app.actorBoundary='p-archer';return{app,b,e:app.engine};}
function occupy(q,x){const u=g.HonroWorld.createEnemy(q.b,q.app.stage,x,'crow',900+q.b.units.length,3930,true);u.id='occupancy-'+x;q.b.units.push(u);return u;}
const action=q=>q.b.honroEvents.find(e=>e.id===source).action;
const state=q=>plain({units:q.b.units,nextId:q.b.nextId,counters:q.b.honroCounters,seed:q.b.seed,rng:q.b.rng});
const rows=[];
for(const alternate of [false,true]){const q=setup();if(alternate)occupy(q,6390);const before=q.b.units.length;assert(S.spawn(q.app,action(q)));const added=q.b.units.slice(before);assert.equal(added.length,3);assert.deepEqual(added.map(u=>u.x),alternate?[5750,5970,6190]:[5950,6170,6390]);assert(added.every(u=>u.honroSpawnSource===source&&u.y===3930));assert.equal(S.memory(q.b).entries[source].count,3);
 const after=state(q);assert(S.spawn(q.app,action(q)));assert.deepEqual(state(q),after,'same-boundary repeat does not duplicate');q.app.export();const saved=await h.exported(),app=h.load(saved);app.continue();now+=3000;const resumed={app,b:app.engine.b,e:app.engine};assert.deepEqual(plain(resumed.b.units),after.units);app.actorBoundary='p-archer';assert(S.spawn(app,action(resumed)));assert.deepEqual(state(resumed),after,'Continue does not duplicate actors, rewards, IDs or RNG');rows.push(alternate?'occupied primary uses clear alternate and Continue is idempotent':'actual natural occupied field admits primary and Continue is idempotent');}
{const q=setup();occupy(q,6390);occupy(q,5750);const before=state(q);assert.equal(S.spawn(q.app,action(q)),false);assert.deepEqual(state(q),before);assert.equal(S.memory(q.b).warnings[source].status,'blocked');rows.push('both body-occupied entries reject atomically without consuming IDs/RNG');}
{const q=setup();delete S.memory(q.b).warnings[source].opportunity;const before=state(q);assert.equal(S.spawn(q.app,action(q)),false);assert.deepEqual(state(q),before);rows.push('warning without actual response remains gated');}
{const q=setup();while(q.e.alive(1).length<g.HonroEncounters.populationCap(q.b)-2)occupy(q,9000+q.b.units.length*220);const before=state(q);assert.equal(S.spawn(q.app,action(q)),false);assert.deepEqual(state(q),before);rows.push('three-member admission retains population cap');}
{const q=setup();const old={side:'upper-branch',x:6170,y:3830,spacing:105,maxDistance:0,air:true,alternates:[{x:6390,y:3630,spacing:105,maxDistance:0,air:true}]};q.b.honroStage8BierSpec.entries[source]=plain(old);q.app.export();const saved=await h.exported(),app=h.load(saved);app.continue();now+=3000;assert.deepEqual(plain(app.engine.b.honroStage8BierSpec.entries[source]),old);assert.deepEqual(plain(app.engine.b.units),plain(q.b.units));assert.equal(S.memory(app.engine.b).warnings[source].status,'blocked');rows.push('existing Continue retains old authored slots and blocked warning unchanged');}
await report('stage8-late-crows',rows,{fixture:fixture.provenance,entries:authored,limits:['No new natural-route completion or browser claim. Final integrated source still requires Stage8 gameplay recheck.']});console.log('PASS Stage8 late crows',rows);
