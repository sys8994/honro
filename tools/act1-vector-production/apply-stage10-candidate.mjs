/** Stage10 visual-only tree replacement and canonical root/ground material overlays. */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v,digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage10ArtCandidate(project){
 if(process.env.HONRO_ACT1_STAGE10_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage10-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===10);if(!source)throw Error('Stage10 source missing');
 if(digest(Object.fromEntries(Object.keys(record.source).map(k=>[k,source[k]])))!==digest(record.source))throw Error('Stage10 geometry changed; regenerate and review');
 if(source.elements.some(e=>e.id.startsWith('act1-stage10-traced-')))throw Error('Duplicate Stage10 material application');
 const elements=source.elements.map(e=>({...e})),assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act1/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y)throw Error('Invalid Stage10 decorative vector');return a;});
 const tree=elements.find(e=>e.id===record.treePlacement.id);if(!tree||digest(tree)!==digest(record.treePlacement))throw Error('Stage10 tree placement changed');tree.assetId=assets[0].id;
 for(const a of assets.slice(1))elements.push({id:'act1-stage10-traced-'+a.id.split('stage10-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 return {...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
