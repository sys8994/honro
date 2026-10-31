/** Real Engine walk off an edge in aim phase. No forced death or turn changes. */
import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}), C=g.HONRO_CORE;
function arena(){
 const b=C.createBattle(1,C.defaults(),'campaign'),u=b.units.find(x=>x.id===b.active);
 Object.assign(b,{width:2000,height:1400,terrain:[{id:'ledge',x:0,y:1000,w:600,h:100,mat:'rock',hp:99999,maxHp:99999}],fields:[],waters:[],drafts:[],zones:[],decor:[]});
 Object.assign(u,{x:570,y:1000,vx:0,vy:0,hp:1,moveLeft:2000,maxMove:2000,acted:false});
 const ally=C.makeUnit('mage',0,250,1000,{id:'survivor',hp:1000,maxHp:1000});
 const enemy=C.makeUnit('knight',1,300,1000,{id:'opponent',role:'guard',hp:1000,maxHp:1000,fixed:true,awake:true});
 b.units=[u,ally,enemy];b.side=0;b.phase='aim';const events=[],e=new C.Engine(b,x=>events.push(x));
 return {b,e,u,ally,enemy,events};
}
function fall(a){for(let i=0;i<1500&&!a.u.dead;i++){if(a.u.x<650)a.e.walk(a.u,1,C.STEP);a.e.tick(C.STEP);}assert(a.u.dead,'walking off ledge must trigger real fatal fall');}
const a=arena();fall(a);for(let i=0;i<500&&a.b.active===a.u.id;i++)a.e.tick(C.STEP);assert.equal(a.b.active,a.ally.id,'dead active must advance to surviving ally');assert.equal(a.b.phase,'aim');console.log('PASS natural active fall advances to surviving ally');
function until(e,p,max=1500){for(let i=0;i<max;i++){if(p())return;e.tick(C.STEP);}assert(p(),`timeout ${e.b.phase}/${e.b.active}/${e.b.round}`);}
function check(name,fn){fn();console.log('PASS',name);}
check('dead last available ally advances to enemy team once',()=>{
 const a=arena();a.ally.acted=true;fall(a);until(a.e,()=>a.b.side===1||a.b.phase==='enemy');assert.equal(a.b.side,1);assert.equal(a.b.teamEnds[0],1);const ends=[...a.b.teamEnds];a.e.tick(C.STEP);assert.deepEqual([...a.b.teamEnds],ends);
});
check('last surviving hero fall ends battle as loss once',()=>{
 const a=arena();a.ally.dead=true;a.ally.hp=0;fall(a);until(a.e,()=>a.b.phase==='lost');assert.equal(a.events.filter(x=>x.type==='result').length,1);const ends=[...a.b.teamEnds];for(let i=0;i<120;i++)a.e.tick(C.STEP);assert.equal(a.events.filter(x=>x.type==='result').length,1);assert.deepEqual([...a.b.teamEnds],ends);
});
check('victory during death review completes once and clears stale projectiles',()=>{
 const a=arena();fall(a);assert.equal(a.b.phase,'review');a.e.hurt(a.enemy,100000,a.ally.id);assert(a.enemy.dead);a.b.projectiles.push({id:'stale'});until(a.e,()=>a.b.phase==='won');assert.equal(a.b.projectiles.length,0);assert.equal(a.events.filter(x=>x.type==='result').length,1);const kills=a.b.kills,ends=[...a.b.teamEnds];for(let i=0;i<120;i++)a.e.tick(C.STEP);assert.equal(a.b.kills,kills);assert.equal(a.events.filter(x=>x.type==='result').length,1);assert.deepEqual([...a.b.teamEnds],ends);
});
check('dead active with stale projectile completes interrupted action and clears it',()=>{
 const a=arena();fall(a);a.b.projectiles.push({id:'stale'});until(a.e,()=>a.b.active===a.ally.id&&a.b.phase==='aim');assert.equal(a.b.projectiles.length,0);assert.equal(a.b.teamEnds[0],0);const active=a.b.active;for(let i=0;i<90;i++)a.e.tick(C.STEP);assert.equal(a.b.active,active);assert.equal(a.b.teamEnds[0],0);
});
check('serialized aim snapshot with dead active resumes once without rewards replay',()=>{
 const a=arena();fall(a);const snapshot=JSON.parse(JSON.stringify(a.b));snapshot.phase='aim';snapshot.active=a.u.id;const events=[],e=new C.Engine(snapshot,x=>events.push(x));const kills=snapshot.kills;until(e,()=>snapshot.active===a.ally.id&&snapshot.phase==='aim');const ends=[...snapshot.teamEnds];for(let i=0;i<90;i++)e.tick(C.STEP);assert.equal(snapshot.active,a.ally.id);assert.deepEqual([...snapshot.teamEnds],ends);assert.equal(snapshot.kills,kills);assert.equal(events.filter(x=>x.type==='result').length,0);
});
check('serialized in-progress death review resumes without duplicate transition',()=>{
 const a=arena();fall(a);assert.equal(a.b.phase,'review');const snapshot=JSON.parse(JSON.stringify(a.b)),e=new C.Engine(snapshot);until(e,()=>snapshot.active===a.ally.id&&snapshot.phase==='aim');const ends=[...snapshot.teamEnds];for(let i=0;i<90;i++)e.tick(C.STEP);assert.equal(snapshot.active,a.ally.id);assert.deepEqual([...snapshot.teamEnds],ends);
});
check('living airborne ally settles before dead player turn is finished',()=>{
 const a=arena();let launched=false;for(let i=0;i<1500&&!a.u.dead;i++){if(a.u.x<650)a.e.walk(a.u,1,C.STEP);if(!launched&&a.u.y>a.b.height+20){a.ally.y=500;a.ally.vy=0;launched=true;}a.e.tick(C.STEP);}assert(a.u.dead&&launched);assert.equal(a.b.phase,'aim');assert.equal(a.b.active,a.u.id);assert(!a.e.grounded(a.ally));until(a.e,()=>a.b.active===a.ally.id&&a.b.phase==='aim');assert(a.e.grounded(a.ally));
});
