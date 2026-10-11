/**
 * Production App/runtime contracts for the approved quest and story redesign.
 * One appHarness VM; DOM/Canvas/audio/storage are harness doubles.
 * Prerequisites, arrival positions, one fallen companion, clear flight space,
 * projectile start coordinates and final binding damage are explicit fixtures.
 * These checks do not establish normal-resource traversal/combat, visual quality,
 * actual browser behavior, deployed Pages behavior or campaign difficulty.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appHarness,plain,KEY,report} from './app-regression-helpers.mjs';

const provenance={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim(),sha256:{}};
for(const file of ['shared/build.mjs','shared/data/campaign.json','shared/data/narrative-legacy-v0.json','shared/runtime/main.js','shared/runtime/route-branches.js','shared/runtime/narrative-revision.js','shared/runtime/act2.js','shared/runtime/act3-objectives.js','shared/runtime/story.js','shared/runtime/story-staging.js','shared/runtime/story-direction.js','shared/engine/src/enemyAI.ts','shared/map/compiler.js','tools/map-forge/act23-quest-redesign.mjs','tests/app-regression-helpers.mjs','tests/quest-redesign-app-contracts.mjs'])provenance.sha256[file]=createHash('sha256').update(await readFile(file)).digest('hex');

const h=await appHarness(),{g,C}=h,R=g.HonroRouteBranches;
const checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
function fresh(stage,through=stage-1){
  const profile=h.profileThrough(through);
  profile.seen['act2:first-spirit-encounter']=true;
  const app=h.load(profile);
  app.launch(stage);
  h.finish(app);
  app.turnNotice=null;
  return app;
}
const chapter=b=>b.honroStage>=21?g.HonroAct3:g.HonroAct2;
function quiet(app){
  const b=app.engine.b;
  b.honroState.storyQueue=[];
  b.honroState.deferredStory=[];
  b.honroStory=null;
}
function satisfyFixture(app,choice){
  const b=app.engine.b,A=chapter(b),a=A.memory(b);
  const route=b.honroRouteSpec.routes.find(r=>r.id===choice);
  for(const id of b.honroRouteSpec.common)a.done[id]=true;
  for(const id of route.requiresDone||[])a.done[id]=true;
  for(const id of route.requiresTerrainOpen||[])b.terrain.find(t=>t.id===id).broken=true;
  for(const id of route.requiresTerrainActive||[])b.terrain.find(t=>t.id===id).broken=false;
  for(const id of route.defeatIds||[])Object.assign(b.units.find(u=>u.id===id),{hp:0,dead:true});
  if(b.honroStage===12){
    b.honroState.quarry.signStoryId='contract-sign-finished';
    b.honroStaging.once['contract-sign-finished']='done';
  }
  return route;
}
function arrive(app,choice,hero=app.engine.heroesAlive()[0]){
  const b=app.engine.b,r=b.honroRouteSpec.routes.find(r=>r.id===choice);
  const marker=b.honroMarkers.find(m=>m.id===r.markerId);
  Object.assign(hero,{x:marker.x,y:marker.y});
  return hero;
}
function routeStep(b){return chapter(b).steps(b).find(s=>s.kind==='route');}
function win15(app,choice){
  quiet(app);
  satisfyFixture(app,choice);
  arrive(app,choice);
  assert(R.commit(app,routeStep(app.engine.b)));
  assert.equal(app.engine.b.honroRouteChoice.selectedRoute,choice);
  assert(app.checkMission(app.engine));
  assert.equal(app.engine.b.phase,'won');
  app.outcome(true);
  return app.engine.b;
}

for(const stage of [13,16,30])for(const choice of ['A','B'])check(
  `Stage ${stage}/${choice}: full-roster entry and moved enemies survive initial sanitizer exactly`,()=>{
    const profile=C.defaults();
    profile.recruited=g.HonroStageRules.stageParty(stage);
    for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(stage).entryLevel);
    profile.honroRouteHandoff={revision:1,fromStage:stage-1,toStage:stage,choice,sourceRun:'contract-entry-run'};
    const b=g.HonroWorld.build(g.HONRO_CONTENT.stages[stage-1],profile,false,'archer','A01');
    const wanted=b.honroEntryVariants.variants[choice];
    const ids=new Set([...b.units.filter(u=>u.side===0).map(u=>u.id),...wanted.units.map(u=>u.id)]);
    const poses=()=>plain(b.units.filter(u=>ids.has(u.id)).map(u=>({id:u.id,x:u.x,y:u.y})));
    const before=poses();
    assert.equal(b.honroEntryVariant.choice,choice);
    for(const p of wanted.heroes){
      const u=b.units.find(u=>u.side===0&&u.cls===p.cls);
      assert.equal(u.x,p.x);assert.equal(u.y,p.y);
      assert(C.validTerrainContactPose(b.terrain,u));
    }
    g.HonroStageRules.sanitizeStageBattle(b);
    assert.deepEqual(poses(),before,'Initial unit overlap must not silently move an entered actor');
  });

for(const stage of [12,15,29])for(const choice of ['A','B'])check(
  `Stage ${stage}/${choice}: common scene gate, one arrival, one fallen companion and production victory`,()=>{
    const app=fresh(stage),b=app.engine.b;
    quiet(app);
    const hero=arrive(app,choice);
    assert.equal(R.commit(app,routeStep(b)),false,'C is mandatory');
    assert.equal(app.checkMission(app.engine),false);
    assert.equal(b.phase,'aim','Missing common work is unfinished, not a new failure');
    satisfyFixture(app,choice);
    const lastCommon=b.honroRouteSpec.common.at(-1);
    const scene=`act${stage>=21?3:2}-${stage}-${lastCommon}`;
    b.honroState.storyQueue=[['서술','Unread common scene fixture',{storyId:'contract:'+scene}]];
    assert.equal(R.commit(app,routeStep(b)),false,'Unread common evidence precedes exit');
    b.honroState.storyQueue=[];
    const fallen=app.engine.heroesAlive().find(u=>u.id!==hero.id);
    fallen.hp=0;fallen.dead=true;
    assert(R.commit(app,routeStep(b)));
    assert.equal(b.honroRouteChoice.selectedRoute,choice);
    assert(app.engine.alive(1).length>0,'Unrelated enemies deliberately remain alive');
    assert(app.checkMission(app.engine));
    assert.equal(b.phase,'won','Existing any-alive arrival does not become all-heroes arrival');
  });

for(const stage of [12,15,29])check(`Stage ${stage}: split-party simultaneous exits and idempotent choice`,()=>{
  const app=fresh(stage),b=app.engine.b;
  quiet(app);satisfyFixture(app,'A');satisfyFixture(app,'B');
  const [first,second]=app.engine.heroesAlive();
  arrive(app,'A',first);arrive(app,'B',second);b.active=second.id;
  assert(R.commit(app,routeStep(b)));
  assert.equal(b.honroRouteChoice.selectedRoute,'B','Current actor wins simultaneous valid arrivals');
  const committed=JSON.stringify(b);
  assert(R.commit(app,routeStep(b)));
  assert.equal(JSON.stringify(b),committed,'A repeated boundary cannot rewrite choice, dialogue or checkpoint');
});

{
  let app=fresh(15);
  const sourceRun=win15(app,'A').session;
  let saved=JSON.parse(h.storage.get(KEY));
  check('Winning route is persisted before the result button is pressed',()=>{
    assert.equal(saved.honroBattle,null);
    assert.equal(saved.honroRouteHandoff.choice,'A');
    assert.equal(saved.honroRouteHandoff.sourceRun,sourceRun);
  });
  app=h.load(saved);app.continue();h.finish(app);app.launch(16);h.finish(app);
  check('Reloaded victory enters the adjacent authored A variant and consumes the handoff',()=>{
    assert.equal(app.engine.b.honroEntryVariant.choice,'A');
    assert.equal(app.engine.b.honroEntryVariant.sourceRun,sourceRun);
    assert(!app.profile.honroRouteHandoff);
  });
  app.export();saved=await h.exported();const expected=plain(saved.honroBattle);
  app=h.load(saved);app.continue();
  check('Entered variant retains the exact whole battle through production Continue',()=>{
    assert.deepEqual(plain(app.engine.b),expected);
  });
  h.finish(app);h.click('retry');h.finish(app);
  check('Next-chapter retry keeps its originally entered variant after handoff consumption',()=>{
    assert.equal(app.engine.b.honroEntryVariant.choice,'A');
    assert.equal(app.engine.b.honroEntryVariant.sourceRun,sourceRun);
  });
  app=fresh(15,30);win15(app,'B');
  check('Ordinary replay result does not rewrite the campaign handoff',()=>{
    assert(app.engine.b.honroJourneyReplay);
    assert(!app.profile.honroRouteHandoff);
    assert(app.modal.innerHTML.includes('route-continue'));
    h.click('result-continue');
    assert(!app.profile.honroRouteHandoff);
  });
  app=fresh(15,30);const replayRun=win15(app,'B').session;
  h.click('route-continue');h.finish(app);
  check('Explicit production replay continuation enters the next chapter through B',()=>{
    assert.equal(app.engine.b.honroStage,16);
    assert.equal(app.engine.b.honroEntryVariant.choice,'B');
    assert.equal(app.engine.b.honroEntryVariant.sourceRun,replayRun);
  });
}

check('Legacy chapter 3 retains its untriggered ledger and event functions',()=>{
  const app=fresh(3),b=app.engine.b;
  assert.equal(g.HonroStoryContent.interaction(app,{action:'ledger'}).filter(l=>l[2]?.kind==='document').length,1);
  delete b.honroNarrativeRevision;delete b.honroNarrativeContent;
  const old=g.HonroStoryContent.interaction(app,{action:'ledger'});
  assert.equal(old.filter(l=>l[2]?.kind==='document').length,2);
  assert.deepEqual(plain(old),plain(g.HonroStoryContentV0.interaction(app,{action:'ledger'})));
  assert.deepEqual(plain(g.HonroStoryContent.eventLines(app,{id:'transfer'})),plain(g.HonroStoryContentV0.eventLines(app,{id:'transfer'})));
});
check('Legacy chapter 9 retains its untriggered first-receiver scene descriptor',()=>{
  const app=fresh(9),b=app.engine.b;
  delete b.honroNarrativeRevision;delete b.honroNarrativeContent;
  const id=g.HonroStoryStaging.ID;
  const result=g.HonroStoryStaging.opening(app,[['서술','Compatibility fixture',{stagingRequest:{id,context:{marker:'receiver-west'}}}]],{});
  assert.deepEqual(plain(result.lines.map(l=>l.slice(0,2))),plain(g.HONRO_NARRATIVE_V0.firstReceiverScene.steps.at(-1).lines.map(l=>l.slice(0,2))));
});
check('Chapter 19 presents all available free-order meetings and the nearest eligible action',()=>{
  const app=fresh(19),b=app.engine.b,A=g.HonroAct2,a=A.memory(b);
  const u=app.engine.heroesAlive().find(u=>u.cls==='occultist'),m=b.honroMarkers.find(m=>m.id==='separate-3');
  a.done.route=true;b.honroMarkers.find(m=>m.id==='route').collected=true;
  b.active=u.id;Object.assign(u,{x:m.x,y:m.y});
  let view=g.HonroObjectives.state(b,app.stage);
  assert.equal(view.currentObjectiveId,'separate-3');
  assert.deepEqual(plain(view.targets.map(t=>t.id).sort()),['separate-1','separate-2','separate-3']);
  assert(view.summary.includes('세 만남은 자유 순서'));
  a.done['separate-3']=true;m.collected=true;
  view=g.HonroObjectives.state(b,app.stage);
  assert.equal(view.currentObjectiveId,'send-3');
  assert(view.targets.some(t=>t.id==='send-3'));
});
check('Chapter 12 queues the saved remote-mage narration instead of shadowing it with a snapshot',()=>{
  const app=fresh(12),b=app.engine.b,e=app.engine;
  const m=b.honroMarkers.find(m=>m.id==='sign'),u=e.heroesAlive().find(u=>u.cls==='archer');
  b.active=u.id;Object.assign(u,{x:m.x,y:m.y});
  for(const other of b.units)if(other!==u){other.x=100;other.y=100;}
  const speeches=[];app.sayLines=lines=>speeches.push(...lines);
  assert(g.HonroAct2.use(app,m));
  assert.equal(b.honroState.quarry.signMageNear,false);
  assert(speeches.some(l=>l[1].includes('담허의 설명을 따라')));
  assert(!speeches.some(l=>l[1].includes('담허가 겹친')));
});
check('Chapter 12 flying route guard limits voluntary pursuit through real stepUnits',()=>{
  const app=fresh(12),b=app.engine.b,e=app.engine,bat=e.unit('sq-g3'),guard=bat.honroRouteGuard;
  Object.assign(bat,{x:guard.x-645,y:guard.y,acted:false,moveLeft:280});
  b.terrain=[];b.units=[bat];b.active=bat.id;b.side=1;b.phase='enemy';
  bat.aiMove={round:b.round,targetId:'clear-space-fixture',path:[{x:bat.x-100,y:bat.y,jump:false}],index:0,elapsed:0,stalled:0,lastX:bat.x,lastY:bat.y,jumping:false,intent:'Flight contract fixture'};
  e.stepUnits(.1);
  assert(Math.hypot(bat.x-guard.x,bat.y-guard.y)<=guard.radius);
  assert(bat.x<guard.x-645,'The real flight path moved before stopping at the guard boundary');
});

{
  let app=fresh(10),b=app.engine.b,e=app.engine,boss=e.unit('boss');
  let target=b.terrain.find(t=>t.id===g.HonroNarrativeRevision.bindingId);
  const initialBodyHp=boss.hp;
  function arrowAt(x,y){
    const u=e.heroesAlive().find(u=>u.cls==='archer');
    b.active=u.id;b.phase='aim';b.side=0;
    Object.assign(u,{acted:false,retreat:false,airborne:false,cooldowns:{}});
    assert(e.fire(C.baseSkill('archer'),0,.5));
    const projectile=b.projectiles[0];
    Object.assign(projectile,{x,y,vx:1000,vy:0,gravityScale:0,drag:0});
    return projectile;
  }
  check('Sodan body remains undamaged by an actual arrow collision before cooperation',()=>{
    const projectile=arrowAt(boss.x-boss.r-15,boss.y-boss.h*.5);
    e.stepProjectile(projectile,.05);
    assert.equal(boss.hp,initialBodyHp);
  });
  check('A real arrow collision damages the separate binding and records its response',()=>{
    b.projectiles=[];
    const before=target.hp,projectile=arrowAt(target.x-15,target.y+target.h*.5);
    e.stepProjectile(projectile,.05);
    assert(target.hp<before);
    assert.equal(boss.hp,initialBodyHp);
    assert(b.honroState.sodanBinding.hitCount>=1);
  });
  e.damageTerrain(target,target.hp+1,0,b.active);
  b.projectiles=[];app.actorBoundary=b.active;
  g.HonroMission.finale(app);
  assert.equal(b.honroState.sodanBinding.phase,'offering');
  assert(app.dialogue||b.honroState.storyQueue?.length);
  assert(!b.honroState.sodanCoop);
  g.HonroStory.save(app);
  const saved=JSON.parse(h.storage.get(KEY));
  app=h.load(saved);app.continue();b=app.engine.b;e=app.engine;boss=e.unit('boss');
  check('Offering-story save resumes before cooperation and real Story completion accepts it',()=>{
    assert.equal(b.honroState.sodanBinding.phase,'offering');
    assert(!b.honroState.sodanCoop);
    h.finish(app);
    assert.equal(b.honroState.sodanBinding.phase,'accepted');
  });
  app.actorBoundary=b.active;g.HonroMission.finale(app);h.finish(app);
  check('Accepted cooperation enters protection and restores hostile damage to Sodan',()=>{
    assert(b.honroState.sodanCoop);
    assert.equal(b.honroState.sodanBinding.phase,'protecting');
    assert.equal(boss.side,2);
    const hp=boss.hp;e.hurt(boss,200,e.alive(1)[0].id);
    assert(boss.hp<hp);
  });
}

await report('quest-redesign-app-contracts',checks,{provenance,
  scope:'One production App/runtime harness VM with actual authored maps and explicit contract fixtures.',
  limits:[
    'DOM, Canvas, audio, storage and frame scheduling are harness doubles.',
    'Prerequisites, arrival positions, one fallen companion, clear flight space, projectile starting coordinates and final binding damage are explicit fixtures.',
    'This does not establish normal-resource traversal or combat, visual clarity, browser input, deployed Pages behavior, campaign difficulty or aggregate verify success.'
  ]
});
console.log(`PASS ${checks.length} quest/story production contract groups; normal-resource play and browser/deployment verification remain separate.`);
