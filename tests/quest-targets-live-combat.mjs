/** Production attacks from isolated authored supported poses. Not full clears. */
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const setup=()=>{const map=g.HONRO_PROJECT.stages[17],b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT),e=new C.Engine(b),app={engine:e,stage:g.HONRO_CONTENT.stages[17],event(){},sayLines(){},checkMission(){return false;}};g.HonroAct2.attach(app,e);e.checkEnd=()=>false;const hero=e.heroesAlive().find(u=>u.cls==='knight'),target=e.unit('upper-chain'),pose=map.design.bell.standing.closeRelease,support=b.terrain.find(t=>t.id===pose.surfaceId);Object.assign(hero,{x:pose.x,y:C.topAt(support,pose.x),vx:0,vy:0,acted:false});b.active=hero.id;b.phase='aim';b.side=0;return{b,e,app,hero,target};};
for(const spec of [{id:'forward',angle:0,hit:true},{id:'behind',angle:180,hit:false},{id:'outside-sector',angle:70,hit:false},{id:'locked',angle:0,locked:true,hit:false},{id:'wall',angle:0,wall:true,hit:false}]){
 const {b,e,hero,target}=setup();g.HonroAct2.memory(b).silenced=!spec.locked;
 if(spec.wall)b.terrain.push({id:'fixture-wall',x:5530,y:4360,w:20,h:180,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 const hp=target.hp,focus=hero.focus;assert(e.fire('S00',spec.angle,1));for(let i=0;i<1800&&(hero.meleeAction||b.projectiles.length);i++)e.tick(C.STEP);
 assert.equal(target.hp<hp,spec.hit,spec.id);assert(hero.focus<=focus);assert.equal(target.hp,b.honroQuestTargets.find(t=>t.id===target.id).hp);rows.push({id:spec.id,hpBefore:hp,hpAfter:target.hp,focusSpent:focus-hero.focus});
}
// Resume while the basic sword is winding up: the same strike resolves once.
{const {b,e,hero,target,app}=setup();g.HonroAct2.memory(b).silenced=true;const hp=target.hp;assert(e.fire('S00',0,1));e.tick(.035);assert.equal(target.hp,hp);const saved=JSON.parse(JSON.stringify(b)),resumed=new C.Engine(saved);resumed.checkEnd=()=>false;g.HonroAct2.attach({...app,engine:resumed},resumed);for(let i=0;i<45;i++)resumed.tick(C.STEP);assert.equal(resumed.unit(target.id).hp,rows[0].hpAfter);rows.push({id:'windup-Continue',hpBefore:hp,hpAfter:resumed.unit(target.id).hp});}
console.log(JSON.stringify({status:'PASS',scope:'Actual basic sword fire/tick; isolated authored support, normal resource spend',rows}));
