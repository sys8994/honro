'use strict';
const fs=require('fs'),path=require('path'),A=require('node:assert/strict'),C=require('crypto');
const hash=x=>C.createHash('sha256').update(x).digest('hex');
const pin=JSON.parse(fs.readFileSync(path.join(__dirname,'remove.json'),'utf8'));
const leaf=o=>o.vector.root.children[1].children[0].children[0].children[0].children;
function apply(original){
  A.equal(hash(original),pin.stock);
  A.equal(original.length,pin.baseBytes);
  const S=JSON.parse(original), old=leaf(S);let bytes=original.toString(), n=0,endpoints=0;
  const T=structuredClone(S), next=leaf(T);
  A.deepEqual(Object.keys(pin.nodes),['22','23']);
  for(const [j,w] of Object.entries(pin.nodes)){
    let i=0,seen=0;
    const before=JSON.stringify(old[j].dParts);
    A.equal(hash(before),w.old);
    const find=new Map(w.removed.map(r=>[r.i,r]));A.equal(find.size,w.removed.length);
    next[j].dParts=old[j].dParts.map((d,k)=>{
      const rs=d.match(/M[^M]+/g)||[];A.equal(rs.join(''),d);
      return rs.filter(r=>{
        const f=find.get(i++);if(!f)return true;
        A.equal(f.part,k);A.equal(f.b,Buffer.byteLength(r));A.equal(hash(r),f.sha256);
        // Close command and endpoint count locked independently from the allowlist generator.
        A.match(r.trim(),/^M.+[zZ]$/);const coord=t=>Array.from(t.matchAll(/-?(?:\d+\.?\d*|\.\d+)/g),a=>Number(a[0]));
        const seq=[...r.matchAll(/([MLCQZ])([^MLCQZ]*)/g)];A.equal(seq.map(a=>a[0]).join(''),r);
        let start=null,last=null,N=0;for(const [,cmd,str] of seq){const a=coord(str);if(cmd==='M'){A.equal(a.length,2);start=last=a;continue;}
          if(cmd==='Z'){A.equal(a.length,0);if(start[0]!==last[0]||start[1]!==last[1])N++;continue;}
          const arity={L:2,C:6,Q:4}[cmd];A.ok(a.length>=arity&&a.length%arity===0);N+=a.length/arity;last=a.slice(-2);
        } A.equal(N,f.endpoints);
        seen++;n++;endpoints+=N;return false;
      }).join('');
    });
    A.equal(seen,find.size);A.ok(next[j].dParts.every(Boolean));
    const after=JSON.stringify(next[j].dParts);A.equal(hash(after),w.next);
    A.equal(bytes.split(before).length,2);bytes=bytes.replace(before,after);
  }
  A.equal(n,95);A.equal(endpoints,483);A.equal(Buffer.byteLength(bytes),pin.targetBytes);A.equal(hash(bytes),pin.target);
  A.deepEqual(JSON.parse(bytes),T);
  for(const j of Object.keys(pin.nodes))next[j].dParts=old[j].dParts;
  // Exact graph, all original other paths, metadata, all root order/alpha/protected clips, both new west paths.
  A.deepEqual(T,S);
  const prior=pin.prior.exactInsertion;
  const [lo,hi]=prior.diagnosticByteOffsets,whole=Buffer.from(bytes);
  A.equal(hash(whole.subarray(lo,hi)),prior.insertSHA256);
  A.equal(hash(Buffer.concat([whole.subarray(0,lo),whole.subarray(hi)])),pin.prior.sha);
  return bytes;
}
if(require.main===module){
 const [tree,check]=process.argv.slice(2);
 const p=path.join(tree,'shared/assets/environment/act5/stage42-registered-body.json');
 const original=fs.readFileSync(p);
 const bytes=apply(original);
 if(check!=='--check-only')fs.writeFileSync(p,bytes);
 console.log(JSON.stringify({stock:pin.stock,target:pin.target,stockBytes:original.length,targetBytes:Buffer.byteLength(bytes),rings:95,endpoints:483,onlyDPartsLeaf:[22,23],independentRestorationEqual:true}));
}
module.exports={apply};
