import {createStage58Owner} from './stage58-owner.mjs';
import {createStage58Visual} from './stage58-visual.mjs';
import {createFinaleSubtitle} from './finale-subtitles.mjs';
import {attachStage58Camera} from './stage58-camera.mjs';
export const sourceSHA='eba509f70ad39813b0d3057ce6e16dcb1c04b38c13e6e2d2998f34c95d7921ed';
export const stage58=Object.freeze({id:58,act:6,actStage:8,previous:57,authoredId:'stage-58',
 entry:['mage','archer','knight','occultist'],parked:[],exit:['mage','archer','knight','occultist'],parkedOnExit:[],
 requiresFlags:{'act6.fourCorporealJoined':true,'act6.fallbackRelaySecured':true},
 terminalFlags:{'act6.daedosaStopped':true,'act6.innerRevisionReady':true,'act6.fourCorporealReturned':true},
 events:['interact','tick','nativeRelease','nativeImpact','noncombatReturn'],
 objective:'act6-daedosa-revision',name:'대도사 앞 네 사람',runtimeReleaseEnabled:false});
const reference=[
 ['a6-c08-boss',4480,1350,146,35,1],
 ['a6-c08-expansion-node',4896,260,110,48,1],
 ['a6-c08-unsettled-ledger',5144,1200,105,21,2],
 ['a6-c08-margin-echo',5708,850,105,21,2]
];
const keys=['id','cls','hp','maxHp','focus','maxFocus','shield','h','r','loadout','level','ranks','tune','equipmentState','dead','attack','armor','maxMove','walkSpeed','regen'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const safe=app=>!app.training&&!app.debugMode&&!app.embedded&&!app.customMap&&!app.workshopMode&&!globalThis.HONRO_EMBEDDED;
const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(b))))].map(n=>n.toString(16).padStart(2,'0')).join('');
const motifs={
 column:{cls:'occultist',x:3496,label:'소단으로 첫 기둥의 술식을 바로잡으십시오.'},
 threshold:{cls:'mage',x:3680,label:'담허로 문턱 안쪽의 답을 확인하십시오.'},
 ledger:{cls:'occultist',x:4464,label:'소단으로 장부의 먹선을 끊을 수 있습니다.'},
 stake:{cls:'mage',x:3680,label:'담허로 수정 진목을 놓으십시오.'}
};
export function stage58Adapter(G){
 const C=G.HONRO_CORE,attached=new WeakSet(), presentation=new WeakMap();
 const visual=G.HonroVectorParts?.create?createStage58Visual({vectorParts:G.HonroVectorParts,authorize:({scene,engine,battle,permit})=>{
  const a=presentation.get(engine);return !!a&&a.permit===permit&&a.scene===scene&&a.b===battle&&a.app.scene===scene&&a.app.engine===engine&&a.app.stageId===58&&safe(a.app);
 }}):null;
 async function prepare({descriptor,packet,compiled,previous}){
  if(descriptor.id!==58||descriptor.authoredId!=='stage-58'||packet.map.units.length||previous?.stage!==57||previous.won!==true||previous.settlement!==false||
     !Object.keys(stage58.requiresFlags).every(k=>previous.flags?.[k]===true))return null;
  const cap=previous.boundary, {full,receiving,guard,association}=cap??{};
  if(!full||!receiving||guard?.ref!=='local-07-gwakjin-return-keeper'||association?.seamReady!==true)return null;
  for(const cls of stage58.entry){
   const actor=full[cls],carry=previous.crew[cls],site=receiving[cls];
   if(!actor||actor.cls!==cls||actor.dead||actor.hp<=0||!site||![site.x,site.y].every(Number.isFinite)||
      !keys.every(k=>eq(actor[k],carry?.[k])))return null;
  }
  if(!eq(packet.roles.map(u=>[u.id,u.x,u.hp,u.h,u.r,u.side]),reference))return null;
  if(await hash(compiled.terrain)!==descriptor.playSHA||await hash(compiled.worldTerrain)!==descriptor.worldSHA)return null;
  const units=stage58.entry.map(cls=>{
   const {x,y}=receiving[cls],u=structuredClone(full[cls]);
   Object.assign(u,{x,y,spawnX:x,spawnY:y,vx:0,vy:0,airborne:false,jumping:false,acted:false,fallApexY:undefined,moveTarget:undefined,moveLeft:u.maxMove});
   return u;
  });
  const reserved=packet.roles.map(u=>C.makeUnit(u.cls,u.side,u.x,u.y,{...structuredClone(u),spawnX:u.x,spawnY:u.y,airborne:false,jumping:false,vx:0,vy:0}));
  if([...units,...reserved].some(u=>!C.validTerrainContactPose(compiled.terrain,u)))return null;
  return Object.freeze({units,reserved,story:stage58,previous,full,receiving,
   fingerprint:value=>eq(value,compiled.terrain)?descriptor.playSHA:eq(value,compiled.worldTerrain)?descriptor.worldSHA:null});
 }
 function attach({app,engine:e,prepared}){
  if(!safe(app)||attached.has(e)||prepared.units.length!==4||!eq(e.b.units.map(u=>u.id),prepared.units.map(u=>u.id)))return null;
  const p=prepared.previous, carried=app.profile, e0=e;
  const activation=Object.freeze({enabled:true,integerStageKey:58,debug:false,embedded:false,training:false,custom:false});
  const proof=Object.freeze({});
  const prev={stage:57,won:true,flags:p.flags,actors:stage58.entry.map(k=>prepared.full[k]),receiving:prepared.receiving,profile:structuredClone(carried)};
  const mount=createStage58Owner({C,fingerprint:prepared.fingerprint,
   authorize:({engine,activation:a})=>a===activation&&e0===engine&&app.engine===e0&&safe(app),
   preview:(a,eng)=>a===activation&&eng===e0,
   readPrevious:(q,eng)=>q===proof&&eng===e0?prev:null});
  const owner=mount({engine:e,activation,previous:proof,carriedProfile:carried,reserved:prepared.reserved});
  if(!owner.accepted)return null;
  attached.add(e);presentation.set(e,{app,b:e.b,roles:prepared.reserved,four:prepared.units,permit:Object.freeze({}),scene:null,clear:null});let ticks=0;
  const oldFire=e.fire.bind(e),oldHurt=e.hurt.bind(e),oldImpact=e.impact.bind(e), body=()=>prepared.units.map(u=>[u.id,u.hp,u.focus,u.shield]);
  e.fire=(...args)=>{const actor=e.active, nativeArgs=owner.nativeFireArgs(args), ok=oldFire(...nativeArgs);owner.afterNativeFire({actor,args,nativeArgs,ok});return ok;};
  e.hurt=(t,...ars)=>{const before=t?.hp,out=oldHurt(t,...ars);owner.nativeHurt(t,before,ars[1]);return out;};
  e.impact=(p,h)=>{const before=body(),out=oldImpact(p,h);owner.nativeImpact(p,h,before,body());return out;};
  function project(){
   const p0=owner.project(),flags=p0?.flags;if(!flags)return null;
   const asked=!flags.column?'column':!flags.bossManifested?'threshold':flags.bossDead&&flags.nodeDead&&!flags.stake?'stake':
    p0.phase===3&&!flags.nodeDead&&!e.b.honroState.flags.localLedgerCounterSpent&&e.active?.cls==='occultist'?'ledger':null;
   const mark=asked?motifs[asked]:null;
   const y=mark&&e.contactSurface(mark.x,2100,3555)?.y;
   return {...p0,summary:mark?.label??(p0.failed?'동행의 몸을 지키지 못했습니다.':p0.complete?'네 사람이 술법을 끊고 돌아왔습니다.':flags.stake?'네 사람이 직접 서쪽 문으로 돌아오십시오.':'대도사와 술법 유지점을 가로막으십시오.'),
    targets:mark&&Number.isFinite(y)?[{kind:'route',id:asked,cls:mark.cls,x:mark.x,y,label:mark.label}]:[],
    skipReturn:flags.bossDead&&flags.nodeDead&&!p0.complete};
  }
  function interact(id){
   const q=project(),a=q?.targets[0];if(!a||id&&id!==a.id||e.active?.cls!==a.cls)return {ok:false,reason:'이 자리의 확실한 행동이 없습니다.'};
   const ok=owner.interact(a.id);
   return {ok,reason:ok?undefined:'접지와 의식의 순서를 확인하십시오.'};
  }
  return Object.freeze({interact,tick:()=>owner.poll(++ticks),noncombatReturn:()=>owner.advanceReturn(),project,terminal:()=>{const r=owner.commit();return r&&{...r,guard:structuredClone(p.boundary.guard),association:structuredClone(p.boundary.association)};}});
 }
 function attachVisual(app,e,scene){
  const a=presentation.get(e);
  if(!visual||!a||a.app!==app||a.scene||app.engine!==e||app.scene!==scene||a.b!==e?.b||!safe(app))return false;
  a.scene=scene;
  if(!visual.attach({scene,engine:e,permit:a.permit,roles:a.roles})){a.scene=null;return false;}
  a.clear=createFinaleSubtitle(scene,e,()=>app.scene===scene&&app.engine===e&&safe(app),()=>{
   const [boss,node]=a.roles,b=a.b,f=b.honroState?.flags;
   if(!f?.localBossManifested||!f.localColumnSealAligned||!f.localThresholdGravityNormalized||!b.units.includes(boss)||boss.dead)return null;
   if(b.honroMarkers?.some(m=>m.id==='local-08-expansion-line-show')&&b.units.includes(node)&&node.hp>0)
    return {id:'58-warning',speaker:'담허',text:'술기가 여기 꽂혔군. 이 자리를 벗어나야겠어.'};
   return {id:'58-manifest',speaker:'대도사',text:'자네가 현묵의 법을 쓰는가.'};
  });
  a.camera=attachStage58Camera(G,scene,e,a.roles,a.four,()=>app.scene===scene&&app.engine===e&&app.stageId===58&&safe(app));
  return true;
 }
 function detachVisual(app,e){
  const a=presentation.get(e);
  if(!visual||!a?.scene||a.app!==app||(a.camera&&!a.camera())||!a.clear()||!visual.detach(a.scene))return false;
  a.scene=null;return true;
 }
 return Object.freeze({prepare,attach,attachVisual,detachVisual,sourceSHA});
}
