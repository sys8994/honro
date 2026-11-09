// Production App/Story/Engine; DOM/Canvas and approach positions are fixtures.
// Verify restored text, departure order and actual serialization, not fullplay.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),g=h.g,V=g.HonroAct23V4,P=g.HonroAct23V4ReviewedChapters,R=g.HonroAct23V4Reviewed19,C=g.HONRO_CORE;
const original=JSON.parse(await readFile('shared/data/narrative-current.json','utf8')).stages[19],data=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch19.json','utf8'));
const expected=[1,2,3].flatMap(i=>['separate','send'].flatMap(phase=>original.beats[phase+'-'+i]));
assert.equal(expected.length,35);assert.deepEqual(data.familyRestoration.rows.map(r=>[r.speaker,r.text]),expected.map(r=>r.slice(0,2)));
let app,b;const seen=new Set(),projection=()=>plain(b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,side:u.side,dead:u.dead,acted:u.acted}))),growth=p=>plain({heroes:p.heroes,loadouts:p.loadouts,equipment:p.equipment,cleared:p.cleared,recruited:p.recruited});
function launch(){const p=h.profileThrough(18);p.seen['act2:first-spirit-encounter']=true;app=h.load(p);app.launch(19);app.turnNotice=null;b=app.engine.b;assert(P.active(b));assert.equal(b.honroCampaignMapRevision,519);}
function line(){return app.dialogue?.lines[app.dialogue.index];}
function step(){if(app.dialogue){const l=line();if(l){seen.add(l[2]?.rowId);assert.equal(l[1],P.row(l[2].rowId,19).text);}g.HonroStory.next(app);}else{Object.assign(b,{side:0,phase:'aim'});V.tick(app,.025);app.engine.stepUnits(.025);}}
function until(test,max=1200){for(let i=0;i<max&&!test();i++)step();assert(test(),JSON.stringify({row:line(),physical:R.memory(b),events:P.memory(b).events,current:V.current(b),phase:b.phase}));}
function use(id,cls){const m=V.marker(b,id),u=b.units.find(u=>u.id==='p-'+cls);Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,jumping:false,airborne:false,acted:false});assert(C.validTerrainContactPose(b.terrain,u));Object.assign(b,{active:u.id,side:0,phase:'aim'});assert(V.use(app,m),'use '+id);}
function resume(){const before={units:projection(),growth:growth(app.profile),index:app.dialogue?.index,id:line()?.[2]?.rowId};app.stopBattle();app=h.load(plain(app.profile));app.continue();app.turnNotice=null;b=app.engine.b;assert.deepEqual(projection(),before.units);assert.deepEqual(growth(app.profile),before.growth);assert.equal(app.dialogue?.index,before.index);assert.equal(line()?.[2]?.rowId,before.id);return before;}
launch();until(()=>P.done(b,'response'));use('route','mage');until(()=>P.done(b,'opened'));
let saved,partial;
for(const i of [3,1,2]){
 until(()=>!app.dialogue&&V.safe(app));
 use('separate-'+i,'occultist');assert.equal(line()[2].rowId,data.familyRestoration.scenes['separate-'+i][0]);assert(!R.memory(b).spirits[i].departed);
 if(i===1){step();step();saved=resume();}
 until(()=>P.done(b,'family.separate.'+i));assert(!R.memory(b).spirits[i].departed);assert(!V.mem(b).farewell?.['send-'+i]);
 until(()=>app.dialogue?.reviewedEvent==='family.send.'+i);assert(!R.memory(b).spirits[i].departed);
 until(()=>P.done(b,'family.send.'+i));assert(!R.memory(b).spirits[i].departed);
 until(()=>R.memory(b).spirits[i].departed);assert.equal(V.mem(b).farewell['send-'+i].status,'done');
 if(i===3){resume();partial=plain(app.profile);}
}
assert(expected.every(l=>seen.has(l[2].rowId)));assert.deepEqual([...R.memory(b).familyRepair.carried],[]);assert(R.allGone(b));
// A genuine old in-flight save has no restoration state/receipts. It must not
// respawn departed souls, rewind completed interactions or restart the battle.
app.stopBattle();const full=plain(app.profile);
for(const legacy of [partial,full]){const lb=legacy.honroBattle;delete R.memory(lb).familyRepair;for(const key of Object.keys(P.memory(lb).events))if(key.startsWith('family.'))delete P.memory(lb).events[key];
const oldUnits=plain(lb.units),oldGrowth=growth(legacy),oldDone=plain(V.mem(lb).done),oldFarewell=plain(V.mem(lb).farewell);
app=h.load(legacy);app.continue();app.turnNotice=null;b=app.engine.b;
assert.deepEqual(plain(b.units),oldUnits);assert.deepEqual(growth(app.profile),oldGrowth);assert.deepEqual(plain(V.mem(b).done),oldDone);assert.deepEqual(plain(V.mem(b).farewell),oldFarewell);assert.equal(b.honroCampaignMapRevision,519);
until(()=>!app.dialogue&&V.safe(app));V.tick(app,.025);assert.deepEqual([...R.memory(b).familyRepair.carried],[1,2,3].filter(i=>oldDone['separate-'+i]));
if(legacy===partial){use('separate-1','occultist');assert.equal(line()[2].rowId,data.familyRestoration.scenes['separate-1'][0]);}
}
console.log('PASS19 exact 35 original family rows; free 3-1-2 order; dialogue precedes departure; cursor/units/growth Continue; old in-flight progress retained');
