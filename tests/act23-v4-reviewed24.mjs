/** Production Engine/App/Story. Enemy deaths, initial hero poses and prior
 * proof are fixtures. Split departure is actual walk/integrateBody movement;
 * no hero/NPC pose is injected after the decision. No full combat claim. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,R=g.HonroAct23V4Chapter24Reviewed,S=g.HonroAct23V4Chapter24Facts,C=g.HONRO_CORE;
assert(R,'run in isolated parent integration copy');assert(!R.enabled());g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_CH24=true;g.HONRO_ACT23_V4_REVIEWED_CH24=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch24.json','utf8'));g.HONRO_ACT23_V4_REVIEWED_CH21=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch21.json','utf8'));g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});let app;
function profile(){const p=h.profileThrough(23);p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+g.HonroStoryContent.version+'-23']=true;p.honroAct23V4History={revision:1,stages:{23:{run:'fixture-23',reviewedNarrative:{revision:1,proof:{goods:{familyCrest:'family-three-petals'},safe:{actor:'act3-carrier'}}}}}};return p;}
function launch(){app=h.load(profile());app.launch(24);app.turnNotice=null;Object.assign(app.engine.b,{side:0,phase:'aim'});assert(R.active(app.engine.b));assert.equal(app.engine.b.honroCampaignMapRevision,424);return app.engine.b;}
const hero=c=>V.heroes(app.engine.b).find(u=>u.cls===c);
function pose(u,x){Object.assign(u,{x,y:C.topAt(app.engine.b.terrain.find(t=>t.id==='a3-foundation'),x),vx:0,vy:0,airborne:false,jumping:false,acted:false});assert(C.validTerrainContactPose(app.engine.b.terrain,u),JSON.stringify({id:u.id,x,y:u.y}));}
function tick(n=1){for(let i=0;i<n&&!app.dialogue;i++){Object.assign(app.engine.b,{side:0,phase:'aim'});V.tick(app,.025);}}
function at(id){tick(200);assert.equal(app.dialogue?.lines[app.dialogue.index]?.[2]?.rowId,id,JSON.stringify({want:id,actual:app.dialogue?.lines,q:R.memory(app.engine.b)}));assert(R.rowsReviewed(app.dialogue.lines));}
function resume(){app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;return app.engine.b;}
function use(id,c){const b=app.engine.b,m=V.marker(b,id),u=hero(c);pose(u,m.x);b.active=u.id;Object.assign(b,{side:0,phase:'aim'});u.acted=false;assert(V.use(app,m),id);Object.assign(b,{side:0,phase:'aim'});}
let b=launch();assert(C.validTerrainContactPose(b.terrain,b.honroReviewed24Voice));tick(20);assert(!app.dialogue,'no remote family recognition or workshop sensing at the spawn');pose(hero('knight'),2070);at('EDGE.ARRIVALS_24_0');h.finish(app);at('A3.S24.INTRO.01');g.HonroStory.next(app);at('A3.S24.INTRO.02');b=resume();at('A3.S24.INTRO.02');h.finish(app);assert(!R.memory(b).events.heard);use('family-crest','knight');at('A3.S24.CREST.01');h.finish(app);use('shrine-seal','mage');assert(b.terrain.find(t=>t.id==='shrine-door').broken);
for(const u of b.units)if(u.side===1){u.hp=0;u.dead=true;}
for(const [c,x]of [['archer',6040],['mage',6100],['knight',6210],['occultist',6270]])pose(hero(c),x);
at('A3.S24.ENTRY.01');g.HonroStory.next(app);g.HonroStory.next(app);at('A3.S24.ENTRY.03');assert(S.voiceHeard(b));b=resume();at('A3.S24.ENTRY.03');h.finish(app);at('A3.S24.INTRO.03');assert((R.memory(b).souls?.first||0)>=30);h.finish(app);
// A real further soul cue is conditional and never required after split.
tick(30);if(app.dialogue&&app.dialogue.lines[0][2].rowId==='A3.S24.APPROACH_DANGER.01')h.finish(app);at('A3.S24.SPLIT.01');assert(S.gathered(b)&&S.routeSafe(b));b=resume();at('A3.S24.SPLIT.01');h.finish(app);assert(R.memory(b).departStart);assert(!R.journal(app.profile,24));assert(!R.memory(b).proof.departure);
const initial=plain(Object.fromEntries(V.heroes(b).map(u=>[u.cls,{hp:u.hp,focus:u.focus,move:u.moveLeft}])));
console.log('PASS actual house crest linked to wagon rather than parcel tags; no remote sensing; supported living workshop scene cast and spoken request precede sensed line; safe all-four decision with saved cursors');
const goals={archer:5735,mage:5825,knight:6505,occultist:6595};let saved=false,depart=false;
for(let i=0;i<2000&&!R.memory(b).proof.departure;i++){
 for(const c of ['archer','mage','occultist','knight']){const u=hero(c),goal=goals[c];if(Math.abs(u.x-goal)>2){const dt=Math.min(.025,Math.abs(goal-u.x)/u.walkSpeed);app.engine.walk(u,Math.sign(goal-u.x),dt,true);app.engine.integrateBody(u,dt,true);}}
 tick();if(app.dialogue?.lines[0][2].rowId==='A3.S24.GUIDE.01')break;if(app.dialogue){assert.equal(app.dialogue.lines[0][2].rowId,'A3.S24.DEPART.01');depart=true;b=resume();at('A3.S24.DEPART.01');h.finish(app);}
 if(!saved&&(R.memory(b).departWalk?.archer?.distance||0)>80){const before=plain({heroes:V.heroes(b),memory:R.memory(b),split:b.honroSplit});b=resume();assert.deepEqual(plain({heroes:V.heroes(b),memory:R.memory(b),split:b.honroSplit}),before);saved=true;}
}
assert(saved&&depart);assert(R.memory(b).proof.departure,JSON.stringify(R.memory(b)));at('A3.S24.GUIDE.01');assert(R.memory(b).proof.departure.teams.water.length===2&&R.memory(b).proof.departure.teams.ground.length===2);h.finish(app);tick();assert(R.journal(app.profile,24));assert(R.complete(b));for(const u of V.heroes(b)){assert.equal(u.hp,initial[u.cls].hp);assert.equal(u.focus,initial[u.cls].focus);assert(u.moveLeft<initial[u.cls].move);}
assert.equal(b.honroSplit.version,2);assert.equal(b.honroSplit.mode,'continuous');assert.equal(Object.keys(b.honroSplit.starts).length,1);V.recordOutcome(app,true);assert(app.profile.honroAct23V4History.stages[24].reviewedNarrative.proof.departure.resourceContinuity);
console.log('PASS native four-hero departure walk and movement costs, both actual anchored pairs before journal/guide, same-state save/Continue and continuous split/vitals preserved');
const p=profile();p.honroReviewed24RestObservation={crest:true};app=h.load(p);for(const c of ['knight','archer','mage','occultist'])assert.equal(R.optional(app.profile,24,c).length,c==='occultist'?1:0,'only Sodan can use real prior rescue; old canvas flag cannot observe the mansion crest');assert.equal(R.lines(['EDGE.OPTIONAL_24_KNIGHT_0','EDGE.OPTIONAL_24_KNIGHT_1','EDGE.OPTIONAL_24_KNIGHT_2'],'optional.knight').length,3,'original approved optional group retained');app.profile.honroBattle={honroStage:24};assert.equal(R.optional(app.profile,24,'mage').length,0);

b=launch();const voice=b.honroReviewed24Voice;voice.hp=0;voice.dead=true;assert(!S.voiceHeard(b));assert(!R.lineAllowed(app,'주민',R.lines(['A3.S24.ENTRY.03'],'entry')[0][2]));assert.equal(V.failure(b),'v4.24.workshop-voice-lost');voice.hp=voice.maxHp;voice.dead=false;const dead=hero('occultist');dead.hp=0;dead.dead=true;assert.equal(V.failure(b),'v4.24.required-party');g.HONRO_ACT23_V4_PHASE_B_CH24=false;assert(!R.enabled());assert.equal(V.mapRevision(24),224);
console.log('PASS per-row actual voice life, known-family/once optional guards, no post-entry optional/rest, required split party and default gate');
