/** Narrow engine physics fixtures, not the complete return route or mission.
 * Initial fixtures relocate actors and unlock residents before the command. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE,app=h.load(h.profileThrough(39));
app.launch(40);h.finish(app);const base=plain(app.engine.b);app.stopBattle();
const solid=(id,y,extra={})=>({id,x:0,y,w:2400,h:30,mat:'rock',hp:99999,maxHp:99999,indestructible:true,...extra});
function fixture({resident=true,residentId='a4-rescue-0',terrain=[solid('origin',800,{oneWay:true}),solid('landing',1100)],actor={},battle={}}={}){
 const b=plain(base),hero=b.units.find(u=>u.side===0),npc=b.units.find(u=>u.id===residentId),u=resident?npc:hero;
 Object.assign(hero,{x:1800,y:800,vx:0,vy:0,jumping:false,airborne:false,acted:false});
 Object.assign(u,{x:700,y:800,vx:0,vy:0,jumping:false,airborne:false,acted:false,moving:0,fixed:false,platformDrop:undefined,...actor});
 Object.assign(b,{units:resident?[hero,u]:[u],active:hero.id,side:0,phase:'aim',terrain,width:2400,height:3000,waters:[],projectiles:[],drafts:[],...battle});b.sceneVersion++;
 const e=new C.Engine(b,()=>{});e.checkEnd=()=>false;Object.assign(u,actor);return{b,e,u};
}
const invariant=({b,u})=>({active:b.active,side:b.side,actorSide:u.side,hp:u.hp,move:u.moveLeft,focus:u.focus,acted:u.acted,round:b.round,shot:b.shot});
const motion=u=>({x:u.x,y:u.y,vx:u.vx,vy:u.vy,jumping:u.jumping,drop:plain(u.platformDrop??null)});
let checks=0;
for(const dt of [1/240,1/60,.08])for(const oneWay of [true,false]){
 const terrain=[solid('origin',800,{oneWay:true}),solid('landing',1100,{oneWay})],a=fixture({resident:false,terrain:plain(terrain)}),b=fixture({terrain:plain(terrain)}),ia=invariant(a),ib=invariant(b);
 assert.equal(b.e.drop(b.u),false);assert(a.e.drop());assert(b.e.dropAct4Resident(b.u));assert.equal(b.e.dropAct4Resident(b.u),false);assert.deepEqual(motion(a.u),motion(b.u));assert.deepEqual(invariant(a),ia);assert.deepEqual(invariant(b),ib);assert.equal(b.u.y,800);
 let clearedInFall=false,landed=false;
 for(let i=0;i<Math.ceil(3/dt);i++){
  a.e.stepUnits(dt);b.e.stepUnits(dt);assert.deepEqual(motion(b.u),motion(a.u));
  if(i*dt<.18-dt)assert.equal(b.u.y,800);
  if(b.u.platformDrop?.phase==='fall'&&!b.u.platformDrop.contacts.length)clearedInFall=true;
  if(b.u.platformDrop?.phase==='land'){landed=true;assert.equal(b.u.platformDrop.contacts.length,0);}
  if(b.u.platformDrop){const before=JSON.stringify(b.u);assert.equal(b.e.dropAct4Resident(b.u),false);assert.equal(JSON.stringify(b.u),before);}
 }
 assert(clearedInFall);assert(landed);assert.equal(b.u.y,1100);assert(b.e.grounded(b.u));assert.equal(b.u.platformDrop,undefined);assert.deepEqual(invariant(a),ia);assert.deepEqual(invariant(b),ib);checks++;
}
const invalidActors=[{side:0},{side:1},{id:'ordinary-npc'},{honroAct4Resident:false},{honroCivilian:false},{fixed:true},{dead:true},{hp:0},{jumping:true},{airborne:true},{vx:4},{vy:4},{summoned:true},{enthrall:true},{eaterCapturedBy:'eater'},{carriedBy:'carrier'},{summonFloating:true},{equipmentState:{motion:{}}},{meleeFollow:'ready'},{platformDrop:{phase:'land',elapsed:0,originY:800,contacts:[]}}];
for(const actor of invalidActors){const f=fixture({actor}),before=JSON.stringify(f.b);assert.equal(f.e.dropAct4Resident(f.u),false,JSON.stringify(actor));assert.equal(JSON.stringify(f.b),before);checks++;}
for(const battle of [{honroAct4Preview:39},{honroAct4Preview:undefined},{honroAct4Official:0,honroCustom:false},{phase:'won'},{phase:'lost'}]){const f=fixture({battle}),before=JSON.stringify(f.b);assert.equal(f.e.dropAct4Resident(f.u),false);assert.equal(JSON.stringify(f.b),before);checks++;}
for(const terrain of [[],[solid('solid',800)],[solid('origin',800,{oneWay:true}),solid('coincident-solid',800)],[solid('distant',1200,{oneWay:true})]]){const f=fixture({terrain}),before=JSON.stringify(f.b);assert.equal(f.e.dropAct4Resident(f.u),false);assert.equal(JSON.stringify(f.b),before);checks++;}
{const f=fixture(),before=JSON.stringify(f.b);assert.equal(f.e.dropAct4Resident(plain(f.u)),false);assert.equal(f.e.dropAct4Resident(undefined),false);assert.equal(JSON.stringify(f.b),before);checks++;}
{const f=fixture({battle:{honroStage:30,honroAct4Preview:40,honroAct4Official:0,honroCustom:true}});assert(f.e.dropAct4Resident(f.u));checks++;}
// Optional candidate-only geometry checks; no route, receipt or mission proof.
const candidate=process.argv[2];
if(candidate){
 const raw=await readFile(candidate,'utf8'),project=JSON.parse(raw),stage=project.stages[0],compiled=g.HonroMaps.compile(stage,project);
 const descents=[...[0,1,2,3].map(i=>[i,2660,2244,'coast-west','dock-stair']),...[0,3].map(i=>[i,1600,2807,'dock','departure-stair'])];
 for(const [residentIndex,x,y,origin,landing] of descents){
  const originTerrain=compiled.terrain.find(t=>t.id===`approved40-${origin}`),startY=C.topAt(originTerrain,x,y);
  assert(Math.abs(startY-y)<5,'documented waypoint rounding only');
  const f=fixture({residentId:`a4-rescue-${residentIndex}`,terrain:plain(compiled.terrain),actor:{x,y:startY},battle:{width:stage.width,height:stage.height}}),before=invariant(f);
  const support=()=>f.e.contactSurface(f.u.x,f.u.y-.2,f.u.y+.2)?.t.id;
  assert.equal(support(),`approved40-${origin}`);assert(f.e.grounded(f.u));assert.equal(f.e.drop(f.u),false);assert(f.e.dropAct4Resident(f.u));
  for(let i=0;i<480;i++)f.e.stepUnits(1/120);
  assert.equal(support(),`approved40-${landing}`);assert(f.e.grounded(f.u));assert.equal(f.u.platformDrop,undefined);assert(f.u.y>y);assert.equal(f.u.x,x);assert.deepEqual(invariant(f),before);checks++;
  console.log(JSON.stringify({candidateSHA256:createHash('sha256').update(raw).digest('hex'),resident:f.u.id,from:{x,y:startY,waypointY:y,origin},landing:{x:f.u.x,y:f.u.y,support:support()},scope:'initial local descent fixture only'}));
 }
}
console.log(`PASS ${checks} resident drop physics/guard fixtures; no route or mission completion claim`);
