/** Production App/Story/Engine; controlled combat and supported poses isolate
 * chapter 14. This is a focused binding check, not a normal-play acceptance. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,C=g.HONRO_CORE,S=g.HonroAct23V4Act2Scenes;
if(!g.HonroAct23V4ReviewedChapters)vm.runInContext(await readFile('shared/runtime/act23-v4-reviewed-chapters.js','utf8'),g);
if(!g.HonroAct23V4Reviewed14)vm.runInContext(await readFile('shared/runtime/act23-v4-reviewed14.js','utf8'),g);
const P=g.HonroAct23V4ReviewedChapters,api=P.apiFor(14),approved=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch14.json','utf8')),source=JSON.parse(await readFile('game/docs/story/v4-review/HONRO-CH14-parent-final.json','utf8'));
assert.deepEqual(approved.rows,source.rows);assert.equal(new Set(approved.rows.map(r=>r.id)).size,29);assert(!P.enabled(14));
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_STAGES=[14];g.HONRO_ACT23_V4_REVIEWED_CHAPTERS={14:approved};g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
let app,b;const rowId=()=>app.dialogue?.lines[app.dialogue.index]?.[2]?.rowId;
function launch(){const p=h.profileThrough(13);p.seen['act2:first-spirit-encounter']=true;app=h.load(p);app.launch(14);app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});assert(P.active(b));assert.equal(b.honroCampaignMapRevision,514);return b;}
function tick(n=1){for(let i=0;i<n&&!app.dialogue;i++){Object.assign(b,{side:0,phase:'aim'});V.tick(app,.025);if(!app.dialogue)app.engine.stepUnits(.025);}}
function at(id,n=400){for(let i=0;i<n&&!app.dialogue;i++)tick();assert.equal(rowId(),id,JSON.stringify({want:id,actual:app.dialogue?.lines,reviewed:P.memory(b),scenes:S.memory(b),current:V.current(b),safe:V.safe(app)}));assert(P.rowsReviewed(app.dialogue.lines));}
function pose(u,x,y){Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false});}
function resume(){app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;b=app.engine.b;return b;}
function finish(){h.finish(app);}
function hero(cls){return V.heroes(b).find(u=>u.cls===cls);}
function gil(){return app.engine.unit('14.gilchan');}
function allow(id){const r=api.row(id);return P.lineAllowed(app,r.speaker,{rowId:id,reviewedStage:14,reviewedRevision:1});}
launch();at('EDGE.ARRIVALS_14_0');finish();tick(20);assert(!app.dialogue,'no person speaks before house approach');
assert.deepEqual(['archer','mage','knight','occultist'].map(c=>g.HonroJourneyContent.optional({...app.profile,honroBattle:plain(b)},14,c).length),[1,1,2,1]);
const deadSpeaker=plain(b);deadSpeaker.units.find(u=>u.cls==='archer'&&u.side===0).dead=true;assert.equal(g.HonroJourneyContent.optional({...app.profile,honroBattle:deadSpeaker},14,'knight').length,1,'KNIGHT_1 has the actual archer speaker');
const home=V.marker(b,'14.house');pose(hero('archer'),home.x-180,home.y);at('A2.S14.INTRO.01');assert(!S.base.memory(b).houseOpen);b=resume();at('A2.S14.INTRO.01');finish();at('A2.S14.INTRO.02');assert(!V.use(app,V.marker(b,'14.house')));g.HonroStory.next(app);at('A2.S14.INTRO.03');b=resume();at('A2.S14.INTRO.03');finish();assert(!S.base.memory(b).houseOpen);assert(!g.HonroJourneyContent.optional({...app.profile,honroBattle:plain(b)},14,'archer').length);assert.equal(g.HonroJourneyContent.optional({...app.profile,honroBattle:plain(b)},14,'knight').length,1);
console.log('PASS exact 29 source rows, Gilchan first voice, saved introduction/news and optional E02 guards');
// Record a real walk of one authored local threat toward the house. Remaining
// combat outcomes are fixtures; their deaths do not stand in for normal play.
const door=V.steps(b).find(s=>s.id==='14.door-threat'),foe=door.defeatIds.map(id=>app.engine.unit(id)).find(V.alive);assert(foe);tick();const from=foe.x;foe.fixed=false;foe.moveLeft=500;app.engine.walk(foe,Math.sign(home.x-foe.x),.05);assert.notEqual(foe.x,from);tick();at('A2.S14.MID.01');g.HonroStory.next(app);at('A2.S14.MID.02');finish();
for(const id of door.defeatIds){const u=app.engine.unit(id);if(u){u.dead=true;u.hp=0;}}
at('A2.S14.MID.03');assert(!S.base.memory(b).houseOpen);finish();assert(!g.HonroJourneyContent.optional({...app.profile,honroBattle:plain(b)},14,'occultist').length);
// Clear unrelated nearby combat fixtures so this test measures only scene flow.
for(const u of b.units)if(u.side===1&&u.id!=='resident-spirit-1'){u.dead=true;u.hp=0;}
pose(hero('occultist'),home.x-100,home.y);Object.assign(b,{active:hero('occultist').id,side:0,phase:'aim'});assert(V.use(app,V.marker(b,'14.house')));app.turnNotice=null;at('A2.S14.MID.04');assert(!S.memory(b).hypnosis);g.HonroStory.next(app);at('A2.S14.MID.05');b=resume();at('A2.S14.MID.05');assert(!S.memory(b).hypnosis);finish();
for(const u of V.heroes(b))pose(u,2100-V.heroes(b).indexOf(u)*100,2300);
at('A2.S14.MID.06');assert(S.memory(b).walks['14.hypnosis'].distance>=90);assert(!allow('A2.S14.COMPLETE.01'));g.HonroStory.next(app);at('A2.S14.POPUP.01');finish();at('A2.S14.MID.07');const stopped=gil().x;finish();tick(60);assert.equal(gil().x,stopped,'warning waits for a real response');
pose(hero('mage'),gil().x-180,gil().y);at('A2.S14.MID.08');finish();pose(hero('occultist'),gil().x-85,gil().y);Object.assign(b,{active:hero('occultist').id,side:0,phase:'aim'});assert(V.use(app,V.marker(b,'14.extract')));at('A2.S14.MID.09');assert(!V.alive(app.engine.unit('resident-spirit-1')));assert(gil().honroResolved&&!gil().honroHypnotized);assert(!allow('A2.S14.COMPLETE.01'));g.HonroStory.next(app);at('A2.S14.MID.10');b=resume();at('A2.S14.MID.10');finish();
console.log('PASS actual threat approach, clear-before-door, pre-bell saved cursor, real hypnosis/warning and Sodan separation');
for(const [i,u]of V.heroes(b).entries())pose(u,2100-i*110,2300);
// The escort requires a nearby leader at its current elevation. Keep the
// controlled hero pose alongside the actual NPC climb, replenishing movement
// only at a declared round boundary; never assign Gilchan a destination pose.
for(let i=0;i<900&&!app.dialogue;i++){pose(hero('archer'),gil().x+160,gil().y);if(gil().moveLeft<30)b.round++;tick();}
at('A2.S14.COMPLETE.01',1);assert(S.memory(b).walks['14.refuge'].arrived);assert(C.validTerrainContactPose(b.terrain,gil()));assert(api.row('A2.S14.COMPLETE.01').text.includes('내가 숨어 있던 집'));g.HonroStory.next(app);at('A2.S14.COMPLETE.02');g.HonroStory.next(app);at('A2.S14.COMPLETE.03');b=resume();at('A2.S14.COMPLETE.03');finish();tick();assert(P.memory(b).journal);assert.equal(app.profile.record.filter(r=>r.rowId==='A2.S14.JOURNAL.01').length,1);assert(V.state(b).complete);tick(10);assert.equal(app.profile.record.filter(r=>r.rowId==='A2.S14.JOURNAL.01').length,1);
console.log('PASS real supported refuge arrival before former-house testimony, all completion IDs and one exact journal');
// Presence and prerequisite facts are tested independently of an event cursor.
launch();at('EDGE.ARRIVALS_14_0');finish();pose(hero('archer'),home.x-180,home.y);at('A2.S14.INTRO.01');finish();delete app.profile.cleared[13];tick();assert(!allow('A2.S14.INTRO.02'));assert(!app.dialogue);b.phase='lost';assert.equal(V.state(b).failureText,api.row('A2.S14.FAIL.01').text);g.HONRO_ACT23_V4_PHASE_B_STAGES=[];assert(!P.enabled(14));assert.equal(V.mapRevision(14),214);
console.log('PASS missing father prerequisite, actual loss text and Phase A/default gate');
