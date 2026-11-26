// State and one-shot sequencing test with supplied camera/ground facts; not a route playthrough.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const scenes=JSON.parse(readFileSync('shared/data/act4/reviewed.json','utf8')).scenes;
const alive=u=>!!u&&u.hp>0&&!u.dead;
const party=b=>b.units.filter(u=>u.side===0&&alive(u));
const offered=[];
const stub={eventAPI:{
 alive,party,memory:b=>b.honroAct4PreviewState,inView:(a)=>a.camera,
 stable:b=>b.phase==='aim'&&!b.projectiles.length&&!b.volley,
 objectiveReady:b=>b.side===0&&b.phase==='aim'&&!b.projectiles.length&&!b.volley,
 play:(a,key,bark=false)=>{
  const b=a.engine.b,q=b.honroAct4PreviewState;
  assert(scenes.some(s=>s.stage===b.honroAct4Preview&&s.event===key),key);
  if(q.events[key]?.started)return false;
  q.events[key]={started:true,terminal:!bark};offered.push(key);return true;
 }
}};
class Scene {}
Object.assign(Scene.prototype,{liveWater(){},landmark(){},world(){}});
const g=vm.createContext({HonroAct4TerrainPreview:stub,HONRO_CORE:{},HonroScene:Scene,
 HONRO_APP_READY:{then(){}},document:{addEventListener(){},getElementById:()=>({})}});
vm.runInContext(readFileSync('shared/runtime/act4-coast-events.js','utf8'),g);
const hero={id:'p-archer',cls:'archer',side:0,hp:50,x:2210,y:1900,moveLeft:100};
function fixture(){
 const q={clock:1,events:{},tide:{phase:'low',surface:2500,highRound:40,lowRound:43}};
 const b={round:1,side:0,phase:'aim',honroAct4Preview:33,honroStage:33,honroAct4Official:1,
  honroAct4PreviewState:q,honroAct4Design:{tide:{warningRound:5,low:2500,high:2250},waterPolicies:[]},
  terrain:[],projectiles:[],units:[{...hero}]};
 const e={b,grounded:u=>!u.airborne};
 const a={engine:e,modal:{classList:{contains:()=>false}},camera:true};
 return {q,b,e,a,tick:()=>stub.coastObserve(a,0)};
}
{
 const {q,b,a,tick}=fixture();
 tick();assert.deepEqual(offered.splice(0),[],'no unsupported early route description');
 q.observed={'upper-route':1};a.camera=false;
 tick();assert.deepEqual(offered.splice(0),[],'not visible');
 a.camera=true;b.units.push({side:1,hp:20,x:2250,y:1900});
 tick();assert.deepEqual(offered.splice(0),[],'nearby combat is not interrupted');
 b.units.pop();tick();tick();assert.deepEqual(offered.splice(0),['shoal_approach']);
 b.round=5;q.observed['water-rising']=1;tick();
 assert.deepEqual(offered.splice(0),['tide_warning']);
 q.events.tide_warning.terminal=true;
 b.round=q.tide.lowRound;
 b.units[0].airborne=true;tick();assert.deepEqual(offered.splice(0),[],'no reaction before safe foothold');
 b.units[0].airborne=false;tick();tick();
 assert.deepEqual(offered.splice(0),['shoal_recede']);
}
{
 const {q,b,tick}=fixture();
 b.honroCustom=true;q.observed={'upper-route':1};tick();assert.deepEqual(offered.splice(0),[]);
 b.honroCustom=false;q.events.tide_warning={started:true,terminal:false};
 q.tide.warned=true;b.round=43;tick();assert.deepEqual(offered.splice(0),[],'unheard warning is not treated as a finished chapter event');
}
console.log('PASS Act 4 dialogue sight, safety, timing and ordered one-shot shore events');
