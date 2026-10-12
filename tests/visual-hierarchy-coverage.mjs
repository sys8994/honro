import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,performance,structuredClone,setTimeout,clearTimeout});g.window=g;
for(const part of await runtimeParts({vector:false,render:false}))vm.runInContext(part,g);
const rows=[],V=g.HonroVisualStyle;
for(const stage of g.HONRO_PROJECT.stages){
 const b=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,undefined,{origin:'campaign'}),before=JSON.stringify(b),row={stage:b.honroStage,gameplay:0,decoration:0,depths:{},vectors:0,primitiveAssets:0,native:0,scenery:0};
 for(const l of b.honroLandmarks){const role=V.classify(l,b),depth=role==='gameplay'?'gameplay':V.depth(l);row[role]++;row.depths[depth]=(row.depths[depth]||0)+1;if(l.asset?.vector)row.vectors++;else if(l.asset)row.primitiveAssets++;else row.native++;
  if(l.collisionIds?.length||l.asset?.interactionType||l.asset?.collision?.length)assert.equal(role,'gameplay',`${stage.id}/${l.id}: semantic gameplay independent of draw order`);
  if(role==='decoration')assert(V.STYLE.saturation[depth]<1,`${stage.id}/${l.id}: decoration always has a distance finish`);
 }
 for(const l of b.honroEnvironment.placements){assert.equal(V.classify(l,b),'decoration');assert(V.STYLE.saturation[V.depth(l)]<V.STYLE.saturation.L1);row.scenery++;}
 if(b.honroStage===17){for(const id of ['s17-art-entry-timber-store','s17-art-west-tool-bench'])assert.equal(V.classify(b.honroLandmarks.find(l=>l.id===id),b),'decoration',id);assert.equal(V.depth(b.honroLandmarks.find(l=>l.id==='s17-art-rear-cavern')),'L3');for(const id of ['s17-art-main-hoist','s17-art-control-drive-link'])assert.equal(V.classify(b.honroLandmarks.find(l=>l.id===id),b),'gameplay');}
 if(b.honroStage===23){for(const id of ['sy-art-stone-bridge','sy-art-cargo'])assert.equal(V.classify(b.honroLandmarks.find(l=>l.id===id),b),'gameplay',id);assert.equal(V.classify(b.honroLandmarks.find(l=>l.id==='sy-art-rear-plinths'),b),'decoration');}
 assert.equal(JSON.stringify(b),before,'Classification does not modify map, collision, quest, actors or save');rows.push(row);
}
assert.equal(rows.length,30);assert(rows.some(r=>r.native)&&rows.some(r=>r.primitiveAssets)&&rows.some(r=>r.vectors),'All three asset routes covered');assert(rows.filter(r=>r.stage>=21).some(r=>r.gameplay>10),'Act3 colliding back-layer buildings remain gameplay');
await mkdir('_local/reports/visual-hierarchy',{recursive:true});await writeFile('_local/reports/visual-hierarchy/coverage.json',JSON.stringify({scope:'All 30 current production-compiled maps: semantic and asset-path coverage, not 30 browser playthroughs.',rows},null,2));
console.log('PASS all 30 stage semantic/asset routes',JSON.stringify(rows.reduce((a,r)=>{for(const key of ['gameplay','decoration','vectors','primitiveAssets','native','scenery'])a[key]=(a[key]||0)+r[key];return a;},{})));
