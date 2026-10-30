import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const baseline='16193a1f909483b2f4d56843ae8f3e9c7abd5931',hash=b=>createHash('sha256').update(b).digest('hex');
const read=(p,old=false)=>old?execFileSync('git',['show',`${baseline}:${p}`],{maxBuffer:64*1024*1024}):fs.readFileSync(p),json=(p,old)=>JSON.parse(read(p,old));
const before=json('web/manifest.json',true),after=json('web/manifest.json');
const binary=f=>/^web\/(graphics|fonts)\//.test(f.path),key=f=>f.path.split('/')[1]+'|'+f.path.split('.').at(-1)+'|'+f.sha256;
const groups=m=>{const g=new Map();for(const f of m.files.filter(binary)){const k=key(f);if(!g.has(k))g.set(k,[]);g.get(k).push(f);}return g;};
const oldGroups=groups(before),newGroups=groups(after);assert.deepEqual([...newGroups.keys()].sort(),[...oldGroups.keys()].sort());
for(const [k,files]of newGroups){assert.equal(files.length,1,'one current file per identical binary');const f=files[0];assert.equal(hash(read(f.path)),f.sha256);assert(read(f.path).equals(read(oldGroups.get(k)[0].path,true)));}
const oldRecords=new Map(before.files.map(f=>[f.path,f])),newRecords=new Map(after.files.map(f=>[f.path,f]));
// Resolve asset aliases to full verified byte digests, not potentially different
// semantic filenames. Other file-reference fields remain exact.
function normalized(v,old){if(typeof v==='string'&&/^web\/(graphics|fonts)\//.test(v)){const f=(old?oldRecords:newRecords).get(v);assert(f,'referenced binary belongs to current graph');return {$binary:key(f)};}if(Array.isArray(v))return v.map(x=>normalized(x,old));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,normalized(x,old)]));return v;}
const stem=p=>p.replace(/\.[a-f0-9]{16}\.json$/,'.json'),newData=new Map(after.files.filter(f=>f.path.startsWith('web/data/')).map(f=>[stem(f.path),f]));let comparedJSON=0;
for(const f of before.files.filter(f=>f.path.startsWith('web/data/'))){const n=newData.get(stem(f.path));assert(n,'same logical JSON packet');if(f.path===before.project)continue;assert.equal(hash(JSON.stringify(normalized(json(f.path,true),true))),hash(JSON.stringify(normalized(json(n.path),false))),f.path);comparedJSON++;}
const bytes=m=>m.files.reduce((s,f)=>s+f.bytes,0),binaryBytes=m=>m.files.filter(binary).reduce((s,f)=>s+f.bytes,0),duplicateBytes=g=>[...g.values()].reduce((s,a)=>s+a[0].bytes*(a.length-1),0);
const report={status:'pass',baseline,comparedJSON,binaryGroups:newGroups.size,beforeCurrentGraph:bytes(before),afterCurrentGraph:bytes(after),beforeBinaryBytes:binaryBytes(before),afterBinaryBytes:binaryBytes(after),removedExactDuplicateBytes:duplicateBytes(oldGroups),remainingCurrentDuplicateBytes:duplicateBytes(newGroups),scope:'Current graph only; byte-identical graphics/fonts aliases, no module or JSON deduplication. Old published URLs follow existing retention.'};fs.writeFileSync('tools/size-qa/binary-reuse-proof.json',JSON.stringify(report,null,2)+'\n');console.log(report);
