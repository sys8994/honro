import assert from 'node:assert/strict';
import {menuRuntime,atlasMarkup,menuProfile} from '../tools/environment/atlas-proof.mjs';
const g=await menuRuntime(),p=menuProfile(g,18),before=JSON.stringify(p);
for(const layer of ['surface','underground','city']){
 const selection=layer==='surface'?11:layer==='city'?21:18;
 const html=atlasMarkup(g,{profile:p,next:18,layer,selection}),visible=g.HonroJourneyContent.places.filter(v=>v.layer===layer&&g.HONRO_CONTENT.stages[v.stageId-1].requires.every(id=>p.cleared[id]));
 assert.equal((html.match(/class="journey-route /g)||[]).length,Math.max(0,visible.length-1));
 assert.equal((html.match(/class="journey-pin /g)||[]).length,visible.length);
 if(visible.length)assert.match(html,/journey-region/);else assert.doesNotMatch(html,/journey-region/);
 assert.match(html,/data-action="journey-layer"/);assert.match(html,/data-action="journey-zoom"/);assert.doesNotMatch(html,/journey-pin unreached/);
 if(layer==='underground')assert.match(html,/aria-current="location"/);else assert.doesNotMatch(html,/aria-current="location"/);
}
const afterAct2=menuProfile(g,21);assert.equal(g.HonroJourneyContent.next(afterAct2).stageId,21);
const afterAct3=menuProfile(g,null);assert.equal(Object.keys(afterAct3.cleared).length,30);assert.equal(g.HonroJourneyContent.next(afterAct3),null);
const end=atlasMarkup(g,{profile:afterAct3,next:null,layer:'city',selection:'end'});assert.match(end,/현 위치 · 셋째 막 끝/);
assert.equal(JSON.stringify(p),before);
console.log('PASS three-layer production atlas and explicit20→21/30-end locations; not a browser proof');
