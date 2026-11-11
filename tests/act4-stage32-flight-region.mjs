/** Stage32 low harbour sky. Isolated production Engine checks on a fresh
 * battle; NOT normal play or browser evidence (see STAGE32_ROUNDS_2026-11-11.md). */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {STAGE32_FLIGHT_REGION} from '../shared/act4-stage32-author.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE,rows=[];
const app=h.load(h.profileThrough(31));app.launch(32);h.finish(app);const e=app.engine,b=e.b;
assert.deepEqual(plain(b.honroMap.flightRegion),plain(STAGE32_FLIGHT_REGION));
const lantern=e.unit('a4-32-d-3');assert(C.flyingEnemy(lantern));
// Authored door post is unchanged and legal inside the region.
assert.equal(Math.round(lantern.x),3234);assert(C.flightClear(e,lantern,lantern),'authored lantern pose is clear');
rows.push('fresh battle carries the region; lantern keeps its door post ('+Math.round(lantern.x)+','+Math.round(lantern.y)+')');
// The whole animated envelope must stay under the sky limit.
const bounds=C.flightBounds(lantern),lowest=STAGE32_FLIGHT_REGION.top+(lantern.y-bounds.head);
assert(C.flightClear(e,lantern,{x:lantern.x-40,y:lowest+2}),'just inside the limit');
assert(!C.flightClear(e,lantern,{x:lantern.x-40,y:lowest-6}),'above the limit is refused');
assert(!C.flightClear(e,lantern,{x:lantern.x-40,y:357}),'previously observed altitude is refused');
rows.push('paid flight above feet y'+Math.round(lowest)+' is refused (observed before: y118-530)');
// Roster, HP and the all-enemies requirement are untouched.
assert.equal(b.units.filter(u=>u.side===1).length,12);assert.equal(g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===32).units.find(u=>u.id==='a4-32-d-3').x,3234.0000000000005);
// A saved battle without the region keeps its own map on Continue.
const old=plain(b);delete old.honroMap.flightRegion;const saved={...plain(app.profile),honroBattle:old};const again=h.load(saved);again.continue();
assert.equal(again.engine.b.honroMap.flightRegion,undefined);assert.equal(again.engine.b.honroStage,32);rows.push('an existing saved battle keeps its own map without the region');
console.log('PASS Stage32 flight region',rows);
