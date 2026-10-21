import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,profileThrough,finish}=h,F=g.HonroStoryFraming,checks=[];
const a=load(profileThrough(1));a.launch(2);finish(a);a.scene.size=()=>({w:390,h:648});a.scene.canvas={getBoundingClientRect:()=>({top:0,left:0})};
let scene=a.scene;
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
check('Chapter 2 conversation explicitly frames the bier and Damheo, based on scene/index metadata',()=>{
 const rows=F.bind(a,g.HonroObjectives.entry(a),{after:'entry'});const line=rows.find(l=>l[1].includes('위에서 돕'));assert(line);assert.deepEqual(plain(line[2].camera.targets),[{actor:'objective'},{actor:'npc-damheo'}]);F.focus(a,line[2]);F.apply(scene,a.engine);const r=scene.storyFrameReport;assert(!r.missing.length);assert(r.boxes.length===2);assert(r.targetCamera.scale<=.9);const before=r.targetCamera.scale;a.engine.b.units.find(u=>u.id==='npc-damheo').x+=600;F.apply(scene,a.engine);assert(scene.storyFrameReport.targetCamera.scale<before,'target fit must respond to current actor positions independently of interpolation');
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
check('Chapter 10 separates eastern arrivals from the nearby ritual defenders',()=>{
 const app=load(profileThrough(9));app.launch(10);finish(app);const b=app.engine.b,boss=b.units.find(u=>u.id==='boss'),knight=b.units.find(u=>u.cls==='knight'&&u.side===0),mage=b.units.find(u=>u.cls==='mage'&&u.side===0);
 knight.x=boss.x+200;knight.y=boss.y;mage.x=boss.x-2000;const box=F.bounds(app,{nearbyAllies:'boss'}),near=F.bounds(app,{actor:knight.id}),far=F.bounds(app,{actor:mage.id});assert(box.x<=near.x&&box.x+box.w>=near.x+near.w);assert(box.x>far.x+far.w);
 const lines=F.bind(app,g.HonroStoryContent.cooperationDefense(),{});assert.deepEqual(plain(lines[0][2].camera.targets),[{anchor:'eastHall'},{anchor:'outerEast'}]);assert.deepEqual(plain(lines[3][2].camera.targets),[{nearbyAllies:'boss'}]);
});
check('Center and zoom approach one target in 250–450ms without a first-frame snap',()=>{
 F.clear(scene);Object.assign(scene,{x:500,y:700,scale:.6});
 F.focus(a,{camera:{id:'motion-one',intent:'portrait',targets:[{actor:'archer'}],maxScale:1.05}});
 const start=scene.storyFrame.motion.time,frames=[];for(let ms=0;ms<=432;ms+=16){F.apply(scene,a.engine,start+ms);frames.push({ms,x:scene.x,y:scene.y,scale:scene.scale});}
 assert.equal(frames[0].x,500);assert.equal(frames[0].y,700);assert(Math.abs(frames[0].scale-.6)<1e-10);
 const target=scene.storyFrameReport.targetCamera,last=frames.at(-1);assert(target.scale<=.82);assert(Math.hypot(last.x-target.x,last.y-target.y)*target.scale<.5);assert(Math.abs(last.scale-target.scale)<.001);
 assert(frames.slice(1,-1).some(f=>f.x!==500&&f.x!==target.x));
 const errors=frames.map(f=>Math.hypot(f.x-target.x,f.y-target.y));assert(errors.every((v,i)=>!i||v<=errors[i-1]+1e-8));
});
check('Rapid next/back retargets the current frame and velocity, without a queue or stale target',()=>{
 F.clear(scene);Object.assign(scene,{x:900,y:800,scale:.7});F.focus(a,{camera:{id:'rapid-a',intent:'situation',targets:[{x:1800,y:1800}]}});
 const t=scene.storyFrame.motion.time;F.apply(scene,a.engine,t+70);const before={x:scene.x,y:scene.y,scale:scene.scale,vx:scene.storyFrame.motion.vx};
 F.focus(a,{camera:{id:'rapid-b',intent:'conversation',targets:[{actor:'archer'}]}});const next=scene.storyFrame.motion.time;F.apply(scene,a.engine,next);
 assert.equal(scene.x,before.x);assert.equal(scene.y,before.y);assert(Math.abs(scene.scale-before.scale)<1e-10);assert.equal(scene.storyFrame.motion.vx,before.vx);
 for(let ms=16;ms<=448;ms+=16)F.apply(scene,a.engine,next+ms);
 const target=scene.storyFrameReport.targetCamera;assert(Math.hypot(scene.x-target.x,scene.y-target.y)*target.scale<.5);assert.equal(scene.storyFrame.camera.id,'rapid-b');
 const motion=scene.storyFrame.motion;F.focus(a,{camera:scene.storyFrame.camera});assert.equal(scene.storyFrame.motion,motion,'redraw must not restart the transition');
});
check('Reduced motion resolves the target directly; saved high zoom metadata respects middle-distance limits',()=>{
 g.matchMedia=()=>({matches:true});F.focus(a,{camera:{id:'reduced',intent:'conversation',targets:[{actor:'archer'}],maxScale:1.15}});F.apply(scene,a.engine);
 assert.deepEqual(plain(scene.storyFrameReport.camera),plain(scene.storyFrameReport.targetCamera));assert(scene.scale<=F.scaleLimits.conversation);assert(scene.storyFrameReport.reducedMotion);delete g.matchMedia;F.clear(scene);
});
await report('story-framing',checks,{limits:['App/Engine production code with DOM/Canvas doubles. Browser motion evidence contains real layout and rendered screen time series.']});
