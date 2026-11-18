/** Metadata preservation only. Native rendering is not an acceptance oracle. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applyStage29LeftBlend} from '../tools/environment/stage29-handoff-left-blend.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const a=JSON.parse(await readFile(new URL('../shared/assets/environment/act3-handoff/stage29-west-bank.json',import.meta.url),'utf8'));
assert.deepEqual(a.params.edgeFade,[[0,170],[3770,4150]]);
const original=structuredClone(a);original.params.edgeFade[0]=null;
assert.equal(hash(original),'95cc60c86303aea61ec89e516c1b710e6afc97bff97c0ccaa33d7dbc44bd9d9e','Only the single left-fade metadata slot changes');
assert.equal(hash(a.vector),'79c64b1a7349057a972fd777ea221c7671e2f74996dd7689d84fb588ba49353d','Original vector unchanged');
assert.deepEqual(applyStage29LeftBlend(original),a);assert.deepEqual(applyStage29LeftBlend(a),a);
assert.throws(()=>applyStage29LeftBlend({...a,id:'act3-handoff:26:kiln-foundation'}));
assert(a.params.edgeFade[0][1]<a.params.contactMapping[1][2],'Blend remains within first strip');
console.log(JSON.stringify({stage:29,metadataSlotOnly:true,vectorMappingBoundsCollisionRightFadeUnchanged:true,generatorParity:true,idempotent:true,originalHash:hash(original),candidateHash:hash(a),vectorHash:hash(a.vector),scope:'Static contract only. Actual Chrome A/B must check left join and upper stone/rim; no Native visual acceptance.'}));
