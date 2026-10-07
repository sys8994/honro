import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {GRANITE_ASSET_IDS,graniteVisuals} from '../tools/environment/granite-visuals.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const project=await read('shared/data/campaign.json'),baseline=await read('tests/fixtures/granite-visual-baseline.json');
const plain=x=>JSON.parse(JSON.stringify(x)),noVisual=({visual,...rest})=>rest;
const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
function onSegment(p,a,b){return Math.abs(cross(a,b,p))<1e-7&&p.x>=Math.min(a.x,b.x)-1e-7&&p.x<=Math.max(a.x,b.x)+1e-7&&p.y>=Math.min(a.y,b.y)-1e-7&&p.y<=Math.max(a.y,b.y)+1e-7;}
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(onSegment(p,a,b))return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function assertContained(poly,outline,label){for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];for(let k=0;k<=100;k++)assert(inside({x:a.x+(b.x-a.x)*k/100,y:a.y+(b.y-a.y)*k/100},outline),`${label} edge ${i}, sample ${k} paints outside the solid`);}}
function top(poly,x){const ys=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];if(x<Math.min(a.x,b.x)-1e-8||x>Math.max(a.x,b.x)+1e-8)continue;if(Math.abs(b.x-a.x)<1e-8)ys.push(a.y,b.y);else ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}return Math.min(...ys);}
const rows=[];
for(const id of GRANITE_ASSET_IDS){const asset=project.library.find(a=>a.id===id),old=baseline.assets.find(a=>a.id===id),snapshot=JSON.stringify(asset);
 assert.deepEqual(noVisual(asset),noVisual(old),id+' keeps collider, reference bounds, sockets and every nonvisual field');
 assert.deepEqual(asset.visual[0].points,asset.collision[0],id+' exact canonical outer rim');
 assert.equal(asset.visual.length,6);assert.deepEqual(asset.visual.map(s=>s.fill),old.visual.map(s=>s.fill),'six original material colours');
 assert.deepEqual(graniteVisuals(asset),asset.visual,'authoring replay cannot restore the mismatched rim');
 assert.equal(JSON.stringify(asset),snapshot,'generator is pure');
 for(const [index,face] of asset.visual.entries()){assert.equal(face.stroke,null);assert.equal(face.alpha,1);assertContained(face.points,asset.collision[0],id+' face '+index);}
 const xs=[...new Set([...old.visual[0].points,...asset.collision[0]].map(p=>p.x))].filter(x=>x>=asset.reference.bounds.x&&x<=asset.reference.bounds.x+asset.reference.bounds.w);
 rows.push({id,faces:asset.visual.length,beforeMaxTopGap:Math.max(...xs.map(x=>top(old.visual[0].points,x)-top(old.collision[0],x))),afterMaxTopGap:Math.max(...xs.map(x=>Math.abs(top(asset.visual[0].points,x)-top(asset.collision[0],x))))});
}
const instances=project.stages.flatMap(s=>s.elements.filter(e=>GRANITE_ASSET_IDS.includes(e.assetId)).map(e=>({stageId:s.id,...e})));
assert.deepEqual(instances,baseline.instances,'all sixteen map placements unchanged');assert.equal(instances.length,16);
assert.equal(instances.filter(e=>e.assetId===GRANITE_ASSET_IDS[0]).length,9);assert.equal(instances.filter(e=>e.assetId===GRANITE_ASSET_IDS[1]).length,7);
const g=await runtime({legacyMaps:false}),oldProject=plain(project);for(const old of baseline.assets)oldProject.library[oldProject.library.findIndex(a=>a.id===old.id)]=plain(old);
const instanceRows=[];
for(const st of project.stages.filter(s=>instances.some(e=>e.stageId===s.id))){const before=g.HonroMaps.compile(st,oldProject),after=g.HonroMaps.compile(st,project);
 assert.deepEqual(plain(after.terrain),plain(before.terrain),st.id+' compiled collisions unchanged');
 assert.deepEqual(plain(after.materials),plain(before.materials),st.id+' materials unchanged');
 for(const inst of st.elements.filter(e=>GRANITE_ASSET_IDS.includes(e.assetId))){const asset=project.library.find(a=>a.id===inst.assetId),visual=g.HonroGeometry.shapes(asset,inst),collision=after.terrain.find(t=>t.id===inst.id+':collision:0');
  assert.deepEqual(plain(visual[0].points),plain(collision.vertices),inst.id+' drawn and physical world silhouettes match');
  for(const [index,face] of visual.entries())assertContained(face.points,collision.vertices,inst.id+' world face '+index);
  instanceRows.push({stage:st.id,id:inst.id,assetId:asset.id,scale:inst.scale,exactWorldSilhouette:true,allFacesContained:true});
 }
 // A saved battle owns its embedded old art. This authoring repair must not
 // rewrite those assets or any older battle's collision/progress on resume.
 const saved=g.HonroMaps.createBattle(st,oldProject),beforeSavedArt=JSON.stringify(saved.honroLandmarks),savedTerrain=JSON.stringify(saved.terrain);
 g.HonroStageRules.sanitizeStageBattle(saved);assert.equal(JSON.stringify(saved.honroLandmarks),beforeSavedArt,'old embedded art preserved');assert.equal(JSON.stringify(saved.terrain),savedTerrain,'saved terrain preserved');
}
await mkdir('_local/reports/granite-visual-alignment',{recursive:true});
await writeFile('_local/reports/granite-visual-alignment/geometry.json',JSON.stringify({passed:true,assets:rows,instances:instanceRows,limits:['Source/Native checks do not establish browser/GPU behaviour','Already saved battles retain their original embedded artwork']},null,2)+'\n');
console.log('PASS granite visual alignment: 2 exact rims, 12 contained faces, 16 placements, 6 unchanged compiled maps, replay and saved-art preservation');console.log(JSON.stringify(rows));
