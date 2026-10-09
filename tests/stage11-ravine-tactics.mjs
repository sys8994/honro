// Isolated production-projectile fixtures on the actual Stage 11 geometry and
// its authored enemies. Only the firing hero is posed at an authored support.
// This is tactical hit evidence, not traversal or a normal-combat completion.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,stage=g.HONRO_PROJECT.stages[10],pockets=stage.design.ravine?.tacticalPockets,rows=[];
assert(pockets?.reflection&&pockets.refugeMouth&&pockets.eastFire,'All three authored tactical places must exist');
const enemyIds=stage.units.filter(u=>u.team==='enemy').map(u=>u.id);
assert.equal(enemyIds.length,45,'Localized tactics do not add enemies');
function fixture(cls,point,sourceStage=stage,sourceProject=g.HONRO_PROJECT){
 const profile=C.defaults();profile.settings.difficulty='normal';profile.recruited=['archer','mage','knight','occultist'];
 for(const cls of profile.recruited)profile.heroes[cls].xp=C.xpAtLevel(10);
 // Optional reflection is demonstrated at legal rank 1 through the real skill
 // training API; the basic-shot controls need no learned special skill.
 for(const id of ['M03','M11','M06','M02','M04'])assert(C.train(profile.heroes.mage,id),'rank 1 skill is learnable at actual level 10: '+id);
 profile.loadouts.mage=['M01','M11','M04'];profile.loadouts.archer=['A01'];
 const b=g.HonroMaps.createBattle(sourceStage,sourceProject,profile,{origin:'campaign'}),events=[],e=new C.Engine(b,ev=>events.push(ev),true),hero=b.units.find(u=>u.side===0&&u.cls===cls);
 Object.assign(hero,{x:point.x,y:point.y,vx:0,vy:0,acted:false});b.active=hero.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 assert.equal(hero.level,10);assert(C.validTerrainContactPose(b.terrain,hero),cls+' firing site must be real, exposed terrain');assert.equal(e.alive(1).length,45);
 const app={engine:e,stage:g.HONRO_CONTENT.stages[10],profile,training:false,event(){},sayLines(){},checkMission(){return false;}};g.HonroAct2.attach(app,e);
 return{b,e,hero,events};
}
function fire(q,skill,aim){
 const before=Object.fromEntries(q.b.units.map(u=>[u.id,u.hp])),hits=[],contacts=[],impact=q.e.impact.bind(q.e),terrainBefore=JSON.stringify(q.b.terrain),rosterBefore=q.b.units.map(u=>u.id),focus=q.hero.focus;
 q.e.impact=function(p,h){if(h.terrain)contacts.push({id:h.terrain.id,x:h.x,y:h.y,bounces:p.bounces});if(h.unit)hits.push({id:h.unit.id,bounces:p.bounces});return impact(p,h);};
 assert(q.e.fire(skill,aim.angle,aim.power),skill+' must launch through Engine.fire');
 for(let frame=0;frame<1800&&q.b.projectiles.length;frame++)for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p))q.e.stepProjectile(p,C.STEP);
 assert.equal(q.b.projectiles.length,0,'A live projectile resolves rather than timing out');
 assert.equal(JSON.stringify(q.b.terrain),terrainBefore,'No geometry is deleted or opened to make a shot pass');assert.deepEqual(q.b.units.map(u=>u.id),rosterBefore,'No bodies are inserted or removed');
 const damage=Object.fromEntries(q.b.units.filter(u=>before[u.id]>u.hp).map(u=>[u.id,before[u.id]-u.hp]));
 for(const resident of q.b.units.filter(u=>u.honroProtected))assert.equal(resident.hp,before[resident.id],'Tactical sample must not harm the resident');
 return{skill,aim,from:{x:q.hero.x,y:q.hero.y},damage,contacts,hits,focusSpent:focus-q.hero.focus};
}
function aimedBasic(q,target){
 for(const aim of q.e.shotSeeds(q.hero,C.SKILLS.A01,target))if(q.e.predict(q.hero,C.SKILLS.A01,aim.angle,aim.power,target,false).unit===target.id)return aim;
 for(const power of [.35,.5,.65,.8,1])for(let angle=-85;angle<=265;angle+=2)if(q.e.predict(q.hero,C.SKILLS.A01,angle,power,target,false).unit===target.id)return{angle,power};
 throw Error('No actual basic arrow from the authored firing point to '+target.id);
}
// 1. Fire away from the guard: the real stone face and shelf return the wave.
// The identical basic direction stops at the wall; using the western flank gives a free
// basic alternative, so knowing M11 is never an entrance/completion requirement.
{
 const spot=pockets.reflection.shooter,targetId='rv11-ritual-court-guard-3',q=fixture('mage',spot),target=q.e.unit(targetId),aim={angle:14,power:1};
 assert.equal(target.honroEncounterSupport,pockets.reflection.ledgeId);assert(target.x<q.hero.x);
 const preview=q.e.predict(q.hero,C.SKILLS.M11,aim.angle,aim.power,target,false);assert.equal(preview.unit,targetId);assert(preview.contacts.length>=1);
 const bounced=fire(q,'M11',aim);assert(bounced.damage[targetId]>0);assert(bounced.contacts.some(c=>c.id===pockets.reflection.wallId));assert(bounced.hits.some(h=>h.id===targetId&&h.bounces>=1));
 const stopped=fire(fixture('mage',spot),'M01',aim);assert.equal(stopped.damage[targetId]||0,0);assert(stopped.contacts.some(c=>c.id===pockets.reflection.wallId),'Solid wall stops the equivalent non-reflecting shot');
 const flankX=target.x-120,flank={x:flankX,y:C.topAt(q.b.terrain.find(t=>t.id===pockets.reflection.ledgeId),flankX)};
 const direct=fire(fixture('mage',flank),'M01',{angle:0,power:.8});assert(direct.damage[targetId]>0,'Untrained basic attack remains a real alternative');
 rows.push({place:'ritual-reflection',target:targetId,bounced,nonReflectingControl:stopped,basicAlternative:direct});console.log('PASS ritual: live stone/shelf reflections hit the authored elite; basic alternatives remain');
}
// 2. The short mouth places the two existing opponents on a shared low lane.
// A free basic pressure wave damages both; one ordinary arrow hits only one.
{
 const ids=['rv11-refuge-two-levels-0','rv11-refuge-two-levels-1'],spot=pockets.refugeMouth.shooter,q=fixture('mage',spot),roof=q.b.terrain.find(t=>t.id===pockets.refugeMouth.ceilingId);
 assert(roof&&!roof.oneWay,'The mouth has an actual solid stone ceiling');
 const actors=ids.map(id=>q.e.unit(id));assert(actors.every(u=>u.x>=9160&&u.x<9340),'The original pair occupies the short mouth');
 const wave=fire(q,'M01',{angle:168,power:1});assert(ids.every(id=>wave.damage[id]>0),'One real explosion must damage both existing actors');assert.equal(wave.focusSpent,0,'AOE example works with the free basic wave');
 const arrowFixture=fixture('archer',spot),arrow=fire(arrowFixture,'A01',aimedBasic(arrowFixture,arrowFixture.e.unit(ids[0])));assert.equal(ids.filter(id=>arrow.damage[id]>0).length,1,'Single-shot control does not silently inherit area damage');
 rows.push({place:'refuge-mouth',targets:ids,headroom:pockets.refugeMouth.minimumHeadroom,wave,singleTargetControl:arrow});console.log('PASS refuge mouth: one free pressure wave hits two; an ordinary arrow hits one; resident safe');
}
// 3. The same live target can be engaged from either real level. The upper
// descending line and lower rising line use materially different launch angles.
{
 const targetId='rv11-east-stone-overwatch-4',shots=[];
 for(const level of ['upper','lower']){const q=fixture('archer',pockets.eastFire[level]),target=q.e.unit(targetId),aim=aimedBasic(q,target),shot=fire(q,'A01',aim);assert(shot.damage[targetId]>0);assert.equal(shot.focusSpent,0);shots.push({level,...shot});}
 assert(pockets.eastFire.lower.y-pockets.eastFire.upper.y>180,'Two genuinely different exposed levels');assert(shots[0].aim.angle<0&&shots[1].aim.angle>0,'Upper line descends; lower line rises');assert(Math.abs(shots[0].aim.angle-shots[1].aim.angle)>35);
 rows.push({place:'east-high-low-fire',target:targetId,shots});console.log('PASS east bay: live free arrows hit the same authored target from both levels with distinct angles');
}
// Dense current groups are also tested as groups, rather than proving only a
// conveniently isolated target. Identical casts can optionally be replayed
// against a supplied before project for matched before/after evidence.
const baselineFile=process.argv.find(a=>a.startsWith('--baseline='))?.slice(11),baseline=baselineFile?JSON.parse(await readFile(baselineFile,'utf8')):null;
for(const [place,support,x,skill,aim,minimum]of[
 ['west-knot','rv-west-shoulder',3990,'M04',{angle:160.73473053612193,power:.5849207155832319},3],
 ['ritual-front','rv-ritual-reflection-ledge',7010,'M01',{angle:218.14212362266593,power:.5187436204852842},2],
 ['east-cordon','rv-east-tower',12000,'M04',{angle:139.10958679603954,power:.8703141875905972},4]
]){
 const terrain=g.HonroMaps.compile(stage,g.HONRO_PROJECT).terrain.find(t=>t.id===support),point={x,y:C.topAt(terrain,x)},q=fixture('mage',point),shot=fire(q,skill,aim),damaged=Object.keys(shot.damage).filter(id=>q.e.unit(id)?.side===1);
 assert(damaged.length>=minimum,place+' must produce actual multi-enemy damage');
 const before=baseline?fire(fixture('mage',point,baseline.stages[10],baseline),skill,aim):null;
 rows.push({place,comparison:'dense group area attack',minimumDamaged:minimum,blastRadius:C.SKILLS[skill].radius,secondaryReach:skill==='M04'?260:null,after:shot,...(before?{before}:{}),damaged});console.log('PASS',place,skill,'damages',damaged.length,'actual enemies',before?'(same cast before: '+Object.keys(before.damage).length+')':'');
}
await mkdir('_local/reports/stage11-ravine',{recursive:true});await writeFile('_local/reports/stage11-ravine/tactical-shots.json',JSON.stringify({rows,actualLevel:10,optionalReflectionRank:1,initialEnemies:45,bodyCountChanged:false,geometryRemoved:false,scope:'Isolated shots from authored supported firing poses, using real level-10 heroes, actual campaign enemies and production Engine.fire/stepProjectile. This is not movement to these sites, a normal-input combat clear or browser verification.'},null,2)+'\n');
