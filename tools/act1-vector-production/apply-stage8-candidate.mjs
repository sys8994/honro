/** Stage8 material-only art: canonical solids, recessed wall, rooted pine. */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v,digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage8ArtCandidate(project){
 if(process.env.HONRO_ACT1_STAGE8_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage08-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===8);if(!source)throw Error('Stage8 source missing');
 if(digest(Object.fromEntries(Object.keys(record.source).map(k=>[k,source[k]])))!==digest(record.source))throw Error('Stage8 geometry changed; regenerate and review');
 if(source.elements.some(e=>e.id.startsWith('act1-stage08-traced-')))throw Error('Duplicate Stage8 material application');
 const elements=source.elements.map(e=>({...e})),assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act1/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y)throw Error('Invalid Stage8 decorative vector');return a;});
 for(const r of record.replacements){const e=elements.find(e=>e.id===r.placement.id);if(!e||digest(e)!==digest(r.placement))throw Error('Stage8 rear placement changed');e.assetId=r.assetId;}
 for(const a of assets.slice(2))elements.push({id:'act1-stage08-traced-'+a.id.split('stage08-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 return {...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
