import assert from 'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import{runtimeEntries}from'../shared/build.mjs';
const [mode,file,publicFile,priorFile]=process.argv.slice(2),hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const p=(await runtimeEntries({vector:false,render:false,app:false,productionStory:true})).find(e=>e.project).project;
const selected=[3,7],ids=selected.map(id=>'act1-site:'+id+':body'),summary={
 stages:selected.map(id=>p.stages.find(s=>s.metadata?.stageId===id)),bodies:ids.map(id=>p.library.find(a=>a.id===id)),
 otherStages:p.stages.filter(s=>!selected.includes(s.metadata?.stageId)).map(s=>[s.id,hash(s)]),
 otherAssets:p.library.filter(a=>!ids.includes(a.id)).map(a=>[a.id,hash(a)]),
 rawSources:await Promise.all(['03','07'].map(async id=>hash(await readFile('shared/assets/environment/act1-sites/stage'+id+'.json','utf8')))),
 sharedGuards:await Promise.all(['shared/map/vector-art.js','shared/runtime/terrain-readability.js'].map(async f=>[f,hash(await readFile(f,'utf8'))]))
};await writeFile(file,JSON.stringify(summary));
if(mode==='export')process.exit(0);assert.equal(mode,'verify');
const original=JSON.parse(await readFile(publicFile)),prior=JSON.parse(await readFile(priorFile));
assert.deepEqual(summary.stages,original.stages,'Full Stage3/7 source stage/config/physics equals public (monster changes concern other stages)');
assert.deepEqual(summary.stages,prior.stages);assert.deepEqual(summary.bodies,original.bodies,'Full optimized BODY, original bounds/reference/paths exact');
assert.deepEqual(summary.rawSources,original.rawSources);assert.deepEqual(summary.rawSources,prior.rawSources);
assert.deepEqual(summary.otherStages,prior.otherStages,'All other stages including intended monster changes unchanged from combined parent');
assert.deepEqual(summary.otherAssets,prior.otherAssets);assert.deepEqual(summary.sharedGuards,prior.sharedGuards);
for(let i=0;i<2;i++){assert.notDeepEqual(summary.bodies[i],prior.bodies[i]);assert.deepEqual(summary.bodies[i].collision,[]);}
const regs=JSON.parse(await readFile('shared/data/terrain-path-registrations.json'));assert(!regs.some(r=>ids.includes(r.id)));
const renderer=await readFile('shared/runtime/renderer.js','utf8'),m=renderer.match(/_terrainRasterBounds\(b\)\{([\s\S]*?)\n        \}/);assert(m);
const f=new Function('b',m[1]),domain={left:0,right:10,top:0,bottom:10},body=id=>({asset:{id:'act1-site:'+id+':body'}});
for(const id of [3,2,8])assert.deepEqual(f.call({_landmarkPaintBounds(){throw Error('Unexpected paint-union '+id)}},{honroStage:id,honroTerrainBounds:domain,honroLandmarks:[body(id)]}),domain);
let calls=0;assert.deepEqual(f.call({_landmarkPaintBounds(){calls++;return{left:-2,right:12,top:-3,bottom:13}}},{honroStage:7,honroTerrainBounds:domain,honroLandmarks:[body(7)]}),{left:-2,right:12,top:-3,bottom:13});assert.equal(calls,1);assert.deepEqual(domain,{left:0,right:10,top:0,bottom:10});
console.log(JSON.stringify({passed:true,originalBodiesAndStagesExact:true,otherCombinedStagesProvidersExact:true,sharedGuardExact:true,collisionEmpty:true,stage3DomainUnionExcluded:true,stage7DomainUnionRetained:true,limits:'Safety exclusion only; original exterior defects remain. No Chrome or gameplay claim.'}));
