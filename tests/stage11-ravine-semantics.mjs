/** Independent mission/balance/save invariants for the enlarged Stage11.
 * This test never treats fixture completion as normal-input combat evidence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {unitContract,plain} from './act2-spatial-contract-helpers.mjs';
const before=JSON.parse(await readFile('tests/fixtures/stage11-ravine-before.json','utf8'));
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,q=battlefield(g,11),checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
check('original seven mission steps/classes/680-radius/four rounds/six echoes stay exact',()=>{
 assert.equal(q.b.honroRavineVersion,2);
 assert.deepEqual(plain(q.b.honroAct2Steps),before.legacyBattle.honroAct2Steps);
 assert.deepEqual(plain(q.st.steps),before.content.steps);
 assert.deepEqual(plain(g.HonroStageRules.stageParty(11)),['archer','mage','knight','occultist']);
 const hold=q.b.honroAct2Steps.find(s=>s.kind==='hold');assert.equal(hold.radius,680);assert.equal(hold.contestRadius,260);assert.equal(hold.rounds,4);assert.equal(hold.wave.kind,'echo');assert.equal(hold.wave.count,6);
 assert.equal(q.st.requires[0],10);assert.equal(g.HONRO_CONTENT.stages[11].requires[0],11);
});
check('hero and damage/XP/level rules stay at their prior values; only roster size and estimates may change',()=>{
 const allowed=new Set(['initialEnemies','maxAlive','targetRounds']);
 const strip=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!allowed.has(k)));
 assert.deepEqual(plain(strip(g.HONRO_BALANCE.stages[10])),strip(before.balance));
 assert.equal(g.HonroProgression.legacyCampaignAnchor(10),20571);
 const h=C.freshHero('archer');h.xp=g.HonroProgression.legacyCampaignAnchor(10);assert.equal(C.levelOf(h),10,'Actual fresh campaign reference is level10');
 assert.deepEqual(plain(q.b.units.filter(u=>u.side===0).map(unitContract)),before.legacyBattle.units.filter(u=>u.side===0).map(unitContract),'Same profile compiles identical four bodies and stats');
 const host=q.b.units.find(u=>u.honroProtected),old=before.legacyBattle.units.find(u=>u.honroProtected);assert(host&&old);assert.deepEqual(unitContract(host),unitContract(old),'Resident body/stats/protection are preserved');
});
check('an unaltered pre-ravine compiled Stage11 battle keeps geometry, roster, markers, HP, XP and progress on resume',()=>{
 const saved=plain(before.legacyBattle);
 const contract=b=>plain({width:b.width,height:b.height,terrain:b.terrain,worldTerrain:b.honroWorldTerrain,map:b.honroMap,route:b.honroRoute,markers:b.honroMarkers,events:b.honroEvents,steps:b.honroAct2Steps,state:b.honroState,units:b.units,heroes:b.heroes,items:b.items,round:b.round,phase:b.phase});
 const original=contract(saved),e=new C.Engine(saved,()=>{},false),app={engine:e,stage:q.st,profile:C.defaults(),training:false,done:false,notices:[],event(text){this.notices.push(text);},sayLines(){},checkMission(){return false;}};
 g.HonroStageRules.sanitizeStageBattle(saved);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 assert.deepEqual(contract(saved),original,'Continue does not adopt fresh ravine content');
 assert(!g.HonroStage11RavineEncounters?.active(saved));
 g.HonroStageRules.sanitizeStageBattle(saved);g.HonroAct2.attach(app,e);assert.deepEqual(contract(saved),original,'Repeated attach stays idempotent');
});
await mkdir('_local/reports/stage11-ravine',{recursive:true});await writeFile('_local/reports/stage11-ravine/independent-semantics.json',JSON.stringify({checks,scope:'Exact mission/balance/save invariants only; no scripted fixture is a combat clear.'},null,2)+'\n');
