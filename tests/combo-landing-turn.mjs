/** Reconstructed production input methods, synthetic event/DOM plumbing. */
import assert from 'node:assert/strict';import {readFile,mkdir,writeFile} from 'node:fs/promises';import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,S=C.SKILLS,source=await readFile('shared/runtime/main.js','utf8');let now=1000;
const docs=new Map(),wins=new Map(),nodes=new Map(),doc={addEventListener:(k,v)=>docs.set(k,v)},win={addEventListener:(k,v)=>wins.set(k,v)};
function node(id){if(!nodes.has(id))nodes.set(id,{style:{setProperty(){}},dataset:{},classList:{toggle(){}},querySelector(){return this.label??={textContent:''};},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){},hasPointerCapture:()=>false,addEventListener(){}});return nodes.get(id);}
const G={HonroStory:{turnPaused:()=>false},HonroUnitInfo:{bind(){},tap:()=>false,close(){}}},slices=[['        defend()','        updateStick('],['        updateStick(','        updateHUD('],['        bind() {','        equipConfirm(']];
const App=new Function('G','C','S','H','document','window','performance','$','clamp','return class {'+slices.map(([a,b])=>{assert(source.includes(a)&&source.includes(b));return source.slice(source.indexOf(a),source.indexOf(b));}).join('\n')+'}')(G,C,S,{hero:{}},doc,win,{now:()=>now},node,(x,a,b)=>Math.max(a,Math.min(b,x)));
function fixture(id='S13'){const profile=C.defaults(),b=C.createBattle(1,profile,'practice',{party:['knight'],wind:0}),u=b.units[0];Object.assign(b,{width:5000,height:3000,terrain:[{id:'floor',x:0,y:1800,w:5000,h:1200,mat:'rock',hp:9999,maxHp:9999}],wind:0,drafts:[],fields:[]});Object.assign(u,{x:2000,y:1800,vx:0,vy:0,loadout:['S13','S00','S07'],focus:9999,maxFocus:9999,ranks:{[id]:8,S00:1,S07:8},acted:false});b.units=[u];b.active=u.id;b.phase='aim';b.side=0;const a=new App();Object.assign(a,{engine:new C.Engine(b),profile,screen:'battle',selected:id,selectedByUnit:{},keys:new Set(),contacts:new Map(),stick:{x:0,y:0},scene:{world:(x,y)=>({x,y}),manual:false},modal:{classList:{contains:()=>false}},done:false,charging:false,updateHUD(){},root:{}});a.inputs();a.bind();return{a,b,u};}

const key=(code,type='keydown')=>docs.get(type)({code,repeat:false,target:{tagName:'BODY'},preventDefault(){}});
const moveStart=source.indexOf('                            if (e.canAct()) {',source.indexOf('for (let k = 0; k < 32 &&'));
assert(moveStart>=0);
const movement=new Function('e','clamp',source.slice(moveStart,source.indexOf('                            e.tick(1 / 120);',moveStart)));
const step=a=>movement.call(a,a.engine,(x,lo,hi)=>Math.max(lo,Math.min(hi,x)));
function land(a){assert(a.engine.fire('S13',35,.35));for(let i=0;i<2400&&a.engine.b.phase!=='aim';i++)a.engine.tick(C.STEP);assert.equal(a.engine.active.meleeFollow,'ready');assert(a.engine.grounded(a.engine.active));a.selected='S00';}
const unchanged=u=>[u.x,u.y,u.vx,u.vy,u.moveLeft,u.focus,u.meleeFollow,u.acted];
let checks=0;
for(const direction of [-1,1])for(const control of ['Arrow','WASD','touch']){
 const {a,b,u}=fixture();land(a);u.facing=-direction;u.angle=direction===1?145:35;
 const before=unchanged(u),shots=b.shots;
 if(control==='touch')node('joystick').onpointerdown({pointerId:1,clientX:50+direction*40,clientY:50,preventDefault(){}});
 else key(control==='Arrow'?(direction===1?'ArrowRight':'ArrowLeft'):(direction===1?'KeyD':'KeyA'));
 for(let i=0;i<20;i++)step(a);
 assert.equal(u.facing,direction);assert.equal(u.angle,direction===1?35:145);assert.deepEqual(unchanged(u),before);assert.equal(b.shots,shots);assert.equal(b.phase,'aim');
 if(control==='touch')node('joystick').onpointercancel({pointerId:1});else key(control==='Arrow'?(direction===1?'ArrowRight':'ArrowLeft'):(direction===1?'KeyD':'KeyA'),'keyup');
 step(a);assert.deepEqual(unchanged(u),before);assert.equal(a.stick.x,0);
 // Cancel charge and retry without consuming the single follow-up.
 key('Space');assert(a.charging);a.cancelInput();key('Space','keyup');assert.equal(b.shots,shots);assert.equal(u.meleeFollow,'ready');
 const t=C.makeUnit('archer',1,u.x+direction*90,u.y,{id:'target',fixed:true,hp:10000,maxHp:10000,armor:0});b.units.push(t);
 const hits=b.hits;a.selected='S07';key('Space');now+=100;key('Space','keyup');assert.equal(u.meleeFollow,'spent');assert.equal(b.shots,shots+1);assert(Math.sign(Math.cos(u.meleeAction.angle))===direction);
 const locked=unchanged(u),angle=u.angle;key(direction===1?'ArrowLeft':'ArrowRight');step(a);assert.deepEqual(unchanged(u),locked);assert.equal(u.angle,angle);a.cancelInput();
 for(let i=0;i<1200&&u.meleeFollow;i++)a.engine.tick(C.STEP);
 assert(t.hp<10000);assert.equal(b.hits-hits,C.COMBO_HITS[7]);assert(!u.meleeAction);assert(!u.meleeFollow);checks++;
}
for(const state of [{dead:true},{airborne:true},{jumping:true},{vx:20},{vy:20},{y:1500}]){
 const {a,u}=fixture();land(a);Object.assign(u,state);const before=unchanged(u),angle=u.angle,facing=u.facing;a.engine.move(-1,C.STEP);assert.deepEqual(unchanged(u),before);assert.equal(u.angle,angle);assert.equal(u.facing,facing);checks++;
}
{
 const {a,u}=fixture();assert(a.engine.fire('S13',35,.35));const before=[u.facing,u.angle,u.x,u.y];a.engine.move(-1,C.STEP);assert.deepEqual([u.facing,u.angle,u.x,u.y],before);checks++;
}
{
 const {a,u}=fixture();const x=u.x;a.engine.move(-1,C.STEP);assert(u.x<x);assert.equal(u.facing,-1);checks++;
}
console.log('PASS',checks,'S13 grounded turning, both keyboard directions, synthetic touch/cancel/retry, real follow-up damage and airborne/flight exclusions');
