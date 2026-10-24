/** Stage16 pilot state/physics fixtures; not an ordinary-resource combat playthrough. */
import assert from'node:assert/strict';import{writeFileSync}from'node:fs';import vm from'node:vm';import{mkdir,writeFile,readFile}from'node:fs/promises';import{appHarness,plain}from'./app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,C=h.C,S=g.HonroStage16Temple,out='_local/reports/stage16-escort-pilot-a';await mkdir(out,{recursive:true});
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
let app=h.load(h.profileThrough(15));app.launch(16);h.finish(app);let e=app.engine,b=e.b;const st=g.HONRO_PROJECT.stages[15],content=b.honroNarrativeContent,checkpoints=[];
assert(S.pilot(b));assert.deepEqual(plain(g.HonroAct2.steps(b).map(s=>s.id)),['monk','witness','temple-escort','hall','record']);assert.equal(content.beats.witness.at(-1)[1],'두 분은 법당 툇마루로 가시오. 앞은 우리가 맡겠소.');assert.equal(content.beats.witness.at(-1)[2].portraitExpression,'emotion.resolve');
assert.equal(b.units.filter(u=>u.side===1).length,st.units.filter(u=>u.team==='enemy').length);assert.equal(b.units.filter(u=>u.honroCivilian).length,2);
function point(id){return b.honroMarkers.find(m=>m.id===id);}function pose(u,p){Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,jumping:false});}
function finish(){h.finish(app);app.close();}
function snapshot(name){g.HonroStory.save(app);const before=plain(b),p=plain(app.profile);if(name==='mid-walk')writeFileSync(out+'/rollback-mid-walk.json',JSON.stringify(p));app=h.load(p);app.continue();e=app.engine;b=e.b;assert.deepEqual(plain(b.units),before.units,name+' actor poses/resources');assert.deepEqual(plain(b.honroState.act2),before.honroState.act2,name+' exact ledger');assert.deepEqual(plain(b.honroState.templeEscort??null),before.honroState.templeEscort??null,name+' path memory');finish();checkpoints.push(name);}
const hall=point('hall');assert(!g.HonroAct2.eligibility(app,hall).ok);assert.equal(g.HonroAct2.eligibility(app,hall).reason,'두 승려가 아직 툇마루에 도착하지 않았습니다.');snapshot('before-rescue');
// Genuine existing alternative: Sodan down; another hero can rescue after the
// possessing spirit is subdued. Defeat is a fixture, not a claimed combat input.
const sodan=e.heroesAlive().find(u=>u.cls==='occultist');sodan.hp=0;sodan.dead=true;const hero=e.heroesAlive()[0];b.active=hero.id;b.phase='aim';hero.acted=false;pose(hero,point('monk'));assert(!g.HonroAct2.eligibility(app,point('monk')).ok);e.unit('resident-spirit-1').honroSubdued=true;assert(g.HonroAct2.eligibility(app,point('monk')).ok);assert(g.HonroInteractions.use(app,point('monk')));finish();assert(g.HonroAct2.memory(b).done.monk);snapshot('rescued');
pose(e.heroesAlive()[0],point('witness'));g.HonroAct2.tick(app,1/60);assert(g.HonroAct2.memory(b).done.witness);finish();assert.equal(g.HonroAct2.current(b).id,'temple-escort');snapshot('witness-key');
// Fixture-clear the road only for isolated swept movement assertions. Existing
// roster, geometry and resources were already asserted above and are not tuned.
for(const u of b.units)if(u.side===1)u.dead=true;for(const u of e.heroesAlive())pose(u,{x:600+u.r*4,y:5480});
// One body in the approach and one on the preferred veranda slot exercise
// physical bypass and nearby destination selection without an enemy-count gate.
pose(e.heroesAlive()[0],{x:4700,y:4250});pose(e.heroesAlive()[1],{x:5550,y:4250});
let samples=[],maxStep=0;for(let frame=0;frame<2000&&!g.HonroAct2.memory(b).done['temple-escort'];frame++){
 if(frame%360===0)b.round++;b.phase='aim';const old=new Map(b.units.filter(u=>u.honroCivilian).map(u=>[u.id,{x:u.x,y:u.y}]));e.stepUnits(1/60);g.HonroAct2.tick(app,1/60);finish();
 for(const u of b.units.filter(u=>u.honroCivilian)){const p=old.get(u.id);maxStep=Math.max(maxStep,Math.hypot(u.x-p.x,u.y-p.y));assert(C.validTerrainContactPose(b.terrain,u)||u.jumping||!e.grounded(u),'Physical terrain pose '+u.id);}
 if(frame===420)snapshot('mid-walk');if(frame%120===0)samples.push({frame,round:b.round,monks:plain(b.units.filter(u=>u.honroCivilian).map(u=>({id:u.id,x:u.x,y:u.y,moveLeft:u.moveLeft}))) });
}
if(!g.HonroAct2.memory(b).done['temple-escort'])console.log('STALL',b.units.filter(u=>u.honroCivilian).map(u=>({id:u.id,x:u.x,y:u.y,vy:u.vy,jumping:u.jumping,mem:b.honroState.templeEscort.actors[u.id]})));assert(g.HonroAct2.memory(b).done['temple-escort'],'both monks physically reach veranda');assert(maxStep<32,'no teleport; 1/60 swept fall/landing plus normal walking');assert(S.arrived(b));assert(!g.HonroAct2.memory(b).done.hall);snapshot('arrived');
const actor=e.heroesAlive()[0];b.active=actor.id;b.phase='aim';actor.acted=false;pose(actor,point('hall'));assert(g.HonroInteractions.eligibility(app,point('hall')).ok);assert(g.HonroInteractions.use(app,point('hall')));finish();g.HonroAct2.tick(app,1/60);assert(g.HonroAct2.memory(b).done.hall);assert(!g.HonroAct2.memory(b).done.record,'No remote record acquisition from doorway');snapshot('door-open');
pose(e.heroesAlive()[0],point('record'));b.phase='aim';g.HonroAct2.tick(app,1/60);assert(g.HonroAct2.memory(b).done.record);finish();assert(g.HonroAct2.state(b).complete);snapshot('record-acquired');
assert(app.checkMission(e));assert.equal(b.phase,'won');app.outcome();finish();assert(app.done);const rewarded=plain(app.profile.heroes),visits=app.profile.cleared[16].visits;app.outcome();assert.deepEqual(plain(app.profile.heroes),rewarded);assert.equal(app.profile.cleared[16].visits,visits);
const result={checkpoints,samples,maxStep,scope:'Production App/Engine with explicit placement/subdual/road-clear/round fixtures for state and collision. Combat and four normal-resource strategies not proved by this test.'};await writeFile(out+'/native.json',JSON.stringify(result,null,2));console.log('PASS Stage16 rescue alternative, testimony, physical escort, early door, local record, Continue boundaries',checkpoints);
