(function(G){'use strict';
const F=G.HonroAct3V4ReviewedCore,V=G.HonroAct23V4,P=G.HonroAct23V4Stage29,W=G.HonroAct3V4ReviewedWaterworks;let R;const q=b=>R.memory(b),m=P.memory,boss=b=>b.units.find(u=>u.id===P.bossId),live=b=>V.alive(boss(b)),ids=(s,n)=>Array.from({length:n},(_,i)=>'A3.S29.'+s+'.0'+(i+1));
const exposed=app=>live(app.engine.b)&&V.heroes(app.engine.b).some(u=>u.cls==='knight'&&W.ground(app.engine.b,u)&&V.near(u,boss(app.engine.b),850));
const warning=b=>!!m(b)['stage29-cover-warning']&&!m(b).coverCommitted;
const trace=b=>!!q(b).proof.trace&&!!m(b).echo?.done&&m(b).sluiceReclaimed;
function observe(app,dt){const b=app.engine.b,a=m(b),u=boss(b),state=q(b);
 if(a.echo&&!a.echo.done&&V.heroes(b).some(h=>V.near(h,V.marker(b,'stage29-echo'),400))){state.echoSeen??={elapsed:0,actorIds:[]};state.echoSeen.elapsed+=Math.max(0,Math.min(dt,.05));state.echoSeen.actorIds=[...new Set([...state.echoSeen.actorIds,...V.heroes(b).filter(h=>V.near(h,V.marker(b,'stage29-echo'),400)).map(h=>h.id)])];}
 if(a.echo?.done&&state.echoSeen?.elapsed>=.25)state.proof.trace={source:'stage29-echo',gesture:true,marker:'existing-hyeonmuk-stake',actors:state.echoSeen.actorIds,mage:state.echoSeen.actorIds.some(id=>b.units.find(u=>u.id===id)?.cls==='mage')};
 if(a.death&&!state.proof.death)state.proof.death={early:a.earlyKill,source:'stage29-boss-death'};
 if(state.deathMoment&&state.deathMoment.serial!==(b.honroState.actorTurnSerial||0))state.deathMoment.expired=true;
}
R=F.register({stage:29,
 author(map){const u=map.units.find(u=>u.id===P.bossId);u.stageOverrides={...u.stageOverrides,honroV4ArmorIdentity:'old-empty'};},
 prepare(b){boss(b).name='한태록';},observe,
 attach(app,e){e.b.honroReviewed29Start??=F.copy(e.b);const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const watched=u?.id===P.bossId&&V.alive(u),seen=watched&&W.visible(app,u,1300),pose=watched?{x:u.x,y:u.y}:null,out=hurt(u,...args);if(watched&&!V.alive(u)&&seen)q(e.b).deathMoment={serial:e.b.honroState.actorTurnSerial||0,...pose,observed:true};return out;};},
 failureGuide(app,r){return r.id==='A3.S29.GUIDE.FAIL'&&app.engine?.b?.phase==='lost'&&!!app.engine.b.honroReviewed29Start;},
 failureRows(app){return app.engine?.b?.honroReviewed29Start?['A3.S29.GUIDE.FAIL','EDGE.FAILURE_GUARD.S29']:['EDGE.FAILURE_GUARD.S29'];},
 speaker(app,r){return r.speaker==='한태록'&&live(app.engine.b);},speakerException(app,r){const b=app.engine.b,d=q(b).deathMoment;return r.id==='A3.S29.DEFEAT.01'&&!!d?.observed&&!d.expired&&m(b).death&&Math.abs(boss(b).x-d.x)<2&&Math.abs(boss(b).y-d.y)<2;},
 facts(app,r){const b=app.engine.b;if(r.id.startsWith('A3.S29.INTRO.'))return exposed(app);if(r.speaker==='한태록'&&r.id!=='A3.S29.DEFEAT.01')return live(b);if(r.id==='A3.S29.TRACE.01'||r.id==='A3.S29.TRACE.03')return q(b).proof.trace?.mage===true;if(r.id==='A3.S29.PHASE1.02')return b.units.some(u=>V.alive(u)&&u.honroStage29Source==='stage29-command-screen'&&u.cls==='archer');return true;},
 optional(p,r){const h=p.honroAct23V4History?.stages?.[28]?.reviewedNarrative;if(r.id==='EDGE.OPTIONAL_29_OCCULTIST_0')return false;return !!h?.proof?.packet;},
 events:[{key:'arrival',ids:['EDGE.ARRIVALS_29_0'],when:app=>V.heroes(app.engine.b).length>0},
 {key:'intro',ids:ids('INTRO',4),when:exposed},
 {key:'phase1',ids:ids('PHASE1',2),when:app=>live(app.engine.b)&&m(app.engine.b).engaged&&m(app.engine.b).phase===1},
 {key:'guide1',ids:['A3.S29.GUIDE.01'],when:app=>live(app.engine.b)&&m(app.engine.b).engaged&&m(app.engine.b).phase===1},
 {key:'warning',ids:[...ids('FALL_WARNING',2),'A3.S29.GUIDE.02'],when:app=>warning(app.engine.b)},
 {key:'phase2',ids:ids('PHASE2',2),when:app=>!!m(app.engine.b).coverCommitted},
 {key:'soul',ids:ids('SOUL_DANGER',1),when:app=>{const b=app.engine.b;return b.units.some(u=>V.alive(u)&&u.side===1&&u.cls==='occultist'&&u.honroStage29Source&&V.heroes(b).some(h=>V.near(h,u,330))&&u.aiMove);}},
 {key:'phase3',ids:ids('PHASE3',2),when:app=>live(app.engine.b)&&m(app.engine.b).phase===3&&(m(app.engine.b).advanceDistance||0)>5},
 {key:'thrust',ids:ids('THRUST_WARNING',1),when:()=>false /* Existing PhaseA boss uses S09 crescent, no spear windup. Kept addressable, never counterfeit a thrust. */},
 {key:'death',ids:ids('DEFEAT',1),when:app=>{const b=app.engine.b,d=q(b).deathMoment;return !!d?.observed&&!d.expired&&!!m(b).death;}},
 {key:'gate',ids:ids('GATE',2),when:app=>m(app.engine.b).sluiceReclaimed===true},
 {key:'trace',ids:ids('TRACE',3),when:app=>trace(app.engine.b)},
 {key:'exit',ids:ids('EXIT',1),when:app=>!!app.engine.b.honroRouteChoice?.selectedRoute&&m(app.engine.b).sluiceReclaimed&&m(app.engine.b).echo?.done}],
 journals:[{id:'A3.S29.JOURNAL.01',when:app=>{const b=app.engine.b;return trace(b)&&q(b).proof.trace.mage&&P.stepSatisfied(b,{id:'stage29-cohort'});}}],
 complete:b=>P.complete(b)&&F.closed(q(b).events.exit),objective:b=>'A3.S29.OBJ.0'+(m(b).death?(trace(b)?5:4):m(b).phase===3?3:warning(b)||m(b).phase===2?2:1),
 camera(app,key){return{id:'v4.29.'+key,intent:'situation',targets:[['gate','trace','exit'].includes(key)?{marker:'stage29-echo'}:{actor:P.bossId},{marker:warning(app.engine.b)?'stage29-cover':'stage29-sluice'}],padding:130,maxScale:.8};},
 draw(scene,c,b){const u=boss(b),d=q(b).deathMoment,x=d?.x??u.x,y=d?.y??u.y;c.save();c.translate(x+70,y);if(!live(b))c.rotate(.9);c.strokeStyle='#82785e';c.lineWidth=5;c.beginPath();c.moveTo(0,0);c.lineTo(0,-175);c.stroke();c.fillStyle='#6f6550';c.fillRect(0,-170,70,60);c.strokeStyle='#b5ad8c';c.lineWidth=3;c.beginPath();c.moveTo(25,-142);c.lineTo(36,-154);c.lineTo(47,-142);c.lineTo(36,-130);c.closePath();c.stroke();c.restore();if(d?.observed&&!live(b)){c.save();c.translate(d.x,d.y);c.rotate(-1.25);c.translate(-d.x,-d.y);scene.unitBody(c,{...u,x:d.x,y:d.y,dead:true,hp:0},0);c.restore();}}
});R.retry=app=>{const b=app.engine?.b,start=b?.honroReviewed29Start;if(!R.active(b)||!start||b.phase!=='lost')return false;const seen=F.copy(Object.fromEntries(Object.entries(q(b).events).filter(([,v])=>F.closed(v)))),awarded=new Map(b.units.map(u=>[u.id,u.xpGranted||0])),restored=F.copy(start),report=b.honroReport?F.copy(b.honroReport):null;Object.assign(R.memory(restored).events,seen);restored.heroes=F.copy(b.heroes);restored.honroGrowth=F.copy(b.honroGrowth);for(const u of restored.units){u.xpGranted=Math.max(u.xpGranted||0,awarded.get(u.id)||0);if(u.side===0&&!u.summoned&&restored.heroes[u.cls])G.HONRO_CORE.applyHero(u,restored.heroes[u.cls]);}G.HonroProgression?.reconcileWounds(restored);G.HonroClearReport?.retry(restored,report);restored.sceneVersion=Math.max(b.sceneVersion||0,restored.sceneVersion||0)+1;app.close?.();app.mount(restored);app.profile.honroBattle=F.copy(restored);app.persist?.();return true;};
G.HonroAct23V4Chapter29Reviewed=R;
})(globalThis);
