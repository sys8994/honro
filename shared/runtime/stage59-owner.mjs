import {mountNativeObservation,nativeFacts} from './native-bind.mjs';
import {buildStrip,contacts} from './strip.mjs';
const k=7800/2172, near='finale-cutout-near-body', high='finale-cutout-west-terrace';
export const STAGE59=Object.freeze({id:59,authoredId:'stage-59',objective:'act6-final-courtyard',width:7800,height:4700,
 playSHA:'a2f2d75d9cfbd3611c22097f6b9c5ada5c2e6c2f903a844f4c0624327510d75d',worldSHA:'3d5ddd7dbe0b5d2087ca868b391bbaaf368f390e0c2cb77c5d3d015a81f112e3'});
const seats={archer:[391,high],knight:[847,near],occultist:[1520,near],mage:[1645,near]};
const special={bridge:['qa-immediate-bridge-threat','warden',1120,near],cliff:['qa-upper-ridge-leaper','mourner',621,high],bell:['qa-bell-shade','shade',1540,near]};
const traces=['local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay'];
const auth=['act6.garmjinCompleted','act6.finalThreatResolved'];
// The four forward groups on each wing contest the anchors. Later groups reinforce a
// stalled line until the garmjin is joined. Leaving the field is a physical retreat.
export const FRONTS59=Object.freeze({
 perFrontCap:6,totalCap:14,soften:{hp:.85,attack:.75},warn:1,period:2,forward:630,rear:340,breachLimit:3,guard:260,anchorGroups:4,
 posts:[{id:'west-cleat',x:522*7800/2172,label:'서쪽 지지석',radius:170},{id:'bell-path',x:1490*7800/2172,label:'종터 혼길',radius:170}],
 fronts:[
  {id:'west-return',dir:1,offset:2,line:'서쪽 높은 단과 아래 퇴각 경로로 원혼이 맺힙니다.',squads:[
   [['lead','mourner',430,'high'],['lower','shade',505,'near'],['rear','mourner',366,'high']],
   [['lead','mourner',565,'near'],['knot','shade',452,'high'],['rear','mourner',465,'near']],
   [['lead','mourner',392,'high'],['lower','mourner',595,'near']],
   [['lead','shade',510,'high'],['lower','mourner',555,'near'],['rear','mourner',420,'high']],
   [['heavy','warden',300,'near'],['lead','mourner',340,'high']],
   [['lead','mourner',330,'near'],['knot','shade',290,'high'],['rear','mourner',260,'near']]]},
  {id:'east-fault',dir:-1,offset:3,line:'동쪽 파열의 낮은 굽이와 암반 이음에서 원혼이 밀려 나옵니다.',squads:[
   [['lead','mourner',1720,'near'],['knot','shade',1805,'near'],['rear','mourner',1860,'near']],
   [['lead','mourner',1660,'near'],['knot','shade',1730,'near'],['rear','shade',1880,'near']],
   [['lead','mourner',1760,'near'],['rear','mourner',1852,'near']],
   [['lead','shade',1690,'near'],['rear','mourner',1820,'near']],
   [['heavy','warden',1900,'near'],['lead','mourner',1820,'near']],
   [['lead','mourner',1800,'near'],['knot','shade',1870,'near'],['rear','mourner',1990,'near']],
   [['lead','shade',1830,'near'],['rear','mourner',2010,'near']]]}
 ]});
const sentries59=[
 ['west-ledge','mourner',323,high],['west-talus','shade',361,near],['west-bank','warden',485,near],
 ['west-turn','mourner',583,high],['bridge-foot','mourner',740,near],
 ['east-bell','shade',1585,near],['east-bend','mourner',1790,near],
 ['east-stone','shade',1860,near],['east-ward','warden',1960,near]
];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b), copy=structuredClone;
const alive=u=>u&&Number.isFinite(u.hp)&&u.hp>0&&!u.dead;
const down=u=>u?.hp===0&&u.dead===true;
const entryDelta=new Set(['x','y','spawnX','spawnY','vx','vy','airborne','jumping','acted','fallApexY','moveLeft']);
const bornSame=(a,b)=>[...new Set([...Object.keys(a),...Object.keys(b)])].every(key=>entryDelta.has(key)||eq(a[key],b[key]));
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const mounted=new WeakSet();
export async function createStage59Owner({C,packet,authorize,verifyIncoming,createEnemy,normalBudget=()=>false,paint=null}){
 if(!C?.Engine||![authorize,verifyIncoming,createEnemy].every(x=>typeof x==='function')||(paint!==null&&typeof paint!=='function'))throw TypeError('trusted host required');
 const p=JSON.stringify(packet?.terrain),w=JSON.stringify(packet?.world);
 if(!Array.isArray(packet?.terrain)||!Array.isArray(packet?.world)||await sha(p)!==STAGE59.playSHA||await sha(w)!==STAGE59.worldSHA)throw Error('59 terrain hash mismatch');
 return function mount(app,e,activation){
  const b=e?.b, d=STAGE59, s=app?.stage;
  if(!(e instanceof C.Engine)||mounted.has(e)||e!==app?.engine||app.stageId!==59||s?.id!==59||s?.objective!==d.objective||!authorize(app,e,activation)||app.debugMode||app.settings?.debug||app.training||app.embedded||app.workshopMode||app.customMap)return (console.log('native59 deny 28'),null);
  if(b?.stage!==59||b.stageId!==59||b.honroStage!==59||b.honroAuthoredId!==d.authoredId||b.honroCustom!==false||(b.honroGrowth&&!(b.mode==='campaign'&&normalBudget(app,e,activation)===true))||b.honroJourneyReplay||!['act6-qa','campaign'].includes(b.honroMapOrigin)||!['scripted','campaign','act6-isolated'].includes(b.mode)||b.phase!=='aim'||b.round!==1||b.side!==0||b.shot!==0||b.width!==d.width||b.height!==d.height||JSON.stringify(b.terrain)!==p||JSON.stringify(b.honroWorldTerrain)!==w||b.projectiles.length||b.units.some(x=>x.side===1)||b.honroState?.localFinaleEdgeWave||b.honroState?.localReturnGuardAftermath)return (console.log('native59 deny 29'),null);
  const prev=verifyIncoming(app,e,activation), receipt=prev?.receipt, held=prev?.guard;
  if(receipt?.stage!==58||receipt.won!==true||receipt.flags?.['act6.innerRevisionReady']!==true||receipt.flags?.['act6.daedosaStopped']!==true||receipt.settlement!==false||!Array.isArray(receipt.actors)||receipt.actors.length!==4||held?.anchor!=='local-return-anchor-07'||held.ids?.length!==3||!traces.every(i=>held.ids.includes(i)&&!e.unit(i))||!held.source||!eq(prev.profile,app.profile)||(receipt.profile&&!eq(receipt.profile,prev.profile)))return (console.log('native59 deny 31'),null);
  const terrain=b.terrain,world=b.honroWorldTerrain,profileCopy=JSON.stringify(app.profile);
  const units=b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly), actor=Object.fromEntries(units.map(u=>[u.cls,u]));
  const grounded=(u,id)=>alive(u)&&e.grounded(u)&&C.validTerrainContactPose(b.terrain,u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id===id;
  if(units.length!==4||new Set(units.map(u=>u.id)).size!==4||Object.entries(seats).some(([cls,[x,t]])=>{
   const u=actor[cls], a=receipt.actors.find(v=>v.cls===cls);
   return !a||!u||a.id!==u.id||!alive(a)||u.acted||!bornSame(a,u)||Math.abs(u.x-x*k)>.001||!grounded(u,t);
  }))return (console.log('native59 deny 38'),null);
  const current=()=>e===app.engine&&e.b===b&&app.stage===s&&app.stageId===59&&b.terrain===terrain&&b.honroWorldTerrain===world&&(!b.honroGrowth||normalBudget(app,e,activation)===true)&&JSON.stringify(app.profile)===profileCopy&&units.every(u=>e.unit(u.id)===u);
  const active=()=>current()&&!b.honroReturnGatePending&&!['won','lost','transition'].includes(b.phase);
  const local=(u,x,t,r=96)=>grounded(u,t)&&Math.abs(u.x-x*k)<r&&Math.abs(u.y-C.topAt(terrain.find(a=>a.id===t),x*k))<150;
  const isActor=(u)=>b.side===0&&e.canAct()&&e.active===u&&alive(u);
  const log=[], waves={epoch:null,rounds:[],withdrawals:[],closed:false}, walks=new Map();
  let everDisposed=false, terminalIssued=false;
  const state={retreat:false,cliff:false,bridge:false,bell:false,soul:false,mage:false,forepaw:null,activated:false,cleared:false};
  let waited=null, upper=null, bell=null, warning=null, clash=null,witness=null,retreatOrder=null;
  function note(kind,detail={}){log.push({kind,round:b.round,...detail});}
  function reserve([id,kind,u,t]){
   if(e.unit(id))return (console.log('native59 deny 49'),null);
   const x=u*k,y=C.topAt(terrain.find(a=>a.id===t),x);
   const v=createEnemy({app,engine:e,id,kind,x,y,terrain:t,facing:t===high||u>1050?-1:1});
   if(!v||v.id!==id||v.honroType!==kind||v.side!==1||!alive(v)||v.x!==x||v.y!==y||v.loadout?.includes('A01')||!grounded(v,t)||e.unit(id))return (console.log('native59 deny 52'),null);
   return v;
  }
  const threat=reserve(special.bridge);
  if(!threat||threat.fixed||!threat.loadout?.includes('HWD01'))return (console.log('native59 deny 56'),null);
  const sentries=sentries59.map(([name,kind,x,support])=>reserve(['finale-first-'+name,kind,x,support]));
  if(sentries.some(u=>!u))return null;
  threat.honroRigAsset='gate_armor';threat.name='교각의 문턱 꼭두';
  const origin=threat.x; const add=v=>b.units.push(v);add(threat);
  const repelled=()=>retreatOrder!==null&&retreatOrder.walked>0&&grounded(threat,near)&&threat.x-retreatOrder.from>=240&&threat.x-witness.x>=500;
  const resolved=()=>down(threat)||repelled();
  const fronts=FRONTS59.fronts.map(f=>({...f,next:0,warned:null,held:0,spawned:0}));
  let breach=0,breachRound=null,recoverRound=null,giant=null,giantGuard=null,giantAttack=null,lostReason=null;
  const frontAlive=f=>[...walks.values()].filter(z=>z.front===f&&alive(z.unit)&&!z.departed&&z.wave).length;
  const bothApproaches=()=>fronts.every(f=>f.next>=FRONTS59.anchorGroups);
  const canJoin=()=>state.mage&&state.cliff&&state.bridge&&state.soul&&state.bell&&state.forepaw&&bothApproaches();
  const localCrowd=(x,y,range)=>b.units.some(u=>alive(u)&&Math.hypot(u.x-x,(u.y-y)*.9)<range);
  function track(unit,front,t,cap=0,wave=null,delay=0){
   walks.set(unit.id,{unit,front,t,cap,wave,delay,start:unit.x,ticks:0,walked:0,steps:0});
  }
  function retreat(a,reason){
   if(a.out||a.departed||!alive(a.unit))return;
   const dir=-a.front.dir,from=a.unit.x;
   const target=dir<0?Math.max(a.t===high?145:32,Math.min(a.start-130,from-310)):
    Math.min(b.width-40,Math.max(a.start+130,from+310));
   a.out={id:a.unit.id,front:a.front.id,from,target,dir,reason,round:b.round,distance:0};
   waves.withdrawals.push(a.out);
   note('wing-withdrawing',{id:a.unit.id,front:a.front.id,reason,x:from,target});
   e.fx('ring',from,a.unit.y-a.unit.h*.45,'#91b8b8',28);
  }
  function answerForepaw(reason,details){
   if(state.forepaw||!alive(giant))return;
   state.forepaw=reason;note('forepaw-answered',{id:giant.id,reason,...details});
   e.message(reason==='guard'?'휘겸: 앞발을 받아냈다. 놈이 교각에서 물러난다.':'혼류의 앞발이 물러납니다. 두 전선의 지지점을 확보하십시오.');
   retreat(walks.get(giant.id),reason);
  }
  const enemyAlive=()=>b.units.filter(u=>u.side===1&&alive(u)).length;
  let opening=false;
  function openFronts(){
   if(opening)return;
   opening=true;
   for(const [i,u] of sentries.entries()){
    u.hp=u.maxHp=Math.round(u.maxHp*(u.honroType==='warden'?.45:.55));
    u.attack*=.65;
    u.group=640+b.units.length;
    u.honroRigAsset=u.honroType==='warden'?'gate_armor':'wonhon';
    add(u);track(u,fronts[i<5?0:1],sentries59[i][3]);
   }
   e.refreshActivation();note('opening-sentries',{ids:sentries.map(u=>u.id)});
  }
  function wave(){
   if(!state.retreat||state.cleared||waves.closed||b.side!==0)return;
   const round=b.teamEnds[1]+1;
   if(waves.epoch===null){waves.epoch=round;return;}
   const order=round%2===0?[fronts[1],fronts[0]]:fronts;
   for(const f of order){
    if(f.next>=f.squads.length)continue;
    const due=waves.epoch+f.offset+f.next*FRONTS59.period;
    if(round<due-FRONTS59.warn)continue;
    const key=f.id+'#'+f.next;
    if(f.warned!==key){f.warned=key;b.honroState.localFinaleIncoming={front:f.id,squad:f.next,round:due,line:f.line};e.message(f.line);note('front-warned',{front:f.id,squad:f.next,due});}
    if(round<due||waves.rounds.some(o=>o.round===round&&o.front===f.id&&o.action==='spawn'))continue;
    f.left??=f.squads[f.next].slice();
    const otherWaiting=fronts.some(z=>z!==f&&z.spawned===0);
    const reserved=Number(!bell)+Number(!giant)+Number(otherWaiting);
    const room=Math.min(FRONTS59.perFrontCap-frontAlive(f),FRONTS59.totalCap-enemyAlive()-reserved);
    if(room<=0){
     if(!waves.rounds.some(o=>o.round===round&&o.front===f.id)){
      f.held++;waves.rounds.push({round,action:'held',front:f.id,squad:f.next,live:enemyAlive(),reserved});
     }
     continue;
    }
    const cap=frontAlive(f)>=2?FRONTS59.rear:FRONTS59.forward,id='finale-'+f.id+'-s'+f.next+'-r'+round,picked=[];
    for(const [suffix,kind,x,face] of f.left){
     if(picked.length>=room)break;
     const t=face==='high'?high:near,support=terrain.find(row=>row.id===t);
     const offsets=[0,-f.dir*27,f.dir*27,-f.dir*58,f.dir*58];
     const seat=offsets.map(offset=>x+offset).find(u=>u*k>support.x+36&&u*k<support.x+support.w-36&&
       !localCrowd(u*k,C.topAt(support,u*k),58)&&picked.every(({v})=>Math.abs(v.x-u*k)>62));
     if(seat===undefined)continue;
     const v=reserve([id+'-'+suffix,kind,seat,t]);
     if(!v)continue;
     // Courtyard bodies are knotted fragments of the dead, lighter than a whole possessed body.
     if(kind!=='warden'){v.maxHp=v.hp=Math.round(v.maxHp*FRONTS59.soften.hp);v.attack*=FRONTS59.soften.attack;v.honroRigAsset='wonhon';v.name=kind==='shade'?'맺힌 원혼':'넘쳐온 원혼';}else{v.name='문턱 꼭두';v.armor=Math.max(v.armor,.2);v.honroRigAsset='gate_armor';}
     picked.push({v,t,suffix});
    }
    if(!picked.length){
     if(!waves.rounds.some(o=>o.round===round&&o.front===f.id)){
      waves.rounds.push({round,action:'approach-occupied',front:f.id,squad:f.next,sites:f.left.map(([name,,x,t])=>[name,x*k,t])});
     }
     continue;
    }
    const want={round,action:'spawn',front:f.id,squad:f.next,line:f.line,id,cap,squadActors:picked.map(({v,t})=>({id:v.id,kind:v.honroType,entry:[v.x,v.y],deck:t}))};
    for(const [i,{v,t}] of picked.entries()){add(v);track(v,f,t,cap+i*40,want,i*7);}
    f.left=f.left.filter(([suffix])=>!picked.some(row=>row.suffix===suffix));
    b.honroState.localFinaleFront={id:f.id,actors:copy(want.squadActors),round,type:'tangible-squad',line:f.line};delete b.honroState.localFinaleIncoming;
    waves.rounds.push(want);f.spawned+=picked.length;if(!f.left.length){f.next++;f.left=null;}note('wave-spawn',{front:f.id,count:picked.length,cap});
   }
   // Keep a berth for the real forepaw even while the two wings are full.
   if(!giant&&enemyAlive()<FRONTS59.totalCap-Number(!bell)&&fronts.every(f=>f.spawned>0)){
    const v=reserve(['finale-giant-forepaw','warden',1180,near]);
    if(v){Object.assign(v,{name:'혼류의 앞발',honroRigAsset:'forepaw',maxHp:Math.round(v.maxHp*2.6),hp:Math.round(v.maxHp*2.6),armor:Math.max(v.armor,.18),h:Math.round(v.h*1.9),r:Math.round(v.r*1.8)});
     if(!grounded(v,near)||localCrowd(v.x,v.y,v.r+32))return;
     giant=v;add(v);track(v,fronts[1],near);e.refreshActivation();e.message('교각 아래에서 앞발이 올라옵니다. 휘겸은 교각을 지키고, 나머지는 앞발을 쳐서 물리치십시오.');
     note('giant-arrived',{id:v.id,hp:v.hp,x:v.x,y:v.y,support:near});}
   }
  }
  // Posts: enemies standing on a post at the end of their side's turn break it; a cleared
  // round mends one. Three breaks lose the courtyard.
  const pressed=new Map();
  function posts(){
   // Once the corrected garmjin holds, the outer anchors are part of it; only the pier remains.
   if(!state.retreat||state.cleared||state.activated)return;
   const e1=b.teamEnds[1],e0=b.teamEnds[0];
   if(b.side===0&&breachRound!==e1){breachRound=e1;
    for(const p of FRONTS59.posts){const v=b.units.find(u=>u.side===1&&alive(u)&&Math.abs(u.x-p.x)<p.radius),held=units.some(u=>alive(u)&&Math.abs(u.x-p.x)<FRONTS59.guard);
     if(!v||held){pressed.delete(p.id);continue;}
     if(!pressed.has(p.id)){pressed.set(p.id,e1);note('post-pressed',{post:p.id,by:v.id});e.message(`${p.label}이 밀립니다 · 한 번 더 비우면 무너집니다`);continue;}
     breach++;pressed.delete(p.id);note('post-broken',{post:p.id,by:v.id,breach});e.message(`${p.label}이 무너졌습니다 · 붕괴 ${breach}/${FRONTS59.breachLimit}`);}
    if(breach>=FRONTS59.breachLimit&&!lostReason){lostReason='posts-overrun';note('posts-overrun',{breach});}
   }
   if(b.side===1&&recoverRound!==e0){recoverRound=e0;
    if(breach>0&&FRONTS59.posts.every(p=>!b.units.some(u=>u.side===1&&alive(u)&&Math.abs(u.x-p.x)<p.radius*1.9))){breach--;note('post-mended',{breach});}
   }
  }
  function poll(){
   if(!active())return false;
   openFronts();
   if(!state.retreat&&local(actor.knight,900,near)){
    upper=reserve(special.cliff);if(!upper)return false;
    let strip;try{strip=buildStrip(e,C);}catch{return false;}
    state.retreat=true;add(upper);
    const anchorX=900*k,poses=traces.map((id,i)=>{const x=anchorX+[-23,11,24][i]*k;return {id,x,y:C.topAt(terrain[0],x),support:near,collides:false,damageable:false,targetable:false,awards:false,addUnit:false};});
    b.honroState.localReturnGuardAftermath={anchor:held.anchor,source:held.source,seenBy:actor.knight.id,poses};
    warning={status:'armed',strip,turn:b.turn,x:actor.knight.x,y:actor.knight.y-actor.knight.h*.48};
    b.honroState.localFinaleGiantTelegraph={kind:'real local sweep strip',id:'terrain-following-forepaw-01',...copy(warning)};
    e.message('휘겸: 곽진… 끝까지 문을 등지고 섰군.');e.message('소단: 아직 따뜻해요. 여기서 막아 준 거예요.');
    e.message('교각 아래로 앞발이 내려옵니다. 서쪽으로 비키거나 위쪽 지지석을 맞히십시오.');e.message('설오: 서쪽 높은 단에도 올라옵니다. 저쪽은 제가 맡겠습니다.');
    witness={id:actor.knight.id,x:actor.knight.x,y:actor.knight.y,support:near,grounded:true};
    note('retreat-and-forepaw',{actor:actor.knight.id,guards:poses.map(v=>v.id),witness});
   }
   if(state.retreat&&!bell&&Math.abs(actor.archer.x-462*k)<170&&grounded(actor.archer,high)){
    bell=reserve(special.bell);if(bell){bell.maxHp=bell.hp=Math.round(bell.maxHp*.5);add(bell);note('bell-shade-arrived');}
   }
   // Fix (2026-11-25): if any hero brings the bell shade down, the bell is clear; before this a
   // kill by someone other than Sodan left the soul-path objective permanently unreachable.
   if(bell&&!state.bell&&down(bell)){state.bell=true;note('bell-pressure-neutralized-by-party');}
   if(soulPending&&b.side===0&&b.teamEnds[1]>soulPending.end){
    if(local(actor.occultist,1490,near)){state.soul=true;soulPending=null;note('soul-route-restored',{actor:actor.occultist.id});e.message('소단: 떠날 혼이 지나갈 길이 남았어요.');}
    else{soulPending=null;note('soul-route-lost');e.message('소단: 자리를 비워서 표식이 흐려졌어요. 다시 그어야 해요.');}
   }
   if(waited!==null&&b.side===0&&b.teamEnds[1]>waited){state.bridge=true;waited=null;note('bridge-defended',{actor:actor.knight.id});}
   if(giantGuard!==null&&giantAttack!==null&&giantAttack>=giantGuard&&b.side===0&&b.teamEnds[1]>giantGuard){
    answerForepaw('guard',{actor:actor.knight.id,attackRound:giantAttack+1});
   }
   if(state.cleared)return true;
   state.cleared=state.activated&&resolved();
   if(state.cleared){waves.closed=true;e.message('설오: 올라오던 것들이 멈췄습니다.');e.message('휘겸: 길은 남겼군.');note('final-threat-resolved',{actor:threat.id,dead:down(threat),distance:threat.x-origin,retreat:retreatOrder&&{...retreatOrder}});}
   posts();wave();
   b.honroState.localFinaleProgress={...copy(state),soulPending:!!soulPending,breach,breachLimit:FRONTS59.breachLimit,lost:lostReason,fronts:fronts.map(f=>({id:f.id,next:f.next,of:f.squads.length,held:f.held,alive:frontAlive(f),spawned:f.spawned})),giant:giant?{id:giant.id,alive:alive(giant)&&!walks.get(giant.id).departed,attackRound:giantAttack===null?null:giantAttack+1}:null,approachesSecured:bothApproaches()};
   return state.cleared;
  }
  // Revision 2: each outer anchor takes two true hits on different rounds, and the soul path
  // holds only if Sodan keeps her ground through one enemy turn after marking it.
  const anchorRounds={cliff:[],fault:[]};
  function anchorHit(id){const r=anchorRounds[id];if(!r.includes(b.round))r.push(b.round);if(r.length<2){e.message(id==='cliff'?'설오: 한 번 더 맞혀야 지지석이 버팁니다.':'담허: 한 번 더 박아야 파열이 닫히겠네.');note(id+'-first-hit');return false;}return true;}
  let soulPending=null;
  function proveDefend(u,base){
   const end=b.teamEnds[1],turn=b.turn,answering=active()&&warning?.status==='armed'&&u?.side===0&&e.canAct();
   const possible=active()&&state.retreat&&!state.bridge&&waited===null&&u===actor.knight&&isActor(u)&&local(u,958,near);
   const braces=active()&&giant&&!state.forepaw&&u===actor.knight&&isActor(u)&&local(u,958,near,140);
   const res=base();
   const spent=b.turn!==turn||e.active!==u||!e.canAct()||u.acted;
   if(possible&&spent){waited=end;note('actual-guard-input',{actor:u.id});}
   if(braces&&spent){giantGuard=end;note('forepaw-brace',{actor:u.id,x:u.x,y:u.y});}
   if(answering&&(b.teamEnds[1]!==end||spent))warning.responded=true;
   return res;
  }
  b.honroState.localFinaleEdgeWave=waves;
  const instance=mountNativeObservation({app,engine:e,packet:{id:59},hooks:{
   afterOwnerMounted:()=>true,
   atImpact(a,g,p,h){
    if(!state.retreat||!active())return;const f=nativeFacts(g,p);
    if(!state.cliff&&f?.owner===actor.archer.id&&f.skill==='A01'&&h.terrain?.id===high&&Math.hypot(h.x-522*k,h.y-1871.8947026324342)<=38&&anchorHit('cliff')){
     state.cliff=true;note('cliff-restored',{shot:f.shot,x:h.x,y:h.y});e.message('설오: 지지석이 박혔습니다.');
     if(warning?.status==='armed'){warning.status='interrupted';delete b.honroState.localFinaleGiantTelegraph;note('forepaw-interrupted',{shot:f.shot});}
    }
    if(!state.mage&&f?.owner===actor.mage.id&&f.skill==='M01'&&h.terrain?.id===near&&Math.hypot(h.x-1710*k,h.y-2291.3294746996403)<=32&&anchorHit('fault')){state.mage=true;note('fault-restored',{shot:f.shot,x:h.x,y:h.y});e.message('담허: 파열이 이치를 되찾았네.');}
   },
   afterCurse(a,g,u,t,kind,p){if(active()&&state.retreat&&!state.bell&&u===actor.occultist&&t===bell&&kind==='weak'){state.bell=true;note('bell-weakness-applied',{shot:nativeFacts(g,p)?.shot});}},
   afterNeutralize(a,g,u,t,p){if(active()&&state.retreat&&!state.bell&&u===actor.occultist&&t===bell&&down(t)){state.bell=true;note('bell-pressure-neutralized',{shot:nativeFacts(g,p)?.shot});}},
   afterPosition:poll,afterTurn(){},
   handleProvenWait:(a,g,u,base)=>proveDefend(u,base),
   acceptedInteract(a,g,key,u){
    if(!active()||u!==actor.occultist||!isActor(u)||!state.retreat||b.projectiles.length)return false;
    if(key==='markSoulPath'&&!state.soul&&!soulPending&&state.bell&&local(u,1490,near)){soulPending={end:b.teamEnds[1]};note('soul-route-marking',{actor:u.id});e.message('소단: 길을 그었어요. 이 자리를 한 번만 버티면 혼길이 남아요.');return true;}
    if(key==='activateGarmjin'&&!state.activated&&canJoin()&&local(u,1755,near)){state.activated=true;waves.closed=true;note('garmjin-activated',{actor:u.id});e.message('소단: 떠날 혼은 왼쪽으로 가요. 이제 저 길만 남았어요.');
     // The corrected garmjin separates what crossed over: every body still standing is torn by it once.
     for(const v of b.units.filter(x=>x.side===1&&alive(x)&&x!==threat)){e.hurt(v,v.maxHp*.35,u.id,true,undefined,{x:v.x,y:v.y-v.h*.5},'normal');e.fx('ring',v.x,v.y-v.h*.5,'#bfe3d4',70);}note('garmjin-separation');poll();return true;}
    return false;
   },onStop(){}
  }});
  if(!instance){b.units.splice(b.units.indexOf(threat),1);delete b.honroState.localFinaleEdgeWave;return null;}
  const realTick=e.tick,realSteps=e.enemyActionSteps,realHurt=e.hurt,realFire=e.fire,realSwitch=e.switchTeam;
  const takeEnemyTurns=e.switchTeam=function(...args){
   const from=b.side,out=realSwitch.apply(this,args);
   if(from!==0||b.side!==1||b.phase!=='enemy'||!active())return out;
   const available=u=>alive(u)&&!(u.stun>0)&&u.stunnedRound!==b.round&&!walks.get(u.id)?.out;
   const contenders=e.combatEnemies().filter(available);
   const selected=[];
   if(giant&&!state.forepaw&&contenders.includes(giant)&&e.enemyQueuePriority(giant)?.tier>=1)selected.push(giant.id);
   const wings=b.round%2===0?[fronts[1],fronts[0]]:fronts;
   for(const wing of wings){
    const attacker=contenders.find(u=>walks.get(u.id)?.front===wing&&u!==giant&&e.enemyQueuePriority(u)?.tier===2&&!walks.get(u.id)?.attacked);
    if(attacker)selected.push(attacker.id);
   }
   const booked=b.queue.filter(id=>available(e.unit(id))&&!selected.includes(id));
   b.queue=[...selected,...booked].slice(0,b.enemyLimit);
   if(b.queue.length)b.active=b.queue[0];
   for(const u of e.actors(1))u.acted=!b.queue.includes(u.id);
   return out;
  };
  const release=e.fire=function(...args){
   const u=e.active,result=realFire.apply(this,args),a=u&&walks.get(u.id);
   if(result&&active()&&a&&b.side===1){
    if(u===giant){giantAttack=b.teamEnds[1];note('forepaw-native-fire',{actor:u.id,skill:args[0],shot:b.shot});}
    else a.attacked=b.round;
   }
   return result;
  };
  const follow=e.hurt=function(target,amount,owner,direct,p,source,damageSource,damageSkill,provenance){
   const was=target===threat&&active()&&state.activated&&!retreatOrder&&b.side===0&&e.active===actor.knight&&owner===actor.knight.id&&
    ['S00','S01','S03'].includes(p?.skill??provenance?.skill??damageSkill??e.audioContext?.skill)&&grounded(threat,near)&&grounded(actor.knight,near)&&
    actor.knight.x<threat.x&&threat.x-actor.knight.x<175, hp=was?threat.hp+threat.shield:0;
   const body=active()&&b.side===0&&units.some(u=>u.id===owner)&&walks.get(target.id);
   const before=body?target.hp+target.shield:0;
   const out=realHurt.call(this,target,amount,owner,direct,p,source,damageSource,damageSkill,provenance);
   if(body&&target.hp+target.shield<before){
    if(target===giant){
     if(alive(giant))answerForepaw('strike',{actor:owner,shot:b.shot,damage:before-target.hp-target.shield});
     else if(!state.forepaw){state.forepaw='defeated';note('forepaw-answered',{id:giant.id,reason:'defeated',actor:owner,shot:b.shot});}
    }else retreat(body,'driven-back');
   }
   if(was&&alive(threat)&&threat.hp+threat.shield<hp){retreatOrder={actor:owner,shot:b.shot,from:threat.x,walked:0,ticks:0};
    note('bridge-retreat-signaled',{...retreatOrder});e.message('교각을 막던 것이 동쪽 굽이로 물러섭니다.');}
   return out;
  };
  const advance=e.tick=function(dt,...rest){
   if(active()&&b.side===1&&!b.projectiles.length&&Number.isFinite(dt)&&dt>0&&dt<=.1){
    if(retreatOrder&&retreatOrder.ticks<150&&grounded(threat,near)&&threat.moveLeft>=8){
     retreatOrder.ticks++;
     const q=threat.x;e.walk(threat,1,dt,true);
     if(threat.x>q)retreatOrder.walked+=threat.x-q;
    }
   }
   if(active()&&state.retreat&&!b.projectiles.length&&Number.isFinite(dt)&&dt>0&&dt<=.1){
    for(const a of walks.values()){
     const v=a.unit;if(!alive(v)||a.departed||!grounded(v,a.t))continue;
     if(a.out){
      const {dir,target}=a.out,before=v.x;
      const exposed=units.some(u=>alive(u)&&Math.hypot(u.x-v.x,(u.y-v.y)*.9)<190);
      const beyond=dir*(v.x-target)>=-10;
      if(beyond&&!exposed&&a.out.distance>=140&&e.active!==v){
       a.departed=true;a.out.exit={x:v.x,y:v.y,support:a.t,round:b.round};
       e.fx('ring',v.x,v.y-v.h*.45,'#91b8b8',48);
       b.units.splice(b.units.indexOf(v),1);e.refreshActivation();
       note('wing-exited',{...a.out});continue;
      }
      if(b.side===1||b.phase==='aim'){
       v.moveLeft=Math.max(v.moveLeft,18);
       e.walk(v,dir,dt,true);
       a.out.distance+=Math.max(0,dir*(v.x-before));
      }
      continue;
     }
     const wing=a.front.dir>0?[actor.archer,522*k]:[actor.mage,1710*k];
     const challenged=a.attacked&&Math.hypot(wing[0].x-wing[1],(wing[0].y-v.y)*.65)<840;
     if(v!==giant&&challenged&&b.round>a.attacked){retreat(a,'anchor-contested');continue;}
     if(b.side!==1||!a.wave||v.moveLeft<8||a.walked>=a.cap||a.ticks++<a.delay)continue;
     const before=v.x,dir=a.front.dir;e.walk(v,dir,dt,true);
     if(dir*(v.x-before)>0){a.walked+=Math.abs(v.x-before);a.steps++;a.wave.emergence??={};a.wave.emergence[v.id]={actualMovement:a.walked,steps:a.steps};}
    }
   }
   return realTick.call(e,dt,...rest);
  };
  const sweep=e.enemyActionSteps=function* (...args){
   if(active()&&retreatOrder&&retreatOrder.ticks<150&&e.active===threat&&threat.moveLeft>=8&&grounded(threat,near)&&!resolved()&&b.side===1){yield;return;}
   if(active()&&walks.get(e.active?.id)?.out&&b.side===1){e.finishAction();return;}
   if(active()&&warning?.status==='armed'&&!clash&&b.side===1&&e.active===threat&&warning.responded===true&&grounded(threat,near)){
    const strip=buildStrip(e,C);
    if(eq(strip,warning.strip)){
     const damage=e.effective(C.SKILLS.S00,threat).damage,hits=[];
     for(const a of contacts(e,strip)){const before=[a.u.hp,a.u.shield];e.hurt(a.u,damage,strip.owner,false,undefined,a.contact,'normal','S00');hits.push({target:a.u.id,before,after:[a.u.hp,a.u.shield]});}
     clash={round:b.round,damage,hits};warning.status='resolved';delete b.honroState.localFinaleGiantTelegraph;
     note('forepaw-native-contact',clash);e.finishAction();return;
    }
   }
   yield* realSteps.apply(e,args);
  };
  mounted.add(e);
  const flags=()=>Object.fromEntries(auth.map(k=>[k,true]));
  return Object.freeze({poll,interact:instance.interact,defend:base=>proveDefend(e.active,base),project(){
   if(!current()||everDisposed)return null;
   return {complete:state.cleared,objectiveReady:state.cleared,failed:!units.some(alive)||!!lostReason,breach,breachLimit:FRONTS59.breachLimit,
    summary:(lostReason?'거점이 모두 밀렸습니다.':state.cleared?'가름진을 세웠습니다. 산문 길이 열렸습니다.':state.activated?'교각을 막는 마지막 위협을 물리치십시오.':giant&&!state.forepaw?'교각의 앞발을 맞서 막거나 쳐서 물리치십시오.':!bothApproaches()&&state.mage&&state.cliff?'되밀리는 두 전선에서 지지점을 유지하십시오.':'서쪽 지지석, 종터 혼길, 동쪽 파열을 복구하십시오.')+(state.retreat&&!state.cleared?` · 거점 붕괴 ${breach}/${FRONTS59.breachLimit}`:''),
    targets:[...(!state.retreat?[{id:'return-guard',kind:'route',x:900*k,y:C.topAt(terrain[0],900*k),label:'휘겸: 퇴각한 곳의 수비대 확인'}]:[]),
     ...(state.retreat&&!state.cliff?[{id:'cliff-cleat',kind:'target',x:522*k,y:1871.8947026324342,label:'설오: 서쪽 지지석 정밀 사격'}]:[]),
     ...(state.retreat&&!state.bridge?[{id:'bridge-hold',kind:'route',x:958*k,y:C.topAt(terrain[0],958*k),label:'휘겸: 교각에서 방어 후 적 턴 버티기'}]:[]),
     ...(state.bell&&!state.soul?[{id:'markSoulPath',kind:'interaction',x:1490*k,y:C.topAt(terrain[0],1490*k),label:'소단: 종터의 혼길 표시'}]:[]),
     ...(state.retreat&&!state.mage?[{id:'east-fault',kind:'target',x:1710*k,y:2291.3294746996403,label:'담허: 동쪽 파열 M01 정밀 사격'}]:[]),
     ...(giant&&!state.forepaw?[{id:'forepaw',kind:'target',x:giant.x,y:giant.y-giant.h*.5,label:'혼류의 앞발 · 교각 방어 또는 직접 타격'}]:[]),
     ...(canJoin()&&!state.activated?[{id:'activateGarmjin',kind:'interaction',x:1755*k,y:C.topAt(terrain[0],1755*k),label:'소단: 가름진 연결'}]:[])],
    states:copy(state),survivors:b.units.filter(u=>u.side===1&&alive(u)).length};
  },inspect:()=>copy({state,log,waves,warning,clash}), renderRole(ctx,scene,u){
   if(!active()||!paint||!alive(u)||u.side!==1||e.unit(u.id)!==u||!(u===bell||walks.get(u.id)?.unit===u))return false;
   const ledger=copy(waves);ledger.currentRound=b.round;
   return paint(ctx,scene,copy(u),Object.freeze({stage:59,ledger,front:b.honroState.localFinaleFront?.id}));
  },terminal(){
   if(!current()||terminalIssued||everDisposed||!state.cleared||b.phase!=='won'||JSON.stringify(b.terrain)!==p||JSON.stringify(b.honroWorldTerrain)!==w)return null;
   terminalIssued=true;
   return {stage:59,won:true,flags:flags(),actors:copy(units),profile:copy(app.profile),round:b.round,settlement:false};
  },physicalBoundary(){
   if(!current()||everDisposed||!terminalIssued||b.phase!=='won'||!state.cleared||!waves.closed||!witness)return null;
   const aftermath=b.honroState.localReturnGuardAftermath;
   if(!aftermath||aftermath.anchor!==held.anchor||aftermath.seenBy!==witness.id||aftermath.source!==held.source)return null;
   const distance=retreatOrder?threat.x-retreatOrder.from:threat.x-origin, dead=down(threat), stand=grounded(threat,near);
   if(!resolved())return null;
   return copy({witness,guardAftermath:aftermath,finalThreat:{id:threat.id,hp:threat.hp,dead,distance,grounded:dead||stand,retreat:retreatOrder},closed:true});
  },dispose(){
   if(everDisposed)return;everDisposed=true;
   if(e.tick===advance)e.tick=realTick;if(e.enemyActionSteps===sweep)e.enemyActionSteps=realSteps;if(e.hurt===follow)e.hurt=realHurt;if(e.fire===release)e.fire=realFire;if(e.switchTeam===takeEnemyTurns)e.switchTeam=realSwitch;
   instance.dispose();
  },releaseEnabled:false});
 };
}
