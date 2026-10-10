(function(G){'use strict';
// The saved battle opts in. Old campaigns, imported maps and Continue payloads
// never acquire this revision, geography, roster, movement or event state.
const C=G.HONRO_CORE,E=G.HonroEncounters,W=G.HonroAllies,P=G.HonroProgression;
const active=b=>b?.honroStage===8&&!b.honroCustom&&b.honroStage8BierRevision===1;
const clone=x=>JSON.parse(JSON.stringify(x)),alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
// A real Lv7->8 combat grant applies trained critical stats. Legacy remount
// reinitializes only these fields from untrained ranks, so retain finite saved
// fields only for an already-ledgered new8 snapshot. Fresh/old/missing fields
// still use the original progression initializer and reward arithmetic.
const initialize=P.initialize;P.initialize=function(b,profile){const saved=active(b)&&b.honroGrowth?.ledger?b.units.filter(u=>u.side===0&&!u.summoned||u.honroAlly).map(u=>({u,fields:Object.fromEntries(['critChance','critMultiplier'].filter(k=>Number.isFinite(u[k])).map(k=>[k,u[k]]))})):[];const out=initialize(b,profile);for(const {u,fields}of saved)Object.assign(u,fields);return out;};

const sources=['stage8-first-seal','stage8-settled-crows','stage8-low-health'],SCENE='stage8-bier-courtyard-v1';
const gate=source=>'stage8-gate-'+source.slice('stage8-'.length),serial=b=>b.honroState.actorTurnSerial||0;
const spec=b=>b.honroStage8BierSpec||{},boss=b=>b.units.find(u=>u.id==='boss');
function memory(b){return b.honroState.stage8Bier??={version:1,status:'anchored',completedOnce:0,sealIdsSeen:[],warnings:{},entries:{},offered:{},blockers:[]};}
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const ownedScene=app=>app.dialogue?.staging?.id===SCENE;
const paused=app=>!!app.dialogue||!!app.charging||!!app.modal?.classList.contains('open')||!!G.document?.hidden||!!app.storyHistoryOpen||!!G.HonroStory?.turnPaused?.(app);
const scenePaused=app=>!!app.charging||!!app.modal?.classList.contains('open')||!!G.document?.hidden||!!app.storyHistoryOpen||!!app.dialogue&&!ownedScene(app);
function safeMotion(app,scene=false){const e=app.engine,b=e.b;return !ended(app)&&!(scene?scenePaused(app):paused(app))&&!['flight','review','summon','ally'].includes(b.phase)&&!(b.projectiles||[]).length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!e.settleBusy();}
const safeBoundary=app=>!!app.actorBoundary&&safeMotion(app);
const boundary=app=>[serial(app.engine.b),app.engine.b.round,...app.engine.b.teamEnds,app.actorBoundary].join(':');
const overlaps=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
const rect=u=>({x:u.x-u.r,y:u.y-u.h,w:u.r*2,h:u.h});
const circleRect=(x,y,r,a)=>Math.hypot(x-Math.max(a.x,Math.min(a.x+a.w,x)),y-Math.max(a.y,Math.min(a.y+a.h,y)))<=r;
function hazards(b,u,box){const out=[];
 for(const v of b.units)if(v.id!==u.id&&alive(v)&&overlaps(box,{x:v.x-v.r-3,y:v.y-v.h-3,w:v.r*2+6,h:v.h+6}))out.push({kind:v.summoned?'summon':v.side===0?'hero':'enemy',id:v.id,label:v.name||'동행'});
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>=b.round)&&overlaps(box,{x:s.x-24,y:s.y-74,w:48,h:80}))out.push({kind:'stake',id:s.id,label:'진목'});
 for(const p of b.projectiles||[])if(circleRect(p.x,p.y,p.radius||6,box))out.push({kind:'projectile',id:p.id,label:'날아가는 탄'});
 for(const [kind,list]of [['field',b.fields],['zone',b.zones]])for(const f of list||[]){if(f.active===false||Number.isFinite(f.expires)&&f.expires<b.round)continue;const v=f.attached&&b.units.find(v=>v.id===f.attached),x=v?.x??f.x,y=v?v.y-v.h*.5:f.y;if(circleRect(x,y,f.radius||1,box))out.push({kind,id:f.id,label:kind==='field'?'기운의 장':'남아 있는 기예'});}
 return out;
}
// A grounded body meets the connected exposed upward contour, not the entire
// support polygon. Its whole width/head/torso are swept; a roof or cave wall in
// that SAME polygon remains a blocker. This follows the engine contact model
// without treating its narrow locomotion probes as a full r70 body test.
function contacts(e,u){const q=e.contactSurface(u.x,u.y-.2,u.y+.2);if(!q)return[];const t=q.t,ps=C.poly(t),up=i=>ps[(i+1)%ps.length].x-ps[i].x>1e-7,out=[];
 for(const f of C.terrainSurfaces(t,u.x))if(Math.abs(f.y-u.y)<.25){const indices=new Set([f.edge]);for(const d of [-1,1])for(let n=1;n<ps.length;n++){const i=(f.edge+d*n+ps.length)%ps.length;if(!up(i))break;indices.add(i);}out.push({t,indices});}return out;
}
function segmentsCross(a,z,p,q){const dx=z.x-a.x,dy=z.y-a.y,ex=q.x-p.x,ey=q.y-p.y,aa=dx*dx+dy*dy,bb=ex*ex+ey*ey,px=p.x-a.x,py=p.y-a.y;
 const on=(v,c,d)=>{const x=d.x-c.x,y=d.y-c.y,n=x*x+y*y,t=n?Math.max(0,Math.min(1,((v.x-c.x)*x+(v.y-c.y)*y)/n)):0;return Math.hypot(v.x-c.x-t*x,v.y-c.y-t*y)<1e-8;};
 if(aa<1e-14)return on(a,p,q);if(bb<1e-14)return on(p,a,z);const den=dx*ey-dy*ex;
 if(Math.abs(den)<1e-10*Math.sqrt(aa*bb))return Math.abs(px*dy-py*dx)<1e-8*Math.sqrt(aa)&&Math.max(Math.min(a.x,z.x),Math.min(p.x,q.x))<=Math.min(Math.max(a.x,z.x),Math.max(p.x,q.x))+1e-8&&Math.max(Math.min(a.y,z.y),Math.min(p.y,q.y))<=Math.min(Math.max(a.y,z.y),Math.max(p.y,q.y))+1e-8;
 const t=(px*ey-py*ex)/den,u=(px*dy-py*dx)/den;return t>=0&&t<=1&&u>=0&&u<=1;
}
function polygonsOverlap(a,z){const av=C.poly(a),zv=C.poly(z);if(av.some(p=>C.terrainContains(z,p.x,p.y))||zv.some(p=>C.terrainContains(a,p.x,p.y)))return true;for(let i=0;i<av.length;i++)for(let j=0;j<zv.length;j++)if(segmentsCross(av[i],av[(i+1)%av.length],zv[j],zv[(j+1)%zv.length]))return true;return false;}
function terrainBlockers(e,u,from=u,to=u){const b=e.b,left=Math.min(from.x,to.x)-u.r,right=Math.max(from.x,to.x)+u.r,top=Math.min(from.y,to.y)-u.h,bottom=Math.max(from.y,to.y);
 if(left<0||right>b.width||top<12||bottom>b.height)return[{kind:'terrain',id:'bounds',label:'전장 가장자리'}];
 const supports=u.fixed?[]:[...contacts(e,from),...contacts(e,to)],lines=[],xs=new Set([left,right]);
 for(const {t,indices}of supports){const ps=C.poly(t);for(const i of indices){const a=ps[i],z=ps[(i+1)%ps.length],lo=Math.max(left,a.x),hi=Math.min(right,z.x);if(hi<lo)continue;const slope=(z.y-a.y)/(z.x-a.x),intercept=a.y-slope*a.x;lines.push({lo,hi,slope,intercept});for(const x of [lo,hi]){xs.add(x);if(x>left)xs.add(Math.max(left,x-.00001));if(x<right)xs.add(Math.min(right,x+.00001));}if(Math.abs(slope)>1e-9){const x=(bottom-intercept)/slope;if(x>lo&&x<hi)xs.add(x);}}}
 // The lowest allowed air contour is the exact lower envelope of the connected
 // support edges and the swept feet. Include every line crossing; this is not
 // a coarse sample which could miss a thin wall or clip a concave roof.
 for(let i=0;i<lines.length;i++)for(let j=0;j<i;j++){const a=lines[i],z=lines[j],d=a.slope-z.slope;if(Math.abs(d)<1e-9)continue;const x=(z.intercept-a.intercept)/d;if(x>Math.max(a.lo,z.lo)&&x<Math.min(a.hi,z.hi))xs.add(x);}
 const floorAt=x=>Math.min(bottom,...lines.filter(l=>x>=l.lo-1e-8&&x<=l.hi+1e-8).map(l=>l.slope*x+l.intercept))-.15;
 const ordered=[...xs].sort((a,z)=>z-a),floor=ordered.filter((x,i)=>!i||ordered[i-1]-x>1e-7).map(x=>({x,y:floorAt(x)}));if(floor.some(p=>p.y<=top))return[{kind:'terrain',id:'body-clearance',label:'몸통 여유가 없는 지형'}];
 const ps=[{x:left,y:top},{x:right,y:top},...floor],vertices=ps,shape={x:left,y:top,w:right-left,h:bottom-top,vertices,broken:false};
 return b.terrain.filter(t=>!t.broken&&!t.oneWay&&overlaps(shape,t)&&polygonsOverlap(shape,t)).map(t=>({kind:'terrain',id:t.id,label:'막힌 지형'}));
}
function bodyBlockers(e,u,from=u,to=u){const box={x:Math.min(from.x,to.x)-u.r-2,y:Math.min(from.y,to.y)-u.h-2,w:Math.abs(to.x-from.x)+u.r*2+4,h:Math.abs(to.y-from.y)+u.h+4};return [...terrainBlockers(e,u,from,to),...hazards(e.b,u,box)];}
const temporary=['fixed','moveLeft','walkSpeed','bound','slowed'];
function walkStep(e,u,target,distance=4,speed=900){const previous={x:u.x,y:u.y},probe={...u,r:u.r,h:u.h},saved=Object.fromEntries(temporary.map(k=>[k,{has:Object.hasOwn(probe,k),value:probe[k]}]));
 Object.assign(probe,{fixed:false,moveLeft:distance+1,walkSpeed:speed,bound:0,slowed:undefined});
 e.walk(probe,Math.sign(target.x-probe.x),Math.min(distance,Math.abs(target.x-probe.x))/speed,true);
 const blocked=bodyBlockers(e,probe,previous,probe);for(const [k,v]of Object.entries(saved)){if(v.has)probe[k]=v.value;else delete probe[k];}
 if(blocked.length)return{blocked};if(Math.hypot(probe.x-previous.x,probe.y-previous.y)<.001&&Math.abs(target.x-probe.x)>.15)return{blocked:[{kind:'route',id:'support',label:'이어지지 않는 지지면'}]};
 return{pose:probe,distance:Math.hypot(probe.x-previous.x,probe.y-previous.y)};
}
function probeRoute(app,points){const e=app.engine,u=boss(e.b);if(!alive(u)||u.fixed||u.airborne||u.jumping||Math.abs(u.vy||0)>3||!C.validTerrainContactPose(e.b.terrain,u))return{blocked:[{kind:'route',id:'origin',label:'상여의 현재 접지'}]};
 let probe={...u},distance=0;const start=bodyBlockers(e,probe);if(start.length)return{blocked:start};
 for(const target of points){if(!Number.isFinite(target.x)||!Number.isFinite(target.y))return{blocked:[{kind:'route',id:'anchor',label:'누락된 이동 경로'}]};let count=0;
  while(Math.abs(target.x-probe.x)>.15&&count++<6000){const step=walkStep(e,probe,target);if(step.blocked)return step;probe=step.pose;distance+=step.distance;}
  if(count>=6000||Math.abs(target.y-probe.y)>1.5)return{blocked:[{kind:'route',id:target.support||'support',label:'이어지지 않는 지지면'}]};
  const at=target.support&&e.contactSurface(probe.x,probe.y-.2,probe.y+.2);if(target.support&&at?.t.id!==target.support)return{blocked:[{kind:'route',id:target.support,label:'다른 높이의 지지면'}]};
 }return{points:clone(points),distance,end:{x:probe.x,y:probe.y}};
}
function chooseRoute(app){const b=app.engine.b,u=boss(b),movement=spec(b).movement||{},destinations=movement.destinations||[],routes=movement.routes||[];let blockers=[];
 for(const to of destinations){
  // A blocked final body cannot be rescued by a longer approach. Test each
  // exact courtyard endpoint first, without spending thousands of walk steps.
  const occupied=bodyBlockers(app.engine,{...u,x:to.x,y:to.y});if(occupied.length){if(!blockers.length)blockers=occupied;continue;}
  const candidates=[[to]],seen=new Set([JSON.stringify([[to.x,to.y,to.support]])]);for(const r of routes)for(let i=0;i<(r.points||[]).length;i++){const path=[{x:u.x,y:u.y},...r.points.slice(i),to],reduced=[];for(const p of path){while(reduced.length>=2&&(reduced.at(-1).x-reduced.at(-2).x)*(p.x-reduced.at(-1).x)>0)reduced.pop();const previous=reduced.at(-1);if(previous&&p.x===previous.x&&p.y===previous.y&&p.support===previous.support)continue;reduced.push(p);}const points=reduced.slice(1),key=JSON.stringify(points.map(p=>[p.x,p.y,p.support]));
   // With requireSupport and no jump/teleport, stop-only points on each
   // monotonic run trace the same physical path. Keep actual turning points,
   // but do not retry every suffix of the same approach/reversal repeatedly.
   if(seen.has(key))continue;seen.add(key);candidates.push(points);
  }candidates.sort((a,c)=>{const length=ps=>ps.reduce((q,p)=>(q.n+=Math.hypot(p.x-q.x,p.y-q.y),q.x=p.x,q.y=p.y,q),{x:u.x,y:u.y,n:0}).n;return length(a)-length(c);});
  for(const points of candidates){const result=probeRoute(app,points);if(!result.blocked)return{...result,targetVariant:to.id||'courtyard',routeVersion:1};if(!blockers.length)blockers=result.blocked;}
 }return{blocked:blockers.length?blockers:[{kind:'route',id:'missing',label:'중앙 마당의 경로'}]};
}
function offer(app){const e=app.engine,b=e.b,m=memory(b);if(paused(app)||ended(app)||b.phase!=='aim'||b.side!==0)return;const u=e.active;if(!hero(u)||u.acted||u.airborne)return;
 if(['announced','blocked'].includes(m.status))m.offered[u.id]={round:b.round,serial:serial(b)};
 for(const [source,w]of Object.entries(m.warnings))if(!m.entries[source]&&!w.opportunity&&!w.cancelled)(w.offered??={})[u.id]={round:b.round,serial:serial(b)};
}
function acceptOpportunity(app){const e=app.engine,b=e.b,m=memory(b),action=e.honroStage8BierAction,u=action&&e.unit(action.id);if(!action||app.actorBoundary!==action.id||!u?.acted||!hero(u))return;
 if(action.movement&&serial(b)>m.announcedSerial)m.playerOpportunity={id:u.id,round:b.round,serial:serial(b)};
 for(const source of action.waves||[]){const w=m.warnings[source];if(w&&!w.cancelled&&!w.opportunity&&serial(b)>w.serial)w.opportunity={id:u.id,round:b.round,serial:serial(b)};}
}
function cancelScene(app){const b=app.engine.b,m=memory(b),owned=ownedScene(app);let changed=false;
 // Cancellation is not Skip/finish: a paused or invalidated move must never
 // run its success dialogue/cues or leave that line in the journal. Discard
 // only this scene, then use Story's normal draw/save to release its lock and
 // camera. This path deliberately works while modal/history/hidden is paused.
 if(owned){app.dialogue=null;app.acc=0;app.stagingLastTime=null;const u=boss(b);if(u?.honroScenePose){delete u.honroScenePose;u.moving=0;}changed=true;}
 if(b.honroStory?.staging?.id===SCENE){b.honroStory=null;changed=true;}
 const queue=b.honroState.storyQueue||[],kept=queue.filter(l=>l[2]?.stagingRequest?.id!==SCENE);if(queue.length!==kept.length){b.honroState.storyQueue=kept;changed=true;}
 if(!m.completedOnce&&m.sceneJournal&&app.profile?.honroNarrative){const history=app.profile.honroNarrative,index=history.findIndex(row=>row.id===SCENE);if(m.sceneJournal.previous){if(index>=0)history[index]=clone(m.sceneJournal.previous);else history.splice(Math.min(m.sceneJournal.index,history.length),0,clone(m.sceneJournal.previous));}else if(index>=0)history.splice(index,1);delete m.sceneJournal;changed=true;}
 if(b.honroStaging?.once?.[SCENE]){delete b.honroStaging.once[SCENE];changed=true;}
 if(owned)G.HonroStory.draw(app);if(changed){G.HonroStory.save(app);app.dirty=true;}return changed;
}
const waveLabels={'stage8-first-seal':'서쪽 창고 산개 3','stage8-settled-crows':'높은 가지 까마귀 3','stage8-low-health':'동쪽 후미 산개 2'};
function noticeText(b){const m=memory(b),parts=[];if(['won','lost'].includes(b.phase))return'';
 if(m.status==='announced')parts.push('상여 → 중앙 아래뜰');else if(m.status==='blocked')parts.push('상여 이동 보류'+(m.blockers?.length?' ('+[...new Set(m.blockers.map(p=>p.label))].slice(0,2).join('·')+')':''));else if(m.status==='moving')parts.push('상여가 중앙 아래뜰로 이동 중');
 for(const source of sources){const w=m.warnings[source];if(w&&!w.cancelled&&!m.entries[source])parts.push((G.HonroEncounterDensity?.active(b)?({'stage8-first-seal':'서쪽 창고 산개 2 · 까마귀 1','stage8-settled-crows':'마당 위 까마귀 3','stage8-low-health':'동쪽 오름길 산개 1 · 혼불 1'}[source]):waveLabels[source])+(w.status==='blocked'?' 진입 보류':''));}
 return parts.length?parts.join(' · ')+' · 다음 행동 끝에 안전 확인':'';
}
function publishNotice(app){const b=app.engine.b,m=memory(b),text=ended(app)?'':noticeText(b);if(text){if((typeof app.eventText==='string'?app.eventText:m.notice)!==text)app.event(text);m.notice=text;}else if(m.notice){if(app.eventText===m.notice){app.eventText='';app.eventUntil=0;app.dirty=true;}delete m.notice;}return text;}
function cleanup(app){const b=app.engine?.b;if(!active(b))return false;
 // Story pauses ordinary Engine ticks. If the last real companion was lost
 // during this pause (or in a saved scene), run the existing loss decision
 // before advancing any movement. Never invent a new mage/actor requirement.
 if(!ended(app)&&!b.units.some(u=>alive(u)&&u.side===0&&!u.summoned))app.engine.checkEnd();
 const m=memory(b),dead=!alive(boss(b)),over=ended(app);if(!dead&&!over)return false;
 for(const source of sources)if((over||source!==sources[0])&&!m.entries[source]){(m.warnings[source]??={serial:serial(b),round:b.round}).cancelled=over?'battle-ended':'boss-dead';b.honroState.flags['event:'+source]='cancelled:'+(over?'battle-ended':'boss-dead');b.honroState.pendingEvents=(b.honroState.pendingEvents||[]).filter(id=>id!==source);}
 if(m.status!=='cancelled'){m.status='cancelled';m.cancellationReason=over?'battle-ended':'boss-dead';m.blockers=[];m.reason='';app.dirty=true;}
 // Also clean an already-cancelled stale saved scene; status is not proof that
 // the prior presentation lock, payload or pre-written journal was removed.
 cancelScene(app);publishNotice(app);return over;
}
function warnWave(app,source){const b=app.engine.b,m=memory(b);if(m.warnings[source]||m.entries[source]||ended(app)||source!==sources[0]&&!alive(boss(b)))return;const at=entryFor(b,source);if(!at)return;
 m.warnings[source]={status:'announced',serial:serial(b),eligibleAfterSerial:serial(b)+1,round:b.round,side:at.side,offered:{}};b.honroState.flags['event:'+gate(source)]=true;
 publishNotice(app);app.dirty=true;offer(app);
}
function prepareWaves(app){const b=app.engine?.b;if(!active(b)||cleanup(app)||paused(app))return;const m=memory(b),seals=b.terrain.filter(t=>t.honroSeal);m.sealIdsSeen=seals.filter(t=>t.broken).map(t=>t.id);
 if(m.sealIdsSeen.length)warnWave(app,sources[0]);if(alive(boss(b))){if(m.completedOnce)warnWave(app,sources[1]);if(boss(b).hp<=boss(b).maxHp*.35)warnWave(app,sources[2]);}
}
function transition(app){const b=app.engine?.b;if(!active(b)||cleanup(app))return;const m=memory(b),seals=b.terrain.filter(t=>t.honroSeal);acceptOpportunity(app);if(m.completedOnce||m.status==='moving'||m.status==='cancelled')return;
 if(m.status==='anchored'){if(paused(app)||seals.length!==2||seals.some(t=>!t.broken)||!alive(boss(b)))return;Object.assign(m,{status:'announced',triggerSerial:serial(b),announcedSerial:serial(b),eligibleAfterSerial:serial(b)+1,announcedRound:b.round,offered:{},playerOpportunity:null,reason:'두 결박이 풀렸다. 상여가 중앙 아래뜰을 향한다. 다음 행동에서 그 길을 비우세요.'});publishNotice(app);app.dirty=true;offer(app);return;}
 offer(app);if(!m.playerOpportunity){m.reason='동행의 새로운 행동이 끝난 뒤 상여의 길을 확인합니다.';return;}m.status='blocked';
 if(!safeBoundary(app))return;const route=chooseRoute(app);m.blockers=route.blocked||[];
 if(route.blocked){m.reason='상여 이동 보류 · '+[...new Set(route.blocked.map(p=>p.label))].slice(0,2).join('·')+' · 지금 자리에서도 제압할 수 있습니다.';app.dirty=true;return;}
 Object.assign(m,{status:'moving',originActualPose:{x:boss(b).x,y:boss(b).y},lastValidPose:{x:boss(b).x,y:boss(b).y},route:route.points,routeVersion:route.routeVersion,targetVariant:route.targetVariant,reason:'빈 상여가 안전한 길을 따라 중앙 아래뜰로 움직인다.'});
 installScene();G.HonroStoryStaging.register({id:SCENE,stage:8,title:'줄을 놓친 빈 상여',steps:[...route.points.map(to=>({type:'move',actor:'boss',to,duration:Math.max(100,route.distance/900*1000/route.points.length),caption:m.reason})),{type:'dialogue',lines:[['서술','빈 상여가 아래뜰에 멎었다. 묶여 있던 천이 느슨해지고, 상여 안에서 낯선 혼의 울음이 샜다.']]}]});
 // Story.start prewrites its dialogue to the journal. Keep only this run's
 // replaced row so cancellation restores earlier legitimate replay history.
 const journal=app.profile.honroNarrative||[],journalIndex=journal.findIndex(row=>row.id===SCENE);m.sceneJournal={index:journalIndex<0?journal.length:journalIndex,previous:journalIndex<0?null:clone(journal[journalIndex])};
 if(!G.HonroStoryStaging.request(app,SCENE)){m.status='blocked';m.reason='다음 안전한 행동 끝에 상여의 길을 다시 확인합니다.';return;}app.dirty=true;app.engine.emit?.('save');
}
function settle(app){const b=app.engine.b,m=memory(b);if(!alive(boss(b))||m.completedOnce)return false;m.status='settled';m.completedOnce=1;delete m.sceneJournal;m.completedSerial=serial(b);m.completedRound=b.round;m.reason='빈 상여가 중앙 아래뜰에 멎었다.';m.blockers=[];delete boss(b).honroScenePose;app.dirty=true;return true;}
function blockMotion(app,blocks){const b=app.engine.b,m=memory(b);m.status='blocked';m.blockers=blocks;m.reason='상여 이동 보류 · '+[...new Set(blocks.map(p=>p.label))].slice(0,2).join('·')+' · 안전한 다음 행동 끝에 다시 확인합니다.';delete boss(b)?.honroScenePose;cancelScene(app);publishNotice(app);app.dirty=true;app.engine.emit?.('save');}
function advanceScene(app,dt,skip=false){const e=app.engine,b=e.b,m=memory(b),s=app.dialogue?.staging;if(cleanup(app)||!ownedScene(app)||m.status!=='moving'||s.complete||scenePaused(app))return false;if(!safeMotion(app,true)){blockMotion(app,[{kind:'action',id:'busy',label:'진행 중인 행동'}]);return false;}
 let budget=skip?60000:Math.max(0,dt)*900,changed=false;
 while(budget>1e-7&&s.cursor<s.steps.length){const step=s.steps[s.cursor];if(step.type==='dialogue'){s.complete=true;settle(app);break;}const u=boss(b),to=step.to;if(!s.applied[s.cursor]){s.focusActor=u.id;if(!skip)app.scene?.storyFocus?.(u.id,120);}
  if(Math.abs(u.x-to.x)<.15){if(Math.abs(u.y-to.y)>1.5){blockMotion(app,[{kind:'route',id:'height',label:'이어지지 않는 지지면'}]);return false;}s.results[s.cursor]={status:'arrived',x:u.x,y:u.y};s.cursor++;s.elapsed=0;changed=true;continue;}
  const r=walkStep(e,u,to,Math.min(4,budget));if(r.blocked){blockMotion(app,r.blocked);return false;}
  // Copy only actual locomotion outputs. No HP, action, AI, mana or ordinary
  // movement allowance is borrowed across frames or saved as a temporary value.
  for(const k of ['x','y','facing','angle','moving','walkPhase'])if(Object.hasOwn(r.pose,k))u[k]=r.pose[k];m.lastValidPose={x:u.x,y:u.y};s.applied[s.cursor]=true;s.results[s.cursor]={status:'moving',x:u.x,y:u.y};s.elapsed+=r.distance/900*1000;u.honroScenePose={kind:'move',time:s.elapsed/1000};budget-=Math.max(r.distance,.001);changed=true;
 }
 if(ownedScene(app)&&s.steps[s.cursor]?.type==='dialogue'){s.complete=true;settle(app);}if(ownedScene(app)){G.HonroStoryStaging.snapshot(app);b.honroStory=clone(app.dialogue);app.dirty=true;}return changed;
}
let installed=false;
function installScene(){const S=G.HonroStoryStaging;if(!S||installed)return;installed=true;const tick=S.tick,skip=S.skipMotion,finish=S.finish;
 S.tick=function(app,now){if(!active(app.engine?.b)||!ownedScene(app))return tick(app,now);cleanup(app);if(!ownedScene(app))return;if(app.dialogue.staging.complete)return tick(app,now);const dt=app.stagingLastTime==null?0:Math.min(.06,Math.max(0,(now-app.stagingLastTime)/1000));app.stagingLastTime=now;if(scenePaused(app))return;const cursor=app.dialogue.staging.cursor;advanceScene(app,dt);if(ownedScene(app)&&(cursor!==app.dialogue.staging.cursor||app.dialogue.staging.complete)){G.HonroStory.draw(app);G.HonroStory.save(app);}};
 S.skipMotion=function(app){if(!active(app.engine?.b)||!ownedScene(app))return skip(app);if(scenePaused(app))return false;const out=advanceScene(app,0,true);if(ownedScene(app)){G.HonroStory.draw(app);G.HonroStory.save(app);}return out;};
 S.finish=function(app,natural=false){if(!active(app.engine?.b)||!ownedScene(app))return finish(app,natural);if(scenePaused(app))return true;if(!app.dialogue.staging.complete){advanceScene(app,0,true);if(!ownedScene(app))return true;if(!app.dialogue.staging.complete)return true;}return finish(app,natural);};
}
const entryFor=(b,source)=>spec(b).entries?.[source];
function spawn(app,action){const e=app.engine,b=e.b,m=memory(b),source=action.source;cleanup(app);acceptOpportunity(app);if(ended(app)||source!==sources[0]&&!alive(boss(b)))return false;if(m.entries[source])return true;const w=m.warnings[source],entry=entryFor(b,source);
 if(!entry||!w||w.cancelled||!w.opportunity||serial(b)<=w.serial||m.status==='moving'||!safeBoundary(app))return false;const key=boundary(app),n=action.n||1;if(b.honroState.lastCombatEventBoundary===key||e.alive(1).length+n>E.populationCap(b))return false;
 const choices=[entry,...(entry.alternates||[]).filter(p=>!p.side||p.side===entry.side).map(p=>({...p,side:entry.side}))];
 for(const at of choices){if(G.HonroEncounterDensity?.active(b)&&at.members){if(!G.HonroEncounterDensity.spawnMembers(app,action,at))continue;const list=b.units.slice(-at.members.length);for(const u of list)u.honroStage8BierEntry=at.side;w.status='spawned';m.entries[source]={x:at.x,y:at.y,side:at.side,ids:list.map(u=>u.id),count:list.length,round:b.round,serial:serial(b)};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return true;}const support=at.support||at.surfaceId,spacing=at.spacing??action.spacing??145,list=[],next=b.nextId,shadow={...b,units:[...b.units],nextId:b.nextId},flying=!!G.HonroWorld.archetypes[action.kind]?.flying;let valid=true;
  for(let i=0;i<n;i++){const x=at.x+(i-(n-1)/2)*spacing,contact=at.air&&flying?{y:at.y}:G.HonroMapEngine.surfaceY(b.terrain,x,at.y,support);if(!contact||(!at.air&&!support)||contact.t?.id&&contact.t.id!==support){valid=false;break;}const u=G.HonroWorld.createEnemy(shadow,app.stage,x,action.kind,next+i,contact.y,!!at.air);tuneOrdinary(shadow,u,app.stage,action.kind);
   Object.assign(u,{id:'event-'+(next+i),awake:true,aggroUntil:b.round+3,honroSpawnSource:source,honroStage8BierEntry:at.side,spawnX:u.x,spawnY:u.y});
   shadow.units=[...b.units,...list];const point=G.HonroTerrain.place(shadow,u,{flying,maxDistance:0,clearance:18});if(!point||point.x!==u.x||Math.abs(point.y-u.y)>.01||hazards(shadow,u,{x:u.x-u.r-18,y:u.y-u.h-3,w:u.r*2+36,h:u.h+6}).length||terrainBlockers(e,u).length){valid=false;break;}list.push(u);
  }
  if(!valid||list.length!==n)continue;b.nextId=next+n;b.units.push(...list);b.honroCounters.spawned+=n;w.status='spawned';m.entries[source]={x:at.x,y:at.y,support,side:at.side,ids:list.map(u=>u.id),count:n,round:b.round,serial:serial(b)};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return true;
 }w.status='blocked';return false;
}
function tuneOrdinary(b,u,st,kind,elite=false){u.elite=!!elite;u.armor=elite?.12:.04;P.tuneEnemy(st,u,kind);u.combatBaseHp*=.6;u.hp=u.maxHp=Math.max(1,Math.round(u.maxHp*.6));P.enemyXP(b,u);}
const balance=E.balance;E.balance=function(b){if(!active(b))return balance(b);if(b.honroStage8BierTuned)return;for(const u of b.units)if(u.side===1&&u.id!=='boss'&&!u.honroMidboss&&!u.honroFinalBoss)tuneOrdinary(b,u,G.HONRO_CONTENT.stages[7],u.honroVariant||u.honroType,!!u.honroStage8BierElite);b.honroStage8BierTuned=1;};
const cap=E.populationCap;E.populationCap=function(b){return active(b)?(b.honroStage8BierRoster==='oldBudget20e0'?29:37):cap(b);};
const execute=W.execute;W.execute=function(app,action){return active(app.engine?.b)&&action?.type==='spawn'&&sources.includes(action.source)?spawn(app,action):execute(app,action);};
const attach=E.attach;E.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroStage8BierAttached)return out;e.honroStage8BierAttached=true;memory(e.b);installScene();
 const can=e.canAct.bind(e);e.canAct=function(){if(memory(e.b).status==='moving')return false;const ok=can();if(ok)offer(app);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,m=memory(e.b),previous=e.honroStage8BierAction;e.honroStage8BierAction=hero(u)&&!u.acted?{id:u.id,movement:!!m.offered[u.id],waves:Object.entries(m.warnings).filter(([,w])=>w.offered?.[u.id]&&!w.cancelled).map(([id])=>id)}:null;try{return finish(...args);}finally{e.honroStage8BierAction=previous;}};
 const tick=e.tick.bind(e);e.tick=function(...args){if(memory(e.b).status==='moving'){cleanup(app);return;}return tick(...args);};
 const hurt=e.hurt.bind(e);e.hurt=function(...args){const out=hurt(...args);cleanup(app);return out;};return out;
};
const tick=G.HonroMission.tick;G.HonroMission.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);if(cleanup(app))return tick(app,dt);prepareWaves(app);offer(app);acceptOpportunity(app);const out=tick(app,dt);transition(app);publishNotice(app);return out;};
const state=G.HonroObjectives.state;G.HonroObjectives.state=function(b,st){const out=state(b,st);if(active(b)){if(memory(b).reason)out.summary+=' · '+memory(b).reason;const notice=noticeText(b);if(notice){out.currentInstruction=notice;out.summary+=' · '+notice;}}return out;};
const refreshObjectives=G.HonroObjectives.refresh;G.HonroObjectives.refresh=function(app,...args){const out=refreshObjectives(app,...args);if(active(app.engine?.b)&&!app.training){const text=noticeText(app.engine.b),node=G.document?.getElementById?.('objective-text');if(text&&node){node.textContent=text;node.setAttribute?.('aria-label',text+' · 눌러서 목표 보기');}}return out;};
G.HonroStage8Bier={active,memory,sources,SCENE,gate,entryFor,safeMotion,safeBoundary,bodyBlockers,terrainBlockers,hazards,walkStep,probeRoute,chooseRoute,offer,acceptOpportunity,prepareWaves,transition,cleanup,advanceScene,settle,spawn,installScene,tuneOrdinary,cancelScene,noticeText,publishNotice};
})(globalThis);
