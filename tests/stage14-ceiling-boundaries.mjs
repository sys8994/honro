import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
function shot(id,angle,power,x=null){const p=C.defaults();p.recruited=C.CLASS_IDS;for(const cls of C.CLASS_IDS)p.heroes[cls].xp=C.xpAtLevel(13);const cls=id[0]==='M'?'mage':'archer';
 function learn(id){if(p.heroes[cls].ranks[id])return;const n=C.TALENT_MAP[id];if(n.prereq)learn(n.prereq);assert(C.train(p.heroes[cls],id));}if(id!=='A01')learn(id);p.loadouts[cls]=[id];
 const q=battlefield(g,14,{profile:p}),u=q.e.heroesAlive().find(u=>u.cls===cls);q.b.units=[u];q.b.active=u.id;q.e.checkEnd=()=>false;if(x!==null){Object.assign(u,{x,y:C.topAt(q.b.terrain.find(t=>t.id==='v14-upper-hamlet'),x),vx:0,vy:0});assert(C.validTerrainContactPose(q.b.terrain,u));}
 const prediction=plain(q.e.predict(u,C.SKILLS[id],angle,power)),contacts=[],impact=q.e.impact.bind(q.e);q.e.impact=(p,h)=>{contacts.push({terrain:h.terrain?.id,x:h.x,y:h.y,generation:p.bounces});return impact(p,h);};assert(q.e.fire(id,angle,power));
 let minY=Infinity,substeps=0;for(let n=0;n<3000&&q.b.projectiles.length;n++)for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p)){minY=Math.min(minY,p.y);substeps++;q.e.stepProjectile(p,C.STEP);}
 assert.equal(q.b.projectiles.length,0);const end=contacts.at(-1);assert(Math.hypot(prediction.x-end.x,prediction.y-end.y)<1e-6,'Prediction/live endpoint');return{id,angle,power,actualFlight:{minY,substeps},preparedPose:{x:u.x,y:u.y},prediction:{x:prediction.x,y:prediction.y},contacts};
}
const low=shot('A01',15,.3,2500),freeHigh=shot('A01',90,1,2500),high=shot('A01',60,.9,2980),reflection=shot('M11',60,1,2980);assert.equal(low.contacts[0].terrain,'v14-upper-hamlet');assert.equal(freeHigh.contacts[0].terrain,'v14-upper-hamlet','Large upper chamber permits full high arc');assert.equal(high.contacts[0].terrain,'v14-cavern-vault');assert.equal(reflection.contacts[0].terrain,'v14-cavern-vault');assert.equal(reflection.contacts[1].generation,1);rows.push({case:'Finite actual shots: upper chamber free high arc versus short neck interception/reflection. Legal level13 SP, one supported initial pose, isolated actors; no live correction.',low,freeHigh,high,reflection});
const h=await appHarness();let app=h.load(h.profileThrough(13));app.launch(14);h.finish(app);app.stopBattle();let p=plain(app.profile),expected=plain(p.honroBattle);assert.equal(expected.honroCampaignMapRevision,1);app=h.load(p);app.continue();assert.deepEqual(plain(app.engine.b),expected,'Whole-battle new geometry Continue exact');rows.push({case:'same revision whole-battle Continue exact'});
// Actual historical normal-input R21 snapshot: geography policy deliberately
// restarts only this obsolete battle; growth/equipment/campaign are retained.
p=JSON.parse(gunzipSync(await readFile('tests/fixtures/stage14-rescue-r21-checkpoint-20261022.json.gz')));p=p.profile||p;
const retained=Object.fromEntries(['heroes','loadouts','cleared','honroGrowth','recruited','playerTurnOrder'].filter(k=>p[k]!==undefined).map(k=>[k,plain(p[k])]));app=h.load(p);assert.equal(app.profile.honroBattle,null);assert.equal(app.profile.honroMapRestart,14);
for(const[k,v]of Object.entries(retained))assert.deepEqual(plain(app.profile[k]),v,'Old growth/order retained '+k);
app.continue();h.finish(app);assert.equal(app.engine.b.honroCampaignMapRevision,1);assert(app.engine.b.terrain.find(t=>t.id==='v14-family-roof-step').oneWay);assert(app.engine.b.terrain.some(t=>t.id==='v14-cavern-vault'));rows.push({case:'actual old R21 save restarts14 under existing map-revision policy; growth/equipment/clears/order retained',oldRound:21});
app.stopBattle();p=plain(app.profile);p.honroBattle.round=9;p.honroBattle.honroCampaignMapRevision=0;app=h.load(p);assert.equal(app.profile.honroMapRestart,14);rows.push({case:'prepared obsolete R9 revision fixture restarts14, not actual user save'});
await mkdir('_local/reports/act2-ceiling-20261023',{recursive:true});await writeFile('_local/reports/act2-ceiling-20261023/boundaries.json',JSON.stringify({pass:true,rows,limits:'Prepared/isolated shots and production App DOM/storage doubles; no fresh campaign combat completion, no actual user R9 save. Old14 battle is restarted by mandated map revision, not silently patched.'},null,2)+'\n');console.log('PASS actual low/high/reflected shots and geometry save boundaries');
