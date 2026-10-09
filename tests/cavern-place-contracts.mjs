import {historicalStage16Runtime,beforeCurrentStage16Temple} from './stage16-temple-history-helpers.mjs';
// Exact old temple layers retain the original preservation fixture and assertions.
import {assertCavernLibraryPreserved} from './cavern-library-provenance-helpers.mjs';
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {runtime,battlefield} from '../game/tests/helpers.mjs';import {applyCavernPlaceLayers} from '../tools/map-forge/cavern-place-layers.mjs';import {assertStanding} from './act2-spatial-test-helpers.mjs';
const g=historicalStage16Runtime(await runtime({legacyMaps:false})),p=beforeCurrentStage16Temple(JSON.parse(await readFile('shared/data/campaign.json','utf8'))),plain=x=>JSON.parse(JSON.stringify(x)),q=plain(g.HonroMaps.finalize(applyCavernPlaceLayers(plain(p))));
assert.deepEqual(q,p,'Temple authoring must be idempotent');
const fixture=JSON.parse(await readFile('tests/fixtures/temple-layer-preservation.json','utf8')),s=p.stages[15],hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),f=u=>Object.fromEntries(Object.entries(u).filter(([k])=>!['x','y','spawnX','spawnY'].includes(k)));
assert.equal(hash({objectives:s.objectives,events:s.events,markers:s.markers,initialState:s.initialState,anchors:s.anchors}),fixture.mission);assert.equal(hash(s.units.map(f)),fixture.units);assertCavernLibraryPreserved(p.library,fixture.library);
assert.equal(g.HONRO_PROJECT.stages[15].elements.find(e=>e.assetId==='act2:temple').y,4320,'Production build must bind hall to actual upper rock');
const {b,e}=battlefield(g,16);for(const u of e.heroesAlive())for(const point of s.design.space.routes.find(r=>r.id==='main').anchors)assertStanding(g,b,e,point,u,`${u.cls}/${point.x}`);
assert.deepEqual(plain(g.HonroMaps.finalize(JSON.parse(g.HonroMaps.serialize(p)))),p);
console.log('PASS temple canonical idempotency, mission/roster/library preservation, production binding, all anchor/body clearances and roundtrip');
