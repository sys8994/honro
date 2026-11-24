// Scratch-only Stage53 position/impact gate. Engine owns damage, movement, first stake, and victory.
export function createPillarOwner(){
 const owners=new WeakMap();
 const fit=(b,u)=>u&&!u.dead&&u.hp>0&&b.units.includes(u);
 function mount(e){
  const b=e.b,u=e.heroesAlive().find(x=>x.cls==='mage');
  const target=e.unit('draft-upper-side-guard');
  if(b.honroStage!==53||b.honroMonsterEffectsRevision!==1||!u||target?.honroType!=='shade'||owners.has(e))return null;
  const g={b,u,target,cast:null,resolved:null,telegraphSeen:false,armed:new Map(),stepping:null,impacts:new WeakSet()};
  owners.set(e,g);
  const fire=e.fire.bind(e),step=e.stepProjectile.bind(e),collision=e.collision.bind(e),impact=e.impact.bind(e);
  e.fire=(skill,...args)=>{
   const a=e.active,n=e.b.shot,ok=fire(skill,...args);
   if(ok&&skill==='M01'&&a===g.u&&e.b.shot===n+1&&e.b===g.b&&g.cast&&!g.resolved)g.armed.set(e.b.shot,a.id);
   return ok;
  };
  e.stepProjectile=(p,...args)=>{
   const prior=g.stepping;g.stepping=e.b===b&&g.armed.get(p?.shot)===p?.owner&&p?.skill==='M01'&&b.projectiles.includes(p)?p:null;
   try{return step(p,...args)}finally{g.stepping=prior;}
  };
  e.collision=(...args)=>{
   const hit=collision(...args);
   if(hit&&g.stepping&&args[8]===true&&args[9]===g.stepping)g.impacts.add(hit);
   return hit;
  };
  e.impact=(p,h,...args)=>{
   const native=g.stepping===p&&g.impacts.has(h),hp=h?.unit?.hp,ret=impact(p,h,...args);
   if(native){g.impacts.delete(h);release(e,p,h,hp);}
   return ret;
  };
  return Object.freeze({view:()=>structuredClone({cast:g.cast,resolved:g.resolved,telegraphSeen:g.telegraphSeen})});
 }
 function context(e){
  const g=owners.get(e);if(!g||e.b!==g.b||!fit(g.b,g.u))return null;
  const q=g.target.enemyEffectCast, valid=e.b.stakes.some(t=>!t.dead&&(t.hp===undefined||t.hp>0)&&t.skill==='M09'&&t.owner===g.u.id&&t.shot===1&&t.x>=2450&&t.x<=2600);
  if(!g.cast&&q?.skill==='HSH02'&&q.target===g.u.id&&valid)g.cast=structuredClone(q);
  return g;
 }
 function project(e,base){
  const g=context(e);if(!g||g.resolved||!base||base.failed)return base;
  return {...base,complete:false,objectiveReady:false,
   ...(g.cast?{summary:'매듭실을 끊거나 왼쪽 진목 경계에서 실을 낮추십시오.',targets:[...(base.targets??[]),{kind:'route',id:'pillar-shunt',cls:'mage',x:2507,y:e.contactSurface(2507,530,620)?.y??579.3,label:'왼쪽 석단에서 실 낮추기'}]}:{})};
 }
 function interact(e,id){
  const g=context(e),u=g?.u,q=g?.cast;
  if(id!=='pillar-shunt'||!g||!q||g.resolved||e.active!==u||!e.canAct()||!e.grounded(u)||u.x<2460||u.x>2515||
     Math.hypot(u.x-q.impact.x,u.y-u.h*.45-q.impact.y)<=q.radius+u.r)return false;
  const s=e.contactSurface(u.x,u.y-3,u.y+5)?.t.id;
  if(s!=='upper-threshold-footing')return false;
  g.telegraphSeen=e.observeEnemyEffectWarning(g.target.id,q.serial)||g.target.enemyEffectCast?.seen===true;
  g.resolved={kind:'grounded-pillar-shunt',id:u.id,x:u.x,y:u.y,support:s,round:e.b.round};
  return true;
 }
 function release(e,p,h,before){
  const g=context(e),t=g?.target;
  if(!g?.cast||g.resolved||p?.owner!==g.u.id||p.skill!=='M01'||p.shot<2||h?.unit!==t||!Number.isFinite(before)||!t||t.hp>=before)return false;
  g.resolved={kind:'native-direct-pressure',shot:p.shot,target:t.id,damage:before-t.hp,round:e.b.round};
  return true;
 }
 return Object.freeze({mount,project,interact});
}
