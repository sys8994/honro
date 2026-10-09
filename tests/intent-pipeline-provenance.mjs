import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,appendFile,rm,symlink} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {INPUT_TREES,INPUT_FILES,sourceSnapshot,prepareVerifiedRuntime} from '../tools/intent-pipeline/source.mjs';
import {ROOT,loadRuntime,validateArtProject} from '../tools/intent-pipeline/runtime.mjs';
import {actSourceSnapshot} from '../tools/intent-pipeline/act-adapter.mjs';
async function fixture(){
 const root=await mkdtemp(path.join(os.tmpdir(),'honro-provenance-'));
 for(const dir of INPUT_TREES)await mkdir(path.join(root,dir),{recursive:true});
 for(const file of [...INPUT_FILES,'shared/data/campaign.json','shared/build.mjs','game/config/balance.json','tools/party-forge/recipes.mjs','tools/monster-forge/species.mjs','tools/actor-forge/shapes.mjs']){await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),'fixture '+file);}
 return root;
}
test('source fingerprint includes balance, build scripts, forge recipes and non-code reference assets',async()=>{
 const root=await fixture();try{
  const snapshot=()=>sourceSnapshot(root,{includeCompiler:false});
  for(const file of ['game/config/balance.json','shared/build.mjs','game/engine/build.mjs','tools/party-forge/recipes.mjs','tools/monster-forge/species.mjs','tools/actor-forge/shapes.mjs','tools/environment/build-act2-art.mjs','tools/environment/act2-scene-composition.mjs','shared/map/space-layout.js','tools/intent-pipeline/state.mjs','assets/reference.png','tests/fixtures/party-baseline.json']){
   await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),'before');const before=await snapshot();await appendFile(path.join(root,file),'changed');const after=await snapshot();assert.notEqual(after.codeHash,before.codeHash,file);
   let called=false;await assert.rejects(prepareVerifiedRuntime(before,{snapshot,load:async()=>{called=true;return{bundleHash:'x'};}}),/Source changed/);assert.equal(called,false,'Changed source must fail before running a builder');
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
test('builder writes and exact compiled-runtime changes fail closed after preparation',async()=>{
 const root=await fixture();try{const snapshot=()=>sourceSnapshot(root,{includeCompiler:false}),before=await snapshot();
  await assert.rejects(prepareVerifiedRuntime(before,{snapshot,load:async()=>{await writeFile(path.join(root,'shared/generated.js'),'changed after precheck');return{bundleHash:'same'};}}),/changed during preparation/);
  const stable={...await snapshot(),runtimeHash:'approved-runtime'};
  await assert.rejects(prepareVerifiedRuntime(stable,{snapshot,load:async()=>({bundleHash:'different-runtime'})}),/Exact compiled runtime/);
  const ok=await prepareVerifiedRuntime(stable,{snapshot,load:async()=>({bundleHash:'approved-runtime'})});assert.equal(ok.source.runtimeHash,'approved-runtime');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('art-only candidate rejects every gameplay field and other-stage/asset collision changes',async()=>{
 const {g}=await loadRuntime(),source=JSON.parse(await readFile(path.join(ROOT,'shared/data/campaign.json'))),project=structuredClone(source);
 assert.doesNotThrow(()=>validateArtProject(g,project,structuredClone(project)));
 const bellId='stage18:bell-hollow-body',accent={points:[{x:-20,y:-40},{x:20,y:-40},{x:20,y:0},{x:-20,y:0}],fill:'#333222'};
 assert(project.stages[17].elements.some(e=>e.assetId===bellId));assert(project.stages[18].elements.some(e=>e.assetId===bellId),'The negative control must actually be shared with current Stage19');
 const changes=[
  ['exit anchor',p=>{p.stages[17].anchors.exit.x-=1000;}],['width',p=>{p.stages[17].width+=100;}],['initial state',p=>{p.stages[17].initialState.honroActiveLimit=9;}],
  ['event',p=>{p.stages[17].events.push({id:'new-event',type:'spawn',x:400,y:500});}],['encounter',p=>{p.stages[17].encounters.push({id:'new-encounter',unitIds:[]});}],['objective',p=>{p.stages[17].objectives.push({id:'new-objective'});}],
  ['shared visual asset',p=>{p.library.find(a=>a.id===bellId).visual.push(structuredClone(accent));}],
  ['other stage',p=>{p.stages[0].width+=10;}],['project setting',p=>{p.settings.grid+=10;}],['asset contract',p=>{p.library[0].collision=[[[0,0],[30,0],[0,30]]];}],
  ['collidable art element',p=>{const a=p.library.find(a=>a.collision.length);p.stages[17].elements.push({id:'new-collision-prop',assetId:a.id,x:400,y:5500,scale:1,rotation:0,snap:false,layer:'back',depthLayer:'L1'});}]
 ];
 for(const [name,mutate]of changes){const changed=structuredClone(project);mutate(changed);assert.throws(()=>validateArtProject(g,project,changed),name);}
 const visual=structuredClone(project);visual.stages[17].name='Visual-only name';const bell=structuredClone(visual.library.find(a=>a.id===bellId));bell.id='intent18:bell-art';bell.visual.push({...structuredClone(accent),fill:'#555044'});visual.library.push(bell);visual.stages[17].elements.find(e=>e.assetId===bellId).assetId=bell.id;assert.doesNotThrow(()=>validateArtProject(g,project,visual));
});

test('both fingerprint routes cover environment composition, shared validation and approval orchestration',async()=>{
 const root=await fixture();try{
  for(const dir of ['workshop/recipes','tools/map-forge'])await mkdir(path.join(root,dir),{recursive:true});
  await writeFile(path.join(root,'game/package.json'),JSON.stringify({name:'synthetic-provenance-fixture',private:true}));
  await symlink(path.join(ROOT,'game/node_modules'),path.join(root,'game/node_modules'),'dir');
  for(const file of ['tools/environment/build-act2-art.mjs','tools/environment/act2-scene-composition.mjs','shared/map/space-layout.js','tools/intent-pipeline/state.mjs','tools/intent-pipeline/cli.mjs']){
   await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),'before');
   const genericBefore=await sourceSnapshot(root),actBefore=await actSourceSnapshot(root);
   await appendFile(path.join(root,file),' changed');
   assert.notEqual((await sourceSnapshot(root)).codeHash,genericBefore.codeHash,'Generic route omitted '+file);
   assert.notEqual((await actSourceSnapshot(root)).codeHash,actBefore.codeHash,'Full-act route omitted '+file);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
