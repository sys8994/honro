/**
 * Focused Stage16 observer-selection state test, not App/Engine/browser acceptance.
 * The production reviewed16 module executes in a VM. Safe-frame, terrain contact,
 * scene admission, and rendering are explicit doubles. No combat/physics occurs.
 * Run from the repository root: node tests/stage16-observer-state.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('shared/runtime/act23-v4-reviewed16.js','utf8');
const sourceCommon=fs.readFileSync('shared/runtime/act23-v4.js','utf8');
const sourceChapters=fs.readFileSync('shared/runtime/act23-v4-reviewed-chapters.js','utf8');
const sourceBase=fs.readFileSync('shared/runtime/act23-v4-act2.js','utf8');
const rows=JSON.parse(fs.readFileSync('shared/data/reviewed/act23-v4-ch16.json','utf8')).rows;
const row=id=>{const r=rows.find(r=>r.id===id);return r&&{...r,speaker:r.speaker||r.speaker_channel.split(' · ')[0],channel:r.channel||'dialogue'};};
const classes={'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'};
const alive=u=>!!u&&!u.dead&&u.hp>0, specs=new Map();
const actor=vm.runInNewContext('('+sourceChapters.match(/function actor\(b,who\)\{[^\n]+/)[0]+')',{classes,specs,V:{alive}});
const near=vm.runInNewContext('('+sourceCommon.match(/const near=(.+);\nfunction slot/)[1]+')');
const heroes=vm.runInNewContext('('+sourceCommon.match(/const heroes=(.+);\nconst approvedCommon/)[1]+')',{alive});
const unit=(b,id)=>b.units.find(u=>u.id===id);
const baseFailure=vm.runInNewContext('('+sourceBase.match(/function failure\(b\)\{[^\n]+/)[0]+')',{active:()=>true,alive,unit});
const rootFailure=vm.runInNewContext('('+sourceCommon.match(/function failure\(b\)\{[^\n]+/)[0]+')',{plugin:()=>({failure:baseFailure}),steps:b=>b.honroV4Steps,satisfied:(b,s)=>!!b.v4.done[s.id],heroes,alive});
let spec;
const memory=b=>b.reviewed;
const V={alive,near,heroes,mem:b=>b.v4,
 marker:(b,id)=>({id,x:2000,y:0}),safe:()=>true,current:()=>({id:'16.work-exit'}),
 ackSlot:()=>true,recordOutcome:()=>{}};
const api={memory,actor,active:()=>true,done:(b,key)=>['done','skipped'].includes(memory(b).events[key]?.status),
 row,begin:(app,key,ids)=>{const presented=Array.from(ids).filter(id=>lineAllowed(app,row(id).speaker,{rowId:id,reviewedStage:16,reviewedRevision:1}));app.admissions.push({key,ids:presented});return false;},journal:()=>{}};
const lineAllowed=vm.runInNewContext('('+sourceChapters.slice(sourceChapters.indexOf('function lineAllowed('),sourceChapters.indexOf('// Only a chapter')).trim()+')',{row,enabled:n=>n===16,active:b=>b.honroStage===16,specs,classes,actor,dyingAllowed:()=>false,optionalAllowed:()=>false});
const P={V,C:{validTerrainContactPose:()=>true},apiFor:()=>api,register:(n,s)=>{spec=s;specs.set(n,s);}};
const g={HonroAct23V4ReviewedChapters:P,
 HonroAct23V4Act2Scenes:{base:{memory:b=>b.base,failure:baseFailure},memory:b=>b.physical},
 HonroAct23V4Reviewed:{lineAllowed:()=>true,finished:()=>{}}};
vm.runInNewContext(source,g);
const appFor=b=>({screen:'battle',engine:{b,projectileCollision:()=>null,emit:()=>{},fx:()=>{}},admissions:[],profile:{}});
const ids=[1,2,4,6,8].map(n=>'A2.S16.WITNESS.0'+n);
function fixture({mage='far',occultist='near',heard=true,receipt=null,approach=null,companion='far',reserve='dead',separated=true,npcAlive=true}={}){
 const units=[
  {id:'objective',side:2,hp:npcAlive?100:0,dead:!npcAlive,honroProtected:true,x:50,y:0},
  {id:'resident-1',side:2,hp:100,honroProtected:true,x:0,y:0,honroResolved:separated},
  {id:'resident-spirit-1',side:1,hp:separated?0:100,dead:separated,x:0,y:0},
  {id:'p-knight',cls:'knight',side:0,hp:companion==='dead'?0:100,dead:companion==='dead',x:companion==='near'?500:1500,y:0},
  {id:'p-archer',cls:'archer',side:0,hp:reserve==='dead'?0:100,dead:reserve==='dead',x:reserve==='near'?500:1500,y:0},
  ...Object.entries({mage,occultist}).map(([cls,state])=>({
   id:'p-'+cls,cls,side:0,hp:state==='dead'?0:100,dead:state==='dead',
   x:['near','wrong-height'].includes(state)?500:2000,y:state==='wrong-height'?200:0
  }))
 ];
 const events=Object.fromEntries(['arrival','elder','attached','approach','release-request','separate','recovery','sound','protect'].map(k=>[k,{status:'done'}]));
 events.witness={status:heard?'done':'open',ids};
 const b={phase:'aim',honroStage:16,units,terrain:[],honroState:{flags:{}},
  honroV4Steps:[{id:'16.elder'},{id:'16.disciple',requiredClass:'occultist'},{id:'16.safe'},{id:'16.testimony'},{id:'16.work-exit',kind:'reach'}],
  v4:{slots:{},sceneDone:{},done:{'16.elder':true,'16.disciple':separated,'16.safe':separated,'16.testimony':heard}},base:{proof:separated?{'16.disciple':{}}:{}},
  physical:{proof:{'16.safe':{}},walks:{'16.disciple-safe':{arrived:true,distance:100},'16.elder-safe':{arrived:true,distance:100}}},
  honroV4Recovery:{disciple:{x:0,y:0},elder:{x:50,y:0}},
  honroV4Reviewed16:{transport:{x:280,y:0},bellSource:{x:500,y:0},souls:[{x:480,y:0},{x:520,y:0}]},
  reviewed:{events,knock:{emitted:true},journal:{rowId:'A2.S16.JOURNAL.01'},...(receipt?{trappedObserved:receipt}:{}),...(approach?{witnessApproach:approach}:{})}
 };
 const app=appFor(b);
 spec.drive(app);return {b,app,observer:b.reviewed.trappedObserved?.observer||null};
}
const cases=[
 ['distant mage does not hide nearby occultist',{mage:'far',occultist:'near'},'p-occultist',false],
 ['both nearby retain mage preference',{mage:'near',occultist:'near'},'p-mage',true],
 ['fallen mage uses nearby occultist',{mage:'dead',occultist:'near'},'p-occultist',false],
 ['fallen occultist after separation uses nearby mage',{mage:'near',occultist:'dead'},'p-mage',true],
 ['both distant require approach',{mage:'far',occultist:'far'},null],
 ['vertical separation is still required',{mage:'dead',occultist:'wrong-height'},null],
 ['testimony must actually finish',{mage:'near',occultist:'near',heard:false},null]
];
for(const [label,args,expected,mageLine=false] of cases){const r=fixture(args);assert.equal(r.observer,expected,label);assert.equal(r.app.admissions.some(x=>x.key==='souls'),!!expected,label);assert.equal(spec.allow(r.app,{id:'A2.S16.MID.06'}),mageLine,label+' / only evidenced mage speech');if(expected)assert(spec.allow(r.app,{id:'A2.S16.MID.07'}),'living elder followup remains eligible');console.log('PASS '+label);}
const receipt={observer:'p-occultist',source:{x:500,y:0},souls:[{x:480,y:0}],observed:true};
const saved=fixture({mage:'near',occultist:'dead',receipt:structuredClone(receipt)});assert.deepEqual(saved.b.reviewed.trappedObserved,receipt);console.log('PASS existing saved observation remains unchanged');
const remembered=fixture({mage:'far',occultist:'dead',receipt:{...receipt,observer:'p-mage'}});assert(spec.allow(remembered.app,{id:'A2.S16.MID.06'}),'prior actual mage observation remains known');console.log('PASS prior mage knowledge survives later movement');

// Fallback is distinct approach evidence. No soul-observation receipt or new prose.
const fallback=fixture({mage:'dead',occultist:'dead',companion:'near'});
assert.equal(rootFailure(fallback.b),null);assert(!fallback.b.reviewed.trappedObserved);
assert(fallback.b.reviewed.witnessApproach,'surviving companion must receive distinct witnessed approach evidence');
assert.equal(fallback.b.reviewed.witnessApproach.basis,'elder-testimony');
assert.equal(fallback.b.reviewed.witnessApproach.observer,'p-knight');
assert.deepEqual(Array.from(fallback.b.reviewed.witnessApproach.witnessRows),ids);
assert.deepEqual(fallback.app.admissions.find(x=>x.key==='souls').ids,['A2.S16.MID.07']);
assert(!lineAllowed(fallback.app,'담허',{rowId:'A2.S16.MID.06',reviewedStage:16,reviewedRevision:1}));
console.log('PASS two unavailable soul observers use actual companion approach and only the living elder line');
for(const [label,args,failure] of [
 ['distant survivor',{companion:'far'},false],
 ['no living survivor',{companion:'dead'},false],
 ['unfinished extraction',{companion:'near',separated:false},true],
 ['protected NPC lost',{companion:'near',npcAlive:false},true],
 ['unfinished actual testimony',{companion:'near',heard:false},false],
 ['available distant mage still has the normal approach route',{mage:'far',companion:'near'},false]
]){
 const r=fixture({mage:'dead',occultist:'dead',...args});
 assert(!r.b.reviewed.witnessApproach,label);
 assert(!r.app.admissions.some(x=>x.key==='souls'),label);
 if(failure)assert(rootFailure(r.b),label);
 console.log('PASS fallback guard / '+label);
}
// Model a saved state after approach, not App Continue. Speaker death creates no new receipt.
const savedApproach=JSON.parse(JSON.stringify(fallback.b.reviewed.witnessApproach));
const restored=fixture({mage:'dead',occultist:'dead',companion:'dead',reserve:'near',approach:savedApproach});
assert.deepEqual(restored.b.reviewed.witnessApproach,savedApproach);
assert(!restored.b.reviewed.trappedObserved);assert.equal(rootFailure(restored.b),null);
assert.deepEqual(restored.app.admissions.find(x=>x.key==='souls').ids,['A2.S16.MID.07']);
console.log('PASS saved approach remains evidence without requiring its original companion to survive');
// Explicitly model completion of already admitted lines; the actual Story UI is not run.
restored.b.reviewed.events.souls={status:'done',ids:['A2.S16.MID.07']};
unit(restored.b,'p-archer').x=2000;restored.app.admissions=[];spec.drive(restored.app);
const depart=restored.app.admissions.find(x=>x.key==='depart');
assert.deepEqual(depart.ids,['A2.S16.COMPLETE.02'],'absent knight must not speak');
restored.b.reviewed.events.depart={status:'done',ids:depart.ids};
assert(spec.complete(restored.b));assert(!restored.b.reviewed.trappedObserved);
console.log('PASS existing elder departure and chapter scene conditions remain reachable');
const previous=fixture({mage:'dead',occultist:'dead',companion:'near',receipt:structuredClone(receipt)});
assert.deepEqual(previous.b.reviewed.trappedObserved,receipt);assert(!previous.b.reviewed.witnessApproach);
console.log('PASS prior true observation does not become a new fallback receipt');
console.log('PASS 19 focused state checks; no App, physical movement, actual Story completion, browser, or full-play claim.');
