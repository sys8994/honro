/** Stage 31 Claude art: compose the v6 geometry with the direct-vector layers and
 * render it with the production compiler + renderer on Native Canvas.
 * Evidence of the real Scene only; it never marks art or gameplay approved. */
import vm from 'node:vm';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createCanvas,Image as NativeImage,Path2D,DOMMatrix,GlobalFonts} from '@napi-rs/canvas';
import {runtimeParts} from '../../shared/build.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const arg=k=>process.argv.find(a=>a.startsWith(`--${k}=`))?.slice(k.length+3);
const N=Number(arg('n')||31),tag=arg('tag')||'v1',geo=arg('stage')||'_local/reports/act4-pilot/stage31/v6/stage.json',assets=arg('assets')||'_local/reports/stage31-claude/modules';
const out=N===31?`_local/reports/stage31-claude/${tag}`:`_local/reports/act4-claude/stage${N}/${tag}`;await mkdir(out,{recursive:true});
try{GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');}catch{}
function canvas(w=300,h=150){const c=createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,document:{createElement:()=>canvas(),addEventListener(){},removeEventListener(){},querySelector:()=>null,getElementById:()=>null,body:null},Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-stage31-claude-inspector'},setTimeout,clearTimeout});g.window=g;
for(const p of await runtimeParts({vector:true,render:true}))vm.runInContext(p,g);
// Act4 runtime hooks are app-bundle only; load them in the same order as shared/build.mjs.
g.HONRO_ACT4_RELEASE=true;g.HONRO_APP_READY=new Promise(()=>{});g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','act4-campaign','act4-pilot-art'])vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);

// ---- compose: geometry stage + art layers (no collision/actor/event change)
const stage=JSON.parse(await readFile(geo,'utf8'));
// Module assets: BODY/SURFACE own exactly one collider each (mid pass); STRUCT
// behind (structural-back), REAR reeds (prop), FORE after actors (front).
const index=JSON.parse(await readFile(`${assets}/index.json`,'utf8')),passOf={structure:'structural-back',body:'mid',rear:'prop',front:'front'},nativeOf={STRUCT:'structure',BODY:'body',SURFACE:'body',REAR:'rear',FORE:'front'};
const library=[];for(const r of index)library.push(JSON.parse(await readFile(r.asset,'utf8')));
const elements=index.filter(r=>!r.libraryOnly).map(r=>{const n=nativeOf[r.layer],e={id:`s${N}c-`+r.name,assetId:r.assetId,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',nativeArtLayer:n,layer:passOf[n]};if(r.terrain){if(!stage.terrains.some(t=>t.id===r.terrain))throw Error('Unknown collider '+r.terrain);e.nativeTerrainIds=[r.terrain];}return e;});
const owned=elements.flatMap(e=>e.nativeTerrainIds||[]);
stage.elements=[...elements,...stage.elements];
stage.design.nativeArt={version:1,coveredTerrainIds:owned,...(arg('far')?{far:arg('far')}:{}),preservePalette:true,author:'claude-direct-vector',status:'candidate; not accepted'};
const P=g.HONRO_PROJECT;P.library=[...P.library.filter(a=>!a.id.startsWith(`s${N}c:`)),...library];
P.stages=P.stages.map(s=>s.metadata?.stageId===N?stage:s);
if(g.HonroAct4PilotArt?.validateStage)g.HonroAct4PilotArt.validateStage(stage,P.library);
const issues=g.HonroMaps.validate?g.HonroMaps.validate({...P,stages:[stage]}):[];
await writeFile(`${out}/stage${N}-composed.json`,JSON.stringify(stage));

// ---- render views on the production Scene
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];g.HonroEquipment.fresh(profile);
const b=g.HonroMaps.createBattle(stage,P,profile),e=new g.HONRO_CORE.Engine(b,()=>{},true);g.HonroApp={engine:e,profile,modal:{classList:{contains:()=>true}}};
const views=JSON.parse(arg('views')||'null')||[
 {name:'whole',x:3500,y:3000,scale:1600/7400,w:1600,h:900},
 {name:'west-play',x:1500,y:3600,scale:.6,w:1440,h:900},
 {name:'scaffold-play',x:3000,y:3300,scale:.55,w:1440,h:900},
 {name:'ridge-lookout-play',x:4700,y:2250,scale:.55,w:1440,h:900},
 {name:'east-boarding-play',x:6000,y:3300,scale:.55,w:1440,h:900},
 {name:'mobile-min',x:3500,y:3000,scale:g.HonroBounds.zoomLimits(390).min,w:390,h:844}];
if(process.argv.includes('--perf')){
 const V=g.HonroVectorArt,od=V.draw;let calls={},ms={};V.draw=function(c,a,l){const t=performance.now();const r=od.apply(this,arguments);calls[a.id]=(calls[a.id]||0)+1;ms[a.id]=(ms[a.id]||0)+performance.now()-t;return r;};
 globalThis.__dump=()=>{console.log(JSON.stringify(calls),JSON.stringify(Object.fromEntries(Object.entries(ms).map(([k,v])=>[k,+v.toFixed(0)]))));calls={};ms={};};
 for(const strip of [false,'front','rear','surface','struct','body']){
  if(strip)b.honroLandmarks=(b.honroLandmarks||[]).filter(l=>l.id!=='s31c-'+(strip==='front'?'fore':strip));
  const cv=canvas(1800,720),s=new g.HonroScene(cv);Object.assign(s,{x:1500,y:3600,scale:.55,manual:true,time:2});
  for(let i=0;i<3;i++)s.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,200));
  __dump();const t0=performance.now();for(let i=0;i<20;i++){s.x+=(process.argv.includes("--static")?0:3);s.render(e,0,'',.6,false,0);}__dump();console.log('minus',strip,'ms/frame',((performance.now()-t0)/20).toFixed(1),JSON.stringify(s._cacheStats));
 }process.exit(0);}
const records=[];
for(const v of views){const cv=canvas(v.w,v.h),s=new g.HonroScene(cv);Object.assign(s,{x:v.x,y:v.y,scale:v.scale,manual:true,time:2,editorView:false});g.HonroApp.scene=s;
 for(let i=0;i<3;i++){s.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,120));}
 await writeFile(`${out}/${v.name}.png`,cv.toBuffer('image/png'));
 const c=cv.getContext('2d');c.save();c.translate(v.w/2-v.x*v.scale,v.h/2-v.y*v.scale);c.scale(v.scale,v.scale);c.lineWidth=2/v.scale;
 for(const t of b.terrain){const ps=g.HONRO_CORE.poly(t);c.strokeStyle=t.oneWay?'#59d3ff':'#ffde59';c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();}
 c.restore();await writeFile(`${out}/${v.name}-collision.png`,cv.toBuffer('image/png'));records.push({view:v,file:`${v.name}.png`});console.log('rendered',v.name);
}
await writeFile(`${out}/manifest.json`,JSON.stringify({scope:'Production compiler+renderer on Native Canvas with initial party only. Not browser GUI, not combat, not approval.',validateIssues:issues,records},null,2));
console.log(JSON.stringify({issues:(issues||[]).slice(0,10)}));
