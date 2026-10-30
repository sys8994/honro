/** One source-registry assembly; only the selected official chapter and its recursive
 * asset closure enter the VM, matching web loader's lazy stage semantics. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runtimeEntries,authorProjectExpression} from '../../shared/build.mjs';
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function memorySample(phase){const {rss,heapUsed,external,arrayBuffers}=process.memoryUsage();const value={phase,rss,heapUsed,external,arrayBuffers};process.stderr.write(JSON.stringify({setupMemory:value})+'\n');return value;}
export function dependencyClosure(stage,library){
 const byId=new Map(library.map(a=>[a.id,a])),found=new Set();
 function visit(value,key){if(typeof value==='string'){
  if(byId.has(value)&&!found.has(value)){found.add(value);for(const [k,v]of Object.entries(byId.get(value)))if(k!=='id')visit(v,k);}
  else if((key==='assetId'||/AssetId$/.test(key||''))&&!byId.has(value))throw Error('Missing required stage asset '+value);
 }else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))visit(v,k);}
 visit(stage);return library.filter(a=>found.has(a.id));
}
export async function stageRuntime(stage,expected){
 const memory=[memorySample('before-single-registry')];
 const entries=await runtimeEntries({vector:true,render:true,app:true,productionStory:true});memory.push(memorySample('after-single-registry'));
 const campaign=entries.find(x=>x.name==='campaign'),project=campaign.project,selected=project.stages.find(s=>s.metadata.stageId===stage);
 assert(selected,'Selected official stage exists');assert.equal(sha(selected),sha(expected.stages.find(s=>s.metadata.stageId===stage)),'Selected stage must match canonical Act4 source');
 const library=dependencyClosure(selected,project.library),expectedAssets=new Map(expected.library.map(a=>[a.id,a]));for(const a of library)if(expectedAssets.has(a.id))assert.equal(sha(a),sha(expectedAssets.get(a.id)),'Canonical Act4 asset shadowed: '+a.id);const identity={stage,canonicalStageSHA256:sha(selected),assets:library.map(a=>({id:a.id,sha256:sha(a)})),fullLibraryAssets:project.library.length,loadedLibraryAssets:library.length,mode:'source-registry selected chapter recursive dependency closure; no candidate override'};
 const catalog=project.stages.map(s=>({id:s.id,name:s.name,width:s.width,height:s.height,backdrop:s.backdrop,metadata:s.metadata,playerRoster:s.units.filter(u=>u.team==='player').map(u=>u.kind),pending:true}));
 const {stages:allStages,library:allAssets,...base}=project;
 const local={...base,library,stages:[selected],unitTemplates:project.stages.flatMap(s=>s.units.filter(u=>u.kind?.startsWith('boss:'))).filter((u,i,a)=>a.findIndex(v=>v.kind===u.kind)===i)};
 campaign.code='globalThis.HONRO_PROJECT='+authorProjectExpression(JSON.stringify(local))+';\n'+`{const selected=HONRO_PROJECT.stages[0];HONRO_PROJECT.stages=${JSON.stringify(catalog)}.map(s=>s.metadata.stageId===${stage}?selected:s);}`;
 delete campaign.project;
 return officialModuleLoader(entries,identity,memory);
}
export function officialModuleLoader(entries,identity={},memory=[]){
 const split=entries.findIndex(x=>x.name==='shared/runtime/party-rig.js'),main=entries.findIndex(x=>x.name==='shared/runtime/main.js');
 assert(split>0&&main>split,'Official renderer/main boundaries required');
 const manifest=entries.map(({name,code})=>({name,sha256:createHash('sha256').update(code).digest('hex')})),consumed=[];
 assert.equal(new Set(manifest.map(x=>x.name)).size,manifest.length,'Duplicate official module');
 assert(manifest.some(x=>x.name==='shared/runtime/act4-pilot-combat.js'),'Official pilot combat module missing');
 identity.runtimeManifest=manifest;
 const model=entries.slice(0,split),beforeMain=entries.slice(split,main),mainEntry=entries[main],afterMain=entries.slice(main+1);entries.length=0;
 function consume(part,g,transform=x=>x){assert(!consumed.includes(part.name),'Duplicate consumption '+part.name);vm.runInContext(transform(part.code),g,{filename:part.name});consumed.push(part.name);part.code='';}
 return {identity,memory,async runtimeFactory(){const context=vm.createContext({console,performance,structuredClone});for(const part of model)consume(part,context);model.length=0;memory.push(memorySample('after-model-vm'));return context;},
 loadBeforeMain(g){for(const part of beforeMain)consume(part,g);beforeMain.length=0;memory.push(memorySample('after-renderer-app-vm'));},
 loadMain(g,transform){consume(mainEntry,g,transform);},
 loadAfterMain(g){for(const part of afterMain)consume(part,g);afterMain.length=0;assert.deepEqual(consumed,manifest.map(x=>x.name),'Every official module consumed once in production order');identity.runtimeConsumed=[...consumed];memory.push(memorySample('after-official-app-vm'));}};
}
export function assertFreshPilotBudget(unit,reference){
 const basis=unit.honroPilotBudgetBasis,version=reference?.version??1;
 assert([1,2].includes(version),'Unsupported pilot reference schema');assert.equal(basis?.version,version,'Fresh pilot budget must match loaded reference version');
 assert(basis.status&&['referenceHp','referenceShot','hits','fraction'].every(k=>Number.isFinite(basis[k])&&basis[k]>0),'Finite positive fresh budget basis required');
 if(version===2){assert.equal(basis.referenceId,reference.referenceId,'Fixed reference identity required');assert(basis.role&&Number.isFinite(basis.normalHp)&&basis.normalHp>0,'Calibrated role/normalHp required');assert(basis.skillAttack&&Object.values(basis.skillAttack).length&&Object.values(basis.skillAttack).every(n=>Number.isFinite(n)&&n>0),'Finite per-skill attack coefficients required');assert.deepEqual(JSON.parse(JSON.stringify(unit.honroPilotSkillAttack)),JSON.parse(JSON.stringify(basis.skillAttack)),'Live per-skill coefficients must match basis');}
}
