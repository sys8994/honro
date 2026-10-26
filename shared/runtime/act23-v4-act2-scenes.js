(function(G){'use strict';
// Phase A physical scene contracts. The existing Act 2 plugin remains owner of
// extraction, drainage, trajectory force, route handoff and stage 17 work.
const V=G.HonroAct23V4,base=G.HonroAct23V4Act2,C=G.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x));
const alive=V.alive,heroes=V.heroes,near=V.near,unit=(b,id)=>b.units.find(u=>u.id===id),mark=V.marker;
const active=b=>base.active(b)&&b.honroStage<=16;
const memory=b=>V.mem(b).act2Scenes??={revision:1,proof:{},walks:{}};
const threats=(b,p,r=420)=>b.units.filter(u=>alive(u)&&u.side===1&&!u.honroObjectiveTarget&&near(u,p,r));
function author(map,p){const n=map.metadata.stageId,original=clone(map);base.author(map,p);if(n<11||n>16)return;const init=map.initialState,old=original.markers;
 const at=id=>{const m=old.find(m=>m.id===id);if(!m)throw Error('v4.scene.marker:'+id);return{x:m.x,y:m.y};};
 const point=(x,y)=>({x,y}),steps=[],positions={};
 const add=(id,kind,p,extra={})=>{steps.push({id,label:id,kind,...extra});positions[id]=p;};
 const oldSteps=init.honroV4Steps;
 const keep=id=>{const s=oldSteps.find(s=>s.id===id),m=map.markers.find(m=>m.id===id);steps.push(s);positions[id]={x:m.x,y:m.y};};
 // Removed rescue roles become ordinary independent spirits, preserving the
 // existing initial enemy budget and exact authored positions.
 const rename={};if(n===11)rename['resident-spirit-4']='11.north-spirit';if(n===14){rename['resident-spirit-3']='14.market-spirit';rename['resident-spirit-4']='14.lower-spirit';}
 for(const u of map.units)if(rename[u.id]){u.id=rename[u.id];u.label=u.id;u.stageOverrides={...u.stageOverrides,honroCohort:'v4.patrol'};}
 function refs(x){if(Array.isArray(x))return x.map(refs);if(x&&typeof x==='object'){for(const k of Object.keys(x))x[k]=refs(x[k]);return x;}return typeof x==='string'&&rename[x]||x;}refs(init);refs(map.events);
 if(n===11){const exit=at('trace'),entry=clone(map.routes[0]);add('11.thread','v4-entry',entry);add('11.exit-threat','clear',at('clear-road'),{radius:650});add('11.exit','reach',exit);add('11.north','v4-world',exit);init.honroV4Ambient={from:{x:exit.x-230,y:exit.y},to:{x:exit.x+260,y:exit.y-70}};}
 if(n===12){keep('12.recurrence');keep('sign');keep('route-exit');init.honroV4Recurrence={landmark:at('sign'),checkpoint:clone(map.routes.find(p=>p.x===5740)||map.routes.at(-8)),minimumDistance:1000};}
 if(n===13){const safe=point(2750,3475),latch=point(4605,4092.15),pass=point(4830,4098.9);keep('13.extract');add('13.escort','v4-escort',safe,{target:'resident-1'});add('13.release','interact',safe);add('gate','interact',latch,{radius:85});add('13.party-pass','v4-party-pass',pass);
  init.honroV4EscortPaths={'13.escort':[safe]};init.honroV4InsideLatch={x:4495,point:latch};
  // The source has no upper connection at the closed door. These three small
  // one-way work shelves connect the existing floor to its upper edge.
  for(const [i,x,y,w]of [[0,4150,3940,170],[1,4290,3795,125],[2,4380,3655,125]])map.terrains.push({id:'v4.13.latch-step.'+i,name:'v4.13.latch-step.'+i,type:'solid',points:[{x,y},{x:x+w,y},{x:x+w,y:y+18},{x,y:y+18}],baseMaterial:'wood',breakable:false,oneWay:true,layer:'terrain',properties:{surfaceKind:'wood',honroCave:true,honroWalkEdges:[0],honroSurfaceRole:'shelf',honroWorkAccess:true}});
 }
 if(n===14){for(const id of ['14.door-threat','14.house','14.bell','14.extract'])keep(id);const home=at('family-upper'),safe=point(2675,2300);add('14.refuge','v4-escort',safe,{target:'14.gilchan'});add('14.transport-threat','clear',point(2820,2300),{radius:560});init.honroV4EscortPaths={'14.refuge':[safe]};const descent=map.routes.find(p=>p.x===4080),ground=x=>home.y+(descent.y-home.y)*(x-3000)/(descent.x-3000);init.honroV4Hypnosis={start:home,toward:point(3380,ground(3380)),boundaryX:3380,warningX:3260,warningY:ground(3260),warningPoint:point(3260,ground(3260)),minimumDistance:90};}
 if(n===15){for(const id of ['sluice','15.drift','groove'])keep(id);add('15.knocks','v4-knocks',at('groove'));keep('route-exit');const wheels=map.units.filter(u=>u.kind==='waterwheel').sort((a,b)=>Math.hypot(a.x-at('sluice').x,a.y-at('sluice').y)-Math.hypot(b.x-at('sluice').x,b.y-at('sluice').y));init.honroV4LowWheel=wheels[0]?.id;init.honroV4KnockSource=clone(map.routes.at(-1));init.honroRouteSpec.common.push('15.knocks');}
 if(n===16){keep('16.elder');keep('16.disciple');const safe=point(2755,5020.6122448979595),elder=point(2915,5007.551020408164);add('16.safe','v4-recovery',safe,{target:'resident-1'});add('16.testimony','v4-slot',elder,{slot:'16.testimony.required'});add('16.work-exit','reach',clone(map.routes.at(-1)));init.honroV4Recovery={disciple:safe,elder,surface:'tm-shelter-veranda'};for(const u of map.units.filter(u=>['resident-1','objective'].includes(u.id))){u.label=u.id==='resident-1'?'16.disciple':'16.elder';Object.assign(u.stageOverrides,{walkSpeed:230,maxMove:850,moveLeft:850});}}
 init.honroV4Steps=steps;map.markers=map.markers.filter(m=>!oldSteps.some(s=>s.id===m.id));
 for(const s of steps)map.markers.push({id:s.id,type:'act2',action:'act2',label:s.id,...positions[s.id],radius:s.radius||220,...(s.target?{target:s.target}:{}),...(s.spiritId?{spiritId:s.spiritId}:{})});
}
function prepare(b,p){base.prepare(b,p);if(!active(b))return;memory(b);if(b.honroStage===13){const u=unit(b,'resident-1');if(u)u.name='13.mason';for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list||[])if(t.id.startsWith('v4.13.latch-step.'))t.honroWorkAccess=true;}if(b.honroStage===16)for(const id of ['resident-1','objective']){const u=unit(b,id);if(u)u.name=id==='resident-1'?'16.disciple':'16.elder';}}
function open(b,id){for(const list of [b.terrain,b.honroWorldTerrain]){const t=list?.find(t=>t.id===id);if(t)t.broken=true;}b.sceneVersion++;}
function complete(app,s){V.completeStep(app,s,app.engine.active);}
function finish(app,s){complete(app,s);app.dirty=true;if(!app.checkMission(app.engine))app.engine.finishAction();return true;}
function safeRecovery(b){const a=memory(b),spec=b.honroV4Recovery;return a.proof['16.safe']&&alive(unit(b,'resident-1'))&&alive(unit(b,'objective'))&&near(unit(b,'resident-1'),spec.disciple,70)&&near(unit(b,'objective'),spec.elder,70)&&!threats(b,spec.elder,460).length;}
function eligibility(app,m,s){const b=app.engine.b,p=mark(b,s.id);
 if(['11.thread','11.north','12.recurrence','13.escort','13.party-pass','14.bell','14.refuge','15.drift','15.knocks','16.safe'].includes(s.id))return{ok:false,reason:s.id};
 if(s.id==='sign'){const mage=heroes(b).find(u=>u.cls==='mage');return{ok:!!memory(b).proof['12.recurrence']&&near(mage,p,180)&&!threats(b,p,340).length,reason:s.id};}
 if(s.id==='gate')return{ok:app.engine.active.x-app.engine.active.r>b.honroV4InsideLatch.x&&near(app.engine.active,p,85)&&!threats(b,p,300).length,reason:s.id};
 if(s.id==='sluice'){const wheel=unit(b,b.honroV4LowWheel);return{ok:!!wheel&&!alive(wheel)&&!threats(b,p,260).length,reason:s.id};}
 if(s.id==='16.testimony')return{ok:!!safeRecovery(b),reason:s.id};
 return base.eligibility?.(app,m,s);
}
function use(app,m,s){const b=app.engine.b;s??=V.steps(b).find(s=>s.id===m?.id);if(!s)return undefined;
 if(s.id==='sign'){if(!eligibility(app,m,s).ok)return false;open(b,'sq-turning-veil');base.memory(b).stakeAdjusted={serial:b.honroState.actorTurnSerial,x:m.x,y:m.y};memory(b).proof.sign={mage:heroes(b).find(u=>u.cls==='mage').id,point:{x:m.x,y:m.y}};return finish(app,s);}
 if(s.id==='gate'){if(!eligibility(app,m,s).ok)return false;open(b,'gate-gate');memory(b).proof.gate={actor:app.engine.active.id,x:app.engine.active.x,y:app.engine.active.y,inside:true};return finish(app,s);}
 if(s.id==='13.release'){if(!memory(b).walks['13.escort']?.arrived)return false;const u=unit(b,'resident-1');u.fixed=true;u.honroV4Safe=true;memory(b).proof[s.id]={outside:true,x:u.x,y:u.y};return finish(app,s);}
 if(s.id==='16.testimony')return eligibility(app,m,s).ok?undefined:false;
 if(s.id==='sluice'){if(!eligibility(app,m,s).ok)return false;memory(b).proof['15.waterwheel-stopped']={target:b.honroV4LowWheel,dead:!!unit(b,b.honroV4LowWheel)?.dead};}
 if(s.kind==='v4-extract'){const u=unit(b,s.target);return base.use(app,{...m,x:u.x,y:u.y});}
 return base.use(app,m);
}
// Every NPC takes the same Engine walk/jump/integrateBody route as an actor.
// Reservations below prevent crossing another living body's occupied volume.
function walk(app,key,target,p,dt,{leader=true,arrive=45}={}){const e=app.engine,b=e.b,u=unit(b,target),a=memory(b),q=a.walks[key]??={distance:0,start:u&&{x:u.x,y:u.y}};if(!alive(u)||q.arrived)return q;
 if(leader&&!heroes(b).some(h=>near(h,u,650)))return q;
 u.fixed=false;const rounds=a.walkRounds??={};if(rounds[u.id]===undefined)rounds[u.id]=b.round;else if(rounds[u.id]!==b.round){rounds[u.id]=b.round;u.moveLeft=u.maxMove;}q.round=b.round;
 const before={x:u.x,y:u.y},dir=Math.sign(p.x-u.x),d=Math.min(dt,Math.abs(p.x-u.x)/(u.walkSpeed||230));q.moving=true;
 if(dir&&d>0&&u.moveLeft>0){const nx=u.x+dir*(u.walkSpeed||230)*d,surface=e.surface(nx,u.y-28,u.y+28),next={x:nx,y:surface?.y??u.y};if(!base.bodyBlock(b,u,next)){e.walk(u,dir,d);if(Math.abs(u.x-before.x)<.01&&e.grounded(u))e.jump(u);}else if(e.grounded(u)&&!base.bodyBlock(b,u,{x:u.x,y:u.y-14}))e.jump(u);}
 q.distance+=Math.hypot(u.x-before.x,u.y-before.y);if(q.distance>80&&near(u,p,arrive)&&e.grounded(u)){q.arrived=true;u.fixed=true;u.honroV4Safe=true;q.end={x:u.x,y:u.y};}app.dirty=true;return q;
}
function recurrence(app,dt){const b=app.engine.b,a=memory(b),spec=b.honroV4Recurrence,q=a.loop??={phase:'first',distance:0},u=unit(b,q.actor)||heroes(b).find(h=>near(h,spec.landmark,100));if(!u)return;
 if(q.phase==='first'&&near(u,spec.landmark,100)){q.actor=u.id;q.phase='out';q.first={x:u.x,y:u.y};if(app.scene?.storyFocusPoint){q.camera={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,manual:app.scene.manual};app.scene.storyFocusPoint(spec.landmark.x,spec.landmark.y-80,240,.34);q.cameraHold=.6;}}
 if(q.phase==='out'&&near(u,spec.checkpoint,105)){q.phase='return';q.checkpoint={x:u.x,y:u.y};}
 if(q.phase==='return'&&q.distance>=spec.minimumDistance&&near(u,spec.landmark,100)){q.phase='done';q.second={x:u.x,y:u.y};a.proof['12.recurrence']={actor:u.id,first:clone(q.first),checkpoint:clone(q.checkpoint),second:clone(q.second),distance:q.distance,passes:2};if(app.scene?.storyFocusPoint){app.scene.storyFocusPoint(spec.landmark.x,spec.landmark.y-80,240,.34);q.cameraHold=.6;}}
}
function tick(app,dt){const e=app.engine,b=e.b;if(!active(b)||!V.safe(app))return;const a=memory(b),delta=Math.max(0,Math.min(dt,.05)),s=V.current(b);if(!s)return;
 if(b.honroStage===11){if(s.id==='11.thread'){a.entryElapsed=(a.entryElapsed||0)+delta;if(a.entryElapsed>=.35){a.proof[s.id]={automatic:true,actor:heroes(b).find(u=>u.cls==='occultist')?.id};e.fx('ring',mark(b,s.id).x,mark(b,s.id).y-40,'#b5c8bf',35);}}
  if(s.id==='11.north'&&V.mem(b).done['11.exit']&&!threats(b,mark(b,s.id),700).length&&heroes(b).some(u=>near(u,mark(b,s.id),180))){a.bell??={elapsed:0,struck:false};a.bell.elapsed+=delta;if(!a.bell.struck){a.bell.struck=true;a.bell.audible=G.HonroMukjongAudio?.playCandidate?.(app,.82)===true;a.bell.source=clone(b.honroV4Ambient);e.fx('ring',mark(b,s.id).x,mark(b,s.id).y-100,'#c1b98c',90);}if(a.bell.elapsed>=1.1)a.proof[s.id]={postFight:true,ambientSouls:true,bell:clone(a.bell)};}return;
 }
 if(b.honroStage===12){const q=a.loop;if(q?.cameraHold>0){q.cameraHold-=delta;if(q.cameraHold<=0)app.scene?.storyRelease?.(q.camera,250);}if(s.id==='12.recurrence')recurrence(app,delta);return;}
 if(b.honroStage===13){if(s.id==='13.escort'){const q=walk(app,s.id,s.target,mark(b,s.id),delta);if(q.arrived&&!threats(b,mark(b,s.id),240).length)a.proof[s.id]={distance:q.distance,outside:true};}if(s.id==='13.party-pass'){const list=heroes(b);if(['archer','mage','knight','occultist'].every(cls=>list.some(u=>u.cls===cls&&u.x-u.r>b.honroV4InsideLatch.x&&near(u,mark(b,s.id),430))))a.proof[s.id]={heroes:list.map(u=>u.id),gateOpen:!!b.terrain.find(t=>t.id==='gate-gate')?.broken};}return;}
 if(b.honroStage===14){const u=unit(b,'14.gilchan'),spec=b.honroV4Hypnosis;
  if(['14.bell','14.extract'].includes(s.id)&&base.memory(b).houseOpen&&alive(u)&&!base.memory(b).proof['14.extract']){if(!a.hypnosis){a.hypnosis={struck:true,audible:G.HonroMukjongAudio?.playCandidate?.(app,.88)===true};u.honroHypnotized=true;}const q=walk(app,'14.hypnosis',u.id,spec.warningPoint,delta,{leader:false,arrive:5});if(q.arrived){const w=a.hypnosisWarning??={serial:b.honroState.actorTurnSerial||0,point:{x:u.x,y:u.y},offered:{}};u.honroV4DangerWarning=true;V.slot(app,'14.hypnosis.warning',{actorId:u.id,point:w.point,responseClass:'occultist'});const actor=e.active;if(actor?.cls==='occultist'&&actor.side===0&&!actor.acted&&near(actor,u,650))w.offered[actor.id]=true;if(w.response){u.honroV4Safe=false;walk(app,'14.compulsion',u.id,spec.toward,delta,{leader:false,arrive:5});}}if(u.x>=spec.boundaryX-u.r)a.dangerCrossed=true;if(q.distance>=spec.minimumDistance&&u.x-q.start.x>=60)a.proof['14.bell']={distance:q.distance,source:clone(spec.start),toward:clone(spec.toward),bell:clone(a.hypnosis)};}
  if(s.id==='14.refuge'){const q=walk(app,s.id,s.target,mark(b,s.id),delta);if(q.arrived)a.proof[s.id]={distance:q.distance,close:true};}return;
 }
 if(b.honroStage===15){base.tick(app,delta);if(s.id==='15.knocks'&&heroes(b).some(u=>near(u,mark(b,s.id),320))&&!threats(b,mark(b,s.id),260).length){const q=a.knocks??={elapsed:0,emitted:[]};q.elapsed+=delta;const due=[.05,.65,1.25];for(let i=q.emitted.length;i<due.length&&q.elapsed>=due[i];i++){const source=b.honroV4KnockSource;e.emit('sound',{name:'ricochet',x:source.x,y:source.y,source:'15.knock.'+i});e.fx('ring',source.x,source.y-70,'#b5b2a0',55+i*14);q.emitted.push({id:'15.knock.'+i,source:clone(source),toward:clone(mark(b,s.id)),at:q.elapsed});}if(q.emitted.length===3)a.proof[s.id]={count:3,source:clone(b.honroV4KnockSource),events:clone(q.emitted)};}return;}
 if(b.honroStage===16){if(V.mem(b).sceneDone['16.testimony.required']){b.honroState.flags??={};b.honroState.flags.witness16_heard=true;}
  if(s.id==='16.safe'){const spec=b.honroV4Recovery,disciple=walk(app,'16.disciple-safe','resident-1',spec.disciple,delta),elder=walk(app,'16.elder-safe','objective',spec.elder,delta);if(disciple.arrived&&elder.arrived&&!threats(b,spec.elder,460).length){a.recoveryElapsed=(a.recoveryElapsed||0)+delta;unit(b,'resident-1').honroV4RecoveryPose='rest';unit(b,'objective').honroV4RecoveryPose='seated';unit(b,'resident-1').honroScenePose={kind:'bow',time:a.recoveryElapsed};unit(b,'objective').honroScenePose={kind:'kneel',time:a.recoveryElapsed};if(a.recoveryElapsed>=.7)a.proof[s.id]={disciple:clone(disciple),elder:clone(elder),recovery:true,surface:spec.surface};}}
  if(s.id==='16.testimony'&&safeRecovery(b))V.slot(app,s.slot,{elder:'objective',disciple:'resident-1',safe:clone(a.proof['16.safe'])});return;
 }
}
function stepSatisfied(b,s){if(!active(b))return null;const a=memory(b);if(['11.thread','11.north','12.recurrence','13.escort','13.party-pass','14.bell','14.refuge','15.knocks','16.safe'].includes(s.id))return !!a.proof[s.id];if(s.id==='16.testimony')return !!V.mem(b).sceneDone?.[s.slot];return base.stepSatisfied(b,s);}
function failure(b){if(!active(b))return null;const party=heroes(b);if(b.honroStage===12&&!party.some(u=>u.cls==='mage'))return'v4.required-actor';if(b.honroStage===13&&!['archer','mage','knight','occultist'].every(cls=>party.some(u=>u.cls===cls)))return'act23v4.13.party-incomplete';if(b.honroStage===14&&memory(b).dangerCrossed)return'act23v4.14.danger-boundary';return base.failure(b);}
const attached=new WeakSet();function attach(app,e){base.attach(app,e);if(!active(e.b)||attached.has(e))return;attached.add(e);
 const owned=u=>['resident-1','objective','14.gilchan'].includes(u.id)&&!u.fixed;
 const sweep=(u,from,to)=>{const count=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/2));let last=from;for(let i=1;i<=count;i++){const p={x:from.x+(to.x-from.x)*i/count,y:from.y+(to.y-from.y)*i/count};if(base.bodyBlock(e.b,u,p,from))return last;last=p;}return null;};
 const walk=e.walk;e.walk=function(u,...args){const from={x:u.x,y:u.y},budget=u.moveLeft,out=walk.call(e,u,...args);if(owned(u)){const stop=sweep(u,from,u);if(stop){const full=Math.hypot(u.x-from.x,u.y-from.y),actual=Math.hypot(stop.x-from.x,stop.y-from.y);u.moveLeft=budget-(budget-u.moveLeft)*(full?actual/full:0);u.x=stop.x;u.y=stop.y;}}const q=memory(e.b).loop;if(e.b.honroStage===12&&q?.actor===u.id&&['out','return'].includes(q.phase))q.distance+=Math.hypot(u.x-from.x,u.y-from.y);return out;};
 const finishAction=e.finishAction;e.finishAction=function(...args){const b=e.b,u=e.active,w=memory(b).hypnosisWarning,offered=b.honroStage===14&&w&&!w.response&&w.offered[u?.id]&&u?.cls==='occultist'&&!u.acted&&V.current(b)?.id==='14.extract',round=b.round,serial=b.honroState.actorTurnSerial||0;const out=finishAction.apply(e,args);if(offered&&(u.acted||b.round>round||(b.honroState.actorTurnSerial||0)>serial||e.active?.id!==u.id))w.response={actor:u.id,serial:b.honroState.actorTurnSerial||0,round:b.round,ended:true};return out;};
 const integrate=e.integrateBody;e.integrateBody=function(u,...args){const from=owned(u)?{x:u.x,y:u.y}:null,out=integrate.call(e,u,...args);if(from){const stop=sweep(u,from,u);if(stop){u.x=stop.x;u.y=stop.y;u.vx=u.vy=0;}}return out;};
}
function draw(scene,c,b,e){if(!active(b))return;const a=memory(b);if(b.honroStage!==11||a.bell)base.draw(scene,c,b,e);c.save();
 if(b.honroStage===14&&!base.memory(b).proof['14.extract']&&base.memory(b).houseOpen){const spec=b.honroV4Hypnosis;c.strokeStyle='#b79a74';c.lineWidth=3;c.globalAlpha=.7;c.beginPath();c.moveTo(spec.warningX,spec.warningY-100);c.lineTo(spec.boundaryX,spec.toward.y-100);c.lineTo(spec.boundaryX,spec.toward.y);c.stroke();}
 if(b.honroStage===15&&a.knocks?.emitted.length){const source=b.honroV4KnockSource,p=mark(b,'15.knocks');c.strokeStyle='#bcb6a0';c.globalAlpha=.5;c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y-85);c.lineTo(p.x+(source.x-p.x)*.3,p.y-85+(source.y-p.y)*.3);c.stroke();}
 if(b.honroStage===16&&a.proof['16.safe'])for(const id of ['resident-1','objective']){const u=unit(b,id);if(!alive(u))continue;c.strokeStyle='#b5bba9';c.globalAlpha=.65;c.lineWidth=3;c.beginPath();c.ellipse(u.x,u.y-16,id==='resident-1'?28:20,8,0,0,Math.PI*2);c.stroke();}
 c.restore();}
const api={...base,active,author,prepare,attach,tick,use,eligibility,stepSatisfied,failure,draw,memory,base,walk};G.HonroAct23V4Act2Scenes=api;for(let n=11;n<=16;n++)V.register(n,api);
})(globalThis);
