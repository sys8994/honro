import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import vm from 'node:vm';
import {selectEndingCue} from '../shared/act6-ending-replan/cues.mjs';

const code=await readFile(new URL('../shared/runtime/campaign-stills.js',import.meta.url),'utf8');
const cut=(id,options)=>({id,alt:id,motion:'still',beats:[id],duration:6,assets:{land:id+'-land',port:id+'-port'},...options});
const art=stage=>[cut('payoff',{existing:true}),cut('bridge'),cut('foreshadow')];
const data={opening:[0,1,2,3,4].map(i=>cut('opening-'+i)),endings:{20:art(20),30:art(30)}};
function harness(overrides={}){
 const runtime={HonroStoryContent:{version:9},HONRO_ACT_ENDINGS:{20:{image:'stock20',portraitImage:'stock20mobile'},30:{image:'stock30'}}};
 let view,saveCount=0,continueCount=0;
 const app={profile:{cleared:{},seen:{},lastStage:1},screen:'title',cancelInput(){},close(){},persist(){saveCount++;},...overrides};
 const player=(G,assets,css,t)=>({open(a,mode,leave,opts){const result={close(){result.closed=true;}};view={mode,assets,t,opts,leave,result};return result;},prewarm(){},play(){}});
 const sandbox={...runtime,campaignStillsData:data,campaignStillsPlayer:player,campaignStillsCueAt:selectEndingCue,campaignStillsCss:''};
 vm.runInNewContext(code,sandbox);
 const api=sandbox.HonroCampaignStills;
 return {api,app,get view(){return view;},get saves(){return saveCount;},get advances(){return continueCount;},start:()=>api.openFresh(app,()=>continueCount++)};
}
test('opening leaves a normal fresh save untouched until finish and only marks the superseded map scene and the redundant Hongman line',()=>{
 const h=harness();
 assert.equal(h.start(),true);
 assert.equal(h.view.mode,'opening');
 assert.equal(h.view.t.cuts.length,5);
 assert.equal(h.app.screen,'act-ending');
 assert.equal(h.saves,0);
 assert.deepEqual(h.app.profile.seen,{});
 h.view.leave();
 assert.equal(h.app.screen,'title');
 assert.deepEqual(h.app.profile.seen,{'honro-opening-stills-v1':true,'map-story-v9-0':true,'rest-interlude-v1-1':true});
 assert.equal(h.saves,1);
 assert.equal(h.advances,1);
 assert.equal(h.start(),false);
});
test('old map scene evidence, progress, continuation and every non-campaign surface block the opening',()=>{
 for(const opts of [{debugMode:true},{training:true},{customMap:true},{screen:'journey'},{engine:{}},{profileStore:{locked:true}},
  ...[{honroBattle:{}},{honroMapStory:{}},{honroMapRestart:{}},{honroJourney:{story:{}}},{honroJourney:{stageId:2}},{honroActEnding:{}},{cleared:{1:true}},{seen:{'map-story-v9-0':true}},{lastStage:2}].map(profile=>({profile}))]){
  const h=harness(opts);
  assert.equal(h.start(),false,JSON.stringify(opts));
  assert.equal(h.saves,0);
 }
});
test('only approved canonical evidence IDs are distributed and the original art is retained',()=>{
 for(const [stage,key,expect] of [
  [20,'rowIds',[['payoff','a'],['bridge','b','c'],['foreshadow','d','next']]],
  [30,'reviewedRowIds',[['payoff','a','b'],['bridge','c'],['foreshadow','d','next']]]
 ]){
  const h=harness(),state={stage,stillBeat:1},prefix='EDGE.ACTENDINGS_'+stage+'_LINES_';
  const stock={image:'legacy.jpg',nextTitle:'next',lines:['a','b','c','d','DO NOT SHOW','MISMATCH'],[key]:[0,1,2,3,5].map(i=>prefix+i).concat('EDGE.ACTENDINGS_40_LINES_3')};
  assert.ok(h.api.showEnding(h.app,state,stock,'completion',()=>{}));
  assert.deepEqual(JSON.parse(JSON.stringify(h.view.t.cuts.map(c=>c.beats))),expect);
  assert.equal(h.view.assets.stills.payoff.land,'stock'+stage);
  assert.equal(h.view.assets.stills.payoff.port,stage===20?'stock20mobile':'stock30');
  assert.equal(h.view.opts.startAt,h.view.t.beatOffsets[1]);
  h.view.opts.onCue({index:1,beat:0});
  assert.equal(state.stillBeat,expect[0].length);
  assert.equal(h.saves,1);
 }
});
test('debug never leaks unidentified old lines or writes a cursor',()=>{
 const h=harness(),state={stage:20,debug:{}};
 const stock={image:'legacy.jpg',lines:['UNVERIFIED']};
 assert.ok(h.api.showEnding(h.app,state,stock,'debug',()=>{}));
 assert.equal(h.view.t.cuts.flatMap(c=>c.beats).includes('UNVERIFIED'),false);
 h.view.opts.onCue({index:1,beat:0});
 assert.equal(h.saves,0);
 assert.equal(state.stillBeat,undefined);
 h.api.close(h.app);
 assert.equal(h.view.result.closed,true);
 assert.equal(h.api.active(h.app),false);
});
