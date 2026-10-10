/** Production App navigation/storage doubles; not browser or normal-play proof. */
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C,click,finish,load,reload,profileThrough}=h,R=g.HonroRestJourney,checks=[];
let app;const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const saved=()=>JSON.parse(h.storage.get(KEY));
check('Enabling debug preserves the normal snapshot and current suspended battle',()=>{
 app=load(profileThrough(4));app.launch(5);finish(app);app.engine.active.hp-=17;app.stopBattle();app.showRest();finish(app);app.persist();const before=plain(app.profile);
 app.setDebugMode(true);finish(app);before.settings.debugMode=true;assert.deepEqual(saved(),before);assert.deepEqual(plain(app.normalProfile),before);assert.deepEqual(plain(app.profile.honroBattle),before.honroBattle);
});
check('Every map pin enters its own rest first, even direct-transition and split chapters',()=>{
 for(let id=1;id<=30;id++){
  R.showBook(app,id);click('journey-select',{id:String(id)});assert.equal(app.screen,'rest');assert.equal(app.engine,null);assert.equal(app.debugRestStage,id);
  assert.match(app.root.innerHTML,new RegExp(`data-action="journey-enter" data-id="${id}"`));assert(app.root.innerHTML.includes(g.HonroJourneyContent.at(id).restName));
  click('camp');assert.equal(app.screen,'camp');for(const cls of C.CLASS_IDS){app.showCamp(cls);assert.equal(app.cls,cls);const known=C.knownSkills(app.profile.heroes[cls],cls);for(const s of Object.values(C.SKILLS).filter(s=>s.cls===cls&&!s.enemyOnly&&(C.TALENTS.some(t=>t.id===s.id)||s.ultimate||s.basic)))assert(known.includes(s.id),`${id}/${cls}/${s.id}`);}
  click('rest');assert.equal(app.debugRestStage,id);assert.equal(app.screen,'rest');
 }
});
check('Repeated choices, camp/back and title/back keep the selected destination and loadout',()=>{
 R.showBook(app,30);R.selectBook(app,30);R.selectBook(app,30);app.showCamp('occultist');const id=C.knownSkills(app.profile.heroes.occultist,'occultist').filter(id=>!C.SKILLS[id].passive&&id!==C.baseSkill(C.SKILLS[id].cls)).at(-1);app.equipIncoming=id;app.equipConfirm(1);assert.equal(app.profile.loadouts.occultist[1],id);click('rest');click('title');click('rest');assert.equal(app.debugRestStage,30);assert.equal(app.profile.loadouts.occultist[1],id);
});
check('Saved battle replacement is deferred until departure and cancellation is safe',()=>{
 const before=plain(app.profile.honroBattle);R.requestLaunch(app,30);assert(app.pendingJourneyLaunch);click('cancel-journey-launch');assert.deepEqual(plain(app.profile.honroBattle),before);R.requestLaunch(app,30);app.close();assert(!app.pendingJourneyLaunch);assert.deepEqual(plain(app.profile.honroBattle),before);
 R.requestLaunch(app,30);app.profile.honroBattle.session+='-changed';click('confirm-journey-launch');assert(!app.engine);assert.match(app.lastNotice,/바뀌었습니다/);
});
check('All 30 departures preserve chosen skills, ordinary stage teams and difficulty',()=>{
 for(let id=1;id<=30;id++){
  app=load(profileThrough(0));app.setDebugMode(true);finish(app);R.showBook(app,id);R.selectBook(app,id);
  for(const cls of C.CLASS_IDS){app.showCamp(cls);app.equipIncoming=C.knownSkills(app.profile.heroes[cls],cls).filter(id=>!C.SKILLS[id].passive&&id!==C.baseSkill(C.SKILLS[id].cls)).at(-1);app.equipConfirm(1);}
  const loadouts=plain(app.profile.loadouts);click('rest');R.requestLaunch(app,id);assert.equal(app.engine.b.honroStage,id);assert.equal(app.engine.b.mode,'campaign');assert.equal(app.engine.b.difficulty,app.profile.settings.difficulty);
  assert.deepEqual(plain(app.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>u.cls)).sort(),plain(g.HonroStageRules.stageParty(id)).sort());
  for(const u of app.engine.b.units.filter(u=>u.side===0&&!u.summoned))assert.deepEqual(plain((u.cls==='mage'?app.engine.b.honroStakeLoadout?.originalLoadout:null)||u.loadout),loadouts[u.cls],`stage ${id} ${u.cls}`);
  finish(app);click('retry');finish(app);assert.equal(app.engine.b.honroStage,id);for(const u of app.engine.b.units.filter(u=>u.side===0&&!u.summoned))assert.deepEqual(plain((u.cls==='mage'?app.engine.b.honroStakeLoadout?.originalLoadout:null)||u.loadout),loadouts[u.cls],`stage ${id} ${u.cls}`);
 }
});
check('Each hero level is independently configurable from 1 to 30, preserving free skills and clamping stats',()=>{
 app=load(profileThrough(0));app.setDebugMode(true);finish(app);R.showBook(app,30);R.selectBook(app,30);
 const original=saved();
 for(const cls of C.CLASS_IDS){
  for(const level of [30,1,15,7]){app.setDebugLevel(cls,level);assert.equal(C.levelOf(app.profile.heroes[cls]),level);assert.equal(app.profile.heroes[cls].xp,C.xpAtLevel(level));assert(C.TALENTS.filter(t=>t.cls===cls).every(t=>app.profile.heroes[cls].ranks[t.id]>=1));}
  app.setDebugLevel(cls,30);app.profile.heroes[cls].statTraining=60;app.setDebugLevel(cls,1);assert.equal(app.profile.heroes[cls].statTraining,3);assert.equal(C.pointsLeft(app.profile.heroes[cls],cls),0);
  app.setDebugLevel(cls,[-1,0,31,1.5,NaN][C.CLASS_IDS.indexOf(cls)]);assert.equal(C.levelOf(app.profile.heroes[cls]),1);
 }
 for(const [i,cls] of C.CLASS_IDS.entries())app.setDebugLevel(cls,[1,9,20,30][i]);
 const heroes=plain(app.profile.heroes);click('rest');R.requestLaunch(app,30);finish(app);
 for(const u of app.engine.b.units.filter(u=>u.side===0&&!u.summoned)){const stats=C.heroStats(heroes[u.cls],u.cls,app.profile.loadouts[u.cls]);assert.equal(u.level,C.levelOf(heroes[u.cls]));assert.equal(u.maxHp,stats.hp);}
 click('retry');finish(app);for(const cls of C.CLASS_IDS)assert.equal(app.engine.b.heroes[cls].xp,heroes[cls].xp);assert.deepEqual(saved(),original);
});
check('Debug skill refunds persist, rank training is free, and slots exclude internal helper attacks',()=>{
 app=load(profileThrough(0));app.setDebugMode(true);finish(app);R.showBook(app,30);R.selectBook(app,30);app.showCamp('mage');
 const t=C.TALENTS.find(t=>t.cls==='mage'&&t.passive);app.changeRank(t.id,-1,false);assert.equal(app.profile.heroes.mage.ranks[t.id]||0,0);click('rest');click('camp');assert.equal(app.profile.heroes.mage.ranks[t.id]||0,0);
 app.setDebugLevel('mage',1);assert.equal(C.trainReason(app.profile.heroes.mage,t.id),'');app.changeRank(t.id,1,false);assert.equal(app.profile.heroes.mage.ranks[t.id],1);
 const ids=C.knownSkills(app.profile.heroes.mage,'mage');assert(!ids.includes('HBT01'));assert(ids.includes('M99'));
});
check('Direct book enter shortcut also routes to rest, then starts only on departure',()=>{
 app=load(profileThrough(0));app.setDebugMode(true);finish(app);R.showBook(app,19);click('journey-enter',{id:'19'});assert.equal(app.screen,'rest');assert(!app.engine);click('journey-enter',{id:'19'});assert.equal(app.engine.b.honroStage,19);finish(app);
});
check('Loss returns to the selected rest without altering the protected normal save',()=>{
 const before=saved();app.engine.b.phase='lost';app.outcome(true);click('result-continue');assert.equal(app.screen,'rest');assert.equal(app.debugRestStage,19);assert.deepEqual(saved(),before);
});
check('Reload discards QA skills and destination; disable restores normal recruitment and locks',()=>{
 const before=saved();app=reload();assert(app.debugMode);assert.deepEqual(plain(app.profile),before);assert(!app.debugRestStage);app.setDebugMode(false);finish(app);assert(!app.isOpen(g.HONRO_CONTENT.stages[29]));assert.deepEqual(plain(app.profile.recruited),['archer']);assert(!C.ultimateUnlocked(app.profile.heroes.archer,'archer'));assert(!app.debugRestStage);
});
app.setDebugMode(true);finish(app);R.showBook(app,30);R.selectBook(app,30);app.profile.honroFlags.exportProbe='qa-only';app.export();const exported=await h.exported();
check('Export is always the protected normal save',()=>{assert(!exported.honroFlags.exportProbe);assert.deepEqual(exported,saved());});
check('Workshop embedded App cannot enable debug or gain QA skills',()=>{const before=h.storage.get(KEY);g.HONRO_EMBEDDED=true;app=reload();assert(!app.debugMode);app.setDebugMode(true);app.prepareDebugCamp();assert(!app.debugMode);assert.equal(h.storage.get(KEY),before);assert.deepEqual(plain(app.profile.recruited),['archer']);});
await report('debug-campaign-parity',checks,{chapters:30});
