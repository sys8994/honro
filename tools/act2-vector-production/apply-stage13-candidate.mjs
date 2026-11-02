/** Stage13 near-terrain material only. Invoke after stoneFinish, before runtime authors. */
import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const stage13Digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage13ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE13_CANDIDATE==='0')return project;
 const record=JSON.parse(readFileSync(new URL('./stage13-art-source.json',import.meta.url),'utf8')),source=project.stages.find(s=>s.metadata?.stageId===13);if(!source)throw Error('Stage13 source missing');
 if(source.elements.some(e=>e.id.startsWith('act2-stage13-traced-')))throw Error('Duplicate Stage13 material application');
 if(stage13Digest(source)!==record.rawStageSha256)throw Error('Stage13 pre-author source changed; regenerate and review');
 if(source.design?.stoneFinish?.revision!==1)throw Error('Stage13 stoneFinish pass missing');
 const assets=record.assets.map(r=>{const a=JSON.parse(readFileSync(new URL('../../shared/data/act2/'+r.file,import.meta.url),'utf8'));if(a.id!==r.assetId||a.collision.length||a.anchor.x||a.anchor.y||stage13Digest(a)!==r.sha256)throw Error('Invalid Stage13 decorative vector');return a;});
 const elements=[...source.elements,...assets.map(a=>({id:'act2-stage13-traced-'+a.id.split('stage13-')[1],assetId:a.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return{...project,stages:project.stages.map(s=>s===source?{...source,elements}:s),library:[...project.library,...assets]};
}
