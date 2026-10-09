/** Frozen first-entry training/reward and before-history checks.
 * No fixture in this test is normal Stages1–22 gameplay or a Stage23 victory. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {appHarness} from './app-regression-helpers.mjs';
import {escortEntryProfile,escortEntryResources,ESCORT_ENTRY} from './stage23-escort-entry-helper.mjs';

const plain=v=>JSON.parse(JSON.stringify(v));
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const pinned={
 before:'417903e18a82ba9ba7f9ef0365eb2dca608213f3245c18a44964ae88851d6f6e',
 stage23:'57ff7ae60b87c4045a44f8308a3191ba6d4554acb508d9acfc67812141f42b16',
 'entry-ledger':'9b690e53850d84c49821bbea33aaee3b12cae60c55bf6f440777053c628ee412'
};
const fixtures={};for(const [name,digest]of Object.entries(pinned)){
 const file='tests/fixtures/stage23-escort-history-'+name+'.json',bytes=await readFile(file);
 assert.equal(hash(bytes),digest,'Never refresh the immutable before fixture '+name);fixtures[name]=JSON.parse(bytes);
}
const f=fixtures.before,old=fixtures.stage23,ledger=fixtures['entry-ledger'];
for(const row of Object.values(fixtures)){
 assert.equal(row.sourceCommit,'7df220ba9de5a0eeee3432091f92cf285cbc86f6');
 assert.equal(row.sourceTree,'2d961adc788f5d6cc17884b13c81f9ab6a0fcb96');
}
assert.deepEqual(ESCORT_ENTRY,ledger.contract);
assert.equal(hash(old.stage),f.boundaries.originalStage23Sha256);
assert.equal(f.stages.length,30);assert.equal(f.library.length,573);assert.equal(f.runtime.files.length,128);
assert.deepEqual(old.contracts.objectiveOrder,['dispatch-bundle','carrier-start','dock-mid','dock-exit']);
assert.deepEqual(old.stage.initialState.honroAct3Steps.map(s=>s.id),old.contracts.objectiveOrder);
assert.equal(old.contracts.npcId,'act3-carrier');assert.equal(old.contracts.nextStage,24);
assert.equal(old.contracts.activeLimit,3);assert.equal(old.contracts.waterworksRevision,1);
for(const row of f.protectedFixtures)assert.equal(hash(await readFile(row.path)),row.sha256,'Older immutable history '+row.path);
for(const path of f.growthAndSkills.paths){const row=f.runtime.files.find(row=>row.path===path);assert.equal(hash(await readFile(path)),row.sha256,'Growth/skill source remains unchanged '+path);}

const project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
assert.deepEqual(project.stages.map(s=>s.id),f.stageOrder,'All30 canonical maps stay in order');
assert.deepEqual(Object.fromEntries(Object.entries(project).filter(([key])=>!['stages','library'].includes(key))),f.globals);
for(const row of f.stages.filter(row=>row.id!=='stage-23'))assert.equal(hash(project.stages.find(s=>s.id===row.id)),row.sha256,'Unchanged other map '+row.id);
assert.deepEqual(project.library.slice(0,f.library.length).map(a=>a.id),f.libraryOrder,'Existing assets remain in order');
for(const [i,row]of f.library.entries())assert.equal(hash(project.library[i]),row.sha256,'Unchanged existing asset '+row.id);

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,q=escortEntryProfile(g),r=q.readiness;
assert.deepEqual(plain({xp:r.xp,level:r.level,rows:r.rows,cleared:r.cleared,ledger:r.ledger,scope:r.scope}),ledger.readiness,'Re-run all22 production first-clear/recruit reward steps');
assert.deepEqual(plain(q.profile),ledger.representative.profile,'Exact legal representative profile');
assert.deepEqual(plain(q.training),ledger.representative.training,'Every prerequisite and stat paid through production training');
assert.equal(C.MAX_LEVEL,30);assert.equal(C.XP_CAP,372860);
const prior=plain(r),bare=escortEntryProfile(g,{ordinaryStats:0,readiness:r});assert.deepEqual(plain(r),prior,'Training does not edit the reward-path input');
const current=battlefield(g,23,{profile:q.profile}),geometry=battlefield(g,23,{profile:bare.profile});
assert.deepEqual(plain(escortEntryResources(g,current.b,current.e)),ledger.representative.resources);
assert.deepEqual(plain(escortEntryResources(g,geometry.b,geometry.e)),ledger.geometry.resources);
for(const b of [current.b,geometry.b]){
 assert.equal(b.seed,ESCORT_ENTRY.seed,'Recorded canonical seed, without RNG injection');
 assert.deepEqual(plain(b.honroGrowth.limit),ESCORT_ENTRY.limit,'No larger reward pool with a new roster');
 assert.equal(b.honroGrowth.ledger.stages[23].cleared,false);assert.deepEqual(plain(b.honroGrowth.ledger.stages[23].combat),{});
 assert.deepEqual(plain(b.items),old.compiled.items,'Normal starter items exist but the representative policy never uses them');
}
assert.deepEqual(ledger.geometry.resources.map(u=>u.maxMove),[1640,1660,1750,1690]);
assert.deepEqual(ledger.representative.resources.map(u=>u.maxMove),[1886,1909,2223,1994]);
assert.throws(()=>escortEntryProfile(g,{ordinaryStats:7,readiness:r}),/geometry\/stat0/);
const insufficient=plain(r);insufficient.heroes.archer.xp--;assert.throws(()=>escortEntryProfile(g,{readiness:insufficient}));
const truncated=plain(r);truncated.rows.pop();assert.throws(()=>escortEntryProfile(g,{readiness:truncated}));

// Compile the immutable original map with CURRENT engine code. This is only an
// old-entry compatibility fixture; it does not import/execute old source strings.
const saved={project:g.HONRO_PROJECT,content:g.HONRO_CONTENT.stages[22],balance:g.HONRO_BALANCE.stages[22]};let historical;
try{
 g.HONRO_PROJECT={...g.HONRO_PROJECT,stages:g.HONRO_PROJECT.stages.map(s=>s.id==='stage-23'?plain(old.stage):s)};
 g.HONRO_CONTENT.stages[22]=plain(old.content);g.HONRO_BALANCE.stages[22]=plain(old.balance);
 historical=battlefield(g,23,{profile:plain(ledger.representative.profile)});
 assert.deepEqual(plain(historical.b.units),old.compiled.units,'All original actors, poses, HP, MP and tuning');
 assert.equal(hash(historical.b.terrain),old.compiled.terrainSha256);assert.equal(hash(historical.b.honroWorldTerrain),old.compiled.worldTerrainSha256);
 assert.deepEqual(plain(g.HonroAct3.steps(historical.b)),old.compiled.steps);
 assert.equal(g.HonroEncounters.populationCap(historical.b),30,'Original22+8 remains cap30');
 assert.deepEqual(plain(historical.b.honroGrowth.limit),old.compiled.growth.limit);
 assert.equal(historical.b.honroGrowth.weight,33.6);
 const foes=historical.b.units.filter(u=>u.side===1);assert.equal(foes.length,22);assert.equal(foes.filter(u=>u.elite).length,5);
 assert.equal(foes.reduce((n,u)=>n+u.honroXpWeight,0),25);assert(Math.abs(historical.b.honroGrowth.weight-25-8.6)<1e-12);
 assert.deepEqual(foes.map(u=>({id:u.id,weight:u.honroXpWeight,budget:u.xpBudget,granted:u.xpGranted})),old.compiled.growth.xpGranted);
}finally{g.HONRO_PROJECT=saved.project;g.HONRO_CONTENT.stages[22]=saved.content;g.HONRO_BALANCE.stages[22]=saved.balance;}
assert.equal(g.HONRO_PROJECT,saved.project);assert.equal(g.HONRO_CONTENT.stages[22],saved.content);assert.equal(g.HONRO_BALANCE.stages[22],saved.balance);

// Explicit isolated App-action fixture: deduct100 HP/MP only in an independent
// clone to expose normal defense gains. Never feed these edits to a fullplay.
const h=await appHarness(),defense=[];
for(const row of ledger.representative.resources){
 const b=plain(historical.b),e=new h.C.Engine(b,()=>{},true),u=b.units.find(u=>u.side===0&&u.cls===row.cls);
 b.active=u.id;u.hp=u.maxHp-100;u.focus=u.maxFocus-100;u.shield=0;
 const before={hp:u.hp,mp:u.focus,move:u.moveLeft,items:plain(b.items)},finish=e.finishAction.bind(e),finishCalls=[];
 e.finishAction=function(...args){finishCalls.push({reviewed:args[0]===true});return finish(...args);};
 h.App.prototype.defend.call({engine:e,canInput:()=>true,cancelInput(){},updateHUD(){}});
 assert.equal(u.hp-before.hp,row.defend.hpCeiling);assert.equal(u.focus-before.mp,row.defend.mpCeiling);
 assert.equal(u.shield,row.defend.shieldFloor);assert.equal(u.shieldUntil,b.teamEnds[1]+1);
 assert.deepEqual(finishCalls,[{reviewed:false}]);assert.equal(b.phase,'review','Defense first enters the ordinary action-review phase');
 for(let frame=0;b.phase==='review'&&frame<360;frame++)e.tick(h.C.STEP);
 assert.notEqual(b.phase,'review');assert(u.acted,'Normal review ticks finish the original actor');
 assert.deepEqual(finishCalls,[{reviewed:false},{reviewed:true}],'One defense action, then its ordinary reviewed completion');
 assert.equal(u.moveLeft,before.move);assert.deepEqual(plain(b.items),before.items);
 defense.push({cls:row.cls,hpGain:u.hp-before.hp,mpGain:u.focus-before.mp,shield:u.shield,actionEnds:1,finishCalls,reviewCompleted:true});
}

const report={passed:true,sourceCommit:f.sourceCommit,sourceTree:f.sourceTree,fixtureSha256:pinned,
 scope:q.scope,representative:ledger.representative.resources,geometry:ledger.geometry.resources,defense,
 normalInputPolicy:ESCORT_ENTRY.policy,oldGrowth:old.compiled.growth,
 protected:{otherMaps:29,existingAssets:573,oldHistoryFiles:f.protectedFixtures.length,growthSkillSources:f.growthAndSkills.paths.length},
 limits:['No actual Stages1–22 playthrough or normal22 exported save.','No Stage23 fullplay, traversal, Continue, art, browser, build or Pages acceptance.','Defense is an explicitly depleted independent App-action fixture.']};
await mkdir('_local/reports/stage23-escort',{recursive:true});await writeFile('_local/reports/stage23-escort/entry.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS Stage23 entry: actual reward ledger XP75748/Lv16/33 earned; legal rank1/stat6/four slots,20–24 unspent; separate stat0 geometry; old22+8 cap30/weight33.6; immutable29 maps/573 assets; isolated App defense. Not campaign/fullplay/browser evidence.');
