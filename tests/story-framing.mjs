import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,profileThrough,finish}=h,F=g.HonroStoryFraming,checks=[];
const a=load(profileThrough(1));a.launch(2);finish(a);a.scene.size=()=>({w:390,h:648});a.scene.canvas={getBoundingClientRect:()=>({top:0,left:0})};
let scene=a.scene;
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
check('Chapter 2 conversation explicitly frames the bier and Damheo, based on scene/index metadata',()=>{
 const rows=F.bind(a,g.HonroObjectives.entry(a),{after:'entry'});const line=rows.find(l=>l[1].includes('위에서 돕'));assert(line);assert.deepEqual(plain(line[2].camera.targets),[{actor:'objective'},{actor:'npc-damheo'}]);F.focus(a,line[2]);F.apply(scene,a.engine);const r=scene.storyFrameReport;assert(!r.missing.length);assert(r.boxes.length===2);assert(r.camera.scale<=.9);const before=scene.scale;a.engine.b.units.find(u=>u.id==='npc-damheo').x+=600;F.apply(scene,a.engine);assert(scene.scale<before,'fit must respond to current actor positions');
});
check('Explicit objective references use the full real actor bounds, and missing targets have a recorded fallback',()=>{
 F.focus(a,{camera:{id:'guide-test',intent:'objective',targets:[{objective:'objective'}]}});F.apply(scene,a.engine);const obj=a.engine.b.units.find(u=>u.id==='objective'),box=scene.storyFrameReport.boxes[0];assert(box.h>=obj.h);assert(box.y<obj.y&&box.y+box.h>obj.y);
 F.focus(a,{camera:{id:'missing-test',intent:'situation',targets:[{marker:'does-not-exist'}]}});F.apply(scene,a.engine);assert.equal(scene.storyFrameReport.missing.length,1);assert(scene.storyFrameReport.fallback);assert(Number.isFinite(scene.x)&&Number.isFinite(scene.scale));
});
check('Manual page save retains explicit framing; completion clears it and preserves the original playback camera',()=>{
 g.HonroStory.start(a,[['설오','검사',{camera:{id:'stored-camera',intent:'portrait',targets:[{actor:'archer'}]}}]],{title:'검사'});const d=plain(a.engine.b.honroStory);assert.equal(d.lines[0][2].camera.id,'stored-camera');assert(scene.storyFrame);g.HonroStory.finish(a);assert(!scene.storyFrame);assert(!a.dialogue);
});
check('Scripted spirit aliases and a real lamp marker remain explicit camera subjects',()=>{
 const id=a.engine.b.units.find(u=>u.side===1).id,marker=a.engine.b.honroMarkers[0].id,rows=F.bind(a,[['설오','관찰',{storyId:'act2:first-spirit-encounter',sceneTarget:id}],['안내','표시된 혼과 등불',{kind:'guide',sceneTarget:id,sceneLamp:marker}]],{staging:{context:{spirit:id},cues:[[{type:'look',at:{actor:'$spirit'}}],[]]}});assert.equal(rows[0][2].camera.targets[0].actor,id);assert.deepEqual(plain(rows[1][2].camera.targets),[{actor:id},{marker}]);
});
await report('story-framing',checks,{limits:['App/Engine production code with DOM/Canvas doubles. Browser corpus tests contain real layout and rendered image evidence.']});
