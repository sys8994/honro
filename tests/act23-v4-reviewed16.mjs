/** Focused production App/Story/Engine binding. Controlled combat and hero
 * poses isolate reviewed scenes; this is not normal-play/browser acceptance. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,C=g.HONRO_CORE,S=g.HonroAct23V4Act2Scenes;
for(const [file,name]of [['chapters','Chapters'],['16','16']])if(!g['HonroAct23V4Reviewed'+name])vm.runInContext(await readFile('shared/runtime/act23-v4-reviewed'+(file==='chapters'?'-chapters':file)+'.js','utf8'),g);
const P=g.HonroAct23V4ReviewedChapters,R=g.HonroAct23V4Reviewed16,api=P.apiFor(16),approved=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch16.json','utf8')),source=JSON.parse(await readFile('game/docs/story/v4-reviewed/HONRO-CH16-reviewed-final.json','utf8'));
assert.deepEqual(approved.rows,source.rows);assert.equal(approved.rows.length,35);assert(!P.enabled(16));g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_STAGES=[16];g.HONRO_ACT23_V4_REVIEWED_CHAPTERS={16:approved};g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
let app,b;const current=()=>app.dialogue?.lines[app.dialogue.index]?.[2]?.rowId;
function launch(route){const p=h.profileThrough(15);p.seen['act2:first-spirit-encounter']=true;if(route)p.honroRouteHandoff={revision:1,fromStage:15,toStage:16,choice:route,sourceRun:'test-route15'};app=h.load(p);app.launch(16);app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});assert(P.active(b));assert.equal(b.honroCampaignMapRevision,516);}
const hero=c=>V.heroes(b).find(u=>u.cls===c),npc=k=>app.engine.unit(k);
const pose=(u,x,y)=>Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});
function tick(n=1){for(let i=0;i<n&&!app.dialogue;i++){Object.assign(b,{side:0,phase:'aim'});V.tick(app,.025);if(!app.dialogue)app.engine.stepUnits(.025);}}
function at(row,n=500){for(let i=0;i<n&&!app.dialogue;i++)tick();assert.equal(current(),row,JSON.stringify({row,actual:app.dialogue?.lines,q:P.memory(b),physical:S.memory(b),current:V.current(b),safe:V.safe(app),poses:b.units.filter(u=>u.side!==1).map(u=>({id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,move:u.moveLeft}))}));assert(P.rowsReviewed(app.dialogue.lines));}
function nextAll(){for(let i=0;app.dialogue&&i<40;i++)g.HonroStory.next(app);assert(!app.dialogue);}
function resume(){app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});}
const allow=id=>{const r=api.row(id);return P.lineAllowed(app,r.speaker,{rowId:id,reviewedStage:16,reviewedRevision:1});};
launch();for(const [key,row]of [['brokenPulleysObserved','EDGE.OPTIONAL_16_ARCHER_0'],['upwardHandsObserved','EDGE.OPTIONAL_16_OCCULTIST_0']]){const candidate={...app.profile,honroBattle:b,honroAct23V4History:{stages:{15:{run:'current15',reviewedPhysical:{revision:1,sourceRun:'old15',[key]:true}}}}};assert(!R.optional(candidate,api.row(row)),'mismatched sourceRun cannot confer observed15 knowledge');candidate.honroAct23V4History.stages[15].reviewedPhysical.sourceRun='current15';assert(R.optional(candidate,api.row(row)));assert(R.optional({...candidate,honroBattle:null},api.row(row)),'actual prior observation remains available in normal pre16 rest');candidate.honroAct23V4History.stages[15].reviewedPhysical.revision=0;assert(!R.optional(candidate,api.row(row)),'legacy physical revision cannot confer observed15 knowledge');delete candidate.honroAct23V4History.stages[15].run;assert(!R.optional(candidate,api.row(row)));}at('EDGE.ARRIVALS_16_0');nextAll();tick(10);assert(!app.dialogue);assert(!R.optional({...app.profile,honroBattle:b},api.row('EDGE.OPTIONAL_16_OCCULTIST_0')));assert(!R.optional({...app.profile,honroBattle:b},api.row('EDGE.OPTIONAL_16_ARCHER_0')));
for(const [i,u]of V.heroes(b).entries())pose(u,2550-i*100,5037.35);at('A2.S16.INTRO.01');assert(P.actor(b,'노승'));nextAll();pose(hero('occultist'),2820,5015.3);at('A2.S16.INTRO.02');nextAll();pose(hero('mage'),2720,5023.47);at('A2.S16.MID.02');nextAll();at('A2.S16.MID.03');resume();at('A2.S16.MID.03');nextAll();assert(!allow('A2.S16.WITNESS.01'));assert(!V.use(app,V.marker(b,'16.testimony')));assert(!b.honroState.flags.witness16_heard);
// Controlled combat results remove unrelated foes; only the NPCs themselves
// perform the rescue movement and recovery with the production body integrator.
for(const u of b.units)if(u.side===1&&u.id!=='resident-spirit-1'){u.dead=true;u.hp=0;}
pose(hero('archer'),3270,4950);Object.assign(b,{active:hero('archer').id,phase:'aim',side:0});assert(V.use(app,V.marker(b,'16.elder')));app.turnNotice=null;
pose(hero('occultist'),2850,5012.86);Object.assign(b,{active:hero('occultist').id,phase:'aim',side:0});assert(V.use(app,V.marker(b,'16.disciple')));app.turnNotice=null;assert(R.separated(b));
for(const [i,u]of V.heroes(b).entries())pose(u,2200-i*100,app.engine.surface(2200-i*100,4700,5500).y);pose(hero('archer'),2700,5025.102040816327);
at('A2.S16.MID.04',1200);assert(R.recovered(b));for(const k of ['resident-1','objective'])assert(C.validTerrainContactPose(b.terrain,npc(k)));nextAll();at('A2.S16.MID.05');nextAll();at('A2.S16.WITNESS.01');assert.equal(app.dialogue.lines.length,8);const witnessProfile=plain(app.profile);witnessProfile.honroBattle=plain(b);assert(!V.mem(b).sceneDone['16.testimony.required']);
// A skip button or E acknowledgement cannot manufacture heard testimony.
g.HonroStory.finish(app);assert(!R.heard(b));assert(!b.honroState.flags.witness16_heard);tick();at('A2.S16.WITNESS.01');for(let i=0;i<4;i++)g.HonroStory.next(app);assert.equal(current(),'A2.S16.WITNESS.05');resume();at('A2.S16.WITNESS.05');assert(!R.heard(b));nextAll();assert(R.heard(b));tick();assert(V.mem(b).sceneDone['16.testimony.required']);assert(b.honroState.flags.witness16_heard);assert(!allow('A2.S16.MID.06'),'sound plus history does not prove present souls');
pose(hero('mage'),3100,4925.986394557824);at('A2.S16.MID.06');assert(P.memory(b).trappedObserved.souls.length===2);nextAll();const exit=V.marker(b,'16.work-exit');pose(hero('archer'),exit.x-200,exit.y);at('A2.S16.COMPLETE.01');nextAll();tick();assert(R.complete(b));assert.equal(app.profile.record.filter(r=>r.rowId==='A2.S16.JOURNAL.01').length,1);V.recordOutcome(app,true);const history=app.profile.honroAct23V4History.stages[16];assert(history.reviewedPhysical.witness16_heard);assert.deepEqual(plain(history.reviewedPhysical.witnessRows),plain(R.witness));
console.log('PASS exact35, living speakers, actual two-NPC supported recovery, forced eight-row testimony and saved cursor, independent trapped-soul proof, history and one journal');
app=h.load(witnessProfile);app.continue();app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});const knight=hero('knight');knight.hp=0;knight.dead=true;nextAll();tick();assert(R.heard(b),'living elder core facts survive absent knight questions');assert.deepEqual(plain(P.memory(b).events.witness.ids),plain(R.coreWitness));V.recordOutcome(app,true);assert.deepEqual(plain(app.profile.honroAct23V4History.stages[16].reviewedPhysical.witnessRows),plain(R.coreWitness));
console.log('PASS missing-knight testimony records exactly the five actually presented elder facts');

launch('B');at('EDGE.ARRIVALS_16_0');nextAll();for(const u of V.heroes(b))pose(u,2800,5016.94);at('A2.S16.BRANCH.02');assert(!allow('A2.S16.BRANCH.01'));nextAll();npc('objective').dead=true;assert(!allow('A2.S16.INTRO.01'));b.phase='lost';assert.equal(V.state(b).failureText,api.row('A2.S16.FAIL.01').text);g.HONRO_ACT23_V4_PHASE_B_STAGES=[];assert.equal(V.mapRevision(16),216);console.log('PASS actual route-entry branch, dead-speaker/failure and private-stage gate');

// Audit exceptions: actual Engine damage, saved Continue and production NPC
// recovery. Enemy removals/hero poses are fixtures, not normal-play evidence.
g.HONRO_ACT23_V4_PHASE_B_STAGES=[16];
for(const missing of ['mage','archer']){
 launch();at('EDGE.ARRIVALS_16_0');nextAll();
 for(const [i,u]of V.heroes(b).entries())pose(u,2550-i*100,5037.35);
 at('A2.S16.INTRO.01');nextAll();pose(hero('occultist'),2820,5015.3);at('A2.S16.INTRO.02');nextAll();
 if(missing==='mage'){
  app.engine.hurt(hero('mage'),100000);assert(hero('mage')===undefined);
  resume();tick(1000);assert.equal(P.memory(b).events['release-request'].status,'skipped');
  // Sodan is already nearby and her own separation line must still appear.
  at('A2.S16.MID.03');nextAll();
 }else{pose(hero('mage'),2720,5023.47);at('A2.S16.MID.02');nextAll();at('A2.S16.MID.03');nextAll();}
 for(const u of b.units)if(u.side===1&&u.id!=='resident-spirit-1'){u.dead=true;u.hp=0;}
 const rescuer=hero(missing==='archer'?'knight':'archer');pose(rescuer,3270,4950);Object.assign(b,{active:rescuer.id,phase:'aim',side:0});assert(V.use(app,V.marker(b,'16.elder')));app.turnNotice=null;
 pose(hero('occultist'),2850,5012.86);Object.assign(b,{active:hero('occultist').id,phase:'aim',side:0});assert(V.eligibility(app,V.marker(b,'16.disciple')).ok);assert(V.use(app,V.marker(b,'16.disciple')));app.turnNotice=null;
 for(const [i,u]of V.heroes(b).entries())pose(u,2200-i*100,app.engine.surface(2200-i*100,4700,5500).y);pose(rescuer,2700,5025.102040816327);
 at('A2.S16.MID.04',1200);assert(R.recovered(b));nextAll();
 if(missing==='archer'){app.engine.hurt(hero('archer'),100000);resume();tick();assert.equal(P.memory(b).events.sound.status,'skipped');}
 else{at('A2.S16.MID.05');nextAll();}
 at('A2.S16.WITNESS.01');assert(!R.heard(b));g.HonroStory.finish(app);assert(!R.heard(b));at('A2.S16.WITNESS.01');nextAll();tick();assert(R.heard(b));
 assert(R.coreWitness.every(k=>P.memory(b).witnessPresented.includes(k)));
 const observer=hero('mage')||hero('occultist');pose(observer,3100,4925.986394557824);tick();
 assert(P.memory(b).trappedObserved);assert.equal(P.memory(b).trappedObserved.observer,observer.id);
 assert.equal(current(),missing==='mage'?'A2.S16.MID.07':'A2.S16.MID.06');nextAll();
 console.log('PASS audit16 missing '+missing+': skipped question, actual separation/recovery, Continue, five presented elder facts and living soul observer');
}
