import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
function make(cls='mage',skill='M01'){const p=C.defaults(),st=g.HONRO_CONTENT.stages[0],b=g.HonroWorld.build(st,p,true,cls,skill,()=>C.createBattle(1,p,'practice',{party:[cls]}));return{b,e:new C.Engine(b,()=>{},false),p};}
{
 const {b,e,p}=make(),before=JSON.stringify(p),foes=e.alive(1);assert.equal(b.width,6000);assert.equal(b.height,2300);assert.equal(foes.length,20);assert.equal(foes.filter(u=>u.elite).length,1);assert.equal(b.enemyLimit,2);assert.equal(b.drafts.length,0);assert(b.practiceCombat);assert.equal(foes.filter(u=>u.fixed).length,4);
 assert.deepEqual(Object.fromEntries(['near','cluster','air','water','precision','elite'].map(id=>[id,foes.filter(u=>u.honroTrainingStation===id).length])),{near:3,cluster:6,air:4,water:4,precision:2,elite:1});
 assert(foes.every(u=>u.x-e.active.x>=460),'Entry has a clear preparation lane');
 const poses=b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}));for(let i=0;i<960;i++)e.stepUnits(C.STEP);
 for(const old of poses){const u=e.unit(old.id);assert(Math.hypot(u.x-old.x,u.y-old.y)<.1,old.id+' stable supported pose');assert.equal(u.hp,old.hp,old.id+' no passive damage');if(!u.fixed)assert(C.validTerrainContactPose(b.terrain,u),u.id+' ground contact');}
 assert.equal(JSON.stringify(p),before,'World/physics leave campaign profile unchanged');
 b.phase='transition';b.side=0;e.switchTeam();assert(b.queue.length<=2);assert(e.alive(1).filter(u=>!u.acted).length<=2);
 rows.push({check:'fresh composition and eight-second settling',count:20,air:4,elite:1,enemyActionCap:b.queue.length,poses});
}
// Real predicted/live projectiles in unchanged authored terrain. Only shooter
// position/loadout is controlled to isolate stations; this is not normal play.
for(const [station,cls,skill,x,targetIndex] of [['near','archer','A01',600,0],['cluster','mage','M05',2470,0],['air','archer','A01',2000,0],['water','mage','M01',3980,0],['precision','archer','A01',5480,1],['elite','archer','A01',3180,0]]){
 const {b,e}=make(cls,skill),u=e.active,target=e.alive(1).filter(v=>v.honroTrainingStation===station)[targetIndex];
 Object.assign(u,{x,y:g.HonroWorld.top(b,x,2200),focus:1000,maxFocus:1000,loadout:[skill],ranks:{[skill]:1},cooldowns:{},acted:false});b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
 const s=C.SKILLS[skill],hp=new Map(b.units.map(v=>[v.id,v.hp]));let aim=e.shotSeeds(u,s,target).find(a=>e.predict(u,s,a.angle,a.power,target,false).unit===target.id);
 if(!aim&&station==='cluster')aim=e.bestShot(u,s,target);
 if(!aim)outer:for(const power of [.2,.35,.5,.65,.8,1])for(let angle=-85;angle<=265;angle+=2)if(e.predict(u,s,angle,power,target,false).unit===target.id){aim={angle,power};break outer;}
 assert(aim,station+' supported clear shot');assert(e.fire(skill,aim.angle,aim.power),station+' accepted shot');
 for(let frame=0;frame<2000&&b.projectiles.length;frame++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 const hit=b.units.filter(v=>v.side===1&&v.hp<hp.get(v.id)).map(v=>({id:v.id,damage:hp.get(v.id)-v.hp}));assert(hit.length,station+' real damage');if(station==='cluster')assert(hit.length>=3,'Dense cluster enables real multi-target AoE');
 rows.push({check:'real projectile',station,cls,skill,shooter:{x:u.x,y:u.y},target:target.id,aim,hit});console.log('PASS',station,hit.length,'targets');
}
{
 const {b,e}=make('knight','S00'),u=e.active,t=e.alive(1).find(v=>v.honroTrainingStation==='near');Object.assign(u,{x:710,y:1400,loadout:['S00'],ranks:{S00:1},cooldowns:{},focus:1000,acted:false,facing:1});b.phase='aim';b.side=0;const hp=t.hp;assert(e.fire('S00',0,1));for(let i=0;i<240;i++)C.tickWarrior(e,C.STEP);assert(t.hp<hp);rows.push({check:'near station basic melee',shooterX:710,target:t.id,damage:hp-t.hp});
}
{
 const {b,e}=make('mage','M07'),u=e.active;Object.assign(u,{loadout:['M07'],ranks:{M07:1},focus:1000,cooldowns:{}});let aim;
 outer:for(const power of [.2,.35,.5])for(let angle=15;angle<=75;angle+=5){const hit=e.predict(u,C.SKILLS.M07,angle,power);if(hit.x>500&&hit.x<710&&Math.abs(hit.y-1400)<15){aim={angle,power};break outer;}}
 assert(aim,'Free preparation surface accepts a legal stake arc');assert(e.fire('M07',aim.angle,aim.power));for(let i=0;i<1800&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);assert.equal(b.stakes.length,1);assert(b.stakes[0].x>500&&b.stakes[0].x<710);rows.push({check:'safe preparation stake landing',aim,stake:{x:b.stakes[0].x,y:b.stakes[0].y}});
}
await mkdir('_local/reports/training-layout',{recursive:true});await writeFile('_local/reports/training-layout/runtime.json',JSON.stringify({scope:'Actual fresh training layout, real settling and controlled shooter live-projectile fixtures. Not normal-input/browser completion.',rows},null,2));
console.log('PASS training layout, profile preservation, settling, action cap and all station shots');
