import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const dir=path.dirname(new URL(import.meta.url).pathname);
const bytes=(file)=>fs.readFileSync(file),sha=(b)=>crypto.createHash('sha256').update(b).digest('hex'),
  blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const cfg=JSON.parse(bytes(path.join(dir,'PINS.json')));
const sourceAsset='shared/assets/environment/act5/stage44-west-depth-r9.json',p0='shared/act5-world.mjs',p1='shared/runtime/act5-edge-art.js',key='rootWestDepthR9';
function once(s,a,b){assert.equal(s.split(a).length,2,a.slice(0,95));const q=s.replace(a,b);assert.equal(q.replace(b,a),s);return q;}
function apply(root){
 const asset=bytes(path.join(dir,'asset.json')), helper=bytes(path.join(dir,'adapter.js'));assert.equal(sha(asset),cfg.new.sourceAssetSHA256);assert.equal(sha(helper),cfg.new.helperSHA256);
 const a=JSON.parse(asset);assert.equal(a.id,'act5:stage44:west-buttress-r9');
 assert(a.collision.length===0&&a.sockets.length===0&&a.anchor.x===0&&a.anchor.y===0);
 assert(a.vector.root.children.length===13&&a.vector.root.clipPath==='r9-shared-envelope'&&a.vector.clips['r9-shared-envelope'].length===1);
 const src0=bytes(path.join(root,p0)),src1=bytes(path.join(root,p1));
 assert.equal(blob(src0),cfg.stock.authorGit);assert.equal(blob(src1),cfg.stock.edgeGit);
 assert(!fs.existsSync(path.join(root,sourceAsset)));
 const insert=" const stage44Roots=JSON.parse(await readFile(new URL('./assets/environment/act5/stage44-root-exterior.json',import.meta.url),'utf8'));";
 const add=" const stage44WestDepth=JSON.parse(await readFile(new URL('./assets/environment/act5/stage44-west-depth-r9.json',import.meta.url),'utf8'));";
 let out0=once(src0.toString(),insert,insert+'\n'+add);
 out0=once(out0,'...(id===44?{rootExterior:stage44Roots,rootUpperClip:', '...(id===44?{rootExterior:stage44Roots,rootWestDepthR9:stage44WestDepth,rootUpperClip:');
 const junction='const domainPaint=S._drawTerrainDomainTiles;\nS._drawTerrainDomainTiles=function(c,b,w,h){';
 const out1=once(src1.toString(),junction,helper.toString()+'\nconst westDepthR9=prepareR9(G);\n'+junction+'\n westDepthR9.underlay(this,c,b,w,h);');
 fs.writeFileSync(path.join(root,p0),out0);fs.writeFileSync(path.join(root,p1),out1);fs.writeFileSync(path.join(root,sourceAsset),asset);
 const result={canonicalArtOnly:true,sourceChange:{[p0]:blob(Buffer.from(out0)),[p1]:blob(Buffer.from(out1)),[sourceAsset]:blob(asset)},asset:a.id};
 console.log(JSON.stringify(result));
}
function wire(root,aa,bb){
 const A=JSON.parse(bytes(aa)),B=JSON.parse(bytes(bb));const find=(a)=>{for(const q of Array.isArray(a)?a:[...Object.values(a)])if(q&&typeof q==='object'){
  if(q.id==='act5:near:44')return q;
  const n=find(q);if(n)return n;
 }}; import(path.join(root,'shared/json-pool.mjs')).then(({unpackJson})=>{
  const D=cfg.stock.encoding;const sourceA=D==='json-pool-v1'?unpackJson(A):A,sourceB=D==='json-pool-v1'?unpackJson(B):B;
  const a=find(sourceA),b=find(sourceB);assert(a&&b&&!a[key]&&b[key]);const own=b[key];const proto=JSON.parse(bytes(path.join(dir,'asset.json')));
  assert.deepEqual(own,proto);delete b[key];assert.deepEqual(sourceA,sourceB);
  console.log(JSON.stringify({scope:'B stage44 packet only adds one canonical asset field',exactRecoveredPacket:true,newId:own.id,sourceAssetSha:cfg.new.sourceAssetSHA256}));
 });
}
const [mode,root,aa,bb]=process.argv.slice(2); (mode==='wire'?wire:apply)(root,aa,bb);
