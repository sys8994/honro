/** Explicit blocked-shore fixture through production App.frame and Continue.
 * DOM/render/clock are doubles; this is a deadlock regression, not campaign victory. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {appHarness,KEY} from './app-regression-helpers.mjs';
const expectedBlocked=process.env.HONRO_EXPECT_WATER_DEADLOCK==='1';
const out=process.env.HONRO_WATER_DEADLOCK_OUT||'_local/reports/water-recovery-blocked-app';
const rows=[];
for(const mode of expectedBlocked?['fixed','moving']:['fixed','moving','legacy-continue']){
 const fixed=mode!=='moving';
 const h=await appHarness();let now=0;h.g.performance={now:()=>now};let app=h.load(h.profileThrough(4));app.launch(5);h.finish(app);app.close();app.scene.render=()=>{};
 let e=app.engine,b=e.b;const heroes=e.heroesAlive(),w=b.waters.find(w=>w.id==='stage5-plunge-pool');
 const blockers=[e.unit('s5-entry-hound'),e.unit('s5-cave-hound')];
 // Only the two nominated blockers remain. No combat stats are modified.
 b.units=b.units.filter(u=>heroes.includes(u)||blockers.includes(u)||u.honroObjectiveTarget);
 for(const [i,v]of blockers.entries())Object.assign(v,{x:w.policy.shores.left[i].x,y:2860,fixed,awake:true,aggroUntil:999});
 const hp=Object.fromEntries(heroes.map(u=>[u.id,u.hp]));
 for(const [i,u]of heroes.entries())Object.assign(u,{x:4200+i*70,y:3000,waterEntrySides:{[w.id]:'left'},acted:false,vx:0,vy:0});
 e.tick(0);const entry=heroes.map(u=>({id:u.id,hp:u.hp,expectedLoss:Math.ceil(u.maxHp*.25),recovery:{...u.waterRecovery}}));
 for(const u of heroes){assert.equal(u.hp,hp[u.id]-Math.ceil(u.maxHp*.25));assert(u.waterRecovery);assert.equal(u.moveLeft,0);}
 if(mode==='legacy-continue'){
  // Observed pre-fix Continue shape: round2 aim owns a pending, unacted hero.
  app.stopBattle();const legacy=JSON.parse(h.storage.get(KEY)),old=legacy.honroBattle;
  Object.assign(old,{round:2,phase:'aim',side:0,active:'p-archer',teamEnds:[1,1,0]});
  for(const u of old.units.filter(u=>u.side===0)){u.acted=false;u.moveLeft=u.maxMove;u.waterRecovery.elapsed=2;u.x=u.waterRecovery.entryX-24;u.y=w.y+u.h*.45;}
  app=h.load(legacy);app.continue();h.finish(app);app.close();app.scene.render=()=>{};app.prev=now;e=app.engine;b=e.b;
 }
 let ticks=0,frames=0,continued=false,continuedHP,readyFrames=0,firstReturn=null;const hurtEvents=[];const phases=new Set();
 function hook(){const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const before=u.hp,r=hurt(u,...args);if(u.hp<before)hurtEvents.push({tick:ticks,round:e.b.round,target:u.id,loss:before-u.hp,amount:args[0],owner:args[1]?.id||args[1],origin:args[3]});return r;};const tick=e.tick.bind(e);e.tick=dt=>{ticks++;const r=tick(dt);for(const u of e.heroesAlive())if(!u.waterRecovery&&u.x<=w.x&&u.y>=2820&&firstReturn===null)firstReturn={tick:ticks,id:u.id,x:u.x,y:u.y,supported:h.C.validTerrainContactPose(e.b.terrain,u),acted:u.acted,moveLeft:u.moveLeft};return r;};}
 hook();
 while(ticks<1201&&frames<6000&&!app.done){
  now+=1000/120;app.frame(now);frames++;assert(!app.lastError,app.lastError);if(app.dialogue)h.finish(app);phases.add(e.b.phase);if(e.canAct())readyFrames++;
  if(ticks>=240&&!continued){app.stopBattle();const saved=JSON.parse(h.storage.get(KEY));continuedHP=saved.honroBattle.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp,pending:!!u.waterRecovery}));app=h.load(saved);app.continue();h.finish(app);app.close();app.scene.render=()=>{};app.prev=now;e=app.engine;b=e.b;hook();continued=true;}
 }
 const alive=e.heroesAlive(),softlocked=b.phase==='aim'&&alive.length>0&&alive.every(u=>!!u.waterRecovery)&&!e.canAct();
 const row={mode,fixed,actualEngineTicks:ticks,appFrames:frames,continued,continuedHP,entry,firstReturn,readyFrames,round:b.round,phase:b.phase,teamEnds:b.teamEnds,softlocked,hurtEvents,heroes:alive.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,acted:u.acted,moveLeft:u.moveLeft,recovery:u.waterRecovery})),phases:[...phases]};rows.push(row);
 if(expectedBlocked)assert(softlocked,'baseline should reproduce pending aim deadlock');else{assert(ticks>=1201&&ticks<=1203,'full App >=1201 engine ticks');assert(continued,'Continue exercised');assert(!softlocked,'no pending-only aim turn');assert(firstReturn?.supported,'same-bank low contact becomes available');assert(firstReturn.acted&&firstReturn.moveLeft===0,'return preserves consumed action, including legacy Continue');assert(readyFrames>0,'a recovered hero becomes controllable');}
}
await mkdir(out,{recursive:true});await writeFile(out+'/result.json',JSON.stringify({source:process.env.HONRO_WATER_SOURCE||'working tree',expectedBlocked,scope:'Explicit two-shore-blocker fixture. Production App.frame, save storage, Continue and at least1201 engine ticks; DOM/render/clock doubles. No claim of normal campaign victory.',rows},null,2));console.log(JSON.stringify({expectedBlocked,rows},null,2));
