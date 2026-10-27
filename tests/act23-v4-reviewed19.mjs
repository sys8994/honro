/** Production App/Story/Engine with controlled poses; DOM/Canvas and prior
 * chapter completion are fixtures, never browser or continuous-play evidence. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,V=g.HonroAct23V4,C=g.HONRO_CORE;
if(!g.HonroAct23V4ReviewedChapters)vm.runInContext(await readFile('shared/runtime/act23-v4-reviewed-chapters.js','utf8'),g);
if(!g.HonroAct23V4Reviewed19)vm.runInContext(await readFile('shared/runtime/act23-v4-reviewed19.js','utf8'),g);
const P=g.HonroAct23V4ReviewedChapters,R=g.HonroAct23V4Reviewed19,api=P.apiFor(19),data=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch19.json','utf8')),source=JSON.parse(await readFile('game/docs/story/v4-reviewed/HONRO-CH19-reviewed-final.json','utf8'));
assert.deepEqual(data.rows,source.rows);assert.equal(data.revision,1);assert.equal(new Set(data.rows.map(r=>r.id)).size,33);
g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_ACT23_V4_PHASE_B_STAGES=[19];g.HONRO_ACT23_V4_REVIEWED_CHAPTERS={19:data};g.HONRO_PROJECT=V.author(g.HONRO_PROJECT,{enabled:true});
let app,b;const rowId=()=>app.dialogue?.lines[app.dialogue.index]?.[2]?.rowId;
function launch(){const p=h.profileThrough(18);p.seen['act2:first-spirit-encounter']=true;app=h.load(p);app.launch(19);app.turnNotice=null;b=app.engine.b;Object.assign(b,{side:0,phase:'aim'});assert(P.active(b));assert.equal(b.honroCampaignMapRevision,519);return b;}
function tick(n=1){for(let i=0;i<n&&!app.dialogue;i++){V.tick(app,.025);if(!app.dialogue)app.engine.stepUnits(.025);}}
function at(id,n=500){for(let i=0;i<n&&!app.dialogue;i++)tick();assert.equal(rowId(),id,JSON.stringify({want:id,actual:app.dialogue?.lines,m:R.memory(b),q:P.memory(b),current:V.current(b),safe:V.safe(app)}));assert(P.rowsReviewed(app.dialogue.lines));}
function finish(){h.finish(app);}
function resume(){app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;b=app.engine.b;}
function pose(u,p){Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});}
function use(id,cls){const p=V.marker(b,id),u=b.units.find(u=>u.cls===cls);pose(u,p);b.active=u.id;Object.assign(b,{side:0,phase:'aim'});return V.use(app,p);}
const allow=id=>R.allow(app,api.row(id));
launch();at('EDGE.ARRIVALS_19_0');assert(!b.units.some(u=>u.side===1));assert.equal(b.honroEvents.length,0);assert(R.memory(b).drops[1]&&R.memory(b).drops[2]);assert(!allow('A2.S19.EVIDENCE.02'));finish();at('A2.S19.MID.01');finish();
assert.equal(b.units.find(u=>u.cls==='archer').side,2);assert.equal(b.units.find(u=>u.cls==='knight').side,2);assert(use('route','mage'));at('A2.S19.MID.02');assert.equal(b.units.find(u=>u.cls==='mage').side,2);resume();at('A2.S19.MID.02');finish();
for(const n of [3,1,2]){if(n===2&&!api.done(b,'entangled')){pose(b.units.find(u=>u.cls==='occultist'),V.marker(b,'separate-2'));at('A2.S19.MID.04');assert.equal(R.memory(b).spirits[2].count,2);finish();}assert(use('separate-'+n,'occultist'));tick();if(n===3){if(rowId()==='A2.S19.MID.04')finish();at('A2.S19.MID.03');finish();}assert.equal(V.use(app,V.marker(b,'send-'+n)),false);for(let i=0;i<100&&!R.memory(b).spirits[n].departed;i++){tick();if(app.dialogue){assert(['A2.S19.MID.05','A2.S19.MID.06'].includes(rowId()));finish();}}assert(R.memory(b).spirits[n].departed);}
if(app.dialogue)finish();tick();if(app.dialogue)finish();assert(R.allGone(b));assert(!allow('A2.S19.MID.04'));assert(!R.optional({...app.profile,honroBattle:b},api.row('EDGE.OPTIONAL_19_OCCULTIST_0')));assert(!allow('A2.S19.EVIDENCE.05'));assert(use('old-soul','occultist'));at('A2.S19.EVIDENCE.01');assert(R.allMarks(b));assert(V.mem(b).transportTraceProof);resume();at('A2.S19.EVIDENCE.01');finish();at('A2.S19.COMPLETE.01');finish();at('A2.S19.COMPLETE.02');finish();at('A2.S19.COMPLETE.03');finish();
for(let i=0;i<5000&&!R.complete(b);i++){if(i%100===0)b.round++;tick();if(app.dialogue)finish();}
assert(R.complete(b),JSON.stringify(R.memory(b).retreat));assert.equal(app.profile.record.filter(r=>r.rowId==='A2.S19.JOURNAL.01').length,1);assert.equal(app.profile.record.filter(r=>r.rowId==='A2.S19.JOURNAL.02').length,1);V.recordOutcome(app,true);assert(app.profile.honroAct23V4History.stages[19].reviewed19);assert.equal(b.honroCounters.spawned,0);console.log('PASS19 exact 33 rows, NPC roles, two entangled visual bodies, free 3/1/2 order, automatic departure, saved cursor, physical marks and rearward NPC walk');
// No reviewed observation is manufactured from a historical clear alone.
launch();assert(!R.allGone(b));assert(!R.allMarks(b));assert(!R.complete(b));g.HONRO_ACT23_V4_PHASE_B_STAGES=[];assert(!P.enabled(19));assert.equal(V.mapRevision(19),219);console.log('PASS19 old completion and default build cannot authorize reviewed event evidence');
