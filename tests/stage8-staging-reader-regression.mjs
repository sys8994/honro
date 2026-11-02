/** Actual saved normal-input battle + separately labelled isolated unit fixture.
 * No actor/resource/goal edits in the natural-save regression. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
const h=await appHarness({productionStory:true}),{g,C}=h,S=g.HonroStage8Bier;let now=10000;g.performance={now:()=>now};const checks=[];
const bytes=gunzipSync(await readFile('tests/fixtures/stage8-staging/natural-r24-reader-stall.json.gz')),meta=JSON.parse(await readFile('tests/fixtures/stage8-staging/provenance.json'));
assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.profileSHA256);
let app=h.load(JSON.parse(bytes)),e,b,audit;
function bind(){e=app.engine;b=e.b;app.scene.render=()=>{};audit=auditQuarryEngine(b,e,()=>({round:b.round,now}));}
app.continue();bind();assert.deepEqual(plain(b),JSON.parse(bytes).honroBattle,'Natural saved battle Continue exact before simulation');
assert.equal(S.memory(b).status,'moving');assert.equal(b.honroStory,null);assert.equal(b.honroStaging.once[S.SCENE],'done');
const originalBoss=plain(e.unit('boss')),originalOthers=plain(b.units.filter(u=>u.id!=='boss'));
function tick(){now+=1000/120;audit.production(()=>app.frame(now));assert(!app.lastError,app.lastError);audit.guard();}
for(let i=0;i<500&&!app.canInput();i++)tick();
assert(app.canInput(),'Old completed-reader orphan must release input for normal retry');assert.equal(S.memory(b).completedOnce,0);assert.equal(S.memory(b).status,'blocked');
assert.deepEqual(plain(e.unit('boss')),originalBoss,'Recovery never relocates/heals the boss');assert.deepEqual(plain(b.units.filter(u=>u.id!=='boss')),originalOthers,'Recovery does not change unrelated actors');
checks.push('unmodified natural R24 Continue; orphan reader releases to blocked without actor writes');
audit.production(()=>app.defend());
for(let i=0;i<500&&S.memory(b).status!=='moving';i++){if(app.dialogue)audit.production(()=>g.HonroStory.next(app));tick();}
assert.equal(S.memory(b).status,'moving');assert.equal(app.dialogue.staging.id,S.SCENE);assert.equal(app.dialogue.staging.manualReader,1);assert(app.dialogue.staging.bierMotion.steps.some(s=>s.type==='move'));assert.equal(app.dialogue.staging.bierMotion.complete,false);
const start={x:e.unit('boss').x,y:e.unit('boss').y};
for(let i=0;i<24;i++)tick();assert(e.unit('boss').x!==start.x,'Normal App frames execute dedicated walk');assert.equal(S.memory(b).completedOnce,0);
app.export();const mid=await h.exported(),before=plain(b);app=h.load(mid);app.continue();bind();assert.deepEqual(plain(b),before,'Mid-physical-move Continue exact');checks.push('natural defense triggers existing movement; mid-walk whole-battle Continue exact');
let steps=0,last={x:e.unit('boss').x,y:e.unit('boss').y};
for(;steps<3000&&S.memory(b).status==='moving';steps++){tick();const u=e.unit('boss');assert(Math.hypot(u.x-last.x,u.y-last.y)<=55,'Bounded actual walk, not endpoint teleport');last={x:u.x,y:u.y};}
assert.equal(S.memory(b).status,'settled');assert.equal(S.memory(b).completedOnce,1);assert(app.dialogue,'Arrival prose remains manually read');assert.equal(app.dialogue.staging.id,S.SCENE);assert.equal(e.unit('boss').hp,originalBoss.hp);assert.equal(e.unit('boss').focus,originalBoss.focus);assert.equal(b.round,24);assert.equal(audit.log.externalWrites.length,0);assert.equal(audit.log.recoveries.length,0);
for(let i=0;i<20&&app.dialogue;i++)audit.production(()=>g.HonroStory.next(app));assert(!app.dialogue);assert.equal(S.memory(b).completedOnce,1);for(let i=0;i<6000&&!app.canInput();i++){if(app.dialogue)audit.production(()=>g.HonroStory.next(app));tick();}assert(app.canInput(),'Normal enemy phase returns to player input after arrival');checks.push('bounded collision-checked walk reaches once; manual dialogue ends; input restored; no recovery/resource bypass');
// Pure reader contract also proves all OTHER manual captions retain conversion.
const make=id=>({staging:{id,steps:[{type:'move',actor:'boss',to:{x:100,y:100},duration:1000,caption:'existing caption'},{type:'dialogue'}],complete:false,cursor:0,elapsed:0}});
const dedicated=g.HonroStoryStaging.reader([['서술','existing arrival']],make(S.SCENE));assert.equal(dedicated.options.staging.manualReader,1);assert.equal(dedicated.options.staging.bierMotion.complete,false);assert(dedicated.options.staging.bierMotion.steps.some(s=>s.type==='move'));assert(!dedicated.options.staging.cues.flat().some(s=>s.type==='move'&&s.actor==='boss'));
const ordinary=g.HonroStoryStaging.reader([['서술','existing arrival']],make('unrelated-unit-scene'));assert.equal(ordinary.options.staging.manualReader,1);assert.equal(ordinary.options.staging.complete,true);checks.push('dedicated physical steps retained; unrelated manual reader unchanged');
// Isolated fresh-trigger fixture: only this block authors geometry/prerequisites.
// It is not normal-play evidence and cannot contribute to clear-rate statistics.
const qa=h.load(h.profileThrough(7));qa.launch(8);h.finish(qa);now+=2000;const qe=qa.engine,qb=qe.b;
const solid=(id,x,y,w,ht)=>({...g.HonroMapEngine.solid(id,[[x,y],[x+w,y],[x+w,y+ht],[x,y+ht]]),indestructible:true});
qb.width=5000;qb.height=2000;qb.terrain=[solid('unit-floor',0,900,5000,1100),...['unit-seal-west','unit-seal-east'].map((id,i)=>({...solid(id,100+i*130,840,30,60),honroSeal:true,indestructible:false,hp:0,maxHp:480,broken:true}))];qb.honroWorldTerrain=plain(qb.terrain);qb.sceneVersion++;
qb.units=qb.units.filter(u=>u.side===0||u.id==='boss');for(const [i,u]of qe.heroesAlive().entries())Object.assign(u,{x:250+i*110,y:900,spawnX:250+i*110,spawnY:900,vx:0,vy:0,airborne:false,jumping:false});Object.assign(qe.unit('boss'),{x:2800,y:900,spawnX:2800,spawnY:900,vx:0,vy:0,airborne:false,jumping:false});
qb.honroQuestTargets=[];qb.honroMarkers=[];qb.honroState.pendingEvents=[];qb.honroStage8BierSpec={movement:{destinations:[{id:'unit-primary',x:1850,y:900,support:'unit-floor'}],routes:[]},entries:{}};qb.honroState.stage8Bier={version:1,status:'anchored',completedOnce:0,sealIdsSeen:[],warnings:{},entries:{},offered:{},blockers:[]};
S.transition(qa);assert.equal(S.memory(qb).status,'announced');assert(qa.canInput());qa.defend();for(let i=0;i<250&&S.memory(qb).status!=='moving';i++){if(qa.dialogue)g.HonroStory.next(qa);qe.tick(C.STEP);now+=1000/120;}
assert.equal(S.memory(qb).status,'moving');assert.equal(qa.dialogue.staging.manualReader,1);const qstart=qe.unit('boss').x;
g.HonroStory.tick(qa,now);now+=50;g.HonroStory.tick(qa,now);assert(qe.unit('boss').x<qstart);assert(qe.unit('boss').x>1850);
qa.modal.classList.add('open');const paused=plain({unit:qe.unit('boss'),scene:qa.dialogue.staging});for(let i=0;i<10;i++)g.HonroStory.tick(qa,now+=50);assert.deepEqual(plain({unit:qe.unit('boss'),scene:qa.dialogue.staging}),paused);qa.modal.classList.remove('open');
const captionIndex=qa.dialogue.index;g.HonroStoryStaging.skipMotion(qa);assert.equal(qa.dialogue.index,captionIndex,'Physical completion never advances the manual caption');assert.equal(S.memory(qb).status,'settled');assert.equal(S.memory(qb).completedOnce,1);assert.equal(qe.unit('boss').x,1850);assert(qa.dialogue);h.finish(qa);assert.equal(S.memory(qb).completedOnce,1);checks.push('isolated fresh prerequisite trigger, progressive walk, modal pause, collision-checked normal Skip, exactly once');
await mkdir('_local/reports/stage8-staging-reader',{recursive:true});await writeFile('_local/reports/stage8-staging-reader/natural-save.json',JSON.stringify({checks,fixture:meta,steps,end:{phase:b.phase,round:b.round,status:S.memory(b).status,completedOnce:S.memory(b).completedOnce,boss:{x:e.unit('boss').x,y:e.unit('boss').y,hp:e.unit('boss').hp}},scope:'Saved normal-input battle progression regression, not Stage8 victory or browser evidence'},null,2));console.log('PASS',checks);
