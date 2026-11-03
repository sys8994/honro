/** Focused, prepared-pose App-input diagnosis. Not a natural route, combat
 * cohort, browser run, final art acceptance, or permission to change geometry.
 * Preserves every existing cohort file. Produces at most 100 KiB per invocation.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,statfs} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {authorStage6Prototype} from '../tools/stage6-prototype/author.mjs';
import {brokenDeckEdges} from '../tools/stage6-prototype/broken-deck-edges.mjs';
import {focusedProfile} from '../tools/stage6-prototype/focused-profile.mjs';
import {createPlayerOperations} from '../tools/stage6-prototype/player-operations.mjs';

const output=process.argv[2];
assert(output,'Pass a NEW output JSON path; existing evidence cannot be overwritten');
const modes=process.argv[3]?[process.argv[3]]:['west-jump','vertical-drop','east-walk-jump'];
assert(modes.every(x=>['west-jump','vertical-drop','vertical-drop-rejoin','east-walk-jump'].includes(x)),'Unknown fixed diagnostic mode');
const disk=await statfs('.');
assert(disk.bavail*disk.bsize>128*1024*1024,'Need 128 MiB free for this <100 KiB focused diagnostic; no build or fullplay');
const h=await appHarness({productionStory:true}),{g,C}=h;
g.HONRO_PROJECT=brokenDeckEdges(authorStage6Prototype(g.HONRO_PROJECT));
const entry=JSON.parse(await readFile('game/docs/stage-review/stage06-bridge/evidence/entry-profile.json','utf8')).profile;
const rows=[];
for(const mode of modes){
 const profile=plain(entry);focusedProfile(g,profile);profile.settings.debugMode=false;profile.settings.difficulty='story';
 const app=h.load(profile);app.launch(6);app.scene.render=()=>{};
 const e=app.engine,b=e.b,u=e.unit('p-archer'),lookout=b.terrain.find(t=>t.id==='lower-lookout');
 const inputs=[],contacts=[],poses=[],invalid=[],ops=createPlayerOperations({app,g,C,record:r=>inputs.push(r)});
 assert(ops.ready(3000),'Opening story must release App input before preparing the pose');
 // Explicit prepared pose: the formerly observed R6 lookout position, with
 // fresh-entry move budget. Enemies and collision are retained, not relocated.
 Object.assign(u,{x:4808,y:C.topAt(lookout,4808),vx:0,vy:0,jumping:false,airborne:false});
 delete u.fallApexY;delete u.platformDrop;
 Object.assign(b,{active:u.id,side:0,phase:'aim',turnAge:0});
 assert(C.validTerrainContactPose(b.terrain,u),'Prepared lookout body must be valid');
 let frame=0;const damage=e.contactDamage.bind(e);
 e.contactDamage=(actor,vx,vy,normal,kind,silent,scale,dropUnits)=>{
  const hp=actor.hp,r=damage(actor,vx,vy,normal,kind,silent,scale,dropUnits);
  if(actor===u)contacts.push({frame,x:u.x,y:u.y,vx,vy,normal:plain(normal),kind,silent:!!silent,dropUnits,loss:hp-u.hp});
  return r;
 };
 const start=plain(u);let started=false,still=0,lastX=u.x,outcome='frame-limit';
 for(;frame<1200;frame++){
  const support=e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id;
  if(frame%10===0)poses.push({frame,x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft,vx:u.vx,vy:u.vy,support});
  if(support&&!C.validTerrainContactPose(b.terrain,u))invalid.push({frame,x:u.x,y:u.y,support});
  if(started&&support==='lower-road'&&(mode!=='vertical-drop-rejoin'||u.x<=3550)){outcome=mode==='vertical-drop-rejoin'?'rejoined-lower-road':'landed-lower-road';break;}
  // The ordinary drop action temporarily locks input while it animates/falls.
  // Observe those frames rather than mistaking that lock for a terminal case.
  if(!app.canInput()){
   if(u.platformDrop&&!['won','lost'].includes(b.phase)){ops.frame();continue;}
   outcome='input-ended';break;
  }
  if(!started){
   started=true;
   if(mode==='west-jump'&&!ops.jump(u)){outcome='jump-rejected';break;}
   if(mode.startsWith('vertical-drop')&&!ops.drop(u)){outcome='drop-unavailable';break;}
  }
  if(mode==='west-jump')ops.move(-1,C.STEP);
  if(mode==='vertical-drop-rejoin'&&support==='lower-road')ops.move(-1,C.STEP);
  if(mode==='east-walk-jump'){
   ops.move(1,C.STEP);
   if(still>=20&&e.grounded(u)){if(!ops.jump(u)){outcome='obstacle-jump-rejected';break;}still=0;}
  }
  ops.frame();still=Math.abs(u.x-lastX)<.01?still+1:0;lastX=u.x;
  if(u.moveLeft<1&&e.grounded(u)){outcome='move-budget-ended';break;}
 }
 rows.push({mode,scope:'Prepared lookout pose, unchanged enemies/collision, fresh-entry movement budget, App movement/jump/drop/frame with DOM and clock doubles; no combat phase or browser',outcome,frames:frame,start:{x:start.x,y:start.y,hp:start.hp,maxHp:start.maxHp,moveLeft:start.moveLeft},end:{x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft,support:e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id},damage:start.hp-u.hp,contacts,invalid,inputs,poses});
}
const files=['shared/engine/src/engine.ts','shared/engine/src/physics.ts','tools/stage6-prototype/author.mjs','tools/stage6-prototype/broken-deck-edges.mjs','tools/stage6-prototype/player-operations.mjs','tests/stage6-lookout-descent-prototype.mjs'],hashes={};
for(const path of files)hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const report={schema:'stage6-lookout-descent-diagnostic/v1',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),hashes,freeBytesBefore:disk.bavail*disk.bsize,rows};
const json=JSON.stringify(report,null,2)+'\n';assert(Buffer.byteLength(json)<=100*1024,'Focused report exceeds bounded output');
await writeFile(output,json,{flag:'wx'});
console.log(JSON.stringify(rows.map(({mode,outcome,frames,start,end,damage,contacts,invalid})=>({mode,outcome,frames,start,end,damage,damagingContacts:contacts.filter(x=>x.loss>0),invalidCount:invalid.length,firstInvalid:invalid[0]}))));
