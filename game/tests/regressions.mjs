import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[];
const check=(name,fn)=>{const detail=fn();checks.push({name,passed:true,...(detail===undefined?{}:{detail})});};
const alive=u=>!u.dead&&u.hp>0;
function free(b,u){const support=C.terrainSurface(b.terrain,u.x,u.y-.1,u.y+.1)?.t;return !g.HonroTerrain.intersects(b,u,u.x,u.y,{padding:u.fixed&&!u.honroCivilian?10:2,support:u.fixed&&!u.honroCivilian?null:support});}
try{
  const stages=[];
  for(let id=1;id<=8;id++){
    const fixture=battlefield(g,id);stages.push(fixture);
    check(`Stage ${id}: every authored actor starts in legal terrain space`,()=>{for(const u of fixture.b.units)assert.ok(free(fixture.b,u),`${u.id}: ${u.x},${u.y}`);return fixture.b.units.length;});
  }
  check('Stage 2 keeps the RC12 low-wide canyon contract',()=>{
    const b=stages[1].b;assert.equal(b.width,6200);assert.equal(b.height,3200);assert.ok(b.terrain.some(t=>t.id==='canyon-ground'));assert.ok(b.terrain.some(t=>t.id==='mid-shelf'));
  });
  check('Low-wide Stage 2 sanitization is idempotent',()=>{
    const b=structuredClone(stages[1].b);const before=JSON.stringify(b);g.HonroStageRules.sanitizeStageBattle(b);const once=JSON.stringify(b);g.HonroStageRules.sanitizeStageBattle(b);assert.equal(JSON.stringify(b),once);assert.equal(b.height,3200);assert.equal(b.width,6200);assert.ok(once.length>=before.length);
  });
  check('An old save embedded in a solid slope recovers once; valid falling actors stay untouched',()=>{
    const {b,e}=battlefield(g,2),u=e.active,other=b.units.find(v=>v.side===1&&!v.fixed);
    delete b.honroContactRevision;u.y+=36;Object.assign(other,{y:other.y-130,vx:12,vy:67,jumping:false});
    const falling=JSON.stringify(other);g.HonroStageRules.sanitizeStageBattle(b);
    assert.ok(free(b,u));assert.equal(JSON.stringify(other),falling);assert.equal(b.honroContactRecoveries.length,1);
    const once=JSON.stringify(b);g.HonroStageRules.sanitizeStageBattle(b);assert.equal(JSON.stringify(b),once);
  });
  for(const [name,grade,gap]of [['uphill',-.65,0],['downhill',.65,0],['seam',-.4,1.5]])for(const dt of [1/240,1/120,1/30,.08]){
    check(`${name}: supported walking at dt=${dt}`,()=>{
      const {b,e}=battlefield(g,1),u=e.active;const t=(id,x,y,w,slope)=>({id,x,y,w,h:2000,mat:'rock',hp:99999,maxHp:99999,slope});
      b.terrain=[t('a',0,1400,300,300*grade),t('b',300+gap,1400+300*grade,1000,1000*grade)];b.units=[u];b.width=1500;b.height=4000;
      Object.assign(u,{x:120,y:1400+120*grade,vx:0,vy:0,moveLeft:3000,jumping:false,airborne:false});
      for(let i=0;i<Math.ceil(2/dt);i++){e.walk(u,1,dt);e.integrateBody(u,dt,true);assert.ok(Math.abs(u.vy)<.001,`fell at ${u.x}: vy=${u.vy}`);const support=e.surface(u.x,u.y-.02,u.y+.02);assert.ok(support,'feet lost support');}
      assert.ok(u.x>400);assert.ok(u.moveLeft>=0);return {x:u.x,y:u.y};
    });
  }
  for(const direction of [-1,1])check(`Real gap/cliff falls and a high wall blocks, direction ${direction}`,()=>{
    const t=(id,x,y,w)=>({id,x,y,w,h:1800,mat:'rock',hp:99999,maxHp:99999});
    for(const cliff of [true,false]){
      const {b,e}=battlefield(g,1),u=e.active;
      b.width=1800;b.height=3200;b.units=[u];b.terrain=direction>0?[t('a',0,1000,500),t('b',cliff?520:500,cliff?1400:750,1200)]:[t('b',0,cliff?1400:750,cliff?480:500),t('a',500,1000,1200)];
      Object.assign(u,{x:direction>0?430:570,y:1000,vx:0,vy:0,jumping:false,airborne:false,moveLeft:1800});
      for(let i=0;i<140;i++){e.walk(u,direction,1/120);e.integrateBody(u,1/120,true);}
      if(cliff){assert.ok(u.y>1080);assert.ok(direction>0?u.x>540:u.x<460);}else{assert.ok(direction>0?u.x<520:u.x>480);assert.equal(u.y,1000);}
    }
  });
  for(const [x,y]of [[438,478],[800,1200],[1300,1800],[1800,3600],[2700,3600],[3250,2550],[3500,900]])check(`Ambush finds free air around (${x},${y})`,()=>{
    const {b,e,app}=battlefield(g,2);Object.assign(e.active,{x,y});
    assert.notEqual(g.HonroAllies.execute(app,{type:'sniperAmbush',n:6}),false);
    const spawned=b.units.filter(u=>u.id.startsWith('sniper-crow-'));assert.equal(spawned.length,6);for(const u of spawned)assert.ok(free(b,u),u.id);
    assert.equal(new Set(spawned.map(u=>u.id)).size,6);
  });
  check('A fully blocked spawn defers atomically without actors, IDs or rewards leaking',()=>{
    const {b,app}=battlefield(g,2);b.terrain=[{id:'solid',x:0,y:0,w:b.width,h:b.height,mat:'rock'}];const before=JSON.stringify([b.units,b.nextId,b.honroCounters]);
    assert.equal(g.HonroAllies.execute(app,{type:'multi',actions:[{type:'sniperAmbush',n:3},{type:'spawn',x:2300,kind:'ghost',n:2}]}),false);
    assert.equal(JSON.stringify([b.units,b.nextId,b.honroCounters]),before);
  });
  check('A cleared stage 2 advances finite encounter waves without waiting for carriage/round gates',()=>{
    const {b,e,app}=battlefield(g,2);b.round=1;b.phase='transition';
    for(const id of ['road-pressure','sniper-seen','right-cliff','last-flight']){
      for(const u of b.units.filter(u=>u.side===1)){u.hp=0;u.dead=true;}
      b.honroState.encounterCooldown=0;
      g.HonroAllies.missionTick(app,1/120);g.HonroEncounters.flush(app);
      assert.equal(b.honroState.flags['event:'+id],true,id);if(id==='road-pressure'||id==='sniper-seen')assert.ok(e.alive(1).length>0);else assert.equal(e.alive(1).length,0);
    }
    assert.equal(g.HonroEncounters.pending(b),false);assert.equal(b.round,1);
    for(const u of e.alive(1)){u.hp=0;u.dead=true;}
    for(let i=0;i<1800;i++)g.HonroAllies.missionTick(app,1/120);
    assert.equal(e.unit('objective').x,b.honroEscortGoalX);
  });
  check('Campaign events do not mutate a finished battle',()=>{
    const {b,app}=battlefield(g,2);b.phase='won';const before=JSON.stringify([b.units,b.honroState,b.events]);g.HonroAllies.missionTick(app,1);assert.equal(JSON.stringify([b.units,b.honroState,b.events]),before);
  });
  const progression=[];let profile=C.defaults();profile.recruited=['archer'];profile.honroGrowth={version:2,stages:{}};
  for(let id=1;id<=8;id++)check(`Stage ${id}: bounded shared XP and completion milestone`,()=>{
    const {b,e,p,st}=battlefield(g,id,{profile,entry:false});const before=b.heroes.archer.xp,cap=g.HonroProgression.budget(id);
    for(const enemy of [...e.alive(1)])e.hurt(enemy,1e7,e.active.id,true);
    for(const ev of b.honroEvents)if(g.HonroEncounters.combat(ev.action)){const result=g.HonroAllies.execute({engine:e,stage:st},ev.action);assert.notEqual(result,false,ev.id);for(const enemy of [...e.alive(1)])e.hurt(enemy,1e7,e.active.id,true);}
    const afterCombat=b.heroes.archer.xp;assert.ok(afterCombat-before<=cap.combat);
    const ledger=b.honroGrowth.ledger;
    for(let i=0;i<30;i++)g.HonroProgression.awardCombat(e,e.active,1e6);
    assert.ok(b.heroes.archer.xp<=before+cap.combat);g.HonroProgression.complete(b);
    assert.equal(b.heroes.archer.xp,cap.end);
    const completed=b.heroes.archer.xp;g.HonroProgression.complete(b);g.HonroProgression.awardCombat(e,e.active,1e6);assert.equal(b.heroes.archer.xp,completed);
    profile=p;profile.heroes=structuredClone(b.heroes);profile.honroGrowth=structuredClone(ledger);profile.cleared[id]={visits:1};
    if(st.recruit){profile.recruited.push(st.recruit);profile.heroes[st.recruit].xp=cap.end;}
    progression.push({stage:id,entry_xp:before,combat_xp:afterCombat-before,combat_budget:cap.combat,exit_xp:cap.end,exit_level:C.levelOf(cap.end),exit_fraction:C.xpFraction({xp:cap.end}),planned_exit:g.HonroProgression.plan(id).exitLevel});
  });
  check('Retries retain combat budget, and existing overleveled saves never lose XP',()=>{
    const {e,p,b}=battlefield(g,1,{entry:false});g.HonroProgression.awardCombat(e,e.active,1e6);p.heroes=structuredClone(b.heroes);p.honroGrowth=structuredClone(b.honroGrowth.ledger);
    const retry=battlefield(g,1,{profile:p,entry:false}),before=retry.b.heroes.archer.xp;g.HonroProgression.awardCombat(retry.e,retry.e.active,1e6);assert.equal(retry.b.heroes.archer.xp,before);
    retry.b.heroes.archer.xp=C.xpAtLevel(5);g.HonroProgression.complete(retry.b);assert.equal(C.levelOf(retry.b.heroes.archer),5);
  });
  check('Five-act schedule reaches 10 at act 1 end and 25 at act 4 stage 3',()=>{assert.equal(progression.at(-1).exit_level,10);assert.equal(g.HONRO_BALANCE.futureActs[2].stageExitLevels[2],25);assert.ok(g.HONRO_BALANCE.futureActs[2].stageExitLevels.slice(0,2).every(l=>l<25));});
  await mkdir(path.join(gameRoot,'../_local/game-reports'),{recursive:true});
  await writeFile(path.join(gameRoot,'../_local/game-reports/progression.json'),JSON.stringify({version:2,progression,futureActs:g.HONRO_BALANCE.futureActs},null,2)+'\n');
}catch(error){checks.push({name:error.message,passed:false,stack:error.stack});process.exitCode=1;}
await writeFile(path.join(gameRoot,'../_local/game-reports/regressions.json'),JSON.stringify({passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks},null,2)+'\n');
console.log(JSON.stringify({passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length},null,2));
if(process.exitCode)console.log(checks.at(-1));
