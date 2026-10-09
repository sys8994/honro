/** Live optional-skill prefix. Same production controller inputs and legitimate
 * campaign-earned entry fixture as basic fullplay; no tactical pose injection.
 * Only this mode buys M04/M11 before entry. Neither is fired in this prefix. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
process.env.HONRO_FULLPLAY_ROLE_PREFIX='1';
process.env.HONRO_FULLPLAY_OUT||='_local/reports/stage18-bell/live-role-choice';
if(process.env.HONRO_LIVE_ROLE_REUSE!=='1')await import('./stage18-bell-fullplay.mjs');
const out=process.env.HONRO_FULLPLAY_OUT,result=JSON.parse(await readFile(`${out}/result.json`,'utf8')),checkpoint=JSON.parse(await readFile(`${out}/role-prefix.json`,'utf8'));
assert.equal(result.readinessXP,46235);assert.equal(result.readinessLevel,14);assert(result.done['clear-wards']&&result.done.silence);assert(!result.done['hold-silence']);
const b=checkpoint.profile.honroBattle,mage=b.units.find(u=>u.id==='p-mage'),rear=b.units.filter(u=>u.honroCohort==='court-support'&&!u.dead);
assert(rear.some(u=>u.id==='sb-b-high'));assert.deepEqual(mage.loadout,['M01','M04','M11','M03']);assert(Object.values(mage.ranks).every(n=>n===1));assert(checkpoint.actions.filter(a=>a.op==='fire').every(a=>['A01','M01','O01','S00'].includes(a.skill)));assert.deepEqual(b.items,checkpoint.initial.battle.items);
const summary={scope:'Actual native App new-entry → nine-front clear → silence E with legal rank-one optional loadout; branching skill comparison is separate.',entryXp:result.readinessXP,entryLevel:result.readinessLevel,round:result.round,mage:{x:mage.x,y:mage.y,hp:mage.hp,focus:mage.focus,loadout:mage.loadout,ranks:mage.ranks},aliveRear:rear.map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),entryTraining:result.trainingBudget.mage,sourceHash:result.sourceHash,gameplayProjectSha256:result.gameplayProjectSha256,checkpoint:`${out}/role-prefix.json`};
await writeFile(`${out}/prefix-summary.json`,JSON.stringify(summary,null,2));console.log('LIVE_ROLE_PREFIX',JSON.stringify(summary));

// Advance the actual saved App through the remaining companions and enemy turn.
// The common export below is the only starting point for all three branches.
const {appHarness,plain}=await import('./app-regression-helpers.mjs'),vm=await import('node:vm'),{createHash}=await import('node:crypto');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
async function open(profile){
 const h=await appHarness(),{g,C}=h;vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);assert.equal(hash(g.HONRO_PROJECT),checkpoint.sourceHash,'Live choice uses the same canonical source as its normal prefix');
 let clock=0;g.performance={now:()=>clock};const app=h.load(plain(profile));app.continue();const e=app.engine,b=e.b,inputs=[],damage=[],contacts=[],hits=[],trajectory=[];let frames=0;
 const originalHurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,result=originalHurt(u,...args);if(u.hp<hp)damage.push({frame:frames,round:b.round,target:u.id,owner:args[1],amount:hp-u.hp,remaining:u.hp});return result;};
 const originalImpact=e.impact.bind(e);e.impact=(p,hit)=>{if(p.owner==='p-mage'){if(hit.terrain)contacts.push({frame:frames,id:hit.terrain.id,x:hit.x,y:hit.y,bounces:p.bounces});if(hit.unit)hits.push({frame:frames,id:hit.unit.id,bounces:p.bounces});}return originalImpact(p,hit);};
 const mage=()=>e.unit('p-mage'),marker=b.honroMarkers.find(m=>m.id==='hold-silence'),hold=()=>g.HonroAct2.memory(b).holds['hold-silence'];
 function tick(){clock+=C.STEP*1000;e.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);frames++;trajectory.push({frame:frames,round:b.round,x:mage().x,y:mage().y,hp:mage().hp,focus:mage().focus,move:mage().moveLeft,radius:Math.hypot(mage().x-marker.x,mage().y-marker.y),hold:plain(hold())});}
 function ready(){for(let count=0;!app.canInput()&&count<30000;count++){if(app.dialogue){g.HonroStory.next(app);clock+=1000/60;continue;}if(['aim','enemy','ally','summon'].includes(b.phase))g.HonroStory.turn(app);if(g.HonroStory.turnPaused(app)){clock+=1000/60;continue;}tick();}assert(app.canInput(),'Native App returns to an actual player input opportunity');}
 function selectMage(){ready();for(let count=0;mage().acted&&count<12;count++){const u=e.active;inputs.push({op:'defend',hero:u.cls,round:b.round});app.defend();ready();}assert(!mage().acted);if(e.active.id!==mage().id){assert(e.select(mage().id));inputs.push({op:'select',hero:'mage',round:b.round});}assert(app.canInput());}
 async function save(){app.export();return await h.exported();}
 return{h,g,C,app,e,b,inputs,damage,contacts,hits,trajectory,tick,ready,selectMage,save,mage,hold,get frames(){return frames;}};
}
const common=await open(checkpoint.profile);common.selectMage();const commonProfile=await common.save(),commonBattle=commonProfile.honroBattle,commonStart=plain(common.mage()),commonTarget=plain(common.e.unit('sb-b-high'));
assert(!commonStart.acted);assert(commonTarget.hp>0&&!commonTarget.dead);assert(common.hold().guarded&&!common.hold().contested);await writeFile(`${out}/choice-common.json`,JSON.stringify({sourceHash:checkpoint.sourceHash,profile:commonProfile,prefixPath:summary.checkpoint,normalAdvanceInputs:common.inputs,normalAdvanceDamage:common.damage},null,2));
const branches=[];
for(const kind of ['reflected-M11','same-pose-blocked-M01','walked-free-M01']){
 const q=await open(commonProfile);assert.deepEqual(plain(q.b.units),commonBattle.units);assert.deepEqual(plain(q.b.honroState),commonBattle.honroState);q.ready();const u=q.mage(),before=plain(u),target=q.e.unit('sb-b-high'),beforeTarget=target.hp,holdBefore=plain(q.hold());assert.equal(q.e.active.id,u.id);assert.deepEqual(plain(u),commonStart);
 let movement=null;
 if(kind==='walked-free-M01'){
  const beforeMove={x:u.x,y:u.y,hp:u.hp,focus:u.focus,move:u.moveLeft};assert(q.e.jump(u));q.inputs.push({op:'jump',hero:'mage',round:q.b.round});for(let n=0;n<480;n++){if(u.x<3434.2-2.5){q.e.move(.7,q.C.STEP);q.inputs.push({op:'move',direction:.7,step:q.C.STEP,frame:q.frames});}q.tick();if(n>30&&q.e.grounded(u)&&u.x>=3431.7)break;}
  assert(q.e.grounded(u));assert(Math.abs(u.x-3434.2)<6);assert(u.moveLeft<beforeMove.move);assert.equal(u.hp,beforeMove.hp,'The ordinary lateral jump needs no damage boost or healing');movement={before:beforeMove,after:{x:u.x,y:u.y,hp:u.hp,focus:u.focus,move:u.moveLeft},moveSpent:beforeMove.move-u.moveLeft,maxHoldRadius:Math.max(...q.trajectory.map(t=>t.radius)),hpLoss:beforeMove.hp-u.hp};assert(movement.maxHoldRadius<680,'Normal default jump stays inside the suppression area');
 }
 const skill=kind==='reflected-M11'?'M11':'M01',angle=kind==='walked-free-M01'?44.11069907462612:83,power=kind==='walked-free-M01'?.6553726730807019:1,focus=u.focus,shotFrom={x:u.x,y:u.y};assert(q.e.fire(skill,angle,power));q.inputs.push({op:'fire',skill,angle,power,round:q.b.round,from:shotFrom});const focusSpent=focus-u.focus;
 for(let n=0;q.b.projectiles.length&&n<1800;n++)q.tick();assert.equal(q.b.projectiles.length,0);const shotDamage=beforeTarget-target.hp,shotContacts=plain(q.contacts),shotHits=plain(q.hits),shotDamageEvents=plain(q.damage);
 if(kind==='reflected-M11'){assert(shotContacts.some(c=>c.id==='sb-west-middle-mass'));assert(shotHits.some(h=>h.id==='sb-b-high'&&h.bounces>=1));assert(shotDamage>0);assert(focusSpent>0);}else if(kind==='same-pose-blocked-M01'){assert(shotContacts.some(c=>c.id==='sb-west-middle-mass'));assert.equal(shotDamage,0);assert.equal(focusSpent,0);}else{assert(shotDamage>0);assert(shotHits.some(h=>h.id==='sb-b-high'));assert.equal(focusSpent,0);}
 q.selectMage();assert(q.b.round>commonBattle.round);assert(q.hold().progress>holdBefore.progress,'Normal subsequent enemy/round cycle advances the maintained ritual');assert(q.hold().guarded&&!q.hold().contested);assert(q.trajectory.every(t=>t.radius<680));assert.deepEqual(plain(q.b.items),commonBattle.items);
 const row={kind,commonProfileSha256:hash(commonProfile),startRound:commonBattle.round,endRound:q.b.round,heroBefore:before,targetBefore:commonTarget,skill,angle,power,shotFrom,focusSpent,shotDamage,contacts:shotContacts,hits:shotHits,shotDamageEvents,movement,holdBefore,holdAfter:plain(q.hold()),maxHoldRadius:Math.max(...q.trajectory.map(t=>t.radius)),itemsUsed:0,inputs:q.inputs,damage:q.damage,trajectory:q.trajectory,profile:await q.save()};branches.push(row);await writeFile(`${out}/${kind}.json`,JSON.stringify(row,null,2));console.log('PASS_LIVE_CHOICE',kind,JSON.stringify({shotDamage,focusSpent,movement,holdBefore:holdBefore.progress,holdAfter:q.hold().progress}));
}
assert.deepEqual(branches[0].shotFrom,branches[1].shotFrom);assert.equal(new Set(branches.map(b=>b.commonProfileSha256)).size,1);
await writeFile(`${out}/choice-result.json`,JSON.stringify({sourceHash:checkpoint.sourceHash,gameplayProjectSha256:checkpoint.provenance.gameplayProjectSha256,prefix:summary,commonProfileSha256:hash(commonProfile),normalAdvanceInputs:common.inputs,branches:branches.map(({profile,trajectory,...row})=>({...row,trajectorySamples:trajectory.length})),scope:'Actual production new-entry prefix and equal export/Continue branches. Every later position, HP, MP, movement budget, enemy and objective state comes from production inputs. Native DOM/clock doubles; not browser or human play proof.'},null,2));
