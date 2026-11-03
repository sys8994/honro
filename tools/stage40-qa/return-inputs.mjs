/** Functional return diagnostic only: real App controls and production minimap
 * observer with doubled canvas/DOM. No scene visibility or subjective art claim. */
import assert from 'node:assert/strict';
import {upperConnectionGoal} from './upper-recovery-route.mjs';
export function completeNativeReturn({h,g,C,app,e,b,ops,returnView,record=()=>{},functionalContinuation=false}){
 const living=()=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAct4Resident&&!u.dead&&u.hp>0),surface=u=>e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id;
 let frames=0;function tick(n=1){for(let i=0;i<n;i++){assert(++frames<=90000,'Return frame bound');assert(functionalContinuation||b.round<=20,'Total round budget exceeded during return');assert(!b.units.some(u=>u.side===1&&!u.dead&&u.hp>0),'Combat resumed during return');assert(b.units.filter(u=>u.honroAct4Resident).every(u=>!u.dead&&u.hp>0),'Resident loss');ops.frame();}}
 function ready(){for(let n=0;n<30000;n++){if(['won','lost'].includes(b.phase))return false;if(app.canInput()&&e.grounded(e.active))return true;tick();}throw Error('Return readiness bound');}
 function pan(point){ready();returnView.pan(point);tick(90);ready();}
 function go(u,x,air=false){for(let n=0;n<1400&&e.active===u&&!u.acted&&u.moveLeft>100&&Math.abs(u.x-x)>20;n++){if(app.canInput())ops.move(Math.sign(x-u.x),C.STEP);tick();}if(!air)for(let n=0;n<480&&!e.grounded(u)&&e.active===u;n++)tick();}
 function joinStair(u){go(u,2350);if(e.active!==u||u.acted||u.moveLeft<450)return;if(!ops.jump())throw Error('Return deck join jump unavailable');tick(30);go(u,2140,true);for(let n=0;n<480&&!e.grounded(u)&&e.active===u;n++)tick();assert.equal(surface(u),'approved40-departure-stair','Return join did not land on stair');}
 returnView.enable();ready();for(let n=0;n<1200&&!g.HonroAct4TerrainPreview.quietReady(b);n++)tick();assert(g.HonroAct4TerrainPreview.quietReady(b),'Existing quiet gate did not settle');const geo=b.honroAct4Design.geometry40;
 pan(geo.marks.boat);pan(geo.marks.high);
 const destinations={mage:5030,knight:5060,archer:5000,occultist:5090};
 const done=u=>Math.abs(u.x-destinations[u.cls])<45&&e.grounded(u)&&['approved40-coast-west','approved40-coast-east','approved40-upper-east'].includes(surface(u));
 for(let step=0;step<360&&!living().every(done);step++){
  ready();const todo=living().filter(u=>!done(u)&&!u.acted),u=todo.find(u=>u===e.active)||todo[0];if(!u){ops.defend();continue;}assert(ops.select(u.id));
  if(u.moveLeft<120){ops.defend();continue;}const before={x:u.x,y:u.y,round:b.round,support:surface(u),move:u.moveLeft};
  if(surface(u)==='a4-return-deck')joinStair(u);
  else {const support=surface(u),connection=upperConnectionGoal(u,support);if(connection?.jumpLanding&&Math.abs(connection.x-u.x)<20){assert(ops.jump());ready();assert.equal(surface(u),connection.jumpLanding,'Return support jump failed');continue;}const goal=connection?.x??(['approved40-departure-stair','approved40-departure-ramp'].includes(support)?1445:['approved40-dock','approved40-dock-stair'].includes(support)?2670:support==='approved40-upper-east'&&u.x<5750?5820:destinations[u.cls]);
   // Bounded ordinary movement segment, followed by one jump only if blocked.
   for(let n=0;n<48&&e.active===u&&app.canInput()&&Math.abs(goal-u.x)>(connection?18:25);n++){ops.move(Math.sign(goal-u.x),C.STEP);tick();}ready();
   if(e.active===u&&!u.acted&&Math.abs(u.x-before.x)<12&&u.moveLeft>300&&ops.jump()){for(let n=0;n<32&&app.canInput();n++){ops.move(Math.sign(goal-u.x),C.STEP);tick();}ready();}
  }
  record({op:'return-route',hero:u.id,before,after:{x:u.x,y:u.y,round:b.round,support:surface(u),move:u.moveLeft}});
  if(!b.honroAct4PreviewState.returnEscort){pan(geo.marks.boat);pan(geo.marks.high);}
 }
 assert(living().length&&living().every(done),'Party return route incomplete');assert(b.honroAct4PreviewState.returnEscort,'Boarding trigger not reached');
 for(let n=0;n<300&&b.honroAct4PreviewState.returnEscort.phase!=='safe';n++){const phase=b.honroAct4PreviewState.returnEscort.phase;pan(['boarding','sailing'].includes(phase)?geo.marks.boat:geo.marks.safe);tick(90);}
 assert.equal(b.honroAct4PreviewState.returnEscort.phase,'safe');pan(geo.marks.safe);pan(geo.marks.ridge);pan(geo.marks.dislocation);ready();
 const event={code:'KeyE',repeat:false,preventDefault(){}};assert(g.HonroInteractions.key(app,event),'Actual E-key interaction not eligible');tick(120);assert.equal(b.phase,'won');
 const q=b.honroAct4PreviewState;assert(q.complete);assert.deepEqual(JSON.parse(JSON.stringify(q.roster)),{total:13,living:11,priorDeaths:2});
 const finalRound=b.round;h.click('result-continue');assert.equal(app.screen,'rest','Normal result continuation did not settle');app.flushBattleSave();
 const project=p=>JSON.stringify(Object.fromEntries(['cleared','heroes','equipment','honroAct4','recruited'].map(k=>[k,p[k]]))),immediate=project(app.profile);
 // A normal rest-frame toast commits notified:false -> true. Wait for that
 // actual UI transition before comparing reload; do not normalize the value.
 for(let n=0;n<1200&&!app.profile.equipment.rewardLedger.eq_so_t3b?.notified;n++)ops.frame();assert(app.profile.equipment.rewardLedger.eq_so_t3b?.notified,'Normal rest reward notification did not settle');const before=project(app.profile);record({op:'normal-rest-notification',changed:immediate!==before});const reloaded=h.reload();g.HonroApp=reloaded;reloaded.continue();assert.equal(reloaded.screen,'rest');assert.equal(project(reloaded.profile),before,'Normal reload changed committed progression');
 return{fullReturn:true,totalRounds:finalRound,functionalContinuation,within20:finalRound<=20,frames,roster:q.roster,rescued:q.rescued,settled:true,reloaded:true,scope:'Native normal-input functional diagnostic; canvas/DOM doubled, not browser visibility acceptance'};
}
