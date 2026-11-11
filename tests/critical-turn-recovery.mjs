/** Focused P0 state-machine fixtures. Real current Stage34/40 geometry/core;
 * declared interrupted flags, casualties and occupied bank isolate recovery.
 * No normal-play / exact-user-save / browser / difficulty claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {buildCore} from '../game/engine/build.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const copy=x=>JSON.parse(JSON.stringify(x)),rows=[];
async function world(){const g=await runtime({legacyMaps:false,productionStory:true});g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));vm.runInContext(await readFile('shared/runtime/act4-pilot-combat.js','utf8'),g);return g;}
function battle(g,n){const s=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n),p=g.HonroMaps.profileFor(s);g.HonroEquipment.migrate(p);return g.HonroMaps.createBattle(s,g.HONRO_PROJECT,p);}
const g=await world(),core=await buildCore(),repair=/            if \(u\.airborne && u\.carriedBy === undefined && !u\.equipmentState\?\.motion && !this\.b\.projectiles\.some\(p => p\.body && p\.owner === u\.id\)\)\s*\n\s*u\.airborne = false;/;
assert(repair.test(core),'baseline removes only the new orphan-flag repair');
function orphan(code){const context=vm.createContext({console,performance,structuredClone});vm.runInContext(code,context);const b=battle(g,34),u=b.units.find(u=>u.id==='archer');b.units=[u];b.projectiles=[];b.volley=undefined;Object.assign(b,{phase:'transition',side:1,turnAge:1,active:u.id});Object.assign(u,{airborne:true,jumping:false,vx:0,vy:0,acted:true});const before={x:u.x,y:u.y,hp:u.hp,focus:u.focus,move:u.moveLeft,xp:u.xp};const e=new context.HONRO_CORE.Engine(b);e.checkEnd=()=>false;for(let i=0;i<180;i++)e.tick(1/120);return{b,u,e,before};}
const old=orphan(core.replace(repair,''));assert.equal(old.b.phase,'transition');assert(old.e.settleBusy());
const fixed=orphan(core);assert.equal(fixed.b.phase,'aim');assert(fixed.e.canAct());assert(!fixed.e.settleBusy());for(const k of['x','y','hp','xp'])assert.equal(fixed.u[k],fixed.before[k],k+' unchanged by orphan recovery');
rows.push({case:'34 interrupted airborne without owned projectile',baseline:'transition remains busy for 180 ticks',fixed:'ordinary supported body resumes, next player turn controllable',hp:fixed.u.hp,scope:'declared interrupted flag on real fresh map, not reported user snapshot'});
// Live body attacks remain projectile-owned. Mount alone never rewrites poses.
{
 const b=battle(g,34),u=b.units.find(u=>u.id==='archer');b.units=[u];Object.assign(u,{airborne:true,jumping:false,vx:0,vy:0});b.projectiles=[{id:999,body:true,owner:u.id}];const e=new g.HONRO_CORE.Engine(b),before=copy(u);assert.equal(u.airborne,true);e.stepUnits(1/120);assert.equal(u.airborne,true);assert.equal(u.x,before.x);assert.equal(u.y,before.y);
 delete u.equipmentState;b.projectiles=[];u.carriedBy='qa-carrier';e.stepUnits(1/120);assert.equal(u.airborne,true,'carried body remains owned');
 rows.push({case:'live body projectile / carried ownership',passed:true});
}
function coastContext(g,source){
 g.HonroScene=class {};g.HonroScene.prototype.render=function(){};g.HonroScene.prototype.landmark=function(){};
 g.document={addEventListener(){},getElementById(){return null;}};g.HONRO_APP_READY={then(){}};
 const alive=u=>u&&!u.dead&&u.hp>0;
 g.HonroAct4TerrainPreview={launch(){},eventAPI:{alive,party:b=>b.units.filter(u=>u.side===0&&alive(u)),memory:b=>b.honroAct4PreviewState}};
 vm.runInContext(source,g);
}
const currentCoast=await readFile('shared/runtime/act4-coast-events.js','utf8');
const previousCoast=execFileSync('git',['show','12fd1e2fa:shared/runtime/act4-coast-events.js'],{encoding:'utf8',maxBuffer:2e6});
function pending(g,{jumping=false,legacy=false,companion=false}={}){
 const b=battle(g,40),u=b.units.find(u=>u.id==='archer'),block=copy(u);Object.assign(block,{id:'qa-bank-occupant',side:2,fixed:true,r:350,h:500,x:2100,y:3700,hp:1000,maxHp:1000,acted:true,jumping:false,airborne:false});
 const other=b.units.find(v=>v.id==='mage');b.units=companion?[u,other,block]:[u,block];if(companion){other.fixed=true;other.x=448;other.y=2100;other.acted=true;}Object.assign(b,{phase:'aim',side:0,round:12,active:u.id,projectiles:[],volley:undefined,queue:[]});Object.assign(u,{x:3000,y:3805,hp:138,shield:0,vx:0,vy:0,jumping,airborne:false,acted:false});
 b.honroAct4PreviewState={version:1,clock:0,events:{},water:{dry:{[u.id]:{x:2090,y:3600}},recoveries:[]}};
 if(legacy){u.honroAct4Recovering={zone:'40-return-inlet',entry:{x:2090,y:3600},side:'Left',damage:Math.ceil(u.maxHp*.25),damaged:false,surface:3762.5,probeWait:.025,closedToken:'11:0'};u.honroAct4RecoverPending=true;}
 const e=new g.HONRO_CORE.Engine(b),realCheck=e.checkEnd.bind(e);e.checkEnd=()=>false;g.HonroAct4TerrainPreview.attachCoast({engine:e,dialogue:null});return{b,u,block,e,realCheck};
}
const oldG=await world();coastContext(oldG,previousCoast);const cycling=pending(oldG);for(let i=0;i<600;i++)cycling.e.tick(1/120);assert(cycling.b.round>15);assert.equal(cycling.u.hp,138);rows.push({case:'40 last survivor occupied bank',baselineRound:cycling.b.round,baselineHp:cycling.u.hp,baseline:'no input, automatic repeated action closure'});
coastContext(g,currentCoast);
const tick=(q,n)=>{for(let i=0;i<n;i++)q.e.tick(1/120);};
// One stranded actor leaves other companions available; no repeated auto turns.
const held=pending(g,{companion:true});tick(held,180);assert(!held.u.jumping);assert(!held.e.settleBusy());assert.equal(held.u.hp,138);assert(held.b.round<=13);assert.notEqual(held.b.phase,'lost');
held.b.active=held.u.id;held.b.phase='aim';held.b.side=0;held.u.acted=false;
assert(held.e.canAct());assert.equal(held.e.fire('A01',40,.5),false);
const main=await readFile('shared/runtime/main.js','utf8'),methods=['canInput','defend'].map(name=>main.split('\n').find(line=>line.trimStart().startsWith(name+'()'))).join(',\n');
g.HonroStory={turnPaused:()=>false};
const controls=vm.runInContext('(function(G){return {'+methods+'}})(globalThis)',g),app={engine:held.e,modal:{classList:{contains:()=>false}},dialogue:null,done:false,cancelInput(){},updateHUD(){}};
app.canInput=controls.canInput.bind(app);assert(app.canInput(),'actual App.canInput accepts controlled pending actor');
controls.defend.call(app);assert(held.u.shield>0,'actual App.defend operates');held.b.active=held.u.id;held.b.phase='aim';held.b.side=0;held.u.acted=false;
const items=held.b.items.heal;assert(held.e.item('heal'));assert.equal(held.b.items.heal,items-1);
const healed=held.u.hp,saved=copy(held.b),growth=JSON.stringify(saved.heroes),restored=new g.HONRO_CORE.Engine(saved);restored.checkEnd=()=>false;g.HonroAct4TerrainPreview.attachCoast({engine:restored,dialogue:null});const ru=restored.unit('archer');for(let i=0;i<180;i++)restored.tick(1/120);assert.equal(ru.hp,healed);assert.equal(JSON.stringify(saved.heroes),growth);assert.notEqual(saved.phase,'lost');
saved.units.find(u=>u.id==='qa-bank-occupant').dead=true;for(let i=0;i<180&&ru.honroAct4Recovering;i++)restored.tick(1/120);assert(!ru.honroAct4Recovering);assert(restored.grounded(ru));assert.equal(healed-ru.hp,Math.ceil(ru.maxHp*.25));assert.equal(saved.honroAct4PreviewState.water.recoveries.length,1);const hp=ru.hp;for(let i=0;i<180;i++)restored.tick(1/120);assert.equal(ru.hp,hp);assert.equal(JSON.stringify(saved.heroes),growth);
rows.push({case:'40 companion can clear bank / item / serialized resume / one penalty',passed:true});
for(const legacy of[false,true]){
 const q=pending(g,{jumping:true,legacy});tick(q,180);assert.notEqual(q.b.phase,'lost','not instant loss before repeated probes');assert(!q.u.jumping);assert(!q.e.settleBusy());tick(q,420);assert.equal(q.b.phase,'lost');assert(q.b.honroAct4PreviewState.failure.includes('모든 동행'));assert.equal(q.u.hp,138);assert.equal(q.b.winnerReason,q.b.honroAct4PreviewState.failure);assert(q.b.round<14);rows.push({case:'last survivor blocked bank: explicit environmental loss after repeated probes',legacy,phase:q.b.phase,hp:q.u.hp,passed:true});
}
const all=pending(g,{companion:true});const companion=all.b.units.find(u=>u.id==='mage');Object.assign(companion,{x:3000,y:3805,fixed:false,honroAct4RecoverPending:true,honroAct4Recovering:{zone:'40-return-inlet',entry:{x:2090,y:3600},side:'Left',damage:Math.ceil(companion.maxHp*.25),damaged:false,surface:3762.5,actionClosed:true}});all.b.honroAct4PreviewState.water.dry[companion.id]={x:2090,y:3600};tick(all,600);assert.equal(all.b.phase,'lost');rows.push({case:'all surviving companions pending cannot wait forever',passed:true});
const transient=pending(g,{jumping:true});tick(transient,120);assert.notEqual(transient.b.phase,'lost');transient.block.dead=true;transient.u.hp=transient.u.maxHp;tick(transient,180);assert(!transient.u.honroAct4Recovering);assert.notEqual(transient.b.phase,'lost');assert.equal(transient.u.hp,transient.u.maxHp-Math.ceil(transient.u.maxHp*.25));rows.push({case:'temporary occupancy cleared before two-second timeout recovers',passed:true});
await mkdir('_local/reports/critical-20261111',{recursive:true});
const orphanFixture=orphan(core.replace(repair,''));
await writeFile('_local/reports/critical-20261111/turn-34-orphan-battle.json',JSON.stringify(orphanFixture.b));
const browserPending=pending(g,{jumping:true,legacy:true});await writeFile('_local/reports/critical-20261111/turn-40-pending-battle.json',JSON.stringify(browserPending.b));
await mkdir('_local/reports/critical-20261111',{recursive:true});await writeFile('_local/reports/critical-20261111/turn-recovery.json',JSON.stringify({scope:'Real model geometry and engine with explicit state/casualty/bank-block fixtures; no exact-user-save or normal gameplay/browser claim.',rows},null,2));console.log('PASS critical turn recovery',rows.map(r=>r.case));
