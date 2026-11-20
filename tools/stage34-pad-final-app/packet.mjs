import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
const [stock,trial,out,poolFile=path.join(stock||'.','shared/json-pool.mjs')]=process.argv.slice(2).map(x=>path.resolve(x));
const tooling=path.dirname(fileURLToPath(import.meta.url));
assert(stock!==trial&&stock!==out&&trial!==out);
const {packJson,unpackJson}=await import(pathToFileURL(poolFile));
const sha=x=>createHash('sha256').update(x).digest('hex'),J=x=>Buffer.from(JSON.stringify(x)+'\n'),id='approved34:coastal-foundation';
const expectedAssetSha='2fef77efb6c2d03544e68260cec7405f30d6af011c1f8f61cb64bf8219a5a2b6';
const expectedSource='33d17ad69cfb762d95ffddb47359143373d0b8afcc86f6e1b23cf89c8fed93cf';
const read=(root,n)=>{assert(/^web\/data\/[A-Za-z0-9._-]+\.(json|bin)$/.test(n)&&!n.includes('..'),n);return fs.readFileSync(path.join(root,n));};
function transport(root,loc){
 const b=read(root,loc),raw=JSON.parse(b);
 if(raw.$honroJsonParts!==1)return {raw,blobs:null,b};
 assert.deepEqual(Object.keys(raw).sort(),['$honroJsonParts','bytes','parts','sha256']);
 const blobs=raw.parts.map(x=>{const z=read(root,x.path);assert.equal(z.length,x.bytes);assert.equal(sha(z),x.sha256);return z});
 const m=Buffer.concat(blobs);assert.equal(m.length,raw.bytes);assert.equal(sha(m),raw.sha256);
 return {raw:JSON.parse(m),blobs:raw.parts,b};
}
const manifest=JSON.parse(fs.readFileSync(path.join(stock,'web/manifest.json')));assert.equal(manifest.game,'HONRO.html');
const cp=transport(stock,manifest.project).raw;
assert.equal(cp.libraryOrder.filter(x=>x===id).length,1);
const loc=cp.stageLibraries[33], stPath=cp.stages[33], enc=cp.assetEncodings.stageLibraries[33], stage=transport(stock,stPath).raw;
assert(/^web\/data\/chapter-34-assets(?:-parts)?\.[a-f0-9]{16}\.json$/.test(loc),loc);
assert(/^web\/data\/chapter-34\.[a-f0-9]{16}\.json$/.test(stPath),stPath);
assert(['json','json-pool-v1'].includes(enc),enc);
assert.equal(stage.metadata.stageId,34);assert.equal(stage.terrains.length,17);
const owners=stage.elements.filter(x=>x.assetId===id);
assert.equal(owners.length,1);const place=owners[0];
assert.deepEqual([place.x,place.y,place.scale,place.rotation,place.layer],[-1536,-256,1,0,'structural-back']);
const old=transport(stock,loc);
const decode=x=>enc==='json-pool-v1'?unpackJson(x):x, encode=x=>enc==='json-pool-v1'?packJson(x):x;
const arr=decode(old.raw);assert.equal(arr.filter(x=>x.id===id).length,1);
const ix=arr.findIndex(x=>x.id===id),a=arr[ix],v=a.vector;
assert.equal(sha(JSON.stringify(a)),expectedAssetSha,'Canonical built Stage34 asset is not the approved underlying source');
assert.deepEqual(a.collision,[]);assert.equal(a.params.sourceSha256,expectedSource);
assert.deepEqual(v.root.transform,[6,0,0,6,0,0]);
assert.deepEqual(v.viewBox,[0,0,9216,6144]);assert.deepEqual(Object.keys(v.clips),['source-alpha-silhouette']);
const keys=['s34-pad-bottom','s34-pad-right','s34-pad-upper'];
const clip=JSON.parse(fs.readFileSync(path.join(tooling,'clips.json')));assert.deepEqual(Object.keys(clip),keys);
const next=structuredClone(arr); const q=next[ix].vector;
q.clips={...q.clips,...clip};q.root.children=keys.reduceRight((children,clipPath)=>[{tag:'g',clipPath,children}],q.root.children);
const restore=structuredClone(next);
const w=restore[ix].vector;for (const k of keys){
 assert.equal(w.root.children.length,1);const n=w.root.children[0];assert.equal(n.clipPath,k);assert.deepEqual(Object.keys(n),['tag','clipPath','children']);
 delete w.clips[k];w.root.children=n.children;
}
assert.deepEqual(restore,arr);
if(process.env.VECTOR_LIB){await import(pathToFileURL(path.resolve(process.env.VECTOR_LIB)));assert.deepEqual(globalThis.HonroVectorArt.validate(q),[]);}
const wire=J(encode(next)),changes=[];
assert.deepEqual(decode(JSON.parse(wire)),next);
function rebind(n,data){
 const orig=read(stock,n),old=read(trial,n),tmp=path.join(trial,n+'.s34temp');
 assert(orig.equals(old)&&!orig.equals(data),n);
 fs.writeFileSync(tmp,data,{flag:'wx'});fs.renameSync(tmp,path.join(trial,n));
 assert(read(stock,n).equals(orig));
 changes.push({path:n,beforeSha256:sha(orig),afterSha256:sha(data)});
}
if(!old.blobs)rebind(loc,wire);
else{
 const n=old.blobs.length,max=4*1024*1024;assert(wire.length<=n*max&&wire.length>=n);
 let z=0;
 const parts=old.blobs.map((x,i)=>{const u=wire.subarray(z,z+Math.ceil((wire.length-z)/(n-i)));z+=u.length;rebind(x.path,u);return {path:x.path,bytes:u.length,sha256:sha(u)};});
 assert.equal(z,wire.length);rebind(loc,J({$honroJsonParts:1,bytes:z,sha256:sha(wire),parts}));
}
assert.deepEqual(decode(transport(trial,loc).raw),next);
const unchanged=['HONRO.html','web/manifest.json',manifest.project,stPath,...[cp.compatibility34].filter(x=>typeof x==='string')];
for(const p of unchanged)assert(fs.readFileSync(path.join(stock,p)).equals(fs.readFileSync(path.join(trial,p))),p);
fs.writeFileSync(path.join(out,'asset-contract.json'),JSON.stringify({id,loc,stPath,enc,oldAssetSha:expectedAssetSha,newAssetSha:sha(JSON.stringify(next[ix])),stageSha:sha(JSON.stringify(stage)),sourceSha:expectedSource,place,keys,changes,unchanged,stockHashPinsUnaltered:true,trialHostedOnly:true,packetSha:sha(wire)},null,2));
