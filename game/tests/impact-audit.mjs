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
for(const dt of [1/120,1/60,1/30])for(const gap of [0,1,3,5,9,20])check(`short landing at gap ${gap}, dt ${dt}`,()=>{
 const {e,u,events}=setup();u.y-=gap;u.vy=1000;
 for(let n=0;n<20;n++)e.integrateBody(u,dt);
 assert.equal(u.hp,1000,'short drops must be safe regardless of impact speed');assert.equal(u.y,4000);
 assert.equal(events.filter(ev=>ev.text==='낙하 충격').length,0);
 return {damage:1000-u.hp};
});
for(const height of [50,300,600,1080,2000,3000])check(`free fall from ${height}`,()=>{
 const {e,u}=setup();u.y-=height;
 for(let n=0;n<1200&&u.y<4000;n++)e.integrateBody(u,1/120);
 assert.equal(u.y,4000);if(height<=600)assert.equal(u.hp,1000);else assert.ok(u.hp<1000);
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
check('fall damage scales from 10 m to lethal at 100 m',()=>{
 const damage=[10,25,55,100,120].map(m=>g.HONRO_CORE.fallDamage(1000,m*60));
 assert.deepEqual(damage,[0,167,500,1000,1000]);return damage;
});
check('armor reduces fall damage for ally and enemy alike',()=>{const results=[];for(const side of [0,1,2]){const {e,u}=setup();u.side=side;u.armor=.5;u.y=3998;u.fallApexY=2798;u.vy=1000;e.integrateBody(u,1/120);results.push(1000-u.hp);}assert(results.every(d=>d>=55&&d<=57),JSON.stringify(results));return results;});
check('a tall fall can defeat a unit',()=>{const {e,u}=setup();u.hp=1;u.y=3998;u.fallApexY=2798;u.vy=1200;e.integrateBody(u,1/120);assert.equal(u.hp,0);assert.equal(u.dead,true);});
await writeFile(gameRoot+'/../_local/game-reports/impact-audit.json',JSON.stringify({checks},null,2)+'\n');
console.log(`${checks.length} fall, knockback and safe-contact checks passed`);
