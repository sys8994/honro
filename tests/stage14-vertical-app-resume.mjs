/** Production App export/file-import/Continue on the fresh authored map.
 * Prerequisite completion, hero arrival and entry blockers are explicit
 * fixtures. DOM/Canvas/storage/time are doubles. This is not normal play. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {authorStage14Vertical} from '../tools/map-forge/apply-stage14-vertical.mjs';

const h=await appHarness(),{g,C}=h;
if(!g.HonroStage14Vertical)vm.runInContext(await readFile('shared/runtime/stage14-vertical.js','utf8'),g);
const S=g.HonroStage14Vertical,A=g.HonroAct2,base=plain(g.HONRO_PROJECT),project=await authorStage14Vertical(base,g,{art:false});
const oldStage=JSON.parse(await readFile('tests/fixtures/vertical-stages/before-stages.json','utf8')).stages.find(s=>s.metadata.stageId===14);
let now=10000;g.performance={now:()=>now};const rows=[],checkpoints=[];
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const record=(app,label)=>{const b=app.engine.b,m=b.honroState.vertical14;checkpoints.push({label,stage:b.honroStage,phase:b.phase,round:b.round,serial:b.honroState.actorTurnSerial||0,queue:[...b.queue],warnings:plain(m?.warnings||{}),entries:plain(m?.entries||{}),growthHash:hash(b.honroGrowth),wholeBattleHash:hash(b)});};
function ready({old=false,blocked=false}={}){g.HONRO_PROJECT=plain(old?base:project);if(old)g.HONRO_PROJECT.stages[13]=plain(oldStage);const profile=h.profileThrough(13);for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(14).entryLevel);profile.seen['act2:first-spirit-encounter']=true;
 const app=h.load(profile);app.launch(14);h.finish(app);now+=2000;if(old)return app;
 const b=app.engine.b,a=A.memory(b);for(const step of A.steps(b)){if(step.id==='hold-refuge')break;a.done[step.id]=true;}a.events['story:hold-refuge']=true;a.holds={'hold-refuge':{progress:0,spawned:0,lastRound:b.round,enteredRound:b.round,continuous:true}};
 b.terrain.find(t=>t.id==='gate-bridge').broken=true;const marker=b.honroMarkers.find(m=>m.id==='hold-refuge'),u=app.engine.heroesAlive()[0];Object.assign(u,{x:marker.x,y:marker.y,acted:false,airborne:false,jumping:false,vx:0,vy:0});b.active=u.id;b.phase='aim';b.side=0;
 if(blocked){const at=b.honroVerticalStage14Spec.entries[S.sources[0]];b.stakes=[at,...at.alternates].map((p,i)=>({id:700+i,x:p.x,y:p.y,active:true,expires:999}));}
 assert(C.validTerrainContactPose(b.terrain,u),'Supported fixture arrival');assert(app.canInput());S.prepareWaves(app);return app;
}
async function continued(app,label,{imported=false}={}){app.export();const saved=await h.exported(),expected=plain(saved.honroBattle),dialogue=app.dialogue?plain(app.dialogue):null;
 const next=imported?h.load(h.profileThrough(13)):h.load(saved);if(imported){await h.import(saved);assert.equal(next.engine,null,'File import returns to title');assert(next.profile.honroBattle);}
 // The current default map can change while the saved snapshot stays frozen.
 g.HONRO_PROJECT=plain(project);next.continue();assert.deepEqual(plain(next.engine.b),expected,label+' whole battle exact');if(dialogue)assert.deepEqual(plain(next.dialogue),dialogue,label+' dialogue exact');now+=1000;record(next,label);return next;
}
function finishAction(app,id){for(let i=0;i<600&&!app.engine.unit(id).acted;i++){now+=C.STEP*1000;app.engine.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);g.HonroStory.tick(app,now);}assert(app.engine.unit(id).acted,'Production review must finish');}

for(const imported of [false,true]){
 let app=ready(),b=app.engine.b,m=S.memory(b);assert(m.warnings[S.sources[0]]&&!m.warnings[S.sources[0]].opportunity);assert.equal(app.engine.alive(1).length,43);assert.equal(app.engine.alive(1).filter(u=>u.elite).length,10);assert.equal(g.HonroEncounters.populationCap(b),55);
 assert(A.entry(app,{interlude:false}).some(line=>line[1]===b.honroVerticalStage14Content.guide),'Entry uses frozen vertical guide');
 app=await continued(app,`warned ${imported?'file-import':'Continue'}`,{imported});const id=app.engine.active.id;assert(app.canInput());app.defend();assert.equal(app.engine.b.phase,'review');assert(!S.memory(app.engine.b).warnings[S.sources[0]].opportunity);
 app=await continued(app,`unfinished review ${imported?'file-import':'Continue'}`,{imported});finishAction(app,id);b=app.engine.b;m=S.memory(b);assert(m.warnings[S.sources[0]].opportunity);assert.equal(m.entries[S.sources[0]].ids.length,3);assert.equal(A.memory(b).holds['hold-refuge'].spawned,3);assert(!m.warnings[S.sources[1]].opportunity);
 for(const u of b.units.filter(u=>u.honroSpawnSource===S.sources[0]))assert.equal(u.xpBudget,Math.max(1,Math.round(b.honroGrowth.limit.combat*u.honroXpWeight/b.honroGrowth.weight)));
 const count=b.units.length;app=await continued(app,`entered ${imported?'file-import':'Continue'}`,{imported});app=await continued(app,`entered repeat ${imported?'file-import':'Continue'}`,{imported});for(let i=0;i<5;i++)app.missionTick(0);assert.equal(app.engine.b.units.length,count);assert.equal(app.engine.b.honroCounters.spawned,3);rows.push({case:imported?'fresh-file-import':'fresh-continue',passed:true,checkpoints:4});console.log('PASS',rows.at(-1).case);
}

for(const imported of [false,true]){
 let app=ready({blocked:true}),id=app.engine.active.id;app.defend();finishAction(app,id);const b=app.engine.b,m=S.memory(b);assert(m.warnings[S.sources[0]].opportunity);assert.equal(m.warnings[S.sources[0]].status,'blocked');assert(!m.entries[S.sources[0]]);assert.equal(b.honroCounters.spawned,0);
 // Partial awards are a save-compatibility fixture, never a reward grant.
 const enemy=app.engine.alive(1)[0];enemy.xpGranted=Math.min(7,enemy.xpBudget);b.honroGrowth.ledger.stages[14].combat.archer=enemy.xpGranted;
 app=await continued(app,`blocked/paid ${imported?'file-import':'Continue'}`,{imported});app=await continued(app,`blocked/paid repeat ${imported?'file-import':'Continue'}`,{imported});assert.equal(app.engine.b.honroCounters.spawned,0);assert.equal(app.engine.unit(enemy.id).xpGranted,enemy.xpGranted);rows.push({case:imported?'blocked-paid-file-import':'blocked-paid-continue',passed:true,checkpoints:2});console.log('PASS',rows.at(-1).case);
}

for(const imported of [false,true]){
 let app=ready({old:true});assert(!S.active(app.engine.b));assert(!app.engine.b.honroState.vertical14);const before=plain(app.engine.b.units);
 app=await continued(app,`old14 ${imported?'file-import':'Continue'} under new defaults`,{imported});app=await continued(app,`old14 repeat ${imported?'file-import':'Continue'}`,{imported});assert(!S.active(app.engine.b));assert(!app.engine.b.honroState.vertical14);assert.equal(g.HonroEncounters.populationCap(app.engine.b),40);assert.deepEqual(plain(app.engine.b.units),before);assert.deepEqual(plain(A.steps(app.engine.b)),oldStage.initialState.honroAct2Steps);rows.push({case:imported?'old14-file-import':'old14-continue',passed:true,checkpoints:2});console.log('PASS',rows.at(-1).case);
}

await mkdir('_local/reports/vertical-stages',{recursive:true});
await writeFile('_local/reports/vertical-stages/stage14-app-resume.json',JSON.stringify({passed:true,rows,checkpoints,scope:'Real App launch/defend/export/file-import/Continue, complete battle equality. Explicit objective/arrival/blocker/partial-award setup; DOM, Canvas, storage and clock are doubles. No normal arrival, normal-resource completion, browser or tactical-quality claim.'},null,2)+'\n');
