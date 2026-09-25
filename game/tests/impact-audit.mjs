import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),checks=[];
function setup(){
 const {b,e,events}=battlefield(g,2),u=e.active;
 b.units=[u];b.width=4000;b.height=5000;b.waters=[];b.drafts=[];
 b.terrain=[{id:'floor',x:0,y:4000,w:4000,h:1000,mat:'rock',hp:999999,maxHp:999999}];b.sceneVersion++;
 Object.assign(u,{x:900,y:4000,vx:0,vy:0,jumping:false,airborne:false,armor:0,shield:0,hp:1000,maxHp:1000});
 return {b,e,u,events};
}
const check=(name,fn)=>{const detail=fn();checks.push({name,passed:true,detail});};
for(const dt of [1/120,1/60,1/30])for(const gap of [0,1,3,5,9,20])check(`fast landing at gap ${gap}, dt ${dt}`,()=>{
 const {e,u,events}=setup();u.y-=gap;u.vy=1000;
 for(let n=0;n<20;n++)e.integrateBody(u,dt);
 assert.ok(u.hp<950&&u.hp>920,`${u.hp}`);assert.equal(u.y,4000);
 assert.equal(events.filter(ev=>ev.text==='낙하 충격').length,1,'one damage application per landing');
 return {damage:1000-u.hp};
});
for(const height of [50,300,1200,2000])check(`free fall from ${height}`,()=>{
 const {e,u}=setup();u.y-=height;
 for(let n=0;n<1200&&u.y<4000;n++)e.integrateBody(u,1/120);
 assert.equal(u.y,4000);if(height<=300)assert.equal(u.hp,1000);else assert.ok(u.hp<1000);
 return {height,damage:1000-u.hp};
});
check('ordinary jump and repeated resting contacts do not injure',()=>{
 const {e,u}=setup();assert.ok(e.jump(u));for(let n=0;n<400;n++)e.integrateBody(u,1/120);
 assert.equal(u.hp,1000);assert.equal(u.y,4000);
});
check('silent AI traversal probes never inflict damage',()=>{const {e,u,events}=setup();u.y-=2;u.vy=1200;e.integrateBody(u,1/120,true);assert.equal(u.hp,1000);assert.equal(events.length,0);});
for(const speed of [200,360,480])check(`knockback into wall at speed ${speed}`,()=>{
 const {b,e,u}=setup();b.terrain.push({id:'wall',x:1000,y:3600,w:100,h:1400,mat:'rock',hp:999999,maxHp:999999});b.sceneVersion++;
 u.x=990;u.y=3900;e.impulse(u,speed,0);
 for(let n=0;n<20;n++)e.integrateBody(u,1/120);
 if(speed===200)assert.equal(u.hp,1000);else assert.ok(u.hp<1000);
 return {speed,damage:1000-u.hp};
});
check('stronger impact increases damage with a 30% per-impact cap',()=>{
 const damage=[];for(const speed of [850,1000,1400,3000]){const {e,u}=setup();u.y-=1;u.vy=speed;e.integrateBody(u,1/120);damage.push(1000-u.hp);}
 assert.ok(damage.every((d,i)=>d>0&&d<=300&&(!i||d>damage[i-1])));return damage;
});
check('collision damage can defeat a unit',()=>{const {e,u}=setup();u.hp=1;u.y-=2;u.vy=1200;e.integrateBody(u,1/120);assert.equal(u.hp,0);assert.equal(u.dead,true);});
await writeFile(gameRoot+'/reports/impact-audit.json',JSON.stringify({checks},null,2)+'\n');
console.log(`${checks.length} fall, knockback and safe-contact checks passed`);
