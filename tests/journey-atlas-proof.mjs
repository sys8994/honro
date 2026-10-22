import assert from 'node:assert/strict';
import {menuRuntime,atlasMarkup,menuProfile} from '../tools/environment/atlas-proof.mjs';
const g=await menuRuntime(),p=menuProfile(g,18),before=JSON.stringify(p);
for(const selection of [5,12,18,21]){
 const act=g.HonroRestJourney.actOf(selection),html=atlasMarkup(g,{profile:p,selection}),visible=g.HonroJourneyContent.places.filter(v=>g.HonroRestJourney.actOf(v.stageId)===act&&g.HonroRestJourney.actOpen(p,act)&&g.HONRO_CONTENT.stages[v.stageId-1].requires.every(id=>p.cleared[id]));
 assert.equal((html.match(/class="journey-pin /g)||[]).length,visible.length);assert.match(html,/data-action="journey-act"/);if(visible.length)assert.match(html,/data-action="journey-zoom"/);assert.doesNotMatch(html,/journey-pin unreached|journey-layer|journey-route-overlay/);
}
const afterAct2=menuProfile(g,21);assert.equal(g.HonroJourneyContent.next(afterAct2).stageId,21);
const afterAct3=menuProfile(g,null);assert.equal(Object.keys(afterAct3.cleared).length,30);assert.equal(g.HonroJourneyContent.next(afterAct3),null);
const end=atlasMarkup(g,{profile:afterAct3,next:null,selection:'end'});assert.match(end,/현 위치 · 셋째 막 끝/);assert.equal((end.match(/class="journey-pin /g)||[]).length,10);assert.match(end,/data-action="journey-travel" data-id="end"/);assert.equal(JSON.stringify(p),before);
console.log('PASS native-act production markup, unlock filtering, 20→21 and terminal30 CTA; not browser evidence');
