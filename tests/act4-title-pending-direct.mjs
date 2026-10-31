/** Title resume of a direct chapter handoff; model DOM double, not browser proof. */
import assert from 'node:assert/strict';import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g;
for(const [cleared,next] of [[1,2],[9,10],[18,19],[38,39],[39,40]]){
 const p=h.profileThrough(cleared);p.mapNode=next;p.lastStage=cleared;p.honroJourney={version:1,talked:{},pendingDirect:next};const app=h.load(plain(p));assert.equal(g.HonroJourneyContent.next(app.profile).stageId,next);assert.equal(app.screen,'title');g.HonroRestJourney.requestRest(app);assert.equal(app.engine?.b?.honroStage,next,`title direct resume ${next}`);assert.equal(app.screen,'battle');assert.equal(app.profile.honroJourney.pendingDirect,undefined);app.stopBattle();
}
{const p=h.profileThrough(38);p.honroJourney={version:1,talked:{},pendingDirect:40};const app=h.load(plain(p));g.HonroRestJourney.requestRest(app);assert.notEqual(app.engine?.b?.honroStage,40,'stale pending target never launches');}
console.log('PASS title pending direct 1→2, 9→10, 18→19, 38→39, 39→40 and stale target');
