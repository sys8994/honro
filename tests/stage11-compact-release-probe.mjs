/** Controlled production-App launch + physical chapter11 release probe.
 * Spatial/action fixtures and projectile-only stepping are disclosed. No normal
 * gameplay, kill pacing, north warning timing or browser approval is claimed. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {createCompactProject} from '../tools/map-forge/stage11-compact-project.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE,S=g.HonroAct23V4Chapter11;
g.HONRO_PROJECT=createCompactProject(g,g.HONRO_PROJECT,'B-open');
let app=h.load(h.profileThrough(10));app.launch(11);h.finish(app);app.close();
const e=app.engine,b=e.b,u=b.units.find(u=>u.id==='p-archer'),spec=b.honroV4Chapter11,host=e.unit(spec.host),next=e.unit(spec.other),initial=plain(b),shots=[];
const declaredParty=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===11).units.filter(v=>v.team==='player').map(v=>({id:v.id,x:v.x,y:v.y}));
const launchedParty=b.units.filter(v=>v.side===0).map(v=>({id:v.id,x:v.x,y:v.y}));
assert.deepEqual(plain(launchedParty),plain(declaredParty),'App launch must not correct prepared party spawns');
// A valid high firing pose isolates shot/release behavior from route traversal.
Object.assign(u,{x:spec.high.x,y:spec.high.y,vx:0,vy:0,airborne:false,jumping:false});
assert(C.validTerrainContactPose(b.terrain,u));
const startHP=host.hp;
const maxShots=Number(process.env.HONRO_RELEASE_MAX_SHOTS||3);
assert(Number.isInteger(maxShots)&&maxShots>=1&&maxShots<=8);
for(let index=0;index<maxShots&&host.hp>0;index++){
 let shot;
 for(const power of [.2,.35,.5,.65,.8,1]){for(let angle=-75;angle<=80;angle+=2){const p=e.predict(u,C.SKILLS.A01,angle,power,host,false);if(p.unit===host.id){shot={angle,power};break;}}if(shot)break;}
 if(!shot){shots.push({index,error:'No sampled A01 window against host in actual full roster'});break;}
 // Re-arm only the action boundary for independent projectile repetitions.
 // HP, MP, equipment, enemy poses, damage and chapter memory are never assigned.
 Object.assign(b,{side:0,phase:'aim',active:u.id});u.acted=false;
 const before=host.hp,fired=e.fire('A01',shot.angle,shot.power);let ticks=0;
 while(b.projectiles.length&&ticks++<3600)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 shots.push({index,...shot,fired,before,after:host.hp,damage:before-host.hp,ticks});
}
const state={initialHostHP:startHP,hostAfterShots:host.hp,hostKilledByRealShots:host.hp<=0,shots,cap:g.HonroEncounters.populationCap(b),nextInitial:{x:next.x,y:next.y,hp:next.hp},release:null};
if(host.hp<=0){
 Object.assign(b,{side:0,phase:'aim',active:u.id});u.acted=false;
 let ticks=0;const track=[];
 for(;ticks<2400&&!S.memory(b).release.attached;ticks++){
  S.tick(app,.025);e.stepUnits(.025);
  const r=S.memory(b).release;if(ticks%80===0)track.push({ticks,distance:r.distance,ghost:r.ids[0]&&{x:e.unit(r.ids[0])?.x,y:e.unit(r.ids[0])?.y},safe:g.HonroAct23V4.safe(app)});
 }
 state.release={...plain(S.memory(b).release),ticks,track,liveEnemyCount:b.units.filter(v=>v.side===1&&v.hp>0&&!v.dead).length,spawned:b.units.filter(v=>v.honroSpawnSource==='reviewed.11.beast-spirit').map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp}))};
 for(let i=0;i<40&&!S.memory(b).north.warned;i++){g.HonroAct23V4.tick(app,.025);if(app.dialogue)h.finish(app);S.tick(app,.025);}
 const warning=S.memory(b).north;
 state.north={warned:!!warning.warned,warningHeroMaxX:Math.max(...g.HonroAct23V4.heroes(b).map(v=>v.x)),plannedTriggerX:spec.northTriggerX,prematureByCompactTrigger:!!warning.warned&&g.HonroAct23V4.heroes(b).every(v=>v.x<spec.northTriggerX)};
 for(let i=0;i<30;i++){g.HonroAct23V4.tick(app,.025);if(app.dialogue)h.finish(app);S.tick(app,.025);if(Object.keys(S.memory(b).north.offered).length)break;}
 if(Object.keys(S.memory(b).north.offered).length){const before=plain(S.memory(b).north),defended=e.wait();S.tick(app,.025);const after=S.memory(b).north;Object.assign(state.north,{offeredBefore:before.offered,endedBefore:before.ended,defended,endedAfter:plain(after.ended),admitted:!!after.admitted,ids:plain(after.ids),spawned:b.units.filter(v=>v.honroSpawnSource==='reviewed.11.north-pair').map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),liveAfter:b.units.filter(v=>v.side===1&&v.hp>0&&!v.dead).length,cumulativeSpawned:b.units.filter(v=>/^reviewed\.11\./.test(v.honroSpawnSource||'')).length});}
}
const result={scope:'Controlled valid high-archer pose, up to three real A01 projectiles at original full host HP, repeated action-boundary resets; direct physical tick/stepUnits after actual death. No memory/HP/MP/damage/ghost-coordinate injection. Not normal turn-by-turn combat or whole-stage progress.',candidate:'B-open',stageHash:hash(g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===11)),physicalSourceHash:hash(await readFile('shared/runtime/act23-v4-ch11-scenes.js','utf8')),initialSnapshotHash:hash(initial),...state,northWarningTimingValidated:false,northLimitation:'Current shared runtime still checks x>2200 or high-pose proximity; planned northTriggerX3900 is not consumed yet. No timing acceptance claimed.',passedPhysicalRelease:!!state.release?.attached&&state.release.distance>=40&&state.release.spawned.length===1};
result.maxShots=maxShots;
result.partySpawnUnchanged=true;result.initialScene={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,scope:'App initial scene fields with renderer double; not visible camera/crop approval'};
result.scope=result.scope.replace('up to three','up to '+maxShots);
result.northLimitation='This high-archer release fixture does not traverse to the planned north trigger. Separate northern initial-pose fixture tests warning/action/admission; whole-stage timing remains unverified.';
await mkdir('_local/reports/act2-redesign-20261109/compact-release',{recursive:true});await writeFile('_local/reports/act2-redesign-20261109/compact-release/result-max'+maxShots+'.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
assert.equal(result.cap,24);
