import test from 'node:test';
import assert from 'node:assert/strict';
import {ledger,marginEcho} from '../inner-rig/ledger.mjs';
import {daedosa,seal} from '../inner-rig/human-and-seal.mjs';
import {armor} from '../outer-rig/threshold-armor.mjs';

const candidate=[ledger,marginEcho,daedosa,seal,armor];
for (const asset of candidate) test(asset.id+' vector owner/ink/slot stays authored',()=>{
 const unique=new Set();
 let paths=0;
 for(const part of asset.parts){
  assert(!unique.has(part.id));
  if(part.id!=='root')assert(unique.has(part.parent));
  unique.add(part.id);
  assert(part.pivot.length===2 && part.pivot.every(Number.isFinite));
  for(const p of part.paths){
   assert(p.fill in asset.palette);
   assert(!p.stroke || p.stroke in asset.palette);
   assert(/^M\s/.test(p.d));
   paths++;
  }
 }
 assert(paths>=12 && paths<=45);
 assert(asset.baseHeight>=105 && asset.baseHeight<=175);
 for(const clip of Object.values(asset.clips)){
  assert(clip.duration>=1 && clip.duration<4);
  for(const tr of clip.tracks){
   assert(unique.has(tr.part));
   assert(tr.keys.every(([fraction,value],i,a)=>Number.isFinite(value) && fraction>=0 && fraction<=1 && (i===0 || a[i-1][0]<fraction)));
  }
 }
 assert.equal(candidate.filter(a=>a.id===asset.id).length,1);
});
