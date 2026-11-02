/** Stage9 material-only art: canonical solids, recessed wall, rooted pine. */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v,digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage9ArtCandidate(project){
 if(process.env.HONRO_ACT1_STAGE9_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage09-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===9);if(!source)throw Error('Stage9 source missing');
 if(digest(Object.fromEntries(Object.keys(record.source).map(k=>[k,source[k]])))!==digest(record.source))throw Error('Stage9 geometry changed; regenerate and review');
 if(source.elements.some(e=>e.id.startsWith('act1-stage09-traced-')))throw Error('Duplicate Stage9 material application');
 const elements=source.elements.map(e=>({...e})),assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act1/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y)throw Error('Invalid Stage9 decorative vector');return a;});
 for(const r of record.replacements){const e=elements.find(e=>e.id===r.placement.id);if(!e||digest(e)!==digest(r.placement))throw Error('Stage9 rear placement changed');e.assetId=r.assetId;}
 for(const a of assets.slice(1))elements.push({id:'act1-stage09-traced-'+a.id.split('stage09-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 return {...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
