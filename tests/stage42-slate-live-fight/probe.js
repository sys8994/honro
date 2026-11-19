// Read-only input-planning query for exact disposable Stage42. NEVER calls fire/tick,
// movement/position edits, state mutations, dispatchEvent, or difficulty/cooldown edits.
({kind, angle=null, power=null, target=null})=>{
 const app=window.HonroApp,e=app?.engine,b=e?.b,u=e?.active,C=window.HONRO_CORE;
 if(!['localhost','127.0.0.1'].includes(location.hostname)||!location.pathname.endsWith('/HONRO.html')||
    !window.HonroQaObserveStage42||!b||b.honroStage!==42||b.honroCustom||!HonroAct5.active(b)||b.honroMapOrigin!=='campaign')throw Error('Disposable campaign HUD Stage42 only');
 const d=b.honroMap.act5,m=b.honroState.act5,required=d.required.approach;
 if(required.length!==4)throw Error('Unexpected stock approach topology');
 const goal=required.map(id=>{const t=b.units.find(x=>x.id===id);if(!t)throw Error('Missing required actor');return t});
 const x=app.scene?.x,y=app.scene?.y,z=app.scene?.scale,r=document.querySelector('#battlecanvas').getBoundingClientRect();
 const visible=t=>[x,y,z,r.width,r.height].every(Number.isFinite)&&z>0&&Math.abs(t.x-x)*z<r.width/2-28&&Math.abs(t.y-t.h*.52-y)*z<r.height/2-28;
 const alive=t=>!t.dead&&!t.honroAct5Reserve&&t.hp>0,targets=goal.filter(alive),allies=b.units.filter(t=>t!==u&&t.side!==1&&alive(t));
 const allowed={'archer':'A01','mage':'M01'};const pick=allowed[u?.cls],s=C.SKILLS[pick];
 const slot=u?.loadout?.indexOf(pick)??-1,ready=!!u&&app.canInput()&&b.phase==='aim'&&b.side===0&&!u.acted&&!u.retreat&&e.grounded(u);
 const canShot=ready&&s&&slot>=0&&slot<4&&e.skillAllowed(s,u)&&e.canAfford(s,u,1)&&!e.cooldownLeft(u,pick);
 const snap=()=>({readiness:ready,dialogue:!!app.dialogue,phase:b.phase,round:b.round,step:m?.step??0,side:b.side,shot:b.shot??b.shots??0,
   active:u?.id??null,cls:u?.cls??null,x:u?.x??null,y:u?.y??null,face:u?.facing??null,
   viewAngle:u?app.displayAngle(u):null,move:u?.moveLeft??0,loadout:u?.loadout??[],selected:app.selected,pick,slot,canShot:!!canShot,
   charging:app.charging,actualCharge:app.charging?app.chargePower():null,keys:[...app.keys],
   stateToken:[b.round,b.side,b.phase,b.shot??b.shots??0,b.wind,b.sceneVersion,u?.id,u?.x,u?.y,u?.facing],
   targets:goal.map(t=>({id:t.id,x:t.x,y:t.y,hp:t.hp,dead:!alive(t),visible:visible(t)})),
   store:localStorage.length+sessionStorage.length,lastError:app.lastError??null});
 if(kind==='state')return snap();
 if(!canShot||m?.step>0||!visible(u))return {ok:false,reason:'actor, skill, visibility or objective unavailable'};
 // Coordinates are read from live stock battle, never assigned. Require same first
 // impact on the same necessary target across the acceptance neighborhood.
 const fingerprint=()=>JSON.stringify({units:b.units,terrain:b.terrain,projectiles:b.projectiles,phase:b.phase,side:b.side,round:b.round,active:b.active,shot:b.shot??b.shots,honroState:b.honroState});
 const original=fingerprint();
 try{
 const blast=e.effective(s,u).radius;
 const evaluate=(a,p,id)=>{
  if(!Number.isFinite(a)||!Number.isFinite(p)||a< -(C.AIM_MAX_DOWN??85)||a>90||p<.4||p>1)return null;
  const worldAngle=u.facing>=0?a:180-a;
  const q=e.predict(u,s,worldAngle,p,undefined,false,false);
  const hit=targets.find(t=>t.id===q.unit&&(!id||t.id===id));
  if(!hit||!visible(hit)||!Number.isFinite(q.x)||!Number.isFinite(q.y))return null;
  if(allies.some(v=>Math.hypot(q.x-v.x,q.y-(v.y-v.h*.52)) <= Math.max(0,blast)+(Math.hypot(v.r,v.h*.52)+32)))return null;
  return {id:hit.id,hp:hit.hp,impact:[q.x,q.y],distance:Math.abs(hit.x-u.x)};
 };
 const screen=(a,p,id)=>evaluate(a,p,id);
 const robust=(a,p,id,da=1.8,dp=.032)=>{
  const q=screen(a,p,id);if(!q)return null;
  const tps=[[a-da,p],[a+da,p],[a,p-dp],[a,p+dp],[a-da,p-dp],[a+da,p+dp]];
  return tps.every(([a,p])=>screen(a,p,q.id))?q:null;
 };
 if(kind==='confirm'){
  const q=robust(angle,power,target,.9,.028);
  return q?{ok:true,hit:q,actor:u.id,skill:s.id,duration:e.chargeDuration(u,s)}:{ok:false,reason:'live aim/charge undercut robust direct route'};
 }
 if(kind!=='plan')throw Error('Unsupported read-only probe');
 const vtargets=targets.filter(t=>visible(t)&&(t.x-u.x)*u.facing>=0).sort((a,b)=>a.hp-b.hp||Math.abs(a.x-u.x)-Math.abs(b.x-u.x)||a.id.localeCompare(b.id)).slice(0,3);
 const pgrid=[.64,.73,.82,.90,.94,.55];
 const tried=new Set();const candidates=[];
 for(const t of vtargets){
  const distance=Math.max(40,Math.abs(t.x-u.x));
  const base=Math.atan2((u.y-u.h*.63)-(t.y-t.h*.55),distance)*180/Math.PI;
  for(const offset of [16,24,8,32,40,48,3,56,64]){
   const a=Math.round(Math.max(-20,Math.min(80,base+offset))/2)*2;
   for(const p of pgrid){const key=t.id+'/'+a+'/'+p;
    if(tried.has(key))continue;tried.add(key);
    const q=screen(a,p,t.id);if(!q)continue;
    candidates.push({angle:a,power:p,q,favor:q.hp*.7+q.distance*.008+Math.abs(app.displayAngle(u)-a)*.08});
    if(candidates.length>=12)break;
   }
   if(candidates.length>=12||tried.size>=132)break;
  }
  if(candidates.length>=12||tried.size>=132)break;
 }
 candidates.sort((a,b)=>a.favor-b.favor||a.angle-b.angle||a.power-b.power||a.q.id.localeCompare(b.q.id));
 for(const q of candidates.slice(0,8)){
  const confirmed=robust(q.angle,q.power,q.q.id);
  if(confirmed)return {ok:true,actor:u.id,skill:s.id,slot,angle:q.angle,power:q.power,target:confirmed.id,impact:confirmed.impact,
    duration:e.chargeDuration(u,s),tried:tried.size,stockPrediction:'robust first required hit, not live damage'};
 }
 return {ok:false,reason:'no visible stable direct-hit candidate',tried:tried.size};
 }finally{if(fingerprint()!==original)throw Error('Stock prediction changed live battle state');}
}
