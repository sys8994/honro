/** Stage19 shares Stage18 static material bytes, never its mutable bell geometry. */
import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const stage19Digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
export function applyStage19ArtCandidate(project){
 if(process.env.HONRO_ACT2_STAGE19_CANDIDATE==='0')return project;
 const r=JSON.parse(readFileSync(new URL('./stage19-art-source.json',import.meta.url),'utf8')),s=project.stages.find(s=>s.metadata?.stageId===19);
 if(!s||stage19Digest(s)!==r.rawStageSha256)throw Error('Stage19 pre-author source changed; regenerate/review placement');
 if(s.elements.some(e=>e.id.startsWith('act2-stage19-traced-')))throw Error('Duplicate Stage19 material application');
 const add=[],ids=[];
 for(const row of r.assets){
  const bytes=readFileSync(new URL('../../shared/data/act2/'+row.file,import.meta.url));const a=JSON.parse(bytes);if(createHash('sha256').update(bytes).digest('hex')!==row.sha256)throw Error('Stage19 shared asset byte hash mismatch');
  if(a.id!==row.assetId||stage19Digest(a)!==row.canonicalSha256||a.collision.length||a.anchor.x||a.anchor.y)throw Error('Invalid shared Stage18 static asset '+row.assetId);
  if(a.params.bodyTerrainIds.some(id=>id.startsWith('sb-bell-')))throw Error('Mutable bell must not be in static shared art');
  const existing=project.library.filter(x=>x.id===a.id);if(existing.length>1||existing.length===1&&stage19Digest(existing[0])!==row.canonicalSha256)throw Error('Conflicting shared terrain asset '+a.id);
  if(!existing.length)add.push(a);ids.push(a.id);
 }
 const elements=[...s.elements,...ids.map((assetId,i)=>({id:'act2-stage19-traced-'+i,assetId,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'}))];
 return{...project,stages:project.stages.map(t=>t===s?{...s,elements}:t),library:[...project.library,...add]};
}
