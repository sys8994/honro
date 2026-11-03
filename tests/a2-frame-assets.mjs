import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {buildA2Frames,validateA2Frames,parseCanonicalSvg,countPath} from '../tools/monster-forge/build-a2-frames.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'shared/assets/monsters/a2-selected');
const result=await buildA2Frames({write:false});
assert.equal(result.frames.length,16);assert.equal(result.totalSvgBytes,489358);assert.equal(result.global350AnchorGateUnchanged,true);
const context={};vm.runInNewContext(result.runtime,context);const pack=context.HONRO_MONSTER_FRAMES;
assert.equal(Object.keys(pack.assets).length,16);assert.equal(pack.baseHeight,128);
assert.equal(Object.keys(pack.assets).filter(x=>/^munyeo-(?!flat-)/.test(x)).length,0,'textured candidates must never ship');
for(const a of Object.values(pack.assets)){assert.equal(a.parts.length,1);assert.equal(a.parts[0].id,'root');assert.equal(a.baseHeight,128);assert.deepEqual(Array.from(a.parts[0].pivot),[0,0]);assert.equal(a.clips.idle.tracks.length,0);}
assert.equal(await readFile(path.join(source,'frames.runtime.js'),'utf8'),result.runtime,'generated pack stale');
assert.throws(()=>countPath('M0 0A2 2 0 0 0 3 4'),/unsupported/);
assert.throws(()=>countPath('M0 0C1 2'),/arity/);
assert.throws(()=>parseCanonicalSvg('<svg><image href="a.png"/></svg>'),/root/);
const tmp=await mkdtemp(path.join(os.tmpdir(),'honro-a2-frames-'));
try{
 const dir=path.join(tmp,'frames');await cp(source,dir,{recursive:true});const file=path.join(dir,'manifest.json');const original=await readFile(file,'utf8');
 const mutate=async f=>{const m=JSON.parse(original);f(m);await writeFile(file,JSON.stringify(m));await assert.rejects(()=>validateA2Frames(dir));await writeFile(file,original);};
 await mutate(m=>m.assets.push({...m.assets[0],id:'new-monster'}));
 await mutate(m=>m.assets.pop());
 await mutate(m=>m.assets[0].sha256='0'.repeat(64));
 await mutate(m=>m.assets[0].file='../ghost.svg');
 await mutate(m=>m.assets[0].anchors=1);
 await mutate(m=>m.assets[0].footPivot=[1,0]);
 await mutate(m=>m.baseHeight=64);
 await mutate(m=>m.poseMaps.eoduksini['1'].idle=m.poseMaps.eoduksini['3'].idle);
 await mutate(m=>m.assets[0].damageGeometry={r:20});
 const m=JSON.parse(original),svg=path.join(dir,m.assets[0].file);await writeFile(svg,(await readFile(svg,'utf8')).replace('fill="','stroke="'));
 await assert.rejects(()=>validateA2Frames(dir),/source hash/);
}finally{await rm(tmp,{recursive:true,force:true});}
console.log('PASS selected16 exact hashes, 489358-byte budget, coordinate/pose contract, runtime parity, no hi-fi, fail-closed mutations. Live-stage acceptance remains separate.');
