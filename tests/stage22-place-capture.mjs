/** Native production Scene, same-camera authored art/greybox and historical
 * original22. No browser, normal combat, or automatic aesthetic approval. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
import {authorStage22Vertical} from '../tools/map-forge/apply-stage22-vertical.mjs';
import {applyStage22VerticalArt,STAGE22_VERTICAL_ART_PREFIX} from '../tools/environment/stage22-vertical-art.mjs';
import {v22Y} from '../tools/map-forge/stage22-vertical-geometry.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),checkOnly=process.argv.includes('--check-only'),out=process.env.HONRO_NATIVE_OUT||'review/stage22';
await mkdir(out,{recursive:true});const sha=v=>createHash('sha256').update(v).digest('hex'),plain=v=>JSON.parse(JSON.stringify(v));
function canvas(w=64,h=64){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-native-vertical22'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
// check-only does not build actors or render any stage; it is safe alongside
// parent-controlled heavy captures. The full path is the14 reference capturer.
const parts=await runtimeParts({vector:!checkOnly,render:!checkOnly});for(const s of parts)vm.runInContext(s,g);
if(!g.HonroStage22Vertical)vm.runInContext(await readFile('shared/runtime/stage22-vertical.js','utf8'),g);
if(process.env.HONRO_CAPTURE_BASE){const raw=JSON.parse(execFileSync('git',['show',process.env.HONRO_CAPTURE_BASE+':shared/data/campaign.json'],{encoding:'utf8',maxBuffer:64*1024*1024}));g.HONRO_PROJECT.stages[21]=raw.stages[21];g.HONRO_PROJECT.library=raw.library;}
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(22).entryLevel);
native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
 const views=[{id:'archive-roof',x:2670,y:2560,z:.70,w:1440,h:960},{id:'overview',x:2250,y:3400,z:.18,w:1200,h:1400,inspection:true},{id:'lower-seal-court',x:1270,y:5070,z:.57,w:1440,h:960},{id:'report-cross-cover',x:1740,y:3320,z:.55,w:1440,h:960},{id:'report-contact',x:1500,y:3630,z:1,w:1200,h:900},{id:'register-ascent',x:1580,y:2320,z:.55,w:1440,h:960},{id:'comparison-exit',x:2420,y:1140,z:.65,w:1440,h:960},{id:'portrait-report',x:1450,y:3470,z:.48,w:390,h:844},{id:'landscape-comparison',x:2420,y:1140,z:.42,w:844,h:390}];
 const requested=process.env.HONRO_NATIVE_VIEW,selected=requested?views.filter(v=>v.id===requested):views;assert(selected.length,'Known Native camera required');const labels=process.argv.includes('--after-only')?['after']:process.argv.includes('--with-original')?['original','before','after']:['before','after'],projects={before:g.HONRO_PROJECT,after:g.HONRO_PROJECT},rows=[];
 for(const label of labels)for(const view of selected){const project=projects[label];g.HONRO_PROJECT=project;const stage=project.stages[21],b=g.HonroMaps.createBattle(stage,project,profile),raw=JSON.stringify(b.units.map(u=>[u.id,u.x,u.y]));g.HonroStageRules.sanitizeStageBattle(b);if(label!=='original')assert.equal(JSON.stringify(b.units.map(u=>[u.id,u.x,u.y])),raw,'Authored poses exact');g.HonroEncounters.configure(b);g.HonroProgression.initialize(b,profile);const e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:g.HONRO_CONTENT.stages[21],profile,training:false,done:false,dirty:false,event(){},sayLines(){},checkMission(){return false;}};for(const name of ['HonroAllies','HonroEncounters','HonroAct2','HonroAct3','HonroSplitCampaign','HonroStakeCrossing'])g[name].attach(app,e);const cv=canvas(view.w,view.h),scene=new g.HonroScene(cv);Object.assign(scene,{x:view.x,y:view.y,scale:view.z,manual:true,time:2,editorView:!!view.inspection,skillPreview:!!view.inspection});const state=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,15));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),state,'State-pure native Scene');const file=label+'-'+view.id+'.png',bytes=cv.toBuffer('image/png');await writeFile(out+'/'+file,bytes);rows.push({label,file,view,pngSha256:sha(bytes),projectSha256:sha(JSON.stringify(project)),stageSha256:sha(JSON.stringify(stage)),actors:b.units.length,cache:scene.renderCacheStats()});for(const t of scene._domainTiles?.tiles?.values()||[])t.canvas.width=1;scene._domainTiles?.tiles.clear();cv.width=1;global.gc?.();console.log(label,view.id);}
await writeFile(out+'/capture.json',JSON.stringify(rows,null,2));
