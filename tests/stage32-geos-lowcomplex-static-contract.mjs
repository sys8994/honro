import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const production=await readFile(new URL('../shared/runtime/stage32-foundation-art.js',import.meta.url),'utf8'),candidate=await readFile(new URL('./fixtures/stage32-geos-lowcomplex-candidate.js',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(production).digest('hex'),'0281052db3e3d89efff8a75d9859ffe871a50ceef4a7d17ec7398a7c2ff1f6b0');
assert.equal(createHash('sha256').update(candidate).digest('hex'),'db5ed9c154d9b0950e8fea91f89cd5166b1ed06352386139f4c971c2d76acc71');
for(const token of ['getImageData(', 'putImageData(', "createElement('canvas')"]){assert.equal(candidate.split(token).length,production.split(token).length,token);}
const begin='function coherentColor',end='function draw';const expected=production.slice(production.indexOf(begin),production.indexOf(end)).trim();const actual=candidate.slice(candidate.indexOf(begin),candidate.indexOf('// Test-only connected nonwalk gray seam')).trim();assert.equal(actual,expected,'SS path changed');
console.log('Static exact-production and unchanged SS/readback/allocation-count contracts passed; Scene protection proof is separate.');

assert(candidate.includes('let nativeCoverage=null;'));assert(candidate.includes('if(!nativeCoverage){'));
