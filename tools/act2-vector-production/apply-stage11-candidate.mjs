/** Stage 11 material skins only. No terrain, actor, story, camera, or timber writes. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage11ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE11_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage11-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===11);
 if(!source)throw Error('Stage11 source missing');
 if(digest(Object.fromEntries(Object.keys(record.source).map(k=>[k,source[k]])))!==digest(record.source))throw Error('Stage11 pre-hook geometry changed; regenerate and review');
 if(digest(source.elements)!==digest(record.preservedElements))throw Error('Stage11 source scenery/quest placements changed; review art layering');
 if(source.elements.some(e=>e.id.startsWith('act2-stage11-traced-')))throw Error('Duplicate Stage11 material application');
 if(!record.assets.length)throw Error('Stage11 candidate not packaged');
 const assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act2/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y||a.params.semanticLayer!=='BODY')throw Error('Invalid Stage11 decorative material');return a;});
 const elements=[...source.elements,...assets.map(a=>({id:'act2-stage11-traced-'+a.id.split('stage11-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return {...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
