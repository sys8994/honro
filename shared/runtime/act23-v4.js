(function(G){'use strict';
// Unreviewed Phase A mechanics are explicitly opt-in. No current manuscript is
// changed; candidate scenes carry stable slots until a reviewed script is bound.
const C=G.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x)),plugins=new Map();
const preview=()=>G.HONRO_ACT23_V4_PHASE_A===true;
const active=b=>!!b&&!b.honroCustom&&b.honroMapOrigin!=='workshop'&&b.honroAct23V4Revision===1&&b.honroStage>=11&&b.honroStage<=30;
const alive=u=>!!u&&!u.dead&&u.hp>0;
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&alive(u));
const approvedCommon=lines=>Array.isArray(lines)&&lines.length>0&&lines.every(row=>row?.[2]?.storyId==='act2:first-spirit-encounter');
const plugin=b=>plugins.get(b.honroStage);
function mem(b){b.honroState??={flags:{},collected:[]};const m=b.honroState.act23v4??={revision:1,done:{},holds:{},events:{},checkpoints:[],slots:{},sceneDone:{}};
 for(const key of ['done','holds','events','slots','sceneDone'])m[key]??={};m.checkpoints??=[];
 b.honroState[b.honroStage<=20?'act2':'act3']=m;return m;
}
const steps=b=>b.honroV4Steps||b.honroAct23V4Steps||[];
const marker=(b,id)=>b.honroMarkers?.find(m=>m.id===id||m.id==='marker-'+id);
const near=(u,p,r=260)=>!!u&&!!p&&Math.abs(u.y-p.y)<=150&&Math.hypot(u.x-p.x,(u.y-p.y)*.75)<=r;
function slot(app,id,context={}){const b=app.engine.b,m=mem(b);if(m.slots[id])return m.slots[id];const actor=context.actorId&&b.units.find(u=>u.id===context.actorId);
 return m.slots[id]={id,rowPrefix:'v4.'+b.honroStage+'.'+id,status:context.actorId&&!alive(actor)?'cancelled':'pending',context:clone(context),round:b.round,serial:b.honroState.actorTurnSerial||0};
}
function ackSlot(b,id,proof={}){const m=mem(b),s=m.slots[id];if(s?.status==='cancelled')return false;m.slots[id]??={id,rowPrefix:'v4.'+b.honroStage+'.'+id};Object.assign(m.slots[id],{status:'done',proof:clone(proof)});m.sceneDone[id]=true;return true;}
function safe(app){const e=app.engine,b=e?.b;return !!b&&!app.done&&!app.dialogue&&!app.charging&&!app.modal?.classList.contains('open')&&!G.document?.hidden&&!G.HonroAct3Void?.blocked(b)&&!['flight','review','summon','ally','won','lost'].includes(b.phase)&&!b.projectiles?.length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!e.settleBusy();}
function satisfied(b,s){const m=mem(b);if(m.done[s.id])return true;const custom=plugin(b)?.stepSatisfied?.(b,s);if(custom!==undefined&&custom!==null)return !!custom;
 const crossing=G.HonroStakeCrossing?.crossings(b).findIndex(q=>q.markerId===s.id)??-1;
 if(crossing>=0)return (b.honroStakeCrossing?.checkpointProgress?.index||0)>crossing;
 if(s.kind==='destroy')return !!G.HonroQuestTargets.records(b).find(t=>t.id===s.target||t.id===s.id)?.broken;
 if(s.kind==='defeat')return (s.defeatIds||[s.target]).every(id=>{const u=b.units.find(u=>u.id===id);return !!u&&!alive(u);});
 if(s.kind==='hold')return (m.holds[s.id]?.progress||0)>=(s.rounds||1);
 if(s.kind==='evidence'&&s.afterEvidence)return !!m.done[s.afterEvidence];
 if(s.kind==='route')return !!b.honroRouteChoice?.selectedRoute;
 return false;
}
const current=b=>steps(b).find(s=>!s.optional&&!satisfied(b,s));
function readySteps(b){const s=current(b);return steps(b).filter(q=>!satisfied(b,q)&&(q.optional||q.id===s?.id||s?.parallelGroup&&q.parallelGroup===s.parallelGroup)&&(q.requiresDone||[]).every(id=>!!mem(b).done[id]));}
function completeStep(app,s,actor){const b=app.engine.b,m=mem(b);if(m.done[s.id])return false;m.done[s.id]=true;m.checkpoints.push({id:s.id,round:b.round,enemyEnd:b.teamEnds?.[1]||0});const p=marker(b,s.id);if(p)p.collected=true;
 if(s.opens)for(const list of [b.terrain,b.honroWorldTerrain]){const t=list?.find(t=>t.id===s.opens);if(t)t.broken=true;}
 G.HonroObjectiveContributions?.interact(b,s.id,actor,{rescue:s.kind==='rescue'});slot(app,'objective:'+s.id,{actorId:actor?.id});b.sceneVersion++;app.dirty=true;return true;
}
function eligibility(app,m){const b=app.engine?.b,u=app.engine?.active;if(!active(b)||!alive(u)||u.side!==0||m.collected||!safe(app))return{ok:false,reason:m.id};const s=readySteps(b).find(s=>s.id===m.id);if(!s)return{ok:false,reason:current(b)?.id||m.id};
 const p=m.target?b.units.find(u=>u.id===m.target):m;if(!near(u,p,s.radius||260)||s.requiredClass&&u.cls!==s.requiredClass)return{ok:false,reason:s.id};const custom=plugin(b)?.eligibility?.(app,m,s);return custom??{ok:true,reason:s.id};
}
function use(app,m){const b=app.engine.b;if(!eligibility(app,m).ok)return false;const s=readySteps(b).find(s=>s.id===m.id),custom=plugin(b)?.use?.(app,m,s);if(typeof custom==='boolean')return custom;
 if(s.id==='family-manifest'&&G.HonroAct3Void?.beforeManifest?.(app,m))return false;
 if(s.kind==='v4-slot'&&s.slot){if(mem(b).slots?.[s.slot]?.status!=='pending')return false;if(!ackSlot(b,s.slot,{phaseA:true,actor:app.engine.active.id}))return false;completeStep(app,s,app.engine.active);app.engine.finishAction();return true;}
 if(!['interact','rescue'].includes(s.kind))return false;
 if(s.kind==='rescue'){const u=b.units.find(u=>u.id===s.target||u.id===m.target),spirit=b.units.find(u=>u.id===m.spiritId);if(!alive(u))return false;if(alive(spirit)){if(app.engine.active.cls!=='occultist')return false;G.HonroProgression.defeat(app.engine,spirit,app.engine.active);spirit.hp=0;spirit.dead=true;spirit.honroReleased=true;}u.honroResolved=true;}
 completeStep(app,s,app.engine.active);if(!app.checkMission?.(app.engine))app.engine.finishAction();return true;
}
function route(app,s){const b=app.engine.b,spec=b.honroRouteSpec;if(G.HonroAct23V4ReviewedChapters?.active(b)&&!G.HonroAct23V4ReviewedChapters.routeReady(b))return;if(!spec||!(spec.common||[]).every(id=>mem(b).done[id]))return;
 for(const r of spec.routes||[]){if(!(r.requiresDone||[]).every(id=>mem(b).done[id])||!(r.defeatIds||[]).every(id=>{const u=b.units.find(u=>u.id===id);return u&&(!alive(u)||u.side!==1);})||!(r.requiresTerrainOpen||[]).every(id=>G.HonroQuestTargets.records(b).some(t=>t.id===id&&t.broken))||!(r.requiresTerrainActive||[]).every(id=>G.HonroQuestTargets.records(b).some(t=>t.id===id&&!t.broken)))continue;
  if(!heroes(b).some(u=>near(u,marker(b,r.markerId),180)))continue;b.honroRouteChoice={revision:1,selectedRoute:r.id,sourceRun:b.session,fromStage:b.honroStage,toStage:spec.toStage,exitId:r.markerId,round:b.round};completeStep(app,s);return;
 }
}
function hold(app,s){const b=app.engine.b,m=mem(b),p=marker(b,s.id);if(!p)return;const h=m.holds[s.id]??={progress:0,lastEnemyEnd:b.teamEnds?.[1]||0,spawned:0,continuous:false},guarded=heroes(b).some(u=>(!s.requiredClass||u.cls===s.requiredClass)&&near(u,p,s.radius||400)),contested=b.units.some(u=>u.side===1&&!u.honroObjectiveTarget&&alive(u)&&near(u,p,s.contestRadius||230)),end=b.teamEnds?.[1]||0;
 if(end>h.lastEnemyEnd){if(h.continuous&&guarded&&!contested)h.progress++;h.lastEnemyEnd=end;}
 h.continuous=guarded&&!contested;h.guarded=guarded;h.contested=contested;
 if(guarded&&s.wave&&(h.spawned||0)<s.wave.count){const serial=b.honroState.actorTurnSerial||0;h.warning??={serial,offered:{}};const actor=app.engine.active;if(actor?.side===0&&!actor.acted)h.warning.offered[actor.id]=true;const ended=app.actorBoundary&&app.engine.unit(app.actorBoundary);if(ended?.side===0&&ended.acted&&h.warning.offered[ended.id]&&serial>h.warning.serial)h.warning.opportunity=true;
  slot(app,'warning:'+s.id,{source:'v4:'+s.id});if(h.warning.opportunity&&app.actorBoundary&&safe(app)){const w=marker(b,'wave-'+s.id);if(w){const ok=G.HonroAllies.execute(app,{type:'spawn',kind:s.wave.kind,n:s.wave.count-h.spawned,x:w.x,y:w.y,spacing:130,maxDistance:500,source:'v4:'+s.id});if(ok!==false)h.spawned=s.wave.count;}}}
}
function tick(app,dt){const b=app.engine?.b;if(!active(b)||!safe(app))return;mem(b);if(b.honroStage<=20)G.HonroAct2.firstSpiritEncounter?.(app,heroes(b));plugin(b)?.tick?.(app,dt);if(!safe(app))return;
 for(const q of steps(b)){if(mem(b).done[q.id])continue;if(q.optional&&!satisfied(b,q))continue;if(!satisfied(b,q))break;completeStep(app,q);}
 for(const s of readySteps(b)){plugin(b)?.stepTick?.(app,s,dt);const p=marker(b,s.id);if(s.kind==='hold')hold(app,s);else if(s.kind==='route')route(app,s);else if(s.kind==='reach'&&p){const group=heroes(b),cross=G.HonroStakeCrossing?.crossings(b).some(c=>c.markerId===s.id),isPair=['waterworks-exit','deep-depot-exit','workshop-exit'].includes(s.id),everyone=s.allHeroes||isPair||cross;
   if(s.id==='party-reunion'&&!app.actorBoundary)continue;if(cross&&!G.HonroStakeCrossing.allowsStep(b,s.id))continue;if((isPair||s.id==='party-reunion')&&!G.HonroSplitCampaign.allPresent(b))continue;
   if(group.length&&(everyone?group.every(u=>near(u,p,s.radius||210)):group.some(u=>near(u,p,s.radius||180))))completeStep(app,s);
  }else if(s.kind==='clear'){const foes=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget&&alive(u)&&(s.defeatIds?s.defeatIds.includes(u.id):p&&near(u,p,s.radius||650)));if(!foes.length)completeStep(app,s);}
 }
 for(const q of steps(b)){if(mem(b).done[q.id])continue;if(q.optional&&!satisfied(b,q))continue;if(!satisfied(b,q))break;completeStep(app,q);}
 app.checkMission?.(app.engine);
}
function failure(b){const own=plugin(b)?.failure?.(b);if(own)return own;const required=steps(b).filter(s=>!satisfied(b,s)&&s.requiredClass);if(required.some(s=>!heroes(b).some(u=>u.cls===s.requiredClass)))return 'v4.required-actor';return b.units.some(u=>u.honroProtected&&!alive(u))?'v4.protected-actor':null;}
function state(b){const list=steps(b),s=current(b),m=mem(b),p=s&&marker(b,s.id),custom=plugin(b)?.state?.(b)||{},all=list.map(q=>({...marker(b,q.id),id:q.id,label:q.id,done:satisfied(b,q)})),complete=!s&&!failure(b)&&(plugin(b)?.complete?plugin(b).complete(b):true);
 const result={...custom,complete,objectiveReady:complete,minimumRound:1,settleRounds:0,summary:s?.id||'v4.complete',currentInstruction:s?.id||'v4.complete',currentObjectiveId:s?.id,targets:custom.targets|| (p?[{...p,kind:['reach','route'].includes(s.kind)?'exit':'interact',label:s.id}]:[]),allTargets:all,checklist:all.map(q=>({id:q.id,text:q.id,done:q.done})),visibleChecklist:all.filter(q=>q.done||q.id===s?.id).map(q=>({id:q.id,text:q.id,done:q.done,current:q.id===s?.id})),completionText:'v4.complete',failureText:failure(b)||''};return G.HonroAct23V4Reviewed?.present(b,result)||result;
}
function content(b,st){return{...st,steps:clone(steps(b)),story:[],outro:[],beats:{},failure:[],storyFollowups:[],narration:[],storySummary:'',summary:'',goal:'v4.'+b.honroStage,guide:'',honroV4Unreviewed:true};}
function author(project,options={}){if(!(options.enabled??preview()))return project;const p={...project};p.stages=project.stages.map(original=>{const id=original.metadata?.stageId;if(!original.metadata?.campaign||id<11||id>30)return original;if(original.initialState?.honroAct23V4Revision===1)return original;const map=clone(original);map.initialState??={};map.initialState.honroAct23V4Revision=1;map.initialState.honroV4Phase='A';plugins.get(id)?.author?.(map,p);
  const list=map.initialState.honroV4Steps||map.initialState.honroAct23V4Steps||clone(G.HONRO_CONTENT.stages[id-1].steps||[]);for(const s of list)s.label=s.id;map.initialState.honroV4Steps=list;map.initialState[id<=20?'honroAct2Steps':'honroAct3Steps']=clone(list);
  for(const key of ['honroNarrativeContent','honroQuarryContent','honroVerticalStage14Content'])delete map.initialState[key];map.initialState.honroNarrativePressure=[];
  // Only explicitly v4-retagged events survive. Plugins can own serialized wave
  // specs instead; old objective conditions never re-enter a candidate chapter.
  map.events=(map.events||[]).filter(ev=>/^v4[.:]|^18\./.test(ev.id));for(const ev of map.events){delete ev.lines;if(ev.warning)ev.warning=ev.id+'.warning';}
  for(const mark of map.markers||[]){mark.label=mark.id;if(mark.lines)delete mark.lines;}
  for(const o of map.objectives||[])if(o.type==='campaign')o.label='v4.'+id;
  return map;});return p;}
function prepare(b,profile){if(!active(b))return;mem(b);b.honroAct2Steps=b.honroStage<=20?steps(b):b.honroAct2Steps;b.honroAct3Steps=b.honroStage>=21?steps(b):b.honroAct3Steps;
 const keep=ls=>approvedCommon(ls)||G.HonroAct23V4Reviewed?.rowsReviewed(ls);if(!keep(b.honroStory?.lines))b.honroStory=null;b.honroState.storyQueue=(b.honroState.storyQueue||[]).filter(row=>keep([row]));b.honroState.deferredStory=(b.honroState.deferredStory||[]).map(q=>({...q,lines:(q.lines||[]).filter(row=>keep([row]))})).filter(q=>q.lines.length);b.honroState.storyBanter=[];b.honroState.banterLine=null;
 b.honroNarrativeContent=content(b,G.HONRO_CONTENT.stages[b.honroStage-1]);delete b.honroBellWitness;
 plugin(b)?.prepare?.(b,profile);return b;
}
function bindApp(app,e){if(!active(e.b))return;mem(e.b);if(!app.honroV4SpeechBound){app.honroV4SpeechBound=true;for(const key of ['sayLines','say']){const old=app[key];if(old)app[key]=function(...args){if(active(this.engine?.b))return;return old.apply(this,args);};}}
 plugin(e.b)?.attach?.(app,e);
}
function projectileForce(b,p){if(!active(b)||p.body||C.SKILLS[p.skill]?.martial||/^stake/.test(p.mode||''))return null;const f=b.honroAct23V4TrajectoryForce,z=f?.zone;if(f?.revision!==1||!z||!Number.isFinite(f.ax)||Math.abs(f.ax)>60||p.x<z.x||p.x>z.x+z.w||p.y<z.y||p.y>z.y+z.h)return null;return{x:f.ax,y:0};}
function draw(scene,c,b,e){if(!active(b))return;plugin(b)?.draw?.(scene,c,b,e);for(const[id,h]of Object.entries(mem(b).holds)){if(!h.warning||h.spawned)continue;const p=marker(b,'wave-'+id);if(!p)continue;c.save();c.strokeStyle='#c9b18a';c.lineWidth=3;c.globalAlpha=.55+Math.sin(scene.time*4)*.2;c.beginPath();c.ellipse(p.x,p.y-32,52,25,0,0,Math.PI*2);c.stroke();c.restore();}}
function migratePresentation(p){if(!preview()||p.honroAct23V4PresentationRevision===1)return;const s=p.honroJourney?.story,n=s?.stageId;if(n>=11&&n<=30)p.honroJourney.story=null;
 if([20,30].includes(p.honroActEnding?.stage)){p.honroAct23V4LegacyEnding=clone(p.honroActEnding);p.honroActEnding=null;}
 if(p.honroMapStory&&/-(1[0-9]|2[0-9]|30)$/.test(p.honroMapStory.id||''))p.honroMapStory=null;p.honroAct23V4PresentationRevision=1;
}
function validateBattle(b){if(!active(b))return true;if(!steps(b).length||steps(b).length>60||new Set(steps(b).map(s=>s.id)).size!==steps(b).length)return false;const m=b.honroState?.act23v4;if(m?.revision!==1||!m.done||!m.slots||Object.values(m.done).some(v=>typeof v!=='boolean'))return false;return Object.values(m.slots).every(s=>s&&typeof s.id==='string'&&['pending','done','cancelled'].includes(s.status));}
function recordOutcome(app,won){const b=app.engine?.b;if(!won||!active(b))return;const root=mem(b),history=app.profile.honroAct23V4History??={revision:1,stages:{}};history.stages??={};if(history.stages[b.honroStage]?.run===b.session)return;
 history.stages[b.honroStage]={revision:1,phase:'A',run:b.session,round:b.round,steps:Object.keys(root.done).filter(id=>root.done[id]),slots:Object.keys(root.sceneDone).filter(id=>root.sceneDone[id]),...(b.honroStage===18?{keeperDeath:root.stage18?.bossDeath===true,bellStable:root.stage18?.stable===true}:{}),...(b.honroStage===19?{transportTraces:clone(root.transportTraceProof||null)}:{}),...(b.honroStage===20?{ringRemoved:root.ringRemoved===true,convoy:clone(root.convoyGoals||{}),care:clone(root.convoyCare||null),outside:clone(root.outsideProof||null)}:{}),...(b.honroStage===27?{voidWitness:b.honroAct3Void?.state==='RESOLVED'&&b.honroVoidWitness===true}:{}),...(b.honroStage===29?{bossDeath:!!root.stage29?.death,echo:!!root.stage29?.echo?.done,sluiceReclaimed:!!root.stage29?.sluiceReclaimed}:{}),...(b.honroStage===30?{transport:clone(root.stage30?.boat||null),rescued:clone(root.stage30?.rescued||[]),proof:clone(root.stage30?.proof||null)}:{})};
}
G.HonroAct23V4={register:(id,p)=>plugins.set(id,p),plugins,preview,active,mem,steps,current,marker,heroes,alive,near,slot,ackSlot,safe,satisfied,readySteps,completeStep,eligibility,use,route,hold,tick,failure,state,content,author,prepare,bindApp,projectileForce,draw,migratePresentation,validateBattle,approvedCommon,recordOutcome,mapRevision:id=>preview()&&id>=11&&id<=30?(id>=21&&G.HonroAct23V4Reviewed?.provider?.(id)?.enabled()?400+id:id===11&&G.HonroAct23V4Reviewed?.enabled()?412:id===20?320:200+id):undefined};
for(const A of [G.HonroAct2,G.HonroAct3])for(const [key,next]of Object.entries({steps,current,readySteps,satisfied,state,failure,eligibility,use,tick,entry:()=>[],memory:mem,attach:bindApp})){const old=A[key];A[key]=function(first,...args){const b=['eligibility','use','tick','entry','attach'].includes(key)?first?.engine?.b:first;return active(b)?next(first,...args):old?.call(A,first,...args);};}
const resolve=G.HonroNarrativeCatalogue.resolve;G.HonroNarrativeCatalogue.resolve=(b,st)=>active(b)?content(b,st):resolve(b,st);
const build=G.HonroWorld.build;G.HonroWorld.build=function(...args){const b=build(...args);if(active(b))delete b.honroBellWitness;return b;};
const objectives=G.HonroObjectives.state;G.HonroObjectives.state=(b,st)=>active(b)?state(b):objectives(b,st);
const entry=G.HonroObjectives.entry;G.HonroObjectives.entry=(app,...args)=>active(app.engine?.b)?[]:entry(app,...args);
const target=G.HonroObjectives.interactionTarget;G.HonroObjectives.interactionTarget=(b,m)=>active(b)?(m.target?b.units.find(u=>u.id===m.target&&alive(u)):m):target(b,m);
for(const key of ['interlude','required','optional']){const old=G.HonroJourneyContent[key];G.HonroJourneyContent[key]=function(...args){const id=key==='interlude'?args[0]:args[1];if(preview()&&(id==null||Number(id)>=11))return[];return old.apply(this,args);};}
})(globalThis);
