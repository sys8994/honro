/** Focused production App/Story/Engine binding. Controlled combat and hero
 * poses isolate reviewed scenes; this is not normal-play/browser acceptance. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';import {appHarness,plain} from './app-regression-helpers.mjs'; import {writeFile,mkdir} from 'node:fs/promises';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,C=g.HONRO_CORE,S=g.HonroAct23V4Act2Scenes;
for(const [file,name]of [['chapters','Chapters'],['16','16']])if(!g['HonroAct23V4Reviewed'+name])vm.runInContext(await readFile('shared/runtime/act23-v4-reviewed'+(file==='chapters'?'-chapters':file)+'.js','utf8'),g);
const P=g.HonroAct23V4ReviewedChapters,R=g.HonroAct23V4Reviewed16,api=P.apiFor(16),approved=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch16.json','utf8')),source=JSON.parse(await readFile('game/docs/story/v4-reviewed/HONRO-CH16-reviewed-final.json','utf8'));
assert.deepEqual(approved.rows,source.rows);assert.equal(approved.rows.length,35);assert(!P.enabled(16));g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_STAGES=[16];g.HONRO_ACT23_V4_REVIEWED_CHAPTERS={16:approved};g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
let app,b;const current=()=>app.dialogue?.lines[app.dialogue.index]?.[2]?.rowId;
function launch(route){const p=h.profileThrough(15);p.seen['act2:first-spirit-encounter']=true;if(route)p.honroRouteHandoff={revision:1,fromStage:15,toStage:16,choice:route,sourceRun:'test-route15'};app=h.load(p);app.launch(16);app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});assert(P.active(b));assert.equal(b.honroCampaignMapRevision,516);}
const hero=c=>V.heroes(b).find(u=>u.cls===c),npc=k=>app.engine.unit(k);
const pose=(u,x,y)=>Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});
function tick(n=1){for(let i=0;i<n&&!app.dialogue;i++){Object.assign(b,{side:0,phase:'aim'});V.tick(app,.025);if(!app.dialogue)app.engine.stepUnits(.025);}}
function at(row,n=500){for(let i=0;i<n&&!app.dialogue;i++)tick();assert.equal(current(),row,JSON.stringify({row,actual:app.dialogue?.lines,q:P.memory(b),physical:S.memory(b),current:V.current(b),safe:V.safe(app),poses:b.units.filter(u=>u.side!==1).map(u=>({id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,move:u.moveLeft}))}));assert(P.rowsReviewed(app.dialogue.lines));}
function nextAll(){for(let i=0;app.dialogue&&i<40;i++)g.HonroStory.next(app);assert(!app.dialogue);}
async function checkpoint(name){g.HonroStory.save(app);const p=plain(app.profile);p.honroBattle=plain(b);await mkdir('_local/reports/stage16-observer-app',{recursive:true});await writeFile('_local/reports/stage16-observer-app/'+name+'.json',JSON.stringify(p,null,2)+'\n');return p;}
function resume(){app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});}
const allow=id=>{const r=api.row(id);return P.lineAllowed(app,r.speaker,{rowId:id,reviewedStage:16,reviewedRevision:1});};

function setupAttached(){
 launch(); at('EDGE.ARRIVALS_16_0');nextAll();
 for(const [i,u] of V.heroes(b).entries())pose(u,2550-i*100,5037.35);
 at('A2.S16.INTRO.01');nextAll();pose(hero('occultist'),2820,5015.3);at('A2.S16.INTRO.02');nextAll();
}
// Fixture: Sodan dead before separation. No manufactured release, witness or journal.
setupAttached(); app.engine.hurt(hero('occultist'),100000);resume();tick(100);
assert(!R.separated(b));assert(!R.heard(b));assert(!allow('A2.S16.MID.03'));
assert(!allow('A2.S16.WITNESS.01'));assert(!app.profile.record.some(r=>r.rowId==='A2.S16.JOURNAL.01'));
console.log('PASS Sodan unavailable blocks physical separation and testimony');
// Fixture: protected NPC death is failure, never a dead speaker.
for(const victim of ['objective','resident-1']){
 setupAttached();app.engine.hurt(npc(victim),100000);tick();
 assert(!allow('A2.S16.INTRO.01'));assert(!allow('A2.S16.WITNESS.01'));
 assert(V.state(b).failureText || b.phase==='lost','protected NPC death must fail');
 assert(!R.heard(b));assert(!app.profile.record.some(r=>r.rowId==='A2.S16.JOURNAL.01'));
}
console.log('PASS protected NPC death and dead speaker checks');
// Establish recovery using explicit enemy and position fixtures, real marker use and NPC movement.
setupAttached();pose(hero('mage'),2720,5023.47);at('A2.S16.MID.02');nextAll();at('A2.S16.MID.03');nextAll();
for(const u of b.units)if(u.side===1&&u.id!=='resident-spirit-1'){u.dead=true;u.hp=0;}
pose(hero('archer'),3270,4950);Object.assign(b,{active:hero('archer').id,phase:'aim',side:0});assert(V.use(app,V.marker(b,'16.elder')));app.turnNotice=null;
pose(hero('occultist'),2850,5012.86);Object.assign(b,{active:hero('occultist').id,phase:'aim',side:0});assert(V.use(app,V.marker(b,'16.disciple')));app.turnNotice=null;
for(const [i,u] of V.heroes(b).entries())pose(u,2200-i*100,app.engine.surface(2200-i*100,4700,5500).y);
pose(hero('archer'),2700,5025.102040816327);
at('A2.S16.MID.04',1200);assert(R.recovered(b));nextAll();at('A2.S16.MID.05');nextAll();at('A2.S16.WITNESS.01');
// Preserve the live witness dialogue before branching into two fixture cases.
const witnessLive=await checkpoint('witness-live-internal');
app.engine.hurt(hero('mage'),100000);app.engine.hurt(hero('occultist'),100000);
const bell0=b.honroV4Reviewed16.bellSource,archer0=hero('archer');pose(archer0,bell0.x-680,app.engine.surface(bell0.x-680,4700,5500).y);Object.assign(archer0,{acted:false,moveLeft:1000});Object.assign(b,{active:archer0.id,side:0,phase:'aim'});
assert(!V.near(archer0,bell0,650));await checkpoint('witness-both-down');
nextAll();tick();assert(R.heard(b));resume();
assert(!hero('mage')&&!hero('occultist'));assert(R.heard(b));assert(!P.memory(b).trappedObserved);assert(!P.memory(b).witnessApproach);
// Start outside observation range on real terrain. Engine walking, not teleporting,
// must cross the threshold. Increased move budget is an explicit fixture.
const mover=hero('archer'),bell=b.honroV4Reviewed16.bellSource;
pose(mover,bell.x-680,app.engine.surface(bell.x-680,4700,5500).y);
assert(!V.near(mover,bell,650));const start=mover.x;
for(let i=0;i<400&&!app.dialogue&&!P.memory(b).witnessApproach;i++){
 mover.moveLeft=1000;app.engine.walk(mover,1,.025);app.engine.stepUnits(.025);tick();
}
assert(mover.x>start);assert(P.memory(b).witnessApproach,'real engine movement must produce approach receipt');
assert(!P.memory(b).trappedObserved);assert.equal(P.memory(b).witnessApproach.basis,'elder-testimony');
assert.equal(current(),'A2.S16.MID.07');await checkpoint('fallback-followup');const receipt=plain(P.memory(b).witnessApproach);
resume();assert.deepEqual(plain(P.memory(b).witnessApproach),receipt);at('A2.S16.MID.07');nextAll();tick();
assert.equal(P.memory(b).events.souls.status,'done');assert.equal(app.profile.record.filter(r=>r.rowId==='A2.S16.JOURNAL.01').length,1);
resume();tick();assert.deepEqual(plain(P.memory(b).witnessApproach),receipt);
assert.equal(app.profile.record.filter(r=>r.rowId==='A2.S16.JOURNAL.01').length,1);
assert.equal(new Set(P.memory(b).events.witness.ids).size,P.memory(b).events.witness.ids.length);
// Independent living-observer branch, starting from the saved actual witness scene.
app=h.load(witnessLive);app.continue();app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});at('A2.S16.WITNESS.01');nextAll();tick();assert(R.heard(b));pose(hero('mage'),3100,4925.986394557824);at('A2.S16.MID.06');assert(P.memory(b).trappedObserved);await checkpoint('soul-observed');
console.log('PASS both observers down: Engine walk, witness-based receipt, Continue and no duplicate testimony/journal; fixture checkpoint emitted');

