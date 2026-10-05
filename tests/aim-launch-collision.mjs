import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,checks=[];
function check(name,fn){const detail=fn();checks.push({name,detail});console.log('PASS',name);}
function trace(e,id,angle,power){
 const u=e.active,s=C.SKILLS[id];Object.assign(u,{angle,lastPower:power,loadout:[id],focus:10000,maxFocus:10000,cooldowns:{},acted:false,retreat:false});u.ranks[id]=8;
 const before=JSON.stringify(e.b),pr=C.guidePrediction(e,u,s,power);assert.equal(JSON.stringify(e.b),before,'prediction mutated battle');
 assert(e.fire(id,angle,power));const shot=e.b.projectiles[0],samples=[{x:shot.x,y:shot.y}];
 for(let i=0;i<1600&&e.b.projectiles.includes(shot);i++){e.stepProjectile(shot,C.STEP);samples.push({x:shot.x,y:shot.y});}
 assert(!e.b.projectiles.includes(shot),'shot did not finish');
 assert(Math.hypot(pr.x-shot.x,pr.y-shot.y)<.1,`${id} predicted/live endpoint mismatch ${pr.x},${pr.y} / ${shot.x},${shot.y}`);
 return {pr,shot,samples};
}
function arena(id,wall='rock',width=35){
 const {b,e}=battlefield(g,1),u=e.active;u.cls=C.SKILLS[id].cls;Object.assign(u,{x:1000,y:1900,h:92,angle:0,vx:0,vy:0,airborne:false});
 Object.assign(b,{width:3000,height:2400,wind:0,units:[u],waters:[],fields:[],zones:[],drafts:[],projectiles:[],terrain:[
  {id:'floor',x:0,y:1900,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999},
  {id:'near-wall',x:1025,y:1650,w:width,h:250,mat:wall,hp:99999,maxHp:99999,indestructible:true},
  {id:'far-wall',x:1280,y:1650,w:50,h:250,mat:'rock',hp:99999,maxHp:99999,indestructible:true}
 ]});b.sceneVersion++;return{b,e,u};
}
check('Stage 1 near-hill muzzle is outside rock and the actual A01/A02 shots stop exactly on the predicted face',()=>{
 const rows=[];
 for(const id of ['A01','A02']){const {b,e}=battlefield(g,1),u=e.active;Object.assign(u,{x:3215,y:e.surface(3215).y,angle:12});const raw=e.origin(u,12);assert(b.terrain.some(t=>C.terrainContains(t,raw.x,raw.y)),'fixture no longer reproduces embedded muzzle');
  const {pr,samples}=trace(e,id,12,.18);assert.equal(pr.terrain,'forest-floor');assert(pr.points.length<=3);assert(samples.every(p=>!b.terrain.some(t=>C.terrainContains(t,p.x,p.y))));rows.push({id,endpoint:[pr.x,pr.y],samples:samples.length});
 }return rows;
});
check('Ordinary arrow and qi stop at nearby solids, while A02 crosses only thin wood and still stops at rock',()=>{
 const rows=[];
 for(const [id,mat,width,expected] of [['A01','wood',35,'near-wall'],['M01','rock',35,'near-wall'],['A02','wood',35,'far-wall'],['A02','wood',120,'near-wall'],['A02','rock',35,'near-wall']]){
  const {e}=arena(id,mat,width),{pr}=trace(e,id,0,.8);assert.equal(pr.terrain,expected);rows.push({id,mat,width,hit:pr.terrain,x:pr.x});
 }return rows;
});
check('Explicit terrain/all phasing preserves its original muzzle and the live path through the same rock',()=>{
 const rows=[];for(const id of ['O02','O04']){const {b,e,u}=arena(id),raw=e.origin(u,0),origin=e.projectileOrigin(u,C.SKILLS[id],0);assert.deepEqual(origin,raw);
  const {pr,samples}=trace(e,id,0,.8);assert(samples.some(p=>C.terrainContains(b.terrain[1],p.x,p.y)));assert(!pr.terrain);assert(pr.x>1060);rows.push({id,phase:C.SKILLS[id].phase,endpoint:[pr.x,pr.y]});
 }return rows;
});
check('A timed ice-gourd endpoint does not display its earlier bounce as a terminal terrain hit',()=>{
 const {b,e,u}=arena('M02');b.terrain=b.terrain.slice(0,2);Object.assign(b.terrain[1],{x:1100,y:1300,w:100,h:600});b.sceneVersion++;
 const {pr}=trace(e,'M02',75,.8);assert.equal(pr.terrain,'floor');assert(pr.contacts.length>0);assert.equal(pr.terrainAtEnd,false);
 const contact=pr.contacts.at(-1);assert(Math.hypot(pr.x-contact.x,pr.y-contact.y)>20);
 const calls=[],ctx=new Proxy({},{get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});C.drawTerrainGuideContact(ctx,e,u,pr,.68);assert.equal(calls.length,0,'airborne timed burst got a blocked-terrain mark');
 const direct=arena('M01'),hit=trace(direct.e,'M01',0,.8).pr;assert.equal(hit.terrainAtEnd,true);C.drawTerrainGuideContact(ctx,direct.e,direct.u,hit,.68);assert(calls.some(c=>c[0]==='stroke'),'real qi collision lost its terrain mark');
 return{detonation:[pr.x,pr.y],lastBounce:[contact.x,contact.y],contacts:pr.contacts.length};
});
check('Scheduled follow-up volleys use the same non-embedded muzzle and collide normally',()=>{
 const {e,u,b}=arena('A01');u.loadout=['A01'];u.ranks.AP01=3;assert(e.fire('A01',0,.8));for(const p of [...b.projectiles])e.stepProjectile(p,C.STEP);e.stepVolley(.51);
 const repeat=b.projectiles.find(p=>p.followup);assert(repeat);assert(!C.terrainContains(b.terrain[1],repeat.x,repeat.y));e.stepProjectile(repeat,C.STEP);assert(!b.projectiles.includes(repeat));return{repeatEndpoint:[repeat.x,repeat.y]};
});
check('Launch correction does not change an unobstructed origin or polygon tangent/escape movement collision',()=>{
 const {e,u}=arena('A01');assert.deepEqual(e.projectileOrigin(u,C.SKILLS.A01,180),e.origin(u,180));
 const t={id:'slope',x:0,y:0,w:100,h:100,slope:30,mat:'rock',hp:1,maxHp:1};
 assert.equal(C.segmentTerrain({x:20,y:6},{x:50,y:15},t),null);assert.equal(C.segmentTerrain({x:20,y:6},{x:20,y:-10},t),null);assert(C.segmentTerrain({x:20,y:-10},{x:20,y:10},t));return true;
});
await mkdir('_local/reports/visual-playability/aim-visibility',{recursive:true});await writeFile('_local/reports/visual-playability/aim-visibility/unit.json',JSON.stringify({checks},null,2)+'\n');
