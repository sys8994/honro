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
const classes={'설오':'archer','담허':'mage','휘겸':'knight','소단':'occultist'};
const alive=u=>!!u&&!u.dead&&u.hp>0, specs=new Map();
const actor=vm.runInNewContext('('+sourceChapters.match(/function actor\(b,who\)\{[^\n]+/)[0]+')',{classes,specs,V:{alive}});
const near=vm.runInNewContext('('+sourceCommon.match(/const near=(.+);\nfunction slot/)[1]+')');
let spec;
const memory=b=>b.reviewed;
const V={alive,near,heroes:b=>b.units.filter(u=>u.side===0&&alive(u)),mem:b=>b.v4,
 marker:(b,id)=>({id,x:2000,y:0}),safe:()=>true,current:()=>({id:'16.work-exit'}),
 ackSlot:()=>true,recordOutcome:()=>{}};
const api={memory,actor,active:()=>true,done:(b,key)=>['done','skipped'].includes(memory(b).events[key]?.status),
 row:id=>({id}),begin:(app,key,ids)=>{app.admissions.push({key,ids});return false;},journal:()=>{}};
const P={V,C:{validTerrainContactPose:()=>true},apiFor:()=>api,register:(n,s)=>{spec=s;specs.set(n,s);}};
const g={HonroAct23V4ReviewedChapters:P,
 HonroAct23V4Act2Scenes:{base:{memory:b=>b.base,failure:()=>null},memory:b=>b.physical},
 HonroAct23V4Reviewed:{lineAllowed:()=>true,finished:()=>{}}};
vm.runInNewContext(source,g);
const ids=[1,2,4,6,8].map(n=>'A2.S16.WITNESS.0'+n);
function fixture({mage='far',occultist='near',heard=true,receipt=null}={}){
 const units=[
  {id:'objective',side:2,hp:100,x:50,y:0},
  {id:'resident-1',side:2,hp:100,x:0,y:0,honroResolved:true},
  {id:'resident-spirit-1',side:1,hp:0,dead:true,x:0,y:0},
  {id:'p-knight',cls:'knight',side:0,hp:100,x:1500,y:0},
  ...Object.entries({mage,occultist}).map(([cls,state])=>({
   id:'p-'+cls,cls,side:0,hp:state==='dead'?0:100,dead:state==='dead',
   x:['near','wrong-height'].includes(state)?500:2000,y:state==='wrong-height'?200:0
  }))
 ];
 const events=Object.fromEntries(['arrival','elder','attached','approach','release-request','separate','recovery','sound','protect'].map(k=>[k,{status:'done'}]));
 events.witness={status:heard?'done':'open',ids};
 const b={phase:'aim',honroStage:16,units,terrain:[],honroState:{flags:{}},
  v4:{slots:{},sceneDone:{}},base:{proof:{'16.disciple':{}}},
  physical:{proof:{'16.safe':{}},walks:{'16.disciple-safe':{arrived:true,distance:100},'16.elder-safe':{arrived:true,distance:100}}},
  honroV4Recovery:{disciple:{x:0,y:0},elder:{x:50,y:0}},
  honroV4Reviewed16:{transport:{x:280,y:0},bellSource:{x:500,y:0},souls:[{x:480,y:0},{x:520,y:0}]},
  reviewed:{events,knock:{emitted:true},journal:{rowId:'A2.S16.JOURNAL.01'},...(receipt?{trappedObserved:receipt}:{})}
 };
 const app={engine:{b,projectileCollision:()=>null,emit:()=>{},fx:()=>{}},admissions:[],profile:{}};
 spec.drive(app);return {b,app,observer:b.reviewed.trappedObserved?.observer||null};
}
const cases=[
 ['distant mage does not hide nearby occultist',{mage:'far',occultist:'near'},'p-occultist'],
 ['both nearby retain mage preference',{mage:'near',occultist:'near'},'p-mage'],
 ['fallen mage uses nearby occultist',{mage:'dead',occultist:'near'},'p-occultist'],
 ['fallen occultist after separation uses nearby mage',{mage:'near',occultist:'dead'},'p-mage'],
 ['both distant require approach',{mage:'far',occultist:'far'},null],
 ['vertical separation is still required',{mage:'dead',occultist:'wrong-height'},null],
 ['testimony must actually finish',{mage:'near',occultist:'near',heard:false},null]
];
for(const [label,args,expected] of cases){const r=fixture(args);assert.equal(r.observer,expected,label);assert.equal(r.app.admissions.some(x=>x.key==='souls'),!!expected,label);console.log('PASS '+label);}
const receipt={observer:'p-occultist',source:{x:500,y:0},souls:[{x:480,y:0}],observed:true};
const saved=fixture({mage:'near',occultist:'dead',receipt:structuredClone(receipt)});assert.deepEqual(saved.b.reviewed.trappedObserved,receipt);console.log('PASS existing saved observation remains unchanged');
const unavailable=fixture({mage:'dead',occultist:'dead'});
console.log(JSON.stringify({knownUnresolved:'Both soul observers lost after separation but before observation',observer:unavailable.observer,sceneAdmissions:unavailable.app.admissions.map(x=>x.key),scope:'Diagnostic only. No alternate story path is implemented or accepted by this test.'}));
console.log('PASS 8 focused state checks; no claim of normal App, physical movement, browser, or narrative completion.');
