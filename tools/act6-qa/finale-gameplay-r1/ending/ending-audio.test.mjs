import test from 'node:test';
import assert from 'node:assert/strict';
import {begin,cue} from './ending-audio.mjs';
const session=()=>begin({stage:60,owner:'one run',eventComplete:true,mode:'act6-ending'});
const E=(s,phase,more={})=>cue(s,{stage:60,owner:'one run',phase,...more});
test('does not touch other Act or preview without prior native ending',()=>{
 for(const stage of [1,40,50,59,61])assert.equal(begin({stage,owner:'foreign',eventComplete:true,mode:'act6-ending'}),null);
 assert.equal(begin({stage:60,owner:'any',eventComplete:false,mode:'act6-ending'}),null);
 const s=session();
 assert.deepEqual(E(s,'last-souls',{owner:'other run'}),[]);
 assert.deepEqual(E(s,'first-dawn'),[]);
 assert.equal(s.phase,-1);
});
test('battle resolves into silence, one optional title motif, then silence',()=>{
 const s=session();
 assert.deepEqual(E(s,'last-souls'),[{gain:0,fadeMs:900,channel:'combat'}]);
 assert.equal(E(s,'fallen-record')[0].gain,0);
 const motif=E(s,'first-dawn',{authorizedGesture:true})[0];
 assert.equal(motif.asset,'assets/bgm/main.mp3');
 assert.equal(motif.loop,false);assert.equal(motif.essential,false);
 assert.deepEqual(E(JSON.parse(JSON.stringify(s)),'first-dawn',{authorizedGesture:true}),[]);
 assert.equal(E(s,'later-return')[0].gain,0);
 assert.equal(E(s,'complete')[0].gain,0);
});
test('muted sound, autoplay locked or failed decoding do not block progress or retry motif',()=>{
 for(const more of [{muted:true,authorizedGesture:true},{authorizedGesture:false},{canDecode:false,authorizedGesture:true}]){
  const s=session();E(s,'last-souls');E(s,'fallen-record');
  assert.deepEqual(E(s,'first-dawn',more),[]);assert(s.cueConsumed);
  assert.deepEqual(E(s,'first-dawn',{authorizedGesture:true}),[]);
  assert.equal(E(s,'later-return')[0].fadeMs,1200);
 }
});
