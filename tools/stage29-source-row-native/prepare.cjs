'use strict';
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto'),path=require('path');
const A='shared/assets/environment/act3-handoff/stage29-west-bank.json';
const O='shared/data/terrain-path-optimization.json';
const F='act3-handoff:29:west-bank';
const gitA='1da644b12cbb7c09f9e8b7411b6e2f30793163b1',gitO='1baa483bec04bc905d419cd36dbe803335a7e037';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'), json=x=>JSON.stringify(x);
const blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const fact=b=>({sha256:sha(b),git:blob(b),bytes:b.length});
const source=fs.readFileSync(__dirname+'/original/stage29-west-bank.json'), planes=JSON.parse(fs.readFileSync(__dirname+'/planes.json'));
function exactly(text,from,to){assert(from!==to&&text.indexOf(from)>=0&&text.indexOf(from)===text.lastIndexOf(from),from);return text.replace(from,()=>to);}
function leaf(asset){return asset.vector.root.children[0].children[0].children}
const original=JSON.parse(source);
assert.equal(blob(source),gitA);assert.equal(original.id,F);assert.deepEqual(original.collision,[]);
assert.equal(planes.length,6);assert.equal(leaf(original).length,10);
const bounds={x:-500,y:2220,w:4650,h:1280};
const rail=[-500*205/1150,661.609375,-500,2611.1328125];
const support={terrain:'a3-foundation',drawRange:[-500,2611.1328125,0,3370],unchangedOriginalRim:true};
const group={tag:'g',transform:[205/1150,0,0,1/3.5,0,-295.5/3.5],children:planes.map(([n,fill,d])=>({tag:'path',d,fill,stroke:'none',fillRule:'nonzero'}))};
assert.equal(group.children.length,6);
let body=source.toString('utf8');
body=exactly(body,'"bounds":'+json(original.bounds)+',"reference"','"bounds":'+json(bounds)+',"reference"');
body=exactly(body,'"nodeCount":13','"nodeCount":20');
body=exactly(body,'"contactMapping":'+json(original.params.contactMapping),'"contactMapping":'+json([rail,...original.params.contactMapping]));
const end=']}]}]}}}',at=body.lastIndexOf(end);assert(at>0&&/^\s*$/.test(body.slice(at+end.length)));
body=body.slice(0,at)+','+json(group)+body.slice(at);
const text=Buffer.from(body);const final=JSON.parse(text),undo=structuredClone(final);
assert.deepEqual(leaf(undo).pop(),group);
assert.deepEqual(undo.params.contactMapping.shift(),rail);
undo.params.nodeCount=13;undo.bounds=original.bounds;assert.deepEqual(undo,original);
const fp=s=>[sha(json(s.vector)),sha(json(s.params.contactMapping))];const prev=fp(original),next=fp(final);
assert.deepEqual(prev,['79c64b1a7349057a972fd777ea221c7671e2f74996dd7689d84fb588ba49353d','bee57f6a90ee99e687f4a546b60528857c188929b7f2c2e56f41e21adda67bc6']);
const receipt={sourcePath:A,asset:F,registryPath:O,stockSource:fact(source),candidateSource:fact(text),originalRegistryGit:gitO,
 originalFingerprint:{raw:prev[0],mapping:prev[1]},newFingerprint:{raw:next[0],mapping:next[1]},support,planes:planes.map(v=>v[0]),
 newAnchor:rail,untouchedPhysicsAndSourceOutsideTheFourLexicalTokens:true};
function registry(raw,liveCompiled,expectedBlob=gitO) {
 assert.equal(blob(raw),expectedBlob);const src=raw.toString(), entries=JSON.parse(src), got=entries.filter(x=>x.id===F);
 assert.equal(got.length,1);const e=got[0];assert.deepEqual([e.original,e.contactMapping],prev);
 const cmp=structuredClone(original.vector);assert.equal(e.paths.length,10);
 const keys=e.paths.map(([loc,key,value])=>{
  let n=loc.reduce((a,i)=>a[i],cmp);assert.equal(n.tag,'path');assert.equal(key,'d');assert.notEqual(n[key],value);n[key]=value;
  return json(loc);
 });
 assert.equal(new Set(keys).size,10);
 assert.deepEqual(cmp,liveCompiled.vector);
 // Exact lexical two hash substitutions, preserves all optimization programs.
 let b=exactly(src,prev[0],next[0]); b=exactly(b,prev[1],next[1]);
 const edit=JSON.parse(b),norm=structuredClone(edit);
 const f=norm.find(x=>x.id===F);assert.deepEqual([f.original,f.contactMapping],next);
 f.original=prev[0];f.contactMapping=prev[1];assert.deepEqual(norm,entries);
 const optimizedNew=structuredClone(final.vector);
 for(const [loc,key,value]of e.paths)loc.reduce((a,i)=>a[i],optimizedNew)[key]=value;
 const test={vector:structuredClone(optimizedNew)};assert.deepEqual(leaf(test).pop(),group);assert.deepEqual(test.vector,liveCompiled.vector);
 assert(Buffer.byteLength(json(optimizedNew))<Buffer.byteLength(json(final.vector)));
 return {bytes:Buffer.from(b),proof:{optimizedOldSHA:sha(json(cmp)),optimizedNewSHA:sha(json(optimizedNew)),stock:fact(raw),candidate:fact(Buffer.from(b)),pathsSHA:sha(json(e.paths)),changedOnlyStage29OriginalAndContactMapping:true}};
}
if(require.main===module){
 const [mode,root,packetPath]=process.argv.slice(2);
 if(mode==='source') {
  fs.writeFileSync(__dirname+'/candidate/stage29-west-bank.json',text);
  fs.writeFileSync(__dirname+'/SOURCE-RECEIPT.json',JSON.stringify(receipt,null,2)+'\n');
 }else if(mode==='apply'){
  assert(root&&packetPath);
  const existing=fs.readFileSync(path.join(root,A));assert(existing.equals(source));
  const ab=fs.readFileSync(packetPath);assert(sha(ab)==='03bec5fbcabe5e353cb2eaf8f6437c8e7bdfad224fd3e29ed076600d70207357');
  const liveCompiled=JSON.parse(ab).find(x=>x.id===F);
  const o=fs.readFileSync(path.join(root,O));const d=registry(o,liveCompiled);
  fs.writeFileSync(path.join(root,A),text);fs.writeFileSync(path.join(root,O),d.bytes);
  process.stdout.write(JSON.stringify({...receipt,registryProof:d.proof},null,2)+'\n');
 }else throw Error('read-only scratch apply mode required');
}
module.exports={registry,original,final,text,source,receipt};
