/** Visual-only Stage2 opt-in; source geometry and story remain immutable. */
import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage2ArtCandidate(project){
 if(process.env.HONRO_ACT1_STAGE2_CANDIDATE!=='1')return project;
 const record=JSON.parse(readFileSync(new URL('./stage02-body-source.json',import.meta.url),'utf8')),s=project.stages.find(s=>s.metadata?.stageId===2);if(!s)throw Error('Stage2 source missing');
 const actual=Object.fromEntries(Object.keys(record.source).map(k=>[k,s[k]]));if(digest(actual)!==digest(record.source)||digest(s.design.stage2LayeredRoad.rearCliffs)!==digest(record.rearCliffs))throw Error('Stage2 geometry changed; regenerate and review');
 if(s.elements.some(e=>e.id.startsWith('act1-stage02-traced-')))throw Error('Duplicate Stage2 candidate');
 const assets=['body','rear'].map(part=>JSON.parse(readFileSync(new URL(`../../shared/data/act1/stage02-${part}-candidate.json`,import.meta.url),'utf8')));
 for(const a of assets)if(a.collision.length||!a.params.previewOnly)throw Error('Stage2 candidate must be non-colliding preview art');
 const common={x:0,y:0,scale:1,rotation:0,depthLayer:'L1',visualRole:'scenery'},stage={...s,elements:[{...common,id:'act1-stage02-traced-rear',assetId:assets[1].id,layer:'back'},...s.elements,{...common,id:'act1-stage02-traced-body',assetId:assets[0].id,layer:'front'}]};
 return{...project,stages:project.stages.map(v=>v===s?stage:v),library:[...project.library,...assets]};
}
