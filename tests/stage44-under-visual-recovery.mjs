import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url));
const undersideBytes=read('shared/assets/environment/act5/stage44-underside.json');
const sha=createHash('sha1').update(Buffer.from('blob '+undersideBytes.length+'\0')).update(undersideBytes).digest('hex');
assert.equal(sha,'760574c3c823de78e7c9ae243e924a2629f8af95','released Stage44 save provider source drifted');
const authored=JSON.parse(undersideBytes);
const asset={...authored,tags:['terrain','act5'],category:'rock',visual:[],collision:[],sockets:[]};
const under={id:'a5-under',asset,x:160,y:586,scale:3.2,rotation:0,layer:'structural-back',depthLayer:'L1',visualRole:'scenery'};
const root={id:'act5:stage44:root-continuation'}, crown={id:'act5:stage44:upper-canopy'};
const near={id:'a5-near',x:0,y:0,scale:6800/2172,rotation:0,asset:{
 id:'act5:near:44',rootExterior:root,upperCanopy:crown,rootUpperClip:[],vector:{version:1,clips:{},root:{tag:'g',children:[]}}
}};
const other={...under,id:'another-scenery'};
const b={mode:'campaign',honroAct5:1,honroStage:44,honroCanonical:true,honroCustom:false,honroMapOrigin:'campaign',
 honroAuthoredId:'stage-44',honroRevision:20,honroCampaignMapRevision:1,
 honroLandmarks:[under,near],honroElements:[under,near],terrain:[{id:'a5-root-floor',heights:[2080,2105]}]};
class Scene {
 calls=[];
 landmark(c,l){this.calls.push(l);}
 _landmarkPaintBounds(){return null;}
 _drawTerrainDomainTiles(){}
 terrainReadability(){}
}
const vectors=[], g=vm.createContext({HonroScene:Scene,structuredClone,HONRO_CORE:{},
 HONRO_PROJECT:{library:[asset,near.asset]},HonroVectorArt:{draw(c,leaf){vectors.push(leaf.id);}}
});
vm.runInContext(read('shared/runtime/profile-store.js').toString('utf8'),g);
vm.runInContext(read('shared/runtime/act5-edge-art.js').toString('utf8'),g);
const s=new Scene();s.battle=b;
const draw={save(){},restore(){},translate(){},scale(){}};

const start=JSON.stringify(b), origAsset=JSON.stringify(asset);
s.landmark(null,under);
assert.deepEqual(s.calls,[],'new exact canonical placement leaked to base painter');
assert.deepEqual(vectors,[],'withdrawn geometry reached VectorArt');
assert.equal(JSON.stringify(b),start,'canonical placements or collision changed in paint');
assert.equal(JSON.stringify(asset),origAsset,'active provider changed in paint');

const save = g.HonroProfileStore.compactBattleArt(b);
const encoded=save.honroLandmarks[0].asset;
assert.equal(JSON.stringify(encoded),'{"honroStaticAssetRef":1,"id":"act5:under:44","signature":"958126:1c647a93"}');
const restored=structuredClone(save);
assert.equal(g.HonroProfileStore.restoreBattleArt(restored),true,'released a6 static reference rejected');
assert.equal(JSON.stringify(restored.honroLandmarks[0].asset),origAsset,'restored provider bytes changed');
s.battle=restored;
s.landmark(null,restored.honroLandmarks[0]);
assert.deepEqual(s.calls,[],'restored Stage44 scenery leaked to base painter');
assert.deepEqual(vectors,[]);
assert.equal(JSON.stringify(g.HonroProfileStore.compactBattleArt(restored)),JSON.stringify(save),'save format or values changed');
const corrupt=structuredClone(save);corrupt.honroLandmarks[0].asset.signature='958126:00000000';
const corruptBefore=JSON.stringify(corrupt);
assert.equal(g.HonroProfileStore.restoreBattleArt(corrupt),false,'must not weaken signature checks');
assert.equal(JSON.stringify(corrupt),corruptBefore);

s.battle=b;
s.landmark(draw,near);
assert.deepEqual(vectors,[root.id,near.asset.id,crown.id],'protected near/body and canopy draw sequence changed');
for(const l of [other,{...under,x:161},{...under,y:587},{...under,scale:3.2001},{...under,rotation:.1},{...under,asset:{...asset,id:'act5:under:other'}}]){
 s.calls=[];s.landmark(draw,l);assert.deepEqual(s.calls,[l],'unrelated placement was hidden');
}
for(const state of [null,{...b,mode:'practice'},{...b,honroStage:45},{...b,honroCanonical:false},{...b,honroCustom:true},{...b,honroMapOrigin:'workshop'},{...b,honroAuthoredId:'stage-45'}]){
 s.battle=state;s.calls=[];s.landmark(draw,under);assert.deepEqual(s.calls,[under],'non-authoritative scene was hidden');
}
console.log('Stage44 canonical withdrawn scenery visual gate only: fresh/restored draw, exact signed a6 provider, no mutation, unchanged near/canopy and negative controls passed.');
