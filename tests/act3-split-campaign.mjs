/** Real App transition/save/retry paths, with explicit damaged-entry and outcome
 * fixtures. These are continuous state regression evidence, not combat balance
 * or a normal-input campaign clear. */
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,click,finish}=h,S=g.HonroSplitCampaign,P=g.HonroProgression,C=g.HONRO_CORE,checks=[];
let app;
async function check(name,fn){await fn();checks.push(name);console.log('PASS',name);}
function ready(){finish(app);app.turnNotice=null;return app.engine.b;}
function unit(cls,b=app.engine.b){return b.units.find(u=>S.hero(u)&&u.cls===cls);}
function win(){app.engine.b.phase='won';app.outcome(true);assert(app.done);}
function next(){click('result-continue');return ready();}
function entry(id){const p=h.profileThrough(id-1);if(id>=24&&id<=28)p.honroSplitCampaign={version:1,mode:id===24?'continuous':'replay',stage:Math.min(id,27),activeRoster:plain(S.roster(id,1)),vitals:{},starts:{},completed:{},items:null,nextStage:null,finished:id===28};for(const cls of p.recruited)p.heroes[cls].xp=P.budget(id).start;app=h.load(p);app.launch(id);return ready();}
function expected(s,u){return {hp:s.dead?0:Math.min(u.maxHp,s.hp+Math.max(0,u.maxHp-s.maxHp)),focus:Math.min(u.maxFocus,s.focus+Math.max(0,u.maxFocus-s.maxFocus))};}
function assertVitals(s,u){const v=expected(s,u);assert.equal(u.hp,v.hp);assert.equal(u.focus,v.focus);assert.equal(!!u.dead,s.dead);}
function checkpoint(){S.capture(app.engine.b);return plain(app.engine.b.honroSplit.vitals);}

await check('Legacy v1 pending chapters retain their exact historical rosters',()=>{
 for(const id of [24,25,26,27]){const b=entry(id);assert.equal(b.honroSplit.version,1);assert.equal(b.honroSplit.mode,id===24?'continuous':'replay');assert.deepEqual(plain(b.units.filter(S.hero).map(u=>u.cls).sort()),plain(S.roster(id,1)).sort());assert.deepEqual(plain(app.profile.recruited),['archer','mage','knight','occultist']);}
});
let end24,end25,end26,start25,start26,start27,items25;
await check('One continuous 24 result → 25 result → 26 result → 27 chain carries damaged HP/MP and shared consumables',()=>{
 let b=entry(24);b.round=7;b.teamEnds=[6,6,0];
 for(const [i,cls] of C.CLASS_IDS.entries()){const u=unit(cls);u.hp-=111+i*31;u.focus-=31+i*7;u.cooldowns={test:10};u.bound=2;u.slowed={factor:.2,expires:9};u.shield=22;u.shieldUntil=8;}
 b.items.heal=2;b.items.focus=1;win();end24=plain(b.honroSplit.vitals);items25=plain(b.items);
 b=next();assert.equal(b.honroStage,25);assert.equal(app.screen,'battle');assert.equal(b.honroSplit.mode,'continuous');assert.deepEqual(plain(b.items),items25);
 for(const u of b.units.filter(S.hero)){assertVitals(end24[u.cls],u);assert.equal(u.cooldowns.test,4);assert.equal(u.slowed.expires,3);assert.equal(u.bound,2);assert.equal(u.shieldUntil,2);}
 start25=checkpoint();unit('knight').hp-=89;unit('mage').focus-=15;b.items.heal--;P.awardCombat(app.engine,unit('knight'),41);win();end25=plain(b.honroSplit.vitals);
 b=next();assert.equal(b.honroStage,26);assert.equal(b.items.heal,1);assert.equal(b.items.focus,1);
 for(const u of b.units.filter(S.hero))assertVitals(end24[u.cls],u);
 assert.deepEqual(plain(b.honroSplit.vitals.knight),end25.knight);start26=checkpoint();
 unit('archer').hp-=79;unit('occultist').focus-=19;b.items.focus--;P.awardCombat(app.engine,unit('archer'),43);win();end26=plain(b.honroSplit.vitals);
 b=next();assert.equal(b.honroStage,27);assert.equal(b.items.heal,1);assert.equal(b.items.focus,0);
 for(const cls of ['knight','mage'])assertVitals(end25[cls],unit(cls));
 for(const cls of ['archer','occultist'])assertVitals(end26[cls],unit(cls));
 assert(S.allPresent(b));start27=checkpoint();assert.deepEqual(plain(b.honroSplit.completed),{24:true,25:true,26:true});
});
await check('27 failure/retry restores only composed entry inventory and vitals; earned XP remains capped',()=>{
 const b=app.engine.b,entryItems=plain(b.items);b.items.heal=0;for(const u of b.units.filter(S.hero)){u.hp=0;u.dead=true;}
 P.awardCombat(app.engine,null,1e9);const xp=Object.fromEntries(C.CLASS_IDS.map(cls=>[cls,b.heroes[cls].xp]));b.phase='lost';app.outcome(true);
 click('retry');const retry=ready();for(const u of retry.units.filter(S.hero))assertVitals(start27[u.cls],u);
 assert.deepEqual(plain(retry.items),entryItems);assert.deepEqual(plain(retry.honroSplit.completed),{24:true,25:true,26:true});
 P.awardCombat(app.engine,null,1e9);for(const cls of C.CLASS_IDS)assert.equal(retry.heroes[cls].xp,xp[cls]);
});
await check('Mid-split export/import/Continue preserves roster, vitals, death, items, timers and scene cursor byte-for-byte',async()=>{
 const b=entry(25);unit('mage').hp-=83;unit('mage').focus-=21;b.items.cleanse--;b.honroSceneTest={id:'split-test',cursor:2};b.honroState.act3.holds.test={progress:1};
 app.export();const exported=await h.exported(),before=plain(exported.honroBattle);await h.import(exported);app=h.reload();click('continue');
 for(const key of ['units','items','honroSplit','activeRoster','honroGrowth','honroSceneTest','honroState','round','teamEnds'])assert.deepEqual(plain(app.engine.b[key]),before[key],key);
});
await check('Inactive team receives XP once without simulated HP/MP/status ticks or revival',()=>{
 let b=entry(24);unit('archer').hp-=120;unit('archer').focus-=40;unit('archer').bound=3;win();b=next();const frozen=plain(b.honroSplit.vitals.archer),xp=b.heroes.archer.xp;
 P.awardCombat(app.engine,unit('mage'),17);assert.equal(b.heroes.archer.xp,xp+17);assert.deepEqual(plain(b.honroSplit.vitals.archer),frozen);
 unit('mage').hp=0;unit('mage').dead=true;P.awardCombat(app.engine,unit('knight'),1e9);assert.equal(unit('mage').hp,0);assert(unit('mage').dead);assert.match(S.failure(b),/쓰러/);
});
await check('26 retry keeps completed A25, restores B26 entry and prevents reward farming',()=>{
 let b=entry(24);unit('knight').hp-=160;unit('archer').hp-=120;b.items.heal=2;win();b=next();unit('knight').hp-=75;b.items.heal--;win();const frozen=plain(b.honroSplit.vitals.knight);b=next();const baseline=checkpoint();b.items.heal--;unit('occultist').hp=0;unit('occultist').dead=true;P.awardCombat(app.engine,null,1e9);const xp=plain(b.heroes);assert(app.checkMission(app.engine));app.outcome(true);next();b=app.engine.b;
 assert.equal(b.honroStage,26);assert.equal(b.items.heal,1);assert.deepEqual(plain(b.honroSplit.vitals.knight),frozen);assert.equal(b.honroSplit.completed[25],true);assert(!b.honroSplit.completed[26]);
 for(const u of b.units.filter(S.hero))assertVitals(baseline[u.cls],u);P.awardCombat(app.engine,null,1e9);assert.deepEqual(plain(b.heroes),xp);
});
await check('Rest/camp/training cannot reset a live split; title reload resumes pending team transition',()=>{
 let b=entry(24);unit('mage').hp-=190;b.items.heal=1;win();const v=plain(b.honroSplit.vitals);app.showTitle();app=h.reload();click('rest');b=ready();assert.equal(b.honroStage,25);assertVitals(v.mage,unit('mage'));assert.equal(b.items.heal,1);
 unit('mage').hp-=23;const hp=unit('mage').hp,session=b.session;app.showCamp();assert.equal(app.engine.b.session,session);assert.equal(unit('mage').hp,hp);app.showRest();assert.equal(unit('mage').hp,hp);click('training');assert.equal(app.engine.b.session,session);assert.equal(app.training,false);app.launch(1,true);assert.equal(app.engine.b.session,session);assert.match(app.lastNotice,/합류/);
});
await check('Legacy 24–27 Continue keeps four heroes and original split-free state; new retry alone opts in',()=>{
 for(const id of [24,25,26,27]){const p=h.profileThrough(id-1),map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id),b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT,p,{origin:'campaign'});
 // Reconstruct an old four-hero snapshot with legacy saved objectives.
 const all=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===24),g.HONRO_PROJECT,p,{origin:'campaign'}).units.filter(S.hero);
 b.units=b.units.filter(u=>!S.hero(u)).concat(all);delete b.honroSplit;delete b.activeRoster;unit('mage',b).hp-=88;p.honroBattle=plain(b);delete p.honroSplitCampaign;
 app=h.load(p);click('continue');assert.equal(app.engine.b.units.filter(S.hero).length,4);assert.equal(app.engine.b.honroSplit,undefined);assert.equal(unit('mage').hp,unit('mage',b).hp);
 click('retry');ready();assert.equal(app.engine.b.units.filter(S.hero).length,[25,26,27].includes(id)?2:4);}
});
await check('Chapters outside the split and already completed v1 chapter 28 do not acquire a new split',()=>{for(const id of [1,9,23,28,30]){const b=entry(id);assert.equal(b.honroSplit,undefined);assert.equal(S.active(b),false);}});

await check('Carried damage statuses survive their old caster and tick only the active team once',()=>{
 let b=entry(24);const u=unit('archer');u.curseOwner='old-foe';u.curseTurns=3;u.curseDamage=18;u.shield=0;u.earthbind={owner:'old-foe',until:b.round+4,damage:9};win();b=next();const saved=plain(b.honroSplit.vitals.archer);app.engine.newRound();assert.deepEqual(plain(b.honroSplit.vitals.archer),saved);win();b=next();
 const archer=unit('archer'),before=archer.hp;assert.equal(archer.curseOwner,undefined);assert.equal(archer.earthbind.owner,'');app.engine.newRound();assert(archer.hp<before);assert.equal(archer.curseTurns,2);const loss=before-archer.hp;app.engine.newRound();assert.equal(archer.curseTurns,1);assert.equal(archer.hp,before-loss*2);
});


await check('Stopping at the 25/26 result boundary resumes only the next team, with no repeated reward or item refill',()=>{
 let b=entry(24);unit('knight').hp-=140;unit('archer').hp-=110;b.items.heal=2;win();next();
 for(const id of [25,26]){b=app.engine.b;assert.equal(b.honroStage,id);unit(id===25?'mage':'occultist').focus-=25;b.items.heal--;win();const xp=plain(app.profile.heroes),items=plain(b.items),vitals=plain(b.honroSplit.vitals);app.showTitle();app=h.reload();click('rest');b=ready();assert.equal(b.honroStage,id+1);assert.deepEqual(plain(b.items),items);assert.deepEqual(plain(b.heroes),xp);click('result-continue');assert.equal(app.engine.b,b);assert.deepEqual(plain(b.heroes),xp);for(const u of b.units.filter(S.hero))if(vitals[u.cls])assertVitals(vitals[u.cls],u);}
 app.pause();assert(!app.modal.innerHTML.includes('data-action="rest"'));app.showTitle();assert(!app.root.innerHTML.includes('길 위의 쉼터'));
});

await report('act3-split-campaign',checks,{continuousSequence:[24,25,26,27],normalCombatClear:false});
