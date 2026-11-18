/** Read-only map reachability diagnostic. Real Engine walk/jump/body integration; synthetic budget resets, no combat or full-play claim. */
import {appHarness,plain} from './app-regression-helpers.mjs';
import vm from 'node:vm';import {readFile,mkdir,writeFile} from 'node:fs/promises';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(32));app.launch(33);h.finish(app);
const initial=plain(app.engine.b);app.stopBattle();g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const n of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+n+'.js','utf8'),g);
const C=g.HONRO_CORE,P=g.HonroAct4TerrainPreview,results=[];
for(const mode of ['walk','jump-blocked','jump-periodic'])for(const cls of ['archer','mage','knight','occultist']){
 const b=plain(initial),e=new C.Engine(b,()=>{}),u=e.unit(cls);if(!u)continue;
 app.engine=e;app.dialogue=null;e.checkEnd=()=>false;P.attachCoast(app);P.coast.tide(b);
 const before={x:u.x,y:u.y,hp:u.hp},target=b.honroAct4Design.exit,trace=[];let jumps=0,blocked=0,resets=0,lastX=u.x,stop='';
 for(let i=0;i<72000;i++){
  if(u.dead||u.hp<=0){stop='dead';break;}
  if(u.x>target.x-150&&Math.abs(u.y-target.y)<200&&e.grounded(u)){stop='reached';break;}
  if(u.moveLeft<Math.max(10,e.jumpCost(u))){u.moveLeft=u.maxMove;resets++;}
  if(e.grounded(u)&&((mode==='jump-blocked'&&blocked>20)||(mode==='jump-periodic'&&i%90===0))){if(e.jump(u))jumps++;}
  e.walk(u,1,C.STEP);e.integrateBody(u,C.STEP);P.coast.water(e,C.STEP);
  if(Math.abs(u.x-lastX)<.001)blocked++;else blocked=0;lastX=u.x;
  if(i%120===0)trace.push({frame:i,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u)});
  if(blocked>720){stop='blocked';break;}
 }
 results.push({mode,cls,before,target,after:{x:u.x,y:u.y,hp:u.hp},jumps,syntheticBudgetResets:resets,stop,trace});
}
await mkdir('_local/reports/stage33-route',{recursive:true});
await writeFile('_local/reports/stage33-route/result.json',JSON.stringify({scope:'Actual Engine locomotion only. Synthetic per-actor isolated budget reset; no enemy turns, no skill use, no coordinate teleport, tide held initial low. Not full gameplay.',initial:{design:initial.honroAct4Design,units:initial.units.map(u=>({id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,maxMove:u.maxMove})),terrain:initial.terrain},results},null,2));
console.log(JSON.stringify(results.map(({trace,...r})=>r),null,2));