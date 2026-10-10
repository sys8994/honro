/** Production grip/pose regression. Geometry is a minimum gate, not visual approval.
 * node tests/sword-grip-v013.mjs
 * Uses actual Engine.fire/tick for S00, seven-hit S07 and S01 body rush.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Path2D} from '@napi-rs/canvas';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';

const sources=['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js','shared/assets/rebuild-game-adapter.mjs'];
const g=vm.createContext({console,structuredClone,Path2D}),hashes={};
for(const file of sources){
 const source=await readFile(file,'utf8');hashes[file]=createHash('sha256').update(source).digest('hex');
 vm.runInContext(source.replace(/^export /gm,'')+(file.endsWith('adapter.mjs')?'\nglobalThis.HonroPoseVisual=HonroPoseVisual;':''),g);
}
const R=g.HonroVectorRig,asset=g.HONRO_PARTY.hwigyeom;
assert.equal(asset.rig.swordGrip?.revision,13,'Production bundle must contain the fixed rotational grip');
assert.equal(asset.rig.swordGrip.crossAxisOffset,0,'The authored handle crosses the fist local +X axis');
const wrap=d=>((d+540)%360)-180,angle=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const parts=a=>Object.fromEntries(a.rig.parts.map(p=>[p.id,p]));
function measure(a,sample){
 const by=parts(a),m=R.rigMatrices(a,sample.poses),elbow=R.point(m.front_forearm,by.front_forearm.pivot),wrist=R.point(m.front_hand,by.front_hand.pivot);
 const palm=R.point(m.front_hand,a.rig.handSockets.front),grip=R.point(m.weapon,by.weapon.pivot);
 const handCrossAngle=angle([0,0],[m.front_hand[0],m.front_hand[1]]),weaponAngle=angle([0,0],[m.weapon[0],m.weapon[1]]);
 const forearmAngle=angle(elbow,wrist),wristBend=wrap(handCrossAngle+90-forearmAngle);
 return {elbow,wrist,palm,grip,forearmAngle,handCrossAngle,weaponAngle,wristBend,
  gripGap:distance(grip,palm),gripRotation:wrap(weaponAngle-handCrossAngle),
  forearmLength:distance(elbow,wrist)};
}
function gripFailures(m){
 const failures=[];
 if(m.gripGap>1e-6)failures.push(`palm/handle separated ${m.gripGap}`);
 if(Math.abs(m.gripRotation)>1e-6)failures.push(`handle rotated within fist ${m.gripRotation} deg`);
 // This bound describes the authored repertoire in this regression, not a rule
 // that every real sword pose must have a 90-degree forearm/blade angle.
 if(Math.abs(m.wristBend)>35)failures.push(`wrist long-axis bend ${m.wristBend} deg exceeds the 35-deg pose envelope`);
 if(m.forearmLength<15)failures.push(`projected forearm collapsed to ${m.forearmLength}`);
 return failures;
}
const failures=[],cases=[];
function check(m,label){for(const failure of gripFailures(m))failures.push(`${label}: ${failure}`);}
function continuous(before,after,dt,label){
 if(!before)return;
 // 1-ms engine sampling makes a one-frame branch teleport distinguishable
 // from the existing fast cut. Check actual joints and angle, not socket gap.
 const maxTravel=Math.max(2,dt*8000),maxTurn=Math.max(2,dt*8000);
 for(const key of ['elbow','wrist']){const travel=distance(before[key],after[key]);if(travel>maxTravel)failures.push(`${label}: ${key} jumps ${travel.toFixed(3)} in ${(dt*1000).toFixed(3)}ms (limit ${maxTravel})`);}
 const turn=Math.abs(wrap(after.weaponAngle-before.weaponAngle));if(turn>maxTurn)failures.push(`${label}: sword turns ${turn.toFixed(3)} deg in ${(dt*1000).toFixed(3)}ms (limit ${maxTurn})`);
}

// A zero-gap sword deliberately rotated along the hand must fail this test.
// This protects against restoring the old positional-only test by accident.
{
 const detached=structuredClone(asset);delete detached.rig.swordGrip;
 const p=structuredClone(R.sampleAnimation(asset,'idle',0,true).targets);p.weapon=p.frontHandAngle+90;
 const m=measure(detached,R.solvePose(detached,p));assert(m.gripGap<1e-6,'Mutation must retain the deceptively correct zero socket gap');
 assert(gripFailures(m).some(s=>s.includes('rotated within fist')),'Zero socket gap must not pass a lengthwise handle');
}

for(const clip of ['idle','move']){
 let previous=null;const rows=[];
 for(let i=0;i<=240;i++){const m=measure(asset,R.sampleAnimation(asset,clip,i/240,true));check(m,`${clip} ${i}/240`);continuous(previous,m,asset.animation.animations[clip].duration_ms/1000/240,`${clip} ${i}/240`);previous=m;rows.push(m);}
 cases.push({name:`authored-${clip}`,samples:rows.length,wristRange:[Math.min(...rows.map(m=>m.wristBend)),Math.max(...rows.map(m=>m.wristBend))]});
}

// Actual adapter locomotion -> idle -> charge -> S00 release -> recovery.
for(const facing of [1,-1]){
 const u={id:'hwigyeom',side:0,cls:'knight',h:92,facing,angle:facing===1?0:180,anim:0,hurt:0,walkPhase:0,walkSpeed:330};
 const engine={b:{active:u.id,units:[u],projectiles:[]}},v=new g.HonroPoseVisual(asset,R),rows=[];let previous=null;
 for(let tick=0;tick<=360;tick++){
  const time=tick/120;u.moving=time>=.2&&time<.5;if(u.moving)u.walkPhase+=330*.038/120;
  u.anim=time>=1.8?Math.max(0,1-(time-1.8)):0;v.update(engine,time,1/120,'S00');
  const charge=time>=.8&&time<1.8?Math.max(.001,time-.8):0,{sample,state}=v.pose(u,charge),m=measure(asset,sample);
  check(m,`adapter facing ${facing} ${time}`);continuous(previous,m,1/120,`adapter facing ${facing} ${time}`);previous=m;
  rows.push({time,mode:state.mode,...m});
 }
 cases.push({name:`adapter-cycle-${facing}`,rows});
}

const eg=await guidanceRuntime(),C=eg.HONRO_CORE;
for(const skill of ['S00','S07','S01'])for(const facing of [1,-1]){
 const rank=skill==='S07'?8:1,profile=C.defaults();profile.heroes.knight.xp=C.xpAtLevel(10);profile.heroes.knight.ranks={S00:1,[skill]:rank};profile.loadouts.knight=[skill];
 const b=C.createBattle(1,profile,'practice',{party:['knight'],wind:0});
 Object.assign(b,{width:4000,height:2000,practiceCombat:true,wind:0,fields:[],waters:[],drafts:[],terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}]});
 b.units=b.units.slice(0,1);const u=b.units[0];Object.assign(u,{x:2000,y:1500,spawnX:2000,spawnY:1500,facing,angle:facing===1?0:180,attack:1,focus:999,maxFocus:999,hp:999,maxHp:999,loadout:[skill],ranks:{S00:1,[skill]:rank},acted:false,airborne:false,jumping:false,vx:0,vy:0,cooldowns:{}});
 b.units.push(C.makeUnit('knight',1,2000+100*facing,1500,{id:'target',fixed:true,hp:10000,maxHp:10000,armor:0,h:u.h,r:12,attack:0,loadout:[],acted:true,stun:999}));
 const events=[],engine=new C.Engine(b,e=>events.push(e));engine.random=()=>.99;engine.checkEnd=()=>false;
 const v=new g.HonroPoseVisual(asset,R);v.update(engine,0,.001,skill);v.pose(u,.001);v.update(engine,.4,.001,skill);v.pose(u,1);
 assert(engine.fire(skill,u.angle,.7),`${skill} Engine.fire must succeed`);
 const rows=[],hits=[];let previous=null,lastCount=0,sawRush=false;
 for(let tick=0;tick<=1100;tick++){
  if(tick)engine.tick(.001);v.update(engine,.4+tick/1000,.001,skill);const {sample,state}=v.pose(u,0),m=measure(asset,sample),label=`engine ${skill} facing ${facing} +${tick}ms`;
  check(m,label);if(state.mode==='rush')sawRush=true;
  // Incoming-hit animation interruption is a separate behavior; retain its
  // geometry checks while testing continuity of the requested action itself.
  if(previous&&state.mode!=='hit'&&previous.mode!=='hit')continuous(previous,m,.001,label);
  const n=events.filter(e=>e.name==='swordCut').length;if(n>lastCount){hits.push({index:n,time:tick/1000,...m});lastCount=n;}
  const row={time:tick/1000,mode:state.mode,...m};rows.push(row);previous=row;
 }
 if(skill==='S07'){
  assert.equal(hits.length,7,'S07 rank 8 must actually emit seven engine cuts');
  const firstCut=asset.animation.animations.attack.keyframes[3].frontHandAngle,returnCut=-55;
  assert(Math.abs(wrap(returnCut-firstCut))>=30,'Alternating cuts need a visible arc; matching a fixed blade angle must not pass');
  hits.forEach((hit,i)=>{assert(Math.abs(hit.time-(.075+.1*i))<.0011,`S07 hit ${i+1} timing`);const expected=i%2?returnCut:firstCut;if(Math.abs(wrap(hit.weaponAngle-expected))>.01)failures.push(`S07 facing ${facing} hit ${i+1}: actual angle ${hit.weaponAngle}, expected alternating ${expected}`);});
 }
 if(skill==='S01')assert(sawRush,'S01 must exercise actual body-flight rush branch');
 cases.push({name:`engine-${skill}-${facing}`,sawRush,hits,rows});
}
const out='_local/reports/sword-grip-v013';await mkdir(out,{recursive:true});
await writeFile(`${out}/summary.json`,JSON.stringify({sources:hashes,limits:{wristBendDegrees:35,gripGap:1e-6,gripRelativeDegrees:1e-6,continuityUnitsPerSecond:8000},failures,cases,visualApproval:false},null,2));
assert.equal(failures.length,0,`${failures.length} grip/continuity failures:\n${failures.slice(0,30).join('\n')}`);
console.log(`PASS sword grip v013: fixed hand/handle relationship, bounded wrist pose, dense idle/move and actual S00/S07/rush, both facings (${cases.length} cases). Visual review is still required.`);
