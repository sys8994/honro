/** Shared attachment contracts, including a translated indoor-sized specimen.
 * This is not a redesign or a gameplay test of chapter12. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false});
vm.runInContext(await readFile('shared/runtime/geology-art.js','utf8'),g);
const st=g.HONRO_PROJECT.stages[1],b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,g.HonroMaps.profileFor(st),{origin:'campaign'});
const before=JSON.stringify(b),a=g.HonroGeologyArt.prepare(b);
assert.equal(a.views.length,22);assert.equal(g.HonroGeologyArt.prepare(b),a);
for(const view of a.views){const asset=view.asset,socket=asset.sockets.find(s=>s.id===view.attachment.socket)||asset.reference.foot;
 assert.equal(view.x+socket.x*view.scale,view.attachment.contactX);
 assert.equal(asset.collision.length,0);assert(asset.params.rearOnly);
 assert(asset.reference.scaleRange[0]<=view.scale&&view.scale<=asset.reference.scaleRange[1]);
}
assert.equal(JSON.stringify(b),before,'Preparing shared geology cannot edit battle/save state');
const legacy=structuredClone(b);legacy.honroMap.geologyComposition={version:1,instances:[]};const legacyBefore=JSON.stringify(legacy);assert.equal(g.HonroGeologyArt.prepare(legacy).views.length,22,'Same-revision Continue resolves current decorative layout');assert.equal(JSON.stringify(legacy),legacyBefore,'Decorative refresh does not migrate the saved battle');const custom=structuredClone(legacy);custom.honroCustom=true;assert.equal(g.HonroGeologyArt.prepare(custom).views.length,0,'Workshop retains its authored layout');
const ids=['geology:granite-vertical','geology:granite-foundation','geology:granite-ledge-neck'];
function specimen(dx,dy){return{honroStage:12,sceneVersion:0,terrain:[],honroMap:{geologyComposition:{version:1,rearDatums:[{id:'specimen-foot',x:dx,y:dy}],instances:ids.map((assetId,i)=>({id:'specimen-'+i,assetId,scale:1,support:{datumId:'specimen-foot'}}))}}};}
const one=specimen(0,0),two=specimen(7200,-1300),oneSource=JSON.stringify(one),twoSource=JSON.stringify(two),x=g.HonroGeologyArt.prepare(one).views,y=g.HonroGeologyArt.prepare(two).views;
assert.equal(x.length,3);assert.equal(y.length,3);
for(let i=0;i<3;i++){assert.equal(x[i].asset,y[i].asset,'Same shared asset, no chapter-specific shape clone');assert.equal(y[i].x-x[i].x,7200);assert.equal(y[i].y-x[i].y,-1300);}
assert.equal(JSON.stringify(one),oneSource);assert.equal(JSON.stringify(two),twoSource);
const invalid=specimen(0,0);invalid.honroMap.geologyComposition.instances[0].scale=2;
assert.throws(()=>g.HonroGeologyArt.prepare(invalid),/outside native contract/);
console.log('PASS native-size shared socket/datum composition, cached pure views, three assets reused at translated chapter12 specimen coordinates; no chapter12 map change');
