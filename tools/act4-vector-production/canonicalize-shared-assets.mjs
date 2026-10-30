/** Narrow, exact shared asset reuse; authoring packages remain untouched. */
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const FAMILIES=[['s34v:crack','s38v:crack','s39v:crack'],['s31v:abandoned-skiff','s33v:abandoned-skiff'],['s32v:old-wall','s37v:old-wall'],['s37v:haul-footing','s38v:haul-footing']];
const comparable=a=>Object.fromEntries(Object.entries(a).filter(([key])=>!['id','name'].includes(key)));
export async function canonicalizeSharedAssets(input,{officialIds=new Set()}={}){
 const project=structuredClone(input),byId=new Map(project.library.map(a=>[a.id,a])),aliases={},families=[];
 for(const family of FAMILIES){const ids=[...family].sort(),canonical=byId.get(ids[0]);assert(canonical,'Missing declared canonical asset '+ids[0]);for(const id of ids){assert(!officialIds.has(id),'Cannot remove or replace official asset');const asset=byId.get(id);assert(asset,'Missing declared shared asset '+id);assert.deepEqual(comparable(asset),comparable(canonical),'Asset differs beyond id/name: '+id);if(id!==canonical.id)aliases[id]=canonical.id;}families.push({canonicalId:canonical.id,ids,fullContractSha256:hash(comparable(canonical)),scope:'Every field except top-level id/name is deeply equal, including vector, params, reference, anchor and collision.'});}
 // These production-scoped IDs must not be literal gameplay selectors. Refuse
 // automatic aliases if later runtime code introduces that dependency.
 const inspected=[];for(const dir of['shared/runtime','shared/map','shared/engine/src'])for(const name of(await readdir(dir)).filter(n=>/\.(js|ts)$/.test(n))){const path=dir+'/'+name,text=await readFile(path,'utf8');for(const id of Object.keys(aliases))assert(!text.includes(id),'Runtime literal uses aliased identity: '+path+' '+id);inspected.push({path,sha256:createHash('sha256').update(text).digest('hex')});}
 const changes=[];function rewrite(value,path){if(!value||typeof value!=='object')return;for(const[key,item]of Object.entries(value)){const target=typeof item==='string'?aliases[item]:undefined;if(target){assert(key==='assetId'||key.endsWith('AssetId'),'Alias used outside an explicit asset reference: '+path+'.'+key);changes.push({path:path+'.'+key,from:item,to:target});value[key]=target;}else if(item&&typeof item==='object')rewrite(item,path+'.'+key);}}
 for(const stage of project.stages)if(stage.metadata?.stageId>=31)rewrite(stage,stage.id);
 project.library=project.library.filter(a=>!aliases[a.id]);
 return{project,report:{aliases,families,changes,removedDefinitions:Object.keys(aliases),runtimeLiteralAudit:inspected,beforeBytes:Buffer.byteLength(JSON.stringify(input)),afterBytes:Buffer.byteLength(JSON.stringify(project)),scope:'Only declared exact new assets share canonical definitions. Original stage element/event IDs and original shared library assets remain. No renderer or authoring-package mutation.'}};
}
