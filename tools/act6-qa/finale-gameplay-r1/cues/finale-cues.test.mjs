import test from 'node:test';
import assert from 'node:assert/strict';
import {cueState,observeNativeCue} from './finale-cues.mjs';
const emit=(s,key,evidence,opts={})=>observeNativeCue(s,{stage:s.stage,attemptIdentity:s.attemptIdentity,tick:120,key,evidence,...opts});
test('Wrong stage or old attempt cannot caption current battle',()=>{
 const s=cueState(58,'second'); const e={aligned:true,answered:true,aliveHuman:true,interactable:true};
 assert.equal(emit(s,'ritual.manifested',e,{stage:59}),null);
 assert.equal(emit(s,'ritual.manifested',e,{attemptIdentity:'first'}),null);
 assert.throws(()=>cueState(53,'second'));
 assert.equal(emit(s,'ritual.manifested',e).speaker,'대도사');
});
test('First alignment or false reveal does not announce a boss',()=>{
 const s=cueState(58,'second'); const e={aligned:true,answered:true,aliveHuman:true,interactable:true};
 for(const k of Object.keys(e)) assert.equal(emit(s,'ritual.manifested',{...e,[k]:false}),null,k);
 assert.equal(emit(s,'ritual.manifested',e).blocksInput,false);
});
test('Restored history does not replay one-shot warning; stale offers cannot advance tick',()=>{
 const e={sourceLive:true,locked:true,upperSafe:true,hasResponse:true};
 let s=cueState(58,'boss');
 assert.equal(emit(s,'expansion.locked',{...e,hasResponse:false},{tick:180}),null);
 assert.equal(emit(s,'expansion.locked',e,{tick:121}).channel,'warning');
 s=JSON.parse(JSON.stringify(s));
 assert.equal(emit(s,'expansion.locked',e,{tick:122}),null);
 const end={aliveHuman:true,expansionDisabled:true,noncombat:true,sameBody:true};
 assert.equal(emit(s,'expansion.humanBound',end,{tick:120}),null);
 assert.equal(emit(s,'expansion.humanBound',end,{tick:162}).channel,'scene');
});
test('6-6 honest warning and interrupted shot use different receipts',()=>{
 const s=cueState(56,'reflow');
 assert.equal(emit(s,'reflow.warned',{activeBand:true,hasResponse:true}),null);
 assert.equal(emit(s,'reflow.warned',{activeBand:true,safeFooting:true,hasResponse:true}).speaker,'담허');
 assert.equal(emit(s,'reflow.interrupted',{interrupted:true}),null);
 assert.equal(emit(s,'reflow.interrupted',{nativeContact:true,interrupted:true}).channel,'confirmation');
});
test('Neutral dead never trigger attack caption, standalone giant visual insufficient',()=>{
 const s=cueState(59,'last yard');
 assert.equal(emit(s,'wave.firstContact',{nativeEntered:true,firstWave:true}),null);
 assert.equal(emit(s,'wave.firstContact',{nativeEntered:true,firstWave:true,liveHostile:true}).speaker,'휘겸');
 assert.equal(emit(s,'giant.winding',{hasResponse:true,giantVisible:true}),null);
 assert.equal(emit(s,'giant.winding',{locked:true,giantVisible:true,hasResponse:true}).channel,'warning');
});
test('No ending caption before closed real wave policy and valid soul path',()=>{
 const s=cueState(59,'last yard');
 const e={outerComplete:true,innerSignal:true,wavesClosed:true,soulPathOpen:true};
 for(const k of Object.keys(e)) assert.equal(emit(s,'garmjin.finished',{...e,[k]:false}),null,k);
 assert.equal(emit(s,'garmjin.finished',e).speaker,'소단');
});
