/** Parent-authored visual inspection. Uses the production compiler and renderer.
 * It never marks art/gameplay approved and never modifies campaign data. */
import vm from 'node:vm';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createCanvas,Image as NativeImage,Path2D,DOMMatrix,GlobalFonts} from '@napi-rs/canvas';
import {runtimeParts} from '../../shared/build.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const tag=process.argv[2]||'baseline',out=`_local/reports/stage39-production/${tag}`;
await mkdir(out,{recursive:true});
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
function canvas(w=300,h=150){const c=createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,document:{createElement:()=>canvas()},Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-stage-authoring-inspector'},setTimeout,clearTimeout});g.window=g;
for(const p of await runtimeParts({vector:true,render:true}))vm.runInContext(p,g);
for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
const supplied=process.argv[3];if(supplied)g.HONRO_PROJECT=JSON.parse(await readFile(supplied,'utf8'));
const records=[];
for(const n of [39]){
 const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n);
 const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];g.HonroEquipment.fresh(profile);
 const b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,profile);
 const e=new g.HONRO_CORE.Engine(b,()=>{},true);
 const defaults=[{name:'whole',x:4500,y:2300,scale:.16,w:1600,h:1000},
 {name:'west-bank',x:1500,y:1870,scale:.53,w:1400,h:900},
 {name:'wreck',x:3500,y:2250,scale:.8,w:1400,h:900},
 {name:'rescue-work',x:5700,y:1900,scale:.75,w:1400,h:900},
 {name:'high-ground-mobile',x:6900,y:1700,scale:.53,w:720,h:1100},
 {name:'body-max',x:3900,y:2650,scale:1.1,w:1400,h:900},
 {name:'left-edge-wide',x:200,y:2400,scale:720/6800,w:720,h:1100},
 {name:'right-edge-wide',x:8750,y:2200,scale:720/6800,w:720,h:1100}];
 const custom=g.HONRO_PROJECT.production?.cards?.[st.id]?.cameraViews;const views=custom?.length?custom.map(v=>({name:v.id,x:v.x,y:v.y,scale:v.scale,w:v.width,h:v.height})):defaults;
 for(const v of views){const cv=canvas(v.w,v.h),s=new g.HonroScene(cv);Object.assign(s,{x:v.x,y:v.y,scale:v.scale,manual:true,time:2,editorView:true,skillPreview:true});
  s.render(e,0,'',.6,false,0);for(let tries=0;tries<60&&!g.HonroAuthoredFarArt.ready(n,b.honroPreviewFar);tries++)await new Promise(r=>setTimeout(r,50));s.render(e,0,'',.6,false,0);
  const timings=[];for(let i=0;i<3;i++){const start=performance.now();s.render(e,0,'',.6,false,0);if(i>=1)timings.push(performance.now()-start);}timings.sort((a,b)=>a-b);const metrics={medianMs:timings[0],p95Ms:timings[1],scope:'two warm Native Canvas CPU samples (not a percentile), not browser or mobile hardware'};
  const file=`${n}-${v.name}.png`;await writeFile(`${out}/${file}`,cv.toBuffer('image/png'));
  const c=cv.getContext('2d');c.save();c.translate(v.w/2-v.x*v.scale,v.h/2-v.y*v.scale);c.scale(v.scale,v.scale);c.lineWidth=2/v.scale;
  c.strokeStyle='#ffde59';for(const t of b.terrain){const ps=g.HONRO_CORE.poly(t);c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();}
  c.font=`${12/v.scale}px sans-serif`;for(const u of b.units){c.fillStyle=u.side===1?'#ff6978':'#70e7c4';c.beginPath();c.arc(u.x,u.y-32,5/v.scale,0,Math.PI*2);c.fill();c.fillText(u.id,u.x+8/v.scale,u.y-36);}
  c.restore();await writeFile(`${out}/${n}-${v.name}-collision.png`,cv.toBuffer('image/png'));records.push({stage:n,view:v,file,metrics,scope:'Actual production Native Canvas, initial actors. Not browser play or quality approval.'});console.log(n,v.name);
 }
}
await writeFile(`${out}/manifest.json`,JSON.stringify(records,null,2));
await writeFile(`${out}/index.html`,`<!doctype html><meta charset="utf-8"><title>돌아오는 물 실제 렌더 검수</title><style>body{background:#122126;color:#eee;font:16px sans-serif}img{max-width:100%}section{margin:30px auto;max-width:1600px}summary{cursor:pointer}</style><h1>Stage39: 동일 공통 렌더러 검수</h1><p>노란 선은 실제 충돌면입니다. 이 화면은 자동 합격 판정이 아닙니다.</p>${records.map(r=>`<section><h2>${r.stage} · ${r.view.name}</h2><img src="${r.file}"><details><summary>충돌면과 적 위치</summary><img src="${r.stage}-${r.view.name}-collision.png"></details></section>`).join('')}`);
