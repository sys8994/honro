/** Event/pose fixtures for each exact finite wave, with all forty initial enemies
 * alive. Mission completion flags, hero poses and the settled escape hull are
 * declared setup; warning, defend, atomic entry, AI, shots and damage are real.
 * This is not ordinary arrival/fullplay, visual quality or browser evidence. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage23LoadingYard} from '../tools/map-forge/stage23-loading-yard.mjs';
import {applyStage30Ferry} from '../tools/map-forge/stage30-ferry.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,A=g.HonroAct3,D=g.HonroEncounterDensity;
let p=await authorStage23LoadingYard(g,g.HONRO_PROJECT,{roster:'density40e10',art:false});p=applyStage30Ferry(g,p,{roster:'density40e10'});g.HONRO_PROJECT=p;
const scenarios=[
 {stage:23,source:'act3-response-23-0',support:'sy-ground',xs:[1150,1220,1300,1380]},
 {stage:23,source:'act3-response-23-1',support:'sy-ground',xs:[3110,3190,3270,3370]},
 {stage:23,source:'act3-response-23-2',support:'sy-stone-bridge',xs:[5500,5600,5700,5800]},
 {stage:30,source:'act3-response-30-0',support:'sf-west-ford',xs:[1840,1920,2000,2080]},
 {stage:30,source:'act3-response-30-1',support:'sf-ferry-court',xs:[5350,5430,5510,5590]},
 {stage:30,source:'act3-ferry-hold',support:'sf-ferry-court',xs:[5350,5430,5510,5590]},
 {stage:30,source:'act3-response-30-2',support:'sf-settled-barge',xs:[7100,7190,7280,7380]},
 {stage:30,source:'act3-response-30-1',support:'sf-settled-barge',xs:[6880,6980,7080,7180],case:'east-door-retreat',direct:true}
];
const rows=[];
for(const scene of scenarios.filter(s=>!process.argv[2]||s.source===process.argv[2])){
 const {stage,source,support,xs}=scene,{b,e,app}=battlefield(g,stage),S=stage===23?g.HonroStage23Escort:g.HonroStage30Ferry;
 g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);A.attach(app,e);
 assert.equal(e.alive(1).length,40);assert.equal(b.enemyLimit,3);assert.equal(b.honroDensityQueueReserve,1);
 if(support==='sf-settled-barge')for(const list of[b.terrain,b.honroWorldTerrain])for(const t of list){if(t.id==='sf-settled-barge')t.broken=false;if(t.id==='sf-outbank-screen')t.broken=true;}
 const floor=b.terrain.find(t=>t.id===support);
 for(const[i,u]of e.heroesAlive().entries()){u.x=xs[i];u.y=C.topAt(floor,xs[i]);assert(C.validTerrainContactPose(b.terrain,u),source+' supported hero');assert(!b.units.some(v=>v!==u&&Math.abs(u.x-v.x)<u.r+v.r&&u.y>v.y-v.h&&u.y-u.h<v.y),source+' fixture overlaps '+u.id);}
 const a=A.memory(b),at=(stage===23?b.honroEscortYardSpec:b.honroFerrySpec).entries[source],notices=[],playerResponses=[],actions=[],shots=[],damage=[],queues=[],known=new Set(b.units.map(u=>u.id));
 const note=app.event.bind(app);app.event=text=>{notices.push({round:b.round,serial:b.honroState.actorTurnSerial||0,text});note(text);};
 for(const ev of b.honroEvents)if(ev.id!==source)b.honroState.flags['event:'+ev.id]=true;
 if(scene.direct){assert(D.spawnMembers(app,{source,n:at.members.length},at));}
 else{
  const ev=b.honroEvents.find(v=>v.id===source);if(ev?.when.objectiveDone)a.done[ev.when.objectiveDone]=true;
  if(stage===23){a.done['dispatch-bundle']=true;if(source.endsWith('-2'))a.done['carrier-start']=true;}
  else{a.done['transport-map']=true;a.holds['ferry-hold']={progress:source.endsWith('-2')?3:0,spawned:source==='act3-ferry-hold'?0:3,lastEnemyEnd:0};}
  A.tick(app,0);assert(S.memory(b).warnings[source],source+' actual warning');assert(!b.units.some(u=>u.honroSpawnSource===source),'No appearance on the warning boundary');
  assert(e.canAct());const u=e.active;playerResponses.push({actorId:u.id,round:b.round,kind:'defend',x:u.x,y:u.y,detail:'Actual wait/defend after the visible warning, with all initial enemies retained.'});e.wait();assert.equal(b.phase,'review');
  for(let f=0;f<300&&!b.units.some(u=>u.honroSpawnSource===source);f++)e.tick(C.STEP);
  assert(S.memory(b).warnings[source].opportunity,'The player action is the recorded opportunity');
  assert(S.memory(b).entries[source],source+' atomic event entry');
 }
 const entryWarning=plain(S.memory(b).warnings[source]||null),entryRecord=plain(S.memory(b).entries[source]||null);const born=b.units.filter(u=>!known.has(u.id)),ids=new Set(born.map(u=>u.id)),initial=plain(born),births=born.map(u=>({id:u.id,round:b.round,source:u.honroSpawnSource,kind:u.honroVariant,role:u.honroEncounterRole,x:u.x,y:u.y,support:u.honroEncounterSupport,elite:!!u.elite}));
 assert.equal(born.length,at.members.length);assert(born.every(u=>u.honroSpawnSource===source));assert.equal(e.alive(1).length,40+born.length);
 const fire=e.fire.bind(e),hurt=e.hurt.bind(e),finish=e.finishAction.bind(e),switcher=e.switchTeam.bind(e);
 e.fire=(skill,angle,power,...rest)=>{const u=e.active,r=fire(skill,angle,power,...rest);if(ids.has(u?.id)&&r)shots.push({actorId:u.id,round:b.round,kind:'fire',skill,angle,power,x:u.x,y:u.y,role:u.honroEncounterRole});return r;};
 e.hurt=(u,n,owner,...rest)=>{const hp=u.hp,shield=u.shield||0,r=hurt(u,n,owner,...rest);if(ids.has(owner)&&(hp>u.hp||shield>(u.shield||0)))damage.push({actorId:owner,targetId:u.id,targetSide:u.side,round:b.round,hp:hp-u.hp,shield:shield-(u.shield||0),x:u.x,y:u.y});return r;};
 e.finishAction=(...args)=>{const u=e.active,was=u?.acted,r=finish(...args);if(ids.has(u?.id)&&!was&&u.acted)actions.push({actorId:u.id,round:b.round,kind:u.intent||'enemy-action',x:u.x,y:u.y,targetId:u.aiMove?.targetId||null,role:u.honroEncounterRole});return r;};
 e.switchTeam=(...args)=>{const r=switcher(...args);if(b.side===1){assert(b.queue.length<=3);queues.push({round:b.round,ids:[...b.queue]});}return r;};
 const start=b.round;let frames=0;
 for(;frames<18000&&b.round<start+3&&!['won','lost'].includes(b.phase);frames++){if(e.canAct()){const u=e.active;playerResponses.push({actorId:u.id,round:b.round,kind:'defend',x:u.x,y:u.y,detail:'Hold the supported fixture position using the actual defensive action.'});e.wait();}e.tick(C.STEP);}
 if(entryWarning?.opportunity)assert.deepEqual(plain(S.memory(b).warnings[source].opportunity),entryWarning.opportunity,'First offered opportunity stays immutable after spawn and later actual actions');
 const effective=damage.filter(v=>v.targetSide===0&&(v.hp>0||v.shield>0));
 const row={...scene,method:scene.direct?'Direct existing-wave tactical retreat fixture':'Real warning/defend/event entry from declared objective and pose setup',initialAlive:40,initial,notices,warning:entryWarning,entry:entryRecord,births,frames,round:b.round,phase:b.phase,playerResponses,actions,shots,damage,queues,firstFire:shots[0]||null,firstEffect:effective[0]||null,effectiveCount:effective.length,final:born.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,lastAct:u.lastAct,role:u.honroEncounterRole,intent:u.intent}))};
 rows.push(row);
 // Persist a failure as well as successes; no ineffective wave is a pass.
 await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage2330-response-pressure.json',JSON.stringify({sourceHash:hash(p),controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),scope:'All initial enemies retained. Supported hero poses, completion flags and settled hull are explicit fixtures; no arrival/fullplay/browser claim.',rows},null,2)+'\n');
 assert.equal(b.round,start+3,source+' completes three real enemy turns');assert(shots.length,source+' first effective firing turn must not remain empty');assert(effective.length,source+' actual party pressure within three enemy turns');
 if(source==='act3-response-30-2')assert(shots.some(s=>s.role==='landing-response-command'&&s.skill==='LA01'),'The exposed elite archer performs its authored ranged role');
 if(scene.case==='east-door-retreat')assert(shots.some(s=>s.role==='quay-entry-command'&&s.skill==='LS09'),'The eastern command guard covers the low retreat');
 console.log('PASS',stage,source,scene.case||support,'shots',shots.length,'party pressure',effective.reduce((n,v)=>n+v.hp+v.shield,0));
}
