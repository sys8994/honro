// Production App/engine interactions and objective positions. DOM/storage are
// doubles; relocated actor fixtures are not normal-campaign completion proof.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,checks=[];
const interactionSource=await readFile('shared/runtime/interactions.js','utf8');
let app,b,m,target,hero;
function refs(){b=app.engine.b;m=b.honroMarkers.find(m=>m.id==='resident-marker-2');target=b.units.find(u=>u.id===m.target);hero=app.engine.active;}
function interactions(){g.HonroApp=app;vm.runInContext(interactionSource,g);}
function fixture(id=7){app=h.load(h.profileThrough(id-1));app.launch(id);h.finish(app);app.turnNotice=null;interactions();if(id===7)refs();else b=app.engine.b;return app;}
function place(){Object.assign(target,{x:2145.7412359815503,y:3284.437512296886});Object.assign(hero,{x:2142.658,y:3298.617,vx:0,vy:0,airborne:false,jumping:false});}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
const livePoint=()=>g.HonroObjectives.state(b,app.stage).allTargets.find(t=>t.id===m.id);
check('Moving resident drives eligibility, nearest button and objective/minimap target without rewriting its marker',()=>{
 fixture();place();const before=plain(m),snapshot=JSON.stringify(b);
 assert(g.HonroInteractions.eligibility(app,m).ok,'A hero next to the live resident must be allowed to rescue: '+g.HonroInteractions.eligibility(app,m).reason);
 assert.equal(g.HonroInteractions.nearest(app),m);g.HonroInteractions.refresh(app);
 assert.match(h.nodes.get('context-interact').innerHTML,/월이/);assert(!h.nodes.get('context-interact').innerHTML.includes('disabled'));
 assert.equal(livePoint().x,target.x);assert.equal(livePoint().y,target.y-target.h);assert.equal(livePoint().unitId,target.id);
 const rects=[],ctx={save(){},restore(){},strokeRect(...args){rects.push(args);}};g.HonroObjectives.minimap(app,ctx,.1,.1);
 assert(rects.some(([x,y])=>x===target.x*.1-3&&y===(target.y-target.h)*.1-3));
 assert.equal(JSON.stringify(b),snapshot,'Resolving and showing targets must not mutate saves');assert.deepEqual(plain(m),before);
 target.x+=500;assert(!g.HonroInteractions.eligibility(app,m).ok);assert.equal(livePoint().x,target.x);
 Object.assign(hero,{x:m.x,y:m.y});assert(!g.HonroInteractions.eligibility(app,m).ok,'Old authoring location must not rescue a distant resident');
});
check('Actual App KeyE rescues the connected live person exactly once',()=>{
 fixture();place();const before=b.honroState.rescuedCount||0;
 const key={code:'KeyE',repeat:false,target:{tagName:'DIV'},preventDefault(){}};
 for(const fn of h.listeners.get('keydown')||[])fn(key);
 assert(m.collected);assert(target.honroResolved);assert(target.shield>=60);assert.equal(b.honroState.rescuedCount,before+1);
 assert(!g.HonroInteractions.use(app,m));assert.equal(b.honroState.rescuedCount,before+1);assert(!livePoint());
});
check('Actual context button shares the same live target and structure count',()=>{
 fixture();place();const before=b.honroState.rescuedCount||0;
 const button={dataset:{contextInteract:m.id}},event={target:{closest:selector=>selector==='[data-context-interact]'?button:null}};
 for(const fn of h.listeners.get('click')||[])fn(event);
 assert(m.collected);assert(target.honroResolved);assert.equal(b.honroState.rescuedCount,before+1);
});
for(const variant of ['dead','zero-hp','resolved','missing-unit','missing-target','stale-marker','nonfinite'])check(`${variant}: no action, phantom marker or duplicate rescue count`,()=>{
 fixture();place();
 if(variant==='dead')target.dead=true;
 if(variant==='zero-hp')target.hp=0;
 if(variant==='resolved')target.honroResolved=true;
 if(variant==='missing-unit')b.units=b.units.filter(u=>u.id!==target.id);
 if(variant==='missing-target')delete m.target;
 if(variant==='stale-marker')b.honroMarkers=b.honroMarkers.filter(v=>v!==m);
 if(variant==='nonfinite')target.x=NaN;
 const count=b.honroState.rescuedCount||0;
 assert(!g.HonroInteractions.eligibility(app,m).ok);assert(!g.HonroInteractions.use(app,m));
 assert.equal(b.honroState.rescuedCount||0,count);assert(!m.collected);assert(!g.HonroInteractions.candidates(app).some(x=>x.marker===m));assert(!livePoint());
});
check('Same floor, interaction range and actor-turn restrictions still apply',()=>{
 fixture();place();target.y=hero.y+151;assert.match(g.HonroInteractions.eligibility(app,m).reason,/같은 층/);
 target.y=hero.y;target.x=hero.x+261;assert.match(g.HonroInteractions.eligibility(app,m).reason,/가까이/);
 target.x=hero.x+260;assert(g.HonroInteractions.eligibility(app,m).ok);
 hero.acted=true;assert(!g.HonroInteractions.eligibility(app,m).ok);
});
check('A marker from the previous battle cannot resolve a same-named unit in the current battle',()=>{
 fixture();place();const previous=m;fixture();place();assert.notEqual(previous,m);
 assert(!g.HonroInteractions.use(app,previous));assert(!previous.collected);assert(!m.collected);
});
check('Fixed ledger, array, receiver and Act2 marker targets keep authored coordinates',()=>{
 for(const id of [3,5,9,14]){
  fixture(id);for(const marker of b.honroMarkers.filter(m=>m.action&&m.action!=='rescue')){
   const before=plain(marker),point=g.HonroObjectives.interactionTarget(b,marker);
   assert.equal(point,marker);assert.deepEqual(plain(point),before);
  }
 }
});
fixture();place();const saved=h.profileThrough(6);app.stopBattle();Object.assign(saved,{honroBattle:plain(app.profile.honroBattle)});
// No new save field or marker rebase is needed for pre-fix saves.
app=h.load(saved);app.continue();interactions();refs();
check('Old/current battle Continue derives live rescue points while preserving stored markers and resident pose',()=>{
 assert.deepEqual(plain(m),saved.honroBattle.honroMarkers.find(v=>v.id===m.id));
 assert.equal(target.x,saved.honroBattle.units.find(v=>v.id===m.target).x);assert.equal(target.y,saved.honroBattle.units.find(v=>v.id===m.target).y);
 assert(g.HonroInteractions.eligibility(app,m).ok);assert.equal(livePoint().x,target.x);
});
app.export();const exported=await h.exported();await h.import(exported);app.continue();interactions();refs();
check('File import and repeated Continue keep live-person rescue available without changing authored coordinates',()=>{
 assert.equal(m.x,3000);assert.equal(m.y,2920);assert(g.HonroInteractions.eligibility(app,m).ok);
 assert(g.HonroInteractions.use(app,m));assert(!g.HonroInteractions.use(app,m));
});
let originalSave;
if(process.env.HONRO_RESCUE_SAVE){
 const bytes=await readFile(process.env.HONRO_RESCUE_SAVE),profile=JSON.parse(bytes);
 originalSave={sha256:createHash('sha256').update(bytes).digest('hex'),stage:profile.honroBattle.honroStage,round:profile.honroBattle.round};
 app=h.load(h.profileThrough(0));await h.import(profile);app.continue();interactions();refs();
 const original=profile.honroBattle.units.find(u=>u.id===m.target),originalMarker=profile.honroBattle.honroMarkers.find(v=>v.id===m.id);
 check('Unedited normal stage7 turn2 save imports and rescues Woli through the real App KeyE route',()=>{
  assert.equal(b.honroStage,7);assert.equal(b.round,2);assert.equal(hero.id,'p-knight');assert.equal(target.x,original.x);assert.equal(target.y,original.y);assert.deepEqual(plain(m),originalMarker);
  assert.equal(b.honroState.rescuedCount,1);assert(g.HonroInteractions.eligibility(app,m).ok);assert.equal(livePoint().x,target.x);
  for(const fn of h.listeners.get('keydown')||[])fn({code:'KeyE',repeat:false,target:{tagName:'DIV'},preventDefault(){}});
  assert(m.collected);assert(target.honroResolved);assert.equal(b.honroState.rescuedCount,2);
  assert(!g.HonroInteractions.use(app,m));assert.equal(b.honroState.rescuedCount,2);
 });
}
const source={};for(const file of ['shared/runtime/interactions.js','shared/runtime/objectives.js'])source[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await mkdir('_local/reports/rescue-targets',{recursive:true});await writeFile('_local/reports/rescue-targets/summary.json',JSON.stringify({status:'passed',source,checks,originalSave,limits:['DOM/storage are doubles; actual App input/save and engine interaction code execute.','Position/state variants are fixtures; only the optional genuine save uses unedited real-play state.','No normal campaign clear or actual browser claim.']},null,2)+'\n');
console.log('PASS',checks.length,'live rescue target cases');
