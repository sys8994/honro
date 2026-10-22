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
const approvedOther=JSON.parse(execFileSync('git',['show','fe6911c9e6c1358d9384c355d3e6fe5c6e96e9bb:shared/data/campaign.json'],{maxBuffer:40*1024*1024}));
const shape3=JSON.parse(execFileSync('git',['show','c32a272407a2678003c2df4cab8e85cdd38a4bdf:shared/data/campaign.json'],{maxBuffer:40*1024*1024}));
shape3.stages[10]=structuredClone(approvedOther.stages[10]); // Preserve the separately approved Stage11 quest.
const outsideMasses=structuredClone(after);
outsideMasses.stages[12].design.space.terrainPlanes=shape3.stages[12].design.space.terrainPlanes;
outsideMasses.stages[12].design.stoneFinish.planeCount=shape3.stages[12].design.stoneFinish.planeCount;
assert.equal(hash(outsideMasses),hash(shape3),'Shape3 door, Library, placements and all gameplay remain exactly unchanged');
const published=JSON.parse(execFileSync('git',['show','c5b51319ef887943726434d84db596f07254bbd3:shared/data/campaign.json'],{maxBuffer:40*1024*1024}));
const oldPlanes=published.stages[12].design.space.terrainPlanes,newPlanes=after.stages[12].design.space.terrainPlanes,oldIds=new Set(oldPlanes.map(p=>p.id));
assert.equal(hash(newPlanes.filter(p=>oldIds.has(p.id))),hash(oldPlanes),'All 161 approved planes and their relative paint order remain identical');
const extension=newPlanes.filter(p=>!oldIds.has(p.id));assert.equal(extension.length,20);assert(extension.every(p=>p.terrainId==='act2-floor'&&p.points.every(([x])=>x<=-400)),'Boundary fix stays outside the existing foreground');
const floorSource=after.stages[12].terrains.find(t=>t.id==='act2-floor'),solidLeft=Math.min(...floorSource.points.map(p=>p.x));
assert.equal(Math.min(...extension.flatMap(p=>p.points.map(p=>p[0]))),solidLeft);
const contains=(ps,x,y)=>{let hit=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const topAt=x=>Math.min(...floorSource.points.flatMap((a,i)=>{const b=floorSource.points[(i+1)%floorSource.points.length];return b.x!==a.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)?[a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)]:[];}));
let exteriorSamples=0;
for(let x=-5700;x<=-600;x+=200)for(const depth of [80,350,800,1300,2000]){assert(extension.some(p=>contains(p.points,x,topAt(x)+depth)),'Authored coverage outside play bounds at '+x+'/'+depth);exteriorSamples++;}
assert(!oldPlanes.some(p=>p.id!=='mother-rock-base'&&p.terrainId==='act2-floor'&&contains(p.points,-1000,topAt(-1000)+600)),'Probe detects the published missing material');
const variants=after.stages[12].design.stoneFinish.variants,reverse=new Map(variants.map(v=>[v.id,v.baseId]));
const protectedStage=s=>{s=structuredClone(s);delete s.design.stoneFinish;delete s.design.space.terrainPlanes;s.elements=s.elements.filter(e=>!e.stage13Finish);s.design.space.scenery=s.design.space.scenery.filter(e=>!e.stage13Finish);for(const e of [...s.elements,...s.design.space.scenery])if(reverse.has(e.assetId))e.assetId=reverse.get(e.assetId);return s;};
for(let i=0;i<before.stages.length;i++)assert.deepEqual(i===12?protectedStage(after.stages[i]):after.stages[i],i===12?protectedStage(before.stages[i]):approvedOther.stages[i],'Protected chapter '+(i+1));
assert.deepEqual(after.library.slice(0,before.library.length),before.library,'Existing common asset originals');
assert.equal(after.library.length,before.library.length+4);assert.equal(variants.length,4);
for(const a of after.library.slice(before.library.length)){assert(reverse.has(a.id));assert.deepEqual(a.collision,[]);assert(a.vector&&a.reference);}
for(const key of Object.keys(before))if(!['stages','library'].includes(key))assert.deepEqual(after[key],before[key]);
assert.deepEqual(JSON.parse(JSON.stringify(applyStage13VectorFinish(structuredClone(approvedOther)))),after,'Reproducible visual delta');
assert.deepEqual(JSON.parse(JSON.stringify(applyStage13VectorFinish(structuredClone(after)))),after,'Idempotent visual author');
// Preserve the latest approved UI/render sources during integration.
const runtimeBase='fe6911c9e6c1358d9384c355d3e6fe5c6e96e9bb';
for(const f of ['shared/runtime/main.js','shared/runtime/renderer.js','shared/runtime/party-rig.js','shared/runtime/authored-far-art.js','shared/runtime/act2-spatial-art.js','shared/runtime/stage11-landscape-art.js','shared/runtime/portraits.js'])assert.equal(await readFile(f,'utf8'),execFileSync('git',['show',runtimeBase+':'+f],{maxBuffer:8*1024*1024}).toString(),f+' unchanged');
let allocations=0;const Path2D=new Proxy(NativePath,{construct(t,args){allocations++;return Reflect.construct(t,args);}});
const g=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,document:{createElement:()=>createCanvas(64,64)},navigator:{userAgent:'native-stage13-art'},matchMedia:()=>({matches:true})});g.window=g;
for(const source of await runtimeParts({vector:true,render:true}))vm.runInContext(source,g);
const project=g.HONRO_PROJECT,stage=project.stages[12],b=g.HonroMaps.createBattle(stage,project),art=g.HonroAct2SpatialArt,ts=g.HonroTerrainDomain.render(b),cv=createCanvas(1440,900),c=cv.getContext('2d');c.setTransform(.1,0,0,.1,0,0);
assert.equal(stage.design.space.terrainPlanes.length,stage.design.stoneFinish.planeCount,'Production author must retain only current finish');
assert(!stage.design.space.terrainPlanes.some(p=>p.transitionLayer),'Legacy caps must not cover current finish');
for(const v of variants)assert(stage.elements.some(e=>e.assetId===v.id),'Production scenery must retain '+v.id);
let baselineComparison=null;
if(process.env.HONRO_STAGE13_BASELINE){
 const {runtimeParts:baselineParts}=await import(process.env.HONRO_STAGE13_BASELINE+'/shared/build.mjs');
 const old=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,document:{createElement:()=>createCanvas(64,64)},navigator:{userAgent:'native-stage13-art'},matchMedia:()=>({matches:true})});old.window=old;
 for(const source of await baselineParts({vector:true,render:true}))vm.runInContext(source,old);
 const op=old.HONRO_PROJECT;
 for(let i=0;i<30;i++)assert.equal(hash(i===12?protectedStage(project.stages[i]):project.stages[i]),hash(i===12?protectedStage(op.stages[i]):op.stages[i]),'Effective production protected stage '+(i+1));
 assert.equal(hash(project.library.filter(a=>!reverse.has(a.id))),hash(op.library),'Effective original Library');
 const pixels=[];
 for(const view of [{x:7290,y:7080,z:.43},{x:10350,y:8470,z:.8}]){
  const draws=[old,g].map(ctx=>{const b=ctx.HonroMaps.createBattle(ctx.HONRO_PROJECT.stages[10],ctx.HONRO_PROJECT),canvas=createCanvas(1440,900),c=canvas.getContext('2d');c.translate(720,450);c.scale(view.z,view.z);c.translate(-view.x,-view.y);for(const t of ctx.HonroTerrainDomain.render(b))if(!t.broken)ctx.HonroAct2SpatialArt.terrain(c,t,b);return createHash('sha256').update(canvas.toBuffer('image/png')).digest('hex');});assert.notEqual(draws[0],createHash('sha256').update(createCanvas(1440,900).toBuffer('image/png')).digest('hex'),'Nonempty material view');assert.equal(draws[0],draws[1],'Stage11 material pixels');pixels.push({view,sha256:draws[0]});
 }
 baselineComparison={effectiveOther29AndProtected13Equal:true,effectiveOldLibraryEqual:true,stage11MaterialPixels:pixels};
}
const original=JSON.stringify(b),prepared=[],counts=[];
for(const t of ts){if(!['act2-floor','cave-roof','tactical-entry-shoulder','tactical-inner-gallery'].includes(t.id))continue;const q=art.prepareTerrain(t,b);assert.equal(q,art.prepareTerrain(t,b));prepared.push([t,q]);counts.push({id:t.id,authoredPlanes:q.authoredPlanes.length});assert(q.authoredPlanes.length>0);art.terrain(c,t,b);}
allocations=0;for(let i=0;i<3;i++)for(const[t,q]of prepared){assert.equal(q,art.prepareTerrain(t,b));art.terrain(c,t,b);}assert.equal(allocations,0,'No Path2D creation on cached material draws');const warmAllocations=allocations;
assert.equal(JSON.stringify(b),original,'Material rendering mutates battle');assert.equal(c.globalAlpha,1);const m=c.getTransform();assert([m.a,m.b,m.c,m.d,m.e,m.f].every((v,i)=>Math.abs(v-[.1,0,0,.1,0,0][i])<1e-7));
const[t,q]=prepared[0];assert.notEqual(q,art.prepareTerrain(t,{...b,sceneVersion:b.sceneVersion+1}));
for(const v of variants){const asset=project.library.find(a=>a.id===v.id);assert.deepEqual(Array.from(g.HonroVectorArt.validate(asset.vector)),[],v.id);}
const report={pass:true,base,leftEdge:{publishedBase:"c5b51319",approved161PlanesPreserved:true,newExteriorPlanes:extension.length,solidLeft,exteriorSamples},shape3OnlyTerrainArtChanged:true,shape3LibraryAndPlacementsEqual:true,stage13ProtectedBefore:hash(protectedStage(before.stages[12])),stage13ProtectedAfter:hash(protectedStage(after.stages[12])),terrainBefore:hash(before.stages[12].terrains),terrainAfter:hash(after.stages[12].terrains),unitsBefore:hash(before.stages[12].units),unitsAfter:hash(after.stages[12].units),other29Equal:true,oldLibraryEqual:true,newNonCollidingVariants:variants,purity:true,staticPathReuse:true,cachedDrawPathAllocations:warmAllocations,sceneVersionInvalidation:true,prepared:counts,baselineComparison};
await mkdir('_local/reports/stage13-vector-art',{recursive:true});await writeFile('_local/reports/stage13-vector-art/preservation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
