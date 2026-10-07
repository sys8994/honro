/** Production App navigation/save regressions with DOM/storage doubles.
 * Explicit victory/loss fixtures are not normal-play or browser evidence. */
import assert from 'node:assert/strict';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
import {projectilePlatformProject} from './fixtures/projectile-platform-arena.mjs';
const h=await appHarness(),{g,load,reload,click,finish,profileThrough}=h;
const project=projectilePlatformProject(g),checks=[],failures=[];
let app,original,stored;
const saved=()=>JSON.parse(h.storage.get(KEY));
const check=async(name,fn)=>{try{await fn();checks.push(name);console.log('PASS',name);}catch(error){failures.push({name,error});console.error('FAIL',name,'\n',error.message.slice(0,1200));}};
function normal(){
 g.HONRO_EMBEDDED=false;app=load(profileThrough(12));app.launch(13);finish(app);
 app.engine.b.round=7;app.engine.active.hp-=17;app.engine.active.focus-=9;app.engine.b.items.heal=0;
 app.profile.honroFlags.returnProbe='original';app.stopBattle();app.persist();
 original=plain(app.profile);stored=h.storage.get(KEY);return app;
}
function custom(){app.launchMap(project,project.activeStageId,{story:false});assert(app.customMap);}
function protectedSave(){assert.equal(h.storage.get(KEY),stored);assert.deepEqual(plain(app.normalProfile),original);}
function restored(){assert(!app.customMap);assert.equal(app.engine,null);assert.equal(app.stageId,13);assert.deepEqual(plain(app.profile),original);protectedSave();}
function disjoint(a,b){const refs=new Set();function collect(v){if(!v||typeof v!=='object'||refs.has(v))return;refs.add(v);for(const x of Object.values(v))collect(x);}collect(a);function visit(v){if(!v||typeof v!=='object')return;assert(!refs.has(v),'temporary and protected profiles must share no object/array reference');for(const x of Object.values(v))visit(x);}visit(b);}
await check('Repeated pause retry keeps one protected return profile and restores the suspended stage 13',()=>{
 normal();const owner=app.profile;custom();for(let i=0;i<3;i++){app.profile.record.push({place:'QA',text:'retry '+i});click('retry');assert.equal(app.customMap.returnProfile,owner);assert.equal(app.customMap.returnStageId,13);disjoint(app.profile,owner);protectedSave();}
 click('title');restored();click('title');restored();app.continue();assert.equal(app.engine.b.honroStage,13);assert.deepEqual(plain(app.engine.b.units),original.honroBattle.units);
});
await check('Replacing custom maps, with or without an active engine, never stacks temporary return profiles',()=>{
 normal();const owner=app.profile;for(let i=0;i<4;i++){custom();if(i%2===0)app.engine=null;custom();assert.equal(app.customMap.returnProfile,owner);assert.equal(app.customMap.returnStageId,13);protectedSave();}app.showTitle();restored();
});
await check('Custom export retains its QA battle contract while close/save protect the normal record',async()=>{
 normal();custom();app.profile.heroes.archer.xp+=999;app.profile.settings.volume=.2;app.profile.record.push({place:'QA',text:'never append'});app.persist();app.settings();click('close');assert(app.engine);app.export();const exported=await h.exported();assert.equal(exported.honroBattle.honroMapOrigin,'workshop');assert.equal(exported.record.at(-1).text,'never append');assert.deepEqual(exported,plain(app.profile));protectedSave();app.showTitle();restored();app.export();assert.deepEqual(await h.exported(),original);
});
await check('Page reload abandons a retried custom map without changing stored progress',()=>{
 normal();custom();click('retry');app.profile.cleared[30]={visits:9};app.persist();protectedSave();app=reload();assert(!app.customMap);assert.deepEqual(plain(app.profile),original);assert.equal(app.stageId,13);
});
await check('Settings record import exits a retried custom session before installing the replacement',async()=>{
 normal();const imported=plain(original);imported.honroFlags.importProbe='new original';custom();click('retry');await h.import(imported);assert.equal(app.screen,'title');assert.equal(app.customMap,null);assert.deepEqual(plain(app.profile),imported);assert.deepEqual(saved(),imported);assert.deepEqual(plain(app.normalProfile),imported);app.export();assert.deepEqual(await h.exported(),imported);app=reload();assert.deepEqual(plain(app.profile),imported);
});
await check('Import works without retry and an invalid file preserves the active custom session',async()=>{
 normal();custom();const session=app.customMap,engine=app.engine;await h.import({game:'wrong'});assert.equal(app.customMap,session);assert.equal(app.engine,engine);protectedSave();await h.import(original);restored();
});
await check('A confirmed new journey replaces the protected record after ending custom mode',()=>{
 normal();custom();click('retry');click('confirm-newgame');assert.equal(app.screen,'title');assert.equal(app.customMap,null);assert.equal(app.profile.lastStage,1);assert.deepEqual(plain(app.profile.cleared),{});assert.equal(app.profile.honroFlags.returnProbe,undefined);assert.deepEqual(saved(),plain(app.profile));const fresh=plain(app.profile);app=reload();assert.deepEqual(plain(app.profile),{...fresh,honroBattle:null,upgradeNotice:false});
});
await check('Result retry after both won and lost fixtures keeps the original return owner',()=>{
 for(const phase of ['won','lost']){normal();const owner=app.profile;custom();app.engine.b.phase=phase;app.outcome(true);const once=plain(app.profile);app.outcome(true);assert.deepEqual(plain(app.profile),once);click('retry');assert.equal(app.customMap.returnProfile,owner);click('title');restored();}
});
await check('Custom result exit, rest and journey-book return keep original completion, story and battle',()=>{
 for(const route of ['result-continue','result-map','rest','map'])for(const phase of ['won','lost']){normal();custom();click('retry');if(route.startsWith('result')){app.engine.b.phase=phase;app.outcome(true);}click(route);assert.equal(app.customMap,null);assert.equal(app.profile.honroFlags.returnProbe,'original');assert.deepEqual(plain(app.profile.cleared),original.cleared);assert.deepEqual(plain(app.profile.record),original.record);assert.deepEqual(plain(app.profile.honroBattle),original.honroBattle);assert(!app.profile.honroFlags['cleared-1']);}
});
await check('Custom result return label describes the protected journey and leaves normal result wording intact',()=>{
 for(const phase of ['won','lost']){normal();custom();click('retry');app.engine.b.phase=phase;app.outcome(true);assert.equal(g.HonroRestJourney.resultLabel(app),'원래 여정으로 돌아가기');assert.match(app.modal.innerHTML,/data-action="result-continue">원래 여정으로 돌아가기<\/button>/);click('result-continue');assert(!app.customMap);assert.equal(app.profile.honroFlags.returnProbe,'original');assert.deepEqual(plain(app.profile.honroBattle),original.honroBattle);}
 normal();app.continue();app.engine.b.phase='won';app.outcome(true);assert.notEqual(g.HonroRestJourney.resultLabel(app),'원래 여정으로 돌아가기');assert(!app.modal.innerHTML.includes('원래 여정으로 돌아가기'));
});
await check('Normal battle, settings import and normal retry still preserve campaign growth and saves',async()=>{
 normal();app.continue();app.engine.b.heroes.archer.xp+=13;const xp=app.engine.b.heroes.archer.xp;click('retry');assert.equal(app.engine.b.honroStage,13);assert.equal(app.engine.b.heroes.archer.xp,xp);app.showTitle();assert.deepEqual(saved(),plain(app.profile));await h.import(original);restored();
});
await check('Debug plus custom retries return to the same independent debug journey and export normal save',async()=>{
 normal();app.setDebugMode(true);finish(app);const debug=app.profile;debug.honroFlags.debugProbe='qa';const snapshot=plain(debug),normalSave=plain(app.normalProfile),raw=h.storage.get(KEY);custom();click('retry');assert.equal(app.customMap.returnProfile,debug);disjoint(app.profile,debug);disjoint(app.profile,app.normalProfile);app.export();assert.deepEqual(await h.exported(),normalSave);app.showTitle();assert.equal(app.profile,debug);assert.deepEqual(plain(app.profile),snapshot);assert.equal(h.storage.get(KEY),raw);app.setDebugMode(false);finish(app);assert.equal(app.profile.honroFlags.debugProbe,undefined);assert.equal(app.profile.honroBattle.honroStage,13);
});
await check('Toggling debug from a retried custom session restores normal ownership first',()=>{
 normal();custom();click('retry');app.setDebugMode(true);finish(app);assert.equal(app.customMap,null);assert.equal(app.profile.honroFlags.returnProbe,'original');assert.equal(app.profile.honroBattle.honroStage,13);app.setDebugMode(false);finish(app);assert.equal(app.profile.honroFlags.returnProbe,'original');assert.equal(app.profile.honroBattle.honroStage,13);assert.deepEqual(plain(app.profile.cleared),original.cleared);
});
await check('Custom profile overrides do not alias the protected profile or caller-owned nested values',()=>{
 normal();const owner=app.profile;app.launchMap(project,project.activeStageId,{story:false,profile:owner});disjoint(app.profile,owner);app.profile.honroFlags.returnProbe='temporary';app.profile.heroes.archer.xp++;app.profile.record.push({place:'QA',text:'isolated'});protectedSave();app.showTitle();restored();
});
await check('Workshop embedded retry and Stop boundary never write campaign storage',()=>{
 normal();g.HONRO_EMBEDDED=true;app=reload();const embedded=plain(app.profile);custom();for(let i=0;i<3;i++)click('retry');app.setDebugMode(true);assert(!app.debugMode);app.stopBattle();assert.equal(app.customMap,null);assert.deepEqual(plain(app.profile),embedded);assert.equal(h.storage.get(KEY),stored);g.HONRO_EMBEDDED=false;app=reload();assert.deepEqual(plain(app.profile),original);
});
await check('Training entered after a custom result releases custom ownership and preserves the suspended battle',()=>{
 normal();custom();app.engine=null;app.launch(1,true,'A01');assert.equal(app.customMap,null);assert(app.training);assert.deepEqual(plain(app.profile.honroBattle),original.honroBattle);click('retry');app.showTitle();assert.deepEqual(plain(app.profile),original);protectedSave();
});
await check('Invalid map replacement cannot release or modify the current session',()=>{
 normal();custom();const session=app.customMap,engine=app.engine;assert.throws(()=>app.launchMap(project,'missing'),/Stage not found/);assert.equal(app.customMap,session);assert.equal(app.engine,engine);protectedSave();app.stopBattle();restored();
});
await check('Returning after retry cannot persist a QA profile on later normal navigation',()=>{
 normal();custom();click('retry');app.showTitle();assert.deepEqual(plain(app.profile),original);app.showRest();finish(app);assert.equal(saved().honroFlags.returnProbe,'original');assert.deepEqual(saved().cleared,original.cleared);assert.deepEqual(saved().honroBattle,original.honroBattle);app.export();
});
if(failures.length){console.error(`${failures.length}/${checks.length+failures.length} regression groups failed`);process.exitCode=1;}else await report('custom-map-return-profile',checks,{groups:checks.length});
