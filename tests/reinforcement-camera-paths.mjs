// Production compiled 1..30 inventory and direct event execution fixtures.
// These bypass event eligibility; they do not demonstrate campaign completion.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,performance,structuredClone,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),document:{querySelector:()=>null}});g.window=g;
for(const source of await runtimeParts({vector:false,render:false}))vm.runInContext(source,g);
g.HonroStory={speakerPresentation:(_who,meta)=>({kind:meta?.kind||'character'})};
const rows=[];
for(const map of g.HONRO_PROJECT.stages){
 const b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);
 const e=new g.HONRO_CORE.Engine(b,()=>{},true),stage=g.HONRO_CONTENT.stages[b.honroStage-1];
 const events=(b.honroEvents||[]).filter(ev=>g.HonroEncounters.combat(ev.action));
 const row={stage:b.honroStage,eventActions:events.map(ev=>({id:ev.id,type:ev.action.type,count:g.HonroEncounters.spawnCount(ev.action)})),holdWaves:[],attempts:[]};
 const steps=g.HonroAct2.active(b)?g.HonroAct2.steps(b):g.HonroAct3.active(b)?g.HonroAct3.steps(b):[];
 row.holdWaves=(steps||[]).filter(s=>s.wave).map(s=>({id:s.id,wave:s.wave}));
 const initial=structuredClone(b);
 for(const ev of events){
  Object.assign(b,structuredClone(initial));const s={x:200,y:600,scale:.65,manual:true,size:()=>({w:1280,h:800}),canvas:{getBoundingClientRect:()=>({top:0})}};g.HonroReinforcementCamera.prime(s,b);
  const ids=new Set(b.units.map(u=>u.id)),app={engine:e,stage,event(){},say(){},sayLines(){},profile:{},actorBoundary:b.active};
  const result=g.HonroAllies.execute(app,structuredClone(ev.action));const added=b.units.filter(u=>!ids.has(u.id)&&u.side===1&&!u.dead&&u.hp>0),before=JSON.stringify(b);
  const focused=g.HonroReinforcementCamera.update(s,e,1280,800,0);assert.equal(focused,added.length>0,`stage${b.honroStage}/${ev.id}`);assert.equal(JSON.stringify(b),before,'camera never mutates save');
  if(added.length){app.screen='battle';app.scene=s;const lines=g.HonroStoryFraming.bind(app,[['서술','',{kind:'narration',reinforcementIds:added.map(u=>u.id)}]],{});s.storyFrame={app,camera:lines[0][2].camera};let plan=g.HonroStoryFraming.targetFrame(s,e);assert.equal(plan.fallback,null);assert.equal(plan.boxes.length,added.length);for(const u of added)u.dead=true;assert.equal(g.HonroStoryFraming.targetFrame(s,e),undefined,'dead new enemies never fall back to hero/goal');}
  row.attempts.push({id:ev.id,result:result===false?'blocked':'executed',ids:added.map(u=>u.id),camera:focused});
  // One representative committed event per chapter; blocked placement remains
  // recorded and no unrelated enemy is focused. Inventory retains all actions.
  if(added.length)break;
 }
 rows.push(row);
}
// Actual flush boundary records committed IDs before scheduling either speech
// or narration; saved provenance must survive serialization.
{
 const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[0],g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);b.units=b.units.filter(u=>u.side!==1);
 const e=new g.HONRO_CORE.Engine(b,()=>{},true),ev=b.honroEvents.find(ev=>g.HonroEncounters.combat(ev.action)),spoken=[];
 b.honroState.pendingEvents=[ev.id];
 const app={engine:e,stage:g.HONRO_CONTENT.stages[0],actorBoundary:b.active,profile:{},event(text,options){spoken.push(['서술',text,{kind:'narration',eventSource:options?.source}]);},sayLines(lines){spoken.push(...lines);},canSpeak(){return true;}};
 g.HonroEncounters.flush(app);const ids=b.honroState.reinforcementEvents?.[ev.id];assert(ids?.length,'flush records actual committed enemies');
 const loaded=JSON.parse(JSON.stringify(b));assert.deepEqual(loaded.honroState.reinforcementEvents[ev.id],Array.from(ids));
 assert(spoken.some(l=>l[2]?.reinforcementIds||l[2]?.eventSource==='encounter:'+ev.id));
 app.screen='battle';app.scene={scale:.6};delete b.honroState.reinforcementEvents;const old=g.HonroStoryFraming.bind(app,[['서술','',{kind:'narration',eventSource:'encounter:'+ev.id}]],{});assert.equal(old[0][2].camera.reinforcement,true);assert.equal(old[0][2].camera.targets.length,0,'old save with no proven IDs never guesses a hero/goal');
 console.log('PASS actual event flush records saved reinforcement provenance for queued delivery');
}
await mkdir('_local/reports/reinforcement-camera',{recursive:true});await writeFile('_local/reports/reinforcement-camera/paths.json',JSON.stringify(rows,null,2));
console.log('PASS 30-chapter compiled inventory; representative direct event fixtures:',rows.filter(r=>r.attempts.some(a=>a.camera)).map(r=>r.stage).join(','));
console.log('No successful direct event fixture:',rows.filter(r=>!r.attempts.some(a=>a.camera)).map(r=>r.stage).join(','));
