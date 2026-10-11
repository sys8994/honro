/** Production Scene at actual authored object coordinates. No browser/input,
 * combat completion, timing performance, or normal-resource play claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),out=process.env.HONRO_NATIVE_OUT||'_local/reports/quest-story-native';await mkdir(out,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex');
function canvas(w=64,h=64){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-quest-native'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
const parts=await runtimeParts({vector:true,render:true});for(const s of parts)vm.runInContext(s,g);native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
const views=[{id:5,name:'iron-ring',terrain:'cliff-cleat',z:1},{id:5,name:'floor-array',marker:'receiver-5',z:1},{id:10,name:'body-and-binding',terrain:'sodan-binding',dx:140,z:1},{id:15,name:'observed-traces',marker:'groove',z:1},{id:19,name:'three-farewells',marker:'separate-2',z:.8},{id:20,name:'recovered-convoy',unit:'objective',dx:-80,z:1},{id:24,name:'folded-map',marker:'land-register',z:1},{id:30,name:'three-transport-lines',marker:'transport-map',z:1}],rows=[];
const selected=process.env.HONRO_NATIVE_VIEW?views.filter(v=>v.name===process.env.HONRO_NATIVE_VIEW):views;assert(selected.length,'known actual Scene view');
for(const view of selected){
 const p=g.HONRO_CORE.defaults();p.recruited=g.HonroStageRules.stageParty(view.id);for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(view.id).entryLevel);
 const st=g.HONRO_CONTENT.stages[view.id-1],b=g.HonroWorld.build(st,p,false,'archer','A01');g.HonroStageRules.sanitizeStageBattle(b);
 const e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:st,profile:p,training:false,done:false,event(){},sayLines(){},checkMission(){return false;}};
 for(const name of ['HonroAllies','HonroEncounters','HonroAct2','HonroAct3','HonroSplitCampaign','HonroStakeCrossing','HonroNarrativeRevision'])g[name].attach?.(app,e);
 const target=view.terrain?b.terrain.find(t=>t.id===view.terrain):view.unit?b.units.find(u=>u.id===view.unit):b.honroMarkers.find(m=>m.id===view.marker);
 assert(target,`${view.id}/${view.name} requires the exact real target`);
 const cv=canvas(1440,960),scene=new g.HonroScene(cv);Object.assign(scene,{x:target.x+(target.w||0)/2+(view.dx||0),y:target.y-110,scale:view.z,manual:true,time:2});scene.missionTargets=g.HonroObjectives.state(b,st).targets;
 const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,25));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),before,'read-only full Scene '+view.name);
 const bytes=cv.toBuffer('image/png'),file=view.id+'-'+view.name+'.png';await writeFile(out+'/'+file,bytes);rows.push({stage:view.id,file,target:target.id,x:scene.x,y:scene.y,z:scene.scale,sha256:hash(bytes)});console.log('PASS Native full Scene',view.id,view.name);
 for(const tile of scene._domainTiles?.tiles?.values()||[])tile.canvas.width=1;scene._domainTiles?.tiles.clear();cv.width=1;global.gc?.();
}
await writeFile(out+'/report'+(process.env.HONRO_NATIVE_VIEW?'-'+process.env.HONRO_NATIVE_VIEW:'')+'.json',JSON.stringify({scope:'Full production Scene with actual maps/actors and read-only snapshots; no actual browser or normal resource play.',bundleSha256:hash(parts.join('\n')),rows},null,2)+'\n');
