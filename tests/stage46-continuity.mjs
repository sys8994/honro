import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import fs from 'node:fs';import vm from 'node:vm';import{makeAct5}from'../shared/act5-world.mjs';
const g={};vm.runInNewContext(fs.readFileSync('shared/map/bounds.js','utf8'),g);vm.runInNewContext(fs.readFileSync('shared/map/vector-art.js','utf8'),g);
const p=await makeAct5(),a=p.library.find(x=>x.id==='act5:near:46'),s=p.stages.find(x=>x.metadata.stageId===46),b=a.shaftExterior.bounds,z=4;
assert.deepEqual(a.shaftExterior.collision,[]);assert.equal(a.vector.viewBox[2],1024);assert.equal(a.vector.viewBox[3],1536);assert.equal(g.HonroVectorArt.validate(a.shaftExterior.vector).length,0);assert.equal(g.HonroVectorArt.validate({...a.vector,clips:{...a.vector.clips,...a.shaftProtected}}).length,0);
const rows=[];for(const[w,h]of[[1440,900],[2560,1440],[390,844],[360,800],[412,915]]){const v=g.HonroBounds.visual({width:4096,height:6504},w,h),cover={left:b.x*z,right:(b.x+b.w)*z,bottom:(b.y+b.h)*z};assert(cover.left<=v.left&&cover.right>=v.right&&cover.bottom>=v.bottom,`${w}x${h} coverage`);rows.push({w,h,visual:v,cover});}
fs.mkdirSync('_local/stage46',{recursive:true});fs.writeFileSync('_local/stage46/coverage.json',JSON.stringify(rows,null,2));console.log('PASS: stage46 vector/clip budgets, no art collision, five min-zoom/focus camera envelopes');

// Protect authored gameplay/source packages independently from artwork masks.
const protectedFiles=[];
protectedFiles.push(['shared/assets/environment/act5/near-import.json','5c667b2f7af9a071f2c2be997ebeb3933a586edcca42ffb8c5dde10ed06a9a93']);
protectedFiles.push(['shared/data/act5/terrain.mjs','de08e7f9a61713b19ad4a6ffad9eb9f5a2a0255d4f59a712811aa580673d3bd3']);
protectedFiles.push(['shared/data/act5/chapters.mjs','ab28fc1867b96b6ac8e0852c910810d90224d033ad37085281d83507240aa9c5']);
protectedFiles.push(['shared/data/act5/combat.mjs','02604c65cc6037cb2ff105655b6d217263b88771ccc2753c7a88892d871dd994']);
for(const[file,hash]of protectedFiles)assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,`Authored input changed: ${file}`);
console.log('PASS: canonical source, contacts, chapters and combat byte-identical');

for(const local of a.shaftExteriorParts||[]){assert.deepEqual(local.collision,[]);assert.equal(g.HonroVectorArt.validate(local.vector).length,0,local.id);const q=local.bounds;assert(q.x>=b.x&&q.y>=b.y&&q.x+q.w<=b.x+b.w&&q.y+q.h<=b.y+b.h,'Local contained in exterior culling bounds');}
console.log('PASS: local continuation native vectors and bounds');
assert.equal(a.shaftExteriorParts.length,5);
for(const part of a.shaftExteriorParts)assert.deepEqual(part.vector.clips['native-source-alpha'],a.shaftExterior.vector.clips['native-source-alpha'],'One canonical alpha across six native partitions');
assert.deepEqual(a.shaftTree.collision,[]);assert.equal(g.HonroVectorArt.validate(a.shaftTree.vector).length,0);
assert(a.shaftTree.bounds.x<0,'Western tree continuation exists');
console.log('PASS: six native partitions share canonical alpha; native tree completion within vector budget');
