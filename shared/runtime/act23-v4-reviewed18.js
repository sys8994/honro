(function(G){'use strict';
// Reviewed observations bind to the existing rescue/bell physics. No clear
// ledger, absent actor, or candidate slot is evidence of a witnessed action.
const P=G.HonroAct23V4ReviewedChapters,V=G.HonroAct23V4,C=G.HONRO_CORE,S=G.HonroAct23V4Stage18,B=G.HonroStage18Bell;
if(!P||G.HonroAct23V4Reviewed18)return;
const api=P.apiFor(18),clone=x=>JSON.parse(JSON.stringify(x)),unit=(b,id)=>b.units.find(u=>u.id===id),boss=b=>unit(b,'act2-keeper'),resident=b=>unit(b,'18.survivor'),alive=V.alive;
const mem=b=>{const q=api.memory(b);return q.observations??={rope:{elapsed:0,pull:0},knocks:[]};},physical=S.memory;
const dying=new WeakMap();
const near=(b,p,r=300)=>V.heroes(b).some(u=>V.near(u,p,r));
const coreWitness=['01','02','04','06','08'].map(n=>'A2.S16.WITNESS.'+n);
const physicalReceipt=(p,n)=>{const h=p?.honroAct23V4History?.stages?.[n],f=h?.reviewedPhysical;return f?.revision===1&&typeof h.run==='string'&&h.run.length>0&&h.run===f.sourceRun?{h,f}:null;};
const saw16=p=>{const r=physicalReceipt(p,16);return !!r&&r.f.witness16_heard===true&&coreWitness.every(id=>r.f.witnessRows?.includes(id)&&r.h.reviewedNarrative?.rows?.includes(id));};
// Separation alone does not establish the attached spirit's upward pull.
const saw17=p=>{const r=physicalReceipt(p,17),a=r?.f.hoistLiftAttemptObserved;return !!a&&a.kind==='hoist-upward-pull'&&a.source==='act2-hoist'&&a.observer==='p-occultist'&&a.ropeTaut===true&&a.to?.angle>=.3&&a.to?.hookLift>=10&&a.to.angle>a.from?.angle&&a.to.hookLift>a.from?.hookLift;};
const axis17=p=>{const r=physicalReceipt(p,17);return !!r&&r.f.axisTurned===true&&r.f.wheel?.angle===Math.PI*2&&r.f.wheel?.rotationCount===1;};
const testimony=app=>saw16(app.profile);
function sight(e,a,z){return !!a&&!!z&&!e.projectileCollision({x:a.x,y:a.y-a.h*.55},{x:z.x,y:z.y-(z.h||0)*.55},1,a.id,[],false);}
function corpseAccess(app){const e=app.engine,b=e.b,u=boss(b),h=api.actor(b,'담허');return !!u&&u.dead&&u.hp<=0&&alive(h)&&V.near(h,u,200)&&e.grounded(h)&&C.validTerrainContactPose(b.terrain,h)&&C.validTerrainContactPose(b.terrain,u)&&!b.terrain.some(t=>!t.broken&&!t.oneWay&&C.terrainRectIntersects(t,u.x-u.r*.65,u.y-u.h+5,u.r*1.3,u.h-10,.1))&&sight(e,h,u);}
function safeResident(b){const m=physical(b),u=resident(b),r=b.honroV4Stage18.safeRegion;return m.rescueSafe&&alive(u)&&u.x-u.r>=r.x&&u.x+u.r<=r.x+r.w&&u.y>=r.y&&u.y<=r.y+r.h&&C.validTerrainContactPose(b.terrain,u);}
function stable(b){const m=physical(b);return S.complete(b)&&safeResident(b)&&m.bell.offset===b.honroV4Stage18.restOffset&&m.bell.offsetX===32&&m.bell.reseats===1&&m.bell.lifts===1&&b.honroV4Stage18.supportIds.every(id=>b.terrain.some(t=>t.id===id&&!t.broken));}
function optional(profile,r){const b=profile.honroBattle,q=b?.honroStage===18&&api.active(b)?mem(b):null,m=q&&physical(b),live=q&&alive(boss(b));
 if(r.id.includes('_KNIGHT_'))return !!q&&live&&!q.confronted&&saw16(profile);
 if(r.id==='EDGE.OPTIONAL_18_OCCULTIST_0')return saw17(profile);
 if(r.id==='EDGE.OPTIONAL_18_ARCHER_0')return saw16(profile)&&axis17(profile);
 if(r.id==='EDGE.OPTIONAL_18_MAGE_0')return !m?.stable;
 return false;
}
function allow(app,r){const b=app.engine?.b;if(r.channel==='optional')return optional({...app.profile,honroBattle:b||app.profile.honroBattle},r);if(!b)return false;
 const m=physical(b),q=mem(b),live=alive(boss(b)),id=r.id,events=api.memory(b).events,said=key=>events[key]?.status==='done'&&events[key].ids.length>0;
 if(id==='EDGE.ARRIVALS_18_0')return live&&alive(resident(b))&&q.rope.elapsed>0&&!m.rescued;
 if(id==='A2.S18.INTRO.01')return !m.rescued&&m.threat.walked>1;
 if(id==='A2.S18.INTRO.02')return live&&q.rope.elapsed>0&&!m.brakeLocked&&near(b,resident(b),1600);
 if(id==='A2.S18.INTRO.03')return live&&said('warning')&&q.rope.seesResident===true;
 if(id==='A2.S18.INTRO.04')return live&&q.burialWitness===true&&m.bell.offset>-120;
 if(id==='A2.S18.PHASE1.01')return live&&q.burialWitness===true&&near(b,V.marker(b,'18.brake'),330)&&!m.brakeLocked;
 if(id==='A2.S18.PHASE1.02')return live&&said('hands-off')&&!m.brakeLocked;
 if(id==='A2.S18.PHASE1.03')return live&&said('rescue-answer')&&m.threat.lowered&&!m.brakeLocked;
 if(id==='A2.S18.MID.01'){const h=api.actor(b,'설오'),p=V.marker(b,'18.brake');return alive(h)&&V.near(h,p,650)&&sight(app.engine,h,{...p,y:p.y-65,h:0});}
 if(id==='A2.S18.MID.02')return !m.rescued&&V.near(api.actor(b,'소단'),resident(b),250);
 if(id==='A2.S18.MID.03')return m.brakeLocked&&!m.rescued;
 if(id==='A2.S18.MID.04')return m.rescued&&!m.rescueSafe&&m.rescueDistance>1;
 if(id==='A2.S18.MID.05')return safeResident(b);
 if(id==='A2.S18.PHASE2.01')return live&&safeResident(b)&&testimony(app,b)&&near(b,boss(b),550)&&q.burialWitness===true;
 if(id==='A2.S18.PHASE2.02')return live&&said('question');
 if(id==='A2.S18.PHASE2.03')return live&&said('answer');
 if(id==='A2.S18.PHASE2.04')return live&&said('accusation');
 if(id==='A2.S18.PHASE2.05')return live&&!!q.ritualAtDevice;
 if(id==='A2.S18.PHASE2.06')return live&&!!q.openShot;
 // This lease exists only in the live fatal-damage callback/current frame.
 if(id==='A2.S18.DEATH.01')return dyingBoundary(app,'last-breath',[id]);
 if(id==='A2.S18.DEATH.02')return m.bossDeath&&corpseAccess(app);
 if(id==='A2.S18.BRANCH.01')return m.bossDeath&&!m.rescueSafe;
 if(id==='A2.S18.BRANCH.02')return m.bossDeath&&q.death?.environment===true&&q.death.witnessed===true&&!corpseAccess(app);
 if(id==='A2.S18.STABILIZE.01')return m.bossDeath&&safeResident(b)&&m.brakeLocked&&m.connectionsChecked;
 if(id==='A2.S18.STABILIZE.02')return m.liftDone&&m.bell.offset===b.honroV4Stage18.liftOffset;
 if(id==='A2.S18.STABILIZE.03')return m.liftDone&&q.gapSouls===true;
 if(id==='A2.S18.STABILIZE.04')return q.translated===true&&m.bell.offsetX===32&&m.supportReady&&!m.settled&&!S.occupants(b,S.segmentSweep(b,b.honroV4Stage18.restOffset,32)).length;
 if(id==='A2.S18.STABILIZE.05')return m.settled&&m.supportReady&&m.bell.offset===b.honroV4Stage18.restOffset&&m.bell.offsetX===32;
 if(id==='A2.S18.COMPLETE.01')return stable(b);
 if(id==='A2.S18.COMPLETE.02')return stable(b)&&q.knocks.length>0;
 if(id==='A2.S18.COMPLETE.03')return stable(b)&&safeResident(b);
 if(id==='A2.S18.JOURNAL.01')return stable(b)&&q.burialWitness===true&&q.gapSouls===true&&q.knocks.length>0;
 if(id==='A2.S18.POPUP.01')return q.invalid==='brake';
 if(id==='A2.S18.POPUP.02')return q.invalid==='rescue';
 if(id==='A2.S18.POPUP.03')return q.bellAim===true;
 if(id==='A2.S18.POPUP.04')return m.bossDeath&&q.death?.environment===true;
 return r.channel==='objective';
}
function dyingBoundary(app,key,ids){const b=app.engine?.b,lease=dying.get(b);return !!lease&&key==='last-breath'&&ids.length===1&&ids[0]==='A2.S18.DEATH.01'&&boss(b)?.dead===true&&boss(b).hp<=0&&(lease.opening||app.dialogue?.reviewedStage===18&&app.dialogue.reviewedEvent==='last-breath')&&!['done','discarded'].includes(api.memory(b).events['last-breath']?.status);}
function lastBreath(app,owner){const b=app.engine.b,q=mem(b),death=q.death,events=api.memory(b).events;
 if(app.dialogue||death.method!=='normal'||death.environment||death.instant||!death.witnessed||!q.burialWitness||!safeResident(b)||!q.confronted||!alive(owner)||owner.side!==0||owner.summoned||owner.honroSpirit||!['question','answer','accusation','hostile'].every(k=>events[k]?.status==='done'&&events[k].ids.length))return false;
 const lease={opening:true};dying.set(b,lease);const out=api.begin(app,'last-breath',['A2.S18.DEATH.01'],death);lease.opening=false;if(!out)dying.delete(b);return out;
}
function discardEndedBoundary(b){const event=api.memory(b).events['last-breath'];if(event?.status==='open'&&!dying.has(b)){event.status='discarded';event.reason='18.death-boundary-ended';if(b.honroStory?.reviewedEvent==='last-breath')b.honroStory=null;const slot=V.mem(b).slots['18.reviewed.last-breath'];if(slot){slot.status='cancelled';slot.reason=event.reason;}}}
function scene(app,key,id,proof={}){return api.begin(app,key,[id],proof);}
function cancelKeeper(app){const b=app.engine.b;if(alive(boss(b)))return;
 const keys=['warning','aware','lowering','hands-off','rescue-answer','repeat','question','answer','accusation','hostile','ritual','open-shot'],q=api.memory(b);
 for(const key of keys){const ev=q.events[key];if(ev?.status==='open'){ev.status='discarded';ev.reason='18.keeper.death';const slot=V.mem(b).slots['18.reviewed.'+key];if(slot){slot.status='cancelled';slot.reason='18.keeper.death';}}}
 if(app.dialogue?.reviewedStage===18&&keys.includes(app.dialogue.reviewedEvent)){app.dialogue=null;G.HonroStory.save(app);G.HonroStory.draw(app);}
}
function observe(app,dt){const e=app.engine,b=e.b,m=physical(b),q=mem(b),u=boss(b),npc=resident(b),delta=Math.max(0,Math.min(dt,.05));cancelKeeper(app);
 if(alive(u)&&C.validTerrainContactPose(b.terrain,u)&&alive(npc)&&near(b,npc,1600)&&!m.brakeLocked&&!m.rescued&&!q.rope.complete){
  q.rope.elapsed+=delta;q.rope.pull=Math.min(34,q.rope.elapsed*68);u.honroScenePose={kind:'hold-bell',time:q.rope.elapsed};
  // Both the living keeper and a present hero need actual clear sight. The
  // pull itself drives the base segment; proximity alone never proves intent.
  q.rope.seesResident=sight(e,u,npc);
  if(q.rope.elapsed>=.5){q.rope.complete=true;q.rope.actor=u.id;q.rope.startedAt={x:u.x,y:u.y};}
 }
 if(q.rope.complete&&alive(u)&&q.rope.seesResident&&m.bell.offset>-120&&near(b,npc,1400)&&V.heroes(b).some(h=>sight(e,h,u)&&sight(e,h,npc)))q.burialWitness=true;
 if(m.liftDone){q.gapSouls=true;}
 const z=b.keeperRitual?.zone,site=unit(b,'18.hoist-device');
 if(alive(u)&&z&&site&&Math.hypot(z.x-site.x,z.y-site.y)<500)q.ritualAtDevice={serial:z.serial,point:{x:z.x,y:z.y}};
 // A cleared original ritual face is the existing cover change. Observe an
 // actual blocked→clear ray; a timed dialogue never manufactures the opening.
 const h=api.actor(b,'설오');if(alive(u)&&alive(h)&&V.near(h,u,1100)){const hit=e.projectileCollision({x:h.x,y:h.y-h.h*.55},{x:u.x,y:u.y-u.h*.55},1,h.id,[],false);if(hit?.keeperRitual)q.blockedShot={actor:h.id,from:{x:h.x,y:h.y},serial:z?.serial};else if(!hit&&q.blockedShot&&Math.hypot(h.x-q.blockedShot.from.x,h.y-q.blockedShot.from.y)<40)q.openShot={...q.blockedShot,opened:true};}
}
function drive(app){const b=app.engine.b,q=mem(b),m=physical(b),events=api.memory(b).events;if(!api.safe(app)||(b.honroState.storyQueue||[]).length)return;
 const offer=(key,id,proof={})=>!events[key]&&allow(app,api.row(id))&&scene(app,key,id,proof);
 if(offer('arrival','EDGE.ARRIVALS_18_0'))return;
 if(offer('walking','A2.S18.INTRO.01',{distance:m.threat.walked}))return;
 if(offer('warning','A2.S18.INTRO.02',q.rope))return;
 if(offer('aware','A2.S18.INTRO.03',q.rope))return;
 if(offer('lowering','A2.S18.INTRO.04',{offset:m.bell.offset,actor:q.rope.actor}))return;
 if(offer('bell-guide','A2.S18.POPUP.03',q.bellAimProof))return;
 for(const[key,id]of [['hands-off','PHASE1.01'],['rescue-answer','PHASE1.02'],['repeat','PHASE1.03'],['brake-sight','MID.01'],['resident-approach','MID.02'],['braked','MID.03'],['moving-resident','MID.04'],['safe-resident','MID.05'],['question','PHASE2.01'],['answer','PHASE2.02'],['accusation','PHASE2.03'],['hostile','PHASE2.04'],['ritual','PHASE2.05'],['open-shot','PHASE2.06'],['death-confirm','DEATH.02'],['early-death','BRANCH.01'],['fall-confirm','BRANCH.02'],['environment-guide','POPUP.04'],['inspect','STABILIZE.01'],['support-visible','STABILIZE.02'],['gap','STABILIZE.03'],['clear-below','STABILIZE.04'],['reseated','STABILIZE.05']]){
  if(offer(key,'A2.S18.'+id)){if(key==='question')q.confronted=true;return;}
 }
 if(q.translated&&!m.settled&&!m.bell.segment&&api.done(b,'clear-below')){S.begin(app,'settle',b.honroV4Stage18.restOffset,32);return;}
 if(stable(b)&&!q.knocks.length){const source={x:7200+32,y:6610+m.bell.offset+100};app.engine.emit('sound',{name:'ricochet',...source,source:'18.remaining-knock'});app.engine.fx('ring',source.x,source.y,'#b5b2a0',55);q.knocks.push({id:'18.remaining-knock',source});}
 for(const[key,id]of [['stable','COMPLETE.01'],['knock','COMPLETE.02'],['depart','COMPLETE.03']])if(offer(key,'A2.S18.'+id))return;
 if(api.done(b,'depart')&&allow(app,api.row('A2.S18.JOURNAL.01')))api.journal(app,'A2.S18.JOURNAL.01');
}
function before(app,a,dt){if(!a.safe(app))return false;observe(app,dt);drive(app);if(app.dialogue)return false;
 const b=app.engine.b,q=mem(b),m=physical(b);
 // The keeper has to finish a real rope pull before the living-owner threat.
 if(alive(boss(b))&&!m.brakeLocked&&!m.threat.started&&(!near(b,resident(b),1600)||!q.rope.complete))return false;
 return true;
}
function shiftX(b,to){const m=physical(b),dx=to-m.bell.offsetX,ids=new Set(b.honroBellDescent.terrainIds),arts=new Set(b.honroBellDescent.elementIds);
 for(const list of[b.terrain,b.honroWorldTerrain])for(const t of list||[])if(ids.has(t.id)){t.x+=dx;t.vertices=t.vertices?.map(p=>({...p,x:p.x+dx}));}
 for(const list of[b.honroEnvironment?.placements,b.honroLandmarks,b.honroElements])for(const e of list||[])if(arts.has(e.id))e.x+=dx;m.bell.offsetX=to;
}
function translate(app,dt){const e=app.engine,b=e.b,m=physical(b),s=m.bell.segment;if(app.dialogue||!s||s.kind!=='translate'||m.bell.status!=='moving')return;
 s.elapsed=Math.min(s.duration,s.elapsed+Math.max(0,dt));const t=s.elapsed/s.duration,k=t*t*(3-2*t);shiftX(b,s.fromX+(s.toX-s.fromX)*k);app.dirty=true;
 if(t<1)return;shiftX(b,s.toX);mem(b).translated=true;m.bell.status='translated';B.memory(b).status='translated';delete m.bell.segment;b.sceneVersion++;e.emit('save');
}
function use(app,site){const e=app.engine,b=e.b,m=physical(b),q=mem(b);
 if(site.id==='18.settle'&&m.liftDone&&m.supportReady&&m.bossDeath&&!m.settled&&!q.translated){if(!S.begin(app,'translate',m.bell.offset,32))return false;e.finishAction();return true;}
 return undefined;
}
function eligibility(app,site){const b=app.engine.b,m=physical(b),q=mem(b);
 if(['18.hoist','18.lift'].includes(site.id)&&!m.brakeLocked){q.invalid='brake';scene(app,'brake-guide','A2.S18.POPUP.01');return{ok:false,reason:api.row('A2.S18.POPUP.01').text};}
 if(site.id==='18.lift'&&!safeResident(b)){q.invalid='rescue';scene(app,'rescue-guide','A2.S18.POPUP.02');return{ok:false,reason:api.row('A2.S18.POPUP.02').text};}
 if(site.id==='18.settle'&&(!m.supportReady||!api.done(b,'gap')))return{ok:false,reason:api.row('A2.S18.OBJECTIVE.04').text};
 return undefined;
}
function attach(app,e){discardEndedBoundary(e.b);if(e.honroReviewed18Bound)return;e.honroReviewed18Bound=true;
 const predict=e.predict;e.predict=function(u,skill,...args){const out=predict.call(e,u,skill,...args);if(api.active(e.b)&&u?.side===0&&e.b.honroBellDescent.terrainIds.includes(out.terrain)){const q=mem(e.b);q.bellAim=true;q.bellAimProof={actor:u.id,skill:skill.id,terrain:out.terrain,endpoint:{x:out.x,y:out.y}};}return out;};
 const hurt=e.hurt;e.hurt=function(u,...args){const watching=api.active(e.b)&&u?.id==='act2-keeper'&&alive(u),oldHp=u?.hp,owner=unit(e.b,args[1]),source=args[5]||'normal',witness=watching&&V.heroes(e.b).some(h=>sight(e,h,u));const out=hurt.call(e,u,...args);
  if(watching&&u.hp<oldHp){const q=mem(e.b);q.bossHits=(q.bossHits||0)+1;if(!alive(u)){q.death={method:owner?.honroSpirit||owner?.summoned?'spirit':source,environment:source==='environment',witnessed:witness,instant:q.bossHits===1,point:{x:u.x,y:u.y}};S.cleanupDeath(app);cancelKeeper(app);lastBreath(app,owner);}}return out;};
 const recover=e.recover;e.recover=function(u,...args){const watching=api.active(e.b)&&u?.id==='act2-keeper'&&alive(u),witness=watching&&V.heroes(e.b).some(h=>Math.abs(h.x-u.x)<1800&&sight(e,h,u));const out=recover.call(e,u,...args);if(watching&&!alive(u)){mem(e.b).death={method:'fall',environment:true,witnessed:witness,point:{x:u.x,y:u.y}};S.cleanupDeath(app);cancelKeeper(app);}return out;};
 const tick=e.tick;e.tick=function(dt){const s=api.active(e.b)&&physical(e.b).bell.segment;if(s?.kind==='translate'&&physical(e.b).bell.status==='moving'){translate(app,dt);return;}const out=tick.call(e,dt);if(s?.kind==='threat')observe(app,0);return out;};
}
// Keep the observed bodies and physical change in the actual story frame.
// A speaker-only default centered the huge bell and omitted the east gallery.
function camera(app,key){const b=app.engine.b,m=physical(b),u=boss(b),targets=[];
 if(['arrival','warning','aware','lowering','hands-off','rescue-answer','repeat'].includes(key))targets.push({actor:'act2-keeper'},{actor:'18.survivor'},{x:7200,y:5940+m.bell.offset});
 else if(['walking','brake-sight','resident-approach','braked','moving-resident','safe-resident'].includes(key))targets.push({actor:'18.survivor'},{marker:'18.brake'});
 else if(['question','answer','accusation','hostile','ritual','open-shot'].includes(key))targets.push({actor:'act2-keeper'},{actor:api.actor(b,'휘겸')?.id});
 else if(key==='death-confirm')targets.push({x:u.x-u.h*1.1,y:u.y-65,w:u.h*1.4,h:70},{actor:api.actor(b,'담허')?.id});
 else if(['inspect','support-visible','gap','clear-below','reseated','stable','knock','depart'].includes(key))targets.push({x:5700,y:6530,w:450,h:220},{x:8340,y:6530,w:440,h:220},{x:6980+m.bell.offsetX,y:6675+m.bell.offset,w:400,h:80});
 else return;
 return{id:'18.reviewed.'+key,intent:'situation',targets,padding:90,maxScale:.82,speakerPolicy:'none'};
}
function draw(scene,c,b){const m=physical(b),q=mem(b),u=boss(b);c.save();
 // Render the recorded dead body with its existing rig, frozen and lying on
 // the supported floor. This visual clone never enters units or actor lookup.
 if(u?.dead&&u.hp<=0&&q.death&&Math.hypot(u.x-q.death.point.x,u.y-q.death.point.y)<1&&C.validTerrainContactPose(b.terrain,u)){
  const still=Object.create(scene);still.time=0;c.save();c.translate(u.x,u.y-u.h*27/110);c.rotate(-Math.PI/2);still.unitBody(c,{...u,x:0,y:0,hurt:0,anim:0,moving:0,honroScenePose:undefined},0);c.restore();
 }

 if(alive(u)&&q.rope.elapsed>0&&!m.brakeLocked){const hand={x:u.x+32,y:u.y-70+q.rope.pull};c.strokeStyle='#c3b28b';c.lineWidth=4;c.beginPath();c.moveTo(7200,5940+m.bell.offset);c.lineTo(hand.x,hand.y);c.lineTo(hand.x,hand.y+110);c.stroke();c.strokeStyle='#ad967a';c.lineWidth=7;c.beginPath();c.moveTo(u.x+8,u.y-82);c.lineTo(hand.x,hand.y);c.stroke();}
 if(q.gapSouls){c.strokeStyle='#afc8c1';c.globalAlpha=.55;c.lineWidth=3;for(const x of[6980,7180,7380]){c.beginPath();c.ellipse(x+m.bell.offsetX,6675+m.bell.offset,14,24,0,0,Math.PI*2);c.stroke();}}
 c.restore();}
P.register(18,{mapRevision:518,actors:{'유헌':'act2-keeper','생존자':'18.survivor'},author(map){
 const keeper=map.units.find(u=>u.id==='act2-keeper'),point={x:9580,y:6370};
 // The original floor was 1154 below the survivor and occluded by the shelf.
 // Use the existing supported gallery, outside all three bell sweeps.
 Object.assign(keeper,point);keeper.stageOverrides={...keeper.stageOverrides,honroEncounterSupport:'sb-east-gallery-sill'};
 map.initialState.honroV4Reviewed18={revision:1,keeperPoint:point,keeperSupport:'sb-east-gallery-sill'};
 },prepare(b){mem(b);discardEndedBoundary(b);if(boss(b))boss(b).name='유헌';if(resident(b))resident(b).name='생존자';},attach,allow,dyingBoundary,before,drive,use,eligibility,draw,camera,optional,
 objective(b){const m=physical(b);return 'A2.S18.OBJECTIVE.'+(m.bossDeath?(m.rescueSafe?'04':'03'):(m.rescueSafe?'02':'01'));},
 failure:b=>!alive(resident(b))?'A2.S18.FAIL.01':null,
 complete:b=>stable(b)&&api.done(b,'depart')&&(!mem(b).burialWitness||!!api.memory(b).journal),
 state:b=>({keeperDead:physical(b).bossDeath,burialWitness:mem(b).burialWitness===true,bellGapOpen:physical(b).liftDone,bellReseated:physical(b).settled,bellStable:physical(b).stable})});
G.HonroAct23V4Reviewed18={memory:mem,physical,allow,optional,sight,corpseAccess,safeResident,stable,translate,cancelKeeper,saw16,saw17};
})(globalThis);
