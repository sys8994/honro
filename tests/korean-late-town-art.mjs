import assert from 'node:assert/strict';
import {koreanRaisedCompound,koreanFoundry,koreanDock} from '../tools/environment/korean-late-town-art.mjs';
const support=[{x:-400,y:380},{x:-120,y:390},{x:130,y:390},{x:400,y:380}];
for(const [name,create] of [['office',()=>koreanRaisedCompound('test-office',{supports:support})],['archive',()=>koreanRaisedCompound('test-archive',{role:'archive',supports:support})],['stone',()=>koreanRaisedCompound('test-stone',{foundation:'masonry',baseDepth:700,supports:support})],['foundry',()=>koreanFoundry('test-foundry',{supports:support})],['dock',()=>koreanDock('test-dock',{supports:support})]]){
 const a=create();assert(a.vector.source.length<60000,name+' source budget');assert(a.collision.length>0);assert.equal(a.oneWay,false,'Drawn structural roofs remain solid');assert.deepEqual(a.vector.viewBox,[a.bounds.x,a.bounds.y,a.bounds.w,a.bounds.h]);for(const poly of a.collision)for(const p of poly){assert(Number.isFinite(p.x)&&Number.isFinite(p.y));assert(p.x>=a.bounds.x&&p.x<=a.bounds.x+a.bounds.w&&p.y>=a.bounds.y&&p.y<=a.bounds.y+a.bounds.h,name+' collider bounds');}
 console.log('PASS',name,(a.vector.source.match(/<path /g)||[]).length,'paths');
}
