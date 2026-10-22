/** Functional M05 geometry contract, including evenly spaced targets. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdirSync,writeFileSync} from 'node:fs';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
const rows=[];
const correlation=(a,b)=>{const dot=a.reduce((s,v,i)=>s+v*b[i],0);return dot/Math.sqrt(a.reduce((s,v)=>s+v*v,0)*b.reduce((s,v)=>s+v*v,0));};
for(const phase of [0,1,2])for(const spacing of [8,38,100]){
 const paths=[],normalized=[],origins=[],directions=[],seeds=[];let reach=0,oldReach=0,minRms=Infinity,maxCorrelation=-1;
 for(let i=0;i<10;i++){
  const x=1000+(i-4.5)*spacing,seed=C.cheonroeVisualSeed(17,'lightning-target-'+i),args=[x,-170,x,940,phase,seed],p=C.cheonroeLightningPaths(...args),old=C.lightningPaths(...args.slice(0,5));
  assert.deepEqual(plain(p),plain(C.cheonroeLightningPaths(...args)),'deterministic repeat');
  assert.deepEqual(plain(p.trunk[0]),{x,y:-170});assert.deepEqual(plain(p.trunk.at(-1)),{x,y:940});
  assert.equal(p.forks.length,6);assert(p.forks.every(f=>f.length===6),'all original branch segments retained');
  const norm=p.trunk.map(v=>({x:v.x-x,y:(v.y+170)/1110}));normalized.push(norm.map(v=>v.x));
  assert(norm.some(v=>Math.abs(v.x)>20),'strong angular trunk survives');
  const signs=norm.slice(1,-1).map(v=>Math.sign(v.x));assert(signs.slice(1).filter((v,j)=>v!==signs[j]).length>=15,'frequent angular reversals');
  assert(p.trunk.slice(1).every((v,j)=>v.y>p.trunk[j].y),'segment origins advance to the head');
  origins.push(p.forks.map(f=>+(f[0].y+170).toFixed(6)));
  directions.push(p.forks.map(f=>Math.sign(f.at(-1).x-f[0].x)));
  for(const [j,f] of p.forks.entries()){
   assert(p.trunk.some(v=>v.x===f[0].x&&v.y===f[0].y),'branch attaches to trunk');
   const r=Math.abs(f.at(-1).x-f[0].x);reach+=r;oldReach+=Math.abs(old.forks[j].at(-1).x-old.forks[j][0].x);
   assert(r>=155*.6*.85-1e-8&&r<=155*.6*1.15+1e-8,'modest branch variation around 60% original nominal reach');
  }
  paths.push(norm);seeds.push(seed);
 }
 assert.equal(new Set(seeds).size,10,'mixed distinct target identities');
 for(let i=0;i<10;i++)for(let j=i+1;j<10;j++){
  const a=normalized[i],b=normalized[j],rms=Math.sqrt(a.reduce((s,v,k)=>s+(v-b[k])**2,0)/a.length),corr=Math.abs(correlation(a,b));
  minRms=Math.min(minRms,rms);maxCorrelation=Math.max(maxCorrelation,corr);
  assert(rms>15,'normalized trunks differ visibly, beyond horizontal translation');assert(corr<.85,'no copied or mirrored normalized trunk');
  assert(paths[i].some((v,k)=>Math.abs(v.y-paths[j][k].y)>.005),'different kink locations/segment lengths');
 }
 assert.equal(new Set(origins.map(JSON.stringify)).size,10,'distinct branch attachment patterns');
 assert(new Set(directions.map(JSON.stringify)).size>=7,'asymmetric branch directions');
 assert(reach/oldReach>.5&&reach/oldReach<.7,'aggregate reach approximately 40% shorter');
 rows.push({phase,spacing,minPairRms:minRms,maxAbsCorrelation:maxCorrelation,branchReachRatio:reach/oldReach});
}
// Both renderer entry points retain event seed and age it without mutating it.
const renderer=new C.Renderer({getContext:()=>({})}),seed=C.cheonroeVisualSeed(17,'same-head');
renderer.event({type:'fx',name:'lightningBolt',x:10,y:0,x2:10,y2:900,size:3.5,lightningSeed:seed});
assert.equal(renderer.fxs[0].lightningSeed,seed);assert.equal(renderer.fxs[0].life,.9);
assert.notEqual(seed,C.cheonroeVisualSeed(18,'same-head'),'recast differs');
assert.notDeepEqual(plain(C.cheonroeLightningPaths(10,0,10,900,0,seed)),plain(C.cheonroeLightningPaths(10,0,10,900,1,seed)),'deliberate phases retained');
// Short ceilings, oblique and zero-length snapshots keep exact endpoint coordinates.
for(const [x,y,x2,y2] of [[10,20,10,22],[25,80,450,400],[31,20,31,20]])for(const phase of [0,1,2]){
 const p=C.cheonroeLightningPaths(x,y,x2,y2,phase,seed);assert.deepEqual(plain(p.trunk[0]),{x,y});assert.deepEqual(plain(p.trunk.at(-1)),{x:x2,y:y2});
 assert(p.trunk.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.equal(p.forks.length,6);
}
mkdirSync('_local/reports/cheonroe-distinct-bolts',{recursive:true});
writeFileSync('_local/reports/cheonroe-distinct-bolts/geometry-results.json',JSON.stringify({status:'passed',rows},null,2)+'\n');
console.log('PASS M05: 90 deterministic paths, 405 normalized pair comparisons, mixed seeds, diverse kinks/bends/branch origins, 60% branch reach, exact endpoints, phases, six branches, .9s life');
