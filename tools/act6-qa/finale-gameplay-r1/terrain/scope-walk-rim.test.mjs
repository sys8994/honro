import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attachMatteWalkRim} from './scope-walk-rim.mjs';
const make=()=>{
 const b={mode:'campaign',honroStage:58,honroAuthoredId:'stage-58',honroCanonical:true,honroCustom:false,honroMapOrigin:'campaign'};
 const ctx={strokeStyle:'#111',globalAlpha:1,lineWidth:2,log:[],stroke(){this.log.push([this.strokeStyle,this.globalAlpha,this.lineWidth]);}};
 const style={topLight:'#666',woodLight:'#999'};
 const scene={battle:b,terrainReadability(c){for(const x of [style.topLight,'#111',style.woodLight]){c.strokeStyle=x;c.stroke();}}};
 const owner={ownsExactPaintedTerrain:b0=>b0===b};
 return {scene,battle:b,owner,rendererStyle:style,ctx};
};
test('authored palette only, owner test re-evaluated; no debug or geometry mutation',()=>{
 const q=make(),old=q.scene.terrainReadability,raw=JSON.stringify(q.battle),stroke=q.ctx.stroke;
 const detach=attachMatteWalkRim(q);assert(detach);
 q.scene.terrainReadability(q.ctx,q.battle);
 assert.deepEqual(q.ctx.log,[['#666',.23,1.44],['#111',1,2],['#999',.23,1.44]]);
 assert.equal(q.ctx.stroke,stroke);assert.equal(JSON.stringify(q.battle),raw);
 detach();assert.equal(q.scene.terrainReadability,old);
});
test('older stage, Workshop and noncanonical/forged paint cannot attach',()=>{
 for(const spec of [{honroStage:50},{honroCustom:true},{mode:'skirmish'},{honroCanonical:false},{honroAuthoredId:'stage-50'}]){
  const q=make();Object.assign(q.battle,spec);assert.equal(attachMatteWalkRim(q),null);
 }
 const q=make();q.owner=null;assert.equal(attachMatteWalkRim(q),null);
});
