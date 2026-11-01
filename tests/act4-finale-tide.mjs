/** Real tide/recovery methods with explicit stage fixtures, not whole play. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';import {loadPilotRuntime} from '../tools/stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g;g.HonroApp=h.load(h.profileThrough(39));
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);await loadPilotRuntime(g);
const P=g.HonroAct4TerrainPreview,s=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===40),p=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(p);const b=g.HonroMaps.createBattle(s,g.HONRO_PROJECT,p,{origin:'campaign'}),e=new g.HONRO_CORE.Engine(b,()=>{},true),q=P.previewMemory(b),hero=b.units.find(u=>u.side===0),boss=b.units.find(u=>u.honroAct4FinaleBoss),cfg=b.honroAct4Design.tide,policy=b.honroAct4Design.waterPolicies[0];
Object.assign(b,{side:0,phase:'aim',round:1});P.coast.tide(b);assert.equal(q.tide.started,undefined);assert.equal(q.tide.surface,3762.5);assert.equal(policy.surface,3412.5);
Object.assign(hero,{x:1800,y:3175,acted:false});P.coast.tide(b);assert(q.tide.started);assert.equal(q.tide.phase,'rising');assert(q.tide.highRound>=b.round+3,'At least three allied round boundaries before high tide');
const high=q.tide.highRound;b.round=high;P.coast.tide(b);assert.equal(q.tide.surface,3412.5);assert.equal(q.tide.phase,'high');assert(boss.honroAct4Aquatic);
const hp=boss.hp;P.coast.water(e);assert.equal(boss.hp,hp,'Aquatic major boss is not auto-killed by its arena');
// Guard against the old low-tide branch silently disabling ocean recovery.
b.round=q.tide.lowRound;P.coast.tide(b);assert.equal(q.tide.surface,3762.5);Object.assign(hero,{x:2700,y:3830,vx:0,vy:0});P.coast.water(e);assert(hero.honroAct4Recovering,'Deep sea remains hazardous at low tide');
for(const u of b.units.filter(u=>u.side===1)){u.dead=true;u.hp=0;}q.tide.phase='high';q.tide.surface=3412.5;P.coast.tide(b);assert.equal(q.tide.surface,3762.5);assert.equal(policy.surface,3762.5);assert(q.tide.finished,'No empty rounds required before safe return');
assert.equal(s.design.act4.geometry40.lowerBoardingTriggerBounds.y2,3650);assert.equal(b.honroAct4Design.escort.total,13);assert.equal(b.honroAct4Design.escort.rescued,4);console.log('PASS350-height tide, approach trigger, response delay, aquatic boss, low-sea recovery and no waiting after combat; fixture only');
