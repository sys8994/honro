// Production engine and App save boundaries; synthetic geometry, not campaign completion.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,base=battlefield(g,11).b,rows=[];
const solid=(id,x,y,w,h=30,extra={})=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,indestructible:true,...extra});
const deck=(id,y,extra={})=>solid(id,300,y,1000,30,{oneWay:true,...extra});
function fixture(cls,terrain,x=700,y=800){const b=structuredClone(base),u=b.units.find(u=>u.side===0&&u.cls===cls);Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false,moving:0,platformDrop:undefined});Object.assign(b,{units:[u],active:u.id,phase:'aim',side:0,terrain,width:2400,height:3000,waters:[],projectiles:[],drafts:[]});b.sceneVersion++;const e=new C.Engine(b);e.checkEnd=()=>false;return{e,b,u};}
for(const cls of C.CLASS_IDS)for(const dt of [1/240,1/120,1/60,1/30,.08])for(const next of ['platform','solid']){
 const {e,u,b}=fixture(cls,[deck('origin',800),solid('landing',0,1100,2200,100,{oneWay:next==='platform'})]),before={move:u.moveLeft,hp:u.hp,focus:u.focus,round:b.round,shot:b.shot};
 assert(e.drop());assert(!e.drop());assert(!e.canAct());assert(!e.jump());assert(!e.fire(u.loadout[0],30,.5));e.wait();e.finishAction();e.move(1,dt);assert.equal(u.x,700);assert.equal(b.phase,'aim');
 e.integrateBody(u,.09);assert.equal(u.y,800);assert.equal(u.platformDrop.phase,'prepare');assert(e.settleBusy());
 for(let n=0;n<Math.ceil(3/dt);n++)e.integrateBody(u,dt);
 assert.equal(u.y,1100,`${cls} ${dt} ${next} next floor`);assert(e.grounded(u));assert(!u.platformDrop);assert.deepEqual({move:u.moveLeft,hp:u.hp,focus:u.focus,round:b.round,shot:b.shot},before);
 assert.equal(e.projectileCollision({x:700,y:700},{x:700,y:900},0,u.id,[],false)?.terrain?.id,'origin');assert.equal(e.projectileCollision({x:700,y:900},{x:700,y:700},0,u.id,[],false),null);
 rows.push({cls,dt,next,y:u.y});
}
for(const terrain of [[solid('solid',0,800,1800,120)],[deck('a',800),solid('coincident-solid',300,800,1000,120)]]){const {e,u}=fixture('archer',terrain),before=JSON.stringify(u);assert(!e.canDrop());assert(!e.drop());assert.equal(JSON.stringify(u),before);}
for(const gap of [1,2,3,4,8,30,150]){const {e,u}=fixture('archer',[deck('origin',800),deck('near-lower',800+gap),solid('floor',0,1500,2200)]);assert(e.drop());for(let n=0;n<240;n++)e.integrateBody(u,1/120);assert.equal(u.y,800+gap);rows.push({gap,y:u.y});}
for(const reverse of [false,true])for(const mixed of [false,true]){let terrain=[solid('left',300,800,399,30,{oneWay:true}),solid('right',701,800,600,30,{oneWay:!mixed}),solid('floor',0,1100,2200)];if(reverse)terrain.reverse();const {e,u}=fixture('archer',terrain);assert.equal(e.drop(),!mixed);for(let i=0;i<240;i++)e.integrateBody(u,1/120);assert.equal(u.y,mixed?800:1100);rows.push({reverse,mixed,y:u.y});}
for(const x of [500,700,900]){const slope=g.HonroMapEngine.solid('slope',[[300,900],[1300,650],[1300,690],[300,940]],{oneWay:true,indestructible:true}),{e,u}=fixture('archer',[slope,solid('floor',0,1200,2200)],x,C.topAt(slope,x));assert(e.drop());for(let i=0;i<360;i++)e.integrateBody(u,1/120);assert.equal(u.y,1200);rows.push({slope:true,x});}
const cshape=g.HonroMapEngine.solid('same-polygon',[[300,800],[1300,800],[1300,1000],[300,1000],[300,980],[1200,980],[1200,830],[300,830]],{oneWay:true,indestructible:true});
{const {e,u}=fixture('archer',[cshape,solid('floor',0,1500,2200)]);assert(e.drop());for(let i=0;i<240;i++)e.integrateBody(u,1/120);assert.equal(u.y,980,'Lower face of the same polygon still lands');}
for(const action of ['impulse','broken','dead','fixed','retreat']){const {e,u,b}=fixture('archer',[deck('origin',800),solid('floor',0,1100,2200)]);if(action==='retreat')u.retreat=true;assert(e.drop());if(action==='impulse')e.impulse(u,0,-180);if(action==='broken')b.terrain[0].broken=true;if(action==='dead')u.dead=true;if(action==='fixed')u.fixed=true;for(let i=0;i<240;i++)e.stepUnits(1/120);assert(!u.platformDrop);rows.push({action});}
await mkdir('_local/reports/platform-drop',{recursive:true});await writeFile('_local/reports/platform-drop/physics.json',JSON.stringify({rows,scope:'Production synthetic engine fixtures; UI and campaign acceptance are separate.'},null,2)+'\n');console.log(`PASS platform drop ${rows.length} physics/resource/input conditions`);
