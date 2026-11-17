/** Offline production-scene A/B. No terrain, unit, camera or game data writes. */
import vm from 'node:vm';import assert from'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import{createCanvas,Image as NativeImage,Path2D,DOMMatrix,GlobalFonts}from'@napi-rs/canvas';import{runtimeParts,root}from'../../shared/build.mjs';
const id=2,out=`${root}/_local/reports/stage2-bounds-audit-${process.env.HONRO_STAGE2_BOUNDS_BASELINE==='1'?'before':'after'}`;await mkdir(out,{recursive:true});GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
function canvas(w=300,h=150){const c=createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const document={createElement(tag){if(tag!=='canvas')throw Error(tag);return canvas();}};const g=vm.createContext({console,performance,structuredClone,Math:math,document,Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-vector-preview'},setTimeout,clearTimeout});g.window=g;for(const s of await runtimeParts({vector:true,render:true,productionStory:true}))vm.runInContext(s,g);
if(process.env.HONRO_STAGE2_BOUNDS_BASELINE==='1')for(const a of g.HONRO_PROJECT.library)if(a.id==='act1-traced:stage02-body-v2'||a.id==='act1-traced:stage02-rear-v2'){a.bounds={x:-4000,y:0,w:12300,h:4500};a.reference.bounds={...a.bounds};}
const project=g.HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===id),compiled=g.HonroMaps.compile(stage,project),b=g.HonroMaps.createBattle(stage,project);g.HonroStageRules.sanitizeStageBattle(b);const engine=new g.HONRO_CORE.Engine(b,()=>{},true),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),physics=hash({terrain:b.terrain,units:b.units}),hero=b.units.find(u=>u.side===0&&!u.dead);assert(hero);
const inst=b.honroLandmarks.filter(l=>l.id==='act1-stage02-traced-body');assert.equal(inst.length,1);assert.equal(inst[0].collisionIds.length,0);
const views=[
{name:'overview',width:1331,height:763,scale:1331/6800,x:2150,y:1650},
...[[0,0],[4300,0],[0,3300],[4300,3300]].map(([x,y],i)=>({name:'corner-'+i,width:1331,height:763,scale:1331/6800,x,y})),
...[[600,800],[1250,1500],[1300,2400],[2500,2950],[3450,2500],[3700,1600],[4000,600]].map(([x,y],i)=>({name:'join-'+i,width:1331,height:763,scale:.94,x,y})),
{name:'portrait-low',width:390,height:696,scale:390/6800,x:2150,y:3300},
{name:'portrait-walk',width:390,height:696,scale:.82,x:hero.x,y:hero.y-184},
{name:'landscape-low',width:844,height:390,scale:844/6800,x:2150,y:3300}
],results=[];
for(const v of views){const cv=canvas(v.width,v.height),scene=new g.HonroScene(cv);Object.assign(scene,{x:v.x,y:v.y,scale:v.scale,manual:true,time:2,editorView:false,skillPreview:false});g.HonroBounds.constrain(scene,b);const actualCamera={x:scene.x,y:scene.y,scale:scene.scale};const before=JSON.stringify(b);scene.render(engine,0,'',.6,false,0);await new Promise(r=>setTimeout(r,50));scene.render(engine,0,'',.6,false,0);assert.equal(JSON.stringify(b),before);assert.equal(hash({terrain:b.terrain,units:b.units}),physics);await writeFile(`${out}/${v.name}.png`,cv.toBuffer('image/png'));results.push({view:v,actualCamera,heroHeight:hero.h,physicsSha256:physics,renderPure:true});}
await writeFile(`${out}/report.json`,JSON.stringify({scope:'Actual opt-in build project, compiler, Engine and production renderer. No manually injected art. Not browser or combat acceptance.',assetId:inst[0].asset.id,results},null,2));console.log(JSON.stringify({out,views:results.length,physics}));
