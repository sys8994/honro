/** Native visual inspection. Uses the production compiler and renderer.
 * It never marks art/gameplay approved and never modifies campaign data. */
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createCanvas,Image as NativeImage,Path2D,DOMMatrix,GlobalFonts} from '@napi-rs/canvas';
import {runtimeParts} from '../../shared/build.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const out='_local/reports/density-reference-review/final-v5';
await mkdir(out,{recursive:true});
GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
function canvas(w=300,h=150){const c=createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,document:{createElement:()=>canvas()},Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-stage-authoring-inspector'},setTimeout,clearTimeout});g.window=g;
const runtime=await runtimeParts({vector:true,render:true});
const runtimeSha256=createHash('sha256').update(runtime.join('\n')).digest('hex');
for(const p of runtime)vm.runInContext(p,g);
vm.runInContext(await readFile('shared/runtime/act4-art.js','utf8'),g);
const supplied='_local/reports/density-rollout/final-v5/project-deduplicated.json';if(supplied)g.HONRO_PROJECT=JSON.parse(await readFile(supplied,'utf8'));
const declaredReferences=JSON.parse(await readFile('tools/stage31-production/blueprint.json','utf8')).references;
assert.deepEqual(declaredReferences,['stage-3','stage-6','stage-30']);
const records=[];
const sourceBytes=await readFile(supplied);
const sourceHash=createHash("sha256").update(sourceBytes).digest("hex");
const implementation=[];
for(const n of [3,6,30,31]){
 const st=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n);
 const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];g.HonroEquipment.fresh(profile);
 const b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT,profile);
 if(n===31){g.HonroAct4Content.prepare(b,profile);g.HonroAct4ReviewArt.palettes[31]=st.design.act4.palette;}
 const geometryBefore=JSON.stringify(st.terrains);
 const e=new g.HONRO_CORE.Engine(b,()=>{},true);
 const actorPositions=()=>JSON.stringify(b.units.map(u=>({id:u.id,x:u.x,y:u.y})));const actorsBefore=actorPositions();
 const views=[{name:'overview',x:st.width/2,y:n===30?5300:n===6?2200:1900,scale:1500/st.width,w:1600,h:850},
 {name:'contact',x:n===30?2900:n===6?3150:2400,y:n===30?5500:n===6?2350:2100,scale:.53,w:1400,h:900}];
 if(n===30)views.push({name:'quay',x:5600,y:5300,scale:.53,w:1400,h:900});
 for(const v of views){const cv=canvas(v.w,v.h),s=new g.HonroScene(cv);Object.assign(s,{x:v.x,y:v.y,scale:v.scale,manual:true,time:2,editorView:true,skillPreview:true});
  s.render(e,0,'',.6,false,0);for(let i=0;i<60&&!g.HonroAuthoredFarArt.ready(n,b.honroPreviewFar);i++)await new Promise(r=>setTimeout(r,50));s.render(e,0,'',.6,false,0);
  assert.equal(s.x,v.x);assert.equal(s.y,v.y);assert.equal(s.scale,v.scale);assert.equal(JSON.stringify(st.terrains),geometryBefore);assert.equal(actorPositions(),actorsBefore);
  const file=`${n}-${v.name}.png`;await writeFile(`${out}/${file}`,cv.toBuffer('image/png'));
  const c=cv.getContext('2d');c.save();c.translate(v.w/2-v.x*v.scale,v.h/2-v.y*v.scale);c.scale(v.scale,v.scale);c.lineWidth=2/v.scale;
  c.strokeStyle='#ffde59';for(const t of b.terrain){const ps=g.HONRO_CORE.poly(t);c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.stroke();}
  c.font=`${12/v.scale}px sans-serif`;for(const u of b.units){c.fillStyle=u.side===1?'#ff6978':'#70e7c4';c.beginPath();c.arc(u.x,u.y-32,5/v.scale,0,Math.PI*2);c.fill();c.fillText(u.id,u.x+8/v.scale,u.y-36);}
  c.restore();await writeFile(`${out}/${n}-${v.name}-collision.png`,cv.toBuffer('image/png'));records.push({stage:n,view:v,actualCamera:{x:s.x,y:s.y,scale:s.scale},file,sha256:createHash('sha256').update(await readFile(`${out}/${file}`)).digest('hex'),scope:'Actual production Native Canvas, initial actors. Not browser play or quality approval.'});console.log(n,v.name);
 }
 implementation.push({stage:n,stageSha256:createHash('sha256').update(JSON.stringify(st)).digest('hex'),name:st.name,terrains:st.terrains.map(t=>({id:t.id,material:t.baseMaterial,oneWay:t.oneWay,breakable:t.breakable,surface:t.properties?.surfaceKind,points:t.points.length,xMin:Math.min(...t.points.map(p=>p.x)),xMax:Math.max(...t.points.map(p=>p.x)),yMin:Math.min(...t.points.map(p=>p.y)),yMax:Math.max(...t.points.map(p=>p.y))})),elements:st.elements.map(e=>({id:e.id,assetId:e.assetId,layer:e.layer,depthLayer:e.depthLayer,support:e.productionSupport})),actors:b.units.map(u=>({id:u.id,x:u.x,y:u.y,side:u.side})),materials:st.materials.map(m=>({id:m.id,kind:m.kind,support:m.terrainId||m.support}))});
}
assert.equal(createHash('sha256').update(await readFile(supplied)).digest('hex'),sourceHash);
await writeFile(`${out}/implementation.json`,JSON.stringify({source:supplied,sourceSha256:sourceHash,runtimeSha256,declaredReferences,geometryAndActorsUnchanged:true,stages:implementation},null,2));
await writeFile(`${out}/manifest.json`,JSON.stringify(records,null,2));
await writeFile(`${out}/index.html`,`<!doctype html><meta charset="utf-8"><title>기존 지형과 31장 대조</title><style>body{background:#122126;color:#eee;font:16px sans-serif}img{max-width:100%}section{margin:30px auto;max-width:1600px}summary{cursor:pointer}</style><h1>동일 공통 렌더러: 기존 3·6·30장 및 최종31장 비교용 캡처</h1><p>노란 선은 실제 충돌면입니다. 이 화면은 자동 합격 판정이 아닙니다.</p>${records.map(r=>`<section><h2>${r.stage} · ${r.view.name}</h2><img src="${r.file}"><details><summary>충돌면과 적 위치</summary><img src="${r.stage}-${r.view.name}-collision.png"></details></section>`).join('')}`);
