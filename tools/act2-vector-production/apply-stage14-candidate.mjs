/** Stage14 art-only candidate, invoked on the pre-runtime-author project.
 * No shared dispatcher wiring here: serial integration is owned by release lead. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const stage14Digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage14ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE14_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage14-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===14);
 if(!source||stage14Digest(source)!==record.preHookStageSha256)throw Error('Stage14 pre-hook source changed; regenerate and review the art contract');
 if(project.library.some(a=>a.id.startsWith('act2-traced:stage14-')))throw Error('Duplicate Stage14 candidate library');
 const assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act2/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y||stage14Digest(a)!==r.sha256)throw Error('Invalid Stage14 decorative vector '+r.assetId);return a;});
 const elements=[...source.elements,...record.bodyAssetIds.map(assetId=>({id:assetId.replace(':','-'),assetId,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return{...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
