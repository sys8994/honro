import fs from 'node:fs';
import assert from 'node:assert/strict';
import {compileNativeDraft} from './partition.mjs';
const read=n=>JSON.parse(fs.readFileSync(new URL(n,import.meta.url)));
const {facets,contacts}=read('./contact-pointer-itinerary.json');
const design={...read('./b01-pointer-plan.json'),version:2,facets,contacts};
const native=compileNativeDraft(design),parent=compileNativeDraft({...design,facets:[],contacts:[]});
assert.deepEqual(native.root.children.slice(0,parent.root.children.length),parent.root.children);
assert.deepEqual(native.collision,[]);
assert.equal(native.root.children.length,12);
for(const [modify,reason] of [
 [d=>d.facets[0].owner='mass-1',/Facet crosses/],
 [d=>d.contacts[1].points[0]=[500,1300],/지지/],
 [d=>d.contacts[1].points=[[1500,2300],[3200,2250],[5400,2280]],/분리/],
 [d=>d.contacts[2].points=[[5900,1450],[6100,1800]],/허용 경사/],
 [d=>d.contacts[3].points=d.contacts[0].points.slice(0,2),/겹칩니다/],
]){
 const next=structuredClone(design);modify(next);assert.throws(()=>compileNativeDraft(next),reason);
}
console.log(JSON.stringify({scope:'local native geometry predicate, not actual browser or collision',pass:true,paths:12}));
