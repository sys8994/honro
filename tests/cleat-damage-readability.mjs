/** Native full production Scene. HP fixtures check presentation, not normal play. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),out=process.env.HONRO_CLEAT_OUT||'_local/reports/cleat-damage-20261011';await mkdir(out,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex');
function canvas(w=64,h=64){const c=native.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>canvas(),querySelector:()=>null,getElementById:()=>null},navigator:{userAgent:'honro-cleat-native'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
const parts=await runtimeParts({vector:true,render:true});for(const s of parts)vm.runInContext(s,g);native.GlobalFonts.registerFromPath('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','sans-serif');
const p=g.HONRO_CORE.defaults();p.recruited=g.HonroStageRules.stageParty(5);for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(5).entryLevel);
const st=g.HONRO_CONTENT.stages[4],b=g.HonroWorld.build(st,p,false,'archer','A01');g.HonroStageRules.sanitizeStageBattle(b);
const e=new g.HONRO_CORE.Engine(b,()=>{},false),app={engine:e,stage:st,profile:p,training:false,done:false,event(){},sayLines(){},checkMission(){return false;}};
for(const name of ['HonroAllies','HonroEncounters','HonroAct2','HonroAct3','HonroSplitCampaign','HonroStakeCrossing','HonroNarrativeRevision'])g[name].attach?.(app,e);
const t=b.terrain.find(t=>t.id==='cliff-cleat'),A=g.HonroAct1StoryArt,O=g.HonroObjectives,D=g.HonroObjectDamage;assert(t);const geometry=JSON.stringify([t.x,t.y,t.w,t.h,t.maxHp,t.mat,t.poly,t.honroSeal]);
for(const [ratio,level]of [[1,0],[.99,1],[.85,1],[2/3,2],[.5,2],[1/3,3],[.1,3]])assert.equal(A.cleatDamageStage({...t,hp:t.maxHp*ratio}),level);
let sharedCalls=0;const originalStage=D.stage;D.stage=a=>{sharedCalls++;return originalStage(a);};A.cleatDamageStage(t);assert.equal(sharedCalls,1);D.stage=originalStage;
const target=O.state(b,st).allTargets.find(v=>v.id===t.id);assert(target);assert.equal(O.markerLift(b,target),12);assert.equal(O.markerLift({...b,honroNarrativeRevision:undefined},target),88);assert.equal(O.markerLift({...b,honroCustom:true},target),88);assert.equal(O.markerLift({...b,honroStage:10},{...target,id:'sodan-binding'}),88);assert.equal(O.markerLift(b,{id:'boss'}),26);
const cv=canvas(1440,960),scene=new g.HonroScene(cv);Object.assign(scene,{x:t.x+t.w/2,y:t.y-110,scale:1,manual:true,time:2});scene.missionTargets=[target];
const rows=[],states=[['intact',1,0],['worn',.85,1],['bent',.5,2],['severe',.2,3],['repaired',1,0]];let builds;
const sheet=canvas(1440,620),sc=sheet.getContext('2d');sc.fillStyle='#15252c';sc.fillRect(0,0,1440,620);
for(const [name,ratio,level]of states){t.hp=t.maxHp*ratio;assert.equal(A.cleatDamageStage(t),level);const pure=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,25));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),pure,'read-only full Scene '+name);
 const cache=scene.renderCacheStats();if(builds==null)builds=cache.worldBuilds;else assert.equal(cache.worldBuilds,builds,'HP-only changes never rebuild static scenery');
 const bytes=cv.toBuffer('image/png'),file=name+'.png';await writeFile(out+'/'+file,bytes);
 const crop=cv.getContext('2d').getImageData(660,580,120,170);rows.push({name,ratio,damageStage:level,file,sha256:hash(bytes),targetCropSha256:hash(crop.data),worldBuilds:cache.worldBuilds});
 const idx=['intact','bent','severe'].indexOf(name);if(idx>=0){const snapshot=await native.loadImage(bytes);sc.drawImage(snapshot,480,310,480,570,idx*480,50,480,570);sc.fillStyle='#efdfbf';sc.font='21px sans-serif';sc.fillText(['무손상','중간 손상 · 찌그러진 고리','심한 손상 · 벌어진 고리'][idx],idx*480+24,32);}
}
assert.equal(new Set(rows.slice(0,4).map(r=>r.targetCropSha256)).size,4,'all four live states visibly differ without cache invalidation');assert.equal(rows[0].targetCropSha256,rows[4].targetCropSha256,'repair exactly restores untouched metal');assert.equal(JSON.stringify([t.x,t.y,t.w,t.h,t.maxHp,t.mat,t.poly,t.honroSeal]),geometry);
for(const [i,name]of ['intact','bent','severe'].entries())assert.equal(hash(sc.getImageData(i*480+180,320,120,170).data),rows.find(r=>r.name===name).targetCropSha256,'comparison preserves its own immutable '+name+' frame');
const comparison=sheet.toBuffer('image/png');await writeFile(out+'/comparison-three-states.png',comparison);
// Complete scene excludes a static duplicate of the fresh ring. Legacy keeps it.
let drawn=0;const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{drawn++;}),set:(o,k,v)=>(o[k]=v,true)});scene.terrain(ctx,t);assert.equal(drawn,0);delete b.honroNarrativeRevision;const legacyCanvas=canvas(120,180),legacyCtx=legacyCanvas.getContext('2d');legacyCtx.translate(-t.x+10,-t.y+10);scene.terrain(legacyCtx,t);assert(legacyCtx.getImageData(0,0,120,180).data.some(v=>v>0),'legacy painter remains visible');legacyCanvas.width=1;b.honroNarrativeRevision=1;
const files=['shared/runtime/story-act1-art.js','shared/runtime/objectives.js','shared/engine/src/engine.ts','shared/data/campaign.json', 'tests/cleat-damage-readability.mjs'],digests={};for(const file of files)digests[file]=hash(await readFile(file));
await writeFile(out+'/report.json',JSON.stringify({status:'passed',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),digests,bundleSha256:hash(parts.join('\n')),scope:'Production Native Scene, actual authored target and renderer; isolated HP fixtures, no normal-resource/browser claim.',camera:{x:scene.x,y:scene.y,zoom:1,width:1440,height:960},geometry:JSON.parse(geometry),arrowTipDistanceScreenPx:9,thresholds:'Existing object damage: intact 1; worn (2/3,1); bent (1/3,2/3]; severe <=1/3.',rows,comparison:{file:'comparison-three-states.png',sha256:hash(comparison),scale:'1:1 pixel crops from same 1440x960 full scene, identical camera/zoom/time'},checks:['four live tiers','same cache across partial damage and repair','exact repaired crop','unchanged geometry/maxHp/material','fresh-only arrow placement','no static duplicate; legacy painter retained','read-only render']},null,2)+'\n');
for(const tile of scene._domainTiles?.tiles?.values()||[])tile.canvas.width=1;scene._domainTiles?.tiles.clear();cv.width=1;sheet.width=1;
console.log('PASS cleat damage: existing tiers, full Scene live/cache/repair, fixed same-zoom captures, unchanged geometry and narrow arrow offset.');
