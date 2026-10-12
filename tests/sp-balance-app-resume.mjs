/** Production App import/Continue/mount/export/retry with DOM/storage doubles.
 * Existing source exports are read-only. This is not browser or normal-play evidence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex'),h=await appHarness(),{C}=h,rows=[];
const bundled=JSON.parse(await readFile('tests/fixtures/stage23-escort-level17-dock-mid.json','utf8'));
const inputs=[{name:'stage23 production Lv17 export',profile:bundled.profile}];
if(process.env.HONRO_GROWTH_SAVE){const bytes=await readFile(process.env.HONRO_GROWTH_SAVE);assert.equal(hash(bytes),'ec1b890b2bddbce94709ad1807c699f11934ebb57a32ccc3a85b9f48905c9457');inputs.push({name:'stage16 production normal export',profile:JSON.parse(bytes),file:process.env.HONRO_GROWTH_SAVE,sha:hash(bytes)});}
const recalculated=['level','hp','maxHp','focus','maxFocus','attack','armor','critChance','critMultiplier','maxMove','walkSpeed','regen','moveLeft'];
const omit=(obj,keys)=>Object.fromEntries(Object.entries(obj).filter(([k])=>!keys.includes(k)));
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-8,label+`: ${a} vs ${b}`);
for(const input of inputs){
 let app=h.load(input.profile);app.continue();const before=plain(input.profile.honroBattle),b=app.engine.b,stats=[];
 assert.equal(b.spBalanceRevision,C.SP_BALANCE_REVISION);assert.deepEqual(plain(b.heroes),before.heroes,'SP, ranks, XP and progression counters never change during stat migration');
 assert.deepEqual(plain(omit(b,['units','spBalanceRevision'])),omit(before,['units','spBalanceRevision']),'battle progress, in-flight state, items, objectives and old XP ledger stay fixed');
 for(const u of b.units){const old=before.units.find(v=>v.id===u.id);assert(old);if(u.side!==0||u.summoned||u.enthrall){assert.deepEqual(plain(u),old);continue;}
  assert.deepEqual(plain(omit(u,recalculated)),omit(old,recalculated),'only derived stats/resources may change');
  const hero=b.heroes[u.cls],expected=C.heroStats({...hero,ranks:{...u.ranks}},u.cls,u.loadout);
  for(const [actual,key] of [['maxHp','hp'],['maxFocus','mp'],['attack','attack'],['armor','armor'],['maxMove','move'],['walkSpeed','speed'],['regen','regen'],['critChance','critChance'],['critMultiplier','critMultiplier']])near(u[actual],expected[key],u.cls+' '+key);
  assert(u.armor<=.7);assert.equal(u.hp,old.dead?0:Math.max(1,Math.floor(u.maxHp*Math.max(0,Math.min(1,old.hp/old.maxHp)))));
  near(u.focus/u.maxFocus,old.focus/old.maxFocus,u.cls+' MP fraction');near(u.moveLeft/u.maxMove,old.moveLeft/old.maxMove,u.cls+' movement fraction');
  stats.push({cls:u.cls,xp:hero.xp,level:C.levelOf(hero),training:C.statTrainingRank(hero),earnedSP:C.pointsEarned(hero),spentSP:C.pointsSpent(hero,u.cls),leftSP:C.pointsLeft(hero,u.cls),before:Object.fromEntries(recalculated.map(k=>[k,old[k]])),after:Object.fromEntries(recalculated.map(k=>[k,u[k]]))});
 }
 const migrated=plain(b);for(let n=0;n<3;n++){app.mount(app.engine.b);assert.deepEqual(plain(app.engine.b),migrated,'mount is idempotent');app.export();await h.import(await h.exported());app.continue();assert.deepEqual(plain(app.engine.b),migrated,'export/import/Continue is idempotent');}
 const allocation=plain(app.engine.b.heroes),paid=plain(app.engine.b.honroGrowth?.ledger);h.click('retry');h.finish(app);assert.deepEqual(plain(app.engine.b.heroes),allocation);assert.equal(app.engine.b.spBalanceRevision,C.SP_BALANCE_REVISION);for(const u of app.engine.b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall)){const expected=C.heroStats(app.engine.b.heroes[u.cls],u.cls,u.loadout);near(u.maxHp,expected.hp,'retry current HP');}
 if(input.file)assert.equal(hash(await readFile(input.file)),input.sha,'original file remains byte-identical');
 rows.push({name:input.name,stage:before.honroStage,round:before.round,inputSha:input.sha||bundled.sourceSha256,stats,checks:['actual App Continue calls migration','progression and all non-derived state preserved','three export/import/Continue and mount repeats','retry preserves earned XP and allocation','read-only source input']});
 console.log('PASS',input.name,'actual App migration, repeat export/import/Continue, retry and derived stat display agreement');
}
await mkdir('_local/reports/growth-release',{recursive:true});await writeFile('_local/reports/growth-release/normal-save-comparison.json',JSON.stringify({rows,limits:'DOM, storage and rendering are doubles; exports are real source inputs, not a completed playthrough.'},null,2)+'\n');
console.log(`${rows.length} production-save App groups passed`);
