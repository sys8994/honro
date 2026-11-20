import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const [base,qa,out]=process.argv.slice(2),packet='web/data/chapter-30-assets.99a6cc921e7e09ae.json';
const rows=JSON.parse(fs.readFileSync(path.join(base,packet),'utf8')),z=rows.findIndex(v=>v.id==='stage30:ferry-distant-channel');assert(z>=0);
const old=rows[z],v=structuredClone(old);assert.deepEqual(old.collision,[]);assert.equal(v.vector.root.tag,'g');assert.equal(v.vector.root.children.length,3);
for(const n of v.vector.root.children){assert.equal(n.tag,'path');assert.equal(n.opacity,undefined);n.opacity=0;}
const restored=structuredClone(v);for(const n of restored.vector.root.children)delete n.opacity;assert.deepEqual(restored,old);
const dest=path.join(qa,packet);fs.writeFileSync(dest+'.temp',JSON.stringify(rows.map((a,i)=>i===z?v:a)));fs.renameSync(dest+'.temp',dest);
const next=JSON.parse(fs.readFileSync(dest,'utf8'));assert.equal(next.length,rows.length);for(let i=0;i<rows.length;i++)if(i!==z)assert.deepEqual(next[i],rows[i]);
fs.writeFileSync(path.join(out,'asset-contract.json'),JSON.stringify({changedPacket:packet,changedAsset:old.id,onlyAssetIndex:z,onlyChangedFields:['vector.root.children[0].opacity','vector.root.children[1].opacity','vector.root.children[2].opacity'],diagnosticValue:0,allPathsAndObjectRetained:true,allOtherAssetFieldsExact:true,collisionEmpty:true,assetCount:rows.length,originalAssetSha256:crypto.createHash('sha256').update(JSON.stringify(old)).digest('hex')},null,2));
