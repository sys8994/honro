import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const pkg=JSON.parse(readFileSync('shared/data/act2/stage15-compact-package.json','utf8'));
const entries=JSON.parse(readFileSync('shared/data/terrain-path-optimization.json','utf8'));
const path='shared/data/terrain-path-registrations.json',prior=JSON.parse(readFileSync(path,'utf8'));
const asset=pkg.assets.find(a=>a.id==='act2-compact:stage15-act2-stage15-traced-outer-v1-1');assert(asset);
const entry=entries.find(e=>e.id===asset.id),v=structuredClone(asset.vector);assert(entry);assert.equal(entry.paths.length,4);
assert.equal(entry.original,'a8fbcefb50966a67dbc026d538102928afdd977ba125ac796ef4a87db70b4af4');
assert.deepEqual(v.viewBox,[-5000,-25600,15800,54000]);v.viewBox=[-5000,-2100,15800,8500];
for(const [k,paths]of Object.entries(v.clips))if(k.startsWith('compact15-strip-')){assert(paths[0].includes(' -24002H')&&paths[0].includes('V30002H'));paths[0]=paths[0].replace(' -24002H',' -502H').replace('V30002H','V8002H');}
assert.equal(sha(v),entry.original,'Only compact framing may change; source paths and addresses must remain exact');
for(const [p,k]of entry.paths)assert.deepEqual(p.reduce((v,k)=>v[k],v)[k],p.reduce((v,k)=>v[k],asset.vector)[k]);
const added={id:asset.id,sourceOriginal:entry.original,original:sha(asset.vector)};
writeFileSync(path,JSON.stringify([...prior.filter(r=>r.id!==asset.id),added].sort((a,b)=>a.id.localeCompare(b.id)),null,2)+'\n');
console.log(JSON.stringify({registered:added,optimizedPathsPreserved:4,otherRegistrationsPreserved:true}));
