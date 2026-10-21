/** Production SP adapter and App Continue are separate save contracts.
 * DOM/storage/rendering are doubles; explicit resource/reward probes are not normal play.
 * Original export bytes are read-only and pinned below. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex'),h=await appHarness(),{C,g}=h,rows=[];
const fixture='tests/fixtures/stage23-escort-level17-dock-mid.json',fixtureBytes=await readFile(fixture),fixtureSha='086290aa03e2bfc688485289191a7aeb23366c03abdea8c552394d3c2a452dc9';
assert.equal(hash(fixtureBytes),fixtureSha,'original bundled fixture bytes are pinned');
const bundled=JSON.parse(fixtureBytes),inputs=[{name:'stage23 production Lv17 export',profile:bundled.profile,file:fixture,sha:fixtureSha}];
if(process.env.HONRO_GROWTH_SAVE){const bytes=await readFile(process.env.HONRO_GROWTH_SAVE);assert.equal(hash(bytes),'ec1b890b2bddbce94709ad1807c699f11934ebb57a32ccc3a85b9f48905c9457');inputs.push({name:'stage16 production normal export',profile:JSON.parse(bytes),file:process.env.HONRO_GROWTH_SAVE,sha:hash(bytes)});}
const recalculated=['level','hp','maxHp','focus','maxFocus','attack','armor','critChance','critMultiplier','maxMove','walkSpeed','regen','moveLeft'];
const omit=(obj,keys)=>Object.fromEntries(Object.entries(obj).filter(([k])=>!keys.includes(k)));
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-8,label+`: ${a} vs ${b}`);
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall);
const paths=(a,b,p='')=>{if(JSON.stringify(a)===JSON.stringify(b))return[];if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b))return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>paths(a[k],b[k],p?p+'.'+k:k));return[p];};
function growthView(profile){return plain(Object.fromEntries(['heroes','loadouts','tuning','cleared','recruited','party','honroFlags','honroGrowth'].map(k=>[k,profile[k]])));}
function checkSpMigration(before){
 // Do not relabel an obsolete map as current just to force App Continue to keep it.
 const b=plain(before),stats=[];assert.equal(C.applySpBalanceMigration(b),b);
 assert.equal(b.spBalanceRevision,C.SP_BALANCE_REVISION);assert.deepEqual(b.heroes,before.heroes,'SP, ranks, XP and counters never change in the SP adapter');
 assert.deepEqual(plain(omit(b,['units','spBalanceRevision'])),omit(before,['units','spBalanceRevision']),'SP adapter preserves every non-unit field, including old geometry, casts, items, quests and ledger');
 for(const u of b.units){const old=before.units.find(v=>v.id===u.id);assert(old);if(u.side!==0||u.summoned||u.enthrall){assert.deepEqual(u,old);continue;}
  assert.deepEqual(plain(omit(u,recalculated)),omit(old,recalculated),'only the original explicitly listed derived stats/resources may change');
  const hero=b.heroes[u.cls],expected=C.heroStats({...hero,ranks:{...u.ranks}},u.cls,u.loadout);
  for(const [actual,key] of [['maxHp','hp'],['maxFocus','mp'],['attack','attack'],['armor','armor'],['maxMove','move'],['walkSpeed','speed'],['regen','regen'],['critChance','critChance'],['critMultiplier','critMultiplier']])near(u[actual],expected[key],u.cls+' '+key);
  assert(u.armor<=.7);assert.equal(u.hp,old.dead?0:Math.max(1,Math.floor(u.maxHp*Math.max(0,Math.min(1,old.hp/old.maxHp)))));
  near(u.focus/u.maxFocus,old.focus/old.maxFocus,u.cls+' MP fraction');near(u.moveLeft/u.maxMove,old.moveLeft/old.maxMove,u.cls+' movement fraction');
  stats.push({cls:u.cls,xp:hero.xp,level:C.levelOf(hero),training:C.statTrainingRank(hero),earnedSP:C.pointsEarned(hero),spentSP:C.pointsSpent(hero,u.cls),leftSP:C.pointsLeft(hero,u.cls),changedFields:paths(old,u),before:Object.fromEntries(recalculated.map(k=>[k,old[k]])),after:Object.fromEntries(recalculated.map(k=>[k,u[k]]))});
 }
 const migrated=plain(b);for(let n=0;n<3;n++){C.applySpBalanceMigration(b);assert.deepEqual(plain(b),migrated,'SP migration is exactly idempotent');}
 return {battle:migrated,stats,changedPaths:paths(before,migrated)};
}
function currentResourceProbe(app){
 // Explicit valid snapshot boundaries: spent items and wounds must survive current-map Continue.
 const b=app.engine.b,u=app.engine.active;b.items={heal:1,focus:0,cleanse:1,ward:0};u.hp-=7;u.focus*=.6;u.moveLeft*=.75;
 assert(app.engine.fire(C.baseSkill(u.cls),20,.45),'a real free basic shot supplies in-flight state');assert(b.projectiles.length>0);assert.equal(b.phase,'flight');
}
async function exactCurrentRepeats(app){
 const expected=plain(app.engine.b),allocation=plain(expected.heroes),loadouts=plain(app.profile.loadouts),cleared=plain(app.profile.cleared);
 for(let n=0;n<3;n++){
  app.mount(app.engine.b);assert.deepEqual(plain(app.engine.b),expected,'current-map mount preserves the entire battle, with no omitted fields');
  app.export();const exported=await h.exported();assert.deepEqual(exported.honroBattle,expected);assert.deepEqual(exported.heroes,allocation);assert.deepEqual(exported.loadouts,loadouts);assert.deepEqual(exported.cleared,cleared);
  await h.import(exported);assert.equal(app.lastNotice,'기록을 불러왔어.');app.continue();assert.deepEqual(plain(app.engine.b),expected,'current-map export/import/Continue preserves the entire battle exactly');assert.deepEqual(plain(app.profile),exported,'current-map profile is also exactly stable');
 }
 return expected;
}
for(const input of inputs){
 const before=plain(input.profile.honroBattle),sp=checkSpMigration(before),obsolete=g.HonroCampaignMapRevision.obsolete(before),id=before.honroStage;
 let app,mapChanges=[];
 if(obsolete){
  // Independent control: an explicit new entry on the current map, using the unchanged profile.
  const controlProfile=plain(input.profile);controlProfile.honroBattle=null;controlProfile.upgradeNotice=true;
  const control=h.load(controlProfile);control.launch(id);h.finish(control);const expectedBattle=plain(control.engine.b),expectedProfile=plain(control.profile);
  app=h.load(input.profile);const expectedLoaded=plain(input.profile);expectedLoaded.settings={...g.AppRegression.fresh().settings,...expectedLoaded.settings};expectedLoaded.honroBattle=null;expectedLoaded.honroMapRestart=id;expectedLoaded.upgradeNotice=true;
  assert.deepEqual(plain(app.profile),expectedLoaded,'obsolete-map load discards only the snapshot plus the explicitly expected restart/default-setting fields');
  app.continue();h.finish(app);const b=app.engine.b;
  assert.equal(b.honroStage,id);assert.equal(b.honroCampaignMapRevision,g.HonroCampaignMapRevision.current(id));assert.equal(b.round,1);assert.equal(b.spBalanceRevision,C.SP_BALANCE_REVISION);
  assert.notEqual(b.session,before.session);assert.match(b.session,new RegExp('^honro-map-stage-'+id+'-[0-9]+$'));
  // Session is the only nondeterministic new-entry field. Validate it above, then compare everything else in full.
  expectedBattle.session=b.session;expectedProfile.honroBattle.session=b.session;
  assert.deepEqual(plain(b),expectedBattle,'obsolete-map Continue equals a complete canonical current-map entry');
  assert.deepEqual(plain(app.profile),expectedProfile,'restart profile equals canonical entry, including precise journal/narrative updates');
  assert.deepEqual(plain(b.heroes),before.heroes);assert.deepEqual(plain(app.profile.heroes),input.profile.heroes);assert.deepEqual(plain(app.profile.loadouts),input.profile.loadouts);assert.deepEqual(plain(app.profile.cleared),input.profile.cleared);
  const ledger=plain(before.honroGrowth.ledger);ledger.stages[id].policy??=3;
  assert.deepEqual(plain(b.honroGrowth.ledger),ledger,'all paid combat XP, limits and completed-stage rewards survive; only the legacy policy tag is added');assert.deepEqual(plain(app.profile.honroGrowth),ledger);
  if(id===23)assert.deepEqual(plain(b.items),before.items,'this original fixture loses no inventory on map restart');
  mapChanges=paths(before,plain(b));
 }else{
  app=h.load(input.profile);app.continue();assert.deepEqual(plain(app.engine.b),sp.battle,'a current-map export needs only the SP adapter, not a geography restart');
 }
 // A current-map snapshot with the original old stat values exercises the real
 // App SP path without falsely stamping the old fixture's geography as current.
 const compatible=plain(app.profile);compatible.honroBattle=plain(app.engine.b);compatible.honroBattle.spBalanceRevision=0;
 for(const u of heroes(compatible.honroBattle)){const old=before.units.find(v=>v.id===u.id);assert(old);for(const key of recalculated)if(key in old)u[key]=old[key];}
 const expectedSp=checkSpMigration(compatible.honroBattle).battle;
 app=h.load(compatible);app.continue();assert.deepEqual(plain(app.engine.b),expectedSp,'real App Continue applies only SP migration to current-map old-stat snapshot');
 const canonicalItems=plain(app.engine.b.items),allocation=plain(app.engine.b.heroes),loadouts=plain(app.profile.loadouts),cleared=plain(app.profile.cleared),paid=plain(app.engine.b.honroGrowth.ledger);
 currentResourceProbe(app);const current=await exactCurrentRepeats(app);
 // Retry intentionally resets combat/resources, but never earned XP, SP allocation, equipment or paid ledger.
 h.click('retry');h.finish(app);assert.deepEqual(plain(app.engine.b.heroes),allocation);assert.deepEqual(plain(app.profile.loadouts),loadouts);assert.deepEqual(plain(app.profile.cleared),cleared);assert.deepEqual(plain(app.engine.b.honroGrowth.ledger),paid);assert.deepEqual(plain(app.engine.b.items),canonicalItems);assert.equal(app.engine.b.projectiles.length,0);
 for(const u of heroes(app.engine.b)){const expected=C.heroStats(app.engine.b.heroes[u.cls],u.cls,u.loadout);near(u.maxHp,expected.hp,'retry current HP');}
 // Explicit completion boundary, not a claim that this test played through Stage 23.
 const b=app.engine.b,limit=b.honroGrowth.limit;b.phase='won';app.outcome(true);
 const rewardedHeroes=plain(allocation);for(const cls of C.CLASS_IDS)rewardedHeroes[cls].xp=Math.max(allocation[cls].xp,limit.end);
 assert.deepEqual(plain(app.profile.heroes),rewardedHeroes,'completion changes only XP, never invested SP, ranks, training, kills or other progress');
 const completedLedger=plain(paid);completedLedger.stages[id].cleared=true;assert.deepEqual(plain(app.profile.honroGrowth),completedLedger,'completion preserves all previously paid combat XP and other chapters');
 assert.deepEqual(plain(app.profile.loadouts),loadouts);for(const [stage,state] of Object.entries(cleared))assert.deepEqual(plain(app.profile.cleared[stage]),state);
 const completedProfile=plain(app.profile),completedBattle=plain(b);g.HonroProgression.complete(b);assert.deepEqual(plain(b),completedBattle,'completion reward cannot be paid twice');app.outcome(true);assert.deepEqual(plain(app.profile),completedProfile,'duplicate App outcome cannot grant XP, visits or rewards');
 app.export();await h.import(await h.exported());const completed=growthView(app.profile);app.continue();assert.deepEqual(growthView(app.profile),completed,'completed rewards and allocation survive import and Continue');
 assert.equal(hash(await readFile(input.file)),input.sha,'original input file remains byte-identical');
 const topCounts={};for(const path of mapChanges){const key=path.split('.')[0];topCounts[key]=(topCounts[key]||0)+1;}
 rows.push({name:input.name,stage:id,sourceRound:before.round,sourceMapRevision:before.honroCampaignMapRevision??null,currentMapRevision:g.HonroCampaignMapRevision.current(id),mapRestartExpected:obsolete,inputSha:input.sha,sourceExportSha:input.file===fixture?bundled.sourceSha256:input.sha,stats:sp.stats,spChangedPaths:sp.changedPaths,mapRestartChangedTopLevelCounts:topCounts,currentSnapshot:{round:current.round,phase:current.phase,items:current.items,projectiles:current.projectiles.length},checks:['pure SP adapter retains every non-derived field and resource fraction','obsolete map discarded with exact load/default fields','restart equals canonical current-map battle/profile except validated session ID','real current-map App Continue runs SP migration without other battle changes','paid ledger and all completed rewards preserved','three exact current-map mount/export/import/Continue repeats with spent items, wounds and a real in-flight shot','retry preserves XP/SP/equipment/paid ledger','completion and duplicate outcome/import cannot repay rewards','original bytes and SHA preserved']});
 console.log('PASS',input.name,'SP-only migration; explicit map-revision contract; exact current-map repeats; retry and once-only rewards');
}
assert.equal(hash(await readFile(fixture)),fixtureSha);
await mkdir('_local/reports/growth-release',{recursive:true});await writeFile('_local/reports/growth-release/normal-save-comparison.json',JSON.stringify({rows,limits:'Production App/engine with DOM, storage, rendering and scheduling doubles. Item/wound and terminal win states are explicit boundary probes, not normal play or browser evidence.'},null,2)+'\n');
console.log(`${inputs.length} production-save groups passed with separate SP and map-revision contracts`);
