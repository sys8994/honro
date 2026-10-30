/** Cache ownership + pixel parity, without loading campaign or mutating gameplay. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
const hash=x=>createHash('sha256').update(x).digest('hex');
const path='shared/runtime/renderer.js';
const baselineRef=process.env.HONRO_CACHE_BASELINE||'569e11123b2e077ef1f37aeaf92f44d131df73e5';
const before=execFileSync('git',['show',`${baselineRef}:${path}`],{encoding:'utf8'});
const after=await readFile(path,'utf8');
const out=process.env.HONRO_CACHE_OUT||'_local/reports/canvas-backing-release';
await mkdir(out,{recursive:true});
const reports=[];
function run(source, view, hardened){
 const canvases=[];
 const make=(w=1,h=1)=>{const cv=createCanvas(w,h);canvases.push(cv);return cv;};
 const g=vm.createContext({performance,console,HONRO_CONTENT:{},HONRO_CORE:{},document:{createElement:()=>make()},
  HonroTerrainDomain:{active:b=>b.domain,render:b=>b.terrain,materialLandmarks:b=>[]},
  HonroBounds:{viewport:(s,w,h)=>({left:s.x-w/2/s.scale,right:s.x+w/2/s.scale,top:s.y-h/2/s.scale,bottom:s.y+h/2/s.scale})}});
 vm.runInContext(source,g);
 const cv=make(view.w,view.h),c=cv.getContext('2d'),scene=new g.HonroScene(cv);
 scene.terrain=(cc,t)=>{cc.fillStyle=t.color;cc.fillRect(t.x,t.y,t.w,t.h);cc.strokeStyle='#b8b5a080';cc.lineWidth=3;cc.strokeRect(t.x+13,t.y+11,t.w-26,t.h-22);};
 const terrain=Array.from({length:70},(_,i)=>({x:i*420-2500,y:300+(i%4)*67,w:550,h:1300,color:['#233d4b','#43616b','#687678'][i%3]}));
 const b={domain:true,session:'tile',sceneVersion:0,width:30000,height:4000,honroTerrainBounds:{left:-4000,right:30000,top:-2000,bottom:6000},terrain,honroLandmarks:[]};
 const state=JSON.stringify(b),frames=[],limit=view.w<900?12:24;
 const paint=(label,x,y,z)=>{
  Object.assign(scene,{x,y,scale:z});c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);c.setTransform(z,0,0,z,view.w/2-x*z,view.h/2-y*z);
  const previousTiles=[...(scene._domainTiles?.tiles.values()||[])],previousStatic=scene._staticWorldCache?.canvas;
  scene._drawStaticWorldCached(c,b,view.w,view.h);
  const pixels=Buffer.from(c.getImageData(0,0,view.w,view.h).data),live=new Set([...(scene._domainTiles?.tiles.values()||[])].map(t=>t.canvas));
  assert((scene._domainTiles?.tiles.size||0)<=limit,'Unchanged domain LRU cap');
  if(hardened){
   for(const tile of previousTiles)if(!live.has(tile.canvas))assert.deepEqual([tile.canvas.width,tile.canvas.height],[1,1],label+' abandoned tile is released');
   if(previousStatic&&previousStatic!==scene._staticWorldCache?.canvas)assert.deepEqual([previousStatic.width,previousStatic.height],[1,1],label+' replaced world backing released');
   for(const tile of scene._domainTiles?.tiles.values()||[])assert.deepEqual([tile.canvas.width,tile.canvas.height],[516,516],label+' current tile remains intact');
  }
  assert.deepEqual([cv.width,cv.height],[view.w,view.h],'Visible target is never released');
  frames.push({label,pixels:hash(pixels),tileCount:scene._domainTiles?.tiles.size||0,worldBuilds:scene.renderCacheStats().worldBuilds});
 };
 for(let i=0;i<14;i++)paint('pan-'+i,500+i*1600,800,view.z);
 paint('return',500,800,view.z);
 for(const z of [.22,.41,.68,.31])paint('zoom-'+z,7500,800,z);
 b.sceneVersion++;paint('scene-reset',7500,800,view.z);
 paint('settle-build',7500,800,view.z);paint('settle-hit',7500,800,view.z);
 const activeTiles=[...(scene._domainTiles?.tiles.values()||[])];
 b.domain=false;b.session='static';b.width=1200;b.height=900;
 paint('domain-to-static',600,500,.6);
 if(hardened){assert.equal(scene._domainTiles,null);for(const t of activeTiles)assert.deepEqual([t.canvas.width,t.canvas.height],[1,1]);}
 const first=scene._staticWorldCache.canvas;paint('static-hit',600,500,.6);assert.equal(scene._staticWorldCache.canvas,first);
 b.sceneVersion++;paint('static-rebuild',600,500,.6);
 b.domain=true;b.session='tile';b.width=30000;b.height=4000;
 paint('static-to-domain',7500,800,view.z);
 b.sceneVersion=0;assert.equal(JSON.stringify(b),state,'Only fixture test driver changes state; render does not');
 const released=canvases.filter(q=>q!==cv&&q.width===1&&q.height===1).length;
 const retainedBytes=canvases.filter(q=>q!==cv).reduce((n,q)=>n+q.width*q.height*4,0);
 const result={view,frames,allocated:canvases.length-1,released,retainedBytes,peakTileCount:Math.max(...frames.map(f=>f.tileCount))};
 for(const q of canvases){q.width=1;q.height=1;}
 return result;
}
for(const view of [{w:960,h:540,z:.53},{w:390,h:844,z:.31}]){
 const old=run(before,view,false),current=run(after,view,true);
 assert.deepEqual(current.frames.map(({tileCount,...f})=>f),old.frames.map(({tileCount,...f})=>f),'All frame pixels/builds identical across pan, zoom, LRU eviction, reset, mode switch and rebuild');
 for(let i=0;i<current.frames.length;i++){const frame=current.frames[i];if(['domain-to-static','static-hit','static-rebuild'].includes(frame.label))assert.equal(frame.tileCount,0,'Unused domain cache is released in non-domain mode');else assert.equal(frame.tileCount,old.frames[i].tileCount,'Active domain cache counts unchanged');}
 assert.equal(current.allocated,old.allocated,'No new allocation policy');
 assert(current.retainedBytes<old.retainedBytes,'Abandoned backing stores are explicitly released');
 reports.push({view,pixelExactFrames:current.frames.length,old,current});
}
assert.equal(await readFile(path,'utf8'),after,'Runtime source remained frozen during comparison');
await writeFile(out+'/parity.json',JSON.stringify({passed:true,baselineRef,beforeSha256:hash(before),afterSha256:hash(after),reports,limits:['Synthetic geometry exercises production cache methods in Native Canvas, not campaign gameplay, browser GPU memory, or mobile frame rate.','Retained backing bytes include deliberately retained test references to retired canvases; they are ownership/release evidence, not process RSS.','No claim that this resolves the stage35 exit137 event.']},null,2));
console.log('PASS',reports.reduce((n,r)=>n+r.pixelExactFrames,0),'pixel-exact cache lifecycle frames; bounded cache counts and explicit retired backing release');
