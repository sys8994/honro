/** Read-only map reachability diagnostic. Real Engine walk/jump/body integration; synthetic budget resets, no combat or full-play claim. */
import {appHarness,plain} from './app-regression-helpers.mjs';
import vm from 'node:vm';import {readFile,mkdir,writeFile} from 'node:fs/promises';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(32));app.launch(33);h.finish(app);
const initial=plain(app.engine.b);app.stopBattle();g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const n of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+n+'.js','utf8'),g);
const C=g.HONRO_CORE,P=g.HonroAct4TerrainPreview,results=[];
for(const mode of ['east-switchback'])for(const cls of ['archer','mage','knight','occultist']){
 const b=plain(initial),e=new C.Engine(b,()=>{}),u=e.unit(cls);if(!u)continue;
 app.engine=e;app.dialogue=null;e.checkEnd=()=>false;P.attachCoast(app);P.coast.tide(b);
 const before={x:u.x,y:u.y,hp:u.hp},target=b.honroAct4Design.exit,trace=[];let jumps=0,resets=0,stop='';
 const route=[[6180,3437],[6240,3352.5],[6310,3267],[6390,3181.5],[6470,3091.5],[6550,2997],[6620,2907],[6240,2902.5],[6310,2817],[6390,2731.5],[6470,2641.5],[6550,2547],[6620,2457],[6710,2358],[6800,2322],[6550,2317.5],[6650,2227.5],[6725,2133],[6810,2043],[6860,1944],[6500,1998],[6400,1954],[6300,1858],[6240,1800],[6350,1707],[6525,1620],[6705,1507.5]];
 for(const [index,p] of route.entries()){
  let reached=false,stationary=0,lastX=u.x;
  if(p[0]<u.x-150&&p[1]<=u.y+60&&e.grounded(u)){u.moveLeft=Math.max(u.moveLeft,e.jumpCost(u));if(e.jump(u))jumps++;}
  for(let i=0;i<3600;i++){
   if(u.dead||u.hp<=0){stop='dead';break;}
   if(Math.abs(u.x-p[0])<12&&Math.abs(u.y-p[1])<40&&e.grounded(u)){reached=true;break;}
   if(u.moveLeft<Math.max(10,e.jumpCost(u))){u.moveLeft=u.maxMove;resets++;}
   if(e.grounded(u)&&(u.y>p[1]+24||stationary>30)){if(e.jump(u))jumps++;}
   if(Math.abs(u.x-p[0])>3)e.walk(u,Math.sign(p[0]-u.x),Math.min(C.STEP,Math.abs(p[0]-u.x)/u.walkSpeed));
   e.integrateBody(u,C.STEP);P.coast.water(e,C.STEP);
   if(Math.abs(u.x-lastX)<.001)stationary++;else stationary=0;lastX=u.x;
   if(i%120===0)trace.push({waypoint:index,frame:i,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u)});
  }
  trace.push({waypoint:index,target:p,reached,x:u.x,y:u.y,grounded:e.grounded(u)});
  if(!reached){stop='waypoint-'+index+'-failed';break;}
 }
 if(stop==='')stop='reached';

 results.push({mode,cls,before,target,after:{x:u.x,y:u.y,hp:u.hp},jumps,syntheticBudgetResets:resets,stop,trace});
}
await mkdir('_local/reports/stage33-route',{recursive:true});
await writeFile('_local/reports/stage33-route/initial.json',JSON.stringify(initial));
await writeFile('_local/reports/stage33-route/core.js',await (await import('../game/engine/build.mjs')).buildCore());
await writeFile('_local/reports/stage33-route/result.json',JSON.stringify({scope:'Actual Engine locomotion only. Synthetic per-actor isolated budget reset; no enemy turns, no skill use, no coordinate teleport, tide held initial low. Not full gameplay.',initial:{design:initial.honroAct4Design,units:initial.units.map(u=>({id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,maxMove:u.maxMove})),terrain:initial.terrain},results},null,2));
console.log(JSON.stringify(results.map(({trace,...r})=>r),null,2));