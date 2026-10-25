import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
function make(cls='mage',skill=C.baseSkill(cls)){const p=C.defaults(),st=g.HONRO_CONTENT.stages[0],b=g.HonroWorld.build(st,p,true,cls,skill,()=>C.createBattle(1,p,'practice',{party:[cls]}));return{b,e:new C.Engine(b,()=>{},false),p};}
{
 const {b,e,p}=make(),before=JSON.stringify(p),foes=e.alive(1);assert.equal(foes.length,18);assert.equal(foes.filter(u=>u.elite).length,1);assert.equal(b.enemyLimit,2);assert(b.practiceCombat);assert.equal(foes.filter(u=>u.fixed).length,3);
 assert.deepEqual(Object.fromEntries(['precision','elevation','shelter','water','mixed','air','elite'].map(id=>[id,foes.filter(u=>u.honroTrainingStation===id).length])),{precision:2,elevation:3,shelter:2,water:3,mixed:4,air:3,elite:1});
 assert(foes.every(u=>u.x-e.active.x>=500));const poses=b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}));for(let i=0;i<960;i++)e.stepUnits(C.STEP);
 for(const old of poses){const u=e.unit(old.id);assert(Math.hypot(u.x-old.x,u.y-old.y)<.1,old.id+' stable supported pose');assert.equal(u.hp,old.hp);if(!u.fixed)assert(C.validTerrainContactPose(b.terrain,u));}
 assert.equal(JSON.stringify(p),before);b.phase='transition';b.side=0;e.switchTeam();assert(b.queue.length<=2);rows.push({check:'composition, settling, campaign profile isolation',poses,enemyActionCap:b.queue.length});
}
// Continuous real movement through every through-route and back, with all four
// production bodies. Extended move budget isolates geometry across many turns;
// no mid-route pose, velocity, health or gravity correction is used.
for(const cls of C.CLASS_IDS){
 const {b,e}=make(cls),u=e.active;b.units=[u];e.checkEnd=()=>false;u.moveLeft=u.maxMove=20000;const hp=u.hp,hops=[];
 for(const [action,x]of [['walk',1580],['jump',1680],['jump',1910],['drop',1910],['walk',2410],['jump',2480],['jump',2600],['walk',2780],['walk',3500],['walk',4900],['walk',5800],['walk',3500],['walk',2700],['walk',2500],['walk',1200]]){
  assert(action==='jump'?e.jump():action==='drop'?e.drop():true,cls+' '+action);let frames=0;
  for(;frames<1500;frames++){if(action!=='drop'&&Math.abs(x-u.x)>1)e.move(Math.sign(x-u.x)*Math.min(1,Math.abs(x-u.x)/(u.walkSpeed*C.STEP)),C.STEP);e.integrateBody(u,C.STEP);if(action==='walk'){if(Math.abs(x-u.x)<1&&e.grounded(u))break;}else if(frames>2&&e.grounded(u)&&!u.platformDrop)break;}
  assert(frames<1500,cls+' route blocked '+x);assert(Math.abs(x-u.x)<2);assert.equal(u.hp,hp);hops.push({action,x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-.15,u.y+.15)?.t?.id});
 }
 rows.push({check:'continuous four-body traversal',cls,hops});
}
// Controlled shooter poses, real authored terrain, actual predicted/live shots.
for(const [station,cls,skill,x]of [['precision','archer','A01',600],['elevation','archer','A01',1480],['water','mage','M01',3980],['mixed','mage','M05',5180],['shelter','occultist','O04',2760],['air','archer','A01',5400]]){
 const {b,e}=make(cls,skill),u=e.active,target=e.alive(1).find(v=>v.honroTrainingStation===station);
 Object.assign(u,{x,y:g.HonroWorld.top(b,x,2200),focus:1000,maxFocus:1000,loadout:[skill],ranks:{[skill]:1},cooldowns:{},acted:false});b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
 const s=C.SKILLS[skill],hp=new Map(b.units.map(v=>[v.id,v.hp]));let aim=e.shotSeeds(u,s,target).find(a=>e.predict(u,s,a.angle,a.power,target,false).unit===target.id);
 if(!aim&&station==='mixed')aim=e.bestShot(u,s,target);
 if(!aim)outer:for(const power of [.2,.35,.5,.65,.8,1])for(let angle=-85;angle<=265;angle+=2)if(e.predict(u,s,angle,power,target,false).unit===target.id){aim={angle,power};break outer;}
 assert(aim,station+' legal shot');assert(e.fire(skill,aim.angle,aim.power));
 for(let frame=0;frame<2000&&b.projectiles.length;frame++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 const hit=b.units.filter(v=>v.side===1&&v.hp<hp.get(v.id)).map(v=>({id:v.id,damage:hp.get(v.id)-v.hp}));assert(hit.length,station+' live damage');if(station==='mixed')assert(hit.length>=3,'Mixed cluster supports AoE');rows.push({check:'real projectile',station,cls,skill,aim,hit});console.log('PASS',station,hit.length,'targets');
}
{
 const {b,e}=make('knight','S00'),u=e.active,t=e.alive(1).find(v=>v.honroTrainingStation==='precision');Object.assign(u,{x:750,y:g.HonroWorld.top(b,750,2200),loadout:['S00'],ranks:{S00:1},cooldowns:{},focus:1000,acted:false,facing:1});b.phase='aim';b.side=0;const hp=t.hp;assert(e.fire('S00',0,1));for(let i=0;i<240;i++)C.tickWarrior(e,C.STEP);assert(t.hp<hp);rows.push({check:'precision yard melee approach',damage:hp-t.hp});
}
{
 const {b,e}=make('mage','M11'),u=e.active;Object.assign(u,{x:3000,y:g.HonroWorld.top(b,3000,2200),loadout:['M11'],ranks:{M11:1},focus:1000,cooldowns:{}});b.phase='aim';b.side=0;assert(e.fire('M11',80,.45));let reflected=false;
 for(let i=0;i<1200&&b.projectiles.length;i++)for(const p of [...b.projectiles]){if(!b.projectiles.includes(p))continue;e.stepProjectile(p,C.STEP);if(b.projectiles.some(v=>v.bounces>0))reflected=true;}
 assert(reflected,'Shelter ceiling supports actual reflection');rows.push({check:'actual shelter reflection',reflected});
}
await mkdir('_local/reports/training-layout',{recursive:true});await writeFile('_local/reports/training-layout/runtime.json',JSON.stringify({scope:'Production geometry and skills; controlled shot poses and extended-budget traversal are diagnostics, not a normal-combat clear.',rows},null,2));console.log('PASS training terrain, traversal, four-character interactions and isolation');
