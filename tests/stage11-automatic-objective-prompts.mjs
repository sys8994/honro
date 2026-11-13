/** Focused production-function model. No normal-play, browser or win claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const reviewed=await readFile('shared/runtime/act23-v4-reviewed.js','utf8');
const interactions=await readFile('shared/runtime/interactions.js','utf8');
const g={document:{addEventListener(){},getElementById(){return null;}},console};
vm.createContext(g);
vm.runInContext(`const G=globalThis;
const active=b=>b?.honroStage===11&&b.honroReviewedNarrativeRevision===1;
const cls={설오:'archer',담허:'mage',휘겸:'knight',소단:'occultist'};
const row=()=>({text:'북쪽 산길의 위협을 막고 고개로 이동'});
const scenes=b=>b.scenes??{};
const C={validTerrainContactPose:(_t,u)=>!u.airborne};
const V={active,steps:b=>b.steps,current:b=>b.steps.find(s=>!b.done[s.id]),marker:(b,id)=>b.honroMarkers.find(m=>m.id===id),heroes:b=>b.units.filter(u=>u.side===0&&u.hp>0&&!u.dead),alive:u=>!!u&&u.hp>0&&!u.dead,near:(u,p,r)=>!!p&&Math.abs(u.y-p.y)<=150&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<=r};
${reviewed.slice(reviewed.indexOf('function gatherCount'),reviewed.indexOf('function gathered'))}
${reviewed.slice(reviewed.indexOf('function automaticMarker'),reviewed.indexOf('function present('))}
globalThis.HonroAct23V4Reviewed={automaticMarker,instruction};`,g);
g.HonroObjectives={interactionTarget:(_b,m)=>m};
g.HonroAct2={retiredSafety:()=>false,eligibility:()=>({ok:true,reason:'fixture'}),use:()=>false};
vm.runInContext(interactions,g);
const heroes=['archer','mage','knight','occultist'].map((cls,i)=>({id:cls,cls,x:100+i*10,y:200,side:0,hp:100}));
const b={honroStage:11,honroReviewedNarrativeRevision:1,honroStage11CompactRevision:1,steps:[],done:{},units:heroes,terrain:[],honroMarkers:[],honroState:{}};
const app={engine:{b,active:heroes[0],gateCandidate:()=>null},canInput:()=>true};
const R=g.HonroAct23V4Reviewed,I=g.HonroInteractions;
for(const kind of ['v4-entry','clear','reach','v4-world']){
 const id=kind==='reach'?'11.exit':kind==='v4-world'?'11.north':'11.test';
 b.steps=[{id,kind}];b.honroMarkers=[{id,action:'act2',x:100,y:200,label:id}];
 const saved=JSON.stringify(b);
 assert(R.automaticMarker(b,b.honroMarkers[0]));
 assert.equal(I.candidates(app).length,0,`${kind} has no fake button`);
 assert.equal(I.eligibility(app,b.honroMarkers[0]).ok,false);
 assert.equal(I.use(app,b.honroMarkers[0]),false);
 assert.equal(JSON.stringify(b),saved,'reading/clicking cannot rewrite saves or award victory');
}
b.steps=[{id:'11.exit',kind:'reach'}];b.honroMarkers=[{id:'11.exit',action:'act2',x:100,y:200}];
assert.match(R.instruction(b),/4\/4/);heroes[3].x=500;assert.match(R.instruction(b),/3\/4/);
heroes[3].x=100;heroes[3].airborne=true;assert.match(R.instruction(b),/3\/4/);delete heroes[3].airborne;
b.steps=[{id:'11.exit-threat',kind:'clear',defeatIds:['enemy']}];b.units.push({id:'enemy',side:1,x:100,y:200,hp:10});
assert.match(R.instruction(b),/1명/);b.units.at(-1).hp=0;assert.match(R.instruction(b),/0명/);
b.steps=[{id:'11.north',kind:'v4-world'}];b.honroMarkers=[{id:'11.north',action:'act2',x:100,y:200}];
assert.match(R.instruction(b),/가까이 이동/);b.scenes={bell:{struck:true}};assert.match(R.instruction(b),/종소리 확인 중/);b.units.at(-1).hp=10;assert.match(R.instruction(b),/1명/);
let used=0;g.HonroAct2.use=()=>{used++;return true;};
for(const kind of ['interact','rescue']){b.steps=[{id:'actual',kind}];b.honroMarkers=[{id:'actual',action:'act2',x:100,y:200}];assert.equal(I.candidates(app).length,1,'real interactions remain');assert.equal(I.use(app,b.honroMarkers[0]),true,'real interaction dispatch remains');}
assert.equal(used,2);
b.honroStage=12;b.steps=[{id:'actual',kind:'reach'}];assert.equal(I.candidates(app).length,1,'other chapters unchanged');
b.honroStage=11;delete b.honroReviewedNarrativeRevision;assert.equal(I.candidates(app).length,1,'legacy chapter unchanged');
console.log('PASS: automatic prompt filtering, direct-click safety, save read preservation, grounded gather/hostile guidance, real interactions and legacy/other chapter isolation. Model only; no full play/browser proof.');
