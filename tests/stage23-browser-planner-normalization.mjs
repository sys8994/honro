/** Lightweight pre-construction binding test. This is not actual-browser play or production trajectory testing. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {ESTIMATE_RANDOM} from '../tools/stage23-qa/independent-planning.mjs';
const source=await readFile('tools/stage23-qa/full-browser-independent-planner.js','utf8');
const base={rng:0,damageSequence:{version:1,seed:0,index:0},honroState:{act23v4:{carrierStarted:true}},units:[
 {id:'p-knight',side:0,x:2500,y:4650,h:98,r:25,moveLeft:550,hp:100},
 {id:'act3-carrier',side:2,x:2280,y:4700,h:92,r:24,hp:1450},
 {id:'s23-B-0',side:1,x:2700,y:4750,h:98,r:25,hp:1285}
]};
const observed=[],inputs=[];
for(const index of [0,1,2]){
 const b=structuredClone(base);b.rng=0xf0000000+index;b.damageSequence={version:1,seed:0x70000000+index,index:1000*index};
 const before=JSON.stringify(b);
 class Engine{
  constructor(copy){assert.equal(copy.rng,ESTIMATE_RANDOM.rng);assert.equal(copy.damageSequence.seed,ESTIMATE_RANDOM.damageSeed);assert.equal(copy.damageSequence.index,0);inputs.push(JSON.stringify(copy));this.b=copy;this.active=copy.units[0];}
  unit(id){return this.b.units.find(u=>u.id===id);}
  alive(side){return this.b.units.filter(u=>u.side===side&&u.hp>0);}
  canDrop(){return false;} grounded(){return true;} jumpCost(){return 30;}
 }
 const sandbox={HONRO_CORE:{Engine},HonroApp:{engine:{b}},HonroAct23V4:{current:()=>({id:'dock-mid',kind:'escort'})},HonroAct3:{visible:()=>true},HonroAct23V4Chapter23Facts:{blocked:()=>false},crypto:webcrypto,TextEncoder};
 const planner=vm.runInNewContext('('+source+')',sandbox);
 const r=await planner({contextOnly:true});assert.equal(JSON.stringify(b),before);assert.equal(r.liveBeforeSha256,r.liveAfterSha256);
 const {liveBeforeSha256,liveAfterSha256,...decision}=JSON.parse(JSON.stringify(r));observed.push(decision);
}
assert.equal(inputs[0],inputs[1]);assert.equal(inputs[0],inputs[2]);assert.deepEqual(observed[0],observed[1]);assert.deepEqual(observed[0],observed[2]);
console.log(JSON.stringify({passed:true,estimateRandom:ESTIMATE_RANDOM,scope:'Three differing input random states are normalized before the browser planner Engine constructor; context-only observations are identical and inputs unchanged. Lightweight binding contract only, not actual browser/trajectory/pacing certification.'}));
