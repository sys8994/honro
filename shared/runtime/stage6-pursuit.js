(function(G){'use strict';
// Only newly authored Stage 6 battles opt in. Old saved battles keep their
// original event, roster and finite capacity. No existing actor is relocated.
const W=G.HonroAllies,execute=W.execute;
const active=b=>!!b&&!b.honroCustom&&b.honroStage===6&&b.honroStage6PursuitRevision===1;
W.execute=function(app,action){
 const e=app.engine,b=e?.b;
 if(!active(b)||action?.source!=='pursuit'||action.type!=='spawn')return execute(app,action);
 // Wait until the allied team has finished moving, so the advertised rear
 // entry follows the current carrier rather than a stale mid-turn position.
 if(b.phase!=='transition')return false;
 const objective=e.unit('objective');if(!objective||objective.dead||objective.hp<=0)return false;
 for(const offset of [450,650,850]){
  const x=objective.x-offset;if(x<90||x>b.width-100)continue;
  const y=G.HonroWorld.top(b,x,objective.y,'lower-road');
  const spacing=action.spacing??145,n=action.n||1;
  // Do not surprise a hero already occupying the advertised entry.
  if(Array.from({length:n},(_,i)=>x+(i-(n-1)/2)*spacing).some(px=>e.heroesAlive().some(h=>Math.hypot(h.x-px,h.y-y)<180)))continue;
  const before=b.units.length,result=execute(app,{...action,x,y,support:'lower-road',spacing,maxDistance:120});
  if(result===false)continue;
  for(const u of b.units.slice(before))if(u.honroSpawnSource==='pursuit'){
   u.honroTargetId=objective.id;u.honroTargetUntil=b.round+2;
   u.honroPursuitSupports=['lower-road'];u.honroDensityBornRound=b.round;
  }
  return result;
 }
 return false;
};
// A receipt belongs to this live battle object, never to its serialized save.
// Continue must render the notice again before a fresh action can count.
const displayed=new WeakSet(),scheduled=new WeakSet();
const pending=b=>active(b)&&!['won','lost'].includes(b.phase)&&!b.honroState?.flags?.['event:pursuit']&&(b.honroState?.pendingEvents||[]).includes('pursuit');
const shown=app=>pending(app.engine?.b)&&displayed.has(app.engine.b);
const notice='추격 예고: 운반대 뒤 예상 구역 · 아군 행동 뒤 진입';
const state=G.HonroObjectives.state;
G.HonroObjectives.state=function(b,st){const out=state(b,st);if(pending(b)){const car=b.units.find(u=>u.id==='objective'&&!u.dead&&u.hp>0);if(car){const x=Math.max(90,car.x-650),y=G.HonroWorld.top(b,x,car.y,'lower-road');out.targets=[...out.targets,{id:'stage6-pursuit-estimate',kind:'reinforcement-warning',x,y,label:'운반대 뒤 추격 예상 구역'}];}}return out;};
const minimap=G.HonroObjectives.minimap;
G.HonroObjectives.minimap=function(app,c,sx,sy){const out=minimap(app,c,sx,sy),b=app.engine?.b;if(pending(b)&&!app.training){const car=b.units.find(u=>u.id==='objective'&&!u.dead&&u.hp>0);if(car){const x=Math.max(90,car.x-650),y=G.HonroWorld.top(b,x,car.y,'lower-road');c.save();c.strokeStyle='#ffcb67';c.strokeRect(x*sx-5,y*sy-5,10,10);c.restore();}}return out;};
const refresh=G.HonroObjectives.refresh;
G.HonroObjectives.refresh=function(app,...args){const out=refresh(app,...args),b=app.engine?.b,doc=G.document;let node=doc?.getElementById?.('stage6-pursuit-warning');
 if(!pending(b)||app.training||app.done){if(node)node.remove();return out;}
 if(app.scene)app.scene.missionTargets=G.HonroObjectives.state(b,app.stage).targets;
 if(!node){const screen=doc?.querySelector?.('.battle-screen');if(!screen||!doc.createElement)return out;node=doc.createElement('div');node.id='stage6-pursuit-warning';node.className='stage6-pursuit-warning';node.setAttribute('role','status');screen.appendChild(node);}
 node.textContent=notice;
 // The first animation frame makes layout measurable, the second follows a
 // paint. A hidden, clipped, modal-covered or not-yet-ready HUD is not proof.
 if(!displayed.has(b)&&!scheduled.has(b)&&G.requestAnimationFrame){scheduled.add(b);G.requestAnimationFrame(()=>G.requestAnimationFrame(()=>{scheduled.delete(b);if(app.engine?.b!==b||!pending(b)||app.done||app.dialogue||app.charging||app.modal?.classList.contains('open')||app.storyHistoryOpen||doc.hidden||G.HonroStory?.turnPaused?.(app))return;const r=node.getBoundingClientRect?.(),style=G.getComputedStyle?.(node);if(!r||r.width<=0||r.height<=0||r.left<0||r.top<0||r.right>G.innerWidth||r.bottom>G.innerHeight||node.scrollWidth>node.clientWidth+1||node.scrollHeight>node.clientHeight+1||style?.display==='none'||style?.visibility==='hidden'||Number(style?.opacity)===0)return;displayed.add(b);}));}
 return out;};
G.HonroStage6Pursuit={active,pending,shown,notice};
})(globalThis);
