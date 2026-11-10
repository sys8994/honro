/** Focused production-model checks. Combat/story receipts and starting poses
 * are fixtures; walking, interaction gates and isolated save/reload are real. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {battlefield} from './act23-v4-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE,V=g.HonroAct23V4;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const down=u=>{u.dead=true;u.hp=0;};
// Early death must not advertise an unavailable sluice before the safe geometry
// transition and required command clearance. No prerequisite is skipped.
{
 const q=battlefield(g,29),P=g.HonroAct23V4Stage29,R=g.HonroAct23V4Chapter29Reviewed;
 q.e.checkEnd=()=>false;
 down(q.b.units.find(u=>u.id===P.bossId));P.tick(q.app,0);
 assert(R.present(q.b,{targets:[],allTargets:[]}).summary.includes('낙하'));
 assert(!V.eligibility(q.app,V.marker(q.b,'stage29-sluice')).ok);
 q.app.actorBoundary=q.e.active.id;P.tick(q.app,0);q.app.actorBoundary=null;
 assert.equal(P.memory(q.b).gateGeometry,'stable_open');
 assert(R.present(q.b,{targets:[],allTargets:[]}).summary.includes('군진'));
 for(const u of q.b.units)if(u.side===1)down(u);
 P.tick(q.app,0);
 Object.assign(q.b,{phase:'aim',side:0});Object.assign(q.e.active,{x:2780,y:2220,acted:false,vx:0,vy:0});
 assert(R.present(q.b,{targets:[],allTargets:[]}).summary.includes('수문'));
 assert(g.HonroInteractions.eligibility(q.app,V.marker(q.b,'stage29-sluice')).ok);
 assert.equal(P.use(q.app,V.marker(q.b,'stage29-sluice')),true);
 const saved=plain(q.b),restored=new C.Engine(plain(saved),()=>{},false);
 assert.deepEqual(plain(P.memory(restored.b)),plain(P.memory(q.b)));
 console.log('PASS 29 physical gates, accurate objective, UI eligibility/use, retained sluice receipt on Engine restore (explicit casualties/boundary fixture)');
}
// 4/4 is a count, not the final safe convoy proof. Keep the real requirements
// and expose the still-pending reason instead of a misleading finished counter.
{
 const q=battlefield(g,30),P=g.HonroAct23V4Stage30,R=g.HonroAct23V4Chapter30Reviewed,m=P.memory(q.b);
 m.ready=true;m.rescued=[...P.ids.residents];
 const text=R.present(q.b,{targets:[],allTargets:[]}).summary;
 assert(text.includes('4/4')&&/대기|정리/.test(text));
 assert(!P.rescueComplete(q.b));
 assert(!P.use(q.app,V.marker(q.b,P.ids.testimony)));
 assert.deepEqual(plain(P.memory(new C.Engine(plain(q.b),()=>{},false).b)),plain(m));
 console.log('PASS 30 4/4 remains gated with pending-convoy guidance; no fabricated testimony or save change');
}
// The reviewed/native source remains the factory, including its 88-unit court
// tail. No terrain, body size, story receipt or failure condition is changed.
const app=h.load(h.profileThrough(35)),stage36=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===36);app.mount(g.HonroMaps.createBattle(stage36,g.HONRO_PROJECT,app.profile));h.finish(app);g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
{
 const b=app.engine.b,e=app.engine,P=g.HonroAct4TerrainPreview,heroes=b.units.filter(u=>u.side===0),court=b.terrain.find(t=>t.id==='approved36-court');
 for(const u of b.units)if(u.side===1)down(u);
 assert.equal(Math.round(court.x+court.w-b.honroAct4Design.coords.completeX),88);
 b.phase='aim';b.side=0;b.projectiles=[];b.volley=null;
 const q=P.eventAPI.memory(b);Object.assign(q,{clock:10,quietAt:0,reader:null,bark:null,door:{phase:'fallen',time:1},receipts:['A4.S36.DOOR.01','A4.S36.DOOR.02'],events:{leave:{terminal:true}},complete:false});
 for(const[i,u]of heroes.entries()){
  Object.assign(u,{x:2990-i*65,y:C.topAt(court,2990-i*65),vx:0,vy:0,acted:false,airborne:false,jumping:false,moveLeft:2000,maxMove:2000});
 }
 for(const[i,u]of heroes.entries()){
  b.active=u.id;const target=3260-i*60;
  for(let k=0;k<400&&u.x<target-4;k++)e.walk(u,1,C.STEP,true);
  assert(u.x>=target-8,`${u.id} actual court walk reached ${u.x}, target ${target}`);
  assert(e.grounded(u),u.id+' grounded');
 }
 assert(heroes.every(u=>u.x>b.honroAct4Design.coords.leaveX));
 assert(!heroes.every(u=>u.x>b.honroAct4Design.coords.completeX));
 assert.equal(P.interact(app,true),true);assert.equal(q.complete,false,'probe cannot complete');
 const clone=plain(b),r=new C.Engine(clone,()=>{},false);app.engine=r;
 assert.equal(P.interact(app,true),true,'restored assembly still eligible');
 const state=P.eventAPI.memory(clone),prior=plain(state);state.events.leave.terminal=false;assert(!P.interact(app,true));state.events.leave.terminal=true;
 state.receipts=[];assert(!P.interact(app,true));state.receipts=prior.receipts;
 assert(P.interact(app,false));assert(state.complete);assert.equal(clone.phase,'won');
 console.log('PASS 36 four real court walks, broad assembly, gate-negative cases, probe purity and Engine save restore; story/casualties are fixtures');
}
// Normal fresh, existing-cleared, debug-marked and failed-retry saves all have
// the authored 25->25 budget. Do not misdiagnose this as a max-level (30) cap.
g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));
vm.runInContext(await readFile('shared/runtime/act4-pilot-combat.js','utf8'),g);
for(const n of [37,38,39])for(const mode of ['fresh','cleared','debug','retry']){
 const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n);let p=g.HonroMaps.profileFor(st);g.HonroEquipment.migrate(p);
 if(mode==='cleared')p.cleared[n]={visits:1,rounds:5};
 if(mode==='debug'){const normal=h.profileThrough(n-1);normal.heroes=plain(p.heroes);normal.settings.debugMode=true;const debugApp=h.load(normal);assert(debugApp.debugMode);assert.notEqual(debugApp.profile,debugApp.normalProfile);assert(debugApp.profile.equipment.debug);p=debugApp.profile;}
 let b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,p),e=new C.Engine(b,()=>{},false);
 if(mode==='retry'){p.honroBattle=plain(b);g.HonroProgression.syncRoster(p,b);b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,p);e=new C.Engine(b,()=>{},false);}
 assert.equal(g.HONRO_BALANCE.stages[n-1].entryLevel,25);assert.equal(g.HONRO_BALANCE.stages[n-1].exitLevel,25);
 assert.equal(b.honroGrowth.limit.total,0);const before=plain(b.heroes);
 g.HonroProgression.complete(b,e);assert.deepEqual(plain(b.heroes),before);
 assert(Object.values(b.heroes).every(u=>C.levelOf(u)===25));
 console.log(`PASS ${n} ${mode}: authored 25->25 / XP+0 (not max-level cap)`);
}
