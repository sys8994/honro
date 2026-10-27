import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),g=vm.createContext({Path2D:native.Path2D,console});
for(const file of ['shared/map/visual-style.js','shared/map/vector-art.js'])vm.runInContext(await readFile(file,'utf8'),g);
// Isolated presentation fixture supplies the current quest-record adapter.
g.HonroQuestTargets={records:b=>b.terrain||[]};
const V=g.HonroVisualStyle,cv=native.createCanvas(160,160),raw=cv.getContext('2d');
let previous=2;for(const depth of ['L1','L2','L3','L4','SKY']){assert(V.STYLE.saturation[depth]<previous);previous=V.STYLE.saturation[depth];const rgb=V.color('#d8603acc',depth);assert(rgb.endsWith('cc'),'Alpha is unchanged');const channels=rgb.slice(1,7).match(/../g).map(v=>parseInt(v,16)),y=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;assert(Math.abs(y-(V.STYLE.tonePivot+((216*.2126+96*.7152+58*.0722)-V.STYLE.tonePivot)*V.STYLE.contrast[depth]))<.6,'Bounded atmospheric contrast keeps the authored light ordering');}
assert.equal(V.context(V.context(raw,'L1'),'L3'),V.context(raw,'L3'),'Nested depth replaces, never multiplies');
assert.equal(V.raw(V.context(raw,'L2')),raw);assert.equal(V.contextLike(V.context(raw,'L4'),raw),V.context(raw,'L4'));
const pixel=(x,y)=>Array.from(raw.getImageData(x,y,1,1).data);
const c=V.context(raw,'L1');c.fillStyle='#d8603a';c.strokeStyle='#ffffff';c.lineWidth=8;c.beginPath();c.rect(30,30,60,60);c.fill();c.stroke();assert.equal(pixel(28,50)[3],0,'No outer decorative contour');assert.notEqual(pixel(31,50)[0],255,'No inner decorative contour');
c.beginPath();c.moveTo(32,50);c.lineTo(88,50);c.lineWidth=2;c.stroke();assert.deepEqual(pixel(50,50),pixel(50,55),'Fine internal decorative stroke omitted');
c.strokeStyle='#668844';c.lineWidth=12;c.beginPath();c.moveTo(110,30);c.lineTo(110,110);c.stroke();assert(pixel(110,70)[3]>0,'Wide open material stroke survives as filled trunk/brace');
const before=V.stats().brushes;c.stroke();assert.equal(V.stats().brushes,before,'Material ribbon path is cached');
const gradient=c.createLinearGradient(0,0,20,0);gradient.addColorStop(0,'#ff0000');gradient.addColorStop(1,'#ff0000');c.fillStyle=gradient;c.fillRect(0,0,20,20);assert(pixel(5,5)[1]>0,'Gradient stop receives layer saturation');
const play=V.context(raw,'gameplay');play.fillStyle='#ff0000';play.fillRect(0,120,20,20);assert.deepEqual(pixel(5,125),[255,0,0,255],'Gameplay colors unchanged');play.strokeStyle='#ffffff';play.lineWidth=4;play.strokeRect(30,120,20,20);assert.equal(pixel(29,125)[0],255,'Gameplay contour unchanged');
assert.equal(V.depth({depthLayer:'L1',asset:{environmentRole:'mountain'}}),'L3','World-aligned rear mountain has distant paint without changing projection');
assert.equal(V.depth({depthLayer:'L1',asset:{environmentRole:'tree'}}),'L1','Grounded near trees stay near');
assert.equal(V.depth({depthLayer:'L4',asset:{environmentRole:'tree'}}),'L4','Explicit scenic depth wins');
assert.equal(V.classify({id:'brand-new-machine',visualRole:'gameplay'},{}),'gameplay','New event art has a declaration, never a classifier ID edit');
assert.equal(V.classify({id:'new-rear-prop',visualRole:'decoration',layer:'prop'},{}),'decoration');
assert.equal(V.classify({id:'new-back-deck',visualRole:'decoration',collisionIds:['physical']},{}),'gameplay','Collision wins over a mistaken decorative hint');
assert.equal(V.classify({id:'new-unit-art',visualRole:'decoration',gameplayLinks:{unitIds:['operator']}},{units:[{id:'operator'}]}),'gameplay','Actual unit link wins over decorative hint');
assert.equal(V.classify({id:'new-goal-art',asset:{params:{gameplayLinks:{markerIds:['switch']}}}},{honroMarkers:[{id:'switch'}]}),'gameplay','Arbitrary author-supplied objective links use common semantics');
assert.equal(V.classify({id:'new-unlinked-scenery',gameplayLinks:{markerIds:['missing']}},{}),'decoration','Unknown future scenery safely defaults to decoration');
assert.equal(V.depth({visualDepth:'L4',depthLayer:'L1'}),'L4','Paint depth can be declared independently from projection');
assert.equal(V.classify({id:'deck',layer:'back',collisionIds:['solid']},{}),'gameplay');
assert.equal(V.classify({id:'grass',layer:'prop',asset:{params:{collisionSource:'authored-stage-terrain'}}},{}),'decoration');
assert.equal(V.classify({id:'event',asset:{}},{honroMarkers:[{elementId:'event'}]}),'gameplay');
assert.equal(V.classify({x:10,y:20},{terrain:[{id:'floor'}],honroMarkers:[{id:'unrelated',x:0,y:0}]}),'decoration','Missing IDs never create a semantic link');
assert.equal(V.classify({kind:'receiverStone',x:10,y:20},{honroMarkers:[{id:'receiver-5',type:'receiver',action:'ritual',x:10,y:20}]}),'gameplay','Legacy ritual receiver uses marker type');
assert.equal(V.classify({kind:'cliffShrine',x:25,y:70},{honroStage:5,terrain:[{id:'cliff-cleat',x:0,y:20,w:50,h:50}]}),'gameplay','Legacy shrine remains tied to the actual cleat terrain');
assert.equal(V.classify({id:'roof',asset:{params:{rearOnly:true}}},{}),'decoration');
assert.equal(V.classify({id:'bridge',asset:{params:{collisionSource:'floor,pier'}}},{terrain:[{id:'pier'}]}),'gameplay');
for(const [stage,id]of [[11,'s11-art-ritual-clearing'],[12,'sq-art-waymark'],[15,'a2-15-0'],[19,'sb-old-soul-stone'],[23,'sy-art-cargo'],[30,'sf-art-map-stone'],[30,'sf-art-settled-barge']])assert.equal(V.classify({id},{honroStage:stage}),'gameplay',`${stage}/${id}`);
assert.equal(V.classify({id:'sb-bell-body',stage18Bell:{terrainIds:['shell']}},{terrain:[{id:'shell'}]}),'gameplay');
const asset={anchor:{x:0,y:0},vector:{version:1,viewBox:[0,0,40,40],root:{tag:'g',fill:'#b65832',stroke:'#ffffff',lineWidth:5,children:[{tag:'path',d:'M10 10H30V30H10Z'}]}}};
raw.clearRect(0,0,160,160);g.HonroVectorArt.draw(c,asset,{x:0,y:0});assert.equal(pixel(8,20)[3],0,'Inherited authored SVG contour removed');
raw.clearRect(0,0,160,160);g.HonroVectorArt.draw(play,asset,{x:0,y:0});assert(pixel(8,20)[3]>0,'Same vector remains outlined as gameplay');
assert.equal(asset.vector.root.stroke,'#ffffff','Styling never mutates editable vector source');
g.HonroScene=class{};g.HonroGeometry={shapes:a=>a.visual};vm.runInContext(await readFile('shared/runtime/elements.js','utf8'),g);
const primitive={collision:[{}],visual:[{fill:'#b65832',points:[{x:10,y:10},{x:30,y:10},{x:30,y:30},{x:10,y:30}]}]};raw.clearRect(0,0,160,160);g.HonroElements.draw(raw,primitive,{id:'solid'},{});assert(pixel(9,20)[3]>0,'Filled primitive gameplay asset gains visible-shape silhouette, not hitbox outline');
g.HonroMaps={clone:v=>JSON.parse(JSON.stringify(v))};vm.runInContext(await readFile('shared/map/compiler.js','utf8'),g);
const nativeAsset={id:'new-native-art',kind:'receiverStone',renderer:'landmark',visualRole:'gameplay',visualDepth:'L3',gameplayLinks:{markerIds:['new-switch']}},nativeStage={terrains:[],materials:[],elements:[{id:'new-native-instance',assetId:nativeAsset.id,x:10,y:20}]};
const compiled=g.HonroMaps.compile(JSON.parse(JSON.stringify(nativeStage)),{library:[JSON.parse(JSON.stringify(nativeAsset))]});assert.equal(V.classify(compiled.landmarks[0],{}),'gameplay','New native asset role survives compile/save transport');assert.equal(V.depth(compiled.landmarks[0]),'L3');assert.deepEqual(Array.from(compiled.landmarks[0].gameplayLinks.markerIds),['new-switch']);
const build=await readFile('shared/build.mjs','utf8');assert(build.includes("'visual-style','vector-art'"));assert(build.indexOf("'visual-hierarchy'")>build.indexOf("'narrative-art'"),'Final hierarchy follows narrative/event painters');
for(const name of ['stage8-bier-art','stage23-escort-art','stage30-ferry-art'])assert((await readFile(`shared/runtime/${name}.js`,'utf8')).includes("context(cv.getContext('2d'),'SKY')"),`${name} authored panorama styled at raster build`);
assert((await readFile('shared/runtime/renderer.js','utf8')).includes('contextLike(c,cc)'),'Screen-cache painting preserves decoration context');
assert((await readFile('shared/runtime/visual-hierarchy.js','utf8')).includes("V.key()"),'Style version participates in screen/tile invalidation');
assert((await readFile('shared/runtime/act1-spatial-art.js','utf8')).includes("function supports(c,b){c=G.HonroVisualStyle?.context(c,'L1')"),'Direct Act1 brace path remains decorative');
assert((await readFile('shared/runtime/act2-spatial-art.js','utf8')).includes("const terrainContext=c;c=G.HonroVisualStyle?.context(c,'L1')"),'Noncolliding Act2 support members separate from the physical deck');
console.log('PASS visual hierarchy: semantic roles, five depth strengths, luminance/alpha, native and SVG contours, filled material ribbons, gameplay colors, cached styling, shared bundle and authored sky coverage');

// The new material theme is rendering-only and never enters actors/markers.
vm.runInContext(await readFile('shared/map/environment.js','utf8'),g);
const E=g.HonroEnvironment,theme=E.act3Palette({honroStage:21},'earth');assert(theme);for(const n of [1,16,22,25,27])assert.equal(E.act3Palette({honroStage:n},'earth'),null);assert.equal(E.act3Palette({honroStage:21,honroCustom:true}),null);for(const n of [21,23,24,26,28,29,30])assert(E.act3Outdoor({honroStage:n}));
const earth=V.context(raw,'gameplay',theme);earth.fillStyle='#62776a99';earth.fillRect(100,120,20,20);assert.equal(raw.fillStyle,theme.paint('#62776a99'));assert(theme.paint('#62776a99').endsWith('99'));
const cacheContext=native.createCanvas(10,10).getContext('2d');assert.equal(V.contextLike(earth,cacheContext),V.context(cacheContext,'gameplay',theme));assert.equal(V.context(earth,'L3'),V.context(raw,'L3',theme),'Depth switches retain one scoped palette');
play.fillStyle='#ff0000';play.fillRect(0,120,20,20);assert.deepEqual(pixel(5,125),[255,0,0,255],'Ordinary gameplay remains outside the theme');console.log('PASS scoped overcast material palette/alpha/cache inheritance, real outdoor geography and interior/Act1/Act2/custom exclusion');

assert.equal(theme.gradient('#62776a99',0,1600),theme.paint('#62776a99'));assert.notEqual(theme.gradient('#62776a99',1,1600),theme.paint('#62776a99'),'Only deep vertical material reaches dark brown-black');assert.equal(theme.gradient('#62776a99',1,50),theme.paint('#62776a99'),'Shallow/near surfaces retain their material palette');

assert.notEqual(E.campaignMood(21,true).opacity,E.campaignMood(21).opacity,'Custom mood keeps its prior grade');
