(function(G){'use strict';
// Chapter 15 owns observations only. Drainage, shared projectile force, collision,
// route receipts and finite deep knocks remain on the Phase A physical plugin.
const P=G.HonroAct23V4ReviewedChapters;if(!P||G.HonroAct23V4Reviewed15)return;
const V=P.V,C=P.C,A=G.HonroAct23V4Act2Scenes,B=A.base;
const clone=x=>JSON.parse(JSON.stringify(x)),unit=(b,id)=>b.units.find(u=>u.id===id),alive=V.alive;
const api=P.apiFor(15),memory=b=>{const m=api.memory(b);return m.physical??={wheel:{angle:0,elapsed:0},drops:{elapsed:0,passes:0},merge:{ids:[],starts:{}}};};
const near=(b,p,r)=>V.heroes(b).some(u=>V.near(u,p,r));
const threats=(b,p,r=320)=>b.units.filter(u=>alive(u)&&u.side===1&&!u.honroObjectiveTarget&&V.near(u,p,r));
const field=b=>b.honroAct23V4TrajectoryForce;
const inside=(p,z)=>p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h;
function author(map){const init=map.initialState,at=id=>map.markers.find(m=>m.id===id);
 init.honroV4Reviewed15={revision:1,wheel:init.honroV4LowWheel,pulleys:[{x:2140,y:3800},{x:5680,y:4765,angle:Math.atan(1/6)}],returnBridge:{support:'fc15-crown-return',x:4420,y:3140},highSupports:['fc15-west-arch','fc15-crown-return','fc15-safe-crown-descent'],merge:{x:at('groove').x,y:at('groove').y},entries:[{x:5650,y:4210},{x:5900,y:4180}],lowerPlatform:{id:'fc15-drained-ledge',x:5700,y:4600}};
 // The sound is below the existing bed, in the deep eastward hollow. It is
 // deliberately not an on-screen civilian or a voice from a living survivor.
 init.honroV4KnockSource={x:7530,y:4880};
}
function prepare(b){memory(b);}
// Match Engine.waterFloor: the rectangular depth alone includes dry bank/rock.
function waterFloor(w,x){const ps=w.bottom;if(!ps?.length)return w.y+w.depth;for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];if(x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x||1);}return w.y+w.depth;}
function pulleyPoint(p,x,y){const a=p.angle||0;return{x:p.x+x*Math.cos(a)-y*Math.sin(a),y:p.y+x*Math.sin(a)+y*Math.cos(a)};}
function submergedPulley(b,p){const points=[[-55,0],[116,0],[-55,-132],[116,-132]].map(([x,y])=>pulleyPoint(p,x,y));return(b.waters||[]).find(w=>points.every(q=>q.x>=w.x&&q.x<=w.x+w.w&&q.y>w.y+4&&q.y<=waterFloor(w,q.x)+1));}
function inView(scene,p){const r=scene.canvas?.getBoundingClientRect?.();if(!r?.width||!r?.height||!(scene.scale>0))return false;const x=(p.x-scene.x)*scene.scale+r.width/2,y=(p.y-scene.y)*scene.scale+r.height/2;return x>=12&&x<=r.width-12&&y>=12&&y<=r.height-12;}
function observePulleys(scene,e,b){if(e?.b!==b||!api.active(b)||!b.session)return;const u=api.actor(b,'설오');if(!alive(u))return;
 const eye={x:u.x,y:u.y-u.h*.63};if(!inView(scene,eye))return;
 for(const p of b.honroV4Reviewed15.pulleys){const w=submergedPulley(b,p),point=pulleyPoint(p,-8,-103);if(!w||!V.near(u,point,650)||scene.scale*46<14||![[-55,-132],[116,-132],[-55,0],[116,0]].every(([x,y])=>inView(scene,pulleyPoint(p,x,y)))||e.projectileCollision(eye,point,1,u.id,[],false))continue;
  const m=memory(b),q=m.continuity??={revision:1,sourceRun:b.session};if(q.sourceRun!==b.session)continue;
  if(q.brokenPulley)continue;
  q.brokenPulley={sourceRun:b.session,observer:u.id,observerClass:u.cls,from:eye,point,prop:clone(p),water:{x:w.x,y:w.y,w:w.w,depth:w.depth,floor:waterFloor(w,point.x)},sight:{terrainClear:true,renderedUnderWater:true,viewport:{x:scene.x,y:scene.y,scale:scene.scale,width:scene.canvas.getBoundingClientRect().width,height:scene.canvas.getBoundingClientRect().height}}};e.emit('save');
 }
}

function flooded(b){const m=memory(b),s=b.honroV4Reviewed15,p=s.lowerPlatform,t=b.terrain.find(t=>t.id===p.id);
 return !B.memory(b).drained&&!m.drained&&!!t?.broken&&(b.waters||[]).some(w=>p.x>=w.x&&p.x<=w.x+w.w&&p.y>w.y&&p.y<=w.y+w.depth+5);
}
function optional(profile,r){if(r.id!=='EDGE.OPTIONAL_15_KNIGHT_0')return true;const b=profile.honroBattle;
 // A camp without this run's physical observation cannot inherit the claim
 // from chapter completion, an older candidate, or a prior rest cursor.
 return !!b&&api.active(b)&&!!memory(b).returnBridge&&flooded(b);
}
function allow(app,r){const b=app.engine.b,m=memory(b),s=b.honroV4Reviewed15,w=unit(b,s.wheel),q=api.memory(b);
 switch(r.id){
 case 'EDGE.ARRIVALS_15_0':return !!w&&s.pulleys.length===2&&(b.waters||[]).length>0;
 case 'A2.S15.INTRO.01':case 'A2.S15.INTRO.02':return alive(w)&&m.wheel.angle>=.06&&!!m.wheel.observed;
 case 'A2.S15.INTRO.03':return !!m.lowObserved;
 case 'A2.S15.CHOICE.01':case 'A2.S15.UI_CHOICE.01':case 'A2.S15.UI_CHOICE.02':return !!m.lowObserved&&!!m.highObserved;
 case 'A2.S15.BRANCH.01':return m.route==='A'&&!!m.lowApproach&&!B.memory(b).drained&&V.near(unit(b,m.lowApproach.actor),V.marker(b,'sluice'),220);
 case 'A2.S15.BRANCH.02':return m.route==='B'&&blockedSight(app,m.blockedSight);
 case 'A2.S15.MID.01':return m.drops.passes>=1;
 case 'A2.S15.MID.02':return m.drops.passes>=2;
 case 'A2.S15.POPUP.01':return m.drops.passes>=1&&field(b)?.ax===36;
 case 'A2.S15.MID.03':return !!m.prediction&&m.prediction.ax===field(b)?.ax;
 case 'A2.S15.MID.04':return m.merge.admitted===true&&m.merge.ids.length===2&&m.merge.ids.every(id=>{const u=unit(b,id);return alive(u)&&u.honroSpawnSource==='reviewed.15.merge-pair';});
 case 'A2.S15.MID.05':return !!m.merge.cleared&&m.merge.ids.length===2&&m.merge.ids.every(id=>!alive(unit(b,id)))&&!threats(b,s.merge).length;
 case 'A2.S15.MID.06':return (A.memory(b).knocks?.emitted.length||0)>=1;
 case 'A2.S15.MID.07':return (A.memory(b).knocks?.emitted.length||0)>=2&&b.honroV4KnockSource.y>s.merge.y+300;
 case 'A2.S15.COMPLETE.01':return !!A.memory(b).proof['15.knocks']&&near(b,s.merge,320)&&api.done(b,'deep-knocks');
 case 'A2.S15.COMPLETE.02':return !!m.departure&&near(b,m.departure.point,180)&&api.done(b,'temple');
 case 'A2.S15.JOURNAL.01':return !!A.memory(b).proof['15.knocks']&&!!(m.trace||m.liveForce)&&m.drops.passes>=2&&api.done(b,'temple');
 case 'A2.S15.OBJECTIVE.01':return true;
 default:return r.channel==='optional'&&optional({...app.profile,honroBattle:b},r);
 }
}
function blockedSight(app,proof){if(!proof)return false;const e=app.engine,b=e.b,u=unit(b,proof.actor),target=unit(b,proof.target);
 if(!alive(u)||!alive(target)||!V.near(u,proof.from,85)||target.y<u.y+180)return false;
 const hit=e.projectileCollision({x:u.x,y:u.y-u.h*.63},{x:target.x,y:target.y-target.h*.55},1,u.id,[],false);
 return !!hit?.terrain&&!hit.terrain.broken&&hit.terrain.id===proof.terrain;
}
function observe(app,dt){const e=app.engine,b=e.b,m=memory(b),s=b.honroV4Reviewed15,w=unit(b,s.wheel),delta=Math.max(0,Math.min(dt,.05));
 if(alive(w)){m.wheel.elapsed+=delta;m.wheel.angle=m.wheel.elapsed*.24;if(near(b,w,1050))m.wheel.observed={id:w.id,x:w.x,y:w.y};}
 if(near(b,V.marker(b,'sluice'),650)){m.lowObserved??={point:clone(V.marker(b,'sluice'))};m.highObserved??={support:'dry-shoulder'};}
 const bridge=b.terrain.find(t=>t.id===s.returnBridge.support&&!t.broken);
 if(bridge&&V.heroes(b).some(u=>V.near(u,s.returnBridge,170)&&C.validTerrainContactPose(b.terrain,u)&&e.grounded(u)))m.returnBridge??={support:bridge.id,point:clone(s.returnBridge)};
 const archer=api.actor(b,'설오');
 if(alive(archer)&&s.highSupports.includes(e.surface(archer.x,archer.y-4,archer.y+4)?.t?.id)&&e.grounded(archer)&&C.validTerrainContactPose(b.terrain,archer)){
  m.route='B';if(!m.blockedSight)for(const target of b.units.filter(u=>alive(u)&&u.side===1&&u.y>archer.y+180&&Math.abs(u.x-archer.x)<1100)){
   const hit=e.projectileCollision({x:archer.x,y:archer.y-archer.h*.63},{x:target.x,y:target.y-target.h*.55},1,archer.id,[],false);
   if(hit?.terrain){m.blockedSight={actor:archer.id,target:target.id,terrain:hit.terrain.id,from:{x:archer.x,y:archer.y},to:{x:target.x,y:target.y}};break;}
  }
 }
 if(m.blockedSight&&!blockedSight(app,m.blockedSight)&&!api.memory(b).events['high-branch'])delete m.blockedSight;
 const z=field(b)?.zone;
 if(z&&V.heroes(b).some(u=>u.x>=z.x-450&&u.x<=z.x+z.w&&u.y>=z.y-200&&u.y<=z.y+z.h+120)){
  m.drops.elapsed+=delta;m.drops.passes=Math.floor(m.drops.elapsed/.55);
 }
 if(B.memory(b).drained)m.drained=true;
 const selected=b.honroRouteChoice?.selectedRoute;
 const route=(b.honroRouteSpec?.routes||[]).find(r=>r.id===(selected||m.route));
 const exit=route&&V.marker(b,route.markerId);
 if(exit&&near(b,exit,180))m.departure={route:route.id,point:clone(exit)};
}
function admit(app){const e=app.engine,b=e.b,m=memory(b),s=b.honroV4Reviewed15;
 if(m.merge.admitted||!V.mem(b).done.groove||!near(b,s.merge,360))return;
 if(b.units.filter(u=>alive(u)&&u.side===1).length+2>G.HonroEncounters.populationCap(b))return;
 for(const p of s.entries){if(V.heroes(b).some(u=>Math.hypot(u.x-p.x,(u.y-p.y)*.75)<350))continue;
  const ids=new Set(b.units.map(u=>u.id));
  if(G.HonroAllies.execute(app,{type:'spawn',kind:'ghost',n:2,...p,spacing:150,maxDistance:180,source:'reviewed.15.merge-pair',requireFlightClearance:true})===false)continue;
  const born=b.units.filter(u=>!ids.has(u.id)&&u.side===1&&u.honroSpawnSource==='reviewed.15.merge-pair');
  if(born.length!==2)throw Error('15.merge.non-atomic admission');
  m.merge.ids=born.map(u=>u.id);m.merge.starts=Object.fromEntries(born.map(u=>[u.id,{x:u.x,y:u.y}]));m.merge.entry=clone(p);m.merge.admitted=true;e.emit('save');break;
 }
}
function scene(app,key,ids,proof,targets){const opened=api.begin(app,key,ids,proof||{});if(opened&&targets){for(const line of app.dialogue.lines)line[2].camera={id:line[2].rowId,intent:'situation',targets:clone(targets),padding:120,maxScale:.75};G.HonroStory.draw(app);}return opened;}
function drive(app){const b=app.engine.b,m=memory(b),s=b.honroV4Reviewed15,q=api.memory(b);
 if((b.honroState.storyQueue||[]).length)return;
 if(!q.events.arrival){scene(app,'arrival',['EDGE.ARRIVALS_15_0'],{},[{actor:s.wheel},s.pulleys[0]]);return;}
 if(!q.events.wheel&&(allow(app,api.row('A2.S15.INTRO.01'))||!alive(unit(b,s.wheel))&&m.lowObserved)){scene(app,'wheel',['A2.S15.INTRO.01','A2.S15.INTRO.02'],m.wheel,[{actor:s.wheel},s.pulleys[0]]);return;}
 if(!q.events.paths&&m.lowObserved&&api.done(b,'wheel')){scene(app,'paths',['A2.S15.INTRO.03','A2.S15.CHOICE.01'],{low:m.lowObserved,high:m.highObserved},[V.marker(b,'sluice'),{x:2820,y:3748}]);return;}
 if(!q.events['high-branch']&&allow(app,api.row('A2.S15.BRANCH.02'))){scene(app,'high-branch',['A2.S15.BRANCH.02'],m.blockedSight,[m.blockedSight.from,m.blockedSight.to]);return;}
 if(!q.events['first-drops']&&m.drops.passes>=1){scene(app,'first-drops',['A2.S15.MID.01'],m.drops,[s.merge]);return;}
 if(api.done(b,'first-drops')&&!q.events['repeat-drops']&&m.drops.passes>=2){scene(app,'repeat-drops',['A2.S15.MID.02'],m.drops,[s.merge]);return;}
 if(api.done(b,'repeat-drops')&&!q.events['trajectory-guide']){scene(app,'trajectory-guide',['A2.S15.POPUP.01'],field(b));return;}
 if(api.done(b,'trajectory-guide')&&!q.events.trajectory&&allow(app,api.row('A2.S15.MID.03'))){scene(app,'trajectory',['A2.S15.MID.03'],{predicted:m.prediction,live:m.liveForce},[s.merge]);return;}
 admit(app);
 if(m.merge.admitted&&!q.events['merge-pair']){scene(app,'merge-pair',['A2.S15.MID.04'],m.merge,m.merge.ids.map(actor=>({actor})));return;}
 if(m.merge.admitted&&api.done(b,'merge-pair')&&m.merge.ids.every(id=>!alive(unit(b,id)))&&!threats(b,s.merge).length){m.merge.cleared=true;if(!q.events['merge-clear']){scene(app,'merge-clear',['A2.S15.MID.05'],m.merge,[s.merge]);return;}}
 const knocks=A.memory(b).knocks;
 if(knocks?.emitted.length&&!q.events['first-knock']){scene(app,'first-knock',['A2.S15.MID.06'],knocks.emitted[0],[s.merge]);return;}
 if(knocks?.emitted.length>=2&&api.done(b,'first-knock')&&!q.events['deep-knocks']){scene(app,'deep-knocks',['A2.S15.MID.07'],{source:b.honroV4KnockSource,events:knocks.emitted},[s.merge]);return;}
 if(A.memory(b).proof['15.knocks']&&api.done(b,'deep-knocks')&&!q.events.temple){scene(app,'temple',['A2.S15.COMPLETE.01'],A.memory(b).proof['15.knocks'],[V.marker(b,'route-upper-exit')]);return;}
 if(api.done(b,'temple')&&!q.journal){if(allow(app,api.row('A2.S15.JOURNAL.01'))){api.journal(app,'A2.S15.JOURNAL.01');delete m.journalWithheld;}else m.journalWithheld={rowId:'A2.S15.JOURNAL.01',reason:'projectile-not-observed'};}
 if(m.departure&&api.done(b,'temple')&&!q.events.depart){scene(app,'depart',['A2.S15.COMPLETE.02'],m.departure,[m.departure.point]);}
}
function before(app,a,dt){if(!a.safe(app))return false;observe(app,dt);drive(app);if(app.dialogue)return false;
 const b=app.engine.b,m=memory(b),s=V.current(b);
 // No deep sound, exit receipt, or on-the-way journal can race the merge fight.
 if(s?.id==='15.knocks'&&(!m.merge.cleared||!a.done(b,'merge-clear')))return false;
 if(s?.id==='15.knocks'&&A.memory(b).knocks?.emitted.length===1&&!a.done(b,'first-knock'))return false;
 if(s?.id==='route-exit'&&!a.done(b,'temple'))return false;
 return true;
}
function use(app,m,s){const b=app.engine.b,q=memory(b);if(s?.id==='sluice'&&!api.done(b,'low-branch')){
 q.route='A';q.lowApproach={actor:app.engine.active.id,point:{x:app.engine.active.x,y:app.engine.active.y}};
 scene(app,'low-branch',['A2.S15.BRANCH.01'],q.lowApproach,[V.marker(b,'sluice')]);return true;
 }return undefined;}
// An optional aiming observation never becomes an extra skill/class requirement.
// The original drift/groove route remains usable without a shot or an archer.
function eligibility(){return undefined;}
const bodyModes=new Set(['leap','slam','spin','dash','quake','guard','lift','recall','charge','vault','cataclysmCharge']);
function attach(app,e){if(e.honroReviewed15Bound)return;e.honroReviewed15Bound=true;
 const predict=e.predict;e.predict=function(u,skill,...args){const out=predict.call(e,u,skill,...args),b=e.b,z=field(b)?.zone;
  // AI/probing calls with collect=false, inactive actors and body/martial/stake
  // paths cannot stand in for a player's visible production predicted trace.
  if(api.active(b)&&alive(u)&&u.side===0&&u.id===b.active&&b.side===0&&!app.dialogue&&args[3]!==false&&skill&&!skill.martial&&!bodyModes.has(skill.mode)&&!/^stake/.test(skill.mode||'')&&z&&out.points?.some(p=>inside(p,z))){
   const proof={actor:u.id,skill:skill.id,ax:field(b).ax,zone:clone(z),endpoint:{x:out.x,y:out.y},terrain:out.terrain};memory(b).trace=proof;if(u.cls==='archer'&&/^A/.test(skill.id))memory(b).prediction=proof;
  }return out;
 };
 const step=e.stepProjectile;e.stepProjectile=function(p,...args){const b=e.b,u=unit(b,p.owner),force=V.projectileForce(b,p);
  if(api.active(b)&&u?.side===0&&!p.body&&!bodyModes.has(p.mode)&&force?.x===field(b)?.ax)memory(b).liveForce={owner:p.owner,projectile:p.id,skill:p.skill,ax:force.x,point:{x:p.x,y:p.y},zone:clone(field(b).zone)};
  return step.call(e,p,...args);
 };
}
function present(b,result){const m=memory(b);if(!m.lowObserved||V.mem(b).done.groove)return result;
 const choices=[['A2.S15.UI_CHOICE.01','sluice'],['A2.S15.UI_CHOICE.02','route-upper-exit']].map(([id,marker])=>({...V.marker(b,marker),id:marker,rowId:id,label:api.row(id).text,kind:'exit',reviewedStage:15,reviewedRevision:1}));
 return{...result,targets:[...result.targets,...choices],allTargets:[...result.allTargets,...choices]};
}
function drawPulley(c,p,submerged=false){c.save();if(submerged)c.globalAlpha*=.68;c.translate(p.x,p.y);c.rotate(p.angle||0);c.strokeStyle=submerged?'#76948b':'#8d8064';c.lineWidth=7;c.beginPath();c.moveTo(-55,0);c.lineTo(-46,-115);c.lineTo(15,-132);c.lineTo(39,-75);c.moveTo(-36,-114);c.lineTo(8,-124);c.stroke();c.strokeStyle=submerged?'#aec6b7':'#a49b7b';c.lineWidth=4;c.beginPath();c.arc(-8,-103,23,.35,Math.PI*1.6);c.moveTo(-8,-103);c.lineTo(-8,-126);c.moveTo(-8,-103);c.lineTo(-29,-98);c.moveTo(11,-89);c.lineTo(24,-47);c.lineTo(17,-29);c.stroke();c.fillStyle=submerged?'#526d68':'#485454';c.beginPath();c.moveTo(36,0);c.lineTo(43,-34);c.lineTo(98,-43);c.lineTo(116,-10);c.lineTo(108,0);c.closePath();c.fill();c.restore();}
function draw(scene,c,b,e){const m=memory(b),s=b.honroV4Reviewed15,w=unit(b,s.wheel);c.save();
 // The shared pool fill is opaque. Render submerged remains in its blue-green
 // palette after that pass, below the surface in the actual basin polygon.
 for(const p of s.pulleys)drawPulley(c,p,!!submergedPulley(b,p));
 observePulleys(scene,e,b);
 if(alive(w)){c.save();c.translate(w.x,w.y-w.h*.55);c.rotate(m.wheel.angle);c.strokeStyle='#bdd0c1';c.globalAlpha=.55;c.lineWidth=3;c.beginPath();c.ellipse(0,0,54,69,0,0,Math.PI*2);c.moveTo(-54,0);c.lineTo(54,0);c.stroke();c.restore();}
 c.restore();}
function complete(b){const m=memory(b);return api.done(b,'depart')&&m.merge.cleared===true&&!!A.memory(b).proof['15.knocks'];}
P.register(15,{mapRevision:515,author,prepare,allow,before,drive,use,eligibility,attach,present,draw,optional,objective:()=> 'A2.S15.OBJECTIVE.01',complete});
const outcome=V.recordOutcome;V.recordOutcome=function(app,won){outcome(app,won);const b=app.engine?.b;if(won&&api.active(b)){const h=app.profile.honroAct23V4History?.stages?.[15];if(h?.reviewedNarrative&&memory(b).journalWithheld)h.reviewedNarrative.journalWithheld=clone(memory(b).journalWithheld);
 if(h?.run===b.session){const q=memory(b).continuity,proof=q?.revision===1&&q.sourceRun===b.session&&q.brokenPulley?.sourceRun===b.session?q.brokenPulley:null;
  // The actual merge spirits are not below the sluice. Never infer this claim
  // from their admission, death, a reviewed line, or a chapter-clear ledger.
  h.reviewedPhysical={revision:1,sourceRun:b.session,brokenPulleysObserved:!!proof,upwardHandsObserved:false,proof:{brokenPulley:clone(proof),upwardHands:null}};
 }
}};
G.HonroAct23V4Reviewed15={memory,allow,flooded,optional,blockedSight,complete,submergedPulley};
})(globalThis);
