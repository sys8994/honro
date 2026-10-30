import assert from 'node:assert/strict';
import {reuseBinaryEmissions} from '../shared/web-build.mjs';
const calls=[],emit=reuseBinaryEmissions(async(folder,name,extension,body)=>{calls.push({folder,name,extension,body});await new Promise(r=>setTimeout(r,1));return `${folder}/${name}.${extension}`;});
const body=Buffer.from([0,255,127,10]);
assert.deepEqual(await Promise.all([emit('graphics','first','webp',body),emit('graphics','alias','webp',Buffer.from(body))]),['graphics/first.webp','graphics/first.webp']);
assert.equal(calls.length,1);assert(calls[0].body.equals(body));
assert.equal(await emit('graphics','different','webp',Buffer.from([1,255,127,10])),'graphics/different.webp');
assert.equal(await emit('graphics','extension','png',body),'graphics/extension.png');
assert.equal(await emit('fonts','font','webp',body),'fonts/font.webp');
assert.equal(await emit('fonts','alias','webp',body),'fonts/font.webp');
for(const folder of ['runtime','entries','data']){await emit(folder,'one','js',body);await emit(folder,'two','js',body);assert.equal(calls.at(-1).name,'two');}
await emit('graphics','text-one','svg','same');await emit('graphics','text-two','svg','same');assert.equal(calls.at(-1).name,'text-two');
console.log('PASS exact binary alias reuse including concurrent calls; distinct bytes/extensions/folders remain distinct; JS/JSON/text identity untouched');
