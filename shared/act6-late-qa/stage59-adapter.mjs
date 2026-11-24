import {createStage59Owner,STAGE59 as D} from './stage59-owner.mjs';
import {createStage59RolePaint} from './role-paint.mjs';
import {createFinaleSubtitle} from './finale-subtitles.mjs';
import {attachStage59Forepaw} from './stage59-forepaw-cue.mjs';
export const sourceSHA='01362a5a0cb9ecf889f7b95af4f57b7e6f1a55c15108258869e10579d69dcf77';
const crew=['archer','knight','occultist','mage'];
const guardIds=['local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay'];
const near='finale-cutout-near-body', high='finale-cutout-west-terrace', k=7800/2172;
const seats={archer:[391,high],knight:[847,near],occultist:[1520,near],mage:[1645,near]};
const roleSHA='fce44d58ea4471363c610eb0df91244203d72d1e8e311c3d9de1d263a771f2b2';
export const stage59=Object.freeze({id:59,act:6,actStage:9,previous:58,authoredId:D.authoredId,entry:crew,parked:[],exit:crew,parkedOnExit:[],
 requiresFlags:{'act6.daedosaStopped':true,'act6.innerRevisionReady':true,'act6.fourCorporealReturned':true},
 terminalFlags:{'act6.garmjinCompleted':true,'act6.finalThreatResolved':true},events:['interact','tick','nativeRelease','nativeImpact'],
 objective:D.objective,name:'무명사 마지막 마당',runtimeReleaseEnabled:false});
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),copy=structuredClone;
const hash=async v=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(n=>n.toString(16).padStart(2,'0')).join('');
const alive=u=>!!u&&u.hp>0&&u.dead!==true;
const safe=a=>a&&!a.training&&!a.debugMode&&!a.settings?.debug&&!a.embedded&&!a.customMap&&!a.workshopMode&&!globalThis.HONRO_EMBEDDED;
function typedGuard(cap){
 const {guard:g,association:a}=cap?.boundary??{},s=g?.spawn,t=g?.end;
 if(g?.ref!==guardIds[0]||g.anchor?.id!=='local-return-anchor-07'||g.anchor.host!=='local-lower-07-west'||g.anchor.x!==2028||
   g.anchor.r!==52||g.afterSide!==2||g.syntheticCombatRole!==false||!s||!t||!a?.seamReady||
   ![s,t].every(v=>v.id===g.ref&&v.ground===true&&v.support===g.anchor.host&&Number.isFinite(v.x)&&Number.isFinite(v.y))||
   s.x!==1712||Math.abs(t.x-g.anchor.x)>=g.anchor.r||t.x-s.x<=160||a.guard?.ref!==g.ref||!eq(a.guard,g))return null;
 return {proof:copy(g),guard:{anchor:g.anchor.id,ids:[...guardIds],observed:[g.ref],narrativeOnly:guardIds.slice(1)}};
}
export function stage59Adapter(G,{verifyPrevious,paint=false}={}){
 if(typeof verifyPrevious!=='function')throw TypeError('59 requires a private live Stage58 cap verifier');
 const presentations=new WeakMap();
 const C=G.HONRO_CORE,preparedSet=new WeakMap(),used=new WeakSet(), attached=new WeakSet(),spentCaps=new WeakSet();
 async function prepare({descriptor,packet,compiled,previous}={}){
  if(descriptor?.id!==59||descriptor.authoredId!==D.authoredId||descriptor.playSHA!==D.playSHA||descriptor.worldSHA!==D.worldSHA||
    packet?.map?.id!==D.authoredId||packet.map.units?.length!==0||packet.map.events?.length!==0||packet.map.objectives?.length!==0||
    previous?.stage!==58||previous.won!==true||previous.settlement!==false||!Object.keys(stage59.requiresFlags).every(v=>previous.flags?.[v]===true)||spentCaps.has(previous)||!verifyPrevious(previous))return null;
  const checked=typedGuard(previous);if(!checked)return null;
  if(await hash(compiled.terrain)!==D.playSHA||await hash(compiled.worldTerrain)!==D.worldSHA||await hash(packet.roles)!==roleSHA)return null;
  const full=previous.boundary.full, ids=new Set();
  const units=crew.map(cls=>{
   const o=full?.[cls], c=previous.crew?.[cls];
   if(!alive(o)||o.cls!==cls||o.side!==0||o.id!==c?.id||!Object.keys(c).every(key=>eq(c[key],o[key]))||ids.has(o.id))return null;
   ids.add(o.id);
   const [u,t]=seats[cls],x=u*k,y=C.topAt(compiled.terrain.find(p=>p.id===t),x);
   if(!Number.isFinite(y))return null;
   return {...copy(o),x,y,spawnX:x,spawnY:y,vx:0,vy:0,airborne:false,jumping:false,acted:false,fallApexY:undefined,moveLeft:o.maxMove};
  });
  if(units.some(u=>!u||!C.validTerrainContactPose(compiled.terrain,u)))return null;
  checked.guard.source=await hash({proof:checked.proof,authoredSilhouettes:checked.guard.narrativeOnly});
  const stock=new Map(packet.roles.map(row=>[row.kind,row]));
  let runtime=null;
  const mount=await createStage59Owner({C,packet:{terrain:compiled.terrain,world:compiled.worldTerrain},
   authorize:(app,e,key)=>runtime?.app===app&&runtime.e===e&&runtime.key===key,
   verifyIncoming:(app,e,key)=>runtime?.key===key&&runtime.app===app&&runtime.e===e?runtime.prev:null,
   createEnemy({engine,id,kind,x,y,facing}){
    const spec=stock.get(kind);if(!spec||spec.stockRef!==1)return null;
    const u=G.HonroUnits.create({id,kind,x,y,facing,team:'enemy',behavior:'aggressive'},engine.b,runtime.app.profile,G.HONRO_CONTENT.stages[0]);
    return u&&Object.keys(spec.spec).every(v=>eq(u[v],spec.spec[v]))?u:null;
   },paint:paint&&G.HonroMonsterVisual?createStage59RolePaint(G.HonroMonsterVisual):null});
  const out={units,reserved:[],story:stage59,previous,guard:copy(checked.guard)};
  const start=(app,e,key)=>{
   if(runtime)return null;
   runtime={app,e,key,prev:{profile:copy(app.profile),receipt:{stage:58,won:true,settlement:false,flags:copy(previous.flags),actors:crew.map(c=>copy(full[c]))},guard:copy(checked.guard)}};
   return mount(app,e,key);
  };
  preparedSet.set(out,start);return Object.freeze(out);
 }
 function attach({app,engine:e,prepared}={}){
  if(!safe(app)||!preparedSet.has(prepared)||used.has(prepared)||attached.has(e)||app.engine!==e||app.stageId!==59||spentCaps.has(prepared.previous)||!verifyPrevious(prepared.previous)||
    e.b.mode!=='act6-isolated'||e.b.honroCanonical!==true||e.b.honroMapOrigin!=='act6-qa'||e.b.honroCustom!==false)return null;
  const key=Object.freeze({}),owner=preparedSet.get(prepared)(app,e,key);
  if(!owner)return null;
  presentations.set(e,{app,owner,b:e.b,detach:null});
  used.add(prepared);spentCaps.add(prepared.previous);attached.add(e);
  const project=()=>owner.project();
  function interact(id){
   const choices=project()?.targets?.filter(t=>t.kind==='interaction')??[];
   const target=id?choices.find(t=>t.id===id):choices.find(t=>Math.abs(t.x-e.active?.x)<96);
   if(!target)return {ok:false,reason:'이 자리에서는 연결할 수 없습니다.'};
   const ok=owner.interact(target.id);return {ok,reason:ok?undefined:'자세와 연결 순서를 확인하십시오.'};
  }
  let issued=null, closed=null;
  return Object.freeze({project,interact,tick:owner.poll,inspect:owner.inspect,renderRole:owner.renderRole,
   terminal:()=>{
    if(issued)return null;
    const r=owner.terminal();
    if(!r)return null;
    closed=owner.physicalBoundary();
    if(!closed)return null;
    issued=Object.freeze({...r,next:Object.freeze({stage:60,identity:'live-four-same',noReward:true})});
    return issued;
   },
   boundaryProof(receipt){
    if(!issued||receipt!==issued||!closed||app.engine!==e||e.b.phase!=='won')return null;
    const raw=owner.physicalBoundary();
    return raw&&eq(raw,closed)?copy(raw):null;
   },
   dispose:owner.dispose});

 }
 function attachVisual(app,e,s){
  const v=presentations.get(e),b=e?.b;
  if(!v||v.app!==app||v.b!==b||v.detach||!safe(app)||app.scene!==s||app.engine!==e||app.stageId!==59||typeof s?.unitBody!=='function')return false;
  const body=s.unitBody;
  const owns=()=>v.b===e.b&&app.scene===s&&app.engine===e&&app.stageId===59&&safe(app);
  const styled=function(ctx,u,...args){
   if(this!==s||this.battle!==b||!owns()||!b.units.includes(u)||!v.owner.renderRole(ctx,s,u))return body.call(this,ctx,u,...args);
  };
  s.unitBody=styled;
  const clear=createFinaleSubtitle(s,e,owns,()=>{
   const aftermath=b.honroState?.localReturnGuardAftermath;
   if(aftermath?.seenBy==='p-knight'&&aftermath.anchor==='local-return-anchor-07'&&e.unit(aftermath.seenBy)?.hp>0)
    return {id:'59-aftermath',speaker:'휘겸',text:'길은 남겼군.'};
   return null;
  });
  const paw=attachStage59Forepaw({G,app,e,scene:s,owner:v.owner,owns});
  v.detach=()=>{if(s.unitBody!==styled||!clear())return false;paw?.detach();s.unitBody=body;return true;};return true;
 }
 function detachVisual(app,e){const v=presentations.get(e);if(!v||v.app!==app||!v.detach?.())return false;v.detach=null;return true;}
 return Object.freeze({prepare,attach,attachVisual,detachVisual,sourceSHA});
}
