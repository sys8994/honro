import {createHash} from 'node:crypto';

export const publishedRetention={version:2,windowDays:7,minGraphs:2};
const dayMs=86400000;
export const safeWebAsset=file=>/^web\/(runtime|entries|data|styles|graphics|fonts)\/[\w.-]+$/.test(file?.path||'');
export function validateAsset(file){
  if(!safeWebAsset(file)||!Number.isSafeInteger(file.bytes)||file.bytes<0||!/^[a-f0-9]{64}$/.test(file.sha256||''))throw Error('Invalid immutable asset: '+file?.path);
}
export function graphSha256(files){
  if(!Array.isArray(files)||!files.length)throw Error('Published graph has no source files');
  const paths=new Set();
  for(const file of files){validateAsset(file);if(paths.has(file.path))throw Error('Duplicate immutable asset: '+file.path);paths.add(file.path);}
  return createHash('sha256').update(JSON.stringify([...files].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0).map(f=>[f.path,f.sha256,f.bytes]))).digest('hex');
}
export function publicationTime(g){
  const day=g.publishedAtPrecision==='day';
  if(day?!/^\d{4}-\d{2}-\d{2}$/.test(g.publishedAt||''):g.publishedAtPrecision!=='instant'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(g.publishedAt||''))throw Error('Explicit publication timestamp/precision required');
  if(day&&(!Number.isSafeInteger(g.publicationOrder)||g.publicationOrder<1))throw Error('Day precision requires attested publication order');
  const time=Date.parse(g.publishedAt);
  if(!Number.isFinite(time)||(day&&new Date(time).toISOString().slice(0,10)!==g.publishedAt))throw Error('Invalid publication timestamp');
  return {time,order:g.publicationOrder||0,expiresAt:time+(publishedRetention.windowDays+(day?1:0))*dayMs};
}
export function selectPublishedGenerations(generations=[],{now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('Invalid retention clock');
  const ordered=generations.map((g,index)=>{
    if(!/^[a-f0-9]{40}$/.test(g.sourceSha||'')||typeof g.evidence!=='string'||!g.evidence.trim()||g.graphSha256!==graphSha256(g.files))throw Error('Unverified published graph metadata; register its source history first');
    const clock=publicationTime(g);if(clock.time>now)throw Error('Publication is in the future');
    return {g,index,...clock};
  }).sort((a,b)=>b.time-a.time||b.order-a.order||a.index-b.index);
  const seen=new Set(),distinct=ordered.filter(row=>{if(seen.has(row.g.graphSha256))return false;seen.add(row.g.graphSha256);return true;});
  return distinct.filter((row,index)=>index<publishedRetention.minGraphs||row.expiresAt>now).map(row=>row.g);
}

// Intermediate builds have two slots independent of real publications.
export function intermediateGenerations(generations,currentFiles,published){
  const protectedPaths=new Set([...currentFiles,...published.flatMap(g=>g.files)].map(f=>f.path)),seen=new Set();
  return generations.map(files=>files.filter(f=>safeWebAsset(f)&&!protectedPaths.has(f.path))).filter(files=>{
    if(!files.length)return false;
    const key=files.map(f=>f.path).sort().join('\n');if(seen.has(key))return false;seen.add(key);return true;
  }).slice(0,2);
}
export function planWebAssetRetention(previous,currentFiles,{now=Date.now()}={}){
  const current=new Set(currentFiles.map(f=>f.path)),last=previous?.files||[],older=previous?.previousFiles||[];
  const unchanged=last.length===current.size&&last.every(f=>current.has(f.path));
  const oldPublishedPaths=new Set((previous?.publishedGenerations||[]).flatMap(g=>g.files).map(f=>f.path));
  const legacyBuildFiles=older.filter(f=>!oldPublishedPaths.has(f.path));
  const generations=previous?.previousGenerations||(legacyBuildFiles.length?[legacyBuildFiles]:[]);
  const published=selectPublishedGenerations(previous?.publishedGenerations,{now});
  const previousGenerations=intermediateGenerations(unchanged||!last.length?generations:[last,...generations],currentFiles,[...(previous?.publishedGenerations||[]),...published]);
  const previousFiles=[...new Map([...previousGenerations.flat(),...published.flatMap(g=>g.files)].filter(f=>safeWebAsset(f)&&!current.has(f.path)).map(f=>[f.path,f])).values()];
  const retained=new Set(previousFiles.map(f=>f.path));
  const obsoleteFiles=[...new Map([...last,...older,...generations.flat(),...(previous?.publishedGenerations||[]).flatMap(g=>g.files)].filter(f=>safeWebAsset(f)&&!current.has(f.path)&&!retained.has(f.path)).map(f=>[f.path,f])).values()];
  return {previousFiles,previousGenerations,obsoleteFiles};
}
