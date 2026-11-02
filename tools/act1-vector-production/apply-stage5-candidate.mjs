/** Replace only existing static Stage5 BODY art slots; preserve all gameplay. */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage5ArtCandidate(project){
 if(process.env.HONRO_ACT1_STAGE5_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage05-body-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===5);if(!source)throw Error('Stage5 source missing');
 const actual=Object.fromEntries(Object.keys(record.source).map(k=>[k,source[k]]));if(digest(actual)!==digest(record.source))throw Error('Stage5 BODY geometry changed; regenerate and review');
 const elements=source.elements.map(e=>({...e})),assets=[];
 for(const slot of record.slots){const e=elements.find(e=>e.id===slot.elementId);if(!e||e.assetId!==slot.previousAssetId)throw Error('Stage5 original art slot changed: '+slot.elementId);
  const a=JSON.parse(readFileSync(new URL('../../shared/data/act1/'+slot.file,import.meta.url),'utf8'));if(a.id!==slot.assetId||a.collision.length||a.params.semanticLayer!=='BODY'||a.anchor.x!==0||a.anchor.y!==0)throw Error('Invalid static Stage5 BODY');e.assetId=a.id;assets.push(a);}
 return {...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
