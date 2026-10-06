import assert from 'node:assert/strict';
// Test-only fixtures. They do not change production movement, AI or map rules.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {hash} from './act2-spatial-contract-helpers.mjs';
export {plain,hash,unitContract} from './act2-spatial-contract-helpers.mjs';
export const CLASSES=['archer','mage','knight','occultist'];
// Historical recipes intentionally do not qualify for the production root
// migration (their old one-way flags differ). Assert the approved additive root
// exactly when present, compare every other record, then author BOTH domains.
// Callers separately require that the active project contains this exact root.
export function applyCurrentTerrainRecipes(g,input){
 const project=structuredClone(input),plain=v=>JSON.parse(JSON.stringify(v));
 for(const stage of project.stages||[]){if(stage.id!=='stage-7'||stage.metadata?.stageId!==7)continue;
  const roots=(stage.terrains||[]).filter(t=>t.id===g.HonroStage7Reentry.id);
  if(roots.length)assert.deepEqual(plain(roots),[plain(g.HonroStage7Reentry.terrain())],'Only the exact approved Stage7 root is a historical exception');
  stage.terrains=stage.terrains.filter(t=>t.id!==g.HonroStage7Reentry.id);
 }
 return g.HonroTerrainDomain.author(project);
}
export function semanticContent(stage){const {w,h,map,...content}=stage;return JSON.parse(JSON.stringify(content));}
export async function act1Runtime(){
 const g=await runtime({legacyMaps:false});
 g.document={getElementById(){return null;},addEventListener(){}};
 vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
 const main=await readFile('shared/runtime/main.js','utf8'),method=main.slice(main.indexOf('        checkMission(e) {'),main.indexOf('        missionTick(dt)'));
 g.testCheckMission=new Function('G','C','return ({'+method+'}).checkMission')(g,g.HONRO_CORE);
 return g;
}
export function fixture(g,id,options={}){
 const q=battlefield(g,id,options);Object.assign(q.app,{canInput(){return this.engine.canAct();},cancelInput(){},checkMission:g.testCheckMission});
 q.e.checkEnd=()=>q.app.checkMission(q.e);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);return q;
}
export function isolatedHero(g,id,cls){
 const q=fixture(g,id),entry=q.e.active,u=structuredClone(battlefield(g,11).e.heroesAlive().find(u=>u.cls===cls));
 // All four bodies are geometry probes, not a claim that all four are recruited
 // in early Act 1. Initialization happens once; traversal never corrects position.
 Object.assign(u,{x:entry.x,y:entry.y,spawnX:entry.x,spawnY:entry.y,vx:0,vy:0});q.b.units=[u];q.b.active=u.id;q.e.checkEnd=()=>false;
 return {...q,u};
}
export function routePoints(g,id,b){
 const st=g.HONRO_PROJECT.stages[id-1],authored=st.design?.space?.routes?.find(r=>r.id==='main');
 if(authored)return authored.anchors;
 const a=b.honroMapAnchors;
 if(id===7)return [a.resident1,{x:2250,y:3274,jumpTo:{x:2280,support:'ramp-1'}},{x:2495,y:3000},a.resident2,{x:3160,y:3000,jumpTo:{x:2970,support:'ramp-2'}},a.hollow,{x:650,y:2200,jumpTo:{x:740,support:'ramp-3'}},{x:1500,y:1450},a.resident3,a.exit];
 if(id===5)return [a.receiver,{x:1780,y:g.HONRO_CORE.topAt(b.terrain.find(t=>t.id==='place5-slope-stone:collision:0'),1780),jumpTo:{x:1970,support:'archer-step'}},a.shotGap,a.exit];
 if(id===3)return [{x:1000,y:g.HONRO_CORE.topAt(b.terrain.find(t=>t.id==='ferry-ground'),1000),jumpTo:{x:1135}},a.ledger,a.exit];
 const keys={1:['cart','shrine','woodcutter','ridge','exit'],2:['exit'],3:['ledger','exit'],4:['gate','exit'],5:['receiver','exit'],6:['rescue','exit'],8:['knotWest','knotEast','bier','exit'],9:['receiverWest','well','receiverEast','exit'],10:['receiverWest','ritual','receiverEast','exit']}[id];
 return keys.map(k=>({...a[k],id:k}));
}
export function traverse(g,b,e,u,route,{jump=true}={}){
 const samples=[];let ticks=0,jumps=0,failed=null;const startHp=u.hp;
 for(const p of route){
  let age=0,still=0,attempts=0;const max=Math.max(900,Math.ceil(Math.abs(p.x-u.x)/u.walkSpeed*60*5));
  while(age++<max){
   const reached=Math.abs(u.x-p.x)<22&&Math.abs(u.y-p.y)<100&&e.grounded(u);if(reached)break;
   const before={x:u.x,y:u.y};u.moveLeft=u.maxMove;
   const dir=Math.sign(p.x-u.x);if(Math.abs(u.x-p.x)>10)e.walk(u,dir,1/60);
   if(jump&&(still>10||Math.abs(u.x-p.x)<24&&u.y-p.y>100)&&e.grounded(u)&&attempts<20){if(e.jump(u)){jumps++;attempts++;still=0;}}
   e.integrateBody(u,1/60);ticks++;
   if(Math.hypot(u.x-before.x,u.y-before.y)<.015)still++;else still=0;
   if(u.dead||u.y>b.height+30){failed={reason:'fall',goal:p,x:u.x,y:u.y};break;}
   if(still>90){failed={reason:'blocked',goal:p,x:u.x,y:u.y};break;}
  }
  if(!failed&&age<max&&p.jumpTo){
   // A deliberate, ordinary jump across overlapping branch/ramp joins. This
   // models a real input sequence rather than waiting to fall and correcting it.
   u.moveLeft=u.maxMove;const launched=e.jump(u);if(launched)jumps++;
   let air=0;for(;launched&&air<180;air++){u.moveLeft=u.maxMove;if(Math.abs(u.x-p.jumpTo.x)>3)e.walk(u,Math.sign(p.jumpTo.x-u.x)*.35,1/60);e.integrateBody(u,1/60);ticks++;if(air>30&&e.grounded(u))break;}
   const landing=e.surface(u.x,u.y-5,u.y+5)?.t?.id;
   if(!launched||air>=180||p.jumpTo.support&&landing!==p.jumpTo.support)failed={reason:'planned jump did not land on intended support',goal:p.jumpTo,x:u.x,y:u.y,landing};
  }
  samples.push({goal:{x:p.x,y:p.y,id:p.id},x:u.x,y:u.y,ticks:age,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,jumpTo:p.jumpTo});
  if(failed||age>=max){failed??={reason:'timeout',goal:p,x:u.x,y:u.y};break;}
 }
 return{passed:!failed,failed,ticks,jumps,damage:startHp-u.hp,samples,mode:jump?'isolated ordinary walking and default jumps':'isolated walk-only'};
}
export function reportRoot(){return process.env.HONRO_ACT1_REPORT_DIR||'_local/reports/act1-spatial/current';}
export function canonicalGameplay(stage){
 const omit=(value,keys)=>Object.fromEntries(Object.entries(value).filter(([k])=>!keys.includes(k)));
 return JSON.parse(JSON.stringify({
  units:stage.units.map(u=>omit(u,['x','y','spawnX','spawnY'])),
  terrain:stage.terrains.map(t=>omit(t,['points','x','y','w','h'])),
  objectives:stage.objectives,events:stage.events,encounters:stage.encounters,
  physics:stage.initialState?.physics,items:stage.initialState?.items,
  initialMissionState:stage.initialState?.honroState
 }));
}
export function combatFingerprint(stage){
 return hash({terrain:stage.terrains,elements:stage.elements.filter(e=>!e.id.startsWith('a1-scene-')),units:stage.units,markers:stage.markers,anchors:stage.anchors,materials:stage.materials});
}
