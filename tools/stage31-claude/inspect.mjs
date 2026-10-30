/** Stage 31 Claude art: compose the v6 geometry with the direct-vector layers and
 * render it with the production compiler + renderer on Native Canvas.
 * Evidence of the real Scene only; it never marks art or gameplay approved. */
import vm from 'node:vm';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createCanvas,Image as NativeImage,Path2D,DOMMatrix,GlobalFonts} from '@napi-rs/canvas';
import {runtimeParts} from '../../shared/build.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const arg=k=>process.argv.find(a=>a.startsWith(`--${k}=`))?.slice(k.length+3);
const tag=arg('tag')||'v1',geo=arg('stage')||'_local/reports/act4-pilot/stage31/v6/stage.json',assets=arg('assets')||'_local/reports/stage31-claude/assets';
const out=`_local/reports/stage31-claude/${tag}`;await mkdir(out,{recursive:true});
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
const layer={struct:'structure',body:'body',surface:'body',rear:'rear',front:'front',fore:'front'};
const passOf={background:'back',structure:'structural-back',body:'mid',rear:'prop',front:'front'};
const library=[];
for(const k of ['struct','body','surface','rear','fore'])library.push(JSON.parse(await readFile(`${assets}/${k}.asset.json`,'utf8')));
const solid=stage.terrains.filter(t=>!t.oneWay).map(t=>t.id),decks=stage.terrains.filter(t=>t.oneWay&&t.id!=='pilot31-boarding-dock').map(t=>t.id);
const elements=library.map(a=>{const k=a.id.split(':')[1],n=layer[k];const e={id:`s31c-${k}`,assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',nativeArtLayer:n,layer:passOf[n]};
 if(k==='body')e.nativeTerrainIds=solid;if(k==='surface')e.nativeTerrainIds=decks;return e;});
stage.elements=[...elements,...stage.elements];
stage.design.nativeArt={version:1,coveredTerrainIds:[...solid,...decks],preservePalette:true,author:'claude-direct-vector',status:'candidate; not accepted'};
const P=g.HONRO_PROJECT;P.library=[...P.library.filter(a=>!a.id.startsWith('s31c:')),...library];
P.stages=P.stages.map(s=>s.metadata?.stageId===31?stage:s);
if(g.HonroAct4PilotArt?.validateStage)g.HonroAct4PilotArt.validateStage(stage,P.library);
const issues=g.HonroMaps.validate?g.HonroMaps.validate({...P,stages:[stage]}):[];
await writeFile(`${out}/stage31-composed.json`,JSON.stringify(stage));

// ---- render views on the production Scene
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];g.HonroEquipment.fresh(profile);
const b=g.HonroMaps.createBattle(stage,P,profile),e=new g.HONRO_CORE.Engine(b,()=>{},true);g.HonroApp={engine:e,profile};
const views=JSON.parse(arg('views')||'null')||[
 {name:'whole',x:3500,y:3000,scale:1600/7400,w:1600,h:900},
 {name:'west-play',x:1500,y:3600,scale:.6,w:1440,h:900},
 {name:'scaffold-play',x:3000,y:3300,scale:.55,w:1440,h:900},
 {name:'ridge-lookout-play',x:4700,y:2250,scale:.55,w:1440,h:900},
 {name:'east-boarding-play',x:6000,y:3300,scale:.55,w:1440,h:900},
 {name:'mobile-min',x:3500,y:3000,scale:g.HonroBounds.zoomLimits(390).min,w:390,h:844}];
const records=[];
for(const v of views){const cv=canvas(v.w,v.h),s=new g.HonroScene(cv);Object.assign(s,{x:v.x,y:v.y,scale:v.scale,manual:true,time:2,editorView:false});
 for(let i=0;i<3;i++){s.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,120));}
 await writeFile(`${out}/${v.name}.png`,cv.toBuffer('image/png'));
 const c=cv.getContext('2d');c.save();c.translate(v.w/2-v.x*v.scale,v.h/2-v.y*v.scale);c.scale(v.scale,v.scale);c.lineWidth=2/v.scale;
 for(const t of b.terrain){const ps=g.HONRO_CORE.poly(t);c.strokeStyle=t.oneWay?'#59d3ff':'#ffde59';c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();}
 c.restore();await writeFile(`${out}/${v.name}-collision.png`,cv.toBuffer('image/png'));records.push({view:v,file:`${v.name}.png`});console.log('rendered',v.name);
}
await writeFile(`${out}/manifest.json`,JSON.stringify({scope:'Production compiler+renderer on Native Canvas with initial party only. Not browser GUI, not combat, not approval.',validateIssues:issues,records},null,2));
console.log(JSON.stringify({issues:(issues||[]).slice(0,10)}));
