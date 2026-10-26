(function(G){'use strict';
// Private Phase A authoring only. This module never opts a production map in.
const V=G.HonroAct23V4, BOSS='stage29-hantaerok', COVER='stage29-fallen-door', ECHO='stage29-echo';
const IDS=['stage29-boss','stage29-cover','stage29-cohort',ECHO,'route-exit'];
const SCREEN=['stage29-shield-0','stage29-shield-1','stage29-upper-0','stage29-upper-1'];
const COMMAND_WAVES={'stage29-rear':2,'stage29-vault-echo':2};
const alive=u=>!!u&&!u.dead&&u.hp>0;
const active=b=>b?.honroStage===29&&!b.honroCustom&&b.honroAct23V4Revision===1;
const mem=b=>{const m=V.mem(b);return m.stage29??={version:1,phase:1,sources:{},checkpoints:[]};};
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
const foes=b=>b.units.filter(u=>u.side===1&&alive(u)&&!u.honroSubdued);
const mark=(b,id)=>b.honroMarkers?.find(m=>m.id===id);
const boss=b=>b.units.find(u=>u.id===BOSS);
const near=(u,m,r=180)=>!!m&&Math.abs(u.y-m.y)<=150&&Math.hypot(u.x-m.x,(u.y-m.y)*.75)<=r;
const serial=b=>b.honroState.actorTurnSerial||0;
const end=b=>b.teamEnds?.[1]||0;
function checkpoint(b,id,data={}){const m=mem(b);if(m.checkpoints.some(c=>c.id===id))return;m.checkpoints.push({id,round:b.round,serial:serial(b),...data});}
function author(map){
 map.initialState??={};if(map.initialState.honroStage29BossRevision===1)return;
 const state=map.initialState;state.honroStage29BossRevision=1;
 state.honroV4Steps=IDS.map(id=>({id,kind:id===ECHO?'interact':id==='route-exit'?'route':'stage29'}));
 state.honroRouteSpec={revision:1,toStage:30,common:IDS.slice(0,-1),routes:[{id:'A',markerId:'route-upper-exit',requiresDone:[]},{id:'B',markerId:'route-lower-exit',requiresDone:[]}]};
 // The old ghost defence budget and response budgets are explicitly owned here,
 // rather than inheriting automatic old-seal/letter triggers or receipts.
 state.honroV4Stage29Waves=[
  {id:'stage29-rear',required:true,phase:2,kind:'possessedGuard',n:2,x:2120,y:2480,spacing:105,maxDistance:380},
  {id:'stage29-vault-echo',required:true,phase:2,kind:'ghost',n:2,x:3500,y:2220,spacing:140,maxDistance:380},
  {id:'act3-response-29-0',required:false,phase:2,kind:'archiveFiend',n:2,x:2350,y:2350.188679245283,spacing:150,maxDistance:380},
  {id:'act3-response-29-1',required:false,phase:3,kind:'possessedGuard',n:3,x:4710,y:1840,spacing:150,maxDistance:380},
  {id:'act3-response-29-2',required:false,phase:3,kind:'possessedArcher',n:2,x:6100,y:2760,spacing:150,maxDistance:380}
 ];
 map.events=[];
 map.markers=map.markers.filter(m=>!['old-seal','wave-old-seal','hyeonmuk-letter','wave-flight-hold','route-exit'].includes(m.id));
 for(const [id,x,y]of [['stage29-boss',3520,2220],['stage29-cover',3105,2220],['stage29-cohort',3500,2220],[ECHO,2830,2220],['route-exit',3690,2263.2]])map.markers.push({id,type:'act3',action:'act3',x,y});
 for(const m of map.markers)if(['route-upper-exit','route-lower-exit'].includes(m.id))delete m.label;
 const records=[
  {id:BOSS,kind:'possessedGuard',x:3520,y:2220,boss:true,stageOverrides:{honroMidboss:true,honroStage29Boss:true,name:BOSS,armor:.2,fixed:true}},
  {id:'stage29-shield-0',kind:'possessedGuard',x:3260,y:2220,stageOverrides:{role:'guard',armor:.26,loadout:['LS11','LS09'],ranks:{LS11:4,LS09:4}}},
  {id:'stage29-shield-1',kind:'possessedGuard',x:3350,y:2220,stageOverrides:{role:'guard',armor:.26,loadout:['LS11','LS09'],ranks:{LS11:4,LS09:4}}},
  {id:'stage29-upper-0',kind:'possessedArcher',x:2880,y:2020},
  {id:'stage29-upper-1',kind:'possessedArcher',x:3130,y:2020}
 ];
 for(const [i,r]of records.entries())map.units.push({...r,team:'enemy',facing:-1,spawnIndex:100+i,encounterGroup:i?'stage29-command-screen':'stage29-command',stageOverrides:{honroAct3Encounter:1,honroAct3Elite:false,honroCohort:i?'stage29-screen':'stage29-boss',honroStage29Required:true,honroStage29Source:i?'stage29-command-screen':'stage29-command',...r.stageOverrides}});
 map.encounters.push({id:'stage29-command',key:'stage29-command',behavior:'patrol',unitIds:[BOSS]},{id:'stage29-command-screen',key:'stage29-command-screen',behavior:'patrol',unitIds:records.slice(1).map(r=>r.id)});
 // Reserve the fallen silhouette in both terrain views from the start. Broken
 // geometry has no collision until the atomic topology transition below.
 map.terrains.push({id:COVER,name:COVER,type:'solid',points:[{x:3030,y:2188},{x:3182,y:2188},{x:3182,y:2220},{x:3030,y:2220}],baseMaterial:'wood',oneWay:false,breakable:false,layer:'terrain',properties:{broken:true,honroStage29Cover:true,honroWalkEdges:[0],surfaceKind:'wood'}});
}
function prepare(b){if(!active(b))return;const m=mem(b);m.sources??={};m.checkpoints??=[];
 if(!m.prepared){const u=boss(b);if(u){u.armor=Math.max(.2,u.armor||0);G.HonroProgression?.tuneMidboss(b,G.HONRO_CONTENT.stages[28],u);u.name=BOSS;}
  for(const id of ['stage29-shield-0','stage29-shield-1']){const u=b.units.find(u=>u.id===id);if(u)u.armor=Math.max(.26,u.armor||0);}m.prepared=true;}
}
const paused=app=>app.dialogue||app.modal?.classList.contains('open')||app.done||['won','lost'].includes(app.engine.b.phase);
const safe=app=>!!app.actorBoundary&&!paused(app)&&!(app.engine.b.projectiles||[]).length&&(!V.safe||V.safe(app));
function warning(app,id){const b=app.engine.b,m=mem(b);if(m[id])return m[id];const w=m[id]={serial:serial(b),round:b.round,enemyEnd:end(b),actor:app.actorBoundary||b.active,offered:{},heroes:heroes(b).map(u=>u.id)};V.slot(app,id,{phase:m.phase});app.engine.fx?.('ring',3106,2110,'#d8b57d',100);app.dirty=true;return w;}
function opportunity(app,w){const b=app.engine.b;if(!safe(app))return false;
 if(serial(b)>w.serial||b.round>w.round||end(b)>w.enemyEnd){if(w.heroes.includes(app.actorBoundary))w.offered[app.actorBoundary]=true;}
 // An elapsed enemy turn implies the previous living player team had its full
 // action opportunity, including companions whose turn was voluntarily ended.
 return end(b)>w.enemyEnd||w.heroes.filter(id=>alive(b.units.find(u=>u.id===id))).every(id=>w.offered[id]);
}
function overlaps(rect,x,y,r=0,h=0){return x+r>rect.x&&x-r<rect.x+rect.w&&y>rect.y&&y-h<rect.y+rect.h;}
function coverBlockers(b){const r={x:3022,y:2012,w:168,h:216},out=[];
 for(const u of b.units)if(alive(u)&&!u.eaterCapturedBy&&overlaps(r,u.x,u.y,u.r||24,u.h||96))out.push(u.id);
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>b.round)&&overlaps(r,s.x,s.y+6,24,80))out.push('stake:'+s.id);
 for(const p of b.projectiles||[])if(overlaps(r,p.x,p.y+(p.radius||p.r||8),p.radius||p.r||8,(p.radius||p.r||8)*2))out.push('projectile:'+p.id);
 return out;
}
function commitCover(app){const b=app.engine.b,m=mem(b);if(m.coverCommitted)return true;const w=warning(app,'stage29-cover-warning');if(!opportunity(app,w))return false;
 m.coverBlockers=coverBlockers(b);if(m.coverBlockers.length)return false;
 const lists=[b.terrain,...(b.honroWorldTerrain?[b.honroWorldTerrain]:[])];
 if(lists.some(list=>!list.some(t=>t.id==='old-door')||!list.some(t=>t.id===COVER)))return false;
 for(const list of lists){const door=list.find(t=>t.id==='old-door'),cover=list.find(t=>t.id===COVER);door.broken=true;door.hp=0;cover.broken=false;}
 m.coverCommitted=true;m.phase=2;m.phase2End=end(b);b.sceneVersion=(b.sceneVersion||0)+1;checkpoint(b,'stage29-cover-commit');if(alive(boss(b)))V.slot(app,'stage29-phase-2',{boss:BOSS});app.engine.fx?.('spark',3106,2200,'#c0ae86',75);app.engine.emit?.('save');app.dirty=true;return true;
}
function admit(app,spec){const b=app.engine.b,m=mem(b);if(m.sources[spec.id]?.admitted)return true;const w=warning(app,'stage29-warning:'+spec.id);if(!opportunity(app,w)||foes(b).length+spec.n>(b.honroAct3EncounterPopulationCap||43))return false;
 const before=new Set(b.units.map(u=>u.id));
 if(G.HonroAllies.execute(app,{...spec,type:'spawn',source:spec.id,act3Authored:true})===false)return false;
 const added=b.units.filter(u=>!before.has(u.id));m.sources[spec.id]={admitted:true,required:!!spec.required,ids:added.map(u=>u.id),round:b.round,serial:serial(b)};
 for(const u of added){u.honroCohort=spec.id;u.honroStage29Source=spec.id;u.honroStage29Required=!!spec.required;}
 b.honroState.flags['event:'+spec.id]=true;checkpoint(b,'stage29-source:'+spec.id);app.dirty=true;return true;
}
const defeated=u=>!!u&&(!alive(u)||u.honroSubdued||u.side!==1);
function commandCleared(b){
 // Ambient guards and the old route-pressure responses remain active threats,
 // but are not an extermination objective. Every commanded member must have
 // concrete admission and defeat proof; missing actors never count as dead.
 if(!SCREEN.every(id=>{const u=b.units.find(u=>u.id===id);return u?.honroStage29Required===true&&u.honroStage29Source==='stage29-command-screen'&&defeated(u);}))return false;
 return Object.entries(COMMAND_WAVES).every(([id,n])=>{const spec=b.honroV4Stage29Waves?.find(s=>s.id===id),source=mem(b).sources[id];
  return spec?.required===true&&spec.n===n&&source?.admitted===true&&source.ids?.length===n&&new Set(source.ids).size===n&&source.ids.every(unitId=>{const u=b.units.find(u=>u.id===unitId);return u?.honroStage29Required===true&&u.honroStage29Source===id&&defeated(u);});
 });
}
function cleared(b){return !!mem(b).death&&defeated(boss(b))&&!!mem(b).coverCommitted&&commandCleared(b);}
function stepSatisfied(b,s){if(!active(b))return null;const m=mem(b);
 if(s.id==='stage29-boss')return !!m.death;
 if(s.id==='stage29-cover')return !!m.coverCommitted;
 if(s.id==='stage29-cohort')return cleared(b);
 if(s.id===ECHO)return cleared(b)&&!!V.mem(b).sceneDone?.[ECHO];
 if(s.id==='route-exit')return !!b.honroRouteChoice?.selectedRoute&&cleared(b)&&!!V.mem(b).sceneDone?.[ECHO];
 return null;
}
function commitGoals(app){const b=app.engine.b;for(const id of IDS){const s=(b.honroAct3Steps||[]).find(s=>s.id===id);if(!s||!stepSatisfied(b,s))break;if(!G.HonroAct3.memory(b).done[id])V.completeStep(app,s);}}
function route(app){const b=app.engine.b;if(!cleared(b)||!V.mem(b).sceneDone?.[ECHO]||!safe(app)||b.honroRouteChoice?.selectedRoute)return false;
 const choices=(b.honroRouteSpec?.routes||[]).filter(r=>heroes(b).some(u=>near(u,mark(b,r.markerId)))),u=app.engine.unit(b.active),r=choices.find(r=>u&&near(u,mark(b,r.markerId)))||choices[0];if(!r)return false;
 b.honroRouteChoice={revision:1,selectedRoute:r.id,sourceRun:b.session,fromStage:29,toStage:30,exitId:r.markerId,round:b.round};mark(b,r.markerId).collected=true;checkpoint(b,'stage29-route',{route:r.id});commitGoals(app);app.dirty=true;return true;
}
function echoTick(app,dt){const b=app.engine.b,m=mem(b),s=m.echo;if(!s||s.done)return;let u=b.units.find(u=>u.id===s.actor);
 if(!alive(u)||!near(u,mark(b,ECHO),260)){u=heroes(b).find(u=>near(u,mark(b,ECHO),260));if(!u)return;s.actor=u.id;}
 if(!cleared(b)||(b.projectiles||[]).length)return;s.elapsed=Math.min(.9,(s.elapsed||0)+Math.max(0,Math.min(dt,.05)));u.honroScenePose={kind:'inspect',time:s.elapsed};
 if(s.elapsed>=.9){delete u.honroScenePose;s.done=true;V.ackSlot(b,ECHO,{kind:'world-gesture',actor:u.id,elapsed:s.elapsed});checkpoint(b,'stage29-echo-gesture');commitGoals(app);if(!app.checkMission?.(app.engine))app.engine.finishAction();app.dirty=true;}
}
function use(app,marker){const b=app.engine.b;if(!active(b))return;const id=marker?.id;if(id===ECHO){const u=app.engine.active;if(!cleared(b)||mem(b).echo?.done||paused(app)||!alive(u)||u.side!==0||u.summoned||u.enthrall||!near(u,mark(b,ECHO),260)||app.canInput&&!app.canInput())return false;V.slot(app,ECHO,{actor:u.id});mem(b).echo??={actor:u.id,elapsed:0};app.engine.fx?.('ring',2830,2170,'#a6bdca',52);app.dirty=true;return true;}
 if(['route-exit','route-upper-exit','route-lower-exit'].includes(id))return route(app);
 return false;
}
function tick(app,dt=0){const b=app.engine.b;if(!active(b)||paused(app))return;prepare(b);const m=mem(b),u=boss(b);if(!u)return;
 if(!alive(u)&&!m.death){m.death={round:b.round,serial:serial(b),x:u.x,y:u.y};m.earlyKill=m.phase<3;checkpoint(b,'stage29-boss-death',{early:m.earlyKill});
  for(const id of ['stage29-phase-1','stage29-phase-2','stage29-phase-3']){const s=V.mem(b).slots?.[id];if(s&&s.status!=='done'){s.status='cancelled';s.reason='stage29-boss-dead';}}
  V.slot(app,'stage29-boss-defeated',{early:m.earlyKill});}
 if(!m.engaged&&(m.death||u.hp<u.maxHp||heroes(b).some(h=>h.x>=2350))){m.engaged=true;m.engageEnd=end(b);checkpoint(b,'stage29-engaged');if(alive(u))V.slot(app,'stage29-phase-1',{boss:BOSS});}
 if(!m.engaged)return;
 if(m.phase===1&&(m.death||u.hp<=u.maxHp*.7||end(b)-m.engageEnd>=2||!b.units.some(v=>v.honroCohort==='stage29-screen'&&alive(v))))commitCover(app);
 if(m.phase===2&&(m.death||u.hp<=u.maxHp*.35||end(b)-m.phase2End>=2)){m.phase=3;checkpoint(b,'stage29-phase-3');if(alive(u)){u.fixed=false;u.awake=true;u.aggroUntil=999;V.slot(app,'stage29-phase-3',{boss:BOSS});}}
 for(const spec of b.honroV4Stage29Waves||[])if(spec.phase<=m.phase){if(!admit(app,spec))break;}
 // Shared Engine.walk owns every pixel, body collision and movement budget.
 // Only the boss's ordinary enemy turn can advance the third-phase command.
 if(m.phase===3&&alive(u)&&b.phase==='enemy'&&b.active===u.id&&!u.acted&&dt>0){u.fixed=false;u.awake=true;u.aggroUntil=999;const target=Math.max(3200,u.spawnX-300);if(u.x>target+8){const before=u.x;app.engine.walk(u,-1,Math.min(dt,.05),true);m.advanceDistance=(m.advanceDistance||0)+Math.max(0,before-u.x);}}
 echoTick(app,dt);commitGoals(app);route(app);
}
function stepTick(app,s,dt){if(active(app.engine.b)&&s.id==='route-exit')route(app);}
function state(b){if(!active(b))return null;const m=mem(b),done=G.HonroAct3.memory(b).done,current=IDS.find(id=>!done[id]);const targets=current==='route-exit'?['route-upper-exit','route-lower-exit'].map(id=>({...mark(b,id),kind:'exit'})):current?[{...mark(b,current),kind:current===ECHO?'interact':'objective'}]:[];
 return{complete:complete(b),objectiveReady:complete(b),minimumRound:1,settleRounds:0,summary:'',targets,allTargets:IDS.map(id=>({...mark(b,id),done:!!done[id]})),phase:m.phase};}
function failure(b){if(!active(b))return null;if(!boss(b))return'stage29-boss-source-missing';if(b.honroV4Stage29Waves?.length!==5)return'stage29-wave-source-missing';if(!b.terrain.some(t=>t.id===COVER)||!b.terrain.some(t=>t.id==='old-door'))return'stage29-cover-source-missing';return null;}
function complete(b){return active(b)&&cleared(b)&&!!V.mem(b).sceneDone?.[ECHO]&&!!b.honroRouteChoice?.selectedRoute;}
function attach(app,e){if(active(e.b))prepare(e.b);}
const plugin={author,prepare,attach,tick,state,failure,complete,use,stepSatisfied,stepTick,coverBlockers,ids:IDS,bossId:BOSS,active,memory:mem};
G.HonroAct23V4Stage29=plugin;V.register(29,plugin);
})(globalThis);
