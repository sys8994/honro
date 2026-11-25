const phaseRows=[
 ['bellSiteEmergencyStabilized','occultist',5016],['bridgeRetreatOpened','knight',3376],['relayMovedToFallback','occultist',1992]
];
const approachRange=115;
const ids={gate:'a6-c07-railing',relay:'a6-c07-protective-relay',ward:'a6-c07-stationary-stone-ward'};
const once=new WeakSet();
export function mountEmergency57({G,engine:e,authorize,authority,heroes,foes,observe=()=>{},replayLoss=false}){
 const b=e?.b,C=G?.HONRO_CORE;
 if(!C||!(e instanceof C.Engine)||once.has(e)||typeof authorize!=='function'||!authorize(authority,e)||!b.honroState?.flags['act6.firstGarmjinFailed'])return null;
 const activeParty=b.units.filter(x=>x.side===0&&!x.summoned);
 if(heroes.length!==3||activeParty.length!==3||!heroes.every(x=>activeParty.includes(x))||new Set(heroes.map(x=>x.cls)).size!==3||heroes.some(x=>!['knight','archer','occultist'].includes(x.cls))||foes.length!==3)return null;
 const get=id=>b.terrain.find(t=>t.id===id);
 const gate=get(ids.gate),relay=get(ids.relay),ward=get(ids.ward),flags=b.honroState.flags;
 if(!gate||!relay||!ward||Object.values(ids).some(id=>!b.honroWorldTerrain.some(t=>t.id===id)))return null;
 if(foes.some(x=>x.side!==1||!e.grounded(x))||b.units.some(x=>x.id===foes[1].id))return null;
 const approved={},ai=[],structure=[],events=[];
 let seconds=0,ticks=0,bellStart=false,repair=false,warningAt=null,ready=false,loss=null;
 const stamp=(kind,data={})=>{const item={kind,round:b.round,tick:ticks,...data};events.push(item);observe(item);};
 const copyBroken=t=>{for(const z of b.honroWorldTerrain)if(z.id===t.id)z.broken=true;e.invalidateTerrainCollisionIndex();};
 const grounded=(a,x,r=approachRange)=>a&&!a.dead&&a.hp>0&&e.grounded(a)&&Math.abs(a.x-x)<=r;
 const native=()=>b.phase==='aim'&&b.side===0&&e.canAct()&&!b.projectiles.length;
 function railing(){
  const left=gate.x-38,right=gate.x+gate.w+38,top=gate.y-92,bottom=gate.y+gate.h+30;
  const blocked=heroes.filter(u=>!u.dead&&u.x>left&&u.x<right&&u.y>top&&u.y<bottom);
  const knight=heroes.find(u=>u.cls==='knight'),x=right+(knight?.r??22)*2+30;
  const face=knight&&Math.abs(x-phaseRows[1][2])<=approachRange&&e.contactSurface(x,top,bottom+60);
  const approach=face&&Number.isFinite(face.y)&&C.validTerrainContactPose(b.terrain,{...knight,x,y:face.y})
   ?{x,y:face.y,support:face.t.id}:null;
  return {blocked:blocked.map(u=>({id:u.id,name:u.name})),approach};
 }
 function inspect(){
  if(loss)return;
  const bodyStillPresent=b.units.some(u=>u.id==='a6-c07-original-darmheo-body');
  if((!ready&&relay.broken)||(bodyStillPresent&&ward.broken)||heroes.some(a=>a.dead||a.hp<=0)){
   loss=!ready&&relay.broken?'protective-relay-broken':bodyStillPresent&&ward.broken?'stationary-ward-broken':'fallen';
   stamp('emergency-failed',{loss});if(replayLoss)b.phase='lost';return;
  }
  if(!ready&&phaseRows.every(([flag])=>flags[flag])&&heroes.every(a=>grounded(a,1968,124))){
   ready=true;flags['act6.fallbackRelaySecured']=true;stamp('act6.fallbackRelaySecured',{phase:b.phase});
  }
 }
 function interact(intent='full-relay'){
  if(loss||ready||!native())return false;
  const row=phaseRows.find(([f])=>!flags[f]);if(!row)return false;
  const [f,cls,x]=row,a=e.active;
  if(a.cls!==cls||!heroes.includes(a)||!grounded(a,x))return false;
  if(f===phaseRows[0][0]){
   if(!bellStart){bellStart=true;stamp('bell_site_under_fire');return 'warned';}
   if(relay.hp===relay.maxHp||relay.broken||!['full-relay','split-ward'].includes(intent))return false;
   const split=intent==='split-ward',before=relay.hp;
   relay.hp=Math.min(relay.maxHp,relay.hp+(split?10:20));repair=true;
   if(split){const hp=ward.hp;ward.hp=Math.min(ward.maxHp,ward.hp+18);structure.push({id:ward.id,kind:'sodan-diverts-existing-ritual',before:hp,after:ward.hp,tick:ticks});}
   structure.push({id:relay.id,kind:'sodan-repair',before,after:relay.hp,tick:ticks});
  }
  if(f===phaseRows[1][0]){
   if(warningAt===null){warningAt=seconds;stamp('bridge-railing-warning',{x:gate.x,y:gate.y});e.fx('text',gate.x,gate.y-35,'#edcf96',20,'석교 난간 붕괴 주의');return 'warned';}
   if(seconds-warningAt<.7)return false;
   if(railing().blocked.length)return false;
   if(b.units.some(x=>x.id===foes[1].id))return false;
   const before=gate.hp;e.damageTerrain(gate,gate.hp+1,0,a.id);if(!gate.broken)return false;
   copyBroken(gate);b.units.push(foes[1]);stamp('retreatReached(bridge)',{spawned:foes[1].id});
   structure.push({id:gate.id,kind:'guard-collapse',before,after:gate.hp,warning:true,tick:ticks});
  }
  if(f===phaseRows[2][0]&&!repair)return false;
  flags[f]=true;stamp(f,{role:cls});inspect();return true;
 }
 const tick=e.tick.bind(e),terrain=e.damageTerrain.bind(e),enemy=e.enemyAction.bind(e);
 e.tick=(dt)=>{seconds+=dt;ticks++;const result=tick(dt);inspect();return result;};
 e.damageTerrain=(t,...a)=>{
  const before=t.hp,old=t.broken,v=terrain(t,...a);
  if(t===relay||t===ward){if(before!==t.hp)structure.push({id:t.id,kind:'stock-damage',before,after:t.hp,source:a[2],tick:ticks});if(t.broken&&!old)copyBroken(t);}
  return v;
 };
 e.enemyAction=()=>{
  const a=e.active;
  if(!ready&&bellStart&&!repair&&a===foes[0]&&!relay.broken&&!a.aiAim&&approved[a.id]!==b.round){
   approved[a.id]=b.round;
   for(const k of a.loadout)for(const da of [0,2,4,6,8,10,12,16,21,25,30,35])for(let p=28;p<=100;p+=3){
    const angle=180-da,v=e.predict(a,C.SKILLS[k],angle,p/100,null,true);if(v.terrain!==relay.id)continue;
    const aim={skill:k,angle,power:p/100,age:0};a.aiAim=aim;a.intent='연결 받침을 겨냥';ai.push({round:b.round,id:a.id,aim,forecast:[v.x,v.y]});e.emit('change');return;
   }
  }
  if(!ready&&bellStart&&a===foes[2]&&!ward.broken&&!a.aiAim&&approved[a.id]!==b.round){
   approved[a.id]=b.round;
   for(const k of ['HGS02','HGS01'])for(const d of [-55,-50,-45,-40,-35,-30,-26,-22,-18,-14,-10,-7,-4,-2,0,2,4,6,9,12,15,18,23,31,40])for(let p=20;p<=100;p+=2){
    const sk=C.SKILLS[k],angle=180-d,v=e.predict(a,sk,angle,p/100,null,true);
    if(v.terrain===ward.id||v.unit||!v.terrain)continue;
    const gap=Math.hypot(v.x-ward.x-ward.w/2,v.y-ward.y-ward.h/2);if(gap>sk.radius*1.05||gap<15)continue;
    const aim={skill:k,angle,power:p/100,age:0};a.aiAim=aim;a.intent='돌단 옆 좁은 땅에 혼기를 터뜨림';ai.push({round:b.round,id:a.id,role:'stationary-ward-splash',aim});e.emit('change');return;
   }
   return e.finishAction();
  }
  if(!ready&&a?.side===1&&b.side===1&&repair&&!a.aiAim&&approved[a.id]!==b.round&&a.fixed){
   approved[a.id]=b.round;const role=a===foes[1]?'bridge-interdict':'relay-pursuit',finite=ai.some(t=>t.id===a.id&&t.role===role);
   const guarded=heroes.find(h=>h.cls===(finite?'archer':a===foes[1]?'knight':'occultist'));
   if(!guarded)return e.finishAction();
   const choose=[0,2,4,6,8,12,16,24,32,40,48,56].map(d=>guarded.x>=a.x?d:180-d);
   for(const k of a.loadout)for(const angle of choose)for(let pp=32;pp<=100;pp+=8){
    const pr=e.predict(a,C.SKILLS[k],angle,pp/100,guarded,true);if(pr.unit!==guarded.id)continue;
    a.aiAim={skill:k,angle,power:pp/100,age:0};a.intent='후퇴 중인 이에게 견제';ai.push({round:b.round,id:a.id,role:finite?'fallback-cover':role,target:guarded.id});e.emit('change');return;
   }
   return e.finishAction();
  }
  return enemy();
 };
 once.add(e);
 return Object.freeze({interact,inspect,read:()=>({ready,loss,events:events.slice(),structure:structure.slice(),ai:ai.slice(),
  railing:flags.bellSiteEmergencyStabilized&&!flags.bridgeRetreatOpened&&warningAt!==null?railing():null}),structure,ai});
}
