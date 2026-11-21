import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {applyStage35BedrockJoin} from '../shared/act4-stage35-bedrock-join.mjs';
import {applyStage35RockMaterial} from '../shared/act4-stage35-rock-material.mjs';

const expected={
 'act4-handoff:35:body':['966640:fa95a84f','966640:27a5509d',51],
 'act4-handoff:35:walls':['158123:5541b75d','158123:7711ce42',4],
 'act4-handoff:35:bedrock':['449277:7ffe61b2','449277:f0524602',4],
 'approved35:near-geology':['295465:df15d6ec','298307:bb88bf69',1],
};
const map=JSON.parse(await readFile(process.argv[2],'utf8'));
const owners=JSON.parse(await readFile(process.argv[3],'utf8'));
const profile=await readFile(process.argv[4]??new URL('../shared/runtime/profile-store.js',import.meta.url),'utf8');
const pilot=await readFile(new URL('../shared/runtime/act4-pilot-art.js',import.meta.url),'utf8');
const oldPilot=await readFile(process.argv[5],'utf8');
const stage={id:'stage-35',...map};
const input={stages:[stage],library:Object.values(owners)};
const near='approved35:near-geology',body='act4-handoff:35:body';
const previousOriginal={
 [near]:'359227:635a5188',[body]:'1632032:a8ce2166',
 'act4-handoff:35:walls':'172309:211be1d1','act4-handoff:35:bedrock':'522832:2374b2d',
};
const previousModule=await readFile(process.argv[6],'utf8');
const sourceBridge={unrelated:{stage:31,previous:'one',current:'two'}};
for(const [id,previous] of Object.entries(previousOriginal)){
 const current=expected[id][0],token=JSON.stringify(id)+':{stage:35,previous:'+JSON.stringify(previous)+',current:'+JSON.stringify(current)+'}';
 assert.equal(previousModule.split(token).length,2,'exact currently published provider not found: '+id);
 sourceBridge[id]={stage:35,previous,current};
}
const joined=applyStage35BedrockJoin(input,sourceBridge);
const before=JSON.stringify(joined),{project,previousAct4Signatures:bridge}=applyStage35RockMaterial(joined.project,joined.previousAct4Signatures);
assert.equal(JSON.stringify(joined),before);
assert.equal(project.stages,input.stages);
assert.equal(bridge.unrelated,sourceBridge.unrelated);
assert.equal(project.library.length,input.library.length);
function fillsOnly(a,b,k=''){
 if(a===b)return 0;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'){
  assert.equal(k,'fill');assert(/^#[0-9a-f]{6}$/.test(a));assert(/^#[0-9a-f]{6}$/.test(b));return 1;
 }
 assert.deepEqual(Object.keys(a),Object.keys(b));
 return Object.keys(a).reduce((n,k)=>n+fillsOnly(a[k],b[k],k),0);
}
for(const [i,a] of joined.project.library.entries()){
 const b=project.library[i];
 if(!expected[a.id])assert.equal(a,b);
 else {
  const [previous,current,n]=expected[a.id];
  assert.equal(fillsOnly(a,b),n);
  assert.equal(bridge[a.id].current,current);
  assert.equal(bridge[a.id].previousOptimized??bridge[a.id].previous,previous);
  if(a.id===body){
   assert.deepEqual(a.vector.symbols,b.vector.symbols);
   assert.deepEqual(a.vector.root.children[2],b.vector.root.children[2]);
  }
 }
}
const run=(p,br=joined.previousAct4Signatures)=>applyStage35RockMaterial(p,br);
assert.throws(()=>run({...joined.project,stages:[{...stage,id:'changed'}]}),/canonical stage/);
assert.throws(()=>run({...joined.project,stages:[stage,{id:'foreign',elements:[stage.elements.find(e=>e.assetId===body)]}]}),/wrong owner/);
assert.throws(()=>run({...joined.project,library:joined.project.library.map(a=>a.id===body?{...a,name:'stale'}:a)}),/exact optimized input/);
assert.throws(()=>run(project,bridge),/exact optimized input/);
assert.throws(()=>run(joined.project,{...joined.previousAct4Signatures,[body]:{stage:35}}),/historical provider changed/);

const g={HONRO_CORE:{},HONRO_PROJECT:{library:project.library},HONRO_PREVIOUS_TERRAIN_ART:bridge,structuredClone};
vm.runInNewContext(profile,g);
const store=g.HonroProfileStore;
const snapshot=(override={},change=(id)=>expected[id][0])=>({mode:'campaign',honroStage:35,honroAct4Official:1,honroCustom:false,honroMapOrigin:'campaign',
 terrain:[{id:'signed',points:[{x:1,y:2}]}],units:[{id:'actor',hp:45}],round:7,
 honroLandmarks:Object.keys(expected).map(id=>({asset:{honroStaticAssetRef:1,id,signature:change(id)}})),...override});
function reject(s){const prior=JSON.stringify(s);assert(!store.restoreBattleArt(s));assert.equal(JSON.stringify(s),prior);}
for(const override of [{mode:'training'},{honroStage:34},{honroCustom:true},{honroMapOrigin:'workshop'},{honroAct4Official:0}])reject(snapshot(override));
reject(snapshot({},id=>id===near?'unknown':expected[id][0]));
for(const readOld of [id=>previousOriginal[id],id=>expected[id][0],id=>id===near?previousOriginal[id]:expected[id][0]]){
 const saved=snapshot({},readOld),physics=JSON.stringify({terrain:saved.terrain,units:saved.units,round:saved.round});
 assert(store.restoreBattleArt(saved));
 assert.equal(JSON.stringify({terrain:saved.terrain,units:saved.units,round:saved.round}),physics);
 for(const l of saved.honroLandmarks)assert.equal(JSON.stringify(l.asset),JSON.stringify(project.library.find(a=>a.id===l.asset.id)));
 const recompact=store.compactBattleArt(saved);
 for(const l of recompact.honroLandmarks)assert.equal(l.asset.signature,expected[l.asset.id][1]);
 assert(store.restoreBattleArt(recompact));
}
assert.equal(pilot.replace("'approved35-bridge-pier':['#415567','#657f91']","'approved35-bridge-pier':['#55594c','#797965']"),oldPilot);
function exercise(source,id,tid){
 class P{constructor(){this.points=[];}moveTo(...a){this.points.push(['M',...a]);}lineTo(...a){this.points.push(['L',...a]);}closePath(){this.points.push(['Z']);}}
 class Scene{}
 const G={Path2D:P,HONRO_CORE:{poly:t=>t.points},HonroScene:Scene,HonroVectorArt:{draw:()=>true}};
 vm.runInNewContext(source,G);
 const t=stage.terrains.find(t=>t.id==='approved35-bridge-pier'),terrain={...t,id:tid};
 const l={asset:{id,vector:true,collision:[]},nativeArtLayer:'body',layer:'mid',kind:'canonical-element',nativeTerrainIds:[tid]};
 const b=new Scene();b.battle={honroStage:id===body?35:32,honroMap:{nativeArt:{version:1,coveredTerrainIds:[tid]}},terrain:[terrain]};
 const rows=[],c={save(){},restore(){},fill(p){rows.push([this.fillStyle,p.points]);},clip(){},beginPath(){},moveTo(){},lineTo(){},stroke(){rows.push([this.strokeStyle,this.lineWidth]);}};
 b.landmark(c,l);
 return rows;
}
const next=exercise(pilot,body,'approved35-bridge-pier'),old=exercise(oldPilot,body,'approved35-bridge-pier');
assert.deepEqual(next,[['#415567',old[0][1]],['#657f91',10]]);
assert.deepEqual(exercise(pilot,'act4-handoff:32:body-joined','approved32-east-face'),exercise(oldPilot,'act4-handoff:32:body-joined','approved32-east-face'));
assert.deepEqual(exercise(pilot,body,'not-the-pier'),[]);
console.log('PASS Stage35 limited authored fills (51+4+4+1), unchanged geometry/other assets, 4 official provider references, atomic negatives, and exact native bridge-pier color-only hook');
