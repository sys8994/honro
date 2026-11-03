/** Visual-only Stage15 traced geology. Invoke before narrative authoring hooks. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage15ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE15_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage15-art-source.json',import.meta.url),'utf8'));
 const stage=project.stages.find(s=>s.metadata?.stageId===15);if(!stage)throw Error('Stage15 source missing');
 if(digest(Object.fromEntries(Object.keys(record.source).map(k=>[k,stage[k]])))!==digest(record.source))throw Error('Stage15 raw geometry changed; regenerate and review');
 if(stage.elements.some(e=>e.id.startsWith('act2-stage15-traced-')))throw Error('Duplicate Stage15 material application');
 const assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act2/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y||a.params.bodyTerrainIds.includes('fc15-drained-ledge'))throw Error('Invalid Stage15 decorative vector or dynamic terrain host');return a;});
 const elements=[...stage.elements,...assets.map(a=>({id:'act2-stage15-traced-'+a.id.split('stage15-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return {...project,stages:project.stages.map(s=>s===stage?{...stage,elements}:s),library:[...project.library,...assets]};
}
