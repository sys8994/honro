/** Verify only the canonical Stage 7 distant polygon closing stroke. No mock geometry. */
import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import vm from 'node:vm';
import {buildCore} from '../game/engine/build.mjs';
const source=(p)=>read(new URL('../'+p,import.meta.url),'utf8');
const core=await buildCore();
const src=source('shared/runtime/terrain-readability.js');
const input={'map-engine.js':source('shared/runtime/map-engine.js'),'terrain-domain.js':source('shared/map/terrain-domain.js'),
 'geometry.js':source('shared/map/geometry.js'),'stage7.json':source('web/data/chapter-07.28f7bf612a598aeb.json')};
const stage=JSON.parse(input['stage7.json']);
assert.equal(stage.id,'stage-7');
assert.equal(stage.terrains.length,37);
const sources=(src)=>new Map([['map-engine.js',input['map-engine.js']],['terrain-domain.js',input['terrain-domain.js']],['geometry.js',input['geometry.js']],['readability',src]]);
class Paths {
 segments=[];
 moveTo(x,y){this.point=[x,y];}
 lineTo(x,y){this.segments.push([this.point,[x,y]]);}
}
class Scene {canvas={clientWidth:1440};scale=.21176470588235294;}
function evaluate(src,mutate=()=>{},pose={}){
 const strokes=[];
 const c={save(){},restore(){},stroke(p){strokes.push({style:this.strokeStyle,width:this.lineWidth,segments:p.segments});}};
 const env=vm.createContext({Path2D:Paths,HonroScene:Scene});
 vm.runInContext(core,env,{filename:'engine/core'});
 for(const [key,js] of sources(src))vm.runInContext(js,env,{filename:key});
 const Q=env.HonroGeometry,G=env.HonroTerrainDomain;
 const st=structuredClone(stage); const b={
  sceneVersion:1,width:st.width,height:st.height,honroStage:st.metadata.stageId,
  honroCanonical:true,honroCustom:st.metadata.campaign!==true,honroMapOrigin:'campaign',honroAuthoredId:st.id,
  terrain:st.terrains.map(t=>Q.terrain(t,st.height)),
  honroWorldTerrain:st.terrains.map(t=>({...Q.terrain(t,st.height,true),...(t.playProjection?{honroDomainProjection:structuredClone(t.playProjection)}:{})})),
  honroTerrainDomainVersion:1,honroPlayBounds:st.playBounds,honroTerrainBounds:st.terrainBounds,honroMap:st.design,honroLandmarks:[]};
 mutate(b,Q,st);
 assert.equal(G.active(b),true,'authored world terrain was not actually active');
 const scene=new Scene();scene.scale=pose.scale||scene.scale;scene.canvas.clientWidth=pose.width||scene.canvas.clientWidth;
 const prev=JSON.stringify(b), terrain=G.render(b), initial=JSON.stringify(terrain), groups=env.HonroTerrainReadability.prepare(b).groups;
 scene.terrainReadability(c,b,pose.viewport);
 assert.equal(JSON.stringify(b),prev);
 assert.equal(JSON.stringify(G.render(b)),initial);
 return JSON.parse(JSON.stringify({groups,strokes,renderTerrain:initial}));
}
const closure={a:{x:5732.24,y:5069.18},z:{x:-1200,y:5069.18},walkable:false};
const edge=[Object.values(closure.a),Object.values(closure.z)];
const isClosure=q=>JSON.stringify(q)===JSON.stringify(closure);
const isEdge=q=>JSON.stringify(q)===JSON.stringify(edge);
function ordinaryReference(b){b.honroMapOrigin='workshop';}
function exactComparison(plain,normal){
 const group=plain.groups.find(g=>g.id==='root-floor');
 assert.equal(group.segments.filter(q=>q.walkable).length,13);
 assert.equal(group.segments.filter(isClosure).length,1);
 assert.equal(plain.strokes.flatMap(s=>s.segments).filter(isEdge).length,1);
 group.segments=group.segments.filter(q=>!isClosure(q));
 group.edge.segments=group.edge.segments.filter(q=>!isEdge(q));
 for(const stroke of plain.strokes)stroke.segments=stroke.segments.filter(q=>!isEdge(q));
 assert.deepEqual(normal,plain,'only the one distant dark closure may change');
}
exactComparison(evaluate(src,ordinaryReference),evaluate(src));
for(const [label,mutate] of Object.entries({
 stage6:b=>{b.honroStage=6;},stage8:b=>{b.honroStage=8;},
 custom:b=>{b.honroCustom=true;},noncanonical:b=>{b.honroCanonical=false;},
 otherAuthoredID:b=>{b.honroAuthoredId='stage-7-copy';},
 otherLandscape:b=>{for(const o of [...b.terrain,...b.honroWorldTerrain])if(o.id==='root-floor')o.id='independent-owner';},
 unmarked:b=>{for(const o of [...b.terrain,...b.honroWorldTerrain])if(o.id==='root-floor')delete o.honroAct1SitePainted;},
 alternateGround:(b,Q,st)=>{const t=structuredClone(st.terrains.find(t=>t.id==='root-floor'));t.floor-=20;
  b.terrain=b.terrain.map(o=>o.id===t.id?Q.terrain(t,st.height):o);
  b.honroWorldTerrain=b.honroWorldTerrain.map(o=>o.id===t.id?Q.terrain(t,st.height,true):o);}
})){
 const retained=evaluate(src,mutate);
 assert.deepEqual(retained,evaluate(src,(b,Q,st)=>{mutate(b,Q,st);ordinaryReference(b);}),label);
 assert.ok(retained.groups.some(g=>g.edge.segments.some(s=>s[0][1]===s[1][1]&&s[0][1]>=5049.18&&Math.abs(s[1][0]-s[0][0])>6800)),label);
}
const stage3=(b)=>{b.honroStage=3;b.honroLandmarks=[{asset:{params:{omitTerrainClosureIds:['root-floor']}}}];};
assert.equal(evaluate(src,stage3).groups.find(g=>g.id==='root-floor').segments.some(isClosure),false);
console.log('Stage7 root-floor: one south closure stroke omitted, thirteen walking edges, all other geometry and paths identical.');
