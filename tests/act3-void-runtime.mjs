// Production App/Engine and real stage27 collision with explicit late-mission
// fixtures. DOM/audio are doubles; this is not normal-combat/browser evidence.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report,KEY} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h;
if(!g.HonroAct3Void)vm.runInContext(await readFile('shared/runtime/act3-void.js','utf8'),g);
const awaitCopy=await readFile('game/docs/story/voice-v2-editorial/drafts/act3-scenes.json','utf8');
const V=g.HonroAct3Void,A=g.HonroAct3,P=g.HonroStakeCrossing,checks=[];
let wallTime=0;g.performance={now:()=>wallTime};
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
function fixture({old=false,lead='archer'}={}){
 const app=h.load(h.profileThrough(26));app.launch(27);h.finish(app);app.turnNotice=null;app.done=false;app.modal.classList.remove('open');
 const e=app.engine,b=e.b;if(old)delete b.honroAct3Void;else assert.equal(b.honroAct3Void?.revision,1,'fresh authored map must enable the scene');V.attach(app,e);
 const a=b.units.find(u=>u.side===0&&u.cls==='archer'),m=b.units.find(u=>u.side===0&&u.cls==='mage');
 const landing=b.honroMap.act3.crossings.at(-1).landing,x=(landing.left+landing.right)/2;
 const place=(u,x)=>Object.assign(u,{x,y:g.HonroMapEngine.surfaceY(b.terrain,x,landing.y).y,vx:0,vy:0,airborne:false,jumping:false,acted:false});
 place(a,x-40);place(m,x+40);b.active=lead==='mage'?m.id:a.id;b.side=0;b.phase='aim';b.projectiles=[];b.volley=undefined;app.scene.x=1234;app.scene.y=3456;app.scene.scale=.7;app.scene.manual=true;
 return {app,e,b,a,m,landing,place};
}
function step(app,seconds){for(let n=0;n<Math.ceil(seconds/.05);n++){wallTime+=50;V.frame(app,.05);}}
function resolve(f){const camera=f.b.honroAct3Void.return.camera,expected=Object.fromEntries(['x','y','scale','manual'].map(k=>[k,camera[k]]));assert(V.skip(f.app));step(f.app,.4);assert.equal(f.b.honroAct3Void.state,'RESOLVED');assert.deepEqual(plain(f.app.storyCamera),plain(expected));assert.equal(f.app.dialogue?.lines[0][0],'담허');assert.equal(f.app.dialogue?.lines[0][2].storyId,V.KEY+'-return');h.finish(f.app);}
check('New deep gallery approach triggers with either companion leading and before physics can apply a fall',()=>{
 for(const lead of ['archer','mage']){const f=fixture({lead});assert(V.eligible(f.app));const origin={x:f.a.x,y:f.a.y},mage=plain(f.m);f.e.tick(1/120);assert.equal(f.b.honroAct3Void.state,'FALLING');step(f.app,.3);assert(f.a.y>origin.y);assert(f.a.x>origin.x);assert.deepEqual(plain(f.m),mage);assert.equal(f.b.active,lead==='mage'?f.m.id:f.a.id);assert.equal(f.a.hp,f.b.honroAct3Void.return.unit.hp);resolve(f);assert.equal(f.a.x,origin.x);assert.equal(f.a.y,origin.y);}
});
check('Damheo reaching the deep gallery alone never pulls Seolo from an earlier platform',()=>{
 const f=fixture({lead:'mage'}),start=f.b.honroMap.act3.crossings[0].fromZone;
 Object.assign(f.a,{x:(start.left+start.right)/2,y:start.y,vx:0,vy:0});const before=plain(f.a);
 assert(!V.eligible(f.app));assert.equal(f.b.honroAct3Void.state,'READY');
 const list=A.steps(f.b),idx=list.findIndex(s=>s.id==='family-manifest');for(const s of list.slice(0,idx)){A.memory(f.b).done[s.id]=true;const m=A.marker(f.b,s.id);if(m)m.collected=true;}
 const target=A.marker(f.b,'family-manifest');for(const u of f.b.units.filter(u=>u.side===1)){u.dead=true;u.hp=0;}Object.assign(f.m,{x:target.x,y:target.y});
 assert(A.eligibility(f.app,target).ok);assert.equal(A.use(f.app,target),false);assert.equal(f.b.honroAct3Void.state,'READY');assert.deepEqual(plain(f.a),before);assert(!target.collected);assert(!f.m.acted);
 Object.assign(f.a,{x:target.x-80,y:target.y});assert.equal(A.use(f.app,target),false);assert.equal(f.b.honroAct3Void.state,'FALLING');resolve(f);
});
check('Final manifest capture is guarded even when a long route bypasses the gallery and Damheo arrives first',()=>{
 const f=fixture({lead:'mage'}),list=A.steps(f.b),idx=list.findIndex(s=>s.id==='family-manifest');
 for(const s of list.slice(0,idx)){A.memory(f.b).done[s.id]=true;const m=A.marker(f.b,s.id);if(m)m.collected=true;}
 const target=A.marker(f.b,'family-manifest');for(const u of f.b.units.filter(u=>u.side===1)){u.dead=true;u.hp=0;}
 Object.assign(f.m,{x:target.x,y:target.y,vx:0,vy:0});
 // Seolo remains on a different already-safe platform. No forced traversal
 // sequence or extra arrival requirement is added to the objective system.
 assert(A.eligibility(f.app,target).ok);assert.equal(A.use(f.app,target),false);assert.equal(!!target.collected,false);assert.equal(f.b.honroAct3Void.state,'FALLING');
 resolve(f);assert(A.use(f.app,target));assert(A.memory(f.b).done['family-manifest']);
});
check('Void pauses every Engine clock, poison, summoned actor, team ends and resources; returning restores camera and active selection',()=>{
 const f=fixture({lead:'mage'});f.a.hp-=9;f.a.focus-=5;f.a.cooldowns={A06:2};f.a.status={poison:{turns:3,power:10}};
 const before=plain({units:f.b.units,items:f.b.items,round:f.b.round,teamEnds:f.b.teamEnds,phase:f.b.phase,active:f.b.active,fields:f.b.fields,stakes:f.b.stakes,heroes:f.b.heroes,camera:{x:f.app.scene.x,y:f.app.scene.y,scale:f.app.scene.scale,manual:f.app.scene.manual}});
 assert(V.begin(f.app));step(f.app,V.TIMING.total+.1);assert.equal(f.b.honroAct3Void.state,'VOID');for(let i=0;i<100;i++){f.e.tick(.05);f.app.missionTick(.05);f.app.checkMission(f.e);}resolve(f);
 assert.deepEqual(plain({units:f.b.units,items:f.b.items,round:f.b.round,teamEnds:f.b.teamEnds,phase:f.b.phase,active:f.b.active,fields:f.b.fields,stakes:f.b.stakes,heroes:f.b.heroes,camera:{x:f.app.scene.x,y:f.app.scene.y,scale:f.app.scene.scale,manual:f.app.scene.manual}}),before);
 assert.equal(f.app.profile.honroStoryEvents[V.KEY],true);assert.equal(f.b.honroVoidWitness,true);assert.equal(f.app.root.inert,false);assert(!g.document.body.classList.contains('honro-void-active'));
});
check('FALLING paints without aim, active markers or objective arrows and restores presentation fields after each draw',()=>{
 const f=fixture(),targets=[{id:'record',x:10,y:20}],focus={x:10,y:20},tween={kind:'static',from:{x:1,y:2},to:{x:3,y:4}},scene=f.app.scene;
 Object.assign(scene,{missionTargets:targets,goalFocus:focus,storyTween:tween});let draws=0;
 scene.render=function(e,dt,selected,power,charging,effectDt,paused){draws++;assert.equal(selected,'');assert.equal(this.skillPreview,true);assert.equal(this.missionTargets.length,0);assert.equal(this.goalFocus,null);assert.equal(this.storyTween,null);assert.equal(paused,true);};
 V.begin(f.app);V.frame(f.app,.05);assert.equal(draws,1);assert.equal(scene.missionTargets,targets);assert.equal(scene.goalFocus,focus);assert.equal(scene.storyTween,tween);assert(!Object.hasOwn(scene,'skillPreview'));V.abort(f.app);
});
check('Entry lasts 1.4 seconds; hidden tabs freeze every transition',()=>{
 const f=fixture();V.begin(f.app);step(f.app,.5);assert.equal(f.b.honroAct3Void.state,'FALLING');assert.equal(f.app.scene.x,f.a.x);assert.equal(f.app.scene.y,f.a.y-48);
 step(f.app,.4);assert.equal(f.b.honroAct3Void.state,'DARKENING');const elapsed=f.app.honroVoidSession.elapsed,pose=plain(f.a);g.document.hidden=true;step(f.app,10);g.document.hidden=false;assert.equal(f.app.honroVoidSession.elapsed,elapsed);assert.deepEqual(plain(f.a),pose);
 step(f.app,.55);assert.equal(f.b.honroAct3Void.state,'VOID');assert.equal(V.TIMING.total,1.4);resolve(f);
});
check('Immediate full lines accept deliberate input with only a 120ms duplicate guard; repeats and pause consume no cuts',()=>{
 const f=fixture();V.begin(f.app);for(let n=0;n<100;n++)V.advance(f.app);assert.equal(f.b.honroAct3Void.state,'FALLING');step(f.app,V.TIMING.total+.05);
 assert(V.advance(f.app));for(let n=0;n<100;n++)assert(!V.advance(f.app));assert.equal(f.app.honroVoidSession.line,1);
 const event={code:'Space',repeat:true,preventDefault(){}};step(f.app,.15);V.key(f.app,event);assert.equal(f.app.honroVoidSession.line,1);
 V.key(f.app,{...event,repeat:false});assert.equal(f.app.honroVoidSession.line,2);
 const age=f.app.honroVoidSession.elapsed;V.pause(f.app);step(f.app,2);assert.equal(f.app.honroVoidSession.elapsed,age);f.app.close();
 resolve(f);assert(!V.finish(f.app));assert(!V.abort(f.app));assert(!V.begin(f.app));assert(!V.skip(f.app));assert(!V.eligible(f.app));
});
check('Duplicate guard uses real event time even when render frames stall',()=>{
 const f=fixture();V.begin(f.app);step(f.app,1.45);assert(V.advance(f.app));assert(!V.advance(f.app));
 wallTime+=121;assert(V.advance(f.app));assert.equal(f.app.honroVoidSession.line,2);resolve(f);
});
check('Exact approved five-cut script, no blanks or forced waits, and exact three-line aftermath',()=>{
 const approved=JSON.parse(awaitCopy);
 assert.deepEqual(plain(V.sceneLines),approved.scenes['27.void.sceneLines'].map(([who,text])=>({text,align:who==='설오'?'near':'far'})));
 assert.deepEqual(plain(V.returnLines),approved.scenes['27.void.returnLines'].map(r=>r.slice(0,2)));
 const f=fixture();V.begin(f.app);step(f.app,V.TIMING.total+.05);for(let i=0;i<V.sceneLines.length;i++){assert.equal(f.app.honroVoidSession.line,i);assert(V.advance(f.app));step(f.app,.15);}
 assert.equal(f.b.honroAct3Void.state,'RETURNING');step(f.app,.4);assert.equal(f.b.honroAct3Void.state,'RESOLVED');
 const text=V.sceneLines.map(l=>l.text).join(' ');for(const forbidden of ['대도사','저문골','묵종','무명사','70년','80년','선택'])assert(!text.includes(forbidden));
});
check('Skipping from every transition or cut finishes once without resetting the return timer or bypassing the manifest',()=>{
 for(const phase of ['FALLING','DARKENING','VOID','RETURNING']){const f=fixture(),before=plain(f.a),memory=plain(A.memory(f.b));let starts=0;const start=g.HonroStory.start;g.HonroStory.start=(...args)=>{starts++;return start(...args);};
  try{V.begin(f.app);if(phase==='DARKENING')step(f.app,.85);if(['VOID','RETURNING'].includes(phase))step(f.app,1.45);if(phase==='RETURNING')V.skip(f.app);
   assert.equal(f.b.honroAct3Void.state,phase);if(phase!=='RETURNING')assert(V.skip(f.app));step(f.app,.15);const time=f.app.honroVoidSession.returning;for(let i=0;i<50;i++)assert(!V.skip(f.app));assert.equal(f.app.honroVoidSession.returning,time);step(f.app,.25);
   assert.equal(starts,1);assert.equal(f.b.honroAct3Void.state,'RESOLVED');assert.deepEqual(plain(f.a),before);assert.deepEqual(plain(A.memory(f.b)),memory);assert(!V.finish(f.app));assert.equal(starts,1);h.finish(f.app);
  }finally{g.HonroStory.start=start;}
 }
});
check('Transient save/reload always restores the pre-fall pose and READY without reopening black on Continue',()=>{
 for(const phase of ['FALLING','DARKENING','VOID','RETURNING']){const f=fixture(),before=plain(f.a),camera=plain({x:f.app.scene.x,y:f.app.scene.y,scale:f.app.scene.scale,manual:f.app.scene.manual});V.begin(f.app);if(phase==='DARKENING')step(f.app,V.TIMING.fall+.1);else if(phase!=='FALLING')step(f.app,V.TIMING.total+.1);if(phase==='RETURNING')V.skip(f.app);assert.equal(f.b.honroAct3Void.state,phase);
 f.app.profile.honroBattle=plain(f.b);h.storage.set(KEY,JSON.stringify(f.app.profile));const resumed=h.reload();resumed.continue();const b=resumed.engine.b;assert.equal(b.honroAct3Void.state,'READY');assert.equal(b.honroAct3Void.recovered,true);assert.deepEqual(plain(b.units.find(u=>u.id===before.id)),before);assert.deepEqual(plain({x:resumed.scene.x,y:resumed.scene.y,scale:resumed.scene.scale,manual:resumed.scene.manual}),camera);assert(!V.blocked(resumed));assert(!V.eligible(resumed));assert.equal(resumed.profile.honroStoryEvents?.[V.KEY],undefined);
 resumed.engine.move(0,0);assert(!b.honroAct3Void.recovered);assert(V.begin(resumed));resolve({app:resumed,b});
 }
});
check('Abandoning the scene restores the safe pose and retains replay availability without marking completion',()=>{
 const f=fixture(),before=plain(f.a);V.begin(f.app);step(f.app,.5);assert(V.abort(f.app));assert.deepEqual(plain(f.a),before);assert.equal(f.b.honroAct3Void.state,'READY');assert.equal(f.b.honroAct3Void.recovered,true);assert.equal(f.app.profile.honroStoryEvents?.[V.KEY],undefined);assert(!V.abort(f.app));
});
check('Existing Continue snapshots without the revision keep their map, objectives and story payload unchanged',()=>{
 const f=fixture({old:true}),before=plain(f.b);f.app.profile.honroBattle=before;h.storage.set(KEY,JSON.stringify(f.app.profile));const app=h.reload();app.continue();for(const k of ['terrain','honroMap','honroMarkers','honroAct3Steps','honroState'])assert.deepEqual(plain(app.engine.b[k]),before[k]);assert.equal(app.engine.b.honroAct3Void,undefined);assert(!V.begin(app));assert(!V.blocked(app));
});
check('Checkpoint retry keeps a resolved encounter while a fresh chapter revisit can replay it; later fresh entries retain only witness evidence',()=>{
 const f=fixture();P.initialize(f.b);P.takeCheckpoint(f.b);assert.equal(f.b.honroStakeCrossing.checkpoint.honroAct3Void.state,'READY');V.begin(f.app);resolve(f);assert(P.retry(f.app,'test checkpoint'));assert.equal(f.b.honroAct3Void.state,'RESOLVED');assert(!V.begin(f.app));
 const p=plain(f.app.profile);p.honroSplitCampaign.finished=true;p.cleared[27]={visits:1,rounds:5};const next=g.HonroWorld.build(g.HONRO_CONTENT.stages[28],p,false);assert.equal(next.honroVoidWitness,true);assert.equal(next.honroAct3Void,undefined);
 const revisit=g.HonroWorld.build(g.HONRO_CONTENT.stages[26],p,false);assert.equal(revisit.honroAct3Void.state,'READY');assert.equal(revisit.honroVoidWitness,true);
});
await report('act3-void-runtime',checks,{normalPlay:false,rendering:false});
