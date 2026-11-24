import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS,party,admitsProofPack,canEnter,terminalFlags,lastStagePlan,settlementPlan} from './transition-contract.mjs';
const live=Object.freeze({embedded:false,debug:false,training:false,custom:false});
const p=()=>({cleared:{50:{visits:1,rounds:7}},honroFlags:{other:true},recruited:['archer','mage','knight','occultist'],party:['archer','mage','knight','occultist'],equipment:{irrelevant:'immutable'},heroes:{mage:{xp:7900}}});
const map=(id,i)=>({id,act:6,actStage:i+1,stageId:id,authoredId:'stage-'+id,requires:[id-1],playerRecords:party(id).map(kind=>({id:'player-'+kind,team:'player',kind}))});
const battle=(id,override={})=>({stage:id,honroStage:id,honroAuthoredId:'stage-'+id,mode:'campaign',honroMapOrigin:'campaign',honroCanonical:true,honroCustom:false,honroAct6Revision:1,honroJourneyReplay:false,phase:'won',honroAct6:{flags:Object.fromEntries(terminalFlags(id).map(k=>[k,true]))},...override});
function publish(profile,id) {const delta=settlementPlan(profile,battle(id),true,live);assert(delta);Object.assign(profile.honroFlags,delta);profile.cleared[id]={visits:1};}
test('atomic ten chapters, exact order/ID/roster; one missing or extra body blocked',()=>{
 const good=IDS.map(map);
 assert(admitsProofPack(true,good));
 assert(!admitsProofPack(false,good));
 assert(!admitsProofPack(true,good.slice(0,9)));
 assert(!admitsProofPack(true,[...good.slice(1),good[0]]));
 for(const patch of [{requires:[50]},{authoredId:'stage-54'},{stageId:54},{playerRecords:[...good[2].playerRecords,{id:'fake-sodan',team:'player',kind:'occultist'}]}]){
  const x=structuredClone(good);Object.assign(x[2],patch);assert(!admitsProofPack(true,x));
 }
});
test('legacy Stage50 clear starts only 51, no global roster rewrites',()=>{
 const before=p(),snapshot=structuredClone(before);
 assert(canEnter(before,51,true));assert(!canEnter(before,52,true));assert(!canEnter(before,51,false));
 assert(!canEnter({cleared:{}},51,true));assert.deepEqual(before,snapshot);
});
test('authored case order and physical party; Sodan remote is not a player unit',()=>{
 const save=p(), base=structuredClone(save);
 for(const id of IDS) {
  const lane=lastStagePlan(save,id,true);assert(lane);
  const inner=[53,54,56,58].includes(id),outer=[55,57,59].includes(id);
  assert.deepEqual(lane.body,inner?['mage']:outer?['archer','knight','occultist']:base.party);
  assert.equal(lane.remoteAid,inner?'sodan-linked':null);
  assert.equal(canEnter(save,id+1,true),false);
  publish(save,id);
  assert.equal(settlementPlan(save,battle(id),true,live),null);
 }
 assert.deepEqual({...save,cleared:base.cleared,honroFlags:base.honroFlags},base);
});
test('6-6 narrative failure does not settle before real win; reload/replay only reads',()=>{
 const save=p();for(const id of IDS.slice(0,5))publish(save,id);
 const b=battle(56,{phase:'aim'}),before=JSON.stringify(save);
 for(const phase of ['aim','transition','lost'])assert.equal(settlementPlan(save,{...b,phase},true,live),null);
 const reloaded=JSON.parse(JSON.stringify(b));assert.equal(settlementPlan(save,reloaded,true,live),null);
 assert.equal(canEnter(save,57,true),false);assert.equal(JSON.stringify(save),before);
 assert.deepEqual({...settlementPlan(save,{...reloaded,phase:'won'},true,live)},{'act6.firstGarmjinFailed':true});
 publish(save,56);assert(canEnter(save,57,true));assert(!canEnter(save,60,true));
});
test('forged numeric stage, Workshop/embedded owner, replay, missing boss phase, and cleared hole fail closed',()=>{
 const save=p();for(const id of IDS.slice(0,7))publish(save,id);
 for(const override of [{stage:48},{honroAuthoredId:'stage-48'},{honroMapOrigin:'workshop'},{honroCustom:true},{honroCanonical:false},{honroAct6Revision:2},{honroJourneyReplay:true},{honroJourneyReplay:undefined},{honroAct6:{flags:{'act6.daedosaStopped':true}}}]){
  assert.equal(settlementPlan(save,battle(58,override),true,live),null);
 }
 for(const key of Object.keys(live))assert.equal(settlementPlan(save,battle(58),true,{...live,[key]:true}),null);
 assert.equal(settlementPlan(save,battle(58),true),null);
 publish(save,58);assert(canEnter(save,59,true));
 save.cleared[56]=null;
 assert(!canEnter(save,59,true));
});
