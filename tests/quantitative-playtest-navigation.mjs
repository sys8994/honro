/** Synthetic public terrain only; real Engine locomotion, no campaign/enemies/combat. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
import {SupportNavigator,motionHost,RouteFollower,unsafePublicWater} from '../tools/quantitative-playtest/navigation.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
const actor={id:'archer',cls:'archer',side:0,x:100,y:600,r:22,h:92,walkSpeed:320,maxMove:1400,moveLeft:1400,hp:1000,maxHp:1000,focus:200,ranks:{A01:1},equipmentIds:[],facing:1,angle:45};
const t=(id,x,y,w,h=40,oneWay=false)=>({id,x,y,w,h,oneWay,mat:'stone',hp:1000,maxHp:1000});
const fixtures=[
 {name:'climb',terrain:[t('floor',0,600,330),t('upper',370,440,330)],goal:{x:600,y:440},kind:'jump'},
 {name:'drop',start:{x:250,y:300},terrain:[t('upper',100,300,350,20,true),t('floor',0,600,700)],goal:{x:250,y:600},kind:'drop'},
 {name:'cross',terrain:[t('left',0,600,300),t('right',450,600,300)],goal:{x:650,y:600},kind:'jump'},
 {name:'detour',start:{x:550,y:600},terrain:[t('floor',0,600,800),t('leftstep',40,440,190,20,true),t('middle',260,280,200,20,true),t('target',500,120,260,20,true)],goal:{x:650,y:120},kind:'jump'},
 {name:'impossible',terrain:[t('floor',0,600,300),t('high',400,100,300)],goal:{x:600,y:100},reject:true}
];
for(const f of fixtures){const u={...actor,...f.start},world={terrain:f.terrain,width:1000,height:900,physics:C.makePhysics(),sceneVersion:1},before=JSON.stringify({u,world}),nav=new SupportNavigator(C),start=performance.now(),result=nav.plan(world,u,f.goal);assert.equal(JSON.stringify({u,world}),before,'Planner must not mutate input world/body');if(f.reject)assert.equal(result.status,'unreachable');else{assert.equal(result.status,'ready',f.name+': '+JSON.stringify(result));assert(result.path.some(e=>e.kind===f.kind),f.name+' expected '+f.kind);const {h,u:live}=motionHost(C,world,u);for(const edge of result.path){assert(Math.hypot(live.x-edge.from.x,live.y-edge.from.y)<10);if(edge.kind==='jump')assert(h.jump(live));if(edge.kind==='drop')assert(h.drop(live));for(let frame=0;frame<600;frame++){const dx=edge.to.x-live.x;if(Math.abs(dx)>1)h.walk(live,Math.sign(dx)*Math.min(1,Math.abs(dx)/(live.walkSpeed*C.STEP)),C.STEP);assert(h.integrateBody(live,C.STEP,true));if(h.grounded(live)&&Math.hypot(live.x-edge.to.x,live.y-edge.to.y)<8)break;}assert(Math.hypot(live.x-edge.to.x,live.y-edge.to.y)<10,f.name+' continuous actual physics path');}assert(Math.hypot(live.x-f.goal.x,live.y-f.goal.y)<=30);}
 console.log(JSON.stringify({fixture:f.name,status:result.status,path:result.path.map(e=>e.kind),stats:nav.stats,ms:Math.round(performance.now()-start)}));}
console.log('PASS synthetic climb/drop/cross/detour/unreachable; actual locomotion and unchanged input state');

for(const f of fixtures.filter(f=>!f.reject)){
 const original={...actor,...f.start},world={terrain:f.terrain,width:1000,height:900,physics:C.makePhysics(),sceneVersion:1},follower=new RouteFollower(C),{h,u}=motionHost(C,world,original),inputs=[];let arrived=false;
 for(let frame=0;frame<1800;frame++){
  const intent=follower.intention(h,u,{...f.goal,kind:'fixture'});assert(!['blocked','end-turn'].includes(intent.kind),f.name+' follower '+JSON.stringify(intent));
  if(intent.kind==='arrived'){arrived=true;break;}
  if(intent.kind==='jump'){assert(h.jump(u));follower.accepted(u.id);inputs.push('jump');}
  if(intent.kind==='drop'){assert(h.drop(u));follower.accepted(u.id);inputs.push('drop');}
  if(['walk','jump','air-control'].includes(intent.kind)&&intent.direction)h.walk(u,intent.direction,C.STEP);
  assert(h.integrateBody(u,C.STEP,true));
 }
 assert(arrived,f.name+' follower should reach goal');assert.equal(u.hp,original.hp);console.log(JSON.stringify({follower:f.name,inputs,end:{x:u.x,y:u.y}}));
}
console.log('PASS reactive follower locomotion, no pose/HP/budget refill after start');

assert(unsafePublicWater({honroAct4Design:{waterPolicies:[{kind:'recover',x1:0,x2:300,surface:100}]}},{x:100,y:200,h:92}));
assert(!unsafePublicWater({honroAct4Design:{waterPolicies:[{kind:'recover',x1:0,x2:300,surface:100}]},honroAct4PreviewState:{tide:{surface:100,phase:'low'}}},{x:100,y:200,h:92}));
console.log('PASS current public water recovery exclusions, no future tide forecast');
