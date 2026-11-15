import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {journey} from '../shared/act5-world.mjs';
assert.equal(journey.width,1024);assert.equal(journey.height,1536);
assert.equal(journey.stages.length,10);assert.equal(journey.progressRoutes.length,9);
assert.match(journey.asset,/journey-maps\/v1\/act5.webp$/);
for(const [i,s] of journey.stages.entries()) {assert.equal(s.stageNumber,41+i);assert.equal(s.stageId,'stage-'+(41+i));assert(s.x>0&&s.x<journey.width&&s.y>0&&s.y<journey.height);}
assert((await stat(new URL('../'+journey.asset,import.meta.url))).size<500000);
assert(journey.progressRoutes.every(p=>/[CQ]/.test(p)));
console.log('PASS Act5 illustrated atlas: 10 ordered anchors, 9 curved routes, native portrait aspect, <500KB asset');
