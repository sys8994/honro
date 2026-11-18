import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
const R=path.resolve('stage37-release-scope'),sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
for(const [name,source]of [['master',R+'/master/tools/map-forge/act1-naru-doldang.mjs'],['candidate',R+'/candidate/tools/map-forge/act1-naru-doldang.mjs'],['accepted','stage7-integration-842-local/patch/tools/map-forge/act1-naru-doldang.mjs']])fs.writeFileSync(R+'/qa/'+name+'.mjs',fs.readFileSync(source,'utf8')+'\nexport {authorStage};\n');
for(const f of ['stage7-terrain-finish.json','stage7-terrain-finish.mjs'])fs.copyFileSync(R+'/candidate/tools/map-forge/'+f,R+'/qa/'+f);
const modules=Object.fromEntries(await Promise.all(['master','candidate','accepted'].map(async k=>[k,await import(pathToFileURL(R+'/qa/'+k+'.mjs'))])));
const finish=JSON.parse(fs.readFileSync(R+'/qa/stage7-terrain-finish.json')),reg=JSON.parse(fs.readFileSync(R+'/candidate/shared/data/stage7-terrain-path-registration.json')),recipe=JSON.parse(fs.readFileSync('stage7-integration-842-local/test-reference/game/tools/stage7-registered-study/frozen-original-recipe.json'));
assert.equal(sha(recipe.paths),reg.recipeSha256);
const rows=[];
for(const id of[3,7]){
 const data=JSON.parse(fs.readFileSync(id===3?'stage3-repair-20261118/local-test/shared/assets/environment/act1-sites/stage03.json':'stage7-vector-repo-input/shared/assets/environment/act1-sites/stage07.json'));
 const stage=()=>({metadata:{stageId:id},initialState:{},units:[],markers:[],objectives:[{}],events:(id===3?['midboss-stage3-seen','transfer','dock-beasts']:['yard-hounds','upper-crows']).map(id=>({id}))});
 const runs={};for(const k of ['master','candidate','accepted']){const p={library:[]},s=stage();modules[k].authorStage(p,s,structuredClone(data),id===7?finish:null);runs[k]={p,s};}
 assert.deepEqual(runs.candidate,runs.accepted,'Candidate author differs accepted '+id);
 assert.deepEqual(runs.candidate.s,runs.master.s,'Fresh stage gameplay changed '+id);
 const asset=r=>r.p.library.find(a=>a.id==='act1-site:'+id+':body');const a=asset(runs.master),b=asset(runs.candidate);
 const other=r=>r.p.library.filter(a=>a.id!=='act1-site:'+id+':body');assert.deepEqual(other(runs.master),other(runs.candidate));
 if(id===3)assert.deepEqual(a,b,'Stage3 raw author changed before approved finalizer');else{
  assert.equal(sha(a.vector),reg.previousOriginal);assert.equal(sha(b.vector),reg.original);
  const optimized=structuredClone(b.vector);for(const[p,key,value]of recipe.paths)p.reduce((a,k)=>a[k],optimized)[key]=value;
  assert.equal(sha(optimized),reg.optimized);assert.equal(sha(b.vector.symbols.source),reg.sourceRaw);assert.equal(sha(optimized.symbols.source),reg.sourceOptimized);
 }
 rows.push({stage:id,authorGameplayExactMaster:true,authorOutputExactAccepted:true,otherAssetsExact:true,rawVectorSHA:sha(b.vector)});
}
fs.writeFileSync(R+'/local-proof.json',JSON.stringify({pass:true,rows,stage7RegistryExact:true,scope:'Pure authoring output with minimal synthetic input only; not complete project/compiler/Scene/save/performance'},null,2));
console.log('PASS authorGameplayExactMaster, authorOutputExactAccepted, Stage7 registry raw/optimized/source/recipe hashes');
