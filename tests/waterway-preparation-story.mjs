// Production story/save/navigation with DOM and Canvas doubles. These fixtures
// do not establish normal combat completion or browser presentation.
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,reload,profileThrough,click,finish}=h,J=g.HonroJourneyContent,H=g.HONRO_CONTENT,checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
check('A rescued existing carrier supplies a bounded terrain clue after the original land-register clue',()=>{
 const lines=H.stages[22].outro;assert.equal(lines.length,2);
 assert.equal(lines[0][0],'휘겸');assert.equal(lines[0][1],'운송 문서에 토지 장부 번호가 남았소. 그 끝의 문장이 낯익군.');
 assert.equal(lines[1][0],'짐꾼');assert.match(lines[1][1],/물이 차서 발판이 끊겼/);assert.match(lines[1][1],/수리하러 다니던 위쪽 통로/);
 assert(lines.every(l=>l[2].storyId==='act3-outro-23'));
 assert.doesNotMatch(lines[1][1],/주조|비밀|조직|가족 번호|진목/);
});
check('The last existing rest has one appended in-character preparation page, retaining original narration',()=>{
 const lines=J.interlude(24);assert.equal(J.at(24).restName,'폐가 담장 밖');assert.equal(lines.length,2);
 assert.equal(lines[0][0],'서술');assert.equal(lines[0][1],H.stages[23].narration[0]);
 assert.equal(lines[1][0],'담허');assert.match(lines[1][1],/짐꾼 말대로라면/);assert.match(lines[1][1],/축지진목/);
 assert.doesNotMatch(lines[1][1],/배웠|수련했|버튼|누르|장착|슬롯|기예창/);
 assert(lines.every(l=>l[2].storyId==='rest-interlude-v1-24'&&!l[2].optional));
 assert.deepEqual(plain(J.required(profileThrough(23),24)),plain(lines));
});
check('Old first-page rest saves and new preparation-page saves resume their exact indices and speakers',()=>{
 for(const index of [0,1]){let app=load(profileThrough(23));click('rest');if(app.dialogue.restKind==='map')g.HonroStory.finish(app);
  app.dialogue.index=index;g.HonroStory.draw(app);const saved=plain(app.dialogue.lines[index]);app=reload();click('rest');
  assert.equal(app.dialogue.id,'rest-interlude-v1-24');assert.equal(app.dialogue.index,index);assert.deepEqual(plain(app.dialogue.lines[index]),saved);
  finish(app);const log=app.profile.honroNarrative.find(x=>x.id==='rest-interlude-v1-24');assert.deepEqual(plain(log.lines),plain(J.interlude(24)));
  click('journey-enter',{id:'24'});assert(!app.dialogue.lines.some(l=>l[1]===J.interlude(24)[1][1]));
 }
});
check('Existing completed rest scenes stay completed; split transitions do not introduce another rest',()=>{
 let app=load(profileThrough(23));app.profile.seen['map-story-v'+g.HonroStoryContent.version+'-23']=true;app.profile.seen['rest-interlude-v1-24']=true;click('rest');assert.equal(app.dialogue,null);
 app.launch(24);finish(app);
 for(const id of [24,25,26,27]){assert.equal(app.stage.id,id);app.engine.b.phase='won';app.outcome(true);click('result-continue');assert.equal(app.screen,'battle');assert.equal(app.stage.id,id+1);finish(app);}
});
await report('waterway-preparation-story',checks);
