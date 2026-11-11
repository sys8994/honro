/** Prepared post-ambush segment. Measures real convoy walking on the current
 * map with scripted hero lead positions and round boundaries. */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';

const h=await appHarness({productionStory:true});
const {HonroAct23V4:V,HonroAct23V4Act3:A,HONRO_CORE:C}=h.g;
const ids=['objective','convoy-gilchan','convoy-mason'];

function travel(threatened){
 const profile=h.profileThrough(19);
 profile.settings.difficulty='story';
 let app=h.load(profile);
 app.launch(20);
 let b=app.engine.b;
 const actor=id=>app.engine.unit(id);
 const ground=x=>h.g.HonroMapEngine.surfaceY(b.terrain,x,undefined,'act2-floor').y;
 const pose=(u,x)=>Object.assign(u,{x,y:ground(x),vx:0,vy:0,airborne:false,jumping:false,acted:false});
 ids.forEach((id,i)=>pose(actor(id),[3800,3730,3670][i]));
 for(const u of b.units)if(u.side===1){u.hp=0;u.dead=true;}
 if(threatened){
  // A live optional foe on the exit corridor must keep the ordinary budget.
  const foe=b.units.find(u=>u.id==='a2-enemy-0');
  pose(foe,6830);
  Object.assign(foe,{dead:false,hp:foe.maxHp});
 }
 const progress=V.mem(b);
 for(const s of V.steps(b)){
  if(s.id==='escape')break;
  progress.done[s.id]=true;
 }
 progress.convoyStarted=true;
 progress.ringRemoved=true;
 progress.convoyAmbush={admitted:true,ids:[]};
 const care=A.convoyCare(b);
 Object.assign(care.injured,{stopped:true,status:'supported',supportId:'p-knight',supportedDistance:100,reachedRest:true});
 Object.assign(care.baggage,{status:'carried',owner:'convoy-gilchan',transfers:1,proof:{from:'convoy-mason',to:'convoy-gilchan'}});
 Object.assign(b,{side:0,phase:'aim',round:19,active:'p-knight'});
 app.dialogue=null;
 app.turnNotice=null;
 delete b.honroStory;

 function step(){
  const x=actor('objective').x;
  pose(actor('p-knight'),Math.min(x+110,6780));
  pose(actor('p-archer'),Math.min(x+440,6800));
  pose(actor('p-mage'),Math.min(x+560,6900));
  pose(actor('p-occultist'),Math.min(x+650,7000));
  A.tick(app,.025);
  app.engine.stepUnits(.025);
 }

 const startingX=actor('objective').x;
 for(let i=0;i<10;i++)step();
 const saved=ids.map(id=>{
  const u=actor(id);
  return [u.x,u.y,u.moveLeft,u.honroV4MoveRound];
 });
 app.profile.honroBattle=plain(b);
 app=h.load(plain(app.profile));
 app.continue();
 b=app.engine.b;
 assert.deepEqual(ids.map(id=>{
  const u=actor(id);
  return [u.x,u.y,u.moveLeft,u.honroV4MoveRound];
 }),saved);

 const rounds=[];
 for(let i=0;i<8;i++){
  for(let frame=0;frame<250&&!V.mem(b).convoyGoals?.escape;frame++)step();
  rounds.push(b.round);
  if(V.mem(b).convoyGoals?.escape)break;
  if(i===0){
   assert(actor('objective').moveLeft<1);
   assert(actor('objective').x-startingX<(threatened?600:1000),'Continue must not renew the current round budget');
  }
  b.round++;
 }
 assert(V.mem(b).convoyGoals?.escape);
 assert(ids.every(id=>C.validTerrainContactPose(b.terrain,actor(id))));
 assert.equal(A.convoyCare(b).baggage.transfers,1);
 assert.equal(rounds.length,threatened?5:3);
 return rounds;
}

console.log('Stage 20 post-ambush physical rounds, optional threat',travel(true),'clear corridor',travel(false));
