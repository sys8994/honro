(function(G){'use strict';
// Candidate mechanics only. Scene slots and labels are stable IDs; prose is
// supplied separately. Existing battles never enter this module implicitly.
const C=G.HONRO_CORE,V=G.HonroAct23V4,B=G.HonroStage18Bell,clone=x=>JSON.parse(JSON.stringify(x));
const RESIDENT='18.survivor',SPIRIT='18.survivor-spirit',HOIST='18.hoist-device',BOSS='act2-keeper';
const active=b=>V.active(b)&&b.honroStage===18;
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
const serial=b=>b.honroState.actorTurnSerial||0;
function memory(b){const root=V.mem(b);return root.stage18??={version:2,rescued:false,rescueSafe:false,rescueDistance:0,brakeLocked:false,connectionsChecked:false,threat:{started:false,lowered:false,distance:0},hoistStarted:false,hoistProtected:false,protection:{},liftDone:false,bossDeath:false,supportReady:false,settled:false,locks:{west:false,east:false},stable:false,souls:false,bell:{status:'suspended',offset:b.honroV4Stage18?.initialOffset??0,offsetX:0,lifts:0,reseats:0},slots:{}};}
const STEPS=[['18.descent','v4-18-descent'],['18.brake','v4-18-brake'],['18.rescue','v4-18-rescue'],['18.rescue-safe','v4-18-rescue-safe'],['18.hoist','v4-18-hoist'],['18.keeper','v4-18-death'],['18.inspect','v4-18-inspect'],['18.lift','v4-18-lift'],['18.support','v4-18-support'],['18.settle','v4-18-settle'],['18.lock-west','v4-18-lock'],['18.lock-east','v4-18-lock'],['18.souls','v4-18-souls']].map(([id,kind])=>({id,label:id,kind,...(['18.descent','18.brake'].includes(id)?{parallelGroup:'18.brake-phase'}:{}),...(id==='18.rescue'?{requiredClass:'occultist'}:{}),...(id.startsWith('18.lock-')?{parallelGroup:'18.final-locks'}:{})}));
const marker=(b,id)=>(b.honroMarkers||[]).find(m=>m.id===id);
const unit=(b,id)=>b.units.find(u=>u.id===id);
const target=b=>G.HonroQuestTargets.records(b).find(t=>t.id==='upper-chain');
function slot(app,id,context={}){const m=memory(app.engine.b);if(m.slots[id])return;m.slots[id]=true;V.slot(app,id,context);}
function surface(map,id,x){const t=map.terrains.find(t=>t.id===id),ps=t?.points||[];for(let i=0;i<ps.length-1;i++){const a=ps[i],z=ps[i+1];if(z.x>a.x&&x>=a.x&&x<=z.x)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}throw Error('18.surface:'+id);}
function supportRecord(id,x1,x2,top,bottom){return{id,name:id,type:'solid',points:[{x:x1,y:top},{x:x2,y:top},{x:x2,y:bottom},{x:x1,y:bottom}],baseMaterial:'rock',breakable:false,oneWay:false,layer:'terrain',properties:{broken:true,honroV4Support:true,honroBell:true,honroWalkEdges:[0],surfaceKind:'cave'},detail:{spacing:18,roughness:0}};}
const REST_OFFSET=-80,REST_OFFSET_X=32;
const finalSupports=()=>[supportRecord('18.support-west',5700,6150,6530,7480),supportRecord('18.support-east',8340,8780,6530,7410)];
function author(map){
 map.initialState??={};map.initialState.honroV4Steps=clone(STEPS);
 const gallery=x=>surface(map,'sb-east-gallery-sill',x),floor=x=>surface(map,'act2-floor',x);
 const at={descent:{x:9410,y:gallery(9410)},brake:{x:9410,y:gallery(9410)},rescue:{x:9080,y:gallery(9080)},safe:{x:9420,y:gallery(9420)},hoist:{x:6910,y:floor(6910)},inspect:{x:6910,y:floor(6910)},lift:{x:6910,y:floor(6910)},keeper:{x:7740,y:floor(7740)},support:{x:6770,y:floor(6770)},settle:{x:6910,y:floor(6910)},'lock-west':{x:6500,y:floor(6500)},'lock-east':{x:9000,y:floor(9000)},souls:{x:6770,y:floor(6770)}};
 map.markers=map.markers.filter(m=>m.action!=='act2'&&m.type!=='act2'&&m.type!=='act2-wave');
 for(const s of STEPS){const key=s.id.slice(3)==='rescue-safe'?'safe':s.id.slice(3);map.markers.push({id:s.id,type:'act2',action:'act2',label:s.id,...at[key],radius:220,...(s.id==='18.rescue'?{target:RESIDENT}:{})});}
 map.units=map.units.filter(u=>![RESIDENT,SPIRIT,HOIST].includes(u.id));
 map.units.push({id:RESIDENT,kind:'object:civilian',team:'npc',x:9450,y:gallery(9450),label:RESIDENT,stageOverrides:{honroProtected:true,honroV4Rescue:true,honroAlly:true,allyRole:'channeler',fixed:false,h:92,r:22,hp:480,maxHp:480,maxMove:440,moveLeft:440,walkSpeed:170,honroHypnotized:true,loadout:[]}},
 {id:HOIST,kind:'object:gate',team:'npc',...at.hoist,label:HOIST,stageOverrides:{honroProtected:true,honroV4Hoist:true,honroAlly:true,allyRole:'channeler',fixed:true,h:110,r:30,hp:640,maxHp:640,maxMove:0,moveLeft:0,loadout:[]}});
 map.initialState.honroV4Stage18={version:2,initialOffset:-120,threatOffset:-40,threatPoint:at.rescue,liftOffset:-180,restOffset:REST_OFFSET,restOffsetX:REST_OFFSET_X,duration:.9,safeRegion:{x:9370,y:6290,w:230,h:160},safePoint:at.safe,hoistRadius:340,supportIds:['18.support-west','18.support-east']};
 map.initialState.honroAct23V4TrajectoryForce={revision:1,ax:40,zone:{x:6250,y:6700,w:1900,h:650}};
 map.terrains=map.terrains.filter(t=>!t.id.startsWith('18.support-'));
 map.terrains.push(...finalSupports());
 // Keep the existing finite response and its authored alternatives. No old
 // objective, warning prose or event ID may re-enter the candidate quest.
 map.events=(map.events||[]).filter(ev=>ev.id==='bell-suppression-answer').map(ev=>({...ev,id:'18.rescue-response',warning:'18.rescue-response.warning',honroDensityTrigger:{objectiveDone:'18.rescue'},when:{after:'density-gate-18.rescue-response'},action:retag(ev.action,'18.rescue-response'),honroDensityAlternatives:ev.honroDensityAlternatives?.map(rows=>rows.map(a=>retag(a,'18.rescue-response')))}));
 delete map.initialState.honroBellAnomalyRevision;delete map.initialState.honroBellAnomaly;delete map.initialState.honroBellWitness;
}
function retag(action,id){if(!action)return action;return{...action,source:id,...(action.actions?{actions:action.actions.map(a=>retag(a,id))}:{})};}
function prepare(b){if(!active(b))return;const m=memory(b),boss=unit(b,BOSS);if(boss)delete boss.honroNonlethal;
 V.mem(b).silenced=true;
 if(!m.initialOffsetApplied){B.shift(b,b.honroV4Stage18.initialOffset);m.bell.offset=b.honroV4Stage18.initialOffset;m.initialOffsetApplied=true;}
 if(!unit(b,SPIRIT)){const npc=unit(b,RESIDENT);const spirit=C.makeUnit('occultist',1,npc.x,npc.y-10,{id:SPIRIT,name:SPIRIT,honroSpirit:true,honroV4Possession:true,honroObjectiveTarget:true,role:'objective',fixed:true,h:70,r:18,hp:1,maxHp:1,maxMove:0,moveLeft:0,loadout:[],xpBudget:0,xpGranted:0});b.units.push(spirit);}
 delete b.honroBellAnomalyRevision;delete b.honroBellAnomaly;delete b.honroBellWitness;
 // Factory/tuning defaults are applied before this hook. Keep current local HP.
 for(const u of b.units){const hp=u.honroStage18LocalHp;if(hp&&!u.honroV4Stage18Tuned){u.combatBaseHp=hp/C.DIFFICULTIES.normal.hp;u.hp=u.maxHp=Math.round(u.combatBaseHp*C.DIFFICULTIES[b.difficulty].hp);u.honroV4Stage18Tuned=1;const row=G.HonroProgression.contributionState(b)?.enemies[u.honroContributionId||u.id];if(row&&row.progress===0)row.hp=u.maxHp;}}
}
const overlap=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
function shape(points){const xs=points.map(p=>p.x),ys=points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:points,broken:false,oneWay:false};}
// A new sweep is serialized for each direction. The legacy down-only cache
// and its authored +200 sweep are deliberately never reused for a lift.
function segmentSweep(b,to,toX=memory(b).bell.offsetX){const ids=new Set(b.honroBellDescent.terrainIds),delta=to-memory(b).bell.offset,dx=toX-memory(b).bell.offsetX,out=[];for(const t of b.terrain)if(ids.has(t.id)){const ps=C.poly(t).map(p=>({x:p.x,y:p.y})),zs=ps.map(p=>({x:p.x+dx,y:p.y+delta}));out.push(shape(ps),shape(zs));for(let i=0;i<ps.length;i++){const j=(i+1)%ps.length;if(Math.abs(ps[i].x-ps[j].x)*Math.abs(delta)+Math.abs(ps[i].y-ps[j].y)*Math.abs(dx)>.001)out.push(shape([ps[i],ps[j],zs[j],zs[i]]));}}return out;}
function shiftX(b,x){const m=memory(b),dx=x-m.bell.offsetX;if(Math.abs(dx)<1e-9)return;const spec=b.honroBellDescent,ids=new Set(spec.terrainIds||[]);for(const list of[b.terrain,b.honroWorldTerrain])for(const t of list||[])if(ids.has(t.id)){t.x+=dx;t.vertices=t.vertices?.map(p=>({...p,x:p.x+dx}));}
 const arts=new Set(spec.elementIds||[]);for(const list of[b.honroEnvironment?.placements,b.honroLandmarks,b.honroElements])for(const e of list||[])if(arts.has(e.id))e.x+=dx;m.bell.offsetX=x;
}
function intersectsShapes(shapes,box){return shapes.some(t=>overlap(t,box)&&C.terrainRectIntersects(t,box.x,box.y,box.w,box.h,.01));}
function occupants(b,shapes=memory(b).bell.segment?.sweep||[]){const out=[],add=(kind,id,box)=>{if(intersectsShapes(shapes,box))out.push({kind,id});};
 for(const u of b.units)if(alive(u))add(u.summoned?'summon':u.side===0?'hero':u.honroProtected?'resident':'enemy',u.id,{x:u.x-u.r-8,y:u.y-u.h-8,w:u.r*2+16,h:u.h+16});
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>b.round))add('stake',s.id,{x:s.x-24,y:s.y-74,w:48,h:80});
 for(const p of b.projectiles||[])add('projectile',p.id,{x:p.x-(p.radius||6),y:p.y-(p.radius||6),w:(p.radius||6)*2,h:(p.radius||6)*2});
 return out;
}
function paused(app){return !!app.dialogue||!!app.modal?.classList.contains('open')||!!app.storyHistoryOpen||!!G.HonroStory?.turnPaused?.(app);}
function safe(app){const b=app.engine.b;return !paused(app)&&!app.done&&!['won','lost','ally'].includes(b.phase)&&!b.keeperRitual?.cast&&!b.cast&&B.safeBoundary(app);}
function begin(app,kind,to,toX=memory(app.engine.b).bell.offsetX){const b=app.engine.b,m=memory(b);if(m.bell.segment||m.bell.status==='moving')return false;
 m.bell.segment={kind,from:m.bell.offset,to,fromX:m.bell.offsetX,toX,sweep:segmentSweep(b,to,toX),warnSerial:serial(b),heroes:b.units.filter(hero).map(u=>u.id),offered:{},opportunities:{},elapsed:0,duration:b.honroV4Stage18.duration};m.bell.status='warning';m.bell.blockers=[];slot(app,'18.'+kind+'.warning',{from:{x:m.bell.offsetX,y:m.bell.offset},to:{x:toX,y:to},brakeMarker:'18.brake',survivorId:RESIDENT,safeRegion:clone(b.honroV4Stage18.safeRegion)});app.dirty=true;app.engine.emit?.('save');return true;
}
function offer(app){const e=app.engine,b=e.b,m=memory(b),u=e.active;if(paused(app)||b.side!==0||b.phase!=='aim'||!hero(u)||u.acted||!e.canAct())return;
 if(m.bell.segment&&m.bell.status!=='moving')m.bell.segment.offered[u.id]=serial(b);
}
function transition(app){const e=app.engine,b=e.b,m=memory(b),q=m.bell.segment;if(!q||m.bell.status==='moving'||paused(app))return;
 const action=e.honroV4Stage18Action,u=action&&e.unit(action.id);
 if(action&&app.actorBoundary===action.id&&hero(u)&&u.acted&&action.bell&&serial(b)>q.warnSerial)q.opportunities[u.id]=serial(b);
 const waiting=q.heroes.filter(id=>alive(unit(b,id))&&!q.opportunities[id]);m.bell.blockers=occupants(b);m.bell.waiting=waiting;
 m.bell.status=waiting.length?'warning':'waiting';if(waiting.length||m.bell.blockers.length||!safe(app))return;
 m.bell.status='moving';b.sceneVersion=(b.sceneVersion||0)+1;const old=B.memory(b);old.status='v4-moving';old.offset=m.bell.offset;app.dirty=true;e.emit?.('save');
}
function animate(app,dt){const e=app.engine,b=e.b,m=memory(b),q=m.bell.segment;if(!q||m.bell.status!=='moving'||paused(app))return;
 q.elapsed=Math.min(q.duration,q.elapsed+Math.max(0,dt));const t=q.elapsed/q.duration,k=t*t*(3-2*t),offset=q.from+(q.to-q.from)*k;B.memory(b).status='lowering';B.shift(b,offset);B.memory(b).status='v4-moving';shiftX(b,q.fromX+(q.toX-q.fromX)*k);m.bell.offset=offset;app.dirty=true;
 if(t<1)return;
 B.shift(b,q.to);shiftX(b,q.toX);m.bell.offset=q.to;if(q.kind==='threat'){m.threat.lowered=true;m.threat.distance=q.to-q.from;m.bell.status='loaded';}else if(q.kind==='lift'){m.liftDone=true;m.bell.lifts=1;m.bell.status='lifted';}else{m.settled=true;m.bell.reseats=1;m.bell.status='settled';for(const id of b.honroBellDescent.openTerrainIds||[])for(const list of[b.terrain,b.honroWorldTerrain]){const t=list?.find(t=>t.id===id);if(t)t.broken=true;}}
 B.memory(b).status=m.bell.status;B.memory(b).count=m.bell.reseats;delete m.bell.segment;b.sceneVersion=(b.sceneVersion||0)+1;slot(app,'18.'+q.kind+'.complete');e.emit?.('save');
}
function cleanupDeath(app){const e=app.engine,b=e.b,m=memory(b),boss=unit(b,BOSS);if(!boss||!boss.dead||boss.hp>0)return;
 if(!m.bossDeath){m.bossDeath=true;m.deathSerial=serial(b);m.deathRound=b.round;slot(app,'18.keeper.death',{unitId:BOSS});}
 if(b.keeperRitual){delete b.keeperRitual.cast;delete b.keeperRitual.zone;b.keeperRitual.suppressed=0;}
 for(const u of b.units)if(u.keeperBinding===BOSS){if(u.bound===1)u.bound=0;delete u.keeperBinding;}
 b.queue=b.queue.filter(id=>id!==BOSS);delete boss.aiMove;delete boss.moveTarget;delete boss.meleeAction;boss.vx=boss.vy=0;
 const response='18.rescue-response',hs=b.honroState;if(!hs.flags?.['event:'+response]){hs.flags??={};hs.flags['event:'+response]='cancelled:18.keeper.death';hs.pendingEvents=(hs.pendingEvents||[]).filter(id=>id!==response);const warning=hs.encounterDensity?.warnings?.[response];if(warning)warning.cancelled=true;}
 const pitch=b.honroState.mukjongPitchDialogue;for(const key of['first','tighten'])if(pitch?.[key]?.status==='pending'){pitch[key].status='discarded';pitch[key].reason='18.keeper.death';}
 if(b.honroState.mukjongAudio?.pitch)b.honroState.mukjongAudio.pitch.stopped=true;
 // Stable candidate voice slots are not observations once their owner died.
 const root=V.mem(b);for(const q of Object.values(root.slots||{}))if(q.status==='pending'&&(q.owner===BOSS||q.context?.owner===BOSS||q.context?.actorId===BOSS)){q.status='cancelled';q.reason='18.keeper.death';}
}
function hypnosisTick(app,dt){const e=app.engine,b=e.b,m=memory(b),npc=unit(b,RESIDENT),spirit=unit(b,SPIRIT),spec=b.honroV4Stage18;if(m.rescued||!alive(npc)||paused(app)||m.bell.status==='moving'||dt<=0||b.side!==0||b.phase!=='aim'||!e.canAct())return;
 if(!m.brakeLocked&&npc.x>spec.threatPoint.x+2){const before=npc.x;npc.fixed=false;e.walk(npc,-1,Math.min(dt,.05,(npc.x-spec.threatPoint.x)/npc.walkSpeed),true);m.threat.walked=(m.threat.walked||0)+Math.abs(npc.x-before);}
 const site=marker(b,'18.rescue');if(site){site.x=npc.x;site.y=npc.y;}
 if(alive(spirit)){spirit.x=npc.x;spirit.y=npc.y-10;}
 if(!m.threat.started&&!m.brakeLocked&&npc.x<=spec.threatPoint.x+2){m.threat.started=true;begin(app,'threat',spec.threatOffset);}
}
function rescueTick(app,dt){const e=app.engine,b=e.b,m=memory(b),npc=unit(b,RESIDENT),spec=b.honroV4Stage18;if(!m.rescued||m.rescueSafe||!alive(npc)||paused(app)||m.bell.status==='moving'||dt<=0)return;
 if(b.side!==0||b.phase!=='aim'||!e.canAct())return;
 const leader=b.units.filter(hero).filter(u=>u.x>npc.x+55&&Math.abs(u.y-npc.y)<160&&Math.hypot(u.x-npc.x,u.y-npc.y)<650).sort((a,z)=>z.x-a.x)[0];if(!leader)return;
 if(m.rescueMoveRound!==b.round){m.rescueMoveRound=b.round;npc.moveLeft=npc.maxMove;}
 const before={x:npc.x,y:npc.y};e.walk(npc,1,Math.min(dt,.05),true);m.rescueDistance+=Math.hypot(npc.x-before.x,npc.y-before.y);
 const r=spec.safeRegion;if(npc.x-npc.r>=r.x&&npc.x+npc.r<=r.x+r.w&&npc.y>=r.y&&npc.y<=r.y+r.h&&m.rescueDistance>=120&&e.grounded(npc)){m.rescueSafe=true;npc.fixed=true;npc.vx=npc.vy=0;m.rescueSafeSerial=serial(b);slot(app,'18.rescue.safe',{unitId:RESIDENT});}
}
function protection(app){const e=app.engine,b=e.b,m=memory(b),a=e.honroV4Stage18Action,u=a&&e.unit(a.id),site=unit(b,HOIST);if(!m.hoistStarted||m.hoistProtected||!alive(site)||!a?.protect||app.actorBoundary!==a.id||!hero(u)||!u.acted||paused(app))return;
 if(Math.hypot(u.x-site.x,u.y-site.y)>b.honroV4Stage18.hoistRadius||b.units.some(v=>alive(v)&&v.side===1&&!v.honroObjectiveTarget&&Math.hypot(v.x-site.x,v.y-site.y)<260))return;
 m.protection[serial(b)]=u.id;if(Object.keys(m.protection).length>=2){m.hoistProtected=true;slot(app,'18.hoist.protected');}
}
function prepareSupport(app){const b=app.engine.b,m=memory(b);if(!m.supportRequested||m.supportReady||!safe(app))return;const supports=b.terrain.filter(t=>b.honroV4Stage18.supportIds.includes(t.id));if(supports.length!==2||occupants(b,supports.map(t=>({...t,broken:false}))).length)return;
 for(const list of[b.terrain,b.honroWorldTerrain])for(const t of list||[])if(b.honroV4Stage18.supportIds.includes(t.id))t.broken=false;
 m.supportReady=true;b.sceneVersion=(b.sceneVersion||0)+1;slot(app,'18.support.prepared');app.dirty=true;app.engine.emit?.('save');
}
function stepSatisfied(b,s){if(!active(b))return null;const m=memory(b);switch(s.id){case'18.descent':return m.threat.lowered||m.brakeLocked;case'18.brake':return m.brakeLocked;case'18.rescue':return m.rescued;case'18.rescue-safe':return m.rescueSafe;case'18.inspect':return m.connectionsChecked;case'18.hoist':return m.hoistProtected;case'18.lift':return m.liftDone;case'18.keeper':return m.bossDeath;case'18.support':return m.supportReady;case'18.settle':return m.settled;case'18.lock-west':return m.locks.west;case'18.lock-east':return m.locks.east;case'18.souls':return m.souls;default:return null;}}
function completeInteraction(app,id){const s=V.steps(app.engine.b).find(s=>s.id===id);if(s)V.completeStep(app,s,app.engine.active);}
function use(app,site){const e=app.engine,b=e.b,m=memory(b),u=e.active,current=V.current(b);if(!site?.id?.startsWith('18.'))return undefined;
 const ready=V.readySteps(b).some(s=>s.id===site.id),at=site.id==='18.rescue'?unit(b,RESIDENT):site;
 if(!hero(u)||!e.canAct()||paused(app)||m.bell.status==='moving'||!ready||Math.hypot(u.x-at.x,u.y-at.y)>220)return false;
 let ok=false;
 if(site.id==='18.brake'&&!m.brakeLocked){m.brakeLocked=true;m.brakeSerial=serial(b);if(m.bell.segment?.kind==='threat'){delete m.bell.segment;m.threat.prevented=true;}m.bell.status='braked';B.memory(b).status='braked';unit(b,RESIDENT).fixed=true;slot(app,'18.brake.locked');completeInteraction(app,site.id);ok=true;}
 else if(site.id==='18.rescue'&&u.cls==='occultist'&&m.brakeLocked&&!m.rescued&&alive(unit(b,RESIDENT))){const npc=unit(b,RESIDENT),spirit=unit(b,SPIRIT);if(!spirit)return false;if(alive(spirit)){spirit.hp=0;spirit.dead=true;spirit.honroReleased=true;}m.extraction={actorId:u.id,spiritId:SPIRIT,serial:serial(b),residentHp:npc.hp};m.rescued=true;m.rescueOrigin={x:npc.x,y:npc.y};npc.honroHypnotized=false;npc.honroResolved=true;npc.fixed=false;slot(app,'18.rescue.released',{unitId:RESIDENT,actorId:u.id});completeInteraction(app,site.id);ok=true;}
 else if(site.id==='18.hoist'&&!m.hoistStarted&&m.rescueSafe&&alive(unit(b,HOIST))){m.hoistStarted=true;slot(app,'18.hoist.started');ok=true;}
 else if(site.id==='18.inspect'&&m.bossDeath&&m.rescueSafe&&m.brakeLocked){m.connectionsChecked=true;slot(app,'18.connections.checked');completeInteraction(app,site.id);ok=true;}
 else if(site.id==='18.lift'&&m.bossDeath&&m.rescueSafe&&m.brakeLocked&&m.connectionsChecked&&m.hoistProtected&&!m.liftDone)ok=begin(app,'lift',b.honroV4Stage18.liftOffset);
 else if(site.id==='18.support'&&m.liftDone&&!m.supportReady&&!m.supportRequested){m.supportRequested=true;ok=true;}
 else if(site.id==='18.settle'&&m.liftDone&&m.supportReady&&m.bossDeath&&!m.settled)ok=begin(app,'settle',b.honroV4Stage18.restOffset,b.honroV4Stage18.restOffsetX);
 else if(site.id.startsWith('18.lock-')&&m.settled){const side=site.id.slice(8);if(!['west','east'].includes(side)||b.units.some(v=>alive(v)&&v.side===1&&!v.honroObjectiveTarget&&Math.hypot(v.x-site.x,v.y-site.y)<400))return false;m.locks[side]={actorId:u.id,serial:serial(b),round:b.round};m.stable=!!m.locks.west&&!!m.locks.east;slot(app,site.id+'.confirmed');completeInteraction(app,site.id);ok=true;}
 else if(site.id==='18.souls'&&m.rescueSafe&&m.liftDone&&m.bossDeath&&m.settled&&m.stable){m.souls=true;slot(app,'18.souls.ready');completeInteraction(app,site.id);ok=true;}
 if(ok){e.finishAction();app.dirty=true;}return ok;
}
function attach(app,e){if(!active(e.b))return;guardPitch();if(e.honroV4Stage18Attached)return;e.honroV4Stage18Attached=true;const b=e.b;memory(b);const boss=unit(b,BOSS);if(boss)delete boss.honroNonlethal;
 const tick=e.tick.bind(e);e.tick=function(dt){if(memory(e.b).bell.status==='moving'){animate(app,dt);return;}const out=tick(dt);cleanupDeath(app);return out;};
 const can=e.canAct.bind(e);e.canAct=function(){return memory(e.b).bell.status!=='moving'&&can();};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),site=unit(e.b,HOIST),previous=e.honroV4Stage18Action;e.honroV4Stage18Action=hero(u)&&!u.acted?{id:u.id,bell:m.bell.segment?.offered[u.id]!==undefined,protect:m.hoistStarted&&alive(site)&&Math.hypot(u.x-site.x,u.y-site.y)<=e.b.honroV4Stage18.hoistRadius}:null;try{return finish(...args);}finally{e.honroV4Stage18Action=previous;}};
 cleanupDeath(app);
}
function tick(app,dt){const b=app.engine.b;if(!active(b))return;cleanupDeath(app);if(memory(b).bell.status==='moving')return;if(paused(app)||['won','lost'].includes(b.phase))return;hypnosisTick(app,dt);protection(app);rescueTick(app,dt);prepareSupport(app);transition(app);offer(app);}
function failure(b){if(!active(b))return null;if(!alive(unit(b,RESIDENT)))return'18.failure.survivor';if(!alive(unit(b,HOIST)))return'18.failure.hoist';return null;}
function complete(b){if(!active(b))return false;const m=memory(b);return !failure(b)&&m.brakeLocked&&m.rescueSafe&&m.extraction?.actorId&&m.hoistProtected&&m.connectionsChecked&&m.liftDone&&m.bossDeath&&m.supportReady&&m.settled&&m.locks.west&&m.locks.east&&m.stable&&m.souls;}
function state(b){if(!active(b))return null;const m=memory(b),s=V.steps(b).find(s=>!stepSatisfied(b,s)),site=s&&marker(b,s.id);return{complete:complete(b),objectiveReady:complete(b),minimumRound:1,settleRounds:0,summary:s?.id||'18.complete',targets:site?[{id:site.id,label:site.id,kind:'interact',x:site.x,y:site.y}]:[],allTargets:V.steps(b).map(s=>({...marker(b,s.id),label:s.id,done:stepSatisfied(b,s)})),bell:{status:m.bell.status,blockers:m.bell.blockers||[],waiting:m.bell.waiting||[]}};}
function draw(scene,c,b){if(!active(b))return;const m=memory(b),q=m.bell.segment,r=b.honroV4Stage18.safeRegion,z=Math.max(.05,scene.scale||1);c.save();
 if(q){c.fillStyle='#dfaa6220';c.strokeStyle='#dfaa6290';c.lineWidth=1.5/z;for(const t of q.sweep){c.beginPath();t.vertices.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();c.stroke();}c.fillStyle='#8cc7c822';c.fillRect(r.x,r.y,r.w,r.h);
  const from={x:7200+q.fromX,y:6610+q.from},to={x:7200+q.toX,y:6610+q.to},angle=Math.atan2(to.y-from.y,to.x-from.x),size=Math.min(24,10/z);c.strokeStyle='#edc18e';c.lineWidth=3/z;c.beginPath();c.moveTo(from.x,from.y);c.lineTo(to.x,to.y);for(const sign of[-1,1]){c.moveTo(to.x,to.y);c.lineTo(to.x-Math.cos(angle+sign*.55)*size,to.y-Math.sin(angle+sign*.55)*size);}c.stroke();
 }
 for(const id of['18.brake','18.lock-west','18.lock-east']){const p=marker(b,id),on=id==='18.brake'?m.brakeLocked:m.locks[id.slice(8)];c.strokeStyle=on?'#88c7aa':'#d5ae72';c.lineWidth=4/z;c.beginPath();c.arc(p.x,p.y-65,22/z,0,Math.PI*2);c.stroke();if(on){c.beginPath();c.moveTo(p.x-12/z,p.y-65);c.lineTo(p.x-2/z,p.y-55);c.lineTo(p.x+14/z,p.y-77);c.stroke();}}
 const npc=unit(b,RESIDENT);if(alive(npc)&&npc.honroHypnotized){c.strokeStyle='#bdad7490';c.lineWidth=2/z;c.beginPath();c.ellipse(npc.x,npc.y-55,32+Math.sin((scene.time||0)*5)*3,12,0,0,Math.PI*2);c.stroke();}c.restore();}
// Candidate Phase A never emits the pre-v4 pitch dialogue. Audio and old
// snapshots retain their original behavior.
function guardPitch(){for(const key of['heard','ritual','tick']){const old=G.HonroMukjongPitchDialogue?.[key];if(!old||old.honroV4Stage18Guard)continue;const wrapped=function(app,...args){if(active(app.engine?.b))return;return old(app,...args);};wrapped.honroV4Stage18Guard=true;G.HonroMukjongPitchDialogue[key]=wrapped;}}
guardPitch();
const plugin={author,prepare,attach,tick,use,stepSatisfied,failure,complete,state,draw,memory,segmentSweep,occupants,begin,transition,animate,cleanupDeath,steps:STEPS,finalSupports,restOffset:REST_OFFSET,restOffsetX:REST_OFFSET_X};
G.HonroAct23V4Stage18=plugin;V.register(18,plugin);
})(globalThis);
