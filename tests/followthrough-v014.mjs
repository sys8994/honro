/** Hwigyeom actual-engine endpoint regression, not visual approval.
 * node tests/followthrough-v014.mjs
 * Native evidence is captured separately; this gate checks body-relative joints.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Path2D} from '@napi-rs/canvas';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';

const sources=['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js','shared/assets/rebuild-game-adapter.mjs'];
const g=vm.createContext({console,structuredClone,Path2D}),hashes={};
for(const file of sources){const source=await readFile(file,'utf8');hashes[file]=createHash('sha256').update(source).digest('hex');vm.runInContext(source.replace(/^export /gm,'')+(file.endsWith('adapter.mjs')?'\nglobalThis.HonroPoseVisual=HonroPoseVisual;':''),g);}
const R=g.HonroVectorRig,A=g.HONRO_PARTY.hwigyeom,by=Object.fromEntries(A.rig.parts.map(p=>[p.id,p]));
assert(A.followThroughRevision>=14,'Production asset must include the low endpoint and hold');
const wrap=x=>((x+540)%360)-180,angle=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function measure(s){
 const m=R.rigMatrices(A,s.poses),pt=id=>R.point(m[id],by[id].pivot),wrist=pt('front_hand'),elbow=pt('front_forearm'),waist=pt('pelvis'),shoulder=pt('front_upper_arm'),grip=pt('weapon'),palm=R.point(m.front_hand,A.rig.handSockets.front),tip=R.point(m.weapon,[by.weapon.pivot[0]+188,by.weapon.pivot[1]-16]);
 const handAngle=angle([0,0],[m.front_hand[0],m.front_hand[1]]),weaponAngle=angle([0,0],[m.weapon[0],m.weapon[1]]),forearmAngle=angle(elbow,wrist),down=waist.map((v,i)=>v-s.targets.thorax[i]),norm=Math.hypot(...down),below=p=>p.reduce((sum,v,i)=>sum+(v-waist[i])*down[i]/norm,0);
 return{wrist,elbow,waist,shoulder,tip,weaponAngle,wristBend:wrap(handAngle+90-forearmAngle),gripGap:distance(grip,palm),gripRelative:wrap(weaponAngle-handAngle),wristBelowWaist:wrist[1]-waist[1],wristBodyBelowWaist:below(wrist),elbowBelowWaist:elbow[1]-waist[1],elbowExtension:180-Math.abs(wrap(forearmAngle-angle(shoulder,elbow))),tipGroundClearance:A.canvas.anchor[1]-tip[1]};
}
const isLow=m=>m.wristBelowWaist>=35&&m.wristBodyBelowWaist>=18&&m.elbowExtension>=160;
// A rotated blade at the old waist-high wrist must fail, even with perfect grip.
{
 const p=structuredClone(R.completePose(A,A.animation.animations.attack.keyframes[4]));p.frontHand=[378.6,207];p.frontElbow=[408,165];p.frontHandAngle=28.992020198558677;
 const m=measure(R.solvePose(A,p));assert(m.gripGap<1e-6,'Mutation keeps the hand and handle attached');assert(!isLow(m),'Waist-high old wrist must not pass a blade-only follow-through');
}
const eg=await guidanceRuntime(),C=eg.HONRO_CORE,failures=[],cases=[];
function expect(value,message){if(!value)failures.push(message);}
for(const [skill,rank]of [['S00',1],['S02',1],['S07',1],['S07',3],['S07',7],['S07',8],['S01',1]])for(const facing of [1,-1]){
 const label=`${skill} rank ${rank} facing ${facing}`,profile=C.defaults();profile.heroes.knight.xp=C.xpAtLevel(10);profile.heroes.knight.ranks={S00:1,[skill]:rank};profile.loadouts.knight=[skill];
 const b=C.createBattle(1,profile,'practice',{party:['knight'],wind:0});Object.assign(b,{width:4000,height:2000,practiceCombat:true,wind:0,fields:[],waters:[],drafts:[],terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}]});b.units=b.units.slice(0,1);const u=b.units[0];Object.assign(u,{x:2000,y:1500,spawnX:2000,spawnY:1500,facing,angle:facing===1?0:180,attack:1,focus:999,maxFocus:999,hp:999,maxHp:999,loadout:[skill],ranks:{S00:1,[skill]:rank},acted:false,airborne:false,jumping:false,vx:0,vy:0,cooldowns:{}});
 b.units.push(C.makeUnit('knight',1,2000+100*facing,1500,{id:'target',fixed:true,hp:10000,maxHp:10000,armor:0,h:u.h,r:12,attack:0,loadout:[],acted:true,stun:999}));
 const events=[],e=new C.Engine(b,event=>events.push(event));e.random=()=>.99;e.checkEnd=()=>false;const v=new g.HonroPoseVisual(A,R);v.update(e,0,.001,skill);v.pose(u,.001);v.update(e,.4,.001,skill);v.pose(u,1);assert(e.fire(skill,u.angle,.7),`${label} actual Engine.fire`);
 const rows=[],hits=[];let count=0,maxTravel=0,maxTurn=0,sawRush=false;
 for(let tick=0;tick<=1400;tick++){
  if(tick)e.tick(.001);const before=JSON.stringify(b);v.update(e,.4+tick/1000,.001,skill);const{sample,state}=v.pose(u,0);assert.equal(JSON.stringify(b),before,`${label} adapter must not mutate any battle field`);
  if(skill==='S02'&&tick<600)expect(state.releaseCutDelay===.2,`${label} +${tick}ms lost the 200ms release delay after meleeAction ended`);
  const m=measure(sample),row={t:tick/1000,mode:state.mode,...m},last=rows.at(-1);sawRush||=state.mode==='rush';
  expect(m.gripGap<1e-6&&Math.abs(m.gripRelative)<1e-6,`${label} +${tick}ms grip detached or slipped`);expect(Math.abs(m.wristBend)<=35,`${label} +${tick}ms wrist bend`);expect(m.tipGroundClearance>=0,`${label} +${tick}ms sword tip penetrated ground`);
  if(last&&state.mode!=='hit'&&last.mode!=='hit'){const travel=Math.max(distance(last.wrist,m.wrist),distance(last.elbow,m.elbow)),turn=Math.abs(wrap(m.weaponAngle-last.weaponAngle));maxTravel=Math.max(maxTravel,travel);maxTurn=Math.max(maxTurn,turn);expect(travel<=8&&turn<=8,`${label} +${tick}ms branch discontinuity: ${travel.toFixed(3)} units / ${turn.toFixed(3)} degrees`);}
  const n=events.filter(e=>e.name==='swordCut').length;if(n>count){hits.push({index:n,...row});count=n;}rows.push(row);
 }
 const wantedCount=skill==='S07'?[3,3,4,4,5,5,6,7][rank-1]:1;expect(hits.length===wantedCount,`${label} actual cut count ${hits.length}, wanted ${wantedCount}`);
 for(const[h,hit]of hits.entries()){
  const expectedTime=skill==='S02'?.2:skill==='S01'?.086:.075+.1*h;expect(Math.abs(hit.t-expectedTime)<.000001,`${label} cut ${h+1} time changed from ${expectedTime}`);
  if(skill!=='S01'){
   // Golden geometry from public 8e80d306, not read from the new attack keys.
   const even=skill==='S07'&&h%2===1,wrist=even?[444.75,133.5]:[413.25,196.5],elbow=even?[377.55,86.25]:[389.1,133.5],blade=even?-55:-10.97349342132081;
   expect(distance(hit.wrist,wrist)<1e-6&&distance(hit.elbow,elbow)<1e-6&&Math.abs(wrap(hit.weaponAngle-blade))<1e-6,`${label} cut ${h+1} changed baseline impact geometry`);
  }
 }
 const lastHit=hits.at(-1)?.t??Infinity,tail=rows.filter(r=>r.t>=lastHit&&r.mode==='release'),low=tail.reduce((a,b)=>!a||b.wristBodyBelowWaist>a.wristBodyBelowWaist?b:a,null);
 expect(low&&isLow(low),`${label} lacks a low thigh-side wrist endpoint`);
 const plateau=tail.filter(r=>low&&distance(r.wrist,low.wrist)<.5&&distance(r.elbow,low.elbow)<.5&&isLow(r));
 let longest=0,current=0,prior=-1;for(const r of plateau){current=r.t-prior<.0011?current+.001:.001;longest=Math.max(longest,current);prior=r.t;}
 expect(longest>=.06,`${label} lowest hold is only ${(longest*1000).toFixed(0)}ms; require 60ms before recovery`);
 expect(low&&low.elbowBelowWaist>(hits.at(-1)?.elbowBelowWaist??0)+35,`${label} upper arm/elbow did not descend with wrist`);
 const returned=rows.find(r=>low&&r.t>low.t+.08&&r.wristBodyBelowWaist<15);expect(returned,`${label} no recovery after low endpoint`);
 if(skill==='S07')expect(rows.filter(r=>r.t>=.075&&r.t<lastHit).every(r=>!isLow(r)),`${label} full follow-through interrupted intermediate combo beats`);
 if(skill==='S01')expect(sawRush,`${label} did not exercise actual body-flight rush`);
 cases.push({skill,rank,facing,hits,lowest:low,lowestHoldMs:Math.round(longest*1000),returnedAt:returned?.t,maxTravelPerMs:maxTravel,maxTurnPerMs:maxTurn,minTipGroundClearance:Math.min(...rows.map(r=>r.tipGroundClearance)),sawRush});
}
// Interrupted charge never fires and blends back to idle without an arm jump.
for(const held of [.1,.3,.8])for(const facing of [1,-1]){
 const u={id:'hwigyeom',side:0,cls:'knight',h:92,facing,angle:facing===1?0:180,anim:0,hurt:0,walkPhase:0,walkSpeed:330},e={b:{active:u.id,units:[u],projectiles:[]}},v=new g.HonroPoseVisual(A,R);
 let previous=null,maxTravel=0,cancelFirst=null,final=null;
 for(let tick=0;tick<=Math.round((.2+held+.4)*1000);tick++){
  const t=tick/1000,charge=t>=.2&&t<.2+held?Math.max(.001,t-.2):0;v.update(e,t,.001,'S00');const{sample,state}=v.pose(u,charge),m=measure(sample);
  if(previous){const travel=Math.max(distance(previous.wrist,m.wrist),distance(previous.elbow,m.elbow));maxTravel=Math.max(maxTravel,travel);expect(travel<=8,`charge cancel ${held}s facing ${facing} +${tick}ms joint jump ${travel}`);}
  expect(state.mode!=='release',`charge cancel ${held}s facing ${facing} unexpectedly entered attack release`);
  if(t>=.2+held&&!cancelFirst)cancelFirst={t,...m};final={t,mode:state.mode,...m};previous=m;
 }
 expect(final.mode==='idle',`charge cancel ${held}s facing ${facing} failed to return idle`);
 cases.push({skill:'charge-cancel',held,facing,maxTravelPerMs:maxTravel,cancelFirst,final});
}
const out='_local/reports/followthrough-v014';await mkdir(out,{recursive:true});await writeFile(`${out}/summary.json`,JSON.stringify({sources:hashes,waistReference:'Actual pelvis pivot; body-relative height projects onto pelvis-thorax down axis',limits:{wristBelowWaist:35,wristBodyBelowWaist:18,elbowExtension:160,holdMs:60},failures,cases,visualApproval:false},null,2));
assert.equal(failures.length,0,`${failures.length} follow-through failures:\n${failures.slice(0,30).join('\n')}`);
console.log(`PASS follow-through v014: 14 actual-engine/facing cases and 6 charge-cancel adapter cases (${cases.length} total); S00/S02 timing, odd/even S07 last-only tail, rush, low wrist/elbow hold then recovery, grip, ground clearance, battle-state immutability. Visual review is still required.`);
