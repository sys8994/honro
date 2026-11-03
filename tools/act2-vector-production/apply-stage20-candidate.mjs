/** Stage20 static rock material only; dynamic convoy props and machinery remain native. */
import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const stage20Digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage20ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE20_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage20-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===20);if(!source)throw Error('Stage20 source missing');
 if(source.elements.some(e=>e.id.startsWith('act2-stage20-traced-')))throw Error('Duplicate Stage20 material application');
 if(stage20Digest(source)!==record.rawStageSha256)throw Error('Stage20 pre-author source changed; regenerate and review');
 const assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act2/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y||a.params.bodyTerrainIds.some(id=>!['act2-floor','exit-overhang'].includes(id))||stage20Digest(a)!==r.sha256)throw Error('Invalid Stage20 decorative vector');return a;});
 const elements=[...source.elements,...assets.map(a=>({id:'act2-stage20-traced-'+a.id.split('stage20-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return{...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
