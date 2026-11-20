/** Diagnostic observer. Imported production modules never patched or replaced. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=resolve(process.argv[2]),out=resolve(process.argv[3]);
process.chdir(root);
const imp=p=>import(pathToFileURL(resolve(root,p)).href);
const {runtime}=await imp('game/tests/helpers.mjs');
const {authorStage22Vertical,authorStage22PlaceEncounters}=await imp('tools/map-forge/apply-stage22-vertical.mjs');
const {authorStage22VerticalGeometry}=await imp('tools/map-forge/stage22-vertical-geometry.mjs');
const hash=x=>createHash('sha256').update(x).digest('hex');
const serialized=x=>JSON.stringify(x);
const raw=readFileSync('shared/data/campaign.json'),p=JSON.parse(raw);
assert.equal(hash(raw),'baec517adadfc123cb1573591fc5047d8362cc7b525ec1ba902e88aa1d6762a0');
const g=await runtime({legacyMaps:false});
const type=x=>x===undefined?'missing':x===null?'null':Array.isArray(x)?'array':typeof x;
const stat=x=>({type:type(x),hash:x===undefined?null:hash(serialized(x))});
const pathPart=x=>String(x).replace(/~/g,'~0').replace(/\//g,'~1');
function stageDiff(a,b){
 if(serialized(a)===serialized(b))return null;
 const counts={},paths=[];let total=0;
 function add(path,x,y,kind){
  counts[kind]=(counts[kind]||0)+1;total++;
  if(paths.length<36)paths.push({path: path.length>220?'[long-path-sha256:'+hash(path)+']':path,kind,before:stat(x),after:stat(y)});
 }
 function walk(x,y,path){
   const tx=type(x),ty=type(y);
   if(x===y)return;
   if(tx!==ty||!['object','array'].includes(tx))return add(path,x,y,tx==='missing'?'added':ty==='missing'?'removed':tx===ty?'value':'type');
   if(tx==='array'){
    const common=Math.min(x.length,y.length);
    if(x.length!==y.length)add(path+'/@length',x.length,y.length,'array-length');
    for(let i=0;i<common;i++)walk(x[i],y[i],path+'/'+i);
    for(let i=common;i<x.length;i++)add(path+'/'+i,x[i],undefined,'removed');
    for(let i=common;i<y.length;i++)add(path+'/'+i,undefined,y[i],'added');
   }else{
    const ax=Object.keys(x),by=Object.keys(y);
    if(ax.length===by.length&&ax.every(k=>Object.hasOwn(y,k))&&serialized(ax)!==serialized(by))add(path+'/@property-order',ax,by,'property-order');
    for(const k of new Set([...ax,...by]))walk(x[k],y[k],path+'/'+pathPart(k));
   }
 }
 walk(a,b,'');
 return {before:stat(a),after:stat(b),counts,total,paths,pathsTruncated:total>paths.length};
}
function checkpoint(label,a,b){
 const slim=x=>x.stages.filter(s=>s.metadata?.stageId!==22);
 const s1=slim(a),s2=slim(b),m1=new Map(s1.map(s=>[s.metadata.stageId,s])),m2=new Map(s2.map(s=>[s.metadata.stageId,s]));
 assert.equal(s1.length,m1.size);assert.equal(s2.length,m2.size);
 const changed=[];
 for(const id of new Set([...m1.keys(),...m2.keys()])){
  const d=stageDiff(m1.get(id),m2.get(id));if(d)changed.push({stageId:id,...d});
 }
 return {label,guardEquality:serialized(s1)===serialized(s2),beforeOrderedSHA256:hash(serialized(s1)),afterOrderedSHA256:hash(serialized(s2)),changedStageCount:changed.length,changed,
  orderChanged:serialized(Array.from(m1.keys()))!==serialized(Array.from(m2.keys()))};
}
function locate(e){
 const known=[];
 for(const line of String(e?.stack??'').split('\n')){
  const m=line.match(/file:\/\/[^\s)]+\/(stage22-vertical-geometry|apply-stage22-vertical)\.mjs:(\d+):(\d+)/);
  if(m)known.push({file:m[1]+'.mjs',line:Number(m[2]),column:Number(m[3])});
 }
 const text=String(e?.message??'');
 return {knownGuard:text==='Vertical22 changed another stage',recognizedFrames:known.slice(0,3),messageSHA256:hash(text)};
}
const report={official:null,checkpoints:[],rawSHA256:hash(raw),scope:'read-only exact joint fixture plus unchanged official method; not a release pass'};
const emit=()=>writeFileSync(out,serialized(report)+'\n');
try{
 await authorStage22Vertical(structuredClone(p),g);
 report.official={returned:true};
}catch(e){report.official={returned:false,...locate(e)};}
emit();
assert(!report.official.returned&&report.official.knownGuard&&report.official.recognizedFrames.length);
const frame=report.official.recognizedFrames[0];
assert((frame.file==='stage22-vertical-geometry.mjs'&&frame.line===128)||(frame.file==='apply-stage22-vertical.mjs'&&frame.line===62),frame);
if(frame.line===128){
 // The public geometry author legitimately stopped. The domain step has no
 // cross-stage dependence on Stage22; consume unaffected stages as supplied.
 const domain=g.HonroTerrainDomain.author(structuredClone(p));
 report.checkpoints.push(checkpoint('pre-geometry → isolated domain of original input (non-22 only)',p,domain));
 emit();
 assert(!report.checkpoints.at(-1).guardEquality,'First guard needs exact changed non22 data; stop');
}else{
 const q=authorStage22VerticalGeometry(g,structuredClone(p));
 report.checkpoints.push(checkpoint('raw → geometry+first domain returned',p,q));
 assert(report.checkpoints.at(-1).guardEquality);
 const snapshot=structuredClone(q);
 authorStage22PlaceEncounters(q,q.stages.find(s=>s.metadata?.stageId===22));
 report.checkpoints.push(checkpoint('geometry → encounter author',snapshot,q));
 const d=g.HonroTerrainDomain.author(q);
 report.checkpoints.push(checkpoint('encounters → second domain',q,d));
 const n=g.HonroMaps.normalize(d);
 report.checkpoints.push(checkpoint('second domain → normalize',d,n));
 const beforeValidation=structuredClone(n);
 const validated=g.HonroMaps.validate(n).filter(x=>x.level==='err');
 report.checkpoints.push(checkpoint('normalize → validate (input projection)',beforeValidation,n));
 report.strictValidationErrorCount=validated.length;
 emit();
 assert.equal(validated.length,0,'Checkpoint validation disagrees with observed later guard');
 const f=g.HonroMaps.finalize(d);
 report.checkpoints.push(checkpoint('normalizer+validation → unchanged finalize result',n,f));
 report.checkpoints.push(checkpoint('actual outer protection predicate: raw → finalize',p,f));
 emit();
 assert(!report.checkpoints.at(-1).guardEquality,'Later guard needs exact changed non22 data; stop');
}
console.log(JSON.stringify({official:report.official,checkpoints:report.checkpoints.map(({label,guardEquality,changedStageCount})=>({label,guardEquality,changedStageCount}))}));
