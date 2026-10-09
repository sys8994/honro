/** Guidance/render contracts. No browser UI or normal-combat completion claim. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {guidanceRuntime,canvas,guidanceFixture} from './act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),A=g.HonroAct2Art,rows=[];
const check=(name,fn)=>{const detail=fn();rows.push({name,passed:true,detail});console.log('PASS',name);};
const traced=()=>{const calls=[],ctx=canvas(500,500).getContext('2d');return{calls,c:new Proxy(ctx,{get(o,k){if(typeof o[k]!=='function')return o[k];return(...args)=>{calls.push([k,...args]);return o[k](...args);};},set(o,k,v){o[k]=v;return true;}})};};
const scene=(b,opts={})=>({battle:b,x:3000,y:4300,scale:.42,size:()=>({w:390,h:844,d:1}),...opts});
const targets=[];
for(let id=11;id<=20;id++)for(const step of g.HONRO_CONTENT.stages[id-1].steps){
 if(step.kind==='hold')check(`${id}/${step.id}: exact live radii, required actor and engine state parity`,()=>{
  const {b,e,hero,marker:m}=guidanceFixture(g,id,step.id),other=structuredClone(hero);other.id='test-enemy';other.side=1;other.dead=false;other.hp=100;
  const original=structuredClone(hero),cases=[
   {name:'inside',dx:step.radius-1,guarded:true},
   {name:'boundary',dx:step.radius,guarded:false},
   {name:'outside',dx:step.radius+1,guarded:false},
   {name:'vertical-inside',dx:0,dy:step.radius-1,guarded:true},
   {name:'vertical-outside',dx:0,dy:step.radius+1,guarded:false},
   {name:'summoned',dx:0,extra:{summoned:true},guarded:false},
   {name:'enthralled',dx:0,extra:{enthrall:{owner:'test'}},guarded:false},
   {name:'dead',dx:0,extra:{dead:true},guarded:false},
   {name:'zero-hp',dx:0,extra:{hp:0},guarded:false},
   {name:'contest-inside',dx:0,enemyDx:step.contestRadius-1,guarded:true,contested:true},
   {name:'contest-boundary',dx:0,enemyDx:step.contestRadius,guarded:true},
   {name:'contest-dead',dx:0,enemyDx:0,enemyDead:true,guarded:true}
  ];
  if(step.requiredClass)cases.push({name:'wrong-class',dx:0,extra:{cls:step.requiredClass==='archer'?'mage':'archer'},guarded:false});
  for(const item of cases){
   Object.keys(hero).forEach(k=>delete hero[k]);Object.assign(hero,structuredClone(original),{x:m.x+item.dx,y:m.y+(item.dy||0)},item.extra||{});
   Object.assign(other,{x:m.x+(item.enemyDx??step.contestRadius+20),y:m.y,dead:!!item.enemyDead});b.units=[hero,other];
   const before=JSON.stringify(b),guide=A.holdGuide(b,step);assert.equal(JSON.stringify(b),before,'guide is read-only');
   assert.equal(guide.radius,step.radius);assert.equal(guide.contestRadius,step.contestRadius);assert.equal(guide.x,m.x);assert.equal(guide.y,m.y);
   assert.equal(guide.guarded,item.guarded,item.name);assert.equal(guide.contested,!!item.contested,item.name);
   const app={engine:e,stage:g.HONRO_CONTENT.stages[id-1],event(){},checkMission(){return false;}};g.HonroAct2.tick(app,0);
   const actual=b.honroState.act2.holds[step.id];assert.equal(guide.guarded,actual.guarded,item.name+' matches engine guard');assert.equal(guide.contested,actual.contested,item.name+' matches engine contest');
  }
  const {c,calls}=traced();const before=JSON.stringify(b);A.objectiveGuide(c,scene(b),b);assert.equal(JSON.stringify(b),before);
  const arcs=calls.filter(v=>v[0]==='arc');assert.deepEqual(arcs.map(v=>v[3]),[step.radius,step.contestRadius],'world circles use actual radii');
  assert(calls.some(v=>v[0]==='setLineDash'&&v[1].length===2),'contest boundary is differentiated by dash, not color alone');
  return{cases:cases.length,radius:step.radius,contestRadius:step.contestRadius,requiredClass:step.requiredClass||null};
 });
 if(step.kind==='destroy'){targets.push([id,step.id]);check(`${id}/${step.id}: current-only collision outline and centered objective focus`,()=>{
  const {b}=guidanceFixture(g,id,step.id),t=b.terrain.find(t=>t.id===step.id),state=g.HonroAct2.state(b),target=state.targets[0],all=state.allTargets.find(q=>q.id===step.id);
  assert.equal(target.x,t.x+t.w/2);assert.equal(all.x,target.x);assert.equal(target.y,t.y);assert.equal(target.box,t);
  const {c,calls}=traced(),before=JSON.stringify(b);A.objectiveGuide(c,scene(b,{x:t.x,y:t.y}),b);assert.equal(JSON.stringify(b),before);
  const points=g.HONRO_CORE.poly(t);for(const p of points)assert(calls.some(v=>['moveTo','lineTo'].includes(v[0])&&v[1]===p.x&&v[2]===p.y),'outline follows canonical collider');
  assert(calls.some(v=>v[0]==='fillText'&&/사격 표적|공격하여 파괴/.test(v[1])));
  t.broken=true;calls.length=0;A.objectiveGuide(c,scene(b),b);assert(!calls.some(v=>v[0]==='fillText'&&/사격 표적|공격하여 파괴/.test(v[1])),'broken pin stops highlighting');
  return{x:target.x,y:target.y};
 });}
}
check('completed holds and future pins never leave a persistent cue',()=>{
 const {b}=guidanceFixture(g,19,'hold-second'),step=g.HonroAct2.current(b),h=b.honroState.act2.holds[step.id];h.progress=step.rounds;h.spawned=step.wave.count;
 const {c,calls}=traced();A.objectiveGuide(c,scene(b),b);assert.equal(calls.filter(v=>v[0]==='arc').length,0,'completed hold overlay disappears');
 const fresh=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[17],g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(fresh);calls.length=0;A.objectiveGuide(c,scene(fresh),fresh);assert.equal(calls.filter(v=>v[0]==='stroke').length,0,'future upper-chain and bell are not outlined');
});
check('inactive, overview, skill preview and legacy battles do not gain a hold overlay',()=>{
 const {b,step}=guidanceFixture(g,18,'hold-silence');let {c,calls}=traced();
 for(const flags of [{editorView:true},{skillPreview:true}]){calls.length=0;assert.equal(A.objectiveGuide(c,scene(b,flags),b),null);assert.equal(calls.length,0);}
 b.honroAct2Revision=1;assert.equal(A.holdGuide(b,step),null);b.honroStage=1;calls.length=0;assert.equal(A.objectiveGuide(c,scene(b),b),null);assert.equal(calls.length,0);
});
check('320/390-wide badges fit on screen; terrain and save data stay unchanged',()=>{
 const {b,marker}=guidanceFixture(g,18,'hold-silence'),before=JSON.stringify(b);
 for(const w of [320,390,1440])for(const scale of [.2,.42,.75])for(const offset of [-w*.45,0,w*.45]){
  const {c,calls}=traced(),s=scene(b,{scale,x:marker.x-offset/scale,y:marker.y-230,size:()=>({w,h:844,d:1})});A.objectiveGuide(c,s,b);
  const rect=calls.find(v=>v[0]==='fillRect');assert(rect&&rect[3]<=w-24);const tr=calls.find(v=>v[0]==='translate');
  const screenX=w/2+(tr[1]-s.x)*scale;assert(screenX+rect[1]>=11.99&&screenX+rect[1]+rect[3]<=w-11.99,'badge stays within narrow view');
 }
 assert.equal(JSON.stringify(b),before);
});
check('all stages render current holds/targets without battle mutation on the common Scene',()=>{
 for(let id=11;id<=20;id++){
  const step=g.HONRO_CONTENT.stages[id-1].steps.find(s=>s.kind==='hold'),{b,e,marker}=guidanceFixture(g,id,step.id),cv=canvas(390,844),s=new g.HonroScene(cv);Object.assign(s,{x:marker.x,y:marker.y-230,scale:.42,manual:true,time:2,missionTargets:g.HonroAct2.state(b).targets});const before=JSON.stringify(b);s.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),before);
 }
 return{stages:10,destructibleTargets:targets.length};
});
await mkdir('_local/reports/act2-guidance',{recursive:true});await writeFile('_local/reports/act2-guidance/tests.json',JSON.stringify({checks:rows,limitations:['Native Canvas only','Isolated state fixtures, not a normal-combat run','No browser UI/input/performance validation']},null,2)+'\n');
console.log(`PASS ${rows.length} ACT2 objective-guidance checks`);
