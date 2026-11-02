/** Visual-only Stage18 static cavern; call before narrative authoring. */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage18ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE18_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage18-art-source.json',import.meta.url),'utf8')),stage=project.stages.find(s=>s.metadata?.stageId===18);if(!stage)throw Error('Stage18 source missing');
 if(digest(Object.fromEntries(Object.keys(record.source).map(k=>[k,stage[k]])))!==digest(record.source))throw Error('Stage18 raw geometry changed; regenerate and review');
 if(stage.elements.some(e=>e.id.startsWith('act2-stage18-traced-')))throw Error('Duplicate Stage18 material application');
 const assets=record.assets.map(r=>{const bytes=readFileSync(new URL('../../shared/data/act2/'+r.file,import.meta.url));if(createHash('sha256').update(bytes).digest('hex')!==r.sha256)throw Error('Stage18 asset hash mismatch');const a=JSON.parse(bytes);if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y||a.params.bodyTerrainIds.some(id=>record.excludedDynamicAndNativeTerrainIds.includes(id)))throw Error('Invalid Stage18 static vector');if(project.library.some(x=>x.id===a.id))throw Error('Duplicate Stage18 asset ID');return a;});
 const elements=[...stage.elements,...assets.map(a=>({id:'act2-stage18-traced-'+a.id.split('stage18-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return {...project,stages:project.stages.map(s=>s===stage?{...stage,elements}:s),library:[...project.library,...assets]};
}
