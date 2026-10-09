// State-fixture coverage of authored combat. This is not a normal-input clear.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage11RavineEncounters,RAVINE_ENCOUNTERS,RAVINE_INITIAL,RAVINE_INITIAL_ELITES,RAVINE_RESPONSE_COUNT,RAVINE_POPULATION_CAP} from '../tools/map-forge/stage11-ravine-encounters.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,checks=[];
const history=JSON.parse(await readFile('tests/fixtures/stage11-ravine-encounter-history.json','utf8'));
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
assert(g.HonroStage11RavineEncounters,'Stage 11 runtime must be in the common bundle');
const project=g.HONRO_PROJECT,st=project.stages[10];
const make=()=>{const q=battlefield(g,11);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
const responses=b=>b.honroEvents.filter(e=>e.honroStage11Response===1);
const finishTrigger=(b,ev)=>{const a=g.HonroAct2.memory(b),t=ev.honroRavineTrigger;if(t.objectiveDone)a.done[t.objectiveDone]=true;if(t.fallbackDone)a.done[t.fallbackDone]=true;};
const boundary=q=>{q.app.actorBoundary=q.e.active.id;q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;g.HonroMission.tick(q.app,0);};
check('exact 44 plus host spirit, 9 named elites, 8 places with 13 independent cells and four enemy actions',()=>{
 const {b,e}=make(),normal=e.alive(1).filter(u=>!u.id.startsWith('resident-spirit-'));
 assert.equal(normal.length,RAVINE_INITIAL);assert.equal(e.alive(1).length,45);assert.equal(normal.filter(u=>u.elite).length,RAVINE_INITIAL_ELITES);assert.equal(normal.filter(u=>u.honroAct2Elite).length,9);assert.equal(b.enemyLimit,4);
 assert.equal(st.encounters.length,13);assert.equal(new Set(normal.map(u=>u.group)).size,13);assert.equal(new Set(normal.map(u=>u.honroRavinePlace)).size,8);assert.equal(new Set(normal.map(u=>u.honroVariant)).size,8);
 assert(!normal.some(u=>['human','possessedGuard','possessedArcher','mourner'].includes(u.honroVariant)));
 assert.equal(g.HONRO_BALANCE.stages[10].initialEnemies,44);assert.equal(g.HONRO_BALANCE.stages[10].maxAlive,64);
 for(const q of RAVINE_ENCOUNTERS){assert(q.purpose.length>25);assert.equal(normal.filter(u=>u.honroRavinePlace===q.id).length,q.members.length);}
 for(const kind of new Set(normal.map(u=>u.honroVariant))){const ordinary=normal.filter(u=>u.honroVariant===kind&&!u.elite);assert.equal(new Set(ordinary.map(u=>u.combatBaseHp.toFixed(8))).size,ordinary.length?1:0,kind+' has no hidden index-based HP promotion');}
});
check('every body has exact exposed support or clear air, no overlaps and protected entry/resident space',()=>{
 const {b,e}=make(),foes=e.alive(1),resident=b.units.find(u=>u.honroProtected);
 for(const u of foes){const flying=!!g.HonroWorld.archetypes[u.honroVariant]?.flying;
  if(flying)assert(!g.HonroTerrain.intersects(b,u),u.id+' airborne body');else assert(C.validTerrainContactPose(b.terrain,u),u.id+' ground contact');
  if(u.honroStage11Encounter){assert(b.terrain.some(t=>t.id===u.honroEncounterSupport));assert(Math.hypot(u.x-resident.x,u.y-resident.y)>400,u.id+' respects rescue space');}
  assert(e.heroesAlive().every(h=>Math.hypot(h.x-u.x,h.y-u.y)>400),u.id+' respects party entry');
 }
 for(let i=0;i<foes.length;i++)for(let j=i+1;j<foes.length;j++)assert(Math.abs(foes[i].x-foes[j].x)>=foes[i].r+foes[j].r||Math.abs(foes[i].y-foes[j].y)>=Math.min(foes[i].h,foes[j].h),foes[i].id+'/'+foes[j].id+' overlap');
 const xs=foes.map(u=>u.x).sort((a,b)=>a-b),gaps=xs.slice(1).map((x,i)=>x-xs[i]);assert(Math.max(...gaps)>600);assert(gaps.filter(x=>x<300).length>foes.length/2);
});
check('authoring is deterministic and does not change any of the other 29 stages',()=>{
 const copy=plain(project),other=JSON.stringify(copy.stages.filter(s=>s.metadata.stageId!==11));authorStage11RavineEncounters(g,copy);
 assert.equal(JSON.stringify(copy.stages.filter(s=>s.metadata.stageId!==11)),other);assert.deepEqual(copy.stages[10].units,plain(st.units));assert.deepEqual(copy.stages[10].events,plain(st.events));
 const once=plain(copy);authorStage11RavineEncounters(g,copy);assert.deepEqual(copy,once);
});
check('five difficulties preserve exact places/elites and single difficulty multipliers',()=>{
 const normal=make().e.alive(1).map(u=>[u.id,u.x,u.y,u.elite]);
 for(const name of Object.keys(C.DIFFICULTIES)){const profile=C.defaults();profile.settings.difficulty=name;const {b,e,st:content}=battlefield(g,11,{profile});
  assert.deepEqual(e.alive(1).map(u=>[u.id,u.x,u.y,u.elite]),normal);assert.equal(b.enemyLimit,4);
  const d=C.DIFFICULTIES[name];for(const u of e.alive(1)){assert(Math.abs(u.maxHp-Math.round(u.combatBaseHp*d.hp))<=1,u.id+' one HP multiplier');assert(Math.abs(u.attack-u.combatBaseAttack*d.damage)<1e-8);}
  assert.equal(g.HonroDifficulty.audit(content,b).reinforcements,19);
 }
});
check('occupied response entry retries atomically; no half-group, immediate spawn or consumed source',()=>{
 const q=make(),ev=responses(q.b)[0],u=q.e.active,old={x:u.x,y:u.y},action=ev.action.actions[0];finishTrigger(q.b,ev);u.x=action.x;u.y=action.y;
 const second=q.e.heroesAlive().find(v=>v!==u),oldSecond={x:second.x,y:second.y},alt=ev.action.honroRavineAlternatives[0][0];Object.assign(second,{x:alt.x,y:alt.y});
 const n=q.b.units.length,next=q.b.nextId;q.app.actorBoundary=null;g.HonroMission.tick(q.app,0);assert(q.b.honroState.pendingEvents.includes(ev.id));assert.equal(q.b.units.length,n);
 boundary(q);assert.equal(q.b.units.length,n);assert.equal(q.b.nextId,next);assert(!q.b.honroState.flags['event:'+ev.id]);assert.equal(q.app.notices.filter(t=>t===ev.warning).length,1);
 Object.assign(u,old);Object.assign(second,oldSecond);boundary(q);assert(q.b.honroState.flags['event:'+ev.id]);assert.equal(q.b.units.filter(u=>u.honroSpawnSource===ev.id).length,3);
 assert(q.b.units.filter(u=>u.honroSpawnSource===ev.id).every(u=>u.honroCohort==='west'),'returning western pursuers are part of the west-clear objective');
});
check('blocked west/final entries preserve current objective, done flags and investigation order',()=>{
 for(const id of ['clear-west','clear-road']){const q=make(),a=g.HonroAct2.memory(q.b),ev=responses(q.b)[0],u=q.e.active,entry=ev.action.actions[0];
  for(const step of g.HonroAct2.steps(q.b)){if(step.id===id)break;a.done[step.id]=true;}
  for(const foe of q.e.alive(1))if(id==='clear-road'||foe.honroCohort==='west'){foe.hp=0;foe.dead=true;}
  if(id==='clear-road')for(const other of responses(q.b).slice(1))q.b.honroState.flags['event:'+other.id]=true;
  u.x=entry.x;u.y=entry.y;const alt=ev.action.honroRavineAlternatives[0][0],partner=q.e.heroesAlive().find(v=>v!==u);Object.assign(partner,{x:alt.x,y:alt.y});boundary(q);
  assert.equal(g.HonroAct2.current(q.b).id,id);assert(!a.done[id]);assert(!a.done.trace);const state=g.HonroAct2.state(q.b);assert.equal(state.complete,false);assert.equal(state.targets[0].id,id);assert.equal(state.allTargets.find(t=>t.id===id).done,false);
  assert.match(g.HonroObjectives.state(q.b,q.st).currentInstruction,/남은 편대 1/,'actual compact HUD explains the pending entry');
  const later=q.b.honroMarkers.find(m=>m.id===(id==='clear-west'?'knot-east':'trace'));assert.equal(g.HonroAct2.eligibility(q.app,later).ok,false);assert.equal(g.HonroAct2.use(q.app,later),false);
 }
});
check('compact HUD and world target retain the exact remaining western enemy count',()=>{
 const q=make();g.HonroAct2.memory(q.b).done['knot-west']=true;const state=g.HonroObjectives.state(q.b,q.st);assert.equal(state.currentObjectiveId,'clear-west');assert.match(state.currentInstruction,/남은 적 14/);assert.match(state.targets[0].label,/남은 적 14/);
});
check('all 13 responses use normal mission tick, warning before boundary, finite flags and tuned supported bodies',()=>{
 const q=make();assert.equal(responses(q.b).length,5);assert.equal(g.HonroEncounters.populationCap(q.b),RAVINE_POPULATION_CAP);
 for(const ev of responses(q.b)){finishTrigger(q.b,ev);q.app.actorBoundary=null;const n=q.b.units.length;g.HonroMission.tick(q.app,0);assert.equal(q.b.units.length,n);assert(q.b.honroState.pendingEvents.includes(ev.id));boundary(q);
  assert(q.b.honroState.flags['event:'+ev.id]);const born=q.b.units.filter(u=>u.honroSpawnSource===ev.id);assert.equal(born.length,g.HonroEncounters.spawnCount(ev.action));
  for(const u of born){assert(u.awake&&u.honroAct2Tuned&&u.honroStage11Response===ev.id);assert(u.xpBudget>0);const peer=q.b.units.find(v=>v.honroStage11Encounter&&v.honroVariant===u.honroVariant&&!v.elite);if(peer)assert(Math.abs(peer.combatBaseHp-u.combatBaseHp)<1e-7,'response has no hidden index-based HP promotion');const flying=!!g.HonroWorld.archetypes[u.honroVariant]?.flying;assert(flying?!g.HonroTerrain.intersects(q.b,u):C.validTerrainContactPose(q.b.terrain,u),u.id+' entry body');}
  const before=JSON.stringify(q.b);g.HonroEncounters.flush(q.app);assert.equal(JSON.stringify(q.b),before,'same boundary never duplicates');
 }
 assert.equal(q.e.alive(1).length,45+RAVINE_RESPONSE_COUNT);assert.equal(q.b.honroCounters.spawned,13);assert.equal(q.b.honroState.pendingEvents.length,0);assert.equal(q.b.enemyLimit,4);
 const hold=q.b.honroMarkers.find(m=>m.id==='hold-knots'),hero=q.e.active;hero.x=hold.x;hero.y=hold.y;
 for(let n=0;n<2;n++){q.b.round++;boundary(q);}assert.equal(g.HonroAct2.memory(q.b).holds['hold-knots'].spawned,6);assert.equal(q.e.alive(1).length,RAVINE_POPULATION_CAP);assert.equal(q.b.honroCounters.spawned,19);
 const echoes=q.b.units.filter(u=>u.honroSpawnSource?.startsWith('hold-knots-'));assert.equal(echoes.length,6);assert(echoes.some(u=>u.spawnX<hold.x-650)&&echoes.some(u=>u.spawnX>hold.x+650),'west and lower-east defense entries');
 for(const u of echoes)assert(u.honroAct2Tuned);const total=q.b.units.length;for(let n=0;n<8;n++){q.b.round++;boundary(q);}assert.equal(q.b.units.length,total,'no infinite respawns after finite budget');
});
check('saved pending and completed responses survive reattach without reset or duplicate spawn',()=>{
 const q=make(),ev=responses(q.b)[0];finishTrigger(q.b,ev);g.HonroMission.tick(q.app,0);const saved=plain(q.b),before=plain({units:saved.units,events:saved.honroEvents,pending:saved.honroState.pendingEvents,actors:saved.honroState.eventActors});
 const e=new C.Engine(saved,()=>{},true),app={...q.app,engine:e,actorBoundary:null,notices:[]};g.HonroStageRules.sanitizeStageBattle(saved);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);
 assert.deepEqual(plain({units:saved.units,events:saved.honroEvents,pending:saved.honroState.pendingEvents,actors:saved.honroState.eventActors}),before);
 boundary({b:saved,e,app});const born=saved.units.filter(u=>u.honroSpawnSource===ev.id);assert.equal(born.length,3);born[0].hp=1;
 const again=plain(saved),engine=new C.Engine(again,()=>{},true),resumed={...app,engine,actorBoundary:null};g.HonroAllies.attach(resumed,engine);g.HonroEncounters.attach(resumed,engine);g.HonroAct2.attach(resumed,engine);const snapshot=plain(again.units);boundary({b:again,e:engine,app:resumed});assert.deepEqual(plain(again.units),snapshot);
 assert.equal(again.units.find(u=>u.id===born[0].id).hp,1);assert.equal(again.units.filter(u=>u.honroSpawnSource===ev.id).length,3);
});
check('interleaved defense uses exactly its authored elite and never a hidden eleventh-ID promotion',()=>{
 const q=make(),a=g.HonroAct2.memory(q.b);for(const s of g.HonroAct2.steps(q.b)){if(s.id==='hold-knots')break;a.done[s.id]=true;}
 for(const ev of responses(q.b))q.b.honroState.flags['event:'+ev.id]=true;
 const m=q.b.honroMarkers.find(m=>m.id==='hold-knots');q.e.active.x=m.x;q.e.active.y=m.y;q.b.nextId=9;q.app.actorBoundary=null;g.HonroMission.tick(q.app,0);boundary(q);
 const echoes=q.b.units.filter(u=>u.honroSpawnSource==='hold-knots-0');assert.equal(echoes.length,3);assert.equal(echoes.filter(u=>u.elite).length,1);const ordinary=echoes.filter(u=>!u.elite);assert(Math.abs(ordinary[0].combatBaseHp-ordinary[1].combatBaseHp)<1e-7);assert.equal(ordinary[0].maxHp,ordinary[1].maxHp);
});
check('pre-ravine Stage 11 partial battle retains its old roster, places, HP, steps and event state',()=>{
 const currentPlan=g.HONRO_BALANCE.stages[10],oldProject={...project,stages:project.stages.map(s=>s.metadata.stageId===11?plain(history.stage):s)},profile=C.defaults();profile.recruited=['archer','mage','knight','occultist'];
 let old;try{g.HONRO_BALANCE.stages[10]=plain(history.balance);old=g.HonroMaps.createBattle(oldProject.stages[10],oldProject,profile,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(old);}finally{g.HONRO_BALANCE.stages[10]=currentPlan;}
 assert.equal(old.width,7800);assert.equal(old.units.filter(u=>u.side===1).length,19);assert(!g.HonroStage11RavineEncounters.active(old));assert.equal(responses(old).length,0);
 old.round=7;const hurt=old.units.find(u=>u.side===1);hurt.hp=7;old.units.find(u=>u.side===0).focus=3;g.HonroAct2.memory(old).done['knot-west']=true;
 // A real saved battle has already initialized engine awareness/intents.
 new C.Engine(old,()=>{},true);
 const saved=plain(old),contract=b=>plain({width:b.width,height:b.height,terrain:b.terrain,units:b.units,markers:b.honroMarkers,events:b.honroEvents,steps:b.honroAct2Steps,state:b.honroState,round:b.round,heroes:b.heroes,items:b.items}),before=contract(saved);
 const e=new C.Engine(saved,()=>{},true),app={engine:e,stage:g.HONRO_CONTENT.stages[10],profile,training:false,done:false,event(){},sayLines(){},checkMission(){return false;}};
 g.HonroStageRules.sanitizeStageBattle(saved);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);assert.deepEqual(contract(saved),before);
 assert.equal(saved.units.find(u=>u.id===hurt.id).hp,7);assert(!g.HonroStage11RavineEncounters.active(saved));assert.equal(g.HonroAct2.current(saved).id,'clear-west');
});
check('all-enemy clear never overlooks a pending entry or a surviving response and final completion is finite',()=>{
 const q=make(),a=g.HonroAct2.memory(q.b);for(const s of g.HonroAct2.steps(q.b))a.done[s.id]=true;
 assert.equal(g.HonroAct2.state(q.b).complete,false);for(const u of q.e.alive(1)){u.hp=0;u.dead=true;}let state=g.HonroAct2.state(q.b);assert.equal(state.complete,false);assert.match(state.summary,/남은 편대 5/);assert(state.targets[0].x>0);
 for(const ev of responses(q.b))q.b.honroState.flags['event:'+ev.id]=true;assert.equal(g.HonroAct2.state(q.b).complete,true);
});
check('protected resident still needs host-spirit weakening and Sodan extraction',()=>{
 const q=make(),a=g.HonroAct2.memory(q.b),m=q.b.honroMarkers.find(m=>m.id==='resident'),host=q.e.unit(m.target),spirit=q.e.unit(m.spiritId),sodan=q.e.heroesAlive().find(u=>u.cls==='occultist');
 for(const step of g.HonroAct2.steps(q.b)){if(step.id==='resident')break;a.done[step.id]=true;}q.b.active=sodan.id;
 for(const u of q.e.alive(1))if(u!==spirit&&Math.hypot(u.x-m.x,u.y-m.y)<360){u.hp=0;u.dead=true;}
 const hp=host.hp;q.e.hurt(host,100000,sodan.id);assert.equal(host.hp,hp);assert.equal(g.HonroAct2.eligibility(q.app,m).ok,false);spirit.hp=Math.floor(spirit.maxHp*.4);assert.equal(g.HonroAct2.eligibility(q.app,m).ok,true);assert(g.HonroAct2.use(q.app,m));assert(spirit.dead&&host.honroResolved&&!host.dead);assert.equal(host.hp,hp);
});
await mkdir('_local/reports/stage11-ravine',{recursive:true});await writeFile('_local/reports/stage11-ravine/encounters.json',JSON.stringify({checks,initial:45,authoredElites:9,places:8,activationCells:13,finiteResponses:13,defenseEchoes:6,totalEnemyBudget:64,active:4,scope:'Production state/geometry/save fixtures. Not a normal-input playthrough, performance result or art approval.'},null,2)+'\n');
