import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {gzipSync} from 'node:zlib';
const [w,pp]=process.argv.slice(2),P=JSON.parse(fs.readFileSync(pp)),F=P.fixture,A=path.join(w,'A'),B=path.join(w,'B'),C=path.join(w,'C');
const {packJson,unpackJson}=await import(pathToFileURL(path.join(B,'shared/json-pool.mjs')).href);
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
const owner='shared/assets/environment/act5/stage46-exterior-part-3.json', old=r(A,owner), base=r(B,owner);
assert.deepEqual(fp(old),F.sources[owner].C);assert.deepEqual(fp(base),F.sources[owner].A);
const p=bb[0];assert.equal(str(p.shaftExteriorParts[2]),str(JSON.parse(base)));assert.equal(str(aa[0].shaftExteriorParts[2]),str(JSON.parse(old)));
assert.equal(str(JSON.parse(base).vector.clips),str(JSON.parse(old).vector.clips));assert.equal(str(JSON.parse(base).collision),str(JSON.parse(old).collision));
p.shaftExteriorParts[2]=JSON.parse(old);
const c=Buffer.from(str(bb)+'\n'),pooled=Buffer.from(str(packJson(bb)));
assert.deepEqual(fp(c),F.exactCCompiled);assert.equal(str(bb),c.subarray(0,c.length-1).toString());
const plain=c.subarray(0,c.length-1);
assert(!(plain.length-pooled.length>=1024&&pooled.length<=plain.length*.95&&gzipSync(pooled).length<=gzipSync(plain).length*.98),'unanticipated official encoding choice');
fs.writeFileSync(path.join(C,owner),old);
let start=0;
for(const e of F.parts){const v=c.subarray(start,start+e.bytes);assert.equal(sha(v),e.sha256);assert.equal(v.length,e.bytes);fs.writeFileSync(path.join(C,e.path),v);start+=e.bytes;}
assert.equal(start,c.length);
const d=Buffer.from(str({$honroJsonParts:1,bytes:c.length,sha256:sha(c),parts:F.parts})+'\n');
for(const k of ['bytes','sha256','git'])assert.equal(fp(d)[k],F.candidateDescriptor[k]);
fs.writeFileSync(path.join(C,F.candidateDescriptor.path),d);
