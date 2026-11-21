import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const load=async x=>JSON.parse(await readFile(new URL(x,import.meta.url),'utf8'));
const R=await load('RECIPE.json'),P=await load('PINS.json'),Q=R.proof;
const sha=b=>createHash('sha256').update(b).digest('hex'), dig=j=>sha(JSON.stringify(j));
const git=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
export const source='shared/data/act4/sideview-art/33-coastal-v2.json';
export const lowID='act4-sideview:33:coastal-v2:lowland',deepID='act4-sideview:33:coastal-v2:lowland-deep-strata';
assert.deepEqual(Q,P.proof);assert.deepEqual(Q.scope,{x0:-3240,x1:10630,y0:4800,y1:5950});
export function author(old){
 assert.equal(git(old),Q.stockGit);assert.equal(sha(old),Q.stockSHA);
 const pack=JSON.parse(old),stock=pack.assets[4],low=structuredClone(stock);
 assert.equal(stock.id,lowID);assert.equal(dig(stock),Q.oldLowSHA);
 assert.equal(dig(low.vector.clips),Q.clipSHA);
 const leaves=low.vector.root.children[0].children[0].children;
 assert.equal(leaves.length,12);assert.equal(R.specs.length,12);assert.equal(R.split.length,12);
 for(let i=0;i<12;i++){
  const {old,layer,new:repl}=R.specs[i], n=leaves[i], lengths=R.split[i];
  assert.equal(i,layer);const oldParts=n.d?[n.d]:n.dParts;
  assert.equal(oldParts.filter(x=>x.includes(old)).length,1);
  const found=oldParts.find(x=>x.includes(old));assert.equal(found.split(old).length,2);
  const fused=oldParts.map(x=>x.replace(old,repl)).join(' ');
  if(n.d){assert.equal(lengths,null);n.d=fused;}
  else{
   let k=0;n.dParts=lengths.map(len=>{const p=fused.slice(k,k+len);assert.equal(p.length,len);k+=len;if(k<fused.length){assert.equal(fused[k],' ');k++;}return p});
   assert.equal(k,fused.length);assert.equal(n.dParts.join(' '),fused);
  }
 }
 assert.equal(R.inner.length,14);leaves.push(...R.inner);
 assert.equal(dig(low),Q.lowSHA);assert.equal(dig(low.vector),Q.lowVectorSHA);
 const leaf=R.deep,bounds=leaf.bounds;
 const deep={id:deepID,name:'Stage33 southern submerged strata',category:stock.category,visual:[],collision:[],sockets:[],anchor:leaf.anchor,bounds,
  reference:{bounds,foot:{x:0,y:bounds.y+bounds.h},heightM:bounds.h/60,scaleRange:stock.reference.scaleRange,backgroundRange:stock.reference.backgroundRange},
  params:{semanticLayer:'BODY',nativeSemanticPartition:'lowland-deep-strata',sourceViewBox:leaf.vector.viewBox,collisionSource:'unchanged stage33'},
  vector:leaf.vector};
 assert.equal(dig(deep),Q.deepSHA);assert.equal(dig(deep.vector),Q.deepVectorSHA);
 const target={...pack,assets:[...pack.assets.slice(0,4),deep,low,...pack.assets.slice(5)]};
 const bytes=Buffer.from(JSON.stringify(target,null,2)+'\n');
 assert.equal(bytes.length,Q.targetBytes);assert.equal(sha(bytes),Q.targetSHA);assert.equal(git(bytes),Q.targetGit);
 return {bytes,low,deep,stock};
}
async function wire(w,path0,path1,map0,map1){
 const r=author(await readFile(join(w,'A',source)));
 const cases=await Promise.all([[path0,path1],[map0,map1]].flatMap(([p,q])=>[readFile(join(w,'A',p)),readFile(join(w,'B',q))]));
 const [a,b,m,n]=cases.map(x=>JSON.parse(x));
 assert.equal(a.length,15);assert.equal(b.length,16);
 const i=a.findIndex(x=>x.id===lowID),j=m.elements.findIndex(x=>x.id===lowID);
 assert(i>=0&&j>=0);assert.equal(dig(a[i]),Q.oldLowSHA);
 const item={id:deepID,assetId:deepID,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',nativeArtLayer:'surface',layer:'mid'};
 assert.deepEqual(b,[...a.slice(0,i),r.deep,r.low,...a.slice(i+1)]);
 assert.deepEqual(n,{...m,elements:[...m.elements.slice(0,j),item,...m.elements.slice(j)]});
 const f=x=>({bytes:x.length,sha256:sha(x)});
 for(const [x,k]of [[cases[0],'oldPack'],[cases[1],'newPack'],[cases[2],'oldMap'],[cases[3],'newMap']])assert.deepEqual(f(x),P[k]);
 console.log(JSON.stringify({maps:[f(cases[2]),f(cases[3])],packets:[f(cases[0]),f(cases[1])],ownerCounts:[15,16],onlyExtraMapElement:item,otherPhysicsAndDataExact:true}));
}
if(process.argv[2]==='write'){
 const w=process.argv[3],p=join(w,'B',source),r=author(await readFile(p));
 await writeFile(p,r.bytes);await writeFile(join(w,'out','CANDIDATE-SOURCE.json'),JSON.stringify({path:source,...Q},null,2)+'\n',{flag:'wx'});
}else if(process.argv[2]==='wire'){
 await wire(...process.argv.slice(3));
}else if(process.argv[2]==='probe'){
 const r=author(await readFile(process.argv[3]));assert.deepEqual(r.bytes,await readFile(process.argv[4]));
 console.log('Exact 26 KB recipe reproduces the first immutable-clip source byte-for-byte.');
}
