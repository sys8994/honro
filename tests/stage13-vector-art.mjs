import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createCanvas,Path2D as NativePath,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';
import {applyStage13VectorFinish} from '../tools/environment/stage13-vector-finish.mjs';
const base='934fcabd74767d662aee3830585ba807234934cc',before=JSON.parse(execFileSync('git',['show',base+':shared/data/campaign.json'],{maxBuffer:40*1024*1024})),after=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const variants=after.stages[12].design.stoneFinish.variants,reverse=new Map(variants.map(v=>[v.id,v.baseId]));
const protectedStage=s=>{s=structuredClone(s);delete s.design.stoneFinish;delete s.design.space.terrainPlanes;for(const e of [...s.elements,...s.design.space.scenery])if(reverse.has(e.assetId))e.assetId=reverse.get(e.assetId);return s;};
for(let i=0;i<before.stages.length;i++)assert.deepEqual(i===12?protectedStage(after.stages[i]):after.stages[i],i===12?protectedStage(before.stages[i]):before.stages[i],'Protected chapter '+(i+1));
assert.deepEqual(after.library.slice(0,before.library.length),before.library,'Existing common asset originals');
assert.equal(after.library.length,before.library.length+4);assert.equal(variants.length,4);
for(const a of after.library.slice(before.library.length)){assert(reverse.has(a.id));assert.deepEqual(a.collision,[]);assert(a.vector&&a.reference);}
for(const key of Object.keys(before))if(!['stages','library'].includes(key))assert.deepEqual(after[key],before[key]);
assert.deepEqual(JSON.parse(JSON.stringify(applyStage13VectorFinish(structuredClone(before)))),after,'Reproducible visual delta');
assert.deepEqual(JSON.parse(JSON.stringify(applyStage13VectorFinish(structuredClone(after)))),after,'Idempotent visual author');
for(const f of ['shared/runtime/main.js','shared/runtime/renderer.js','shared/runtime/party-rig.js','shared/runtime/authored-far-art.js','shared/runtime/act2-spatial-art.js','shared/runtime/stage11-landscape-art.js','shared/runtime/portraits.js'])assert.equal(await readFile(f,'utf8'),execFileSync('git',['show',base+':'+f],{maxBuffer:8*1024*1024}).toString(),f+' unchanged');
let allocations=0;const Path2D=new Proxy(NativePath,{construct(t,args){allocations++;return Reflect.construct(t,args);}});
const g=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,document:{createElement:()=>createCanvas(64,64)},navigator:{userAgent:'native-stage13-art'},matchMedia:()=>({matches:true})});g.window=g;
for(const source of await runtimeParts({vector:true,render:true}))vm.runInContext(source,g);
const project=g.HONRO_PROJECT,stage=project.stages[12],b=g.HonroMaps.createBattle(stage,project),art=g.HonroAct2SpatialArt,ts=g.HonroTerrainDomain.render(b),cv=createCanvas(1440,900),c=cv.getContext('2d');c.setTransform(.1,0,0,.1,0,0);
const original=JSON.stringify(b),prepared=[],counts=[];
for(const t of ts){if(!['act2-floor','cave-roof','tactical-entry-shoulder','tactical-inner-gallery'].includes(t.id))continue;const q=art.prepareTerrain(t,b);assert.equal(q,art.prepareTerrain(t,b));prepared.push([t,q]);counts.push({id:t.id,authoredPlanes:q.authoredPlanes.length});assert(q.authoredPlanes.length>0);art.terrain(c,t,b);}
allocations=0;for(let i=0;i<3;i++)for(const[t,q]of prepared){assert.equal(q,art.prepareTerrain(t,b));art.terrain(c,t,b);}assert.equal(allocations,0,'No Path2D creation on cached material draws');const warmAllocations=allocations;
assert.equal(JSON.stringify(b),original,'Material rendering mutates battle');assert.equal(c.globalAlpha,1);const m=c.getTransform();assert([m.a,m.b,m.c,m.d,m.e,m.f].every((v,i)=>Math.abs(v-[.1,0,0,.1,0,0][i])<1e-7));
const[t,q]=prepared[0];assert.notEqual(q,art.prepareTerrain(t,{...b,sceneVersion:b.sceneVersion+1}));
for(const v of variants){const asset=project.library.find(a=>a.id===v.id);assert.deepEqual(Array.from(g.HonroVectorArt.validate(asset.vector)),[],v.id);}
const report={pass:true,base,stage13ProtectedBefore:hash(protectedStage(before.stages[12])),stage13ProtectedAfter:hash(protectedStage(after.stages[12])),terrainBefore:hash(before.stages[12].terrains),terrainAfter:hash(after.stages[12].terrains),unitsBefore:hash(before.stages[12].units),unitsAfter:hash(after.stages[12].units),other29Equal:true,oldLibraryEqual:true,newNonCollidingVariants:variants,purity:true,staticPathReuse:true,cachedDrawPathAllocations:warmAllocations,sceneVersionInvalidation:true,prepared:counts};
await mkdir('_local/reports/stage13-vector-art',{recursive:true});await writeFile('_local/reports/stage13-vector-art/preservation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
