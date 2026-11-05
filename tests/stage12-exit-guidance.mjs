/** Presentation fixtures only; no normal clear claimed. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),g=h.g,V=g.HonroAct23V4,S=g.HonroAct23V4Act2Scenes;
const entry=JSON.parse(gunzipSync(await readFile('game/docs/stage-review/stage12-quarry/evidence/normal/entry-profile.json.gz'))).profile;
let app=h.load(entry);app.launch(12);h.finish(app);let b=app.engine.b;
S.memory(b).proof.sign={fixture:true};
const knight=b.units.find(u=>u.cls==='knight'&&u.side===0),upper=b.honroRouteSpec.routes.find(r=>r.id==='A'),lower=b.honroRouteSpec.routes.find(r=>r.id==='B');
const pose=r=>Object.assign(knight,{x:V.marker(b,r.markerId).x,y:V.marker(b,r.markerId).y});
b.active=knight.id;
const base='열린 내리막으로 진입';assert.equal(V.state(b).currentInstruction,base);
pose(upper);const before=plain(b);let state=V.state(b);
assert.match(state.currentInstruction,/높은 경로 · 남은 위협 5:/);
assert.match(state.currentInstruction,/정예 공명혼/);assert.match(state.currentInstruction,/소단으로 혼 확인/);
assert.equal(state.visibleChecklist[0].text,state.currentInstruction);
assert.deepEqual(plain(b),before,'presentation does not mutate snapshot');
for(const key of upper.defeatIds.filter(k=>k!=='sq-g4')){const u=b.units.find(u=>u.id===key);u.hp=0;u.dead=true;}
assert.match(V.state(b).currentInstruction,/남은 위협 1: 정예 공명혼/);
assert(!g.HonroRouteBranches.requirements(b,upper));
const elite=b.units.find(u=>u.id==='sq-g4');
for(const patch of [{honroSubdued:true},{side:0},{dead:true},{hp:0}]){
 const saved=plain(elite);Object.assign(elite,patch);assert.equal(V.state(b).currentInstruction,base);assert(g.HonroRouteBranches.requirements(b,upper));Object.assign(elite,saved);
}
pose(lower);assert.equal(V.state(b).currentInstruction,base);
pose(upper);b.honroRouteChoice.selectedRoute='A';assert.equal(V.state(b).currentInstruction,base);b.honroRouteChoice.selectedRoute=null;
b.active=b.units.find(u=>u.cls==='occultist'&&u.side===0).id;assert(!V.state(b).currentInstruction.includes('소단으로'));
console.log('PASS Stage12 read-only upper exit guidance, count/names, hidden spirit hint, defeat predicate parity, lower/committed suppression');
