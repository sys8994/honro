import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../../'+name,import.meta.url),'utf8');
class Path {moveTo(){} lineTo(){}}
class Scene {}
Scene.prototype.landmark=()=>false;
let painted;
const sandbox=vm.createContext({Path2D:Path,HonroScene:Scene,HONRO_CORE:{},HonroVectorArt:{draw(c,a){painted=a;return true;}}});
for(const name of ['terrain-readability','act4-pilot-art'])vm.runInContext(read('shared/runtime/'+name+'.js'),sandbox);
const p=(x,y)=>({x,y});
const official=stage=>({honroStage:stage,honroCanonical:true,honroCustom:false,honroMapOrigin:'campaign',honroAuthoredId:'stage-'+stage,honroMap:{nativeArt:{version:1,coveredTerrainIds:[]}}});
const ink=(b,id,a,z)=>JSON.parse(JSON.stringify(sandbox.HonroTerrainReadability.paintPieces(b,id,a,z)));
assert.deepEqual(ink(official(42),'a5-palisade-ramp',p(1352,1980),p(2539,1430)),[]);
assert.deepEqual(ink(official(44),'a5-root-floor',p(4349.61,2005.47),p(5358.98,2012.11)),[[p(4349.61,2005.47),p(5358.98,2012.11)]]);
for(const [a,z] of [[p(5358.98,2012.11),p(5744.14,1819.53)],[p(5744.14,1819.53),p(6109.38,1812.89)],[p(6109.38,1812.89),p(6700.39,1733.2)]])
 assert.deepEqual(ink(official(44),'a5-root-floor',a,z),[]);
const [eastSouth]=ink(official(44),'a5-root-floor',p(6700.39,1733.2),p(6700.39,2269));
assert.equal(eastSouth[0].x,6700.39);
assert(Math.abs(eastSouth[0].y-2014)<1e-8);
assert.deepEqual(eastSouth[1],p(6700.39,2269));
assert.deepEqual(ink(official(45),'a5-palisade-ramp',p(1352,1980),p(2539,1430)),[[p(1352,1980),p(2539,1430)]]);
assert.deepEqual(ink({...official(42),honroMapOrigin:'workshop'},'a5-palisade-ramp',p(1352,1980),p(2539,1430)),[[p(1352,1980),p(2539,1430)]]);
const {assets:[a]}=JSON.parse(read('shared/data/act4/handoff-art/38.json'));
const retained=JSON.stringify(a), scene=new Scene(), sample={asset:a,id:a.id,x:0,y:0,scale:1,layer:'mid',nativeArtLayer:'surface',kind:'canonical-element'};
const d=x=>x.vector.root.children[0].children[0].children[0].children[0].d;
scene.battle=official(38);scene.landmark({},sample);
assert.notEqual(painted,a);
assert.equal(d(a).split('Z').length-d(painted).split('Z').length,4);
const copy=painted;
scene.landmark({},sample);assert.equal(painted,copy);
scene.battle={...official(38),honroMapOrigin:'workshop'};scene.landmark({},sample);
assert.equal(painted,a);assert.equal(JSON.stringify(a),retained);assert.equal(sample.asset,a);
console.log('PASS: targeted ordinary ink, campaign guard, stage38 cached paint and untouched save asset');
