/** Actual pointer handlers + Scene camera phase; no world/physics injection claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const files=['shared/map/bounds.js','shared/runtime/camera.js','shared/runtime/attack-camera.js','shared/runtime/reinforcement-camera.js','shared/runtime/renderer.js','shared/runtime/main.js'];
const sources=Object.fromEntries(await Promise.all(files.map(async p=>[p,await readFile(p,'utf8')])));
const old=execFileSync('git',['show','569e11123b2e077ef1f37aeaf92f44d131df73e5:shared/runtime/reinforcement-camera.js'],{encoding:'utf8'});
const raw=sources['shared/runtime/main.js'],start=raw.indexOf('        inputs() {'),end=raw.indexOf('        releaseStick() {',start);assert(start>=0&&end>start);
const inputMethod=raw.slice(start,end);
let clock=0;
function fixture(reinforcement,w=1280,h=800,authored=null){
 const elements={};
 const element=id=>elements[id]||=(id==='battlecanvas'?{width:w,height:h,getContext:()=>({setTransform(){},clearRect(){}}),getBoundingClientRect:()=>({left:0,top:0,width:w,height:h})}:{getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})});
 for(const id of ['battlecanvas','joystick','fire','jump','minimap'])Object.assign(element(id),{setPointerCapture(){},hasPointerCapture:()=>false,addEventListener(){}});
 const g=vm.createContext({console,performance:{now:()=>clock},devicePixelRatio:1,document:{getElementById:element},HONRO_CONTENT:{stages:[{theme:'forest'}]},HONRO_CORE:{},matchMedia:()=>({matches:false}),HonroUnitInfo:{bind(){},close(){},tap:()=>false}});g.G=g;g.$=element;g.C={};g.clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 for(const p of files.slice(0,-1))vm.runInContext(p.endsWith('reinforcement-camera.js')?reinforcement:sources[p],g);
 vm.runInContext(`globalThis.Input=class {${inputMethod}}`,g);
 const scene=new g.HonroScene(element('battlecanvas')),hero={id:'archer',side:0,x:540,y:1910,h:92,hp:100,r:20};
 Object.assign(scene,{x:1600,y:1000,scale:.5});
 const b={width:7200,height:3200,side:0,round:1,active:'archer',phase:'aim',units:[hero],projectiles:[],honroStage:1,honroState:{},honroCamera:authored?{focusBounds:authored}:undefined};
 const e={b,active:hero,turnArrow:()=>false,noncombatWalk:()=>false},app={scene,engine:e,contacts:new Map(),modal:{classList:{contains:()=>false}},dialogue:null,updateHUD(){},releaseStick(){},canInput:()=>true};
 g.HonroReinforcementCamera.prime(scene,b);g.Input.prototype.inputs.call(app);
 const cv=element('battlecanvas'),sentinel={};scene.background=()=>{throw sentinel;};
 const render=()=>{try{scene.render(e,1/60,'',.6,false,0);assert.fail('Camera test must stop at first background paint');}catch(error){if(error!==sentinel)throw error;}};
 const event=(x,y,id=1,type='mouse')=>({clientX:x,clientY:y,pointerId:id,pointerType:type,preventDefault(){}});
 const drag=(from,to,held=false)=>{cv.onpointerdown(event(...from));cv.onpointermove(event(...to));render();if(!held){cv.onpointerup(event(...to));render();}};
 return{g,scene,b,e,app,cv,render,drag,event};
}
const snap=f=>({x:f.scene.x,y:f.scene.y,scale:f.scene.scale,manual:f.scene.manual,intent:JSON.parse(JSON.stringify(f.g.HonroAttackCamera.status(f.scene)))});
const rows=[];
for(const [w,h]of [[1280,800],[390,844]])for(const direction of ['left','right','top','bottom']){
 const pair=[];
 for(const [label,code]of [['before',old],['after',sources['shared/runtime/reinforcement-camera.js']]]){
  const f=fixture(code,w,h),initial=JSON.stringify(f.b),to={left:[50000,200],right:[-50000,200],top:[200,50000],bottom:[200,-50000]}[direction];
  f.drag([200,200],to,true);const held=snap(f);assert(held.manual&&held.intent.manual&&held.intent.gesture);
  f.cv.onpointerup(f.event(...to));f.render();const released=snap(f);assert(released.manual&&released.intent.manual&&!released.intent.gesture);
  assert.equal(JSON.stringify(f.b),initial,'Drag/render does not mutate battle');
  const limits=f.g.HonroBounds.focus(f.b),inside=released.x>=limits.left&&released.x<=limits.right&&released.y>=limits.top&&released.y<=limits.bottom;
  assert.equal(inside,label==='after','Historical baseline escapes; current released/held drag obeys existing focus');
  pair.push({label,held,released,focus:limits});
 }
 rows.push({case:'drag-'+direction,w,h,pair});
}
for(const [w,h]of [[1280,800],[390,844]]){
 const f=fixture(sources['shared/runtime/reinforcement-camera.js'],w,h),initial=JSON.stringify(f.b);
 f.drag([200,200],[150,180]);assert.equal(f.scene.x,1700);assert.equal(f.scene.y,1040);assert.equal(f.scene.scale,.5);assert(f.scene.manual);
 rows.push({case:'inside-manual-pan',w,h,camera:snap(f)});
 const oldAnchor=f.scene.world(w*.6,h*.4);f.scene.zoom(1.1,w*.6,h*.4);const newAnchor=f.scene.world(w*.6,h*.4);assert(Math.abs(oldAnchor.x-newAnchor.x)<1e-9&&Math.abs(oldAnchor.y-newAnchor.y)<1e-9,'Inside-bounds zoom keeps pointer anchor');f.render();
 f.cv.onpointerdown(f.event(100,200,1,'touch'));f.cv.onpointerdown(f.event(200,200,2,'touch'));f.cv.onpointermove(f.event(-40000,-40000,1,'touch'));f.render();
 f.cv.onpointermove(f.event(-39900,-40000,2,'touch'));f.render();f.cv.onpointerup(f.event(-40000,-40000,1,'touch'));f.cv.onpointerup(f.event(-39900,-40000,2,'touch'));f.render();
 const focus=f.g.HonroBounds.focus(f.b);assert(f.scene.x>=focus.left&&f.scene.x<=focus.right&&f.scene.y>=focus.top&&f.scene.y<=focus.bottom);assert(f.g.HonroAttackCamera.status(f.scene).manual);assert(!f.g.HonroAttackCamera.status(f.scene).gesture);assert.equal(JSON.stringify(f.b),initial);
 rows.push({case:'pinch-translation-extreme',w,h,camera:snap(f),focus});
}
const authored={left:-900,top:-2400,right:9500,bottom:5000},a=fixture(sources['shared/runtime/reinforcement-camera.js'],1280,800,authored);a.drag([200,200],[-50000,-50000]);assert.equal(a.scene.x,9500);assert.equal(a.scene.y,5000);rows.push({case:'authored-focus-preserved',camera:snap(a)});
// Intentional story and reinforcement inserts retain their original framing.
for(const story of ['storyFrame','storyTween']){
 const pair=[];for(const code of [old,sources['shared/runtime/reinforcement-camera.js']]){const f=fixture(code);f.g.HonroReinforcementCamera.cancel(f.scene);f.scene[story]={};f.scene.x=11000;f.scene.y=-3000;f.render();pair.push(snap(f));}assert.deepEqual(pair[0],pair[1]);rows.push({case:story+'-special-frame',camera:pair[1]});
}
const insert=[];for(const code of [old,sources['shared/runtime/reinforcement-camera.js']]){const f=fixture(code);f.b.units.push({id:'new',side:1,x:11000,y:1000,h:90,r:25,hp:100});clock=0;f.render();clock=420;f.render();insert.push(snap(f));}assert.deepEqual(insert[0],insert[1]);rows.push({case:'reinforcement-special-frame',camera:insert[1]});
// A release created after dialogue closes must not remain frozen behind manual ownership.
const beforeReleaseCleanup=sources['shared/runtime/reinforcement-camera.js'].replace(/  if\(!scene\.storyFrame&&!scene\.storyFrozen&&scene\.storyTween\?\.kind==='static'&&scene\.storyTween\.released===true\)scene\.storyTween=null;\n/,'');
assert.notEqual(beforeReleaseCleanup,sources['shared/runtime/reinforcement-camera.js']);
for(const [label,code]of [['before',beforeReleaseCleanup],['after',sources['shared/runtime/reinforcement-camera.js']]]){
 const f=fixture(code);clock=0;f.drag([200,200],[150,180]);
 const camera=f.g.HonroAttackCamera.snapshot(f.scene),view=snap(f),battle=JSON.stringify(f.b);
 f.scene.storyFrozen=false;f.scene.storyRelease(camera,450);assert.equal(f.scene.storyTween.released,true);
 clock=16000;f.render();assert.equal(!!f.scene.storyTween,label==='before','Historical manual branch freezes released tween beyond its duration');
 assert.deepEqual(snap(f),view,'Cleanup preserves manual position, zoom and intent');assert.equal(JSON.stringify(f.b),battle);
 rows.push({case:'manual-story-release-'+label,camera:snap(f),tweenRetained:!!f.scene.storyTween});
}
for(const protection of ['storyFrame','storyFrozen','unit','authored-point']){
 const f=fixture(sources['shared/runtime/reinforcement-camera.js']);f.drag([200,200],[150,180]);
 f.scene.storyRelease(f.g.HonroAttackCamera.snapshot(f.scene));
 if(protection==='storyFrame')f.scene.storyFrame={};
 if(protection==='storyFrozen')f.scene.storyFrozen=true;
 if(protection==='unit')f.scene.storyTween.kind='unit';
 if(protection==='authored-point')f.scene.storyFocusPoint(100,200);
 const tween=f.scene.storyTween;f.render();assert.equal(f.scene.storyTween,tween,'Preserve '+protection);
 rows.push({case:'manual-release-preserves-'+protection});
}
{
 const f=fixture(sources['shared/runtime/reinforcement-camera.js']);f.drag([200,200],[150,180]);
 f.scene.storyRelease(f.g.HonroAttackCamera.snapshot(f.scene));f.scene.x=11000;f.scene.y=-3000;f.render();
 const limits=f.g.HonroBounds.focus(f.b);assert.equal(f.scene.storyTween,null);assert(f.scene.x<=limits.right&&f.scene.y>=limits.top);
 rows.push({case:'released-manual-restores-existing-bounds',camera:snap(f)});
}
for(const [p,s]of Object.entries(sources))assert.equal(await readFile(p,'utf8'),s,'Runtime source frozen during proof');
await mkdir('_local/reports/manual-camera-focus',{recursive:true});await writeFile('_local/reports/manual-camera-focus/contracts.json',JSON.stringify({passed:true,source:Object.fromEntries(Object.entries(sources).map(([p,s])=>[p,hash(s)])),baseline:hash(old),rows,limits:['Actual production pointer handlers and Scene camera phase with a DOM/canvas stub; not browser pixel or gameplay proof.','The renderer stops immediately before background paint. Existing focus policy is unchanged.']},null,2));
console.log('PASS',rows.length,'manual drag/pinch, authored focus, ownership and special-framing cases; baseline overshoot reproduced');
