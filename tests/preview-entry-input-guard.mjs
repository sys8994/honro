/** Focused driver-timing model: real App navigation, doubled clock/DOM/events.
 * This is not a Chromium pass or evidence for preview observer semantics. */
import assert from 'node:assert/strict';
import {appHarness} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true});
let now=1000;h.g.performance={now:()=>now};
function trusted(action,id){const el={dataset:{action,id:String(id)},disabled:false};for(const fn of h.listeners.get('click')||[])fn({isTrusted:true,detail:1,target:{closest:()=>el}});}
for(const stage of [16,18]){
 const p=h.profileThrough(stage-1);p.honroJourney={version:1,restStageId:stage,talked:{}};
 const a=h.load(p);trusted('rest');h.finish(a);
 assert.equal(a.screen,'rest');assert.equal(a.journeyInputAfter,now+400);
 now+=120;trusted('journey-enter',stage);
 assert.equal(a.screen,'rest','Original smoke click is rejected during transition guard');assert(!a.engine);
 now=a.journeyInputAfter;trusted('journey-enter',stage);h.finish(a);
 assert.equal(a.engine.b.honroStage,stage,'Same trusted entry succeeds after genuine deadline');
 console.log(`PASS Stage${stage}: early trusted click rejected; deadline-expired entry accepted (DOM/clock doubles)`);
 now+=1000;
}
