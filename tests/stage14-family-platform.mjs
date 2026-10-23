import {applyStage14Ceiling} from '../tools/map-forge/stage14-ceiling.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {applyStage14FamilyPlatform} from '../tools/map-forge/stage14-family-platform.mjs';
const plain=x=>JSON.parse(JSON.stringify(x)),before=JSON.parse(execFileSync('git',['show','6c950aea:shared/data/campaign.json'],{maxBuffer:40e6})),after=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
assert.deepEqual(plain(applyStage14FamilyPlatform(applyStage14Ceiling(structuredClone(before)))),after,'Exactly two local flags after the separately asserted current vault author; other shapes/actors/art/goals retained');assert.deepEqual(plain(applyStage14FamilyPlatform(structuredClone(after))),after);
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,id='v14-family-roof-step',rows=[];
for(const cls of C.CLASS_IDS){const q=battlefield(g,14),u=q.e.heroesAlive().find(u=>u.cls===cls);q.b.units=[u];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;
 Object.assign(u,{x:4300,y:6750,vx:0,vy:0,jumping:false,airborne:false});assert(C.validTerrainContactPose(q.b.terrain,u));const hp=u.hp,move=u.moveLeft;assert(q.e.jump(u));let minY=u.y,crossed=false,landed=false;
 for(let n=0;n<500;n++){q.e.tick(C.STEP);minY=Math.min(minY,u.y);if(u.y<6570&&u.y-u.h<6535)crossed=true;if(n>5&&!u.jumping&&q.e.grounded(u)){landed=q.e.contactSurface(u.x,u.y-1,u.y+1)?.t.id===id;break;}}
 for(let n=0;n<120;n++)q.e.tick(C.STEP);assert(crossed&&landed&&u.y===6535&&u.vy===0,JSON.stringify({cls,minY,y:u.y}));assert.equal(u.hp,hp);assert.equal(move-u.moveLeft,q.e.jumpCost(u));rows.push({cls,minY,landedY:u.y,hpExact:true,jumpCost:move-u.moveLeft});
 const skip=q.b.terrain.filter(t=>t.id!==id).map(t=>t.id),t=q.b.terrain.find(t=>t.id===id);assert(t.oneWay&&t.projectileSolid);for(const[a,z]of [[{x:4300,y:6650},{x:4300,y:6500}],[{x:4300,y:6500},{x:4300,y:6650}],[{x:4050,y:6550},{x:4550,y:6550}]])assert.equal(q.e.projectileCollision(a,z,3,u.id,[],false,skip)?.terrain?.id,id,'Weapon hits underside/top/side');
 // Existing ordinary one-way policy remains upward-transparent.
 const bridge=q.b.terrain.find(t=>t.id==='refuge-bridge-walkway');assert(!bridge.projectileSolid);const others=q.b.terrain.filter(t=>t!==bridge).map(t=>t.id);assert.equal(q.e.projectileCollision({x:3400,y:8250},{x:3400,y:8100},3,u.id,[],false,others),null);
}
{
 const profile=C.defaults();profile.recruited=C.CLASS_IDS;for(const cls of C.CLASS_IDS)profile.heroes[cls].xp=C.xpAtLevel(13);
 for(const id of ['M07','M10','M08','M09'])assert(C.train(profile.heroes.mage,id));profile.loadouts.mage=['M01','M09'];
 const q=battlefield(g,14,{profile}),mage=q.e.heroesAlive().find(u=>u.cls==='mage'),archer=q.e.heroesAlive().find(u=>u.cls==='archer');q.b.units=[mage,archer];q.b.active=mage.id;q.e.checkEnd=()=>false;
 for(const[u,x]of [[mage,4090],[archer,3990]])Object.assign(u,{x,y:6750,vx:0,vy:0,jumping:false,airborne:false});
 const prediction=q.e.predict(mage,C.SKILLS.M09,80,.5);assert.equal(prediction.terrain,id);assert(Math.abs(prediction.y-6535)<7);assert(q.e.fire('M09',80,.5));
 for(let n=0;n<5000&&!q.e.canAct();n++)q.e.tick(C.STEP);assert(q.e.canAct());assert.equal(q.b.stakes.length,2);const upper=q.b.stakes.find(s=>s.y<6600);assert(upper);assert(q.e.select(archer.id));const home=q.b.stakes.find(s=>s!==upper);for(let n=0;n<250&&Math.abs(archer.x-home.x)>12;n++){q.e.move(Math.sign(home.x-archer.x),C.STEP);q.e.tick(C.STEP);}assert(q.e.useGate(),JSON.stringify(q.e.gateResolution()));assert(Math.abs(archer.y-6535)<1&&C.validTerrainContactPose(q.b.terrain,archer));rows.push({case:'actual legal rank1 M09 cast and E gate use',angle:80,power:.5,upperStake:plain(upper),landing:{x:archer.x,y:archer.y},scope:'Two prepared supported starting actors, no enemies; no live correction/refill or fake stake'});
}
await mkdir('_local/reports/act2-ceiling-20261023',{recursive:true});await writeFile('_local/reports/act2-ceiling-20261023/platform.json',JSON.stringify({pass:true,scope:'One supported initial pose under actual family lintel; four finite normal Engine jumps, no resource/position edits after setup. Projectile three-face probes, unchanged ordinary bridge policy. Not user R9 save or normal combat.',rows},null,2)+'\n');console.log('PASS family jump-through, four classes, projectile solid faces and normal platform policy',rows);
