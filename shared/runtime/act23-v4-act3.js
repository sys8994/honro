(function(G){'use strict';
const V=G.HonroAct23V4,clone=x=>JSON.parse(JSON.stringify(x)),alive=V.alive;
const m=b=>V.mem(b),mark=(b,id)=>V.marker(b,id),unit=(b,id)=>b.units.find(u=>u.id===id);
const step=(id,kind='interact',extra={})=>({id,label:id,kind,...extra});
function at(map,id){const p=map.markers.find(p=>p.id===id);if(!p)throw Error('v4.marker:'+map.id+':'+id);return{x:p.x,y:p.y};}
function marker(map,id,point,extra={}){const old=map.markers.find(p=>p.id===id),r={id,type:map.metadata.stageId<=20?'act2':'act3',action:map.metadata.stageId<=20?'act2':'act3',label:id,...point,...extra};if(old)Object.assign(old,r);else map.markers.push(r);return r;}
function npc(map,id,point,{guard=false,...extra}={}){if(map.units.some(u=>u.id===id))return;map.units.push({id,kind:guard?'ally:guard':'object:civilian',team:guard?'ally':'npc',label:id,...point,stageOverrides:{fixed:true,honroProtected:true,honroV4Actor:true,h:92,r:22,hp:guard?1000:620,maxHp:guard?1000:620,maxMove:600,moveLeft:600,walkSpeed:200,...extra}});}
function setSteps(map,list){map.initialState.honroV4Steps=list;const keep=new Set(list.map(s=>s.id));for(const p of map.markers){if(['act2','act3'].includes(p.action)&&!keep.has(p.id))delete p.action;}}
function surface(map,x){return G.HonroMapEngine.surfaceY(map.terrains.map(t=>G.HonroGeometry.terrain(t,map.height)),x,undefined,'act2-floor')?.y;}
function walk(app,u,goal,{radius=90,lead=true}={}){const b=app.engine.b;if(!alive(u)||!goal)return false;if(V.near(u,goal,radius))return true;if(!V.safe(app)||b.side!==0||b.phase!=='aim')return false;
 const dir=Math.sign(goal.x-u.x),leaders=V.heroes(b).filter(h=>Math.abs(h.y-u.y)<220&&Math.abs(h.x-u.x)<950&&(h.x-u.x)*dir>60);if(lead&&!leaders.length)return false;
 const stamp=b.round;if(u.honroV4MoveRound!==stamp){u.honroV4MoveRound=stamp;u.moveLeft=u.maxMove;}
 const before={x:u.x,y:u.y};u.fixed=false;app.engine.walk(u,dir,Math.min(app.honroV4Dt||.016,.05),true);u.honroV4Distance=(u.honroV4Distance||0)+Math.hypot(u.x-before.x,u.y-before.y);app.dirty=true;return V.near(u,goal,radius);
}
function capture(app,id,point){const b=app.engine.b,key='v4:'+b.honroStage+':'+id;if(m(b).cargo?.[key])return;const actor=V.heroes(b).find(u=>V.near(u,point,260));if(!actor)return;m(b).cargo??={};m(b).cargo[key]={id:key,owner:actor.cls,round:b.round,source:{x:point.x,y:point.y},revision:1};app.profile.honroV4Cargo??={};app.profile.honroV4Cargo[key]=clone(m(b).cargo[key]);}
function convoyCare(b){return m(b).convoyCare??={version:1,injured:{id:'objective',status:'walking',distance:0,supportedDistance:0,supportId:null,joins:0},baggage:{id:'20.family-baggage',owner:'convoy-mason',status:'with-mason',elapsed:0,transfers:0}};}
const grounded=(b,u)=>alive(u)&&!u.airborne&&!u.jumping&&G.HONRO_CORE.validTerrainContactPose(b.terrain,u);
function careReady(b){const q=convoyCare(b);return q.injured.reachedRest===true&&q.injured.supportedDistance>=80&&q.baggage.status==='carried'&&q.baggage.owner==='convoy-gilchan'&&q.baggage.transfers===1;}
function careTick(app,dt){const b=app.engine.b,q=convoyCare(b),a=q.injured,u=unit(b,a.id),bag=q.baggage,rest=mark(b,'hold-convoy'),father=unit(b,'convoy-mason'),son=unit(b,'convoy-gilchan');if(!alive(u))return;
 // The existing anonymous convoy body represents the injured survivor. No
 // extra crowd or random damage is fabricated, and ordinary damage stays real.
 if(!a.stopped&&(a.distance>=120||u.hp<u.maxHp)){a.stopped=true;a.status='waiting-support';a.stop={x:u.x,y:u.y,round:b.round};V.slot(app,'20.injured-support',{source:u.id,point:a.stop});}
 if(a.stopped){const old=unit(b,a.supportId),eligible=h=>grounded(b,h)&&V.near(h,u,185);if(!eligible(old)){a.supportId=null;a.status='waiting-support';const next=V.heroes(b).filter(eligible).sort((x,y)=>Math.abs(x.x-u.x)-Math.abs(y.x-u.x))[0];if(next){a.supportId=next.id;a.status='supported';a.joins++;}}
  if(a.status==='supported'&&grounded(b,u)&&V.near(u,rest,120)&&a.supportedDistance>=80){a.reachedRest=true;V.ackSlot(b,'20.injured-support',{support:a.supportId,distance:a.supportedDistance,rest:{x:u.x,y:u.y}});}}
 if(bag.status!=='carried'&&grounded(b,father)&&grounded(b,son)&&V.near(father,rest,220)&&V.near(father,son,180)){
  if(bag.status==='with-mason'){bag.status='handoff';V.slot(app,'20.gilchan-baggage',{source:father.id,recipient:son.id,item:bag.id});}
  bag.elapsed=Math.min(.65,bag.elapsed+Math.max(0,dt));father.honroScenePose={kind:'inspect',time:bag.elapsed};son.honroScenePose={kind:'inspect',time:bag.elapsed};
  if(bag.elapsed>=.65){bag.status='carried';bag.owner=son.id;bag.transfers=1;bag.proof={from:father.id,to:son.id,round:b.round,point:{x:son.x,y:son.y}};delete father.honroScenePose;delete son.honroScenePose;V.ackSlot(b,'20.gilchan-baggage',bag.proof);app.engine.emit?.('save');}
 }else if(bag.status==='handoff'){
  // Knockback may separate either actor during the gesture. Keep the same
  // item/owner and free escort walking so they can physically rejoin, including
  // snapshots saved while the old handoff was stranded. No partial transfer.
  bag.status='with-mason';bag.elapsed=0;delete father?.honroScenePose;delete son?.honroScenePose;app.engine.emit?.('save');
 }
}
function author(map,project){const n=map.metadata.stageId,base=clone(map.initialState[n<=20?'honroAct2Steps':'honroAct3Steps']||[]);map.initialState.honroV4Steps=base;
 if(n===19){setSteps(map,base.map(s=>s.id.startsWith('send-')?{...s,kind:'v4-farewell'}:s));for(const p of map.markers)if(p.id.startsWith('send-'))delete p.action;map.events=[];map.units=map.units.filter(u=>u.team!=='enemy');for(const [i,u]of map.units.filter(u=>u.team!=='player').entries()){u.label='19.visitor.'+i;u.stageOverrides={...u.stageOverrides,name:u.label};}map.initialState.honroV4Offerings=[1,2,3].map(i=>({id:'v4.19.offering.'+i,...at(map,'separate-'+i)}));
  // This is the same bell after the new partial lift, not the legacy +200
  // landing. Carry only final geography, never actors, combat or death proof.
  const bell=V.plugins.get(18),rest=bell.restOffset,dx=bell.restOffsetX||0,old=map.initialState.honroState.bellDescent.offset,delta=rest-old,spec=map.initialState.honroBellDescent;
  for(const t of map.terrains)if(spec.terrainIds.includes(t.id))for(const p of t.points){p.y+=delta;p.x+=dx;}
  for(const e of map.elements)if(spec.elementIds.includes(e.id)){e.y+=delta;e.x+=dx;if(e.stage18Bell)e.stage18Bell.lipY+=delta;}
  for(const record of bell.finalSupports()){record.properties.broken=false;map.terrains.push(record);}
  map.initialState.honroState.bellDescent={version:1,status:'settled',offset:rest,offsetX:dx,count:1};
  const family=map.units.find(u=>u.id==='objective'),floor=map.terrains.find(t=>t.id==='act2-floor');if(family){family.x=6250;for(let i=0;i<floor.points.length-1;i++){const a=floor.points[i],z=floor.points[i+1];if(z.x>a.x&&family.x>=a.x&&family.x<=z.x){family.y=a.y+(z.y-a.y)*(family.x-a.x)/(z.x-a.x);break;}}}
 }
 if(n===20){const wave=at(map,'wave-hold-convoy'),outside={x:8750,y:surface(map,8750)},ring={x:1000,y:surface(map,1000)};
  marker(map,'20.ring',ring);marker(map,'20.outside',outside);marker(map,'wave-clear-pass',wave);
  const list=base.map(s=>s.id==='hold-convoy'?step(s.id,'v4-regroup'):s.id==='clear-pass'?step(s.id,'v4-ambush-clear',{defeatIds:map.units.filter(u=>u.team==='enemy'&&u.x>=6550&&u.x<=8700).map(u=>u.id)}):s);
  setSteps(map,[step('20.ring','interact',{requiredClass:'mage'}),...list,step('20.outside','v4-outside',{requiredClass:'knight'})]);
  for(const u of map.units)if(u.stageOverrides?.honroConvoyMember){delete u.stageOverrides.honroConvoyMember;u.stageOverrides.honroProtected=true;u.stageOverrides.fixed=false;u.stageOverrides.maxMove=600;u.stageOverrides.moveLeft=600;if(u.id==='objective'){u.label='20.injured-survivor';u.stageOverrides.name=u.label;u.stageOverrides.honroV4RescueRole='injured';}}
  map.initialState.honroV4Convoy=['objective','convoy-gilchan','convoy-mason'];map.initialState.honroV4ConvoyAmbush={id:'v4.20.ambush',count:4,point:wave};npc(map,'20.town-refugee',outside);
 }
 if(n===21){setSteps(map,base);const p=at(map,'refuge-hold');npc(map,'v4.gwakjin',{x:p.x+290,y:p.y},{guard:true});npc(map,'v4.gate-soldier-1',{x:p.x+410,y:p.y},{guard:true,honroProtected:false});npc(map,'v4.gate-soldier-2',{x:p.x+490,y:p.y},{guard:true,honroProtected:false});map.initialState.honroV4ArmorDistinction={current:['v4.gwakjin','v4.gate-soldier-1','v4.gate-soldier-2'],old:map.units.filter(u=>u.team==='enemy'&&/possessed/.test(u.kind)).map(u=>u.id)};}
 if(n===22){const p=at(map,'ledger-case');marker(map,'v4.record-bundle',p);setSteps(map,[step('archive-seal','interact',{requiredClass:'knight',opens:'archive-door'}),step('v4.record-bundle','interact',{opens:'upper-door'}),step('archive-exit','reach')]);map.initialState.honroV4RecordBundle={id:'v4.22.bundle',reports:3,...p};}
 if(n===23){setSteps(map,[step('dispatch-bundle','interact',{target:'act3-carrier'}),step('dock-mid','escort',{target:'act3-carrier'}),step('dock-exit','escort',{target:'act3-carrier'})]);map.initialState.honroV4MaterialEvidence=[{id:'v4.23.body-wrap',...at(map,'dispatch-bundle')},{id:'v4.23.household-metal',...at(map,'dock-mid')}];}
 if(n===24){setSteps(map,base);map.initialState.honroV4Entrances=[{id:'water',marker:'split-route-a',classes:['archer','mage']},{id:'ground',marker:'split-route-b',classes:['knight','occultist']}];}
 if(n===25){setSteps(map,base.map(s=>s.id==='household-tally'?{...s,kind:'evidence',afterEvidence:'stake-arrival-5'}:s));map.initialState.honroV4MaterialEvidence=map.markers.filter(p=>/^stake-arrival/.test(p.id)).map(p=>({id:'v4.25.item.'+p.id,...p}));}
 if(n===26){const p=at(map,'artisan-resident');marker(map,'v4.ancestor-testimony',p);setSteps(map,[step('hidden-latch','interact',{requiredClass:'knight',opens:'hidden-door'}),step('artisan-resident','rescue',{target:'act3-resident',requiredClass:'occultist'}),step('v4.ancestor-testimony','interact'),step('workshop-exit','reach',{allHeroes:true})]);map.initialState.honroV4Smoke={x:6640,y:1920};}
 if(n===27){setSteps(map,base);map.initialState.honroV4Steps.find(s=>s.id==='depot-route-ledger').kind='v4-stake-proof';map.initialState.honroV4MaterialEvidence=[{id:'v4.27.family-tags',...at(map,'family-manifest')}];}
 if(n===28){const list=base.filter(s=>!['closure-order','suppression-order'].includes(s.id));for(const s of list)if(s.id==='party-reunion')Object.assign(s,{allHeroes:true,radius:440});const p=at(map,'party-reunion');npc(map,'v4.gwakjin',{x:p.x+400,y:p.y},{guard:true,allyRole:'channeler'});npc(map,'v4.fire-resident-1',{x:p.x+510,y:p.y});npc(map,'v4.fire-resident-2',{x:p.x+600,y:p.y});setSteps(map,list);map.initialState.honroV4FireEvacuation={ids:['v4.fire-resident-1','v4.fire-resident-2'],guard:'v4.gwakjin',destination:{x:6650,y:2590}};}
}
function prepare(b){const n=b.honroStage;m(b);if(n===20){convoyCare(b);b.honroConvoyActors=[];for(const id of b.honroV4Convoy||[]){const u=unit(b,id);if(u){delete u.honroVisualOnly;u.honroProtected=true;u.maxMove=600;if(!Number.isFinite(u.moveLeft))u.moveLeft=600;u.fixed=false;}}}
 if(n===19)G.HonroStage19Farewell.prepare(b);
 if(n===28){m(b).fireStartEnd??=b.teamEnds?.[1]||0;m(b).fireTurns??=0;}
 if(n===27)G.HonroAct3Void.initializeFresh(b);
 for(const u of b.units)if(u.honroV4Actor&&u.honroAlly)u.honroV4CurrentMilitary=true;
}
function use(app,p){const b=app.engine.b,s=V.readySteps(b).find(s=>s.id===p.id),n=b.honroStage;
 if(n===19&&s?.id.startsWith('send-'))return false;
 if(n===19&&s?.id==='old-soul'){if(![1,2,3].every(i=>m(b).farewell?.['send-'+i]?.status==='done'))return false;m(b).transportMarks??={elapsed:0,actor:app.engine.active.id};V.slot(app,'19.transport-traces',{actor:app.engine.active.id,traceIds:['mumyeong-transfer','royal-seal','jeomungol-mark']});app.engine.finishAction();return true;}
 if(n===20&&s?.id==='20.ring'){m(b).ringRemoved=true;V.slot(app,'20.ring-removed',{actor:app.engine.active.id});}
 if(n===20&&s?.id==='escort')m(b).convoyStarted=true;
 if(n===20&&s?.id==='20.outside'){if(!m(b).convoyGoals?.escape||!m(b).ringRemoved)return false;m(b).outsideScene??={elapsed:0,actor:app.engine.active.id};V.slot(app,'20.time-gap.required',{actor:app.engine.active.id,source:'convoy-mason',place:'outside'});V.slot(app,'20.current-town-crisis.required',{source:'20.town-refugee',place:'outside'});app.engine.finishAction();return true;}
 if(n===22&&s?.id==='v4.record-bundle'){capture(app,s.id,p);V.slot(app,'22.records-compare',{source:p.id,contents:['official-report','population-register','canal-plan']});}
 if(n===23&&s?.id==='dispatch-bundle'){m(b).carrierStarted=true;V.slot(app,'23.material-tags',{source:p.id});}
 if(n===26&&s?.id==='v4.ancestor-testimony'){capture(app,s.id,p);V.slot(app,'26.ancestor-testimony',{source:p.id});}
 if(n===28&&s?.id==='petition-record'){if(!m(b).evacuationSafe)return false;capture(app,s.id,p);V.slot(app,'28.orders-bundle',{source:p.id,responsibility:['closure-approval','massacre-execution','post-event-concealment']});}
 return undefined;
}
function stepSatisfied(b,s){const n=b.honroStage,root=m(b);if(n===19&&s.id.startsWith('send-'))return root.farewell?.[s.id]?.status==='done';
 if(n===19&&s.id==='old-soul')return !!root.transportTraceProof;
 if(n===20&&s.id==='hold-convoy')return careReady(b)&&!!root.convoyGoals?.[s.id]&&!b.units.some(u=>u.side===1&&alive(u)&&!u.honroObjectiveTarget&&V.near(u,mark(b,s.id),600));
 if(n===20&&s.id==='clear-pass'){const q=root.convoyAmbush;return !!q?.admitted&&q.ids.length===b.honroV4ConvoyAmbush.count&&[...q.ids,...(s.defeatIds||[])].every(id=>{const u=unit(b,id);return !!u&&(!alive(u)||u.side!==1||u.honroSubdued);});}
 if(n===20&&s.id==='20.outside')return !!root.outsideProof;
 if(n===24&&s.id==='land-register')return !!root.entrances?.water&&!!root.entrances?.ground;
 if(n===27&&s.id==='depot-route-ledger')return (b.stakes||[]).some(p=>p.skill==='M09'&&p.side===0&&(p.expires===undefined||p.expires>b.round));
 if(n===27&&s.id==='family-manifest')return !!root.done[s.id]&&b.honroAct3Void?.state==='RESOLVED';
 if(n===20&&['escort-mid','escape'].includes(s.id))return !!root.convoyGoals?.[s.id];if(n===23&&['dock-mid','dock-exit'].includes(s.id))return !!root.carrierGoals?.[s.id];
 return null;
}
function escort(app,s,ids,rootkey){const b=app.engine.b,root=m(b),goal=mark(b,s.id);if(!goal)return;root[rootkey]??={};let all=true;
 const waypoints=b.honroMarkers.filter(p=>p.id.startsWith('route:'+s.id+':')).sort((a,z)=>Number(a.id.split(':').at(-1))-Number(z.id.split(':').at(-1)));
 for(const [i,id]of ids.entries()){const u=unit(b,id);if(!alive(u)){all=false;continue;}const care=b.honroStage===20?convoyCare(b):null,a=care?.injured,bag=care?.baggage;
  if((a?.id===id&&a.stopped&&a.status!=='supported')||(bag?.status==='handoff'&&['convoy-mason','convoy-gilchan'].includes(id))){all=false;continue;}
  root.escortWaypoints??={};const k=s.id+':'+id;let index=root.escortWaypoints[k]||0;while(waypoints[index]&&V.near(u,waypoints[index],100))index++;root.escortWaypoints[k]=index;const dest=waypoints[index]||{x:goal.x-i*65,y:goal.y},before={x:u.x,y:u.y};if(!walk(app,u,dest,{radius:90,lead:!(a?.id===id&&a.stopped)}))all=false;
  if(a?.id===id){const moved=Math.hypot(u.x-before.x,u.y-before.y);a.distance+=moved;if(a.status==='supported')a.supportedDistance+=moved;}}
 if(all&&ids.every(id=>(unit(b,id)?.honroV4Distance||0)>80))root[rootkey][s.id]=true;
}
function convoyPressure(app){const e=app.engine,b=e.b,root=m(b),spec=b.honroV4ConvoyAmbush;if(!spec)return;let q=root.convoyAmbush;
 if(!q){q=root.convoyAmbush={warnSerial:b.honroState.actorTurnSerial||0,heroes:V.heroes(b).map(u=>u.id),offered:{},ended:{},ids:[],admitted:false};V.slot(app,'20.ambush.warning',{source:spec.id,point:spec.point,count:spec.count});}
 root.holds['clear-pass']??={warning:q,spawned:0};if(q.admitted)return;
 const u=e.active;if(b.side===0&&b.phase==='aim'&&e.canAct()&&V.heroes(b).includes(u))q.offered[u.id]=true;
 if(!q.heroes.filter(id=>alive(unit(b,id))).every(id=>q.ended[id])||!V.safe(app)||b.side!==0||b.phase!=='aim')return;
 const before=new Set(b.units.map(u=>u.id)),p=spec.point,action={type:'multi',source:spec.id,actions:[{type:'spawn',kind:'ghost',n:2,x:p.x,y:p.y,spacing:100,maxDistance:420,source:spec.id+':overlook'},{type:'spawn',kind:'hound',n:2,x:p.x+220,y:p.y-50,spacing:130,maxDistance:420,source:spec.id+':slope'}]};
 if(G.HonroAllies.execute(app,action)===false)return;q.ids=b.units.filter(u=>!before.has(u.id)).map(u=>u.id);q.admitted=q.ids.length===spec.count;if(q.admitted){root.holds['clear-pass'].spawned=spec.count;V.slot(app,'20.ambush.admitted',{source:spec.id,ids:q.ids});e.emit?.('save');}
}
function attach(app,e){if(e.b.honroStage===19&&!e.honroV4PeacefulRecovery){e.honroV4PeacefulRecovery=true;const recover=e.recover.bind(e);e.recover=function(u,...args){if(!V.active(e.b)||e.b.honroStage!==19||!alive(u))return recover(u,...args);const b=e.b,choices=[];
   for(const t of b.terrain){if(t.broken||t.w<u.r*2+4)continue;const x=Math.max(t.x+u.r+5,Math.min(u.x,t.x+t.w-u.r-5));for(const f of G.HONRO_CORE.terrainSurfaces(t,x)){const p={...u,x,y:f.y};if(Math.abs(f.slope)>1.35||!G.HONRO_CORE.validTerrainContactPose(b.terrain,p)||b.units.some(v=>v!==u&&alive(v)&&Math.abs(v.x-x)<v.r+u.r+4&&f.y>v.y-v.h&&f.y-u.h<v.y))continue;choices.push({x,y:f.y,d:Math.abs(x-u.x)+Math.abs(f.y-u.y)*.18});}}
   choices.sort((a,z)=>a.d-z.d);const p=choices[0];if(!p)return;const from={x:u.x,y:u.y};Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0,airborne:false,jumping:false,moving:0});delete u.platformDrop;u.honroV4PeacefulReturn={from,to:{x:p.x,y:p.y}};e.emit?.('save');};}
 if(e.b.honroStage!==20||e.honroV4ConvoyAction)return;e.honroV4ConvoyAction=true;const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,acted=u?.acted,out=finish(...args),q=m(e.b).convoyAmbush;if(q&&!q.admitted&&u?.side===0&&!u.summoned&&!u.enthrall&&!acted&&u.acted&&q.offered[u.id]){q.ended[u.id]=true;e.emit?.('save');}return out;};}
function tick(app,dt){const b=app.engine.b,n=b.honroStage,root=m(b);app.honroV4Dt=dt;
 if(n===19){for(let i=1;i<=3;i++){const id='send-'+i,p=mark(b,'separate-'+i),q=root.farewell??={};if(root.done['separate-'+i]&&!q[id]){q[id]={elapsed:0,from:{x:p.x,y:p.y},status:'moving'};V.slot(app,'19.'+id,{source:p.id});}}
  for(const [id,q]of Object.entries(root.farewell||{}))if(q.status==='moving'){q.elapsed=Math.min(1,q.elapsed+Math.max(0,dt));if(q.elapsed>=1){q.status='done';V.ackSlot(b,'19.'+id,{movement:180});const s=V.steps(b).find(s=>s.id===id);if(s)V.completeStep(app,s);}}
  if(root.transportMarks&&!root.transportTraceProof){const q=root.transportMarks,u=unit(b,q.actor);if(alive(u)&&V.near(u,mark(b,'old-soul'),260)){q.elapsed=Math.min(.8,q.elapsed+Math.max(0,dt));u.honroScenePose={kind:'inspect',time:q.elapsed};if(q.elapsed>=.8){delete u.honroScenePose;root.transportTraceProof={ids:['mumyeong-transfer','royal-seal','jeomungol-mark'],actor:q.actor};V.ackSlot(b,'19.transport-traces',root.transportTraceProof);}}}
  if(root.done.route)G.HonroStage19Farewell.prepare(b);}
 if(n===20&&root.convoyStarted){careTick(app,dt);const s=V.current(b);if(['escort-mid','hold-convoy','escape'].includes(s?.id))escort(app,s,b.honroV4Convoy||['objective'],'convoyGoals');if(root.done['hold-convoy'])convoyPressure(app);
  if(root.outsideScene&&!root.outsideProof&&root.convoyGoals?.escape){const q=root.outsideScene,point=mark(b,'20.outside'),party=V.heroes(b),worker=unit(b,'convoy-mason'),child=unit(b,'convoy-gilchan');if(alive(worker)&&alive(child)&&alive(unit(b,'20.town-refugee'))&&party.some(u=>u.cls==='knight'&&V.near(u,point,300))&&[worker,child].every(u=>V.near(u,point,650))){q.elapsed=Math.min(.8,q.elapsed+Math.max(0,dt));if(q.elapsed>=.8){root.outsideProof={phaseA:true,actor:q.actor,townReporter:'20.town-refugee',survivors:(b.honroV4Convoy||[]).filter(id=>alive(unit(b,id))),timeGapReady:true,townCrisisReady:true};V.ackSlot(b,'20.time-gap.required',{phaseA:true,place:'outside'});V.ackSlot(b,'20.current-town-crisis.required',{phaseA:true,place:'outside'});}}}
 }
 if(n===23&&root.carrierStarted){const s=V.current(b);if(['dock-mid','dock-exit'].includes(s?.id))escort(app,s,['act3-carrier'],'carrierGoals');}
 if(n===24&&root.done['shrine-seal']){root.entrances??={};for(const q of b.honroV4Entrances||[])if(q.classes.every(cls=>V.heroes(b).some(u=>u.cls===cls&&V.near(u,mark(b,q.marker),115))))root.entrances[q.id]=true;}
 if(n===28){const stopped=root.done['fire-screen']&&root.done['water-release'];if(!stopped)root.fireTurns=Math.max(0,(b.teamEnds?.[1]||0)-root.fireStartEnd);
  if(stopped&&root.done['party-reunion']){const q=b.honroV4FireEvacuation;if(q){const ids=[q.guard,...q.ids];let done=true;for(const [i,id]of ids.entries())if(!walk(app,unit(b,id),{x:q.destination.x-i*80,y:q.destination.y},{lead:i===0,radius:100}))done=false;if(done&&q.ids.every(id=>(unit(b,id)?.honroV4Distance||0)>100))root.evacuationSafe=true;}}
 }
}
function failure(b){if(b.honroStage===28&&!(m(b).done['fire-screen']&&m(b).done['water-release'])&&m(b).fireTurns>=12)return'v4.28.fire';return null;}
function complete(b){if(b.honroStage===28)return !!m(b).evacuationSafe;if(b.honroStage===19)return !!m(b).transportTraceProof;if(b.honroStage===20)return careReady(b)&&!!m(b).ringRemoved&&!!m(b).outsideProof&&!!m(b).convoyGoals?.escape;return true;}
function state(b){if(b.honroStage!==20)return{};const q=convoyCare(b),u=unit(b,q.injured.id);return q.injured.status==='waiting-support'&&alive(u)?{targets:[{id:'20.injured-support',kind:'actor',label:'20.injured-support',x:u.x,y:u.y}]}:{};}
function draw(scene,c,b){const n=b.honroStage,root=m(b),time=scene.time||0;
 if(n===19){for(let i=1;i<=3;i++){const p=mark(b,'separate-'+i),q=root.farewell?.['send-'+i],progress=q?.elapsed||0;if(root.done['send-'+i])continue;const x=p.x+38+progress*180,y=p.y-progress*120;c.save();c.translate(x,y);c.scale(.6,.6);c.globalAlpha=(root.done['separate-'+i]?.8:.35)*(1-progress);for(const path of G.HONRO_FAREWELL_SPIRITS?.farewell||[]){c.fillStyle=path.fill;c.fill(new Path2D(path.d));}c.restore();if(root.done['separate-'+i]){c.fillStyle='#a89b76';c.fillRect(p.x-38,p.y-12,30,12);}}
  const p=mark(b,'old-soul');c.save();c.translate(p.x,p.y);c.fillStyle='#70796b';c.fillRect(-70,-27,140,27);c.strokeStyle='#b9ae85';c.lineWidth=3;for(let i=0;i<3;i++){c.strokeRect(-52+i*44,-24,27,19);c.beginPath();c.moveTo(-47+i*44,-18);c.lineTo(-31+i*44,-11);c.stroke();}c.restore();
 }
 if(n===20){const p=mark(b,'20.ring');c.save();c.translate(p.x,p.y);c.rotate(root.ringRemoved?Math.PI*.42:0);c.fillStyle='#645640';c.fillRect(-7,-60,14,60);c.fillStyle='#b3a889';c.fillRect(-10,-50,20,13);c.restore();
  const q=convoyCare(b),a=q.injured,u=unit(b,a.id),h=unit(b,a.supportId),bag=q.baggage,owner=unit(b,bag.owner),son=unit(b,'convoy-gilchan');
  if(alive(u)&&a.stopped){c.save();c.strokeStyle='#b5ae93';c.lineWidth=7;c.beginPath();c.moveTo(u.x-13,u.y-u.h*.59);c.lineTo(u.x+13,u.y-u.h*.67);if(a.status==='supported'&&alive(h)&&V.near(h,u,185)){c.moveTo(u.x,u.y-u.h*.6);c.lineTo(h.x,h.y-h.h*.59);}c.stroke();c.restore();}
  if(alive(owner)){const t=bag.status==='handoff'?bag.elapsed/.65:0,x=owner.x+(alive(son)?son.x-owner.x:0)*t,y=owner.y+(alive(son)?son.y-owner.y:0)*t;c.save();c.translate(x+owner.r+4,y-owner.h*.49);c.fillStyle='#79664b';c.strokeStyle='#c3b18a';c.lineWidth=2;c.fillRect(-13,-14,26,29);c.strokeRect(-13,-14,26,29);c.beginPath();c.moveTo(-13,1);c.lineTo(13,1);c.moveTo(0,-14);c.lineTo(0,15);c.stroke();c.restore();}}
 for(const q of b.honroV4MaterialEvidence||[]){c.save();c.translate(q.x+45,q.y);c.fillStyle='#8c7958';c.fillRect(-27,-29,54,29);c.strokeStyle='#b9a780';c.lineWidth=3;c.strokeRect(-25,-28,50,27);c.beginPath();c.moveTo(-14,-27);c.lineTo(5,-55);c.lineTo(18,-24);c.stroke();c.restore();}
 if(n===22&&b.honroV4RecordBundle){const q=b.honroV4RecordBundle;c.fillStyle='#c1b493';for(let i=0;i<3;i++)c.fillRect(q.x-36+i*26,q.y-44+i*5,22,33);}
 if(n===26||n===28){const p=n===26?b.honroV4Smoke:{x:5270,y:2080};if(p){c.save();c.fillStyle='#20292755';for(let i=0;i<4;i++){c.beginPath();c.ellipse(p.x+Math.sin(time*.35+i)*25,p.y-i*45-(time*10%35),32+i*8,55,0,0,Math.PI*2);c.fill();}c.restore();}}
}
const plugin={author,prepare,attach,use,stepSatisfied,tick,failure,complete,state,draw,convoyCare,careReady};for(const id of [19,20,21,22,23,24,25,26,27,28])V.register(id,plugin);
G.HonroAct23V4Act3=plugin;
})(globalThis);
