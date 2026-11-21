import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';

const bytes=rel=>readFile(new URL('../'+rel,import.meta.url));
const hash=a=>createHash('sha256').update(a).digest('hex');
const runtime=(await bytes('shared/runtime/act3-handoff-art.js')).toString();
const asset=await bytes('shared/assets/environment/act3-handoff/stage21-bedrock.json');
const compiler=await bytes('shared/act3-handoff-art.mjs');
assert.equal(hash(asset),'a4072b1058cc4f5776d8da99fc4b2517f910f39f7e1207df39145d1a25618472');
assert.equal(hash(compiler),'86f566899e9eeebd0cc1c4efb32402ac90874a79ad0bb6662e784437867f79c7');
const [,setting]=runtime.match(/const WEST21_MATERIAL=(\{[^\n]+\});\n/);
assert.equal(hash(setting),'7becb38d4329ad4dd921c740299b9385ad5f81c26f50662db7c56bc649617412');
const recipe=JSON.parse(setting), F=JSON.parse(asset);
assert.deepEqual(recipe.box,[-380,2813,120,3220]);
assert.equal(recipe.branches.length,5);
assert.equal(F.params.stage21WestMaterial,undefined);
const stockB={id:'eup21:foundations',vector:{root:{children:Array.from({length:34},(_,i)=>i===31?{d:recipe.B31.old,fill:'#334e42'}:{i})}}};
const base=[{id:'foundations',asset:stockB,kind:'canonical-element',layer:'front',depthLayer:'L1',x:0,y:0,scale:1,rotation:0,honroTerrainMaterialClip:{}}];
const vertices=[...F.params.contactMapping.map(([,,x,y])=>({x,y})),{x:-500,y:2755.3125},{x:12400,y:27200},{x:-6000,y:27200}];
const floor={id:'a3-foundation',vertices};
let prep=0;
const Scope={
 Path2D:class {constructor(d){this.d=d;}},
 HonroScene:function(){},HONRO_CORE:{poly:x=>x.vertices},
 HonroTerrainDomain:{materialLandmarks:b=>b.honroLandmarks,render:b=>b.terrain},
 HonroVectorArt:{prepare:v=>{assert(v);prep++;}},
 HONRO_PROJECT:{
  library:[F,stockB],
  stages:Array.from({length:10},(_,i)=>({metadata:{stageId:21+i},design:{act3HandoffArt:F.id}}))
 }
};
Scope.HonroScene.prototype.landmark=function(){};
runInNewContext(runtime,Scope);
const D=Scope.HonroTerrainDomain;
const first={mode:'campaign',honroStage:21,honroCanonical:true,honroCustom:false,
 terrain:[floor],honroLandmarks:base, units:[{id:'archer',x:240,y:2810}], water:[]};
const before=JSON.stringify(first);
const rows=D.materialLandmarks(first);
assert.equal(rows, D.materialLandmarks(first),'visual-only land list identity per battle');
assert.equal(rows[0],base[0]);assert.equal(rows[1].asset.vector,F.vector);
assert.deepEqual(JSON.parse(JSON.stringify(rows[1].asset.bounds)),{x:-380,y:2220,w:6780,h:1080});
assert.equal(prep,2);
assert.equal(JSON.stringify(first),before);
assert.equal(JSON.stringify(F),JSON.stringify(JSON.parse(asset)));
assert.equal(stockB.vector.root.children[31].d,recipe.B31.old);

for(const id of [22,23,24,25,26,27,28,29,30]){
 const b={...first,honroStage:id};
 const r=D.materialLandmarks(b);
 assert.equal(r[1].asset,F);
 assert.equal(prep,2,'the west visual setting is owned by Stage21 only');
}
for(const delta of [{honroCanonical:false},{honroCustom:true},{honroStage:20},{honroStage:31}])
 assert.equal(D.materialLandmarks({...first,...delta}),base);

const oldSnapshot=JSON.parse(before);
oldSnapshot.honroLandmarks[0].asset.vector.root.children[31].d='M0 2810H120V3200H0Z';
assert.equal(D.materialLandmarks(oldSnapshot)[1].asset,F,'unmatched old owner stays stock, not a broken resume');
assert.equal(prep,2);
const profile=(await bytes('shared/runtime/profile-store.js')).toString();
runInNewContext(profile,Scope);
const store=Scope.HonroProfileStore;
const detached=JSON.parse(before);
assert.equal(store.compactBattleArt(detached),detached,'Stage21 old battle art stored inline');
assert.equal(store.restoreBattleArt(detached),true);
assert.equal(JSON.stringify(detached),before);
assert.equal(D.materialLandmarks(detached)[1].asset.bounds.x,-380,'new art bound at draw time after inline restore');
assert.equal(JSON.stringify(detached),before);
console.log('Stage21 native visual owner, stock fallbacks, exact provider source and offline inline restore: pass');
