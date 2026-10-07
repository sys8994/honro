// Declared mid-mission fixtures using the production App export/import,
// Continue, loss result and retry paths. DOM/Canvas/storage remain doubles.
// These fixtures are not normal combat wins or browser evidence.
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';

const h=await appHarness(),{g,load,reload,profileThrough,click,finish}=h;
const A=g.HonroAct3,P=g.HonroProgression,checks=[];
let app;
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
function enter(id){
 const p=profileThrough(id-1);
 for(const cls of p.recruited)p.heroes[cls].xp=P.budget(id).start;
 app=load(p);app.launch(id);finish(app);app.turnNotice=null;
 return app.engine.b;
}
function completed(b,count){
 // Explicit earlier-objective fixture, including its persisted gate/marker state.
 const a=A.memory(b);
 for(const s of A.steps(b).slice(0,count)){
  a.done[s.id]=true;A.marker(b,s.id).collected=true;
  for(const id of [s.kind==='destroy'?s.id:null,s.opens].filter(Boolean)){
   const t=b.terrain.find(t=>t.id===id);t.hp=0;t.broken=true;
  }
  a.checkpoints.push({id:s.id,round:b.round,enemyEnd:b.teamEnds[1]});
 }
}
const preserved=['units','terrain','honroMarkers','honroAct3Steps','honroState',
 'honroGrowth','heroes','items','round','teamEnds','phase','side','active','session'];
async function roundTrip(){
 app.export();const exported=await h.exported(),snapshot=plain(exported.honroBattle);
 assert(snapshot,'App export must contain the in-progress battle');
 // The import handler must write storage, then a fresh App must mount Continue.
 await h.import(exported);
 assert.deepEqual(JSON.parse(h.storage.get(KEY)).honroBattle,snapshot);
 app=reload();click('continue');
 assert.equal(app.stage.id,snapshot.honroStage);
 for(const key of preserved)assert.deepEqual(plain(app.engine.b[key]),snapshot[key],`Continue changed ${key}`);
 return snapshot;
}
function retryPreservesReward(before){
 const id=before.honroStage,heroes=plain(before.heroes),limit=plain(before.honroGrowth.limit);
 const ledger=plain(before.honroGrowth.ledger),cleared=plain(app.profile.cleared);
 click('retry');finish(app);app.turnNotice=null;
 const b=app.engine.b;
 assert.equal(app.stage.id,id);assert.equal(b.round,1);
 assert.notEqual(b.session,before.session);
 assert.deepEqual(plain(b.heroes),heroes);
 assert.deepEqual(plain(b.honroGrowth.limit),limit);
 assert.deepEqual(plain(b.honroGrowth.ledger),ledger);
 assert.deepEqual(plain(app.profile.cleared),cleared);
 assert.deepEqual(plain(A.memory(b).done),{});
 assert.deepEqual(plain(A.memory(b).holds),{});
 assert.deepEqual(plain(A.memory(b).escorts),{});
 assert.equal(b.units.filter(u=>u.honroSpawnSource?.startsWith('act3-')).length,0);
 assert(A.heroes(b).every(u=>!u.dead&&u.hp===u.maxHp));
 assert.equal(A.failure(b),null);
 assert.equal(app.profile.honroBattle.session,b.session);
 return b;
}

await check('Mid-hold export/import/Continue preserves one spawned wave and counts each enemy end once',async()=>{
 const b=enter(25);completed(b,1);
 for(const u of app.engine.alive(1)){u.hp=0;u.dead=true;}
 const s=A.current(b),m=A.marker(b,s.id),u=app.engine.heroesAlive()[0];
 Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0});
 g.HonroEncounters.actorEnd(app,u.id);
 assert.equal(A.memory(b).holds[s.id].spawned,s.wave.count);
 b.teamEnds[1]++;A.tick(app,0);
 assert.equal(A.memory(b).holds[s.id].progress,1);
 P.awardCombat(app.engine,u,37);
 const saved=await roundTrip(),restored=app.engine.b;
 const waveIds=restored.units.filter(v=>v.honroSpawnSource==='act3-'+s.id).map(v=>v.id);
 assert.equal(waveIds.length,s.wave.count);
 const growth=plain(restored.honroGrowth),heroes=plain(restored.heroes);
 for(let i=0;i<3;i++)g.HonroEncounters.actorEnd(app,restored.active);
 assert.equal(A.memory(restored).holds[s.id].progress,1);
 assert.deepEqual(restored.units.filter(v=>v.honroSpawnSource==='act3-'+s.id).map(v=>v.id),waveIds);
 assert.deepEqual(plain(restored.honroGrowth),growth);
 assert.deepEqual(plain(restored.heroes),heroes);
 restored.teamEnds[1]++;A.tick(app,0);A.tick(app,0);
 assert.equal(A.memory(restored).holds[s.id].progress,2);
 assert.equal(A.current(restored).id,s.id);
 // Retry must replace objective/wave state while keeping the original ledger.
 retryPreservesReward({...saved,heroes:plain(restored.heroes),honroGrowth:plain(restored.honroGrowth)});
});

await check('Mid-escort export/import/Continue preserves the carrier and advances the same route without duplication',async()=>{
 const b=enter(23);completed(b,A.steps(b).findIndex(s=>s.id==='dock-mid'));
 const npc=app.engine.unit('act3-carrier'),a=A.memory(b),u=app.engine.heroesAlive()[0];
 a.escorts[npc.id]={started:true,waypoints:{'dock-mid':0}};
 npc.fixed=false;npc.moveLeft=npc.maxMove=900;npc.hp-=31;npc.shield=7;
 const x=npc.x+180,y=g.HonroMapEngine.surfaceY(b.terrain,x,npc.y).y;
 Object.assign(u,{x,y,vx:0,vy:0});
 const start=npc.x;A.tick(app,1/60);
 assert(npc.x>start,'Escort must use the live walking path before export');
 P.awardCombat(app.engine,u,29);
 await roundTrip();
 const rb=app.engine.b,rnpc=app.engine.unit(npc.id),before=rnpc.x;
 const checkpoints=plain(A.memory(rb).checkpoints),growth=plain(rb.honroGrowth);
 A.tick(app,0);assert.equal(rnpc.x,before);
 A.tick(app,1/60);assert(rnpc.x>before);
 assert.equal(rb.units.filter(v=>v.id===npc.id).length,1);
 assert.equal(rnpc.hp,npc.hp);assert.equal(rnpc.shield,7);
 assert.equal(A.current(rb).id,'dock-mid');
 assert.deepEqual(plain(A.memory(rb).checkpoints),checkpoints);
 assert.deepEqual(plain(rb.honroGrowth),growth);
 app.export();const saved=(await h.exported()).honroBattle;
 retryPreservesReward(saved);
 const fresh=app.engine.unit(npc.id);
 assert.equal(fresh.hp,fresh.maxHp);assert.equal(fresh.honroProtected,true);
});

await check('Saved fire pressure resumes at the same enemy-turn deadline and loss retry resets only this mission',async()=>{
 const b=enter(27);A.tick(app,0);
 b.teamEnds[1]=7;A.tick(app,0);
 assert.equal(A.memory(b).fireTurns,7);
 P.awardCombat(app.engine,app.engine.active,23);
 await roundTrip();const rb=app.engine.b;
 A.tick(app,0);assert.equal(A.memory(rb).fireTurns,7);
 rb.teamEnds[1]=11;A.tick(app,0);assert.notEqual(rb.phase,'lost');
 rb.teamEnds[1]=12;A.tick(app,0);
 assert.equal(rb.phase,'lost');assert.match(rb.winnerReason,/불길/);
 const before=plain(rb);app.outcome();assert(app.done);
 assert(!app.profile.cleared[27]);assert.equal(app.profile.honroBattle,null);
 const fresh=retryPreservesReward(before);A.tick(app,0);
 assert.equal(A.memory(fresh).fireTurns,0);
});

for(const [id,target,reason] of [[22,'p-knight',/휘겸/],[21,'act3-resident',/주민/],[23,'act3-carrier',/주민/]]){
 await check(`Stage ${id}: saved ${target} loss reaches the App result and retry cannot farm combat XP`,async()=>{
  const b=enter(id),victim=app.engine.unit(target),enemy=app.engine.alive(1)[0];
  P.awardCombat(app.engine,app.engine.active,1e9);
  const heroes=plain(b.heroes),limit=plain(b.honroGrowth.limit);
  app.engine.hurt(victim,1e9,enemy.id);
  assert(victim.dead&&victim.hp===0);
  assert(app.checkMission(app.engine));assert.equal(b.phase,'lost');
  assert.match(b.winnerReason,reason);
  const saved=await roundTrip();
  assert(app.engine.unit(target).dead);assert.equal(app.engine.b.phase,'lost');
  app.outcome();assert(app.done);assert(!app.profile.cleared[id]);
  assert.equal(app.profile.honroBattle,null);
  assert.deepEqual(plain(app.profile.heroes),heroes);
  const fresh=retryPreservesReward(saved);
  assert(app.engine.unit(target).hp>0&&!app.engine.unit(target).dead);
  P.awardCombat(app.engine,app.engine.active,1e9);
  assert.deepEqual(plain(fresh.heroes),heroes,'Retry awarded an exhausted combat budget again');
  assert.deepEqual(plain(fresh.honroGrowth.limit),limit);
 });
}

await report('act3-save-boundaries',checks,{
 scope:'Declared mid-hold/wave, escort, fire-pressure and class/NPC-loss fixtures through production App export/import/Continue/retry. No browser or normal-play claim.',
 authoredMaps:g.HONRO_PROJECT.stages.length
});
console.log('PASS',checks.length,'Act 3 App save/loss/retry boundary fixtures');
