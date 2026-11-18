import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
class Path2D {moveTo(){} lineTo(){}}
const g={Path2D,HonroScene:function(){},HONRO_CORE:{poly:t=>t.vertices},HonroTerrainDomain:{render:b=>b.terrain}};
g.globalThis=g;vm.runInNewContext(await readFile(new URL('./fixtures/stage7-readability.js',import.meta.url),'utf8'),g);
const make=(stage=7,id='root-floor',domain=true)=>({honroStage:stage,sceneVersion:1,honroTerrainBounds:{left:-1200,top:-900,right:5700,bottom:5000},terrain:[{id,honroDomain:domain,x:-1200,y:3000,w:6900,h:2000,vertices:[{x:-1200,y:3000},{x:5700,y:3000},{x:5700,y:5000},{x:-1200,y:5000}]}]});
const b=make(),before=JSON.stringify(b),q=g.HonroTerrainReadability.prepare(b);
assert.equal(q.groups.length,1);assert.equal(q.groups[0].segments.length,1);assert(q.groups[0].segments[0].walkable);assert.equal(JSON.stringify(b),before);
for(const x of [make(3),make(7,'other-root'),make(7,'root-floor',false)])assert.equal(g.HonroTerrainReadability.prepare(x).groups[0].segments.length,4);
const interior=make();interior.terrain[0].vertices[1].x=5600;interior.terrain[0].vertices[2].x=5600;assert.equal(g.HonroTerrainReadability.prepare(interior).groups[0].segments.length,2);
const caps=make();caps.terrain=[...caps.terrain,...Array.from({length:13},(_,i)=>({id:'cap-'+i,oneWay:true,x:100+i*100,y:100,w:70,h:20,vertices:[{x:100+i*100,y:100},{x:170+i*100,y:100},{x:170+i*100,y:120},{x:100+i*100,y:120}]}))];
const out=g.HonroTerrainReadability.prepare(caps);assert.equal(out.groups.length,14);assert.equal(out.groups.filter(x=>x.id.startsWith('cap-')).length,13);assert(out.groups.every(x=>x.segments.length===1));
console.log('PASS: only Stage7 authored domain root closure sides/bottom excluded; top,13caps,interior cliffs,other stages,non-domain preserved; battle unchanged');
