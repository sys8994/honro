/** Pure intent transitions plus real Engine facing/physics invariants. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);
const C=g.HONRO_CORE,J=C.joystickGesture;let count=0;
for(const range of [27.88,29.52,32,41,80]){
 const threshold=Math.max(8,.18*range);
 for(const dx of [-1,1])for(const dy of [-1,1])for(const angle of [0,19,20,21,45,90]){
  const rad=angle*Math.PI/180,x=dx*Math.sin(rad)*range,y=dy*Math.cos(rad)*range;
  let s=J(1,1,range);assert.equal(s.intent,'undecided');assert.equal(s.x,0);assert.equal(s.y,0);
  s=J(x,y,range,s);assert.equal(s.intent,angle<=20?'aimOnly':'moveAim');
  if(angle>20)assert(Math.abs(s.x)>.01,'21 degree lateral input must reach physics');
  const locked=s.intent;s=J(0,0,range,s);assert.equal(s.intent,locked);assert.equal(s.x,0);
  s=J(-range,0,range,s);assert.equal(s.intent,locked);assert(s.x<0,'horizontal redrag must allow movement for either initial intent');
  assert.equal(J(-range,0,range).intent,'moveAim');count++;
 }
 for(const length of [threshold-.001,threshold,threshold+.001]){
  const s=J(0,length,range);assert.equal(s.intent,length<threshold?'undecided':'aimOnly');assert.equal(s.x,0);
 }
}
assert.equal(J(Math.sin(20.01*Math.PI/180)*41,Math.cos(20.01*Math.PI/180)*41,41).intent,'moveAim');
let fine=J(29,29,41);fine=J(.15*41,.98*41,41,fine);assert.equal(fine.intent,'moveAim');assert(fine.x>.01);
let s=J(0,41,41);for(const [x,expected]of [[.59,0],[.60,1],[.59,1],[.36,1],[.34,0],[-.59,0],[-.60,-1],[-.59,-1],[.60,1]]){
 s=J(x*41,0,41,s);assert.equal(s.facingIntent,expected);assert.equal(Math.sign(s.x),Math.sign(x));assert.equal(s.intent,'aimOnly');
}
// Initial intent stays latched; the vertical-start gate follows the current cone
// with the same inclusive boundary on entry and exit (no sector hysteresis).
let transitions=0;
for(const range of [27.88,29.52,32,41,80])for(const sy of [-1,1])for(const sx of [-1,1]){
 let vertical=J(0,sy*range,range);
 for(const angle of [19,20,21,20,19,21,-21,-20,-19,90,-90,0]){
  const rad=angle*Math.PI/180,dx=sx*Math.sin(rad)*range,dy=sy*Math.cos(rad)*range;
  vertical=J(dx,dy,range,vertical);
  assert.equal(vertical.intent,'aimOnly');
  assert.equal(vertical.x===0,Math.abs(angle)<=20,`vertical start ${sx}/${sy}: ${angle} degrees`);
  assert.equal(vertical.y,C.joystickAxes(dx,dy,range).y,'angle output survives the movement gate');
  if(Math.abs(angle)>20)assert.equal(Math.sign(vertical.x),Math.sign(dx));
  transitions++;
 }
 let horizontal=J(sx*range,0,range);
 for(const angle of [21,20,19,0,19,20,21]){
  const rad=angle*Math.PI/180;
  horizontal=J(sx*Math.sin(rad)*range,sy*Math.cos(rad)*range,range,horizontal);
  assert.equal(horizontal.intent,'moveAim');
  assert.equal(horizontal.x===0,angle===0,'horizontal start never acquires the vertical gate');
  transitions++;
 }
}
// A tiny numerical boundary tolerance is not a release band.
for(const sy of [-1,1])for(const sx of [-1,1]){
 const angle=20.01*Math.PI/180;
 const outside=J(sx*Math.sin(angle)*41,sy*Math.cos(angle)*41,41,J(0,sy*41,41));
 assert(outside.x!==0);assert.equal(outside.intent,'aimOnly');
}
let radial=J(0,41,41);
for(const [x,moving]of [[.121,true],[.11,true],[.099,false],[.11,false],[.121,true]]){
 radial=J(x*41,0,41,radial);assert.equal(radial.moving,moving,'existing radial deadzone hysteresis');
}
const b=C.createBattle(1,C.defaults(),'practice',{party:['archer'],wind:0}),u=b.units[0],e=new C.Engine(b);
b.units=[u];b.active=u.id;b.phase='aim';b.side=0;b.terrain=[{x:0,y:1800,w:5000,h:1200,mat:'rock'}];b.width=5000;b.height=3000;
for(const angle of [-85,-30,0,35,90]){
 Object.assign(u,{x:2000,y:1800,vx:0,vy:0,facing:1,angle});const before=[u.x,u.y,u.vx,u.vy,u.moveLeft,u.focus];
 e.face(-1);assert.equal(u.angle,180-angle);assert.equal(u.facing,-1);assert.deepEqual([u.x,u.y,u.vx,u.vy,u.moveLeft,u.focus],before);
 e.face(1);assert.equal(u.angle,angle);assert.deepEqual([u.x,u.y,u.vx,u.vy,u.moveLeft,u.focus],before);
}
Object.assign(u,{y:1200,vx:120,vy:0});const budget=u.moveLeft;e.face(-1);for(let i=0;i<20;i++)e.tick(C.STEP);
assert(u.y>1200,'aim lock must not freeze falling');assert(u.x!==2000,'aim lock must not freeze impulse');assert.equal(u.moveLeft,budget);
console.log(`PASS intent: ${count} cone/centre/restart cases, ${transitions} sector transitions, 5 mobile ranges, radial and facing hysteresis, mirrored pitch and independent physics`);
