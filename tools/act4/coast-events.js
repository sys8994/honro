(function(G){'use strict';
const P=G.HonroAct4TerrainPreview,A=P.eventAPI,{alive,party,memory,seed,event,inView,play}=A,C=G.HONRO_CORE;
const active=b=>b?.honroCustom&&b.honroAct4Preview>=31&&b.honroAct4Preview<=40,copy=x=>JSON.parse(JSON.stringify(x));
const near=(u,p,r=160)=>alive(u)&&Math.hypot(u.x-p.x,u.y-p.y)<r;
const foes=b=>b.units.filter(u=>u.side===1&&alive(u));
const stable=b=>!b.projectiles.length&&!b.volley&&b.phase==='aim';
const quiet=b=>!foes(b).length&&stable(b);
const seen=(q,k)=>q.observed?.[k]!==undefined;
const closed=(q,k)=>!!q.events[k]?.terminal;
const cast=app=>app.engine.active;
const residents=b=>b.units.filter(u=>u.honroAct4Resident);
function goal(app,id){const text=G.HONRO_ACT4_PREVIEW_SEEDS.ui.find(v=>v[0]===id)?.[1];if(!text)return;app.stage.goal=text;const n=G.document.getElementById('objective-text');if(n)n.textContent=text;}
function fact(b,id,proof){const a=b.honroAct4FactEvents??=[];if(a.some(v=>v.eventId===id))return;a.push({eventId:id,stage:b.honroAct4Preview,sourceRun:b.session,officialAct4:false,proof:copy(proof)});}
function complete(app,proof){const b=app.engine.b,q=memory(b);if(q.complete||q.failure)return;q.complete=true;q.completionProof=copy(proof);b.phase='won';if(b.honroAct4Preview===40)fact(b,'eq_so_t3b',proof);P.save?.();}
function fail(b,reason){const q=memory(b);if(q.complete||q.failure)return;q.failure=reason;b.phase='lost';}
function space(b,u,p,range=220,accept=null){return G.HonroTerrain.place(b,u,{x:p.x,y:p.y,maxDistance:range,clearance:15,accept});}
function feet(e,u,p){Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0});delete u.moveTarget;delete u.aiMove;return e.grounded(u);}
function spend(e,u){u.moveLeft=0;u.acted=true;delete u.moveTarget;delete u.aiMove;u.vx=u.vy=0;}
function moveNpc(e,u,dx,dt,budget){if(!alive(u))return;u.fixed=false;u.maxMove=u.maxMove||240;u.moveLeft=Math.min(budget,180);const x=u.x;const ok=e.walk(u,Math.sign(dx-u.x),Math.min(dt,Math.abs(dx-u.x)/180),true);u.vx=0;return ok?Math.abs(u.x-x):0;}
function tide(b){const q=memory(b),cfg=b.honroAct4Design.tide;if(!cfg)return;const t=q.tide??={phase:'low',surface:cfg.low,warningRound:cfg.warningRound,highRound:cfg.highRound,lowRound:cfg.lowRound};
 if(b.round>=cfg.warningRound&&!t.warned){t.phase='rising';t.surface=cfg.low-18;t.warned=true;t.warningAtRound=b.round;t.highRound=Math.max(cfg.highRound,b.round+1);}
 if(t.warned&&b.round>=t.highRound&&b.round<t.lowRound){t.phase='high';t.surface=cfg.high;}
 if(b.round>=t.lowRound){t.phase='low';t.surface=cfg.low;t.finished=true;}
 syncWater(b);
}
function syncWater(b){const q=memory(b),level=q.tide?.surface;if(!Number.isFinite(level)||q.waterVisualLevel===level)return;q.waterVisualLevel=level;
 b.honroSurfaceZones=(b.honroSurfaceZones||[]).filter(z=>!String(z.id).startsWith('a4-live-'));
 const land=b.terrain.filter(t=>!t.oneWay&&!t.honroElementCollision&&!t.honroCeiling),floor=x=>Math.min(...land.map(t=>C.terrainSurfaces(t,x).map(v=>v.y)).flat().filter(y=>y>=level-800));
 for(const z of b.honroAct4Design.waterPolicies.filter(z=>z.kind==='recover')){let run=[];const emit=()=>{if(run.length>1){const a=run[0],c=run.at(-1);b.honroSurfaceZones.push({id:'a4-live-'+z.id+'-'+a[0],kind:'water-pool',surface:[[a[0],level],[c[0],level]],bottom:run,points:[[a[0],level],[c[0],level],...run.slice().reverse()],attached:true});}run=[];};for(let x=z.x1;x<=z.x2+32;x+=32){const px=Math.min(z.x2,x),y=floor(px);if(y>level){run.push([px,y]);}else emit();}emit();}b.sceneVersion++;
}
function water(e){const b=e.b;if(!active(b))return;const q=memory(b),policies=b.honroAct4Design?.waterPolicies||[];q.water??={dry:{},recoveries:[]};
 for(const u of b.units.filter(u=>alive(u)&&u.side!==1&&!u.honroAct4Sheltered&&!u.honroAct4OnBoat)){
  const zones=policies.filter(z=>u.x>z.x1&&u.x<z.x2),z=zones.find(z=>u.y>(q.tide?.surface??z.surface)+35&&!u.fixed);
  if(!z){if(e.grounded(u)&&!u.honroAct4Recovering&&policies.every(v=>u.y<(q.tide?.surface??v.surface)-10))q.water.dry[u.id]={x:u.x,y:u.y};continue;}
  if(z.kind==='lethal'){e.hurt(u,u.maxHp*10,'',false,undefined,undefined,'environment');continue;}
  const last=q.water.dry[u.id]||{x:u.spawnX??260,y:u.spawnY??u.y},side=last.x<(z.x1+z.x2)/2?'Left':'Right',span=z['entry'+side];if(!span)continue;
  if(!u.honroAct4Recovering){u.honroAct4Recovering={zone:z.id,entry:copy(last),side,damage:Math.ceil(u.maxHp*.25),damaged:false};spend(e,u);}
  const r=u.honroAct4Recovering;
  // The declared low bank is on the actual entry side. No high/opposite bank
  // candidates are accepted, even if they are geometrically nearer.
  const landing=space(b,u,{x:Math.max(span[0]+u.r,Math.min(span[1]-u.r,last.x)),y:last.y},Math.max(1200,span[1]-span[0]+400),(x,y)=>x>=span[0]+u.r&&x<=span[1]-u.r&&y>=last.y-60&&y<(q.tide?.surface??z.surface)-10&&b.terrain.some(t=>!t.oneWay&&!t.honroElementCollision&&C.terrainSurfaces(t,x).some(f=>Math.abs(f.y-y)<2)));
  if(!landing){u.vx=u.vy=0;u.honroAct4RecoverPending=true;continue;}
  if(!r.damaged){const shield=u.shield;u.shield=0;const hp=u.hp;e.hurt(u,r.damage,'',false,undefined,undefined,'environment');u.shield=shield;r.damaged=true;r.hpLoss=hp-u.hp;}
  if(alive(u))feet(e,u,landing);q.water.recoveries.push({unit:u.id,zone:z.id,side,entry:last,landing,hpLoss:r.hpLoss,round:b.round,shot:b.shot});delete u.honroAct4Recovering;delete u.honroAct4RecoverPending;
 }
}
function escort(e,q,dt){const b=e.b,cfg=b.honroAct4Design.rescue;if(!cfg||!q.exitStable||!q.netOpen)return;
 const token=b.round+':'+b.shot+':'+b.side;for(const [i,id]of cfg.ids.entries()){const u=e.unit(id);if(!alive(u))continue;const m=q.escort??={};const rec=m[id]??={};if(rec.token!==token){rec.token=token;rec.remaining=170;}
  if(u.x>=cfg.safeX[i]-14&&u.y<=cfg.safeY+8){rec.safe=true;u.fixed=true;continue;}
  if(rec.remaining<=0||b.side!==0||b.phase!=='aim')continue;const moved=moveNpc(e,u,cfg.safeX[i],dt,rec.remaining)||0;rec.remaining-=moved;
 }
}
P.coastObserve=function(app,dt){const b=app.engine.b,n=b.honroAct4Preview;if(!active(b))return;const q=memory(b),e=app.engine,cfg=b.honroAct4Design;
 if(!cfg)return;tide(b);
 if([38,39,40].includes(n)&&residents(b).some(u=>!alive(u)))fail(b,'rescue-casualty');
 if(!party(b).length)fail(b,'party-defeated');
 if(q.failure||q.complete||app.modal.classList.contains('open')||app.dialogue)return;
 if(n===31&&q.boat.phase==='boarded')fact(b,'eq_se_t3b',{boarded:true,party:party(b).map(u=>u.id)});
 if(n===31&&party(b).some(u=>u.x<105&&u.x>35&&e.grounded(u)))fact(b,'eq_co_12',{tag:'eq-co-31',reachedBy:party(b).find(u=>u.x<105)?.id});
 if(n===32){const npc=e.unit('a4-shelter-speaker');if(!quiet(b))return;
  if(npc.honroAct4Sheltered&&party(b).some(u=>Math.abs(u.x-4890)<650)){q.shelterDoor??={phase:'opening',time:0};goal(app,'A4.S32.REUNION_OBJECTIVE');}
  if(q.shelterDoor?.phase==='opening'){q.shelterDoor.time=Math.min(1,q.shelterDoor.time+dt);if(q.shelterDoor.time===1&&seen(q,'door-open')){q.shelterDoor.phase='open';npc.honroAct4Sheltered=false;npc.fixed=false;}}
  if(q.shelterDoor?.phase==='open'&&npc.x>4780)moveNpc(e,npc,4770,dt,180);
  if(npc.x<=4780){npc.fixed=true;npc.facing=-1;npc.honroScenePose={kind:'point',time:1};q.thresholdAt??=q.clock;}
  if(q.thresholdAt!==undefined&&q.clock-q.thresholdAt>.8&&seen(q,'threshold')&&party(b).some(u=>u.cls==='archer'&&Math.abs(u.x-npc.x)<340))play(app,'reunion');
  if(closed(q,'reunion')&&cfg.shelter?.manifest.length===7&&seen(q,'threshold')){q.safeSeven={ids:copy(cfg.shelter.manifest),sourceRun:b.session};play(app,'missing_four');}
 }
 if(n===33||n===39){if(q.tide?.phase==='rising'&&seen(q,'water-rising')&&seen(q,'upper-route')&&b.side===0&&party(b).some(u=>!u.acted&&u.moveLeft>80))play(app,'tide_warning',true);}
 if(n===34){const w=cfg.wrongExit,u=e.unit(w.actor);if(alive(u)&&!q.dislocation&&party(b).some(v=>v.x>1800&&v.x<2900)&&inView(app,w.entrance)){q.dislocation={phase:'entering',at:q.clock,originalFixed:u.fixed};}
  const t=q.dislocation;if(t&&alive(u)){if(t.phase==='entering'){u.fixed=false;moveNpc(e,u,w.entrance.x,dt,180);if(Math.abs(u.x-w.entrance.x)<25){u.fixed=true;t.phase='inside';t.at=q.clock;}}
   if(t.phase==='inside'&&seen(q,'wrong-entry')&&q.clock-t.at>.8){const p=space(b,u,w.exit,180);if(p){feet(e,u,p);t.phase='emerged';t.at=q.clock;}}
   if(t.phase==='emerged'&&seen(q,'wrong-exit')){u.fixed=t.originalFixed;t.phase='complete';play(app,'wrong_exit');}
  }
 }
 if(n===35){const mage=party(b).find(u=>u.cls==='mage');if(mage&&mage.x>760&&mage.x<1090&&!foes(b).some(u=>u.x<2100))fact(b,'eq_da_t3b',{actor:mage.id,tag:'existing-damheo-safe-clearing'});if(party(b).some(u=>u.x>5520&&u.x<5720&&e.grounded(u))&&!foes(b).some(u=>u.x>5000))fact(b,'eq_co_t3_choice',{tag:'rooted-third-clearing',reached:true});}
 if(n===37){if(seen(q,'signal')&&seen(q,'gesture'))play(app,'signal');}
 if(n===38){const c=cfg.connection;
  if(seen(q,'rescue-voices')&&!q.connected)play(app,'voice');
  if(q.connectionProbe?.phase==='entry'&&seen(q,'probe-entry')&&q.clock-q.connectionProbe.at>.6){q.connectionProbe={phase:'wrong-exit',at:q.clock};}
  if(q.connectionProbe?.phase==='wrong-exit'&&seen(q,'probe-wrong'))q.connectionProbe.phase='observed';
  if(q.anchorAction&&!q.connected){const mage=e.unit(q.anchorAction.actor);if(!alive(mage)){q.anchorAction=null;return;}mage.honroScenePose={kind:'point',time:1};mage.facing=1;q.anchorAction.elapsed+=dt;if(q.anchorAction.elapsed>1&&seen(q,'anchor-action')){const p=space(b,mage,c.destination,220);if(p){q.connected={destination:p,sourceRun:b.session,stageOnly:true,mpSpent:0};delete mage.honroScenePose;goal(app,'A4.S38.CONNECT_OBJECTIVE');play(app,'connected');}}}
 }
 if(n===39){const r=cfg.rescue,boss=e.unit('a4-wreck');if(alive(boss)&&seen(q,'wreck'))play(app,'boss');
  if(q.stabilizing){const actor=e.unit(q.stabilizing.actor);if(!alive(actor)){q.stabilizing=null;}else{actor.honroScenePose={kind:'point',time:1};q.stabilizing.elapsed+=dt;if(q.stabilizing.elapsed>1&&seen(q,'stabilizing')){q.exitStable={sourceRun:b.session,actor:actor.id,once:true};delete actor.honroScenePose;q.stabilizing=null;if(actor.cls==='mage')play(app,'stabilize');}}}
  if(q.releasing){const actor=e.unit(q.releasing.actor);if(!alive(actor)){q.releasing=null;}else{actor.honroScenePose={kind:'point',time:1};q.releasing.elapsed+=dt;if(q.releasing.elapsed>1&&seen(q,'net-action')){q.netOpen={sourceRun:b.session,actor:actor.id};delete actor.honroScenePose;q.releasing=null;b.sceneVersion++;if(actor.cls==='occultist')play(app,'souls_freed');}}}
  escort(e,q,dt);const dosik=e.unit('a4-rescue-3'),seolo=party(b).find(u=>u.cls==='archer');
  if(q.exitStable&&q.netOpen&&dosik.x>6570&&dosik.x<6740&&near(seolo,{x:dosik.x+70,y:dosik.y},160)){q.hand??={at:q.clock,actor:seolo.id};seolo.honroScenePose={kind:'point',time:1};if(seen(q,'hand')){play(app,'hand',true);q.hand.completed=true;}}
  if(r.ids.every(id=>q.escort?.[id]?.safe)){q.rescued={ids:copy(r.ids),sourceRun:b.session};goal(app,'A4.S39.ESCAPE_OBJECTIVE');}
 }
 if(n===40){const cfg=b.honroAct4Design.escort;if(!quiet(b))return;
  if(!q.returnEscort&&party(b).some(u=>u.x>2600)&&seen(q,'return-boat')&&seen(q,'return-high')){q.returnEscort={phase:'boarding',clock:0,boatX:2920};play(app,'boarding');}
  const r=q.returnEscort;if(r&&closed(q,'boarding')){r.clock+=dt;const np=residents(b);if(r.phase==='boarding'){for(const u of np.slice(0,2))moveNpc(e,u,2870,dt,220);for(const u of np.slice(2))moveNpc(e,u,3100,dt,220);if(np.slice(0,2).every(u=>u.x>2810)){for(const u of np.slice(0,2))u.honroAct4OnBoat=true;r.phase='sailing';}}
   if(r.phase==='sailing'){r.boatX=Math.min(5200,r.boatX+dt*180);for(const [i,u]of np.slice(0,2).entries()){u.x=r.boatX-70+i*110;u.y=2010;u.fixed=true;}for(const u of np.slice(2))moveNpc(e,u,5500,dt,240);if(r.boatX===5200){r.phase='landed';for(const [i,u]of np.slice(0,2).entries()){u.honroAct4OnBoat=false;const p=space(b,u,{x:5200+i*100,y:1780},170);if(p)feet(e,u,p);}}}
   if(r.phase==='landed'){for(const [i,u]of np.entries())if(u.x<5500+i*85)moveNpc(e,u,5500+i*85,dt,220);if(np.every(u=>u.x>5430)){r.phase='safe';q.rescued={ids:np.map(u=>u.id),sourceRun:b.session};}}
   if(r.phase==='safe'&&seen(q,'safe-return'))play(app,'reunion');
   if(closed(q,'reunion')&&P.campaignProof?.safeSeven?.ids.length===7&&P.campaignProof?.rescued?.ids.length===4){q.roster={total:13,living:11,priorDeaths:2};play(app,'thirteen');if(closed(q,'thirteen'))goal(app,'A4.S40.ROSTER');}
   if(closed(q,'thirteen')&&seen(q,'return-ridge')&&seen(q,'small-dislocation'))play(app,'next');
  }
 }
};
const interact=P.interact;P.interact=function(app=G.HonroApp){if(interact(app))return true;const e=app.engine,b=e?.b;if(!active(b)||app.dialogue||b.phase!=='aim')return false;const q=memory(b),n=b.honroAct4Preview,u=e.active,cfg=b.honroAct4Design;if(!alive(u)||!e.grounded(u))return false;
 if(n===38&&near(u,cfg.connection.entry,250)){
  if(!q.connectionProbe){q.connectionProbe={phase:'entry',at:q.clock};return true;}
  if(!q.connected&&q.connectionProbe.phase==='observed'&&u.cls==='mage'){q.anchorAction={actor:u.id,elapsed:0};play(app,'anchor');return true;}
  if(q.connected){const p=space(b,u,q.connected.destination,240);if(!p)return false;feet(e,u,p);return true;}
 }
 if(n===39){if(near(u,cfg.rescue.anchor,240)&&!q.exitStable&&!q.stabilizing){q.stabilizing={actor:u.id,elapsed:0};return true;}if(near(u,cfg.rescue.net,230)&&!q.netOpen&&!q.releasing){q.releasing={actor:u.id,elapsed:0};return true;}
  if(q.exitStable&&q.rescued?.ids.length===4&&party(b).every(v=>v.x>cfg.rescue.exit-260&&e.grounded(v))){complete(app,{exitStable:q.exitStable,rescued:q.rescued,bossAlive:alive(e.unit('a4-wreck'))});return true;}
 }
 if(n===32&&quiet(b)&&closed(q,'missing_four')&&party(b).every(v=>v.x>cfg.exit.x-300)){complete(app,{safeSeven:q.safeSeven});return true;}
 if([33,34,37,38].includes(n)&&party(b).every(v=>v.x>cfg.exit.x-300&&e.grounded(v))&&(![37].includes(n)||closed(q,'signal'))){complete(app,{exit:cfg.exit,connection:q.connected||{physicalRoute:true},signal:q.events.signal?.presented});return true;}
 if(n===40&&q.returnEscort?.phase==='safe'&&closed(q,'next')&&party(b).every(v=>v.x>5300)){complete(app,{roster:q.roster,rescued:q.rescued});return true;}
 return false;};
const launch=P.launch;P.launch=function(n){const r=launch(n),app=G.HonroApp,e=app.engine,b=e.b,q=memory(b);if(!active(b))return r;
 // Every observer is scoped to the captured battle; changing chapter ends its
 // loop. Core Engine remains the sole physics, hit and locomotion provider.
 for(const name of ['move','jump','fire']){const original=e[name].bind(e);e[name]=function(...args){if((name==='jump'?args[0]:e.active)?.honroAct4Recovering)return false;return original(...args);};}
 const tick=e.tick.bind(e);e.tick=function(dt){const out=tick(dt);if(!app.dialogue){tide(b);water(e);}return out;};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const was=alive(u),out=hurt(u,...args);if(was&&!alive(u)&&u.honroAct4RewardTag==='eq-hw-36')fact(b,'eq_hw_t3b',{target:u.id,elite:!!u.elite});if([38,39,40].includes(n)&&u.honroAct4Resident&&!alive(u))fail(b,'rescue-casualty');return out;};
 const allows=e.attackAllows.bind(e);e.attackAllows=function(u,...args){if(u?.honroAct4Sheltered)return false;return allows(u,...args);};
 if(n===32){const npc=e.unit('a4-shelter-speaker');npc.name='고향 사람';}
 for(const u of residents(b))if(u.id==='a4-rescue-3')u.name='도식';
 return r;};
// Visibility receipts are written only by the actual Scene pass. Their points
// refer to finite authored actors/geometry rather than an off-screen timer.
const render=G.HonroScene.prototype.render;G.HonroScene.prototype.render=function(e,...args){const out=render.call(this,e,...args),b=e.b;if(!active(b))return out;const app=G.HonroApp;if(app.scene!==this||G.document.hidden||app.modal.classList.contains('open'))return out;const q=memory(b),n=b.honroAct4Preview,cfg=b.honroAct4Design;if(!cfg)return out;q.observed??={};const mark=(key,p,guard=true)=>{if(guard&&inView(app,p))q.observed[key]??=q.clock;};
 if(n===32){mark('door-open',{x:4890,y:1850},q.shelterDoor?.time===1);const npc=e.unit('a4-shelter-speaker');mark('threshold',{x:npc.x,y:npc.y-65},!npc.honroAct4Sheltered&&npc.x<=4780);}
 if(n===33||n===39){mark('water-rising',{x:n===33?1800:3200,y:q.tide?.surface??2500},q.tide?.phase==='rising');mark('upper-route',{x:n===33?2200:3300,y:n===33?1940:1820});}
 if(n===34){const u=e.unit(cfg.wrongExit.actor);mark('wrong-entry',{x:u.x,y:u.y-40},alive(u)&&q.dislocation?.phase==='inside');mark('wrong-exit',{x:u.x,y:u.y-40},alive(u)&&q.dislocation?.phase==='emerged');}
 if(n===37){mark('signal',cfg.signal,party(b).some(v=>v.x>5900));mark('gesture',{x:8450,y:2050},seen(q,'signal')&&q.visualDrawn?.gesture===q.clock);}
 if(n===38){mark('rescue-voices',{x:5230,y:2535},residents(b).every(alive)&&party(b).some(v=>v.x<3300));mark('probe-entry',{x:3180,y:2970},q.connectionProbe?.phase==='entry'&&q.visualDrawn?.probe===q.clock);mark('probe-wrong',{x:3000,y:2920},q.connectionProbe?.phase==='wrong-exit'&&q.visualDrawn?.probe===q.clock);mark('anchor-action',cfg.connection.entry,!!q.anchorAction);}
 if(n===39){mark('wreck',{x:3500,y:2400},alive(e.unit('a4-wreck')));mark('stabilizing',cfg.rescue.anchor,!!q.stabilizing);mark('net-action',cfg.rescue.net,!!q.releasing);mark('hand',{x:e.unit('a4-rescue-3').x,y:e.unit('a4-rescue-3').y-70},!!q.hand&&q.visualDrawn?.hand===q.clock);}
 if(n===40){mark('return-boat',{x:2920,y:1940});mark('return-high',{x:3100,y:1720});mark('safe-return',{x:5630,y:1650},q.returnEscort?.phase==='safe');mark('return-ridge',{x:5900,y:1300});mark('small-dislocation',{x:5840,y:1610},closed(q,'thirteen'));}
 return out;};
const landmark=G.HonroScene.prototype.landmark;G.HonroScene.prototype.landmark=function(c,l){const b=this.battle;if(!active(b))return landmark.call(this,c,l);const q=memory(b);if(b.honroAct4Preview===32&&l.asset?.id==='a4:door'){const t=q.shelterDoor?.time||0;c.save();c.translate(l.x,l.y);c.scale(Math.max(.09,Math.cos(t*Math.PI*.48)),1);const out=landmark.call(this,c,{...l,x:0,y:0});c.restore();return out;}if(b.honroAct4Preview===39&&q.netOpen&&l.asset?.id==='a4-coast:net')return;return landmark.call(this,c,l);};
const live=G.HonroScene.prototype.liveWater;G.HonroScene.prototype.liveWater=function(c,b){const out=live?.call(this,c,b);if(!active(b))return out;const q=memory(b),n=b.honroAct4Preview,app=G.HonroApp;q.visualDrawn??={};
 if(n===37){const x=8450,y=2120;if(inView(app,{x,y:y-70})){const npc={...residents(b)[0],id:'a4-signal-silhouette',name:'',cls:'knight',honroType:'civilian',honroCivilian:true,hp:1,dead:false,side:2,r:19,h:88,x,y,facing:-1,honroScenePose:{kind:'point',time:.5+Math.sin(this.time*2)*.2}};this.unit(c,npc,false);q.visualDrawn.gesture=q.clock;}}
 if(n===38&&q.connectionProbe){const t=q.connectionProbe,entry=t.phase==='entry',p=entry?{x:3180,y:2970}:{x:3000,y:2920};if(['entry','wrong-exit'].includes(t.phase)&&inView(app,p)){c.save();c.fillStyle='#bbc7bb';c.beginPath();c.ellipse(p.x,p.y,9,7,.25,0,Math.PI*2);c.fill();c.restore();q.visualDrawn.probe=q.clock;}}
 if(n===38&&q.connected){const p=b.honroAct4Design.connection.entry;c.save();c.strokeStyle='#c2bda1';c.lineWidth=5;c.beginPath();c.moveTo(p.x-35,p.y-24);c.lineTo(p.x+25,p.y-13);c.stroke();c.restore();}
 if(n===39&&q.exitStable){const p=b.honroAct4Design.rescue.anchor;c.save();c.strokeStyle='#c2bda1';c.lineWidth=5;c.beginPath();c.moveTo(p.x-35,p.y-24);c.lineTo(p.x+25,p.y-13);c.stroke();c.restore();}
 if(n===39&&q.hand&&!q.hand.completed){const a=b.units.find(u=>u.id===q.hand.actor),d=b.units.find(u=>u.id==='a4-rescue-3');if(alive(a)&&alive(d)&&Math.abs(a.x-d.x)<180&&inView(app,{x:d.x,y:d.y-70})){c.save();c.strokeStyle='#bfae91';c.lineWidth=7;c.beginPath();c.moveTo(a.x-18,a.y-57);c.lineTo(d.x+18,d.y-55);c.stroke();c.restore();q.visualDrawn.hand=q.clock;}}
 if(n===40){const l=b.honroAct4PreviewDynamic?.find(l=>l.asset?.id==='a4:boat');if(l){this.landmark(c,{...l,x:q.returnEscort?.boatX??2920,y:2010});for(const [i,u]of residents(b).slice(0,2).entries())if(u.honroAct4OnBoat)this.unit(c,{...u,honroAct4OnBoat:false,x:(q.returnEscort?.boatX??2920)-70+i*110,y:1960},false);}if(closed(q,'thirteen')){const p={x:5840,y:1610};c.save();c.strokeStyle='#405b6a';c.lineWidth=12;c.beginPath();c.moveTo(p.x,p.y-120);c.lineTo(p.x-25,p.y-62);c.lineTo(p.x+12,p.y-25);c.stroke();c.restore();}}
 return out;};
P.coast={fact,water,tide,complete,fail,space};
})(globalThis);
