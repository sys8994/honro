import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
import {readFile} from 'node:fs/promises';
const g=await runtime({legacyMaps:false});
const p=process.env.HONRO_PROJECT_FILE?JSON.parse(await readFile(process.env.HONRO_PROJECT_FILE,'utf8')):g.HONRO_PROJECT;
const s=p.stages.find(v=>v.metadata.stageId===23);
if(s.design.act3.locationRevision===1){
 const compiled=g.HonroMaps.compile(s,p).terrain;
 const get=id=>{const e=s.elements.find(e=>e.id===id);assert(e,'Missing '+id);const a=p.library.find(a=>a.id===e.assetId);assert(a);return{e,a};};
 for(const [id,arch] of [['west-stone-loading-bridge','west-masonry-water-arch'],['east-stone-loading-bridge','east-masonry-water-arch']]){
  const {e,a}=get(id),t=compiled.find(t=>t.honroElementId===id);assert(t);assert.equal(a.params.collisionSource,'drawn-structural-polygons');assert.equal(a.collision.length,1);
  const contour=a.collision[0].slice(0,a.collision[0].length/2);for(const point of contour)assert(g.HONRO_CORE.terrainSurfaces(t,point.x).some(q=>Math.abs(q.y-point.y)<.01),'Actual bridge top follows its drawn contour');
  const back=get(arch);assert.equal(back.a.collision.length,0);assert.equal(back.e.layer,'back');assert(s.elements.indexOf(back.e)<s.elements.indexOf(e),'Stone bridge occludes rear arch');
 }
 const pier=get('canal-bridge-bearing-piers');assert.equal(pier.a.collision.length,0);assert.equal(pier.a.params.rearOnly,true);
 for(const id of ['western-vault-wall','eastern-vault-wall']){const wall=get(id);assert.equal(wall.a.collision.length,0);assert.equal(wall.a.params.backgroundWall,true);assert(s.elements.indexOf(wall.e)<s.elements.indexOf(get('west-stone-loading-bridge').e),'Vault wall stays behind actual deck');}
 assert(compiled.some(t=>t.honroLocationCeiling&&t.honroCeiling),'Underground canal has a real solid ceiling');
 assert(!s.elements.some(e=>e.id==='korean-watergate-pavilion'),'Surface-city pavilion is not copied into the underground canal');
 console.log('PASS underground Stage23: two real bridge contours, rear masonry order, explicit vault walls and solid ceiling');
}else if(s.design.act3.koreanTown){
 const compiled=g.HonroMaps.compile(s,p).terrain;
 const get=id=>{const e=s.elements.find(e=>e.id===id);assert(e,'Missing '+id);return {e,a:p.library.find(a=>a.id===e.assetId)};};
 const pavilion=get('korean-watergate-pavilion');
 const bridge=compiled.find(t=>t.honroElementId==='west-water-bridge');
 assert(g.HONRO_CORE.terrainSurfaces(bridge,pavilion.e.x).some(q=>Math.abs(q.y-pavilion.e.y)<.01),'Watergate pavilion is seated on the actual stone bridge deck');
 const braces=get('korean-roof-repair-braces');
 assert.equal(braces.a.collision.length,0,'Rear braces do not add walking/shooting barriers');
 assert.equal(braces.e.layer,'back');
 assert(braces.a.params.structuralSupports.length>=2,'Short repair walk has at least two real roof contacts');
 for(const q of braces.a.params.structuralSupports){
  const actual=compiled.filter(t=>t.honroElementId===q.support).flatMap(t=>g.HONRO_CORE.terrainSurfaces(t,q.x));
  assert(actual.some(v=>Math.abs(v.y-q.bottom)<.01),'Brace terminates on its compiled roof');
  assert(q.bottom>q.top&&q.bottom-q.top<180,'Only short roof-bearing posts, no stretched empty tower');
  assert(s.elements.indexOf(braces.e)<s.elements.indexOf(get(q.element).e),'Real architecture occludes rear braces');
 }
 for(const id of ['roof-entry','korean-watergate-roof-access']){const stair=get(id),t=compiled.find(t=>t.honroElementId===id);assert.equal(stair.a.oneWay,true);assert.equal(t.oneWay,true,'Authored open roof stairs allow upward passage');}
 const archive=get('customs-hall'),bank=compiled.find(t=>t.id==='city-foundation');
 assert.equal(archive.a.params.koreanType,'limited-three-level-archive');
 assert(g.HONRO_CORE.terrainSurfaces(bank,archive.e.x).some(q=>Math.abs(q.y-archive.e.y)<.01),'Three-level archive is founded on the real quay');
 for(const [id,y,x] of [['korean-customs-middle',2470,5070],['korean-customs-upper',2210,5070]]){
  const gallery=get(id),t=compiled.find(t=>t.honroElementId===id);
  assert.equal(gallery.a.oneWay,true);assert.equal(t.oneWay,true,'Open storage gallery is an explicit one-way platform');
  assert(g.HONRO_CORE.terrainSurfaces(t,x).some(q=>Math.abs(q.y-y)<.01),'Storage floor uses its actual drawn top');
 }
 for(const id of ['office-upper','gate-upper','west-quay-tower','bridge-tower','canal-watch'])assert(!s.elements.some(e=>e.id===id),'Obsolete stretched tower removed: '+id);
 console.log('PASS Korean Stage23: seated watergate, short roof contacts, grounded archive, actual open storage floors');
}else{

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
}
