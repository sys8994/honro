/** Production engine/App with explicit isolated safety-state fixtures. No
 * synthetic result here claims normal traversal, combat, art, or browser QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
export const plain=x=>JSON.parse(JSON.stringify(x));
export async function installFerry(g){if(!g.HonroStage30Ferry)vm.runInContext(await readFile('shared/runtime/stage30-ferry.js','utf8'),g);return g;}
export async function ferryRuntime(){return installFerry(await runtime({legacyMaps:false}));}
export function installSafetyGeometry(g,b){
 const solid=(id,x,y,w,h,broken=false)=>({...g.HonroMapEngine.solid(id,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]),broken,indestructible:true});
 const ts=[solid('ferry-test-final',3300,500,280,130,true),solid('ferry-test-screen',4100,500,100,130),solid('ferry-test-west',400,600,1100,150),solid('ferry-test-east',1800,600,1000,150)];
 b.terrain.push(...ts);b.honroWorldTerrain.push(...plain(ts));b.honroFerryRevision=1;b.honroFerryPopulationCap=36;
 b.honroFerrySpec={enableTerrainIds:['ferry-test-final'],disableTerrainIds:['ferry-test-screen'],sweep:[{x:3250,y:400,w:380,h:250}],entries:Object.fromEntries(g.HonroStage30Ferry.sources.map((id,i)=>[id,{x:750+i*155,y:600,support:'ferry-test-west',side:'west',alternates:[{x:2100+i*155,y:600,support:'ferry-test-east',side:'west'}]}]))};
}
export function fixture(g,{synthetic=true}={}){const q=battlefield(g,30);if(synthetic)installSafetyGeometry(g,q.b);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct3.attach(q.app,q.e);q.e.checkEnd=()=>false;return q;}
export function qualify(g,q,progress=1){const a=g.HonroAct3.memory(q.b);a.done['transport-map']=true;a.holds['ferry-hold']={progress,spawned:3,lastEnemyEnd:q.b.teamEnds[1],continuous:true,guarded:true,contested:false};}
export function boundary(g,q,id=q.e.active.id){g.HonroEncounters.actorEnd(q.app,id);}
export function defend(g,q){assert(q.e.canAct(),'Fixture must use an available real player action');const id=q.e.active.id;q.e.wait();for(let i=0;i<180&&q.b.phase==='review';i++)q.e.tick(g.HONRO_CORE.STEP);assert(q.e.unit(id).acted,'Production finishAction must complete');return id;}
export function resume(g,q){const b=plain(q.b),e=new g.HONRO_CORE.Engine(b,()=>{},false),app={...q.app,engine:e};g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct3.attach(app,e);e.checkEnd=()=>false;return{...q,b,e,app};}
export const geometry=b=>plain({terrain:b.terrain,world:b.honroWorldTerrain});
export const retained=b=>plain(Object.fromEntries(['units','terrain','honroWorldTerrain','items','round','phase','side','active','honroState','honroGrowth','honroMarkers','honroEvents','honroAuthoredEvents','honroAct3Steps','honroObjectives','honroCounters','honroMap','honroElements','honroEnvironment','honroLandmarks','honroMapAnchors','honroPlayBounds','honroTerrainBounds','honroSurfaceZones','honroCamera','width','height','heroes','projectiles','queue','wind','honroStaging','encounter','enemyLimit','honroActiveLimit','honroStory','teamEnds','fields','zones','stakes','honroFerrySpec','honroFerryRevision','honroFerryPopulationCap'].map(k=>[k,b[k]])));
