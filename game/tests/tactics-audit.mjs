import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[];
const check=(name,fn)=>{checks.push({name,passed:true,detail:fn()});};
function arena(){const {b,e,app,st}=battlefield(g,2);b.width=4000;b.height=2000;b.terrain=[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:999999,maxHp:999999}];b.sceneVersion++;b.waters=[];b.zones=[];b.drafts=[];b.wind=0;b.units=[];return {b,e,app,st};}
const unit=(id,side,x,y,extra={})=>C.makeUnit('mage',side,x,y,{id,name:id,armor:0,shield:0,h:92,attack:1,hp:1000,maxHp:1000,awake:true,...extra});
for(const kind of ['bat','crow','lantern'])for(const dt of [1/120,1/30,.06])check(`${kind} flies in two dimensions at dt ${dt}`,()=>{
 const {b,e,st}=arena(),u=g.HonroWorld.createEnemy(b,st,450,kind,1,700,true),target=unit('hero',0,1600,1300);b.units=[u,target];b.side=1;b.phase='enemy';b.active=u.id;u.acted=false;
 // Block the straight horizontal lane: an open arena may legitimately prefer it.
 b.terrain.push({id:'flight-obstacle',x:610,y:600,w:50,h:200,mat:'rock',hp:99999,maxHp:99999});b.sceneVersion++;
 e.enemyAction();assert.ok(u.aiMove);const start={x:u.x,y:u.y},budget=u.moveLeft;assert.ok(budget<=280);const original=JSON.stringify(b);
 C.planEnemyMove(e,u,target);assert.equal(JSON.stringify(b),original,'planning is read only');
 let distance=0;for(let i=0;i<400&&u.aiMove;i++){const old={x:u.x,y:u.y};e.stepUnits(dt);distance+=Math.hypot(u.x-old.x,u.y-old.y);assert.ok(C.flightClear(e,u,u));}
 assert.ok(Math.abs(u.x-start.x)>20&&Math.abs(u.y-start.y)>20);assert.ok(distance<=280.001);assert.ok(Math.abs(budget-u.moveLeft-distance)<.01);assert.equal(u.aiMove,undefined);
 const end={x:u.x,y:u.y};for(let i=0;i<20;i++)e.stepUnits(dt);assert.equal(u.y,end.y,'hovering does not fall');
 return {distance,dx:u.x-start.x,dy:u.y-start.y};
});
for(const kind of ['bat','crow','lantern'])check(`${kind} stops at a new thin obstacle during flight`,()=>{
 const {b,e,st}=arena(),u=g.HonroWorld.createEnemy(b,st,400,kind,1,700),t=unit('hero',0,1500,700);b.units=[u,t];b.side=1;b.phase='enemy';b.active=u.id;
 u.aiMove={round:b.round,targetId:t.id,path:[{x:650,y:700,jump:false}],index:0,elapsed:0,stalled:0,lastX:u.x,lastY:u.y,jumping:false,intent:'flight'};
 b.terrain.push({id:'thin-wall',x:480,y:100,w:2,h:1200,hp:99999,maxHp:99999,mat:'rock'});b.sceneVersion++;
 e.stepUnits(1);assert.ok(u.x+u.r<480);assert.ok(C.flightClear(e,u,u));assert.equal(u.aiMove,undefined);return {x:u.x};
});
check('Flying plan resumes from serialized state',()=>{
 const {b,e,st}=arena(),u=g.HonroWorld.createEnemy(b,st,450,'bat',1,700),t=unit('hero',0,1600,1300);b.units=[u,t];b.phase='enemy';b.side=1;b.active=u.id;e.enemyAction();e.stepUnits(.1);
 const saved=JSON.parse(JSON.stringify(b)),resumed=new C.Engine(saved,()=>{},true),v=resumed.unit(u.id);const x=v.x;
 for(let i=0;i<240&&v.aiMove;i++)resumed.stepUnits(C.STEP);
 assert.ok(v.x>x);assert.ok(!v.aiMove);assert.ok(C.flightClear(resumed,v,v));
});
check('Stationary props and ground units are not classified as flyers',()=>{for(const u of [unit('dummy',1,0,0,{fixed:true}),unit('boss',1,0,0,{fixed:true,boss:6}),unit('guard',1,0,0)])assert.equal(C.flyingEnemy(u),false);});
check('Flight checks full body against sloped terrain, ceilings, bounds and other units',()=>{
 const {b,e}=arena(),u=unit('fly',1,600,700);b.units=[u];
 b.terrain.push({id:'slope',x:500,y:600,w:400,h:700,slope:300,mat:'rock',hp:9999,maxHp:9999});b.sceneVersion++;
 assert.equal(C.flightClear(e,u,{x:600,y:700}),false);assert.equal(C.flightClear(e,u,{x:600,y:500}),true);
 assert.equal(C.flightClear(e,u,{x:10,y:400}),false);assert.equal(C.flightClear(e,u,{x:600,y:60}),false);
 b.units.push(unit('neighbor',1,610,500));assert.equal(C.flightClear(e,u,{x:600,y:500}),false);
});
// Controlled predicted endpoints isolate policy from aim-search precision, using real damage stats.
function exchange({friends=1,foes=2,ally=false,weak=false}={}){
 const {b,e}=arena(),u=unit('shooter',ally?2:1,200,1000,{honroAlly:ally}),target=unit('target',ally?1:0,820,1000);
 b.units=[u,target];for(let i=1;i<foes;i++)b.units.push(unit('foe'+i,target.side,850+i*10,1000));
 for(let i=0;i<friends;i++)b.units.push(unit('friend'+i,u.side,800-i*12,1000,{hp:weak?5:1000}));
 const skill={...C.SKILLS.M01,radius:180,damage:100};e.predict=()=>({x:800,y:950,unit:friends?'friend0':target.id,points:[],closest:20,apex:false});
 return {b,e,u,target,skill};
}
check('Useful splash may hit a teammate when opposing damage is greater',()=>{const {e,u,target,skill}=exchange();const v=C.shotViable(e,u,skill,target,0,.5);assert.equal(v.ok,true);assert.ok(v.enemyDamage>v.friendlyDamage);return v;});
check('Friendly-only shots remain rejected',()=>{const {b,e,u,target,skill}=exchange({foes:1});target.x=1500;const v=C.shotViable(e,u,skill,target,0,.5);assert.equal(v.ok,false);return v;});
check('Higher friendly cost remains rejected',()=>{const {e,u,target,skill}=exchange({friends:3,foes:1});assert.equal(C.shotViable(e,u,skill,target,0,.5).ok,false);});
check('A friendly shield also counts as a cost',()=>{const {b,e,u,target,skill}=exchange({friends:3,foes:1});for(const v of b.units.filter(v=>v.side===u.side))v.shield=1000;assert.equal(C.shotViable(e,u,skill,target,0,.5).ok,false);});
check('Allied NPC projectile friendly damage is included in shot cost',()=>{const {e,u,target,skill}=exchange({friends:3,foes:1,ally:true});const v=C.shotViable(e,u,skill,target,0,.5);assert.equal(v.ok,false);assert(v.friendlyDamage>0);return v;});
check('Terrain impact without reachable opposing damage remains rejected',()=>{const {e,u,target,skill}=exchange();e.predict=()=>({x:300,y:950,terrain:'wall',points:[],closest:500,apex:false});assert.equal(C.shotViable(e,u,skill,target,0,.5).ok,false);});
check('Betrayal target can be deliberately attacked',()=>{const {b,e,u,target,skill}=exchange({friends:0,foes:1});target.side=u.side;assert.equal(C.shotViable(e,u,skill,target,0,.5,target.id).ok,true);});
check('Ally uses the same power for evaluation and actual firing',()=>{
 const {b,e,u,target}=exchange({friends:0,foes:1,ally:true});u.allyRole='daoist';target.x=800;e.predict=()=>({x:800,y:950,unit:target.id,points:[],closest:0,apex:false});e.bestShot=()=>({angle:45,power:1,score:200});
 const aim=g.HonroAllies.safeAllyAim(e,u,C.SKILLS.M01,target);assert.ok(aim);assert.ok(aim.power<=.82);
});
check('Real trajectory search finds and fires a useful crowded-area attack',()=>{
 const {b,e}=arena(),u=unit('shooter',1,350,1500,{loadout:['M01'],lastAct:1,focus:500,maxFocus:500,fixed:true}),friend=unit('friend',1,850,1500),target=unit('hero',0,900,1500),other=unit('other',0,940,1500);
 b.units=[u,friend,target,other];b.active=u.id;b.phase='enemy';b.side=1;
 const skill=C.SKILLS.M01,aim=e.bestShot(u,skill,target),verdict=C.shotViable(e,u,skill,target,aim.angle,aim.power);assert.ok(verdict.ok);
 e.enemyAction();assert.equal(b.phase,'flight');assert.ok(b.projectiles.length);const before=target.hp+other.hp;
 for(let n=0;n<1500&&b.projectiles.length;n++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 assert.ok(target.hp+other.hp<before);return {aim,enemyDamage:before-target.hp-other.hp,friendlyDamage:1000-friend.hp};
});
check('Enemy retargets when the preferred opponent is obstructed',()=>{
 const {b,e}=arena(),u=unit('shooter',1,200,1500,{fixed:true,lastAct:1,loadout:['M01']}),first=unit('blocked',0,650,1500),second=unit('open',0,1150,1500);
 b.units=[u,first,second];b.active=u.id;b.side=1;b.phase='enemy';
 e.bestShot=(_u,_s,t)=>({angle:t.id===first.id?100:20,power:.5,score:100});
 e.predict=(_u,_s,angle)=>angle>60?{x:300,y:1000,terrain:'wall',points:[],closest:500,apex:false}:{x:second.x,y:second.y-45,unit:second.id,points:[],closest:0,apex:false};
 e.enemyAction();assert.equal(b.phase,'flight');assert.equal(u.angle,20);assert.ok(b.projectiles.length);
});
check('Ranged ally retargets and retains the allied queue',()=>{
 const {b,e,app}=arena(),u=unit('ally',2,200,1500,{honroAlly:true,allyRole:'daoist'}),hero=unit('hero',0,100,1500),first=unit('blocked',1,650,1500),second=unit('open',1,1150,1500);
 b.units=[u,hero,first,second];b.active=u.id;b.side=0;b.phase='ally';b.mode='practice';
 b.honroState.allyQueue={ids:[u.id],index:0,returnActive:hero.id,phase:'act',elapsed:0,started:false,targetId:first.id};
 e.bestShot=(_u,_s,t)=>({angle:t.id===first.id?100:20,power:.5,score:100});
 e.predict=(_u,_s,angle)=>angle>60?{x:300,y:1000,terrain:'wall',points:[],closest:500,apex:false}:{x:second.x,y:second.y-45,unit:second.id,points:[],closest:0,apex:false};
 g.HonroAllies.tick(app,e,C.STEP,()=>{});assert.equal(b.phase,'ally');assert.equal(b.honroState.allyQueue.targetId,second.id);assert.equal(b.honroState.allyQueue.phase,'flight');assert.ok(b.projectiles.length);
});
await writeFile(gameRoot+'/../_local/game-reports/tactics-audit.json',JSON.stringify({checks},null,2)+'\n');console.log(`${checks.length} flight and tactical shot checks passed`);
