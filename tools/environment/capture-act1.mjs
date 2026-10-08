/** Offline visual evidence using the production compiler, Engine and HonroScene.
 * This is deliberately not a browser, HUD/input check or normal combat run. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {runtimeParts,root} from '../../shared/build.mjs';
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
// Evidence-only platform font registration; production CSS/fonts are unchanged.
native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
const tag=process.argv[2]||'after',out=path.resolve(root,'_local/reports/act1-spatial',tag);
await mkdir(out,{recursive:true});
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
function canvas(w=300,h=150){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
const NativeImage=native.Image;
const Image=class extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
const document={createElement(tag){if(tag!=='canvas')throw Error('Unexpected DOM '+tag);return canvas();}};
const g=vm.createContext({console,performance,structuredClone,Math:math,document,Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-canvas-evidence'},setTimeout,clearTimeout});g.window=g;
const parts=await runtimeParts({vector:true,render:true});for(const source of parts)vm.runInContext(source,g);
const sourceProject=process.argv.find(v=>v.startsWith('--project='))?.slice(10);
if(sourceProject)g.HONRO_PROJECT=JSON.parse(await readFile(sourceProject,'utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
await writeFile(path.join(out,'campaign.json'),JSON.stringify(g.HONRO_PROJECT,null,2)+'\n');
const results=[],review=process.argv.includes('--review');const ids=process.argv.slice(3).filter(v=>/^\d+$/.test(v)).map(Number);if(!ids.length)ids.push(...Array.from({length:10},(_,i)=>1+i));
for(const id of ids){const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);
 for(let attempt=0;(id<=10||id===11||id===12||id===20)&&g.HonroAct1Background&&!g.HonroAct1Background.ready(id)&&attempt<200;attempt++)await new Promise(r=>setTimeout(r,10));
 if((id<=10||id===11||id===12||id===20)&&g.HonroAct1Background&&!g.HonroAct1Background.ready(id))throw Error('Background decode incomplete for '+id);
 for(let attempt=0;g.HonroAct2SpatialArt&&!g.HonroAct2SpatialArt.ready()&&attempt<200;attempt++)await new Promise(r=>setTimeout(r,10));
 if(g.HonroAct2SpatialArt&&!g.HonroAct2SpatialArt.ready())throw Error('Act 2 image decode incomplete');
 const spawn=st.anchors.start||st.anchors.archerPerch||st.anchors.spawn,landmark=st.elements.find(x=>/bell$/.test(x.assetId))||st.markers.find(x=>/marker-(sluice|hall|hoist|family-mid|gate|sign|knot-east|escort-mid)$/.test(x.id));
 const route=st.routes||[],middle=route[Math.floor(route.length/2)]||spawn;
 const focus=st.anchors[({1:'cart',2:'procession',3:'cargo',4:'gate',5:'shotGap',6:'rescue',7:'resident2',8:'courtyard',9:'well',10:'ritual'})[id]]||landmark||middle;const views=[
  {name:'overview',x:st.width/2,y:st.height/2,scale:Math.min(1400/st.width,860/st.height),width:1440,height:960,overview:true},
  {name:'entry',x:spawn.x+620,y:spawn.y-280,scale:.68,width:1440,height:960},
  {name:'place',x:focus.x,y:focus.y-430,scale:.46,width:1440,height:960},
  {name:'portrait',x:spawn.x+340,y:spawn.y-280,scale:.52,width:720,height:1080}
 ];
 if(process.argv.includes('--choices')&&st.design?.forestChoice){const q=st.design.forestChoice.to;views.push({name:'choice-default',x:q.x,y:q.y-140,scale:.59,width:1440,height:960},{name:'choice-portrait',x:q.x,y:q.y-140,scale:.46,width:720,height:1080});}
 const focusArg=process.argv.find(v=>v.startsWith('--focus='));if(focusArg){const [x,y]=focusArg.slice(8).split(',').map(Number);if(Number.isFinite(x)&&Number.isFinite(y))views.push({name:'focus-default',x,y,scale:.59,width:1440,height:960},{name:'focus-portrait',x,y,scale:.46,width:720,height:1080});}
 if(process.argv.includes('--topology'))views.push(...(st.design?.topology?.views||[]),...(st.design?.cavernLayers?.views||[]));
 if(review){
  const reviewFocus={x:focus.x,y:focus.y-430};
  for(const [name,dx]of [['review-left',-600],['review-center',0],['review-right',600]])views.push({name,x:reviewFocus.x+dx,y:reviewFocus.y,scale:.46,width:1440,height:960});
  views.push({name:'review-portrait',...reviewFocus,scale:.46,width:720,height:1080});
  if(id===18||id===19){const bell=st.elements.find(e=>e.assetId==='act2:bell'),asset=g.HONRO_PROJECT.library.find(a=>a.id==='act2:bell'),bounds=asset.bounds||asset.reference.bounds;views.push({name:'bell-establish',x:bell.x,y:bell.y+(bounds.y+bounds.h/2)*bell.scale,scale:.32,width:1440,height:960});}
 }
 for(const view of views){const b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);const e=new g.HONRO_CORE.Engine(b,()=>{},true),cv=canvas(view.width,view.height),scene=new g.HonroScene(cv);
  Object.assign(scene,{x:view.x,y:view.y,scale:view.scale,manual:true,time:2,editorView:!!view.overview,skillPreview:!!view.overview});
  const battleBefore=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(resolve=>setTimeout(resolve,20));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),battleBefore,`Stage ${id}/${view.name} renderer changed battle state`);
  const file=`stage-${id}-${view.name}.png`,bytes=cv.toBuffer('image/png');await writeFile(path.join(out,file),bytes);
  results.push({stageId:id,file,sha256:sha(bytes),view,cache:scene.renderCacheStats(),renderPure:true,source:'Production shared HonroMaps + Engine + HonroScene on native Canvas',limits:['No browser DOM/HUD/input or performance validation','No normal combat completion','Overview uses editor inspection zoom']});
  console.log(tag,id,view.name);
 }
}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({tag,bundleSha256:sha(parts.join('\n')),projectSha256:sha(JSON.stringify(g.HONRO_PROJECT)),baselineProjectOverride:!!sourceProject,results},null,2)+'\n');
