/** Actual rank-one fire/tick on the complete authored Stage23 roster.
 * Supported initial poses are fixtures, never evidence of normal arrival.
 * Subsequent movement, costs, damage, knockback and summons are production.
 * Angle discovery was bounded and offline; every regression below is fixed. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {escortEntryProfile,ESCORT_ENTRY} from './stage23-escort-entry-helper.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const geometry=s=>plain({width:s.width,height:s.height,terrains:s.terrains,materials:s.materials,units:s.units,events:s.events,markers:s.markers,initialState:s.initialState});
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,A=g.HonroAct3,profile=escortEntryProfile(g).profile,source=g.HONRO_PROJECT.stages[22],geometrySha256=hash(geometry(source)),skillsSha256=hash(C.SKILLS),rows=[],failures=[],gaps=[],observations=[];
const originalIds=plain(source.units.filter(u=>u.team==='enemy').map(u=>u.id));
function fixture(cls,support,x,{escortStarted=false}={}){
 const q=battlefield(g,23,{profile:plain(profile)}),{b,e}=q,u=e.heroesAlive().find(u=>u.cls===cls),t=b.terrain.find(t=>t.id===support),y=C.topAt(t,x);
 assert(t&&!t.broken);Object.assign(u,{x,y,vx:0,vy:0,acted:false});b.active=u.id;b.side=0;b.phase='aim';
 assert(C.validTerrainContactPose(b.terrain,u),'Body-clear supported fixture '+support+':'+x);assert(e.grounded(u));
 assert(!b.units.some(v=>v.id!==u.id&&!v.dead&&Math.abs(v.x-u.x)<v.r+u.r&&v.y>u.y-u.h&&v.y-v.h<u.y),'No overlapping setup actors');
 assert.deepEqual(plain(e.alive(1).map(u=>u.id)),originalIds);assert.equal(originalIds.length,{originalBudget22e5:22,candidate28e6:28}[source.initialState.honroEscortYardRoster],'Complete explicitly named production roster remains live');assert.equal(b.enemyLimit,3);
 for(const h of e.heroesAlive()){assert.equal(h.level,16);assert.equal(b.heroes[h.cls].xp,75748);assert.equal(b.heroes[h.cls].statTraining,6);assert.deepEqual(plain(h.loadout),ESCORT_ENTRY.slots[h.cls]);assert(Object.values(h.ranks).every(r=>r===1));}
 if(escortStarted){const a=A.memory(b);a.done['dispatch-bundle']=a.done['carrier-start']=true;a.escorts['act3-carrier']={started:true};}
 // A native-call guard makes any later test-side coordinate/resource repair fail.
 Object.assign(q,{u,support,fixture:{cls,support,x,y,escortPrerequisites:escortStarted},externalLiveActorWrites:0,nativeDepth:0,inputs:[]});
 q.native=fn=>{q.nativeDepth++;try{return fn();}finally{q.nativeDepth--;}};
 for(const actor of b.units)for(const key of ['x','y','hp','focus','moveLeft']){let value=actor[key];Object.defineProperty(actor,key,{enumerable:true,configurable:true,get:()=>value,set:next=>{assert(q.nativeDepth>0,'External live '+key+' write '+actor.id);value=next;}});}
 q.geometry=hash({terrain:b.terrain,world:b.honroWorldTerrain});q.items=plain(b.items);e.recover=()=>{throw Error('Unexpected production recovery would invalidate the no-repair role fixture');};return q;
}
const tick=q=>q.native(()=>q.e.tick(C.STEP));
function fire(q,skill,angle,power,{diveFrame=null,negativeFriendlyDamage=false}={}){
 const{b,e,u}=q;assert(u.loadout.includes(skill));assert.equal(u.ranks[skill],1);
 const before=Object.fromEntries(b.units.map(v=>[v.id,v.hp])),initialIds=b.units.map(v=>v.id),from={x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id},focus=u.focus,contacts=[],hits=[],crossings=[],damageEvents=[],trajectory=[],lightning=[];
 const impact=e.impact.bind(e),hurt=e.hurt.bind(e),emit=e.emit.bind(e);let frame=0,dive=null;
 e.impact=(p,h)=>{if(h.terrain)contacts.push({id:h.terrain.id,mat:h.terrain.mat,oneWay:h.terrain.oneWay,x:h.x,y:h.y,bounces:p.bounces,pierces:p.pierces,apex:p.apex,apexY:p.apexY});if(h.unit)hits.push({id:h.unit.id,x:h.x,y:h.y,bounces:p.bounces,pierces:p.pierces,apex:p.apex,apexY:p.apexY});return impact(p,h);};
 e.hurt=(v,...args)=>{const hp=v.hp,result=hurt(v,...args);if(v.hp<hp)damageEvents.push({id:v.id,owner:args[1],damage:hp-v.hp,frame});return result;};
 e.emit=(kind,event)=>{if(kind==='fx'&&event?.name==='lightningBolt')lightning.push(plain(event));return emit(kind,event);};
 assert(q.native(()=>e.fire(skill,angle,power)),skill+' actual fire');const focusSpent=focus-u.focus;q.inputs.push({op:'fire',skill,angle,power,from});
 while((b.projectiles.length||u.meleeAction)&&frame<1800){
  const segments=b.projectiles.map(p=>({p,x:p.x,y:p.y}));
  if(diveFrame!==null&&frame>=diveFrame&&!dive){const p=b.projectiles.find(p=>p.owner===u.id&&p.mode==='warriorDive');if(p){const start={frame,x:p.x,y:p.y,apexY:p.apexY};assert(q.native(()=>e.manualDive()));dive=start;q.inputs.push({op:'manualDive',frame});}}
  tick(q);frame++;
  if(C.SKILLS[skill].phase==='terrain')for(const a of segments){const h=e.projectileCollision(a,{x:a.p.x,y:a.p.y},a.p.radius,a.p.owner,[],false,[],true);if(h?.terrain&&!crossings.some(c=>c.id===h.terrain.id))crossings.push({id:h.terrain.id,mat:h.terrain.mat,x:h.x,y:h.y});}
  trajectory.push({frame,x:u.x,y:u.y,grounded:e.grounded(u)});
 }
 assert.equal(b.projectiles.length,0);assert(!u.meleeAction);assert.equal(hash({terrain:b.terrain,world:b.honroWorldTerrain}),q.geometry);assert.deepEqual(plain(b.items),q.items);
 assert(initialIds.every(id=>b.units.some(u=>u.id===id)),'Original actors never removed');
 if(skill!=='O11')assert.equal(b.units.length,initialIds.length,'Only O11 can add a summon');
 if(!negativeFriendlyDamage)assert(!damageEvents.some(d=>d.id.startsWith('p-')||d.id==='act3-carrier'),'No successful shot depends on friendly damage');
 e.impact=impact;e.hurt=hurt;e.emit=emit;
 return{skill,rank:1,slots:plain(u.loadout),fixture:q.fixture,angle,power,from,to:{x:u.x,y:u.y},focusSpent,negativeFriendlyDamage,frames:frame,contacts,hits,crossings,lightning,damageEvents,
 damage:Object.fromEntries(b.units.filter(v=>before[v.id]>v.hp).map(v=>[v.id,before[v.id]-v.hp])),dive,trajectory,summons:b.units.filter(v=>v.summoned).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,kind:v.summonKind,rank:v.summonRank,owner:v.summonOwner,expires:v.summonExpires}))};
}
const shot=(cls,support,x,skill,angle,power,options)=>fire(fixture(cls,support,x),skill,angle,power,options);
function move(q,x,{speed=.8,max=1200}={}){assert(q.e.canAct());const from={x:q.u.x,y:q.u.y},before=q.u.moveLeft;let frames=0;
 for(;frames<max&&Math.abs(q.u.x-x)>2;frames++){q.native(()=>q.e.move(Math.sign(x-q.u.x)*speed,C.STEP));tick(q);}
 assert(Math.abs(q.u.x-x)<=2,'Basic walking reaches '+x+' from '+JSON.stringify(from));const result={op:'move',from,to:{x:q.u.x,y:q.u.y},moveSpent:before-q.u.moveLeft,frames};q.inputs.push(result);return result;
}
function nextTurn(q){const startRound=q.b.round,startHp=q.u.hp;let frames=0,waits=0;
 for(;frames<16000;frames++){if(q.e.canAct()){if(!q.u.acted){assert(q.native(()=>q.e.select(q.u.id)));return{startRound,endRound:q.b.round,frames,waits,hpBefore:startHp,hpAfter:q.u.hp,ordinaryMovePool:q.u.moveLeft};}q.inputs.push({op:'wait',actor:q.e.active.id,round:q.b.round});q.native(()=>q.e.wait());waits++;}tick(q);}throw Error('No next legal knight turn: '+q.b.phase);
}
async function check(name,fn){try{const result=await fn();rows.push({name,passed:true,...result});console.log('PASS',name);}catch(error){failures.push({name,error:error.message,stack:error.stack});console.error('FAIL',name,error.message);}}
await check('M11 actual stone reflection, identical M01 stop and reaimed free M01',()=>{
 const paid=shot('mage','sy-stone-bridge',5360,'M11',114,.5),same=shot('mage','sy-stone-bridge',5360,'M01',114,.5),alternative=shot('mage','sy-stone-bridge',5360,'M01',112,.35);
 assert(paid.contacts.some(c=>c.id==='sy-stone-corner'&&c.mat==='rock'&&!c.oneWay));assert(paid.hits.some(h=>h.id==='s23-E-1'&&h.bounces===1));assert(paid.damage['s23-E-1']>0);assert.equal(paid.focusSpent,34);
 assert(same.contacts.some(c=>c.id==='sy-stone-corner'));assert(!same.damage['s23-E-1']);assert(alternative.damage['s23-E-1']>0);assert.equal(same.focusSpent,0);assert.equal(alternative.focusSpent,0);
 return{paid,sameAngleBasic:same,reaimedBasic:alternative,reflector:'Actual solid rock side, never the underside or side of a oneWay route.'};
});
await check('M04 actual B doorway pair and rank-one 260 follow-up leave the detached flank intact',()=>{
 const paid=shot('mage','sy-ground',2460,'M04',24,.35),same=shot('mage','sy-ground',2460,'M01',24,.35),alternative=shot('mage','sy-ground',2460,'M01',26,.35);
 for(const id of ['s23-B-0','s23-B-1'])assert(paid.damage[id]>0);assert(!paid.damage['s23-B-2'],'Detached flank is outside this doorway shot');assert.equal(paid.focusSpent,38);assert.equal(paid.lightning.length,2);
 const distances=paid.lightning.map(v=>Math.hypot(v.x2-v.x,v.y2-v.y));assert(distances.every(d=>d<=260));assert(distances.some(d=>d>82),'A follow-up reaches beyond initial blast82');
 assert(!same.damage['s23-B-1']&&!same.damage['s23-B-2']);assert(alternative.damage['s23-B-1']>0);assert.equal(same.focusSpent,0);assert.equal(alternative.focusSpent,0);
 return{paid,sameAngleBasic:same,reaimedBasic:alternative,secondaryRadius:260,secondaryDistances:distances};
});
await check('A11 descending hit, identical A01 failure, reaimed free A01',()=>{
 const paid=shot('archer','sy-west-upper',4300,'A11',150,.65),same=shot('archer','sy-west-upper',4300,'A01',150,.65),alternative=shot('archer','sy-west-upper',4300,'A01',124,.5),hit=paid.hits.find(h=>h.id==='s23-D-2');
 assert(paid.damage['s23-D-2']>0&&hit?.apex);assert(hit.y-hit.apexY>250);assert.equal(paid.focusSpent,32);assert(!same.damage['s23-D-2']);assert(alternative.damage['s23-D-2']>0);assert.equal(alternative.focusSpent,0);
 return{paid,sameAngleBasic:same,reaimedBasic:alternative,actualDrop:hit.y-hit.apexY};
});
await check('O04 crosses actual rock while its body stays still; O01 fails, bridge O01 works',()=>{
 const paid=shot('occultist','sy-central-flank',4750,'O04',23.42405087176706,.7302137804451013),same=shot('occultist','sy-central-flank',4750,'O01',23.42405087176706,.7302137804451013),alternative=shot('occultist','sy-stone-bridge',5800,'O01',142.53121283043984,.6615064990344692);
 assert(paid.crossings.some(h=>h.id==='sy-stone-corner'&&h.mat==='rock'));assert(paid.damage['s23-E-3']>0);assert.equal(paid.focusSpent,59);assert.deepEqual(paid.to,{x:paid.from.x,y:paid.from.y});assert(!same.damage['s23-E-3']);assert(same.contacts.some(h=>h.id==='sy-stone-corner'));assert(alternative.damage['s23-E-3']>0);assert.equal(alternative.focusSpent,0);
 return{paid,sameAngleBasic:same,supportedBridgeAlternative:alternative};
});
await check('ordinary occultist jump keeps the native6px core outside rock; full-r22 box differs',()=>{
 const q=fixture('occultist','sy-central-flank',4750),wall=q.b.terrain.find(t=>t.id==='sy-stone-corner'),beforeMove=q.u.moveLeft;assert(q.native(()=>q.e.jump(q.u)));assert.equal(beforeMove-q.u.moveLeft,75);const coreRadius=Math.min(6,Math.max(2,q.u.r-2)),trajectory=[];
 for(let frame=0;frame<90;frame++){q.native(()=>q.e.move(1,C.STEP));tick(q);const coreIntersection=C.terrainRectIntersects(wall,q.u.x-coreRadius,q.u.y-q.u.h+7,coreRadius*2,q.u.h-12,.1);assert(!coreIntersection,'Native locomotion core never intersects the wall');trajectory.push({frame:frame+1,x:q.u.x,y:q.u.y,coreIntersection,fullRadiusIntersection:C.terrainRectIntersects(wall,q.u.x-q.u.r,q.u.y-q.u.h,q.u.r*2,q.u.h-2,.1)});}
 assert(Math.max(...trajectory.map(p=>p.x))<wall.x,'Actual body centre cannot cross into or through the solid wall');assert(Math.abs(trajectory.at(-1).x-trajectory[30].x)<.01,'Right input stalls at the rock');
 const overlaps=trajectory.filter(p=>p.fullRadiusIntersection),penetration=Math.max(0,...overlaps.map(p=>p.x+q.u.r-wall.x));
 if(overlaps.length)observations.push({kind:'movement-core-versus-full-radius',status:'native-core-clear',place:'sy-central-flank east jump into sy-stone-corner',reason:'The documented locomotion contract uses torso/head radius6 and foot radius2, not the full visual/hit r22 rectangle. All90 sampled native cores remain outside; outer r22 overlap is an inspection-definition/visual limitation, not a new terrain penetration defect.',source:'shared/engine/src/locomotion.ts validTerrainContactPose/walkTerrain; shared/engine/src/engine.ts integrateBody',frames:overlaps.length,maxOuterOverlap:penetration,coreRadius,minimumCoreClearance:wall.x-Math.max(...trajectory.map(p=>p.x))-coreRadius});
 return{fixture:q.fixture,jumpCost:75,bodyRadius:q.u.r,coreRadius,coreIntersections:0,wallX:wall.x,trajectory,blockedCentre:true,fullRadiusIntersectionFrames:overlaps.length,maxHorizontalOverlap:penetration};
});
await check('S01 optional gap close, basic approach/S00, and real next-turn retreat',()=>{
 const q=fixture('knight','sy-ground',2460),paid=fire(q,'S01',0,1),same=shot('knight','sy-ground',2460,'S00',0,1);assert(paid.damage['s23-B-0']>0);assert(!same.damage['s23-B-0']);assert.equal(paid.focusSpent,24);assert.equal(same.focusSpent,8);assert(C.validTerrainContactPose(q.b.terrain,q.u));
 const next=nextTurn(q),retreat=move(q,2460);assert(retreat.moveSpent>0);assert.equal(q.u.hp>0,true);const b=fixture('knight','sy-ground',2460),approach=move(b,2590),basic=fire(b,'S00',0,1);assert(basic.damage['s23-B-0']>0);assert.equal(basic.focusSpent,8);
 return{paid,sameAngleBasic:same,normalNextTurn:next,retreat,paidBranchInputs:q.inputs,basicApproach:approach,basic,basicIsFree:false};
});
await check('S04 reached by basic jump75, genuine manual dive, same S00 failure and lower S00 route',()=>{
 const q=fixture('knight','sy-ground',3140),startMove=q.u.moveLeft;assert(q.native(()=>q.e.jump(q.u)));assert.equal(startMove-q.u.moveLeft,75);q.inputs.push({op:'jump',cost:75});move(q,3260,{speed:.4});for(let n=0;n<300&&!q.e.grounded(q.u);n++)tick(q);assert(q.e.grounded(q.u));assert.equal(q.e.contactSurface(q.u.x,q.u.y-4,q.u.y+5)?.t.id,'sy-central-flank');move(q,3320);
 const approachCost=startMove-q.u.moveLeft,paid=fire(q,'S04',45,.5,{diveFrame:95}),same=shot('knight','sy-central-flank',paid.from.x,'S00',45,.5);assert(paid.dive);assert(paid.damage['s23-C-0']>0);assert(!same.damage['s23-C-0']);assert.equal(paid.focusSpent,34);assert(C.validTerrainContactPose(q.b.terrain,q.u));
 const next=nextTurn(q),retreat=move(q,3320);assert(retreat.moveSpent>0);const b=fixture('knight','sy-ground',3370),approach=move(b,3490),basic=fire(b,'S00',0,1);assert(basic.damage['s23-C-0']>0);assert.equal(basic.focusSpent,8);
 return{paid,sameAngleBasic:same,basicJumpApproach:{from:{x:3140},jumpCost:75,totalMoveSpent:approachCost},normalNextTurn:next,retreat,paidBranchInputs:q.inputs,lowerBasicApproach:approach,basic};
});
await check('O11 lands on real terrain and cannot select/E/lead the protected carrier',()=>{
 const q=fixture('occultist','sy-ground',2150,{escortStarted:true}),npc=q.e.unit('act3-carrier'),startNpc={x:npc.x,y:npc.y},paid=fire(q,'O11',24,.35),summon=q.b.units.find(u=>u.summoned);
 assert(summon);assert.equal(paid.focusSpent,55);assert(paid.contacts.some(h=>h.id==='sy-ground'));assert(C.validTerrainContactPose(q.b.terrain,summon));assert.equal(summon.summonRank,1);assert.equal(summon.summonOwner,q.u.id);assert.deepEqual(paid.to,{x:2150,y:4700});
 assert(!q.e.select(summon.id),'Actual actor selection rejects a summoned body');assert(!A.heroes(q.b).includes(summon));assert(!q.e.heroesAlive().includes(summon));assert(summon.x-npc.x>65,'The actual summoned body is ahead in the NPC lead area');
 assert(q.e.heroesAlive().every(h=>h.x<npc.x));for(let n=0;n<60;n++)q.native(()=>A.tick(q.app,C.STEP));assert.deepEqual({x:npc.x,y:npc.y},startNpc,'Summon cannot substitute for living companion leadership');
 const beforeEnemies=Object.fromEntries(q.e.alive(1).map(u=>[u.id,u.hp])),summonStart={x:summon.x,y:summon.y};let followFrames=0;
 for(;followFrames<2400;followFrames++){tick(q);q.native(()=>A.tick(q.app,C.STEP));if(q.e.canAct()&&q.e.active.id!==q.u.id)break;}
 assert(followFrames<2400);const summonDamage=Object.fromEntries(q.e.alive(1).filter(u=>beforeEnemies[u.id]>u.hp).map(u=>[u.id,beforeEnemies[u.id]-u.hp]));assert(summonDamage['s23-B-0']>0);assert(summon.x>summonStart.x);assert.deepEqual({x:npc.x,y:npc.y},startNpc);
 const same=shot('occultist','sy-ground',2150,'O01',24,.35,{negativeFriendlyDamage:true});assert(same.damage['act3-carrier']>0);assert(!same.damage['s23-B-0']);assert.equal(same.focusSpent,0);
 const alternative=shot('occultist','sy-ground',2460,'O01',-14.056267010654372,.6057562512328497);assert(alternative.damage['s23-B-0']>0);assert.equal(alternative.focusSpent,0);

 // E's active actor is a separate invalid-selection fixture, not a playable transition.
 const b=plain(q.b),e=new C.Engine(b,()=>{},false),app={...q.app,engine:e};b.active=summon.id;b.phase='aim';b.side=0;const eligibility=A.eligibility(app,b.honroMarkers.find(m=>m.id==='carrier-start'));assert.equal(eligibility.ok,false);
 return{paid,sameAngleBasicUnsafe:same,supportedBasicAlternative:alternative,summonFollowUp:{frames:followFrames,from:summonStart,to:{x:summon.x,y:summon.y},damage:summonDamage},npcBefore:startNpc,npcAfter:{x:npc.x,y:npc.y},summonCannotSelect:true,summonCannotLead:true,invalidSelectedSummonE:plain(eligibility),scope:'Supported source pose and escort prerequisites are setup; cast/landing and subsequent no-lead test are actual production. E rejection uses a separately cloned invalid-selection fixture.'};
});
await check('A02 current-map material boundary: wide cargo and rock stop; thin wood is absent',()=>{
 const wood=source.terrains.filter(t=>t.baseMaterial==='wood').map(t=>({id:t.id,width:Math.max(...t.points.map(p=>p.x))-Math.min(...t.points.map(p=>p.x))})),thin=wood.filter(t=>t.width<=90);
 const compiledWood=fixture('archer','sy-west-upper',4440).b.terrain.filter(t=>t.mat==='wood').map(t=>({id:t.id,width:t.w}));assert(!compiledWood.some(t=>t.width<=90),'No thin compiled wood collider, including element collisions');
 const cargo=shot('archer','sy-west-upper',4440,'A02',27.75,1),rock=shot('archer','sy-central-flank',4750,'A02',24,.75);
 assert(cargo.contacts.some(h=>h.id==='sy-cargo-stored'&&h.mat==='wood'));assert(!cargo.damage['s23-F-3']);assert(rock.contacts.some(h=>h.id==='sy-stone-corner'&&h.mat==='rock'));assert(rock.contacts.every(h=>!h.pierces));assert.equal(thin.length,0);
 gaps.push({skill:'A02',status:'unsupported-on-current-map',reason:'Both authored wood cargo colliders have width440; rank1 thin-wood pierce requires wood width<=90. No production thin wood was added and no substitute fixture is counted as a map success.',places:wood});
 return{wood,compiledWood,cargo,rock,thinWoodLocations:thin,mapThinWoodSuccess:false};
});

await check('geometry-only read consistency and unchanged live skill definitions',async()=>{const current=JSON.parse(await readFile('shared/data/campaign.json','utf8')).stages[22];assert.equal(hash(geometry(current)),geometrySha256,'Production geometry changed during test; rerun on final source');assert.equal(hash(geometry(g.HONRO_PROJECT.stages[22])),geometrySha256);assert.equal(hash(C.SKILLS),skillsSha256);return{geometrySha256,skillsSha256};});
await mkdir('_local/reports/stage23-escort',{recursive:true});await writeFile('_local/reports/stage23-escort/skill-roles.json',JSON.stringify({passed:failures.length===0,completeRoleAcceptance:false,completedAt:new Date().toISOString(),geometrySha256,skillsSha256,entry:ESCORT_ENTRY,rows,gaps,observations,failures,
 scope:'Actual Engine.fire/tick and ordinary movement/action cycles on full initial22 roster. Supported initial poses and O11 objective prerequisite state are fixtures. No post-setup actor/resource writes, consumables, production geometry, skill coefficient or enemy-stat edits. This is not normal entry/arrival, campaign completion, browser, native-art acceptance or deployment proof.'},null,2)+'\n');
assert.equal(failures.length,0,JSON.stringify(failures.map(({name,error})=>({name,error})),null,2));console.log('PASS Stage23 fixed live-role assertions',rows.length,'; design gaps',gaps.length);
