(function(G){'use strict';
// Per-stage event coordinates; authored stages may relocate them (design.act4.coords). Defaults = original layout.
const K=(b,k,d)=>{const v=b?.honroAct4Design?.coords?.[k];return Number.isFinite(v)?v:d;};
const P=G.HonroAct4TerrainPreview,A=P.eventAPI,{alive,party,memory,seed,event,inView,play}=A,C=G.HONRO_CORE;
if(P.attachCoast)return;
const airborne=u=>u.side===1&&u.fixed&&['airborne','spirit'].includes(u.honroAct4WaterTrait);
const active=b=>(b?.honroCustom||b?.honroAct4Official===1)&&b.honroAct4Preview>=31&&b.honroAct4Preview<=40,copy=x=>JSON.parse(JSON.stringify(x));
const near=(u,p,r=160)=>alive(u)&&Math.hypot(u.x-p.x,u.y-p.y)<r;
// Authored cave proximity includes height; an invalid explicit box must not
// silently activate the event at the legacy location. Missing config is legacy.
function wrongExitNear(u,w){const z=w.triggerBounds;if(z===undefined)return u.x>1800&&u.x<2900;return !!z&&[z.x1,z.x2,z.y1,z.y2].every(Number.isFinite)&&z.x1<z.x2&&z.y1<z.y2&&u.x>=z.x1&&u.x<=z.x2&&u.y>=z.y1&&u.y<=z.y2;}
const foes=b=>b.units.filter(u=>u.side===1&&alive(u));
// damageSequence is the persistent damage RNG cursor, not a pending impact.
// The engine returns to aim only after resolving its action and volley.
const stable=b=>!b.projectiles.length&&!b.volley&&b.phase==='aim';
const quiet=b=>!foes(b).length&&stable(b)&&P.quietReady(b);
const seen=(q,k)=>q.observed?.[k]!==undefined;
const closed=(q,k)=>!!q.events[k]?.terminal;
const cast=app=>app.engine.active;
const working=(e,u,point,r)=>alive(u)&&u.side===0&&e.b.side===0&&e.b.phase==='aim'&&e.active===u&&!u.acted&&e.grounded(u)&&near(u,point,r);
function cancelWork(q,key,u,observation){if(u)delete u.honroScenePose;q[key]=null;if(q.observed)delete q.observed[observation];}
const residents=b=>b.units.filter(u=>u.honroAct4Resident);
function unobscured(app,p){const s=app.scene,cv=s.canvas,r=cv.getBoundingClientRect(),x=r.left+cv.clientWidth/2+(p.x-s.x)*s.scale,y=r.top+cv.clientHeight/2+(p.y-s.y)*s.scale,box={left:x-22*s.scale,right:x+22*s.scale,top:y-90*s.scale,bottom:y+4*s.scale};if(box.left<r.left+3||box.right>r.right-3||box.top<r.top+5||box.bottom>r.bottom-5)return false;return ['.battle-info','.battle-head>button','#minimap-dock'].every(selector=>{const n=app.root.querySelector(selector),a=n?.getBoundingClientRect();return !a||!a.width||!a.height||box.right<a.left||box.left>a.right||box.bottom<a.top||box.top>a.bottom;});}
function goal(app,id){const text=G.HONRO_ACT4_PREVIEW_SEEDS.ui.find(v=>v[0]===id)?.[1];if(!text)return;app.stage.goal=text;const n=G.document.getElementById('objective-text');if(n)n.textContent=G.HonroAct4Content?.active(app.engine?.b)?G.HonroObjectives.state(app.engine.b,app.stage).currentInstruction:text;}
function hasFact(b,id){return b.honroAct4FactEvents?.some(v=>v.eventId===id)||P.campaignProof?.runId===b.honroAct4ReviewRunId&&!!P.campaignProof.factEvents?.[id];}
function fact(b,id,proof){if(hasFact(b,id))return;const row={eventId:id,stage:b.honroAct4Preview,sourceRun:b.session,campaignRunId:b.honroAct4ReviewRunId,officialAct4:b.honroAct4Official===1,proof:copy(proof)};(b.honroAct4FactEvents??=[]).push(row);if(P.campaignProof?.runId===b.honroAct4ReviewRunId)(P.campaignProof.factEvents??={})[id]=copy(row);}
const companion=u=>!!u&&['archer','mage','knight','occultist'].includes(u.id)&&u.id===u.cls&&C.equipmentActor(u);
function flaskPair(e){const b=e.b,mage=party(b).find(u=>u.cls==='mage'&&companion(u));if(!alive(mage)||mage.x<K(b,'flaskX1',6100)||mage.x>K(b,'flaskX2',6620)||mage.y>K(b,'flaskYMax',1e9)||!e.grounded(mage)||!quiet(b)||hasFact(b,'eq_da_t3b'))return null;const giver=party(b).find(u=>u!==mage&&companion(u)&&e.grounded(u)&&near(u,mage,150));return giver?{mage,giver}:null;}
function complete(app,proof){const b=app.engine.b,q=memory(b);if(q.complete||q.failure)return;q.complete=true;q.completionProof=copy(proof);b.phase='won';if(b.honroAct4Preview===40)fact(b,'eq_so_t3b',proof);P.save?.();}
function fail(b,reason){const q=memory(b);if(q.complete||q.failure)return;q.failure=reason;b.phase='lost';}
function space(b,u,p,range=220,accept=null,step=32){return G.HonroTerrain.place(b,u,{x:p.x,y:p.y,maxDistance:range,clearance:15,accept,step});}
function feet(e,u,p){Object.assign(u,{x:p.x,y:p.y,vx:0,vy:0});delete u.moveTarget;delete u.aiMove;return e.grounded(u);}
function spend(e,u){u.moveLeft=0;u.acted=true;delete u.moveTarget;delete u.aiMove;u.vx=u.vy=0;}
// Artillery can compress two rescue residents before escort starts. Permit only
// an ordinary supported step that monotonically separates that existing pair;
// never create overlap or relax terrain/other-actor occupancy checks.
function separatingRescueStep(e,u,before){if(e.b.honroAct4Preview!==39||!u.honroAct4Resident||!e.grounded(u))return false;
 const overlap=(v,x,y)=>Math.abs(v.x-x)<v.r+u.r+12&&y>v.y-v.h-12&&y-u.h<v.y+12;
 return e.b.units.every(v=>v===u||v.dead||v.honroObjectiveTarget||v.hp<=0||!overlap(v,u.x,u.y)||(v.honroAct4Resident&&overlap(v,before.x,before.y)&&Math.abs(v.x-u.x)>Math.abs(v.x-before.x)+1e-6));
}
function moveNpc(e,u,dx,dt,budget){if(!alive(u))return;u.fixed=false;u.maxMove=u.maxMove||240;u.moveLeft=Math.min(budget,180);const before={x:u.x,y:u.y};const ok=e.walk(u,Math.sign(dx-u.x),Math.min(dt,Math.abs(dx-u.x)/180),!u.jumping);u.vx=0;if(ok&&!G.HonroTerrain.separated(e.b,u,u.x,u.y,12)&&!separatingRescueStep(e,u,before)){u.x=before.x;u.y=before.y;u.moving=0;return 0;}return ok?Math.abs(u.x-before.x):0;}
function tide(b){const q=memory(b),cfg=b.honroAct4Design.tide;if(!cfg)return;const t=q.tide??={phase:'low',surface:cfg.low,warningRound:cfg.warningRound,highRound:cfg.highRound,lowRound:cfg.lowRound};
 if(b.round>=cfg.warningRound&&!t.warned&&b.side===0&&b.phase==='aim'){t.phase='rising';t.surface=cfg.low-18;t.warned=true;t.warningAtRound=b.round;t.highRound=b.round+(party(b).some(u=>u.acted)?4:3);t.lowRound=t.highRound+2;t.opportunities={};}
 if(t.warned&&b.side===0&&b.phase==='aim'&&b.round<t.highRound)t.opportunities[b.round]=party(b).map(u=>u.id);
 const hud=G.document.getElementById('act4-water-hud');if(hud)hud.textContent=t.phase==='rising'?'≈ ↑ '+Math.max(0,t.highRound-b.round):t.phase==='high'?'≈ ━':'≈ ↓';
 if(t.warned&&b.round>=t.highRound&&b.round<t.lowRound){t.phase='high';t.surface=cfg.high;}
 if(b.round>=t.lowRound){t.phase='low';t.surface=cfg.low;t.finished=true;}
 syncWater(b);
}
function syncWater(b){const q=memory(b),level=q.tide?.surface;if(!Number.isFinite(level)||q.waterVisualLevel===level)return;
 const floorIds=b.honroAct4Design.tide?.floorTerrainIds,eligible=t=>!t.oneWay&&!t.honroElementCollision&&!t.honroCeiling;
 if(floorIds!==undefined&&(!Array.isArray(floorIds)||!floorIds.length||floorIds.length>64||new Set(floorIds).size!==floorIds.length||floorIds.some(id=>typeof id!=='string'||!b.terrain.some(t=>t.id===id&&eligible(t)))))throw Error('Invalid tide floorTerrainIds');
 q.waterVisualLevel=level;
 b.honroSurfaceZones=(b.honroSurfaceZones||[]).filter(z=>!String(z.id).startsWith('a4-live-'));
 const land=b.terrain.filter(t=>eligible(t)&&(!floorIds||floorIds.includes(t.id))),floor=x=>Math.min(...land.map(t=>C.terrainSurfaces(t,x).map(v=>v.y)).flat().filter(y=>y>=level-800));
 for(const z of b.honroAct4Design.waterPolicies.filter(z=>z.kind==='recover')){let run=[];const emit=()=>{if(run.length>1){const a=run[0],c=run.at(-1);b.honroSurfaceZones.push({id:'a4-live-'+z.id+'-'+a[0],kind:'water-pool',surface:[[a[0],level],[c[0],level]],bottom:run,points:[[a[0],level],[c[0],level],...run.slice().reverse()],attached:true});}run=[];};for(let x=z.x1;x<=z.x2+32;x+=32){const px=Math.min(z.x2,x),y=floor(px);if(Number.isFinite(y)&&y>level){run.push([px,y]);}else emit();}emit();}b.sceneVersion++;
}
function closeRecoveryAction(e,u,r){const b=e.b,token=b.round+':'+b.side;if(b.active!==u.id||b.side!==0||b.phase!=='aim'||b.projectiles.length||b.volley||r.closedToken===token)return;r.closedToken=token;e.finishAction(true);if(b.active===u.id&&u.acted&&b.phase==='aim')e.advanceAfterAction();}
function water(e,dt=0){const b=e.b;if(!active(b))return;const q=memory(b),policies=b.honroAct4Design?.waterPolicies||[];q.water??={dry:{},recoveries:[]};
 for(const u of b.units.filter(u=>alive(u)&&!u.honroAct4Sheltered&&!u.honroAct4OnBoat)){
  const zones=policies.filter(z=>u.x>z.x1&&u.x<z.x2),z=u.honroAct4Recovering?policies.find(z=>z.id===u.honroAct4Recovering.zone):zones.find(z=>u.y>(q.tide?.surface??z.surface)+35&&(z.kind!=='recover'||!q.tide||q.tide.phase==='high'));
  if(u.side===1&&(u.honroAct4WaterTrait==='spirit'||u.honroAct4Aquatic))continue;
  if(u.side===1&&z){u.honroAct4WaterRounds??={};if(u.honroAct4WaterRounds[z.id]!==b.round){u.honroAct4WaterRounds[z.id]=b.round;e.hurt(u,Math.ceil(u.maxHp*.25),'',false,undefined,undefined,'environment');if(alive(u)){spend(e,u);u.slowed={factor:.55,expires:b.round+1};}}continue;}
  // Low tide exposes walkable mud. It is not a new dry return bank: preserve
  // the last entry point that will still be safe at the declared high water.
  if(!z){if(e.grounded(u)&&!u.honroAct4Recovering&&policies.every(v=>u.y<v.surface-10))q.water.dry[u.id]={x:u.x,y:u.y};continue;}
  if(z.kind==='lethal'){e.hurt(u,u.maxHp*10,'',false,undefined,undefined,'environment');continue;}
  const last=q.water.dry[u.id]||{x:u.spawnX??260,y:u.spawnY??u.y},side=last.x<(z.x1+z.x2)/2?'Left':'Right',span=z['entry'+side];if(!span)continue;
  if(!u.honroAct4Recovering){u.honroAct4Recovering={zone:z.id,entry:copy(last),side,damage:Math.ceil(u.maxHp*.25),damaged:false,surface:q.tide?.surface??z.surface};spend(e,u);}
  const r=u.honroAct4Recovering;if((r.probeWait||0)>0){r.probeWait=Math.max(0,r.probeWait-dt);closeRecoveryAction(e,u,r);continue;}
  // The declared low bank is on the actual entry side. No high/opposite bank
  // candidates are accepted, even if they are geometrically nearer.
  const landing=space(b,u,{x:Math.max(span[0]+u.r,Math.min(span[1]-u.r,last.x)),y:last.y},Math.max(220,span[1]-span[0]+100),(x,y)=>x>=span[0]+u.r&&x<=span[1]-u.r&&y>=last.y-60&&y<r.surface-10&&b.terrain.some(t=>!t.oneWay&&!t.honroElementCollision&&C.terrainSurfaces(t,x).some(f=>Math.abs(f.y-y)<2)),2);
  if(!landing){u.vx=u.vy=0;u.honroAct4RecoverPending=true;r.probeWait=.1;closeRecoveryAction(e,u,r);continue;}
  if(!r.damaged){const shield=u.shield;u.shield=0;const hp=u.hp;e.hurt(u,r.damage,'',false,undefined,undefined,'environment');u.shield=shield;r.damaged=true;r.hpLoss=hp-u.hp;}
  if(alive(u))feet(e,u,landing);q.water.recoveries.push({unit:u.id,zone:z.id,side,entry:last,landing,hpLoss:r.hpLoss,round:b.round,shot:b.shot});delete u.honroAct4Recovering;delete u.honroAct4RecoverPending;closeRecoveryAction(e,u,r);
 }
}
function rescueSafe(e,u){const z=e.b.honroAct4Design.rescue.safeZone;return alive(u)&&u.x>=z.x1&&u.x<=z.x2&&u.y>=z.y1&&u.y<=z.y2&&e.grounded(u);}
function probeRoute(b){const npc=residents(b).filter(alive).sort((a,c)=>c.x-a.x)[0];if(!npc)return false;const world=copy(b);world.units=world.units.filter(u=>!u.honroAct4Resident||u.id===npc.id);const e=new C.Engine(world,()=>{});e.checkEnd=()=>false;const u=e.unit(npc.id);u.fixed=false;u.moveLeft=10000;const target=b.honroAct4Design.rescue.safeX.at(-1);for(let i=0;i<600&&u.x<target-15;i++){const x=u.x;e.walk(u,1,.05,true);if(u.x-x<.01||!G.HonroTerrain.separated(world,u,u.x,u.y,12))return false;}return u.x>=target-15;}
function escort(e,q,dt){const b=e.b,cfg=b.honroAct4Design.rescue;if(!cfg||!q.exitStable||!q.netOpen)return;
 const token=b.round+':'+b.shot+':'+b.side;for(const [i,id]of cfg.ids.entries()){const u=e.unit(id);if(!alive(u))continue;const m=q.escort??={};const rec=m[id]??={};if(rec.token!==token){rec.token=token;rec.remaining=170;}
  if(u.x>=cfg.safeX[i]-14&&u.x<=cfg.safeX[i]+40&&rescueSafe(e,u)){rec.safe=true;u.fixed=true;continue;}
  if(rec.remaining<=0||b.side!==0||b.phase!=='aim')continue;const moved=moveNpc(e,u,cfg.safeX[i],dt,rec.remaining)||0;rec.remaining-=moved;
 }
}
const routeCache=new WeakMap();function routeClear(b){const signature=JSON.stringify([b.sceneVersion,b.units.map(u=>[u.id,u.dead,u.hp>0,u.x,u.y,u.h,u.r,!!u.jumping,!!u.airborne,u.vy])]),old=routeCache.get(b);if(old?.signature===signature)return old.clear;const clear=probeRoute(b);routeCache.set(b,{signature,clear});return clear;}
const residueKeys=['fields','zones','delays','occultTraps','stakes','delayedAttacks','shoves','blades'];
P.quietReady=b=>![32,36,40].includes(b.honroAct4Preview)||(memory(b).quietAt!==undefined&&memory(b).clock-memory(b).quietAt>=2);
function settleQuietScene(b){if(![32,36,40].includes(b.honroAct4Preview)||foes(b).length||!stable(b))return;const q=memory(b),temporary=b.units.filter(u=>u.summoned||u.enthrall),dirty=residueKeys.some(k=>Array.isArray(b[k])&&b[k].length)||temporary.length;if(q.quietAt===undefined||dirty){q.quietAt=q.clock;q.quietCleanup??={actors:[],sources:[]};for(const k of residueKeys)if(Array.isArray(b[k])){if(b[k].length)q.quietCleanup.sources.push({kind:k,count:b[k].length});b[k]=[];}if(temporary.length){q.quietCleanup.actors.push(...temporary.map(u=>({id:u.id,kind:u.summoned?'summon':'enthralled',withdrawn:true})));b.units=b.units.filter(u=>!temporary.includes(u));}b.sceneVersion++;}}
function rescueVista(app,q,dt){const b=app.engine.b;if(!q.vista&&!q.vistaDone&&party(b).some(u=>u.x>2800&&u.x<3300)&&!foes(b).some(u=>u.x<4000))q.vista={active:true,index:0,elapsed:0};const v=q.vista;if(!v?.active)return false;const shots=[{x:5110,y:2510,key:'rescue-voices'},{x:6050,y:2450,key:'pursuit'},{x:3120,y:2870,key:'entry'}],shot=shots[v.index];if(!shot){v.active=false;q.vistaDone=true;Object.assign(app.scene,{manual:false,x:app.engine.active.x,y:app.engine.active.y-90,scale:G.innerWidth<600?.62:.86});return false;}Object.assign(app.scene,{manual:true,x:shot.x,y:shot.y,scale:G.innerWidth<600?.55:.65,storyTween:null,cinematic:null,storyFrame:null,goalFocus:null});const observed=shot.key==='rescue-voices'?seen(q,'rescue-voices'):shot.key==='pursuit'?(q.pursuitSeen||!foes(b).some(u=>u.honroAct4Pursuer)):true;if(observed){v.elapsed+=dt;if(v.elapsed>1.1){v.index++;v.elapsed=0;}}return true;}
P.coastObserve=function(app,dt){const b=app.engine.b,n=b.honroAct4Preview;if(!active(b))return;const q=memory(b),e=app.engine,cfg=b.honroAct4Design;
 if(!cfg)return;tide(b);settleQuietScene(b);
 if([38,39,40].includes(n)&&residents(b).some(u=>!alive(u)))fail(b,'rescue-casualty');
 if(!party(b).length)fail(b,'party-defeated');
 if((cfg.requiredHeroes||[]).some(cls=>!party(b).some(u=>u.cls===cls)))fail(b,'required-reunion-speaker-defeated');
 if(q.failure||q.complete||app.modal.classList.contains('open')||app.dialogue)return;
 if(n===31&&q.boat.phase==='boarded')fact(b,'eq_se_t3b',{boarded:true,party:party(b).map(u=>u.id)});
 if(n===31&&party(b).some(u=>u.x<105&&u.x>35&&e.grounded(u)))fact(b,'eq_co_12',{tag:'eq-co-31',reachedBy:party(b).find(u=>u.x<105)?.id});
 if(b.honroAct4Design.tide&&!G.document.getElementById('act4-water-hud')){const node=G.document.createElement('div');node.id='act4-water-hud';node.setAttribute('role','timer');node.style.cssText='position:absolute;top:92px;right:14px;font-size:23px;color:#c0d6dc;background:#17313bdb;padding:4px 10px;pointer-events:none';app.scene.canvas.parentElement.append(node);}else if(!b.honroAct4Design.tide)G.document.getElementById('act4-water-hud')?.remove();
 if(n===40&&!b.terrain.some(t=>t.id==='a4-return-boarding'))b.terrain.push({id:'a4-return-boarding',x:2820,y:1950,w:180,h:18,mat:'wood',oneWay:true,hp:9999,maxHp:9999,indestructible:true});
 if(n===40&&!b.terrain.some(t=>t.id==='a4-return-deck'))b.terrain.push({id:'a4-return-deck',x:2920,y:1950,w:360,h:20,mat:'wood',oneWay:true,hp:9999,maxHp:9999,indestructible:true,honroAct4MovingDeck:true});
 if(n===32){const npc=e.unit('a4-shelter-speaker');if(!alive(npc)){fail(b,'shelter-witness-defeated');return;}if(!quiet(b))return;
  if(npc.honroAct4Sheltered&&party(b).some(u=>Math.abs(u.x-K(b,'shelterX',4890))<650)){q.shelterDoor??={phase:'opening',time:0};goal(app,'A4.S32.REUNION_OBJECTIVE');}
  if(q.shelterDoor?.phase==='opening'){q.shelterDoor.time=Math.min(1,q.shelterDoor.time+dt);if(q.shelterDoor.time===1&&seen(q,'door-open')){q.shelterDoor.phase='open';npc.honroAct4Sheltered=false;npc.fixed=false;}}
  if(q.shelterDoor?.phase==='open'&&npc.x>K(b,'doorX',4780))moveNpc(e,npc,K(b,'doorX',4780)-10,dt,180);
  if(npc.x<=K(b,'doorX',4780)){npc.fixed=true;npc.facing=-1;npc.honroScenePose={kind:'point',time:1};q.thresholdAt??=q.clock;}
  if(q.thresholdAt!==undefined&&q.clock-q.thresholdAt>.8&&seen(q,'threshold')&&party(b).some(u=>u.cls==='archer'&&Math.abs(u.x-npc.x)<340)){const hero=party(b).find(u=>u.cls==='archer');if(!q.reunionObserved&&q.clock-(q.reunionCameraAt??-10)>2){q.reunionCameraAt=q.clock;app.scene.storyFocusPoint((hero.x+npc.x)/2,npc.y-100,400,G.innerWidth<600?.65:.8);}if(q.reunionObserved)play(app,'reunion');}
  if(closed(q,'reunion')&&cfg.shelter?.manifest.length===7&&seen(q,'threshold')){play(app,'missing_four');if(closed(q,'missing_four')&&q.events.missing_four.presented.includes('A4.S32.MISSING.01')&&q.reunionObserved)q.safeSeven={ids:copy(cfg.shelter.manifest),sourceRun:b.session,reportIds:copy(q.events.missing_four.presented),reunionIds:copy(q.events.reunion.presented),reunionObserved:copy(q.reunionObserved),campaignRunId:b.honroAct4ReviewRunId};}
 }
 if(n===33||n===39){if(q.tide?.phase==='rising'&&seen(q,'water-rising')&&seen(q,'upper-route')&&b.side===0&&party(b).some(u=>!u.acted&&u.moveLeft>80))play(app,'tide_warning',true);}
 if(n===34){const w=cfg.wrongExit,u=e.unit(w.actor);if(alive(u)&&!q.dislocation&&party(b).some(v=>wrongExitNear(v,w))&&inView(app,w.entrance)){q.dislocation={phase:'entering',at:q.clock,originalFixed:u.fixed};}
  const t=q.dislocation;if(t&&alive(u)){if(t.phase==='entering'){u.fixed=false;moveNpc(e,u,w.entrance.x,dt,180);if(Math.abs(u.x-w.entrance.x)<25){u.fixed=true;t.phase='inside';t.at=q.clock;}}
   if(t.phase==='inside'&&seen(q,'wrong-entry')&&q.clock-t.at>.8){const p=space(b,u,w.exit,180);if(p){feet(e,u,p);t.phase='emerged';t.at=q.clock;}}
   if(t.phase==='emerged'&&seen(q,'wrong-exit')){u.fixed=t.originalFixed;t.phase='complete';play(app,'wrong_exit');}
  }
 }
 if(n===35){const d=q.flaskDelivery;if(d&&d.phase!=='complete'){const mage=e.unit(d.receiver),giver=e.unit(d.giver);if(!working(e,mage,giver,150)||!alive(giver)||!e.grounded(giver)||!quiet(b)){delete mage?.honroScenePose;delete giver?.honroScenePose;q.flaskDelivery=null;}else{mage.facing=giver.x>mage.x?1:-1;giver.facing=-mage.facing;mage.honroScenePose=giver.honroScenePose={kind:'point',time:1};d.elapsed+=dt;if(d.elapsed>=1.4&&d.received){d.phase='complete';fact(b,'eq_da_t3b',{itemId:'itm_da_06',giver:giver.id,receiver:mage.id,receivedAt:d.received.at,positions:d.received.positions,kind:'companion-handoff'});delete mage.honroScenePose;delete giver.honroScenePose;P.save?.();}}}
  if(party(b).some(u=>u.x>K(b,'clearingX1',5520)&&u.x<K(b,'clearingX2',5720)&&u.y<K(b,'clearingYMax',1e9)&&e.grounded(u))&&!foes(b).some(u=>u.x>K(b,'clearingFoeX',5000)&&u.y<K(b,'clearingFoeYMax',1e9)))fact(b,'eq_co_t3_choice',{tag:'rooted-third-clearing',reached:true});}
 if(n===37){if(seen(q,'signal')&&seen(q,'gesture'))play(app,'signal');}
 if(n===38){const c=cfg.connection,pursuers=foes(b).filter(u=>u.honroAct4Pursuer),tour=rescueVista(app,q,dt);
  if(seen(q,'rescue-voices')&&!q.connected){for(const [i,u]of pursuers.entries()){if(u.x>5610+i*170)moveNpc(e,u,5610+i*170,dt,180);}if(!tour&&(!pursuers.length||q.pursuitSeen))play(app,'voice');}

  if(q.connectionProbe?.phase==='entry'&&seen(q,'probe-entry')&&q.clock-q.connectionProbe.at>.6){q.connectionProbe={phase:'wrong-exit',at:q.clock};}
  if(q.connectionProbe?.phase==='wrong-exit'&&seen(q,'probe-wrong'))q.connectionProbe.phase='observed';
  if(q.anchorAction&&!q.connected){const mage=e.unit(q.anchorAction.actor);if(!working(e,mage,c.entry,250)){cancelWork(q,'anchorAction',mage,'anchor-action');return;}mage.honroScenePose={kind:'point',time:1};mage.facing=1;q.anchorAction.elapsed+=dt;if(q.anchorAction.elapsed>1&&seen(q,'anchor-action')){const p=space(b,mage,c.destination,220);if(p){q.connected={destination:p,sourceRun:b.session,stageOnly:true,mpSpent:0};delete mage.honroScenePose;q.anchorAction=null;goal(app,'A4.S38.CONNECT_OBJECTIVE');play(app,'connected');}}}
 }
 if(n===39){const r=cfg.rescue,boss=e.unit('a4-wreck');if(alive(boss)&&seen(q,'wreck'))play(app,'boss');
  if(alive(boss)&&party(b).some(u=>u.x>K(b,'bossWakeX',1100))){boss.awake=true;boss.aggroUntil=Math.max(boss.aggroUntil,b.round+1);if(!q.artillery?.next){const count=q.artillery?.count||0,targets=count%2?residents(b).filter(alive):party(b).sort((a,c)=>Math.abs(c.x-boss.x)-Math.abs(a.x-boss.x));const t=targets[0]||party(b)[0];if(t){q.artillery??={count:0,history:[]};q.artillery.next={x:t.x,y:t.y-t.h*.5,target:t.id,dueRound:b.round+1,warningSeen:false};}}}

  if(q.stabilizing){const actor=e.unit(q.stabilizing.actor);if(!working(e,actor,r.anchor,actor?.cls==='mage'?360:180)){cancelWork(q,'stabilizing',actor,'stabilizing');}else{actor.honroScenePose={kind:'point',time:1};q.stabilizing.elapsed+=dt;if(q.stabilizing.elapsed>1&&seen(q,'stabilizing')){q.exitStable={sourceRun:b.session,actor:actor.id,once:true};delete actor.honroScenePose;q.stabilizing=null;if(actor.cls==='mage')play(app,'stabilize');}}}
  if(q.releasing){const actor=e.unit(q.releasing.actor);if(!working(e,actor,r.net,actor?.cls==='occultist'?340:180)){cancelWork(q,'releasing',actor,'net-action');}else{actor.honroScenePose={kind:'point',time:1};q.releasing.elapsed+=dt;if(q.releasing.elapsed>1&&seen(q,'net-action')){q.netOpen={sourceRun:b.session,actor:actor.id};delete actor.honroScenePose;q.releasing=null;b.sceneVersion++;if(actor.cls==='occultist')q.releasePending={actor:actor.id};}}}
  escort(e,q,dt);if(q.releasePending&&residents(b).some(u=>u.x>cfg.rescue.net.x+60&&e.grounded(u))&&q.clock-(q.pathProbeAt??-10)>.5){q.pathProbeAt=q.clock;q.livePathClear=routeClear(b);if(q.livePathClear){q.npcRouteObserved=true;play(app,'souls_freed');}}const dosik=e.unit('a4-rescue-3'),seolo=party(b).find(u=>u.cls==='archer');
  if(q.exitStable&&q.netOpen&&dosik.x>K(b,'handX1',6570)&&dosik.x<K(b,'handX2',6740)&&near(seolo,{x:dosik.x+70,y:dosik.y},160)){q.hand??={at:q.clock,actor:seolo.id};seolo.honroScenePose={kind:'point',time:1};if(seen(q,'hand')){play(app,'hand',true);q.hand.completed=true;}}
  if(r.ids.every(id=>q.escort?.[id]?.safe&&rescueSafe(e,e.unit(id)))){q.rescued={ids:copy(r.ids),sourceRun:b.session,campaignRunId:b.honroAct4ReviewRunId};goal(app,'A4.S39.ESCAPE_OBJECTIVE');}
 }
 if(n===40){const cfg=b.honroAct4Design.escort;if(!quiet(b))return;
  if(!q.returnEscort&&party(b).some(u=>u.x>2600)&&seen(q,'return-boat')&&seen(q,'return-high')){q.returnEscort={phase:'boarding',clock:0,boatX:cfg.boat.x};play(app,'boarding');}
  const r=q.returnEscort;if(r){const deck=b.terrain.find(t=>t.id==='a4-return-deck');if(deck)deck.x=r.boatX-180;}if(r&&closed(q,'boarding')){r.clock+=dt;const np=residents(b);if(r.phase==='boarding'){for(const [i,u]of np.slice(0,2).entries()){moveNpc(e,u,3030+i*110,dt,220);}for(const u of np.slice(2)){if(u.x>2710&&u.x<2810&&e.grounded(u)&&!u.jumping){u.moveLeft=600;e.jump(u);}moveNpc(e,u,3100,dt,220);}if(np.slice(0,2).every((u,i)=>u.x>3010+i*110&&Math.abs(u.y-1950)<5)){r.passengers={};for(const u of np.slice(0,2)){u.honroAct4OnBoat=true;r.passengers[u.id]=u.x-r.boatX;}r.phase='sailing';}}
   if(r.phase==='sailing'){r.boatX=Math.min(cfg.boat.destination,r.boatX+dt*180);for(const [i,u]of np.slice(0,2).entries()){u.x=r.boatX+r.passengers[u.id];u.y=1950;u.fixed=true;}for(const u of np.slice(2))moveNpc(e,u,5500,dt,240);if(r.boatX===cfg.boat.destination){r.phase='landed';for(const u of np.slice(0,2)){u.honroAct4OnBoat=false;u.fixed=false;}if(!b.terrain.some(t=>t.id==='a4-return-gangway')){b.terrain.push(G.HonroGeometry.terrain({id:'a4-return-gangway',type:'platform',baseMaterial:'wood',oneWay:true,breakable:false,control:[{x:4820,y:1950},{x:4980,y:1916}],thickness:18,detail:{interpolation:'linear',roughness:0,spacing:30,optimizeEpsilon:0}},b.height));b.sceneVersion++;}}}
   if(r.phase==='landed'){for(const [i,u]of np.slice(2).entries())if(u.x<5670+i*85)moveNpc(e,u,5670+i*85,dt,220);r.highGroupClear=np.slice(2).every(u=>u.x>5260);for(const [i,u]of np.slice(0,2).entries()){const x=r.highGroupClear?5500+i*85:4780+i*85;if(u.x<x)moveNpc(e,u,x,dt,220);}if(np.every(u=>u.x>5430&&u.x<5900&&e.grounded(u))){r.phase='safe';q.rescued={ids:np.map(u=>u.id),sourceRun:b.session};}}
   if(r.phase==='safe'&&seen(q,'safe-return'))play(app,'reunion');
   if(closed(q,'reunion')&&P.proofValid?.(b)){q.roster={total:13,living:11,priorDeaths:2};play(app,'thirteen');if(closed(q,'thirteen'))goal(app,'A4.S40.ROSTER');}
   if(closed(q,'thirteen')&&seen(q,'return-ridge')&&seen(q,'small-dislocation'))play(app,'next');
  }
 }
};
const interact=P.interact;P.interact=function(app=G.HonroApp,probe=false){if(interact(app,probe))return true;const e=app.engine,b=e?.b;if(!active(b)||app.dialogue||b.phase!=='aim')return false;const q=memory(b),n=b.honroAct4Preview,u=e.active,cfg=b.honroAct4Design;if(!alive(u)||!e.grounded(u))return false;
 if(n===32&&quiet(b)&&closed(q,'missing_four')&&!q.safeSeven&&near(u,{x:e.unit('a4-shelter-speaker').x,y:K(b,'speakerY',2010)},340)){if(probe)return true;const report=event(q,'missing_four');report.started=false;report.terminal=false;return play(app,'missing_four');}
 if(n===35&&!q.flaskDelivery){const pair=flaskPair(e);if(pair&&u===pair.mage){if(probe)return true;q.flaskDelivery={phase:'passing',giver:pair.giver.id,receiver:pair.mage.id,elapsed:0};return true;}}
 if(n===38&&near(u,cfg.connection.entry,250)){
  if(!q.connectionProbe){if(probe)return true;q.connectionProbe={phase:'entry',at:q.clock};return true;}
  if(!q.connected&&q.connectionProbe.phase==='observed'&&u.cls==='mage'){if(probe)return true;q.anchorAction={actor:u.id,elapsed:0};play(app,'anchor');return true;}
  if(q.connected){const p=space(b,u,q.connected.destination,240);if(!p)return false;if(probe)return true;feet(e,u,p);return true;}
 }
 if(n===39){if(near(u,cfg.rescue.anchor,u.cls==='mage'?360:180)&&!q.exitStable&&!q.stabilizing){if(probe)return true;q.stabilizing={actor:u.id,elapsed:0};return true;}if(near(u,cfg.rescue.net,u.cls==='occultist'?340:180)&&!q.netOpen&&!q.releasing){if(probe)return true;q.releasing={actor:u.id,elapsed:0};return true;}
  if(q.exitStable&&q.rescued?.ids.length===4&&cfg.rescue.ids.every(id=>rescueSafe(e,e.unit(id)))&&party(b).every(v=>v.x>cfg.rescue.exit-260&&e.grounded(v))){if(probe)return true;complete(app,{exitStable:q.exitStable,rescued:q.rescued,bossAlive:alive(e.unit('a4-wreck'))});return true;}
 }
 if(n===32&&quiet(b)&&closed(q,'missing_four')&&q.safeSeven&&party(b).every(v=>v.x>cfg.exit.x-300)){if(probe)return true;complete(app,{safeSeven:q.safeSeven});return true;}
 if([33,34,37,38].includes(n)&&party(b).every(v=>v.x>cfg.exit.x-300&&Math.abs(v.y-cfg.exit.y)<=240&&e.grounded(v))&&(![37].includes(n)||closed(q,'signal'))){if(probe)return true;complete(app,{exit:cfg.exit,connection:q.connected||{physicalRoute:true},signal:q.events.signal?.presented});return true;}
 if(n===40&&q.returnEscort?.phase==='safe'&&closed(q,'next')&&party(b).every(v=>v.x>5300)){if(probe)return true;complete(app,{roster:q.roster,rescued:q.rescued});return true;}
 return false;};
const attached=new WeakSet();P.attachCoast=function(app){const e=app.engine,b=e.b,n=b.honroAct4Preview;if(!active(b)||attached.has(e))return;attached.add(e);
 // Every observer is scoped to the captured battle; changing chapter ends its
 // loop. Core Engine remains the sole physics, hit and locomotion provider.
 for(const name of ['move','jump','fire']){const original=e[name].bind(e);e[name]=function(...args){if((name==='jump'?args[0]:e.active)?.honroAct4Recovering)return false;return original(...args);};}
 const reserved=u=>u.side===1&&!airborne(u)&&!u.honroAct4Aquatic;
 const forbidden=(u,x,y)=>(b.honroAct4Design.enemyExclusion||[]).some(z=>x+u.r>z.x1&&x-u.r<z.x2&&y>z.y1&&y-u.h<z.y2);
 const walk=e.walk.bind(e);e.walk=function(u,d,dt,...args){if(reserved(u)&&forbidden(u,u.x+Math.sign(d)*u.walkSpeed*dt,u.y))return false;return walk(u,d,dt,...args);};
 const integrate=e.integrateBody.bind(e);e.integrateBody=function(u,dt,...args){if(u.honroAct4RecoverPending){u.vx=u.vy=0;return;}const before={x:u.x,y:u.y};const out=integrate(u,dt,...args);if(reserved(u)&&forbidden(u,u.x,u.y)&&!forbidden(u,before.x,before.y)){u.x=before.x;u.y=before.y;u.vx=u.vy=0;delete u.aiMove;delete u.moveTarget;}return out;};
 const tick=e.tick.bind(e);e.tick=function(dt){if(memory(b).vista?.active)return;const out=tick(dt);if(!app.dialogue){tide(b);water(e,dt);}return out;};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const was=alive(u),out=hurt(u,...args);if(was&&!alive(u)&&u.honroAct4WreckBoss&&memory(b).artillery)memory(b).artillery.next=null;if(was&&!alive(u)&&n===32&&u.cls==='archer'&&u.side===0)fail(b,'required-reunion-speaker-defeated');if(was&&!alive(u)&&u.honroAct4RewardTag==='eq-hw-36')fact(b,'eq_hw_t3b',{target:u.id,elite:!!u.elite});if([38,39,40].includes(n)&&u.honroAct4Resident&&!alive(u))fail(b,'rescue-casualty');return out;};
 if(n===39){const enemyAction=e.enemyAction.bind(e);e.enemyAction=function(){const u=e.active;if(!u?.honroAct4WreckBoss)return enemyAction();if(!alive(u)){if(memory(b).artillery)memory(b).artillery.next=null;e.finishAction();return;}const a=memory(b).artillery,t=a?.next;if(!t||!t.warningSeen||b.round<t.dueRound){e.finishAction();return;}u.facing=t.x>u.x?1:-1;const before=new Set(b.projectiles.map(p=>p.id));if(e.fire('HWD01',u.facing>0?55:125,.8,true)){for(const p of b.projectiles.filter(p=>!before.has(p.id))){const seconds=Math.max(1.8,Math.min(3.2,Math.abs(t.x-p.x)/900)),acc=e.acceleration({...p,wind:0,gravityScale:1,drag:0,vx:0,vy:0});Object.assign(p,{vx:(t.x-p.x)/seconds,vy:(t.y-p.y-.5*acc.y*seconds*seconds)/seconds,gravityScale:1,wind:0,drag:0,blast:75,honroAct4Artillery:true});p.prevVy=p.vy;}a.history.push({...t,shot:b.shot});a.count++;a.next=null;}else e.finishAction();};}
 const allows=e.attackAllows.bind(e);e.attackAllows=function(u,...args){if(u?.honroAct4Sheltered)return false;return allows(u,...args);};
 if(n===40&&!b.terrain.some(t=>t.id==='a4-return-boarding'))b.terrain.push({id:'a4-return-boarding',x:2820,y:1950,w:180,h:18,mat:'wood',oneWay:true,hp:9999,maxHp:9999,indestructible:true});
 if(n===40&&!b.terrain.some(t=>t.id==='a4-return-deck'))b.terrain.push({id:'a4-return-deck',x:2920,y:1950,w:360,h:20,mat:'wood',oneWay:true,hp:9999,maxHp:9999,indestructible:true,honroAct4MovingDeck:true});
 if(n===32){const npc=e.unit('a4-shelter-speaker');npc.name='고향 사람';}
 for(const u of residents(b))if(u.id==='a4-rescue-3')u.name='도식';
};
const launch=P.launch;P.launch=function(n){const r=launch(n);P.attachCoast(G.HonroApp);return r;};

// Visibility receipts are written only by the actual Scene pass. Their points
// refer to finite authored actors/geometry rather than an off-screen timer.
const render=G.HonroScene.prototype.render;G.HonroScene.prototype.render=function(e,...args){const out=render.call(this,e,...args),b=e.b;if(!active(b))return out;const app=G.HonroApp;if(app.scene!==this||G.document.hidden||app.modal.classList.contains('open'))return out;const q=memory(b),n=b.honroAct4Preview,cfg=b.honroAct4Design;if(!cfg)return out;q.observed??={};const mark=(key,p,guard=true)=>{if(guard&&inView(app,p))q.observed[key]??=q.clock;};
 if(n===32){mark('door-open',{x:K(b,'doorMarkX',4890),y:K(b,'doorMarkY',1850)},q.shelterDoor?.time===1);const npc=e.unit('a4-shelter-speaker');mark('threshold',{x:npc.x,y:npc.y-65},!npc.honroAct4Sheltered&&npc.x<=K(b,'doorX',4780));const hero=party(b).find(u=>u.cls==='archer');if(alive(hero)&&!app.dialogue&&npc.x<=K(b,'doorX',4780)&&!npc.honroAct4Sheltered&&Math.abs(hero.x-npc.x)<340&&unobscured(app,npc)&&unobscured(app,hero))q.reunionObserved??={sourceRun:b.session,npc:npc.id,hero:hero.id,seenAt:q.clock,positions:[{id:hero.id,x:hero.x,y:hero.y},{id:npc.id,x:npc.x,y:npc.y}]};}
 if(n===33||n===39){mark('water-rising',{x:K(b,'waterMarkX',n===33?1800:3200),y:q.tide?.surface??2500},q.tide?.phase==='rising');mark('upper-route',{x:K(b,'upperMarkX',n===33?2200:3300),y:K(b,'upperMarkY',n===33?1940:1820)});}
 if(n===34){const u=e.unit(cfg.wrongExit.actor);mark('wrong-entry',{x:u.x,y:u.y-40},alive(u)&&q.dislocation?.phase==='inside');mark('wrong-exit',{x:u.x,y:u.y-40},alive(u)&&q.dislocation?.phase==='emerged');}
 if(n===37){const visible=!app.dialogue&&unobscured(app,cfg.signal)&&party(b).some(v=>v.x>K(b,'signalViewX',5900))&&q.visualDrawn?.gesture===q.clock;q.signalExposure=visible?(q.signalExposure||0)+Math.min(.1,args[0]||0):0;if(q.signalExposure>=.6){q.observed.signal??=q.clock;q.observed.gesture??=q.clock;}}
 if(n===38){for(const u of b.units.filter(u=>u.honroAct4Pursuer&&alive(u)&&u.x>5230&&u.x<6300&&(u.moving||0)>.01))if(inView(app,{x:u.x,y:u.y-50}))q.pursuitSeen=true;mark('rescue-voices',{x:5230,y:2535},residents(b).every(alive)&&party(b).some(v=>v.x<3300));mark('probe-entry',{x:3180,y:2970},q.connectionProbe?.phase==='entry'&&q.visualDrawn?.probe===q.clock);mark('probe-wrong',{x:3000,y:2920},q.connectionProbe?.phase==='wrong-exit'&&q.visualDrawn?.probe===q.clock);mark('anchor-action',cfg.connection.entry,!!q.anchorAction);}
 if(n===39){mark('wreck',{x:K(b,'wreckMarkX',3500),y:K(b,'wreckMarkY',2400)},alive(e.unit('a4-wreck')));mark('stabilizing',cfg.rescue.anchor,!!q.stabilizing);mark('net-action',cfg.rescue.net,!!q.releasing);mark('hand',{x:e.unit('a4-rescue-3').x,y:e.unit('a4-rescue-3').y-70},!!q.hand&&q.visualDrawn?.hand===q.clock);}
 if(n===40){mark('return-boat',{x:cfg.escort.boat.x,y:1940});mark('return-high',{x:3100,y:1720});mark('safe-return',{x:5630,y:1650},q.returnEscort?.phase==='safe');mark('return-ridge',{x:5900,y:1300});mark('small-dislocation',{x:5840,y:1610},closed(q,'thirteen'));}
 return out;};
const landmark=G.HonroScene.prototype.landmark;G.HonroScene.prototype.landmark=function(c,l){const b=this.battle;if(!active(b))return landmark.call(this,c,l);const q=memory(b);if(b.honroAct4Preview===32&&l.asset?.id==='a4:door'){const t=q.shelterDoor?.time||0;c.save();const hinge=l.x-80*(l.scale??1);c.translate(hinge,l.y);c.scale(Math.max(.09,Math.cos(t*Math.PI*.48)),1);const out=landmark.call(this,c,{...l,x:l.x-hinge,y:0});c.restore();return out;}if(b.honroAct4Preview===39&&q.netOpen&&l.asset?.id==='a4-coast:net')return;return landmark.call(this,c,l);};
// Return-inlet water is visual-only. The recovery policy is not a material,
// so it must not be inserted into conductive/contact zones or battle saves.
const returnWaterViews=new WeakMap();
function returnWaterZones(b){
 const opt=b.honroMap?.vectorReturnWater;if(b.honroAct4Preview!==40||opt?.version!==1)return [];
 const policy=b.honroAct4Design?.waterPolicies?.find(v=>v.id===opt.policyId&&v.kind==='recover');
 const terrain=(G.HonroTerrainDomain?.render(b)||b.terrain||[]).find(t=>t.id===opt.terrainId&&!t.oneWay&&!t.broken&&!t.honroElementCollision&&!t.honroCeiling);
 if(!policy||!terrain||![policy.x1,policy.x2,policy.surface].every(Number.isFinite)||policy.x2<=policy.x1)return [];
 const key=[b.sceneVersion,policy.x1,policy.x2,policy.surface].join(':'),prior=returnWaterViews.get(b);if(prior?.terrain===terrain&&prior.key===key)return prior.zones;
 const ps=C.poly(terrain),level=policy.surface,zones=[];let run=[];
 const emit=()=>{if(run.length>1&&run.at(-1)[0]>run[0][0]){const left=run[0][0],right=run.at(-1)[0];zones.push({id:'visual-'+policy.id+'-'+zones.length,kind:'water-pool',surface:[[left,level],[right,level]],bottom:run,points:[[left,level],[right,level],...run.slice().reverse()],honroCarvedBasin:true});}run=[];};
 for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x<=a.x)continue;let left=Math.max(policy.x1,a.x),right=Math.min(policy.x2,z.x);if(right<=left)continue;
  const y=x=>a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);let ly=y(left),ry=y(right);if(ly<=level&&ry<=level){emit();continue;}
  if(ly<level){left=a.x+(level-a.y)*(z.x-a.x)/(z.y-a.y);ly=level;}if(ry<level){right=a.x+(level-a.y)*(z.x-a.x)/(z.y-a.y);ry=level;}
  if(run.length&&Math.abs(run.at(-1)[0]-left)>1e-6)emit();if(!run.length)run.push([left,ly]);run.push([right,ry]);if(ry===level)emit();
 }emit();returnWaterViews.set(b,{terrain,key,zones});return zones;
}
function paintReturnWater(scene,c,b){const zones=returnWaterZones(b);if(!zones.length)return;const art=G.HonroEnvironmentArt,env=G.HonroEnvironmentRenderer.ensureBattle(b),atmosphere=G.HonroEnvironment.atmosphereAt({backdrop:b.honroBackdrop,environment:env},scene.y);
 c.save();c.globalAlpha*=.86;for(const zone of zones)art.pool(c,zone,atmosphere,art.time(scene),{style:"coastal-dawn"});c.restore();
}
const live=G.HonroScene.prototype.liveWater;G.HonroScene.prototype.liveWater=function(c,b){const out=live?.call(this,c,b);if(!active(b))return out;const q=memory(b),n=b.honroAct4Preview,app=G.HonroApp,e=app.engine;q.visualDrawn??={};
 if(n===37){const {x,y}=b.honroAct4Design.signal;if(inView(app,{x,y:y-70})){const npc={...residents(b)[0],id:'a4-signal-silhouette',name:'',cls:'knight',honroType:'civilian',honroCivilian:true,hp:1,dead:false,side:2,r:19,h:88,x,y,facing:-1,honroScenePose:{kind:'point',time:.18+.22*(1+Math.sin(this.time*3))*.5}};c.save();c.globalAlpha*=.72;this.unitBody(c,npc,0);c.restore();q.visualDrawn.gesture=q.clock;}}
 if(n===35){const d=q.flaskDelivery,pair=d?{mage:e.unit(d.receiver),giver:e.unit(d.giver)}:flaskPair(e);if(pair&&(!d||d.phase!=='complete')&&alive(pair.mage)&&alive(pair.giver)){const t=d?Math.min(1,d.elapsed):0,a={x:pair.giver.x+pair.giver.facing*18,y:pair.giver.y-59},z={x:pair.mage.x+pair.mage.facing*18,y:pair.mage.y-59},p={x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t-Math.sin(t*Math.PI)*14};this.landmark(c,{asset:G.HonroAct4CoastArt.assets.find(a=>a.id==='a4-coast:breath-flask'),...p,scale:.65,rotation:0});if(d&&t===1&&!G.document.hidden&&!app.dialogue&&!app.modal.classList.contains('open')&&this.canvas.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&unobscured(app,pair.giver)&&unobscured(app,pair.mage))d.received??={at:q.clock,positions:[{id:pair.giver.id,x:pair.giver.x,y:pair.giver.y},{id:pair.mage.id,x:pair.mage.x,y:pair.mage.y}]};}}
 if(n===38&&q.connectionProbe){const t=q.connectionProbe,entry=t.phase==='entry',p=entry?{x:3180,y:2970}:{x:3000,y:2920};if(['entry','wrong-exit'].includes(t.phase)&&inView(app,p)){c.save();c.fillStyle='#bbc7bb';c.beginPath();c.ellipse(p.x,p.y,9,7,.25,0,Math.PI*2);c.fill();c.restore();q.visualDrawn.probe=q.clock;}}
 if(n===38&&q.connected){const p=b.honroAct4Design.connection.entry;c.save();c.strokeStyle='#c2bda1';c.lineWidth=5;c.beginPath();c.moveTo(p.x-35,p.y-24);c.lineTo(p.x+25,p.y-13);c.stroke();c.restore();}
 if(n===39&&q.artillery?.next){const p=q.artillery.next;if(inView(app,p)){c.save();c.strokeStyle='#bf8568';c.lineWidth=3;c.setLineDash([12,9]);c.beginPath();c.ellipse(p.x,p.y+40,105,24,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.restore();p.warningSeen=true;}}
 if(n===39&&q.exitStable){const p=b.honroAct4Design.rescue.anchor;c.save();c.strokeStyle='#c2bda1';c.lineWidth=5;c.beginPath();c.moveTo(p.x-35,p.y-24);c.lineTo(p.x+25,p.y-13);c.stroke();c.restore();}
 if(n===39&&q.hand&&!q.hand.completed){const a=b.units.find(u=>u.id===q.hand.actor),d=b.units.find(u=>u.id==='a4-rescue-3');if(alive(a)&&alive(d)&&Math.abs(a.x-d.x)<180&&inView(app,{x:d.x,y:d.y-70})){c.save();c.strokeStyle='#bfae91';c.lineWidth=7;c.beginPath();c.moveTo(a.x-18,a.y-57);c.lineTo(d.x+18,d.y-55);c.stroke();c.restore();q.visualDrawn.hand=q.clock;}}
 if(n===40){paintReturnWater(this,c,b);const l=b.honroAct4PreviewDynamic?.find(l=>l.asset?.id==='a4:boat');if(l){const id=b.honroMap?.vectorReturnBoatAssetId,authored=typeof id==='string'?G.HONRO_PROJECT?.library?.find(a=>a.id===id&&a.vector&&!a.collision?.length):null;this.landmark(c,{...l,asset:authored||l.asset,x:q.returnEscort?.boatX??b.honroAct4Design.escort.boat.x,y:2010});for(const [i,u]of residents(b).slice(0,2).entries())if(u.honroAct4OnBoat)this.unit(c,{...u,honroAct4OnBoat:false,x:u.x,y:1950},false);}if(closed(q,'thirteen')){const p={x:5840,y:1610};c.save();c.strokeStyle='#405b6a';c.lineWidth=12;c.beginPath();c.moveTo(p.x,p.y-120);c.lineTo(p.x-25,p.y-62);c.lineTo(p.x+12,p.y-25);c.stroke();c.restore();}}
 return out;};
P.rowAllowed=function(app,id){const b=app.engine?.b;if(!active(b))return false;const q=memory(b);if(['A4.S33.TIDE.01','A4.S39.TIDE.01'].includes(id))return q.tide?.phase==='rising';if(id==='A4.S38.VOICE.03')return !!q.pursuitSeen&&foes(b).some(u=>u.honroAct4Pursuer&&u.x>5230&&u.x<6500);if(id==='A4.S39.RELEASE.01')return !!q.netOpen&&!!q.npcRouteObserved&&routeClear(b);return true;};
function attachApp(){const input=Object.getPrototypeOf(G.HonroApp).canInput;Object.getPrototypeOf(G.HonroApp).canInput=function(...args){if(active(this.engine?.b)&&memory(this.engine.b).vista?.active)return false;return input.apply(this,args);};}
if(G.HonroApp)attachApp();else G.HONRO_APP_READY.then(attachApp);
G.document.addEventListener('keydown',ev=>{const app=G.HonroApp,b=app?.engine?.b;if(ev.code==='Escape'&&active(b)&&memory(b).vista?.active){memory(b).vista.active=false;memory(b).vistaDone=true;Object.assign(app.scene,{manual:false,x:app.engine.active.x,y:app.engine.active.y-90});}});
P.coast={fact,water,tide,complete,fail,space,routeClear,rescueSafe,returnWaterZones};
})(globalThis);
