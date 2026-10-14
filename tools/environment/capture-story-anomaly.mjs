/** Same-camera Native Canvas evidence. Staged actor poses, not normal play.
 * 'before' disables only this revision's art in the same current renderer. */
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runtimeParts} from '../../shared/build.mjs';
const arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];},require=createRequire(import.meta.url),native=require('@napi-rs/canvas'),out=arg('--out','_local/reports/story-anomaly-native');
native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
function canvas(w=300,h=150){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
const Image=class extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
let seed=934;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
const g=vm.createContext({console,performance,structuredClone,Math:math,document:{createElement:()=>canvas()},Image,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-anomaly-native-evidence'},setTimeout,clearTimeout});g.window=g;
const sources=await runtimeParts({vector:true,render:true});for(const s of sources)vm.runInContext(s,g);
if(!g.HonroStoryAnomalyArt){const art=await readFile('shared/runtime/story-anomaly-art.js','utf8');sources.push(art);vm.runInContext(art,g);}
const raw=await readFile('shared/data/campaign.json','utf8'),project=JSON.parse(raw);g.HONRO_PROJECT=project;
const hash=v=>createHash('sha256').update(v).digest('hex'),report={schema:'honro-story-anomaly-native/v1',sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtimeSha256:hash(sources.join('\n')),projectSha256:hash(raw),method:'Production shared HonroMaps/Engine/HonroScene; identical camera and staged safe actor poses. Before disables only new art revision. No browser/input/performance/completion claim.',results:[]};
await mkdir(out,{recursive:true});
const views=[
 {stage:18,name:'bell-pocket',w:1440,h:1000,x:5100,y:5560,scale:.65,hero:{x:4300,y:5770,only:'archer'}},
 {stage:25,name:'late-waterway',w:1440,h:1000,x:2810,y:3420,scale:.65,hero:{x:2480,y:3600}},
 {stage:25,name:'drip-arrival',w:1440,h:1000,x:1820,y:3390,scale:.65,hero:{x:1650,y:3600}},
 {stage:25,name:'late-mobile',w:400,h:800,x:1820,y:3390,scale:.42,hero:{x:1650,y:3600}},
 {stage:27,name:'lower-mismatch',w:1440,h:1000,x:5810,y:4360,scale:.65,hero:{x:5680,y:4850}},
 {stage:27,name:'deep-transition',w:1440,h:1000,x:3860,y:2880,scale:.65,hero:{x:4020,y:3050}},
 {stage:27,name:'deep-mobile',w:400,h:800,x:3880,y:2950,scale:.42,hero:{x:4020,y:3050}}
];
for(const v of views.filter(v=>!arg('--views',null)||arg('--views','').split(',').includes(v.name)))for(const mode of ['before','after']){
 const s=project.stages[v.stage-1],b=g.HonroMaps.createBattle(s,project,undefined,{origin:'campaign'}),e=new g.HONRO_CORE.Engine(b,()=>{},true);
 const party=b.units.filter(u=>u.side===0&&(!v.hero.only||u.cls===v.hero.only));for(let i=0;i<party.length;i++)Object.assign(party[i],{x:v.hero.x-i*135,y:v.hero.y,vx:0,vy:0,airborne:false,jumping:false});
 if(mode==='before')delete b.honroStoryAnomalyRevision;
 const cv=canvas(v.w,v.h),scene=new g.HonroScene(cv);Object.assign(scene,{x:v.x,y:v.y,scale:v.scale,manual:true,skillPreview:true,time:1.8});
 const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,25));scene.render(e,0,'',.6,false,0);if(JSON.stringify(b)!==before)throw Error('Renderer mutated battle');
 const file=`stage-${v.stage}-${v.name}-${mode}.png`;await writeFile(out+'/'+file,cv.toBuffer('image/png'));
 report.results.push({stageId:v.stage,name:v.name,mode,file,view:v,actualCamera:{x:scene.x,y:scene.y,scale:scene.scale},renderPure:true,sha256:hash(await readFile(out+'/'+file))});console.log(file);
 cv.width=1;cv.height=1;scene._domainTiles?.tiles.clear();scene._staticWorldCache=null;scene._backgroundCache=null;global.gc?.();
}
await writeFile(out+'/manifest.json',JSON.stringify(report,null,2)+'\n');
