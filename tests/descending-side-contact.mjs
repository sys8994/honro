/** Finite polygon side-entry regression, not normal-combat evidence.
 * The Stage18 R6 coordinates, walk speed and 0.65 command below are captured
 * from representative-candidate's real input trace. No local report is needed
 * to replay it. Separate air fixtures test all companions at both sides of the
 * canonical reflector. Other actors are removed; only initial pose/budget is
 * set. Thereafter Engine commands/physics alone change positions, with no
 * movement replenishment, terrain edit, HP edit, recovery or save tolerance.
 * App export/import/Continue is production code with DOM/storage doubles.
 */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{C}=h,classes=['archer','mage','knight','occultist'],rows=[];
const gap=3.5140131152211325;
function fixture(cls,x,y,{recordedMove=false}={}){
 const profile=h.profileThrough(17);
 // Captured R6 progression produces the recorded speed/budget through the
 // production stat builder, so Continue sees a coherent profile and body.
 if(recordedMove)Object.assign(profile.heroes[cls],{xp:46729,statTraining:24});
 const a=h.load(profile);a.launch(18);h.finish(a);
 const e=a.engine,b=e.b,u=b.units.find(z=>z.cls===cls&&z.side===0);
 b.units=[u];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
 Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});
 if(recordedMove){assert.equal(u.walkSpeed,347);assert.equal(u.maxMove,2541);assert.equal(u.moveLeft,2541);}
 const terrain=JSON.stringify(b.terrain),initial={x,y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft};
 const audit={externalPositionWrites:0,recoveries:0};let allowed=0;
 for(const key of ['x','y']){let value=u[key];Object.defineProperty(u,key,{enumerable:true,configurable:true,get(){return value},set(v){if(!allowed){audit.externalPositionWrites++;throw Error('External '+key+' write after initial fixture');}value=v;}});}
 for(const key of ['walk','jump','integrateBody']){const real=e[key].bind(e);e[key]=function(...args){allowed++;try{return real(...args)}finally{allowed--}};}
 const recover=e.recover.bind(e);e.recover=function(...args){audit.recoveries++;return recover(...args)};
 return {a,e,b,u,audit,initial,terrain};
}
const pose=u=>plain({x:u.x,y:u.y,vx:u.vx,vy:u.vy,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,jumping:u.jumping,airborne:u.airborne});
function check(q){
 assert.equal(q.audit.externalPositionWrites,0);assert.equal(q.audit.recoveries,0);
 assert.equal(q.u.hp,q.initial.hp);assert.equal(q.u.focus,q.initial.focus);
 assert.equal(JSON.stringify(q.b.terrain),q.terrain,'Live collision cannot rewrite terrain');
 if(q.e.grounded(q.u))assert(C.validTerrainContactPose(q.b.terrain,q.u),'Every grounded live pose must have clear probes');
}
function clearReflectorProbes(q){
 const t=q.b.terrain.find(t=>t.id==='sb-court-reflector'),v=C.poly(t),u=q.u,radius=Math.min(6,Math.max(2,u.r-2));
 for(let i=0;i<v.length;i++){
  const a=v[i],b=v[(i+1)%v.length],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=dy/len,ny=-dx/len;
  if(Math.abs(nx)<.98||ny< -1e-7||ny>.2)continue;
  for(const offset of [u.h*.5,u.h*.52,u.h-7]){
   const along=((u.x-a.x)*dx+(u.y-offset-a.y)*dy)/(len*len),distance=(u.x-a.x)*nx+(u.y-offset-a.y)*ny;
   if(along>=0&&along<=1)assert(distance<0||distance>=radius-.15,'Finite side body probe overlap');
  }
 }
}
async function exactContinue(q,label){
 const before=pose(q.u),terrain=plain(q.b.terrain),recoveries=q.b.honroContactRecoveries?.length||0;
 for(let i=0;i<2;i++){
  q.a.export();const saved=await h.exported();assert.deepEqual(pose(saved.honroBattle.units.find(u=>u.id===q.u.id)),before,label+' export');
  await h.import(saved);q.a.continue();h.finish(q.a);
  const b=q.a.engine.b,u=b.units.find(u=>u.id===q.u.id);
  assert.deepEqual(pose(u),before,label+' Continue exact, including resources');
  assert.deepEqual(plain(b.terrain),terrain,label+' terrain exact');
  assert.equal(b.honroContactRecoveries?.length||0,recoveries,label+' no save repair');
 }
 return {count:2,exact:true};
}
// Independent review's finite-side boundaries, against the production method.
// These are explicit synthetic geometry fixtures, not authored route evidence.
{
 const wall={id:'finite-wall',x:100,y:100,w:20,h:100,mat:'rock',hp:99999,maxHp:99999,vertices:[{x:100,y:100},{x:120,y:100},{x:120,y:200},{x:100,y:200}]};
 const base={ox:96.5,oy:145.9,nx:96.5,ny:146.1};
 const cases=[
  ['new finite left-face entry',{},base,true],
  ['one-way untouched',{oneWay:true},base,false],
  ['broken untouched',{broken:true},base,false],
  ['seven-pixel gap untouched',{}, {...base,ox:93,nx:93},false],
  ['existing overlap is not a recovery',{}, {...base,oy:160,ny:170},false],
  ['existing interior is not rescued',{}, {...base,ox:101,nx:101},false],
  ['outside finite new projection untouched',{}, {...base,oy:130,ny:131},false],
  ['opposite right face resolves',{}, {...base,ox:123.5,nx:123.5},true],
 ];
 const q=fixture('mage',96.5,145.9),{e,u}=q;
 for(const [name,patch,p,changes] of cases){
  e.b.terrain=[{...wall,...patch}];e.b.sceneVersion++;
  const before=pose(u),x=e.descendingSideEntry(u,p.ox,p.oy,p.nx,p.ny);
  assert.equal(x!==p.nx,changes,name);if(changes)assert(Math.abs(x-p.nx)<=2.60000000001,name+' bounded local collision');
  assert.deepEqual(pose(u),before,name+' helper does not place a body or mutate resources');
  rows.push({kind:'production helper boundary',name,input:p,outputX:x,correction:x-p.nx});
 }
 // !supported and downward-motion gates belong to integrateBody, not its
 // private helper. Check the real call site, without reproducing those gates.
 for(const supported of [false,true]){
  const z=fixture('mage',supported?93:96.5,supported?180:146.1);
  z.b.terrain=[plain(wall),...(supported?[{id:'floor',x:0,y:180,w:220,h:200,mat:'rock',hp:99999,maxHp:99999}]:[])];z.b.sceneVersion++;
  z.u.vy=supported?0:-24;const before=pose(z.u),real=z.e.descendingSideEntry.bind(z.e);let calls=0;
  z.e.descendingSideEntry=function(...args){calls++;return real(...args)};
  if(supported)assert(C.validTerrainContactPose(z.b.terrain,z.u));
  z.e.integrateBody(z.u,C.STEP);assert.equal(calls,0,supported?'Resting support skips resolver':'Ascending body skips resolver');
  assert.equal(z.u.x,before.x);if(supported)assert.deepEqual(pose(z.u),before);else assert(z.u.y<before.y);
  rows.push({kind:'production call-site boundary',name:supported?'supported pose untouched':'rising pose untouched',before,after:pose(z.u),resolverCalls:calls});
 }
}
// Recreate the recorded voluntary jump. The old engine reached x3296.4859869
// and froze in a 2.486px torso overlap; Continue then correctly repaired it32px.
{
 const q=fixture('mage',3076.574736884776,5464.50439628734,{recordedMove:true}),{e,u}=q;
 assert(C.validTerrainContactPose(q.b.terrain,u));assert(e.jump(u));
 const frames=[],sideContacts=[];
 for(let frame=1;frame<=160;frame++){
  if(Math.abs(u.x-3300)>3)e.move(.65,C.STEP);
  const before=pose(u);e.tick(C.STEP);const after=pose(u);
  if(after.x!==before.x)sideContacts.push({frame,before,after});
  check(q);clearReflectorProbes(q);frames.push({frame,before,after,grounded:e.grounded(u)});
 }
 assert.equal(sideContacts.length,1,'Only one local side collision');
 assert.equal(sideContacts[0].frame,128,'First finite-side entry from the real R6 trace');
 assert.equal(sideContacts[0].before.x,3296.485986884779);assert.equal(sideContacts[0].after.x,3293.9);
 assert(Math.abs(sideContacts[0].after.x-sideContacts[0].before.x)<2.587,'No distant recovery');
 assert(e.grounded(u));assert.equal(u.x,3293.9);assert.equal(u.y,5477.288235294118);
 assert(u.moveLeft<q.initial.moveLeft,'Actual commands consume movement');
 const continued=await exactContinue(q,'recorded R6 160-tick jump');
 rows.push({kind:'recorded R6 160-tick basic jump',initial:q.initial,final:pose(u),audit:q.audit,sideContacts,frames,continue:continued});
}
for(const cls of classes)for(const side of ['left','right'])for(const distance of [gap,7]){
 const x=side==='left'?3300-distance:3410+distance,q=fixture(cls,x,5240),{e,u}=q;
 const changes=[];let frame=0;
 for(;frame<1000;frame++){
  const before=pose(u);e.integrateBody(u,C.STEP);const after=pose(u);
  if(before.x!==after.x)changes.push({frame:frame+1,before,after});
  check(q);clearReflectorProbes(q);if(e.grounded(u))break;
 }
 assert(e.grounded(u),'Must land through ordinary physics');assert.equal(u.moveLeft,q.initial.moveLeft,'Passive fall consumes no movement');
 if(distance===7){assert.equal(changes.length,0);assert.equal(u.x,x,'Already-clear 7px pose remains exact');}
 else{assert.equal(changes.length,1);assert.equal(u.x,side==='left'?3293.9:3416.1);assert(Math.abs(u.x-x)<2.587);}
 const row={kind:'canonical vertical side descent',cls,side,distance,frames:frame+1,initial:q.initial,final:pose(u),audit:q.audit,changes};
 row.continue=await exactContinue(q,`${cls}/${side}/${distance}`);rows.push(row);
}
await mkdir('_local/reports/descending-side-contact',{recursive:true});
const source={};for(const file of ['shared/engine/src/engine.ts','shared/engine/src/locomotion.ts','shared/runtime/stage-rules.js'])source[file]=createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile('_local/reports/descending-side-contact/summary.json',JSON.stringify({passed:true,source,scope:'Initial-pose isolated physics fixtures and recorded R6 command replay; no normal-combat completion claim. Actual App save/import/Continue with DOM/storage doubles.',cases:rows.length,counts:{boundaries:10,livePhysics:17,exactContinue:17},rows},null,2)+'\n');
console.log(`PASS descending side contact: ${rows.length} cases (10 boundaries + 17 live), R6 160 ticks, 4 companions x 2 sides x 2 gaps, 17 exact App Continue twice`);
