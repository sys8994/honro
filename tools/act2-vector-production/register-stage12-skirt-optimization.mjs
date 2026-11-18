import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {extendStage12GroundSkirt} from '../environment/stage12-compact-art.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const pkg=JSON.parse(readFileSync('shared/data/act2/stage12-compact-package.json','utf8'));
const entries=JSON.parse(readFileSync('shared/data/terrain-path-optimization.json','utf8'));
const path='shared/data/terrain-path-registrations.json',prior=JSON.parse(readFileSync(path,'utf8')),ids=[];
const added=[];
for(const asset of pkg.assets.filter(a=>/^act2-compact:stage12-act2-traced-stage12-ground-[12]$/.test(a.id))){
 const core=structuredClone(asset),v=core.vector,key='compact12-ground-tail-source';
 assert(v.symbols[key]);delete v.symbols[key];
 v.root.children=v.root.children.filter(n=>!n.clipPath.endsWith('-tail'));
 for(const k of Object.keys(v.clips))if(k.endsWith('-tail'))delete v.clips[k];
 const entry=entries.find(e=>e.id===asset.id);assert(entry);assert.equal(entry.paths.length,28);
 assert.equal(sha(v),entry.original,'Original compact vector must remain exact');
 for(const [p,k]of entry.paths)assert.deepEqual(p.reduce((v,k)=>v[k],v)[k],p.reduce((v,k)=>v[k],asset.vector)[k]);
 assert.deepEqual(extendStage12GroundSkirt(core),asset,'Generator and final package differ');
 ids.push(asset.id);added.push({id:asset.id,sourceOriginal:entry.original,original:sha(asset.vector)});
}
assert.equal(added.length,2);
writeFileSync(path,JSON.stringify([...prior.filter(r=>!ids.includes(r.id)),...added].sort((a,b)=>a.id.localeCompare(b.id)),null,2)+'\n');
console.log(JSON.stringify({registered:added,optimizedPathsPreserved:28,otherRegistrationsPreserved:true}));
