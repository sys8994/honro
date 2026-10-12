// Real mission event producers with explicit action-boundary/spawn stubs.
// Tests stable source metadata without changing or simulating combat results.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g=vm.createContext({console,structuredClone});
g.HONRO_CORE={};g.HonroWorld={top(){return 0;}};g.HonroObjectives={state(){return {complete:false};}};g.HonroEncounters={pending(){return false;},update(){}};
vm.runInContext(await readFile('shared/runtime/mission.js','utf8'),g);
function fixture(stage){const heroes=[{id:'hero',side:0,cls:'archer',x:0,y:0,hp:100}],b={honroStage:stage,honroState:{flags:{}},units:[...heroes],honroMarkers:[],terrain:[],projectiles:[],round:1,teamEnds:[0,0],side:0,phase:'transition',width:2000,height:1000},e={b,unit(id){return b.units.find(u=>u.id===id);},alive(){return[];},heroesAlive(){return heroes;},settleBusy(){return false;},fx(){}};return {b,e,app:{engine:e,stage:{id:stage,objective:stage===4?'defend':'sodan'},actorBoundary:true,event(){},checkMission(){return false;},sayLines(){}}};}
{
 const {b,app}=fixture(10),calls=[];b.units.push({id:'boss',hp:100,maxHp:100,x:0,y:0});Object.assign(b.honroState,{sodanCoop:true,coopHold:0,finaleRevision:2,finaleLastEnemyEnd:0,finaleWave:0,finaleDefenseTurns:0,finaleAnchor:{x:0,y:0},finaleSites:[{id:'west',x:0,y:0},{id:'east',x:1000,y:0}]});g.HonroAllies={execute(app,action){calls.push(structuredClone(action));return true;}};
 b.teamEnds[1]=1;g.HonroMission.finale(app);b.teamEnds[1]=2;g.HonroMission.finale(app);assert.equal(calls.length,2);assert.deepEqual(Array.from(calls[0].actions,a=>a.contributionSource),['finale:1:west','finale:1:east']);assert.deepEqual(Array.from(calls[1].actions,a=>a.contributionSource),['finale:2:east','finale:2:west']);assert.deepEqual(Array.from(calls[0].actions,a=>a.source),['west','east'],'gameplay source IDs are unchanged');console.log('PASS Repeated finale sites keep distinct logical wave IDs and original gameplay sources');
}
{
 const {b,app}=fixture(4),calls=[];b.honroMarkers=[{id:'grove',type:'hauntHabitat',kind:'hound',x:1000,y:0,label:'grove'}];g.HonroAllies={execute(app,action){calls.push(structuredClone(action));return calls.length!==1;}};
 g.HonroMission.tick(app,0);b.round++;g.HonroMission.tick(app,0);assert.deepEqual(calls.map(a=>a.contributionSource),['habitat:defend:0','habitat:defend:0','habitat:defend:1']);assert(calls.every(a=>a.source==='grove'));assert.equal(b.honroState.habitatContributionWave,2);console.log('PASS Failed habitat placement keeps its wave ID; successful new waves advance one stable index');
}
