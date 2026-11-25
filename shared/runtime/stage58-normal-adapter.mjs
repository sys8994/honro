import {createStage58Owner} from './stage58-owner.mjs';
export const sourceSHA='eba509f70ad39813b0d3057ce6e16dcb1c04b38c13e6e2d2998f34c95d7921ed';
export const stage58=Object.freeze({id:58,act:6,actStage:8,previous:57,authoredId:'stage-58',
 entry:['mage','archer','knight','occultist'],parked:[],exit:['mage','archer','knight','occultist'],parkedOnExit:[],
 requiresFlags:{'act6.fourCorporealJoined':true,'act6.fallbackRelaySecured':true},
 terminalFlags:{'act6.daedosaStopped':true,'act6.innerRevisionReady':true,'act6.fourCorporealReturned':true},
 events:['interact','tick','nativeRelease','nativeImpact','noncombatReturn'],
 objective:'act6-daedosa-revision',name:'대도사 앞 네 사람',runtimeReleaseEnabled:false});
const reference=['a6-c08-boss','a6-c08-expansion-node','a6-c08-unsettled-ledger','a6-c08-margin-echo','a6-c08-vessel-a','a6-c08-vessel-b','a6-c08-ink-echo-a','a6-c08-ink-echo-b'];
const keys=['id','cls','hp','maxHp','focus','maxFocus','shield','h','r','loadout','level','ranks','tune','equipmentState','dead','attack','armor','maxMove','walkSpeed','regen'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const safe=app=>!app.training&&!app.debugMode&&!app.embedded&&!app.customMap&&!app.workshopMode&&!globalThis.HONRO_EMBEDDED;
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(b))))].map(n=>n.toString(16).padStart(2,'0')).join('');
const motifs={
 column:{cls:'occultist',x:3496,label:'소단으로 첫 기둥의 술식을 바로잡으십시오.'},
 threshold:{cls:'mage',x:3680,label:'담허로 문턱 안쪽의 답을 확인하십시오.'},
 ledger:{cls:'occultist',x:4464,label:'소단으로 장부의 먹선을 끊어 저편의 충전을 늦출 수 있습니다.'},
 stake:{cls:'mage',x:3680,label:'담허로 수정 진목을 놓으십시오.'}
};
export function stage58Adapter(G,{verifyPrevious,verifyAdmission}={}){
 if(typeof verifyPrevious!=='function'||typeof verifyAdmission!=='function')throw TypeError('58 normal private authority required');
 const C=G.HONRO_CORE,attached=new WeakSet();
 async function prepare({descriptor,packet,compiled,previous}){
  if(descriptor.id!==58||descriptor.scope!=='normal-private-pilot'||!verifyPrevious(previous,descriptor,packet)||descriptor.authoredId!=='stage-58'||packet.map.units.length||previous?.stage!==57||previous.won!==true||previous.settlement!==false||
     !Object.keys(stage58.requiresFlags).every(k=>previous.flags?.[k]===true))return null;
  const cap=previous.boundary, {full,receiving,guard,association}=cap??{};
  if(!full||!receiving||guard?.ref!=='local-07-gwakjin-return-keeper'||association?.seamReady!==true)return null;
  for(const cls of stage58.entry){
   const actor=full[cls],carry=previous.crew[cls],site=receiving[cls];
   if(!actor||actor.cls!==cls||actor.dead||actor.hp<=0||!site||![site.x,site.y].every(Number.isFinite)||
      !keys.every(k=>eq(actor[k],carry?.[k])))return null;
  }
  if(!eq(packet.roles.map(u=>u.id),reference)||packet.roles[0].honroRigAsset!=='boss_daedosa'||packet.roles[0].loadout.length)return null;
  if(await hash(compiled.terrain)!==descriptor.playSHA||await hash(compiled.worldTerrain)!==descriptor.worldSHA)return null;
  const units=stage58.entry.map(cls=>{
   const {x,y}=receiving[cls],u=structuredClone(full[cls]);
   Object.assign(u,{x,y,spawnX:x,spawnY:y,vx:0,vy:0,airborne:false,jumping:false,acted:false,fallApexY:undefined,moveTarget:undefined,moveLeft:u.maxMove});
   return u;
  });
  const reserved=packet.roles.map(u=>C.makeUnit(u.cls,u.side,u.x,u.y,{...structuredClone(u),spawnX:u.x,spawnY:u.y,airborne:false,jumping:false,vx:0,vy:0}));
  if(units.some(u=>!C.validTerrainContactPose(compiled.terrain,u)))return null;
  return Object.freeze({units,reserved,story:stage58,previous,full,receiving,
   fingerprint:value=>eq(value,compiled.terrain)?descriptor.playSHA:eq(value,compiled.worldTerrain)?descriptor.worldSHA:null});
 }
 function attach({app,engine:e,prepared,returnRoute,isVanguard}){
  if(!safe(app)||!verifyAdmission(app,e,prepared)||attached.has(e)||prepared.units.length!==4||!eq(e.b.units.map(u=>u.id),prepared.units.map(u=>u.id)))return null;
  const p=prepared.previous, carried=app.profile, e0=e;
  const activation=Object.freeze({enabled:true,integerStageKey:58,debug:false,embedded:false,training:false,custom:false});
  const proof=Object.freeze({});
  const prev={stage:57,won:true,flags:p.flags,actors:stage58.entry.map(k=>prepared.full[k]),receiving:prepared.receiving,profile:structuredClone(carried)};
  const mount=createStage58Owner({C,fingerprint:prepared.fingerprint,
   authorize:({engine,activation:a})=>a===activation&&e0===engine&&app.engine===e0&&safe(app),
   normalBudget:(a,eng)=>a===activation&&eng===e0&&verifyAdmission(app,e,prepared),
   readPrevious:(q,eng)=>q===proof&&eng===e0?prev:null,
   vanguard:(u,eng)=>eng===e0&&isVanguard?.(u)===true});
  const owner=mount({engine:e,activation,previous:proof,carriedProfile:carried,reserved:prepared.reserved});
  if(!owner.accepted)return null;
  attached.add(e);let ticks=0;
  const oldFire=e.fire.bind(e),oldHurt=e.hurt.bind(e),oldEnemy=e.enemyAction.bind(e);
  e.fire=(...args)=>{const actor=e.active,ok=oldFire(...args);owner.afterNativeFire({actor,args,nativeArgs:args,ok});return ok;};
  e.hurt=(t,amount,...ars)=>{const before=t?.hp,out=owner.hurtThrough(t,amount,a=>oldHurt(t,a,...ars));owner.nativeHurt(t,before,ars[1]);return out;};
  e.enemyAction=(...q)=>owner.bossTurn()?undefined:oldEnemy(...q);
  function project(){
   const p0=owner.project(),flags=p0?.flags;if(!flags)return null;
   const traversal=returnRoute?.(),complete=p0.complete&&(!returnRoute||!!traversal?.proof());
   const asked=!flags.column?'column':!flags.bossManifested?'threshold':flags.bossDead&&flags.nodeDead&&!flags.stake?'stake':
    p0.phase===3&&!flags.nodeDead&&!flags.ledgerSpent&&e.active?.cls==='occultist'?'ledger':null;
   const mark=asked?motifs[asked]:null;
   const hull=e.b.terrain.find(t=>t.id==='local-lower-08-body');
   const y=mark&&hull&&C.terrainSurface([hull],mark.x,2100,3555,Infinity)?.y;
   const hint=p0.failed?'동행의 몸을 지키지 못했습니다.':complete?'네 사람이 술법을 끊고 돌아왔습니다.':flags.stake?
    (traversal?.remaining()?`네 사람이 직접 서쪽 산문을 밟으십시오 · 남은 동행 ${traversal.remaining()}명`:'네 사람을 서쪽 산문 너머에 모으십시오.'):
    flags.bossDead&&!flags.nodeDead?'남은 확대 술법 유지점을 끊으십시오.':flags.nodeDead&&!flags.bossDead?'유지점이 끊겼습니다. 대도사를 쓰러뜨리십시오.':
    p0.phase===1?'접히는 사선을 피하고, 드러난 대도사를 치십시오.':p0.phase===2?'기울어진 바닥을 벗어나거나 담허의 진목으로 붙드십시오.':`유지점을 끊으십시오 · 저편 ${p0.charge}/3`;
   return {...p0,complete,objectiveReady:complete,summary:mark?.label??hint,
    targets:mark&&Number.isFinite(y)?[{kind:'route',id:asked,cls:mark.cls,x:mark.x,y,label:mark.label}]:[],
    skipReturn:flags.bossDead&&flags.nodeDead&&!complete};
  }
  function interact(id){
   const q=project(),a=q?.targets[0];if(!a||id&&id!==a.id||e.active?.cls!==a.cls)return {ok:false,reason:'이 자리의 확실한 행동이 없습니다.'};
   const ok=owner.interact(a.id);
   return {ok,reason:ok?undefined:'접지와 의식의 순서를 확인하십시오.'};
  }
  return Object.freeze({interact,tick:()=>owner.poll(++ticks),noncombatReturn:()=>owner.advanceReturn(),project,inspect:()=>owner.inspect(),terminal:()=>{
   const route=returnRoute?.()?.proof();if(returnRoute&&!route)return null;
   const r=owner.commit();return r&&{...r,guard:structuredClone(p.boundary.guard),association:structuredClone(p.boundary.association),...(route?{returnGate:route}:{})};
  }});
 }
 return Object.freeze({prepare,attach,sourceSHA});
}
