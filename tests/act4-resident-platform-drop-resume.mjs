/** Save-shaped JSON/Engine restore of real side2 residents. Not App storage/UI proof. */
import assert from 'node:assert/strict';import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE,app=h.load(h.profileThrough(39));app.launch(40);h.finish(app);const base=plain(app.engine.b);app.stopBattle();
const state=u=>plain({id:u.id,side:u.side,x:u.x,y:u.y,vx:u.vx,vy:u.vy,hp:u.hp,moveLeft:u.moveLeft,jumping:u.jumping,platformDrop:u.platformDrop});
for(const phase of ['prepare','fall','land']){
 const b=plain(base),u=b.units.find(v=>v.id==='a4-rescue-0'),hero=b.units.find(v=>v.side===0);
 Object.assign(u,{x:700,y:800,vx:0,vy:0,fixed:false,jumping:false,airborne:false});Object.assign(hero,{x:1800,y:1100,vx:0,vy:0,jumping:false,airborne:false});
 Object.assign(b,{units:[hero,u],active:hero.id,side:0,phase:'aim',width:2400,height:3000,waters:[],drafts:[],projectiles:[],terrain:[{id:'top',x:300,y:800,w:1000,h:30,oneWay:true,mat:'wood',hp:9999,maxHp:9999},{id:'floor',x:0,y:1100,w:2400,h:100,mat:'rock',hp:9999,maxHp:9999}]});b.sceneVersion++;
 const e=new C.Engine(b,()=>{});e.checkEnd=()=>false;assert(e.dropAct4Resident(u));let i=0;while(u.platformDrop?.phase!==phase||u.platformDrop.elapsed<.03){e.stepUnits(1/120);assert(++i<240);}
 const snapshot=state(u),saved=plain(b),restored=new C.Engine(saved,()=>{}),v=restored.unit(u.id);restored.checkEnd=()=>false;assert.deepEqual(state(v),snapshot);assert.equal(saved.active,b.active);assert.equal(saved.side,b.side);assert.equal(v.side,2);
 for(i=0;i<360;i++){e.stepUnits(1/120);restored.stepUnits(1/120);assert.deepEqual(state(v),state(u));}
 assert.equal(v.y,1100);assert.equal(v.platformDrop,undefined);assert.equal(v.side,2);assert.equal(v.hp,snapshot.hp);assert.equal(v.moveLeft,snapshot.moveLeft);
}
console.log('PASS resident prepare/fall/land JSON+Engine restore trajectories (3); not App/GUI proof');
