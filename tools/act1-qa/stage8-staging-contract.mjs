/** Focused pure-contract regression, NOT a gameplay clear or live-state fixture.
 * Stage8's dedicated locomotion must retain executable steps until settle().
 * The ordinary full-play witness is separately retained in _local reports. */
import assert from 'node:assert/strict';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
const {g}=await appHarness({productionStory:true});
g.HonroStage8Bier.installScene();const id=g.HonroStage8Bier.SCENE;
const staging={id,steps:[{type:'move',actor:'boss',to:{x:5950,y:4250,surfaceId:'s8-court'},duration:1000,caption:'빈 상여가 안전한 길을 따라 중앙 아래뜰로 움직인다.'},{type:'dialogue',lines:[['서술','빈 상여가 아래뜰에 멎었다.']]}],context:{},cursor:0,elapsed:0,applied:{},results:{},position:'before',waitForDialogue:false,complete:false};
const result=g.HonroStoryStaging.reader([['서술','빈 상여가 아래뜰에 멎었다.',{storyId:id}]],{title:'줄을 놓친 빈 상여',staging:plain(staging)});
console.log(JSON.stringify({scope:'Pure staging API contract; no battle created or modified',scene:id,before:staging,after:result.options.staging},null,2));
const motion=result.options.staging.bierMotion||result.options.staging;assert(motion.steps.some(s=>s.type==='move'),'Stage8 collision-checked movement steps must survive reader conversion');
assert.equal(motion.complete,false,'Reader conversion must not pre-complete dedicated locomotion');
