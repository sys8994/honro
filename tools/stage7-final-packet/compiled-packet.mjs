import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const [stock,off,out,poolFile=path.join(stock||'.','shared/json-pool.mjs')]=process.argv.slice(2).map(x=>path.resolve(x));
assert(stock&&off&&out&&stock!==off&&stock!==out&&off!==out,'Expected separately mounted stock/off/out');
const {packJson,unpackJson}=await import(pathToFileURL(poolFile));
const sha=v=>createHash('sha256').update(v).digest('hex'), J=v=>Buffer.from(JSON.stringify(v)+'\n');
const rootid='act1-site:7:body', ssha='acbffaafb8a346e3c28d039a17f8d1dd1f2f525b1563860727e45d3bf4651193';
const pathGuard=p=>{assert(/^web\/data\/[a-zA-Z0-9._-]+\.(json|bin)$/.test(p)&&!p.includes('..'),'Invalid emitted packet '+p);return p;};
const read=(r,p)=>fs.readFileSync(path.join(r,pathGuard(p)));
function transport(root,name){
 const exact=read(root,name), raw=JSON.parse(exact);
 if(raw.$honroJsonParts!==1)return {name,raw,exact,parts:null};
 assert.deepEqual(Object.keys(raw).sort(),['$honroJsonParts','bytes','parts','sha256']);
 assert(Array.isArray(raw.parts)&&raw.parts.length>1);
 const blobs=raw.parts.map(p=>{const q=read(root,p.path);assert.equal(q.length,p.bytes);assert.equal(sha(q),p.sha256);return q;});
 const joined=Buffer.concat(blobs);assert.equal(joined.length,raw.bytes);assert.equal(sha(joined),raw.sha256);
 return {name,raw:JSON.parse(joined),exact,parts:raw.parts};
}
const generated=JSON.parse(fs.readFileSync(path.join(stock,'web/manifest.json'),'utf8'));
assert.equal(generated.game,'HONRO.html');
const html=fs.readFileSync(path.join(stock,'HONRO.html'),'utf8');
assert(html.includes(generated.gameEntry));
const campaign=transport(stock,generated.project).raw;
assert(campaign.libraryOrder.filter(x=>x===rootid).length===1);
const stagePath=campaign.stages[6],packetPath=campaign.stageLibraries[6], encoding=campaign.assetEncodings.stageLibraries[6];
assert(/^web\/data\/chapter-07[.-][a-f0-9]{16}(?:\.[a-z]+)$/.test(stagePath),stagePath);
assert(/^web\/data\/chapter-07-assets(?:-parts)?\.[a-f0-9]{16}\.json$/.test(packetPath),packetPath);
assert(['json','json-pool-v1'].includes(encoding),encoding);
const stage=transport(stock,stagePath).raw,bundle=transport(stock,packetPath);
assert.equal(stage.id,'stage-7'); assert.equal(stage.metadata.stageId,7);
assert.equal(stage.terrains.length,37); assert.equal(stage.terrains.filter(t=>t.id==='root-floor').length,1);
assert.equal(stage.terrains.find(t=>t.id==='root-floor').floor,5069.18);
assert.deepEqual(stage.terrainBounds,{left:-1200,top:-900,right:5732.24,bottom:5069.18});
const owners=stage.elements.filter(x=>x.assetId===rootid);
assert.deepEqual(owners,[{id:'site-body-7',assetId:rootid,x:0,y:0,scale:3.13,layer:'structural-back',depthLayer:'L1',visualRole:'scenery'}]);
const fromWire=blob=>encoding==='json-pool-v1'?unpackJson(blob):blob;
const toWire=blob=>encoding==='json-pool-v1'?packJson(blob):blob;
const rows=fromWire(bundle.raw);assert(Array.isArray(rows));const ids=rows.map(a=>a.id);
assert(new Set(ids).size===ids.length&&ids.includes(rootid)&&ids.includes('act1-site:7:landmarks'));
const index=ids.indexOf(rootid),original=rows[index];
const v=original.vector,children=v.root.children;
assert.deepEqual(original.collision,[]); assert.equal(original.params.sourceSha256,ssha);
assert.deepEqual(original.bounds,{x:-390,y:0,w:2238,h:1466});
assert.deepEqual(v.viewBox,[-390,0,2238,1466]);assert.equal(v.version,1);
const authoredSource=children[0];assert.deepEqual(authoredSource,{tag:'use',symbol:'source'});
const keep=['source',...Array.from({length:13},(_,i)=>'site-crop-'+i)];
const removable=['site-edge-0','site-edge-1','site-edge-2'];
assert.deepEqual(children.map(n=>n.clipPath||n.symbol),[...keep,...removable]);
const specs=[
 ['M9 908H39V1065H9Z',[-13,0,0,1,126,0]],
 ['M1421 882H1434V1063H1421Z',[-400/13,0,0,1,1834+1421*400/13,0]],
 ['M16 1049H1418V1068H16Z',[1,0,0,20,0,1068-1049*20]]
];
for(const [i,n] of children.slice(14).entries()){
 assert.deepEqual(v.clips[n.clipPath],[specs[i][0]]);
 assert.deepEqual(n,{tag:'g',transform:specs[i][1],clipPath:removable[i],children:[{tag:'use',symbol:'source'}]});
}
const reduced=structuredClone(rows);
reduced[index].vector.root.children.splice(14,3);
const wire=J(toWire(reduced));const dec=fromWire(JSON.parse(wire));
assert.deepEqual(dec,reduced);
const reverse=structuredClone(dec);
reverse[index].vector.root.children.push(...children.slice(14));
assert.deepEqual(reverse,rows,'Difference is not exactly the three effective child values');
const changes=[];
function rewrite(p,bytes){
 const a=read(stock,p),b=read(off,p);assert(a.equals(b),'Isolated copy not clean '+p);
 assert(!a.equals(bytes),'Expected changed packet '+p);
 const dest=path.join(off,p),temp=dest+'.qa-temp';
 fs.writeFileSync(temp,bytes,{flag:'wx'});fs.renameSync(temp,dest);
 assert(read(stock,p).equals(a),'Stock packet changed '+p);
 changes.push({path:p,beforeBytes:a.length,afterBytes:bytes.length,beforeSha256:sha(a),afterSha256:sha(bytes)});
}
if(!bundle.parts)rewrite(packetPath,wire);
else{
 const m=wire.length,n=bundle.parts.length,max=4*1024*1024;
 assert(m>=n&&m<=max*n,'Cannot keep detached split in the same existing part path scope');
 let z=0;
 const parts=bundle.parts.map((p,i)=>{const width=Math.ceil((m-z)/(n-i));const row=wire.subarray(z,z+width);z+=width;rewrite(p.path,row);return {path:p.path,bytes:row.length,sha256:sha(row)};});
 assert.equal(z,m);
 rewrite(packetPath,J({$honroJsonParts:1,bytes:m,sha256:sha(wire),parts}));
}
assert.deepEqual(fromWire(transport(off,packetPath).raw),reduced);
const immutable=['HONRO.html','web/manifest.json',generated.project,stagePath];
for(const p of immutable)assert(fs.readFileSync(path.join(stock,p)).equals(fs.readFileSync(path.join(off,p))),'Different served entry/campaign/stage '+p);
fs.writeFileSync(path.join(out,'asset-contract.json'),JSON.stringify({packetPath,stagePath,encoding,splitParts:bundle.parts?.length||0,changes,immutable,
 exactOnlyChildrenRemoved:removable,observedStockIds:children.map(n=>n.clipPath||n.symbol),
 observedOffIds:keep,bodyId:rootid,bodySha256:sha(J(original)),rawApprovedBodySource:original.params.sourceSha256,bodyClipSha256:sha(J(v.clips)),bodySymbolSha256:sha(J(v.symbols)),
 originalAssetMeta:{bounds:original.bounds,params:original.params,reference:original.reference,collision:original.collision},originalOwner:owners[0],
 exactEffectivePacketTree:true,sourceFilesEverChanged:false,stageTerrainCount:stage.terrains.length},null,2)+'\n');
