import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),p=g.HONRO_PROJECT,s=p.stages.find(v=>v.metadata.stageId===23);
const id='canal-upper-gallery-rear-piers',element=s.elements.find(e=>e.id===id),asset=p.library.find(a=>a.id===element.assetId);
const supports=asset.params.structuralSupports,bank=g.HonroMaps.compile(s,p).terrain.find(t=>t.id==='city-foundation');
assert.equal(supports.length,14,'Eight gallery posts and six bridge-house piers');
assert.equal(asset.collision.length,0,'Rear support artwork does not add an invisible walking or shooting barrier');
assert.equal(element.layer,'back');assert.equal(element.depthLayer,'L1');
for(const q of supports){
 const house=s.elements.find(e=>e.id===q.element);
 assert(s.elements.indexOf(element)<s.elements.indexOf(house),'Existing opaque house facades occlude the rear posts');
 assert.equal(q.foundation,'city-foundation');assert.equal(q.top,house.y);
 const foot=g.HONRO_CORE.terrainSurfaces(bank,q.x).filter(v=>v.y>q.top+25).map(v=>v.y).sort((a,b)=>a-b)[0];
 assert.equal(q.bottom,foot,'Support reaches actual bank or canal bed, not an unrelated roof');
 assert(q.bottom>q.top);
}
assert.deepEqual([...new Set(supports.map(q=>q.element))].sort(),['office-upper','gate-upper','west-quay-tower','bridge-tower','canal-watch'].sort());
console.log('PASS Stage23 rear architecture:14 foundation contacts, five supported buildings, occlusion order, no collision');
