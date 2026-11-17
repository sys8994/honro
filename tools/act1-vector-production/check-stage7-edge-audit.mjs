/** Offline production-scene A/B. No terrain, unit, camera or game data writes. */
import vm from 'node:vm';import assert from'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import{createCanvas,Image as NativeImage,Path2D,DOMMatrix,GlobalFonts}from'@napi-rs/canvas';import{runtimeParts,root}from'../../shared/build.mjs';
const id=Number(process.env.HONRO_AUDIT_STAGE||7),tag=String(id).padStart(2,'0'),out=`${root}/_local/reports/stage${id}-independent-${process.env.HONRO_AUDIT_LABEL||'baseline'}`;await mkdir(out,{recursive:true});GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
function canvas(w=300,h=150){const c=createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const document={createElement(tag){if(tag!=='canvas')throw Error(tag);return canvas();}};const g=vm.createContext({console,performance,structuredClone,Math:math,document,Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-vector-preview'},setTimeout,clearTimeout});g.window=g;for(const s of await runtimeParts({vector:true,render:true,productionStory:true}))vm.runInContext(s,g);
const project=g.HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===id),compiled=g.HonroMaps.compile(stage,project),b=g.HonroMaps.createBattle(stage,project);g.HonroStageRules.sanitizeStageBattle(b);const engine=new g.HONRO_CORE.Engine(b,()=>{},true),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),physics=hash({terrain:b.terrain,units:b.units}),hero=b.units.find(u=>u.side===0&&!u.dead);assert(hero);
const finalPrepare=g.HonroTerrainReadability.prepare;
const snapshots=()=>finalPrepare(b).groups.find(t=>t.id==='root-floor')?.segments;
const finalSegments=snapshots();
const oldCode=await readFile(`${root}/tests/fixtures/stage3-readability-before.js`,'utf8');vm.runInContext(oldCode,g);
const oldPrepare=g.HonroTerrainReadability.prepare,oldSegments=oldPrepare(b).groups.find(t=>t.id==='root-floor').segments;
assert.equal(oldSegments.length-finalSegments.length,3);
assert.equal(JSON.stringify(oldSegments.filter(s=>s.walkable)),JSON.stringify(finalSegments.filter(s=>s.walkable)));
for(const mode of ['other-stage','unpainted']){const t=structuredClone(b);if(mode==='other-stage')t.honroStage=3;else for(const q of t.terrain)q.honroAct1SitePainted=false;
 assert.equal(JSON.stringify(finalPrepare(t).groups.map(g=>g.segments)),JSON.stringify(oldPrepare(t).groups.map(g=>g.segments)));}
const scene=new g.HonroScene(canvas(1331,763)),paint=scene._landmarkPaintBounds(b.honroLandmarks.find(l=>l.asset.id==='act1-site:7:body')),r=scene._terrainRasterBounds(b);assert(r.left<=paint.left&&r.right>=paint.right&&r.bottom>=paint.bottom);
assert.equal(hash({terrain:b.terrain,units:b.units}),physics);console.log(JSON.stringify({stage:id,removedArtificialClosureSegments:3,walkRimUnchanged:true,negativeScopesUnchanged:true,physics,rasterBounds:r}));
