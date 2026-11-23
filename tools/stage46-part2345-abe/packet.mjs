import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {gzipSync,gunzipSync} from 'node:zlib';
const [w,pp]=process.argv.slice(2),P=JSON.parse(fs.readFileSync(pp)),F=P.fixture,A=path.join(w,'A'),B=path.join(w,'B'),E=path.join(w,'E');
const {packJson,unpackJson}=await import(pathToFileURL(path.join(B,'shared/json-pool.mjs')).href);
assert.deepEqual(Object.values(F.sources).map(v=>v.index),[2,3,4,5]);
const restored=new Set([1,2,3,4]);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),str=JSON.stringify;
const fp=b=>({bytes:b.length,sha256:sha(b),git:crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex')});
const r=(a,k)=>fs.readFileSync(path.join(a,k));
const readPacket=(root,arm)=>{
 const q=JSON.parse(r(root,P.packs[arm].descriptor)),parts=q.parts.map(e=>{const v=r(root,e.path);assert.equal(v.length,e.bytes);assert.equal(sha(v),e.sha256);return v});
 const raw=Buffer.concat(parts);assert.equal(raw.length,q.bytes);assert.equal(raw.length,P.packs[arm].splitBytes);assert.equal(sha(raw),q.sha256);return raw;
};
const a=readPacket(A,'A'),b=readPacket(B,'B');
assert.deepEqual(fp(a),F.decodedOld);assert.equal(b.length,F.published3cPacket.bytes);assert.equal(sha(b),F.published3cPacket.sha256);
const aa=unpackJson(JSON.parse(a)),bb=JSON.parse(b);assert(Array.isArray(bb)&&bb.length===1&&bb[0].id==='act5:near:46'&&aa[0].id===bb[0].id);assert.equal(str(bb)+'\n',b.toString('utf8'));
const provider=bb[0];assert.equal(provider.shaftExteriorParts.length,5);
const protectedIdentity=str({...provider,shaftExteriorParts:provider.shaftExteriorParts.map((v,i)=>restored.has(i)?null:v)});
for(const [owner,pin] of Object.entries(F.sources)){
 const old=r(A,owner),base=r(B,owner),oi=pin.index-1;
 assert.deepEqual(fp(old),pin.A);assert.deepEqual(fp(base),pin.B);
 assert.deepEqual(fp(Buffer.from(str(provider.shaftExteriorParts[oi]))),pin.Bvalue);
 assert.deepEqual(fp(Buffer.from(str(aa[0].shaftExteriorParts[oi]))),pin.Avalue);
 const paint=JSON.parse(old), previous=JSON.parse(base);
 assert.equal(str(provider.shaftExteriorParts[oi]),str(previous));assert.equal(str(aa[0].shaftExteriorParts[oi]),str(paint));
 for(const k of ['collision','anchor','bounds','viewBox','id'])assert.deepEqual(paint[k],previous[k]);
 for(const k of ['viewBox','clips'])assert.deepEqual(paint.vector[k],previous.vector[k]);
 for(const k of ['clipPath','transform'])assert.deepEqual(paint.vector.root[k],previous.vector.root[k]);
 provider.shaftExteriorParts[oi]=paint;
}
assert.equal(str({...provider,shaftExteriorParts:provider.shaftExteriorParts.map((v,i)=>restored.has(i)?null:v)}),protectedIdentity);
const plain=Buffer.from(str(bb)),pooled=Buffer.from(str(packJson(bb))),c=Buffer.concat([pooled,Buffer.from('\n')]);
assert.deepEqual(unpackJson(JSON.parse(pooled)),bb);
assert.deepEqual(fp(plain),F.encoding.plain.rawNoLF);
assert.deepEqual(fp(pooled),F.encoding.pool.rawNoLF);
assert.deepEqual(fp(c),F.exactECompiled);
let fn=2166136261, ftext=str(provider);for(let i=0;i<ftext.length;i++)fn=Math.imul(fn^ftext.charCodeAt(i),16777619);
assert.equal(ftext.length+':'+(fn>>>0).toString(16),P.Esignature);
const plainGzip=gzipSync(plain,{level:6}),poolGzip=gzipSync(pooled,{level:6});
assert.deepEqual(gunzipSync(plainGzip),plain);
assert.deepEqual(gunzipSync(poolGzip),pooled);
assert(plain.length-pooled.length>=1024&&pooled.length<=plain.length*.95&&poolGzip.length<=plainGzip.length*.98,'unanticipated official encoding choice');
fs.writeFileSync(path.join(w,'out','E-ENCODING.json'),JSON.stringify({
 chosen:'json-pool-v1',packet:fp(c),provider:P.Esignature,gzipConvention:'level6 without trailing LF; per-run gzip bytes may depend on zlib',zlib:process.versions.zlib,
 plain:{raw:fp(plain),gzip:fp(plainGzip)},pool:{raw:fp(pooled),gzip:fp(poolGzip)},
 ratios:{bytes:pooled.length/plain.length,gzip:poolGzip.length/plainGzip.length},independentRoundTripBoth:true,
 oldAProvider:P.oldSig,currentBProvider:P.newSig,retainedCurrentParts:[0,1],restoredHistoricalParts:[2,3,4,5]},null,2)+'\n');
let start=0;
for(const e of F.parts){const v=c.subarray(start,start+e.bytes);assert.equal(sha(v),e.sha256);assert.equal(v.length,e.bytes);fs.writeFileSync(path.join(E,e.path),v);start+=e.bytes;}
assert.equal(start,c.length);
const d=Buffer.from(str({$honroJsonParts:1,bytes:c.length,sha256:sha(c),parts:F.parts})+'\n');
for(const k of ['bytes','sha256','git'])assert.equal(fp(d)[k],F.candidateDescriptor[k]);
fs.writeFileSync(path.join(E,F.candidateDescriptor.path),d);
