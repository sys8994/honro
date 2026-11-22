import {readFileSync as get,writeFileSync as put} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {normalizeLibrary} from './grammar.mjs';
const [a,b,out]=process.argv.slice(2).map(x=>resolve(x)), read=(p,f)=>get(join(p,f)), j=(p,f)=>JSON.parse(read(p,f)), h=x=>createHash('sha256').update(x).digest('hex');
const full=x=>Buffer.from(JSON.stringify(x)+'\n');
const show=x=>JSON.stringify(x);
const deep=(a,b)=>show(a)===show(b);
const need=(x,msg)=>{if(!x)throw Error(msg);};
const manifest='shared/data/terrain-path-optimization.json', txt=read(a,manifest).toString('utf8');
const dp='web/data/chapter-40-assets-parts.578f8624b0ac77bc.json', desc=j(a,dp);
const parts=desc.parts.map(x=>{const p=read(a,x.path);need(p.length===x.bytes&&h(p)===x.sha256,'old leaf SHA');return p;});
const packet=Buffer.concat(parts);
need(parts.length===3&&packet.length===10619913&&h(packet)==='54ca4477cd7cb1c4d8762b9293e7429f12aef593b3d9d42d5fe84eaa306203f4','exact active old packet');
const im=pth=>import(pathToFileURL(join(a,pth)));
const [{packJson,unpackJson},{terrainPathOptimization},{readWorldSource}]=await Promise.all([im('shared/json-pool.mjs'),im('shared/terrain-path-optimization.mjs'),im('tools/act4-source/world-source.mjs')]);
const stock=unpackJson(JSON.parse(packet));
need(full(packJson(stock)).equals(packet),'released packet is not the canonical pack input');
const {decoded,data,ids,sharedProtectedUniqueDrawPaths}=normalizeLibrary(stock);
const newPacket=full(packJson(decoded));
need(newPacket.length===10137621&&h(newPacket)==='458581a814995e74b6bf35efb817fb5c766703fd261f945045eadb97f83a02ae','signed R2 packet exact');
const world=await readWorldSource(join(a,'shared/data/act4'));
const worldLib=JSON.parse(world.bytes).library;
need(Array.isArray(worldLib),'canonical source library missing');
const selected=[...ids].map(id=>{const rows=worldLib.filter(r=>r.id===id);need(rows.length===1,'expected original Act4 library owner '+id);return rows[0];});
const before=structuredClone(selected);
const so=await terrainPathOptimization();so.apply(before);
const list=JSON.parse(txt);
need(Array.isArray(list)&&new Set(list.map(x=>x.id)).size===list.length,'optimizer duplicate id');
const updates=new Map();
function visitPaths(v,func,p=[]){
 if(v===null||typeof v!=='object')return;
 if(v.tag==='path'){
  for(const k of ['d','dParts'])if(Object.hasOwn(v,k))func(v[k],p,k);
  return;
 }
 for(const [k,n] of Object.entries(v))visitPaths(n,func,[...p,Array.isArray(v)?Number(k):k]);
}
const at=(v,p)=>p.reduce((r,k)=>r[k],v);
for(let i=0;i<selected.length;i++){
 const id=selected[i].id, canonical=selected[i].vector, compiled=before[i].vector, published=stock.find(o=>o.id===id).vector, optimized=decoded.find(o=>o.id===id).vector;
 need(deep(compiled,published),'canonical raw plus current optimizer cannot reproduce exact published vector '+id);
 const oldEntry=list.find(v=>v.id===id);
 const original=h(show(canonical));
 if(oldEntry)need(oldEntry.original===original,'stale owner fingerprint '+id);
 let target={...(oldEntry??{id,original,paths:[]}),paths:structuredClone(oldEntry?.paths??[])};
 const lookup=new Map(target.paths.map(([route,key],j)=>[show([route,key]),j]));
 need(lookup.size===target.paths.length,'duplicate stock path row '+id);
 const writes=[];
 visitPaths(optimized,(value,route,key)=>{
  if(deep(value,at(compiled,route)[key]))return;
  need(at(canonical,route).tag==='path'&&Object.hasOwn(at(canonical,route),key),'no corresponding source drawing path');
  const row=[route,key,value], k=show([route,key]), slot=lookup.get(k);
  if(slot!==undefined)target.paths[slot]=row;else target.paths.push(row);
  writes.push([route,key]);
 });
 need(writes.length>0,'no optimization path '+id);
 const rebuilt=structuredClone(canonical);
 for(const [route,key,value]of target.paths)at(rebuilt,route)[key]=value;
 need(deep(rebuilt,optimized)&&Buffer.byteLength(show(rebuilt))<Buffer.byteLength(show(compiled)),'source proof harmed or ineffective for '+id);
 updates.set(id,{target,oldEntry,writes,original,stockSHA:h(show(compiled)),winnerSHA:h(show(rebuilt))});
}
function objectRanges(raw){
 const ranges=[];let depth=0,start=-1,inString=false,escape=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(inString){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')inString=false;continue;}
  if(c==='"'){inString=true;continue;}
  if(c==='['||c==='{'){if(depth===1&&c==='{')start=i;depth++;continue;}
  if(c===']'||c==='}'){depth--;if(depth===1&&c==='}')ranges.push([start,i+1]);}
 }
 need(!inString&&!depth&&ranges.length===list.length,'unexpected manifest serialization');
 return ranges;
}
let result='',cursor=0;
const spans=objectRanges(txt);
for(let i=0;i<list.length;i++){
 const old=list[i], u=updates.get(old.id);if(!u)continue;
 const [start,end]=spans[i];
 need(deep(JSON.parse(txt.slice(start,end)),old),'source span mismatch');
 result+=txt.slice(cursor,start)+show(u.target);cursor=end;
}
result+=txt.slice(cursor);
const additions=[...updates.values()].filter(x=>!x.oldEntry).map(x=>show(x.target));
if(additions.length){const k=result.lastIndexOf(']');result=result.slice(0,k)+(list.length?',':'')+additions.join(',')+result.slice(k);}
const verify=JSON.parse(result);
need(deep(verify.filter(x=>!ids.has(x.id)),list.filter(x=>!ids.has(x.id))), 'non-target manifest changed');
need(verify.filter(x=>ids.has(x.id)).length===4,'not exactly four new/current rows');
put(join(b,manifest),result);
put(join(out,'SOURCE-PROOF.json'),JSON.stringify({file:manifest,worldSourceSHA256:world.manifest.sha256,oldManifestSHA256:h(txt),newManifestSHA256:h(result),changedOwners:[...updates].map(([id,u])=>({id,replacedExisting:!!u.oldEntry,writes:u.writes,original:u.original,stockSHA:u.stockSHA,winnerSHA:u.winnerSHA})),expectedCompiledSHA256:h(newPacket),expectedCompiledBytes:newPacket.length,sharedProtectedUniqueDrawPaths,localLanguageExact:data},null,2)+'\n');
