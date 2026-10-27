/** Run in the isolated parent-integration copy described in act3-v4-binding.
 * Actual production App/Engine/Story; DOM/storage are doubles. Controlled hero
 * poses/combat outcomes are explicit fixtures; NPC positions are never set. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,R=g.HonroAct23V4Chapter21Reviewed,S=g.HonroAct23V4Chapter21,City=g.HonroAct23V4City,C=g.HONRO_CORE;
assert(R,'apply the isolated parent integration proposal first');
const approved=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch21.json','utf8'));
assert.equal(g.HONRO_ACT23_V4_REVIEWED_CH21,null);assert(!R.enabled());assert.equal(approved.rows.length,30);assert.equal(new Set(approved.rows.map(r=>r.id)).size,30);
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_CH21=true;g.HONRO_ACT23_V4_REVIEWED_CH21=approved;
const raw=plain(g.HONRO_PROJECT);g.HONRO_PROJECT=V.author(raw,{enabled:true});let app;
function launch(){const p=h.profileThrough(20);p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+g.HonroStoryContent.version+'-20']=true;app=h.load(p);app.launch(21);app.turnNotice=null;Object.assign(app.engine.b,{side:0,phase:'aim'});assert(R.active(app.engine.b));assert.equal(app.engine.b.honroCampaignMapRevision,421);return app.engine.b;}
const unit=id=>app.engine.b.units.find(u=>u.id===id);
function pose(u,x){const b=app.engine.b;Object.assign(u,{x,y:C.topAt(b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});assert(C.validTerrainContactPose(b.terrain,u));}
function tick(n=1){for(let i=0;i<n&&!app.dialogue;i++){Object.assign(app.engine.b,{side:0,phase:'aim'});V.tick(app,.025);}}
function at(id){tick(100);assert.equal(app.dialogue?.lines[app.dialogue.index]?.[2]?.rowId,id,JSON.stringify({want:id,actual:app.dialogue?.lines,mem:S.memory(app.engine.b)}));assert(R.rowsReviewed(app.dialogue.lines));}
function finish(){h.finish(app);}
function resume(){app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;return app.engine.b;}
function kill(id){const u=unit(id);if(V.alive(u))app.engine.hurt(u,999999,app.engine.heroesAlive()[0].id);}
function clearLocal(){for(const id of app.engine.b.honroV4CitySpec.localIds)kill(id);}
let b=launch();const source=raw.stages.find(s=>s.metadata.stageId===21),authored=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===21);
for(const t of source.terrains)assert.deepEqual(plain(authored.terrains.find(x=>x.id===t.id)),plain(t));assert.equal(authored.units.filter(u=>u.team==='enemy').length,source.units.filter(u=>u.team==='enemy').length);
for(const u of source.units.filter(u=>u.team==='enemy')){const actual=plain(authored.units.find(v=>v.id===u.id));delete actual.stageOverrides?.honroVariant;delete actual.stageOverrides?.honroV4ArmorIdentity;const old=plain(u);delete old.stageOverrides?.honroVariant;assert.deepEqual(actual,old);}
at('EDGE.ARRIVALS_21_0');b=resume();at('EDGE.ARRIVALS_21_0');finish();at('A3.S21.INTRO.01');g.HonroStory.next(app);at('A3.S21.INTRO.02');b=resume();at('A3.S21.INTRO.02');finish();assert.equal(R.present(b,V.state(b)).summary,R.row('A3.S21.OBJ.01').text);assert(!R.journal(app.profile,21));
assert(!R.rowsReviewed([['설오','invented',{rowId:'A3.S21.INTRO.04',reviewedStage:21,reviewedRevision:1}]]));
console.log('PASS exact 30 reviewed IDs, gated 421, same combat roster/stats, intro/arrival stable saved cursors and no early journal');
// Actual quest-target damage changes the existing descriptor and opens route.
const p=V.marker(b,'gate-resident'),hero=V.heroes(b)[0];pose(hero,p.x-190);assert(!V.use(app,p));kill('v4.gate-cart');tick();at('A3.S21.CART_STOP.01');assert(S.cartStopped(b));assert(S.memory(b).proof.turn?.distance>0);g.HonroStory.next(app);at('A3.S21.CART_STOP.02');b=resume();at('A3.S21.CART_STOP.02');
// Killing the actual threatened armour invalidates pending line02 immediately.
kill(b.honroV4Chapter21.old);g.HonroStory.tick(app,performance.now());assert(!app.dialogue);assert.equal(S.memory(b).events.cart.status,'done');assert(!R.lineAllowed(app,'소단',R.lines(['A3.S21.CART_STOP.02'],'cart')[0][2]));
// Explicit threat-placement fixture exercises the independent live danger gate.
pose(unit('a3-21-wagon-cordon-2'),1850);tick();at('A3.S21.CIVILIAN_DANGER.01');clearLocal();g.HonroStory.tick(app,performance.now());assert(!app.dialogue);assert(!R.lineAllowed(app,'설오',R.lines(['A3.S21.CIVILIAN_DANGER.02'],'danger')[0][2]));
console.log('PASS real cart damage/route, production swept armour turn, pending danger/turn cancellation after real threat death and saved line02');
// Keep the normal finite wave machinery; no unlimited NPC relocation or timer.
Object.assign(b,{side:0,phase:'aim'});const active=V.heroes(b)[0];pose(active,p.x-190);b.active=active.id;active.acted=false;assert(V.use(app,p));Object.assign(b,{side:0,phase:'aim'});for(const[i,u]of V.heroes(b).entries())pose(u,210+i*80);
const residentStart=unit('act3-resident').x,guardStart=unit('v4.gwakjin').x;
let savedMove=false,lastSeen=false;
for(let i=0;i<12000&&!S.rescued(b);i++){
 if(i&&i%450===0)b.round++;
 if(City.memory(b).pressure.warnSerial!==undefined&&!City.memory(b).pressure.admitted){b.honroState.actorTurnSerial=City.memory(b).pressure.warnSerial+1;app.actorBoundary=V.heroes(b)[0].id;}
 tick();
 if(app.dialogue){const id=app.dialogue.lines[app.dialogue.index][2].rowId;if(id==='A3.S21.LAST_ESCORT.01'){lastSeen=true;assert(unit('act3-resident').x>residentStart+80);assert(!City.memory(b).actors['act3-resident'].safe);b=resume();at(id);}finish();}
 for(const id of City.memory(b).pressure.ids||[])kill(id);
 if(!savedMove&&City.memory(b).actors['act3-resident']?.distance>120){const before=plain({actors:City.memory(b).actors,proof:S.memory(b).proof});b=resume();assert.deepEqual(plain({actors:City.memory(b).actors,proof:S.memory(b).proof}),before);savedMove=true;}
}
assert(S.rescued(b),JSON.stringify(City.memory(b)));assert(savedMove);assert(lastSeen);assert(unit('act3-resident').x>residentStart+900);assert(unit('v4.gwakjin').x!==guardStart);assert.equal(City.memory(b).pressure.ids.length,2);assert(!R.journal(app.profile,21));
// Actual party must approach the visible empty armour remains before its clue.
for(const [i,u]of V.heroes(b).entries())pose(u,1900+i*65);tick(20);at('A3.S21.CLEAR.01');assert(S.memory(b).proof.emblem);assert.equal(S.memory(b).proof.emblem.emblem,'old-sealed-diamond');
g.HonroStory.next(app);g.HonroStory.next(app);at('A3.S21.CLEAR.03');b=resume();at('A3.S21.CLEAR.03');finish();at('A3.S21.EXIT.01');assert(!R.journal(app.profile,21));finish();tick();assert(R.complete(b));assert(R.journal(app.profile,21));assert.equal(app.profile.record.filter(x=>x.rowId==='A3.S21.JOURNAL.01').length,1);tick(20);assert.equal(app.profile.record.filter(x=>x.rowId==='A3.S21.JOURNAL.01').length,1);assert(V.heroes(b).length===4);assert(b.units.some(u=>u.side===1&&V.alive(u)),'distant nonrequired enemies remain');
console.log('PASS real budgeted injured/guard escort, actual threshold and saved movement, local waves, witnessed distinct armour, clear/exit/journal ordering');
// Stage completion records fresh-v4 proof; clearing a legacy chapter cannot.
V.recordOutcome(app,true);assert(app.profile.honroAct23V4History.stages[21].reviewedNarrative.rescued);assert(app.profile.honroAct23V4History.stages[21].reviewedNarrative.proof.emblem);
const freshPreview=launch();const pre=h.profileThrough(20);app=h.load(pre);app.screen='rest';assert.equal(R.optional(app.profile,21,'archer').length,0,'no fabricated pre-entry field observation');
const previewBattle=b;assert(!R.observeRest(app,{rendered:false,battle:previewBattle}));assert(!R.observeRest(app,{rendered:true,battle:previewBattle}),'rescued battle is not a pre-entry preview');
assert(R.observeRest(app,{rendered:true,battle:freshPreview}),'declared rendered-preview fixture supplies real candidate actors');assert.equal(R.optional(app.profile,21,'archer').length,3);assert(!app.profile.seen['rest-interlude-v1-21']);const description=g.HonroJourneyContent.at(21).restDescription;assert.equal(description,R.row('EDGE.ARRIVALS_21_0').text);assert(!app.profile.seen['rest-interlude-v1-21']);g.HonroRestJourney.showRest(app);g.HonroRestJourney.talk(app,'archer');assert.equal(app.dialogue.lines.length,3);g.HonroStory.next(app);assert.equal(app.dialogue.lines[app.dialogue.index][2].rowId,'EDGE.OPTIONAL_21_ARCHER_1');app.profile.party=app.profile.party.filter(c=>c!=='knight');g.HonroStory.draw(app);assert.equal(app.dialogue.lines[app.dialogue.index][2].rowId,'EDGE.OPTIONAL_21_ARCHER_2');finish();
b=launch();at('EDGE.ARRIVALS_21_0');finish();at('A3.S21.INTRO.01');finish();b.phase='lost';assert(R.failure(app));at('EDGE.FAILURE_GUARD.S21');b=resume();at('EDGE.FAILURE_GUARD.S21');finish();assert(app.done);
b=launch();at('EDGE.ARRIVALS_21_0');finish();kill('p-knight');b.phase='lost';assert(!R.failure(app));assert(!app.dialogue);
console.log('PASS fresh proof only, unsupported optional observation withheld, actual loss with living/present knight and saved failure cursor');
// Same revision resume is distinct from old Phase A's growth-preserving restart.
b=launch();at('EDGE.ARRIVALS_21_0');finish();app.stopBattle();const stale=plain(app.profile);stale.honroBattle.honroCampaignMapRevision=221;stale.honroBattle.heroes.archer.xp+=17;const xp=stale.honroBattle.heroes.archer.xp,loadouts=plain(stale.loadouts),cleared=plain(stale.cleared);app=h.load(stale);assert.equal(app.profile.honroBattle,null);assert.equal(app.profile.heroes.archer.xp,xp);assert.deepEqual(plain(app.profile.loadouts),loadouts);assert.deepEqual(plain(app.profile.cleared),cleared);app.continue();assert.equal(app.engine.b.honroCampaignMapRevision,421);
g.HONRO_ACT23_V4_PHASE_B_CH21=false;assert(!R.enabled());assert.equal(V.mapRevision(21),221);assert.equal(V.mapRevision(5),undefined);assert.equal(g.HonroCampaignMapRevision.current(5),6);
console.log('PASS 221 growth/loadout/completion-preserving restart, same421 continuation, default off and public Stage5 revision6 preserved');
