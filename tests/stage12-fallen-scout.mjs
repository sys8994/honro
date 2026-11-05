/** Isolated lifecycle regression. Poses/death/loop setup are fixtures, not a clear. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),{g}=h,V=g.HonroAct23V4,S=g.HonroAct23V4Act2Scenes;
const entry=JSON.parse(gunzipSync(await readFile('game/docs/stage-review/stage12-quarry/evidence/normal/entry-profile.json.gz'))).profile;
let app=h.load(entry);app.launch(12);h.finish(app);let b=app.engine.b;
assert(g.HonroAct23V4ReviewedChapters.active(b),'current shipped chapter contract');
const hero=cls=>b.units.find(u=>u.side===0&&u.cls===cls);
for(const phase of ['out','return']){
 const scout=hero('archer'),mage=hero('mage'),knight=hero('knight'),spec=b.honroV4Recurrence;
 Object.assign(scout,{hp:0,dead:true});Object.assign(mage,{x:spec.landmark.x,y:spec.landmark.y,vx:0,vy:0});
 for(const u of [knight,hero('occultist')])Object.assign(u,{x:spec.landmark.x+900,y:spec.landmark.y});
 S.memory(b).loop={phase,actor:scout.id,distance:1700,first:{...spec.landmark},checkpoint:{...spec.checkpoint}};
 Object.assign(b,{phase:'aim',side:0,active:mage.id});app.turnNotice=null;app.close();
 assert.equal(V.failure(b),null,'fallen archer alone is not mission failure');
 S.tick(app,.025);
 assert.equal(S.memory(b).loop.actor,mage.id);
 assert.equal(S.memory(b).loop.phase,'out');
 assert.equal(S.memory(b).loop.distance,0,'replacement cannot inherit dead scout distance');
 assert(!S.memory(b).proof['12.recurrence'],'replacement is not automatic completion');
 const fresh=plain(S.memory(b).loop);Object.assign(knight,{x:spec.landmark.x,y:spec.landmark.y});S.tick(app,.025);
 assert.deepEqual(plain(S.memory(b).loop),fresh,'living scout keeps ownership');
 app.stopBattle();app=h.load(plain(app.profile));app.continue();h.finish(app);b=app.engine.b;
 assert.deepEqual(plain(S.memory(b).loop),fresh,'replacement persists through Continue');
}
Object.assign(hero('mage'),{hp:0,dead:true});assert.equal(V.failure(b),'v4.required-actor','existing mage survival condition retained');
console.log('PASS isolated Stage12 fallen scout: outbound/return reacquisition, no free progress, live ownership, Continue, mage failure retained. Not normal fullplay.');
