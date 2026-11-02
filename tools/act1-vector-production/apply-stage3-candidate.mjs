/** Reviewed visual-only BODY candidate. It adds visual art; never terrain, units or camera. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage3ArtCandidate(project){
 if(process.env.HONRO_ACT1_STAGE3_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage03-body-source.json',import.meta.url),'utf8'));
 const source=project.stages.find(s=>s.metadata?.stageId===record.stage);if(!source)throw Error('Stage3 BODY source missing');
 const actual=Object.fromEntries(Object.keys(record.source).map(k=>[k,source[k]]));
 if(digest(actual)!==digest(record.source))throw Error(`Stage3 BODY geometry changed: ${digest(actual)} != ${digest(record.source)}; regenerate and review, never silently reproject`);
 if(source.elements.some(e=>e.id==='act1-stage03-traced-body'))throw Error('Duplicate BODY candidate application');
 const asset=JSON.parse(readFileSync(new URL('../../shared/data/act1/stage03-body-candidate.json',import.meta.url),'utf8'));
 if(asset.id!==record.assetId||asset.collision.length||asset.params.semanticLayer!=='BODY'||asset.params.previewOnly!==!record.productionAccepted)throw Error('Invalid visual-only BODY candidate');
 const stage={...source,elements:[...source.elements,{id:'act1-stage03-traced-body',assetId:asset.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}]};
 return {...project,stages:project.stages.map(s=>s===source?stage:s),library:[...project.library,asset]};
}
