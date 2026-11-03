/** Focused production scene/step/history ordering, not a fabricated full-play claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g=vm.createContext({HONRO_CORE:{},HonroAct2:{},HonroAct3:{},HonroNarrativeCatalogue:{},HonroWorld:{},HonroObjectives:{},HonroJourneyContent:{}});
vm.runInContext(await readFile('shared/runtime/act23-v4.js','utf8'),g);
const V=g.HonroAct23V4;
g.HonroAct23V4Act2={active:V.active,stepSatisfied:()=>false};
vm.runInContext(await readFile('shared/runtime/act23-v4-act2-scenes.js','utf8'),g);
function fixture({heroX=11900,enemy=false,revision=1}={}){
 const b={honroStage:11,honroAct23V4Revision:revision,round:17,phase:'aim',sceneVersion:0,session:'scene-order-test',units:[{id:'p-archer',side:0,x:heroX,y:8000,hp:100,dead:false},...(enemy?[{id:'guard',side:1,x:11900,y:8000,hp:100,dead:false}]:[])],projectiles:[],honroMarkers:[{id:'11.north',x:11900,y:8000}],honroV4Steps:[{id:'11.north',kind:'v4-world'}],honroV4Ambient:{from:{x:11670,y:8000},to:{x:12160,y:7930}},honroState:{act23v4:{revision:1,done:{'11.thread':true,'11.entry-threat':true,'11.exit-threat':true,'11.exit':true},slots:{},sceneDone:{},checkpoints:[],holds:{},events:{},act2Scenes:{revision:1,proof:{},walks:{},bell:{elapsed:1.08,struck:true}}}}};
 const app={engine:{b,active:b.units[0],settleBusy:()=>false,fx:()=>{}},profile:{},done:false};return{b,app,m:b.honroState.act23v4};
}
const {b,app,m}=fixture();
g.HonroAct23V4Act2Scenes.tick(app,.01);assert.equal(m.done['11.north'],undefined);
g.HonroAct23V4Act2Scenes.tick(app,.02);assert(m.act2Scenes.proof['11.north']);assert.equal(m.done['11.north'],true);assert.equal(b.honroMarkers[0].collected,true);assert.equal(m.checkpoints.filter(x=>x.id==='11.north').length,1);
// Departure may now open dialogue and settle the result before another v4 tick.
app.dialogue={};b.phase='won';V.recordOutcome(app,true);assert(app.profile.honroAct23V4History.stages[11].steps.includes('11.north'));
app.dialogue=null;b.phase='aim';g.HonroAct23V4Act2Scenes.tick(app,.05);assert.equal(m.checkpoints.filter(x=>x.id==='11.north').length,1);
for(const options of [{heroX:10000},{enemy:true},{revision:undefined}]){const q=fixture(options);if(options.revision===undefined&&Object.hasOwn(options,'revision'))delete q.b.honroAct23V4Revision;const old=JSON.stringify(q.m);g.HonroAct23V4Act2Scenes.tick(q.app,.05);assert.equal(JSON.stringify(q.m),old);assert.equal(q.b.sceneVersion,0);assert.equal(q.b.honroMarkers[0].collected,undefined);}
console.log('PASS fulfilled bell checkpoint/history before departure, threshold guard, idempotency, missing proximity, live threat, legacy opt-out');
