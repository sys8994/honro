/** Focused composite/save/cache boundary; not art approval or normal combat. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import vm from 'node:vm';
import {createCanvas,Path2D as NativePath,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';
import {refineStage18BellArt} from '../tools/environment/refine-stage18-bell-art.mjs';
const base='dd878c9e58213b2737f72b4ad4476b18464db83f',id='stage18:bell-hollow-body';
const old=JSON.parse(execFileSync('git',['show',base+':shared/data/campaign.json'],{maxBuffer:40e6})),current=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
assert.equal(await readFile('shared/data/campaign.json','utf8'),execFileSync('git',['show','a3b473489068fae52a1666776a6b6a523dbfac01:shared/data/campaign.json'],{maxBuffer:40e6,encoding:'utf8'}),'This revision changes no campaign/Library bytes');
assert.equal(await readFile('shared/assets/environment/stage18-hollow-bell.svg','utf8'),execFileSync('git',['show','a3b473489068fae52a1666776a6b6a523dbfac01:shared/assets/environment/stage18-hollow-bell.svg'],{encoding:'utf8'}),'Approved continuous bronze mouth remains exact');
const oldAsset=old.library.find(a=>a.id===id),asset=current.library.find(a=>a.id===id),normalized=structuredClone(current);
normalized.library[normalized.library.findIndex(a=>a.id===id)]=oldAsset;
assert.deepEqual(normalized,old,'All stages, floor/roof art, other Library assets and gameplay exact');
const strip=a=>{const v=structuredClone(a);delete v.vector;delete v.params.nodeCount;return v;};
assert.deepEqual(strip(asset),strip(oldAsset),'Bounds, anchor, physical aperture and metadata exact');
assert.deepEqual(JSON.parse(JSON.stringify(refineStage18BellArt(structuredClone(old)))),current,'Only reviewed local asset reauthored');
assert.deepEqual(JSON.parse(JSON.stringify(refineStage18BellArt(structuredClone(current)))),current,'Idempotent author');
for(const name of ['crown-yongnyu-and-sound-pipe','broad-korean-cast-reliefs','underside-view-hollow-interior'])assert.deepEqual(asset.vector.root.children.find(n=>n.id===name),oldAsset.vector.root.children.find(n=>n.id===name),'Upper reliefs and elliptical inner mouth preserved '+name);
assert.deepEqual(asset.vector.gradients,oldAsset.vector.gradients,'Original bronze palette exact');
assert(!asset.vector.root.children.some(n=>n.id==='cast-sound-window-frame'),'Obsolete loose window caps removed');
let paths=0;
const Path2D=new Proxy(NativePath,{construct(t,args){paths++;return Reflect.construct(t,args);}});
const g=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,document:{createElement:()=>createCanvas(64,64)},navigator:{userAgent:'bell-mouth-composite-check'},matchMedia:()=>({matches:true})});g.window=g;
for(const source of await runtimeParts({vector:true,render:true}))vm.runInContext(source,g);
vm.runInContext(await readFile('tools/testing/stage18-bell-render-fixture.js','utf8'),g);
const art=g.HonroStage18BellArt,project=g.HONRO_PROJECT,profile=g.HONRO_CORE.defaults(),rows=[];
const fresh=n=>{const b=g.HonroMaps.createBattle(project.stages[n-1],project,profile,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);return b;};
const start=fresh(18),cv=createCanvas(900,1100),c=cv.getContext('2d');
// The former rectangular reveal was transparent here. The actual composite
// now has the original opaque, dark elliptical cavity behind the real gallery.
c.translate(380,1050);c.scale(.22,.22);
const body=start.honroLandmarks.find(l=>l.id==='sb-bell-body');
let clips=0;const clip=c.clip.bind(c);c.clip=(...a)=>{clips++;return clip(...a);};
art.drawBell(c,{...body,x:0,y:0},start);assert.equal(clips,0,'No subtractive rectangular clip');const bellClipCalls=clips;
const pixel=[...c.getImageData(556,940,1,1).data];assert.equal(pixel[3],255,'Former reveal remains a coherent cavity');assert(Math.max(...pixel.slice(0,3))<80,'Cavity remains dark and reads as open interior');
const saved=JSON.parse(gunzipSync(await readFile('tests/fixtures/stage18-current-post-descent-r22-20261022.json.gz'))).profile.honroBattle;
const oldSavedSource=saved.honroLandmarks.find(l=>l.id==='sb-bell-body').asset.vector.source;
assert.notEqual(oldSavedSource,asset.vector.source);
const cases=[...['suspended','lowering','settled'].map(phase=>[phase,g.HonroStage18BellRenderFixture(start,phase).battle]),['fresh19',fresh(19)],['actualR22',saved]];
for(const [name,b]of cases){
 const before=JSON.stringify(b),body=b.honroLandmarks.find(l=>l.id==='sb-bell-body');
 const paint=art.bellPaint(body.asset,b);assert.equal(paint.paint.vector.source,asset.vector.source,'Current visual also used for old campaign save');
 art.drawBell(c,body,b);art.interiorStones(c,b,{scale:.4});const gallery=art.prepareGallery(b);
 assert.deepEqual(Array.from(gallery.sources,([t])=>t.id).sort(),['sb-east-gallery-sill','sb-inner-sound-stone','sb-inner-upper-turn']);
 paths=0;for(let i=0;i<3;i++){assert.equal(art.bellPaint(body.asset,b),paint);assert.equal(art.prepareGallery(b),gallery);art.drawBell(c,body,b);art.interiorStones(c,b,{scale:.4});}
 assert.equal(paths,0,'Repeated composite reuses all Path2D '+name);assert.equal(JSON.stringify(b),before,'Entire battle/old art remains exact '+name);
 const clone=structuredClone(b);art.prepareGallery(clone);const first=art.prepareGallery(clone);clone.sceneVersion=(clone.sceneVersion||0)+1;assert.notEqual(art.prepareGallery(clone),first,'Scene version invalidation');
 const prior=art.prepareGallery(clone),t=clone.terrain.find(t=>t.id==='sb-inner-upper-turn');t.vertices=t.vertices.map(p=>({...p}));assert.notEqual(art.prepareGallery(clone),prior,'Vertex source invalidation');
 rows.push({name,offset:g.HonroStage18Bell.memory(b).offset,newPathsAcrossThreeDraws:0,renderPure:true,oldSaveVisualOnly:name==='actualR22'});
}
assert.equal(saved.honroLandmarks.find(l=>l.id==='sb-bell-body').asset.vector.source,oldSavedSource);
const custom=structuredClone(saved);custom.honroMapOrigin='workshop';const customBody=custom.honroLandmarks.find(l=>l.id==='sb-bell-body');assert.equal(art.bellPaint(customBody.asset,custom).paint.vector.source,oldSavedSource,'Do not replace custom project asset');
const manifest=JSON.parse(await readFile('web/manifest.json','utf8')),files=new Map();
for(const gen of manifest.publishedGenerations)for(const f of gen.files)files.set(f.path,f);
for(const f of files.values()){const bytes=await readFile(f.path);assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.path);}
for(const file of ['web/data/chapter-13-assets.1387b6a1f088fc74.json','web/data/chapter-13.516170b245a8b075.json'])assert(files.has(file));
assert(manifest.publishedGenerations.some(g=>g.sourceSha===base&&g.publishedAt==='2026-10-22T22:24:21Z'));
const builtLibrary=JSON.parse(await readFile(manifest.files.find(f=>/campaign-library\./.test(f.path)).path,'utf8'));
const builtAsset=(Array.isArray(builtLibrary)?builtLibrary:builtLibrary.library).find(a=>a.id===id);assert.deepEqual(builtAsset,asset,'Current generated Library has corrected source');
const report={checkedCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base,allStagesAndOtherAssetsExact:true,bellMetadataExact:true,upperReliefsAndPaletteExact:true,idempotent:true,formerRectanglePixel:pixel,drawBellClipCalls:bellClipCalls,rows,publishedGraphs:manifest.publishedGenerations.length,protectedFiles:files.size,entry:manifest.gameEntry,scope:'Composite regression and forced render state fixtures, no normal combat, art approval or FPS claim.'};
await mkdir('_local/reports/stage18-bell-mouth',{recursive:true});await writeFile('_local/reports/stage18-bell-mouth/contracts.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
