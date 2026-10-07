import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),plain=v=>JSON.parse(JSON.stringify(v)),stageId='stage-1';
const command={op:'terrain.add',stageId,id:'platform-test',type:'platform',control:[[400,1100],[650,1080]],thickness:40,material:'wood'};
for(const explicit of [undefined,true,false]){
 const p=g.HonroCommands.apply(g.HONRO_PROJECT,[{...command,...(explicit===undefined?{}:{oneWay:explicit})}]),t=p.stages[0].terrains.find(t=>t.id===command.id),expected=explicit??true;
 assert.equal(t.oneWay,expected);assert.equal(g.HonroGeometry.terrain(t).oneWay,expected);assert.equal(g.HonroMaps.compile(p.stages[0],p).terrain.find(v=>v.id===t.id)?.oneWay,expected);
 const loaded=g.HonroMaps.normalize(JSON.parse(g.HonroMaps.serialize(p)));assert.deepEqual(plain(loaded),plain(p),'Workshop export/import keeps the explicit choice');
}
const platform={id:'old-platform',type:'platform',control:[{x:400,y:1100},{x:650,y:1080}],thickness:40};assert.equal(g.HonroGeometry.terrain(platform).oneWay,true);assert.equal(g.HonroGeometry.terrain({...platform,oneWay:false}).oneWay,false);
const boundary={...platform,control:[{x:0,y:1100},{x:650,y:1080}]},domain=g.HonroTerrainDomain.author({stages:[{width:2000,height:2000,metadata:{stageId:1},terrains:[boundary]}]});assert.equal(domain.stages[0].terrains[0].playProjection,undefined,'A semantic platform is not extended into foundation terrain');
const polygon={id:'floating-solid',type:'solid',points:[{x:300,y:500},{x:700,y:500},{x:700,y:600},{x:300,y:600}],baseMaterial:'wood'};assert.equal(g.HonroGeometry.terrain(polygon).oneWay,false,'No floating/material/name inference');
for(const bad of ['true',1]){const p=plain(g.HONRO_PROJECT);p.stages[0].terrains[0].oneWay=bad;assert(g.HonroMaps.validate(p).some(x=>x.level==='err'&&x.text.includes('oneWay')));}
{const p=plain(g.HONRO_PROJECT);p.stages[0].terrains[0].oneWay=true;p.stages[0].terrains[0].properties.honroCeiling=true;assert(g.HonroMaps.validate(p).some(x=>x.level==='err'&&x.text.includes('ceiling')));}
for(const stage of g.HONRO_CORE.STAGES.filter(st=>!g.HONRO_CORE.isVerticalStage(st))){const world=g.HONRO_CORE.createWorld(stage);assert(world.terrain.filter(t=>t.id.startsWith('platform_')).every(t=>t.oneWay));assert(world.terrain.filter(t=>t.id.startsWith('roof_')).every(t=>!t.oneWay));}
// Exercise the production inspector and onchange handler with only DOM stubs.
const dom=new Map(),node=()=>({value:'',innerHTML:'',style:{},checked:false});g.document={querySelector:id=>{if(!dom.has(id))dom.set(id,node());return dom.get(id);},querySelectorAll:()=>[]};g.localStorage={getItem:()=>null};g.window=g;
const source=(await readFile('workshop/src/app.js','utf8')).replace("addEventListener('DOMContentLoaded',init);",`globalThis.platformEditorTest={inspect:stageInspectorHtml,bind:bindStageInspector,setup(p,id){project=p;selected={type:'terrain',id};sceneStats=()=>({terrainDerived:0,elementNodes:0,total:0});environmentPanel=()=>'';bindExtendedInspector=()=>{};renderAll=()=>{};commit=(label,fn)=>fn(project);}};`);
vm.runInContext(source,g);const p=plain(g.HONRO_PROJECT),t=p.stages[0].terrains[0];g.platformEditorTest.setup(p,t.id);assert(g.platformEditorTest.inspect(p.stages[0]).includes('id="terrainCollision"'));g.platformEditorTest.bind(p.stages[0]);const selector=dom.get('#terrainCollision');
for(const [mode,oneWay,ceiling]of [['platform',true,false],['ceiling',false,true],['solid',false,false]]){selector.value=mode;selector.onchange();assert.equal(t.oneWay,oneWay);assert.equal(!!t.properties.honroCeiling,ceiling);assert.equal(g.HonroGeometry.terrain(t).oneWay,oneWay);}
console.log('PASS explicit platform defaults, solid roofs, strict schema, Workshop inspector choice and roundtrip');
