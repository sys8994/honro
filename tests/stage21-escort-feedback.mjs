/** Actual saved battle fixture; read-only presentation checks, not a playthrough. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const p=JSON.parse(await readFile('_local/reports/stage21-current/ui-play-v3/continue-entry.json','utf8'));
const h=await appHarness({productionStory:true}),app=h.load(p.profile);app.continue();
const b=app.engine.b,V=h.g.HonroAct23V4,R=h.g.HonroAct23V4Chapter21Reviewed,before=plain(b),view=V.state(b),t=view.targets.find(t=>t.id==='21-escort-threat');
assert(t,'actual R12 threat-stop must identify its blocker');const foe=b.units.find(u=>u.id===t.unitId),guard=b.units.find(u=>u.id===b.honroV4CitySpec.guard);
assert(foe.side===1&&!foe.dead&&V.near(foe,guard,240));assert.equal(t.x,foe.x);assert.equal(t.y,foe.y-foe.h);assert.equal(view.targets.find(t=>t.id==='gate-resident').label,'주민 호송');assert.deepEqual(plain(b),before);
// Controlled disappearance fixture: a stale recorded stop must not point to a corpse.
for(const u of b.units)if(u.side===1&&V.near(u,guard,240))u.dead=true;
assert.equal(R.escortHint(b),null);console.log('PASS live escort blocker, compact label and read-only battle presentation');
