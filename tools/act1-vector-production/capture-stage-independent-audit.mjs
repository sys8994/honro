/** Offline production-scene A/B. No terrain, unit, camera or game data writes. */
import vm from 'node:vm';import assert from'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import{createCanvas,Image as NativeImage,Path2D,DOMMatrix,GlobalFonts}from'@napi-rs/canvas';import{runtimeParts,root}from'../../shared/build.mjs';
const id=Number(process.env.HONRO_AUDIT_STAGE||3),tag=String(id).padStart(2,'0'),out=`${root}/_local/reports/stage${id}-independent-${process.env.HONRO_AUDIT_LABEL||'baseline'}`;await mkdir(out,{recursive:true});GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
function canvas(w=300,h=150){const c=createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const document={createElement(tag){if(tag!=='canvas')throw Error(tag);return canvas();}};const g=vm.createContext({console,performance,structuredClone,Math:math,document,Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-vector-preview'},setTimeout,clearTimeout});g.window=g;for(const s of await runtimeParts({vector:true,render:true,productionStory:true}))vm.runInContext(s,g);
const project=g.HONRO_PROJECT,stage=project.stages.find(s=>s.metadata?.stageId===id),compiled=g.HonroMaps.compile(stage,project),b=g.HonroMaps.createBattle(stage,project);g.HonroStageRules.sanitizeStageBattle(b);const engine=new g.HONRO_CORE.Engine(b,()=>{},true),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),physics=hash({terrain:b.terrain,units:b.units}),hero=b.units.find(u=>u.side===0&&!u.dead);assert(hero);
const source=stage,sources=stage.terrains;
const {width:sw,height:sh}=source;
const views=[...[[0,0],[sw,0],[0,sh],[sw,sh],[sw/2,sh/2]].map(([x,y],i)=>({name:`edge-${i}`,width:1331,height:763,scale:g.HonroBounds.zoomLimits(1331).min,x,y})),...sources.flatMap(t=>{
 const ps=(t.control||t.points).filter(p=>p.x>=0&&p.x<=sw&&p.y>=-300&&p.y<=sh);
 assert(ps.length,`No play-area points: ${t.id}`);
 const x=(Math.min(...ps.map(p=>p.x))+Math.max(...ps.map(p=>p.x)))/2;
 const nearest=Math.min(...ps.map(p=>Math.abs(p.x-x)));
 const y=Math.min(...ps.filter(p=>Math.abs(p.x-x)<=nearest+50).map(p=>p.y))+30;
 return [[1331,763,.94,'desktop'],[390,696,.82,'portrait'],[844,390,.82,'landscape']].map(([width,height,scale,mode])=>({name:`${t.id}-${mode}`,width,height,scale,x,y,terrainId:t.id,breakable:t.breakable}));
})],results=[];
for(const v of views){const cv=canvas(v.width,v.height),scene=new g.HonroScene(cv);Object.assign(scene,{x:v.x,y:v.y,scale:v.scale,manual:true,time:2,editorView:false,skillPreview:false});g.HonroBounds.constrain(scene,b);const actualCamera={x:scene.x,y:scene.y,scale:scene.scale};const before=JSON.stringify(b);scene.render(engine,0,'',.6,false,0);await new Promise(r=>setTimeout(r,200));scene.render(engine,0,'',.6,false,0);assert.equal(JSON.stringify(b),before);assert.equal(hash({terrain:b.terrain,units:b.units}),physics);await writeFile(`${out}/${v.name}.png`,cv.toBuffer('image/png'));results.push({view:v,actualCamera,heroHeight:hero.h,physicsSha256:physics,renderPure:true});}
await writeFile(`${out}/report.json`,JSON.stringify({scope:'Actual opt-in build project, compiler, Engine and production renderer. No manually injected art. Not browser or combat acceptance.',stage:id,sourceWidth:sw,sourceHeight:sh,terrainIds:sources.map(t=>t.id),assetIds:b.honroLandmarks.map(l=>l.asset?.id),results},null,2));console.log(JSON.stringify({out,views:results.length,physics}));
