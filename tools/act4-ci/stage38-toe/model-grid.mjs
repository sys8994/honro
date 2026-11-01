/** Diagnostic cloned starts only. Real NPC occupancy, equipment, collision and
 * water; end-of-mission awards disabled. Never counted as a normal clear. */
import vm from 'node:vm';import {readFile,writeFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {buildCore} from '../../../game/engine/build.mjs';
const original=JSON.parse(execFileSync('xz',['-dc',new URL('./physics-fixture.json.xz',import.meta.url).pathname],{maxBuffer:32*1024*1024})).battle;
const g=vm.createContext({console,structuredClone,performance});vm.runInContext(await buildCore(),g);g.HonroScene=class{};g.document={addEventListener(){},getElementById(){return null;}};g.HONRO_APP_READY={then(){}};const alive=u=>u&&!u.dead&&u.hp>0;g.HonroAct4TerrainPreview={launch(){},eventAPI:{alive,party:b=>b.units.filter(u=>u.side===0&&alive(u)),memory:b=>b.honroAct4PreviewState}};
for(const n of ['terrain-space','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+n+'.js','utf8'),g);
const C=g.HONRO_CORE,left=[[4755,2659],[4755,2585],[4770,2555],[4830,2555],[4845,2470],[4860,2470]];
const shapes={walkableToe:[...left,[4875,2570],[4890,2570],[4990,2660],[4990,2675]]};const results=[];
for(const [shape,points] of Object.entries(shapes))for(const [x,dir] of [[4640,1],[4990,-1],[5020,-1],[5060,-1]])for(const hold of [45,65,85]){
 const b=structuredClone(original);b.active='archer';b.phase='aim';b.side=0;
 const vertices=points.map(([x,y])=>({x,y})),w=Math.max(...points.map(p=>p[0]))-4755;
 b.terrain.push({id:'qa38-model-step',x:4755,y:2470,w,h:205,vertices,mat:'rock',hp:99999,maxHp:99999,route:true,indestructible:true,oneWay:false,honroWalkEdges:Array.from({length:points.length-3},(_,i)=>i+1)});
 const e=new C.Engine(b,()=>{});e.checkEnd=()=>false;g.HonroAct4TerrainPreview.attachCoast({engine:e,dialogue:null});const u=e.unit('archer'),floor=e.contactSurface(x,2630,2690);if(!floor){results.push({shape,x,hold,invalidStart:'no floor'});continue;}
 Object.assign(u,{x,y:floor.y,vx:0,vy:0,jumping:false,airborne:false,moveLeft:u.maxMove,acted:false});delete u.platformDrop;
 if(!g.HonroTerrain.separated(b,u,u.x,u.y,0)){results.push({shape,x,hold,invalidStart:'occupied by original actors'});continue;}
 const hp=u.hp,trace=[];if(dir<0){for(let i=0;i<240&&u.x>4890;i++){e.move(-1,C.STEP);e.tick(C.STEP);}for(let i=0;i<360&&!e.grounded(u);i++)e.tick(C.STEP);trace.push({walkApproach:true,x:u.x,y:u.y,grounded:e.grounded(u),active:b.active,hp:u.hp});}
 for(const [direction,frames] of [[dir,dir<0?Math.round(hold*.4):hold],[1,65],[1,45]]){
  const jumped=e.jump();for(let i=0;i<frames;i++){e.move(direction,C.STEP);e.tick(C.STEP);}
  for(let i=0;i<360&&!e.grounded(u);i++)e.tick(C.STEP);
  trace.push({jumped,x:u.x,y:u.y,grounded:e.grounded(u),active:b.active,hp:u.hp});
  if(b.active!=='archer'||u.dead)break;
  if(e.grounded(u)&&u.x>=4930&&u.y<2450)break;
 }
 results.push({shape,startX:x,hold,equipment:u.equipmentIds,success:e.grounded(u)&&u.x>=4930&&u.y<2450&&u.hp===hp,trace});
}
if(results.length!==12||results.some(v=>!v.success))throw Error('A declared diagnostic failed');
await writeFile(process.argv[2]||'_local/stage38-toe-model.json',JSON.stringify({scope:'diagnostic cloned starts, not fresh UI play',results},null,2));console.log(JSON.stringify(results));
