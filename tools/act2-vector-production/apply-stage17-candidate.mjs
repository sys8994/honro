/** Stage17 static rock material only; machinery/wood/mutable gate remain native. */
import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const stage17Digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage17ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE17_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage17-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===17);if(!source)throw Error('Stage17 source missing');
 if(source.elements.some(e=>e.id.startsWith('act2-stage17-traced-')))throw Error('Duplicate Stage17 material application');
 if(stage17Digest(source)!==record.rawStageSha256)throw Error('Stage17 pre-author source changed; regenerate and review');
 const assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act2/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y||a.params.bodyTerrainIds.includes('gate-repair')||stage17Digest(a)!==r.sha256)throw Error('Invalid Stage17 decorative vector');return a;});
 const elements=[...source.elements,...assets.map(a=>({id:'act2-stage17-traced-'+a.id.split('stage17-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return{...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
