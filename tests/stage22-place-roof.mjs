/** Compiled Stage22 roof: isolated traversal/ballistics and real App save roundtrip.
 * One setup pose, actors removed to isolate geometry; not normal combat. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {followVerticalRoute} from './vertical-route-helpers.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {vertical22EntryProfile} from './stage22-vertical-entry-helper.mjs';

const id='v22-art-main-document-archive:collision:0',g=await runtime({legacyMaps:false}),rows=[];
const pose=(x,y,surfaceId=id)=>({x,y,surfaceId});
const anchors=[{...pose(2170,2705,'v22-east-register-rise'),jumpTo:{x:2387.99,y:2608.94,support:id,speed:1}},
 {...pose(2387.99,2608.94),jumpTo:{x:2500,y:2491,support:id,speed:1}},pose(2500,2491),pose(2800,2491),
 {...pose(2500,2491),jumpTo:{x:2387.99,y:2608.94,support:id,speed:1}},pose(2387.99,2608.94)];
for(const cls of ['archer','mage','knight','occultist']){
 const q=battlefield(g,22),{b,e}=q,u=e.heroesAlive().find(u=>u.cls===cls),roof=b.terrain.find(t=>t.id===id);
 assert(roof?.oneWay,'Actual campaign compiler supplies one-way roof');
 b.units=[u];b.queue=[u.id];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 Object.assign(u,{x:2170,y:2705,vx:0,vy:0,jumping:false,airborne:false});
 const route=followVerticalRoute(g,q,u,{anchors});assert(route.passed,JSON.stringify(route.failed));
 assert.equal(e.projectileCollision({x:2700,y:2420},{x:2700,y:2570},0,u.id,[],false)?.terrain?.id,id,'Descending shot hits roof');
 assert.equal(e.projectileCollision({x:2700,y:2570},{x:2700,y:2420},0,u.id,[],false),null,'Ascending shot passes roof');
 const before={hp:u.hp,focus:u.focus,move:u.moveLeft};assert(e.drop(u));assert(!e.drop(u),'No repeated drop');
 for(let n=0;n<240;n++)e.tick(g.HONRO_CORE.STEP);
 assert.equal(u.y,2850);assert.equal(e.contactSurface(u.x,u.y-2,u.y+2)?.t.id,'v22-report-crossing');
 assert.deepEqual({hp:u.hp,focus:u.focus,move:u.moveLeft},before,'Drop preserves resources');assert(!u.platformDrop);
 const interior=followVerticalRoute(g,q,u,{anchors:[pose(2387.99,2850,'v22-report-crossing'),pose(2920,2850,'v22-report-crossing'),pose(2390,2850,'v22-report-crossing')]});
 assert(interior.passed,JSON.stringify(interior.failed));rows.push({cls,route,interior,drop:true,projectileBothDirections:true});
}
const h=await appHarness(),saveRows=[];
for(const cls of ['archer','mage','knight','occultist'])for(const phase of ['prepare','fall']){
 const a=h.load({...plain(h.g.AppRegression.fresh()),...plain(vertical22EntryProfile(h.g).profile)});a.launch(22);h.finish(a);const e=a.engine,b=e.b,u=b.units.find(u=>u.side===0&&u.cls===cls);
 assert(b.terrain.find(t=>t.id===id)?.oneWay);b.units=[u];b.queue=[u.id];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 Object.assign(u,{x:2387.99,y:h.C.topAt(b.terrain.find(t=>t.id===id),2387.99),vx:0,vy:0,jumping:false,airborne:false,acted:false,moving:0});
 assert(e.drop(u));if(phase==='fall'){let guard=0;while(u.platformDrop.phase!=='fall'){e.integrateBody(u,1/240);assert(++guard<100);}}
 const terrain=plain(b.terrain),snapshot=plain({x:u.x,y:u.y,platformDrop:u.platformDrop,hp:u.hp,moveLeft:u.moveLeft});
 a.export();await h.import(await h.exported());a.continue();h.finish(a);
 assert.deepEqual(plain(a.engine.b.terrain),terrain,'Continue preserves complete serialized geometry');
 const resumed=a.engine.active;assert.deepEqual(plain({x:resumed.x,y:resumed.y,platformDrop:resumed.platformDrop,hp:resumed.hp,moveLeft:resumed.moveLeft}),snapshot);
 for(let n=0;n<600;n++)a.engine.integrateBody(resumed,1/240);
 assert.equal(resumed.y,2850);assert.equal(resumed.hp,snapshot.hp);assert.equal(resumed.moveLeft,snapshot.moveLeft);assert(!resumed.platformDrop);
 saveRows.push({cls,phase,terrainPreserved:true,landingY:resumed.y});
}
const out=process.env.HONRO_ROOF_OUT||'_local/reports/stage22-place-roof';await mkdir(out,{recursive:true});
await writeFile(out+'/report.json',JSON.stringify({scope:'Compiled campaign roof. Four-body isolated finite-input traversal, bidirectional projectile policy, interior walking, and App export/import/Continue with DOM/storage doubles. Enemies removed; setup poses; not browser or normal combat.',rows,saveRows},null,2)+'\n');
console.log('PASS Stage22 compiled roof: four-body access/return/drop/interior, projectile policy, eight App save boundaries');
