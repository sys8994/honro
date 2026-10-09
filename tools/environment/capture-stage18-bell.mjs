/** Matched production-renderer views of Stage 18's actual authored roster.
 * Native Canvas evidence only; not browser input or a normal playthrough. */
import vm from 'node:vm';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts,root} from '../../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),tag=process.argv[2]||'after',out=path.resolve(root,'_local/reports/stage18-bell',tag);
await mkdir(out,{recursive:true});native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
const canvas=(w=300,h=150)=>{const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;};
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
const g=vm.createContext({console,performance,structuredClone,Math:math,document:{createElement:()=>canvas()},Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-encounter-evidence'},setTimeout,clearTimeout});g.window=g;
for(const part of await runtimeParts({vector:true,render:true}))vm.runInContext(part,g);
const projectFile=process.argv.find(v=>v.startsWith('--project='))?.slice(10);if(projectFile)g.HONRO_PROJECT=JSON.parse(await readFile(projectFile,'utf8'));
const st=g.HONRO_PROJECT.stages[17],views=[
 {id:'overview',x:6800,y:4830,scale:.105,width:1600,height:1100,overview:true},
 {id:'suppression-court',x:3250,y:5320,scale:.48,width:1600,height:1000},
 {id:'western-shot',x:5340,y:3840,scale:.44,width:1440,height:960},
 {id:'bell-undercroft',x:7100,y:6670,scale:.34,width:1600,height:1000},
 {id:'east-resonance',x:9070,y:3850,scale:.46,width:1440,height:960},
 {id:'keeper-ledge',x:11130,y:5980,scale:.5,width:1440,height:960},
 {id:'portrait-bell',x:7230,y:5360,scale:.27,width:720,height:1080},
 {id:'portrait-combat',x:3470,y:5320,scale:.55,width:720,height:1080},
 {id:'bell-mass',x:7220,y:4840,scale:.25,width:1600,height:1200}

];
for(let n=0;n<200&&(!g.HonroAct2SpatialArt.ready()||!g.HonroAct1Background.ready(18));n++)await new Promise(r=>setTimeout(r,10));
const hash=v=>createHash('sha256').update(v).digest('hex'),rows=[];
for(const view of views.filter(v=>!process.argv.some(a=>a.startsWith('--view='))||v.id===process.argv.find(a=>a.startsWith('--view=')).slice(7))){const b=g.HonroMaps.createBattle(st,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);const e=new g.HONRO_CORE.Engine(b,()=>{},true),cv=canvas(view.width,view.height),scene=new g.HonroScene(cv);
 Object.assign(scene,{x:view.x,y:view.y,scale:view.scale,manual:true,time:2,editorView:!!view.overview,skillPreview:!!view.overview});scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,20));scene.render(e,0,'',.6,false,0);
 const bytes=cv.toBuffer('image/png'),file=path.join(out,view.id+'.png');await writeFile(file,bytes);rows.push({file,view,pngSha256:hash(bytes),enemies:b.units.filter(u=>u.side===1).length,places:st.design.bell?.encounters,scope:'Production HonroMaps + Engine + HonroScene on Native Canvas; authored initial roster, no browser/HUD or gameplay claim.'});console.log(tag,view.id);
}
await writeFile(path.join(out,(process.argv.find(a=>a.startsWith('--view='))?.slice(7)||'all')+'-manifest.json'),JSON.stringify({tag,projectSha256:hash(JSON.stringify(g.HONRO_PROJECT)),sourceProject:projectFile||'shared/data/campaign.json',rows},null,2)+'\n');
