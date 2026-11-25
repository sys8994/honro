// Private Act6 boundary codec. No public writers/features are installed here.
// Official source authority is supplied independently of the stored envelope.
const schema='honro-act6-boundary/v2', keyField='honroAct6ChapterBoundary';
const hash64=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y), json=x=>JSON.parse(JSON.stringify(x));
const combat=['archer','knight','mage','occultist'], outer=['archer','knight','occultist'];
const rowSpec=['hp','maxHp','focus','maxFocus','shield','h','r','level','attack','armor','walkSpeed','maxMove','regen'];
const takeRow=(u,role,stage51=false)=>u?.cls===role&&u.side===0&&!u.dead&&!u.summoned&&!u.honroAlly&&typeof u.id==='string'&&u.id.length>0&&u.hp>0&&u.hp<=u.maxHp&&u.focus>=0&&u.focus<=u.maxFocus&&
  (u.equipmentState?.version===1||stage51&&u.equipmentState===undefined)&&Array.isArray(u.loadout)&&u.ranks&&rowSpec.every(k=>Number.isFinite(u[k]));
const names=v=>Object.keys(v??{}).sort().join(',');
const ordinary=(a,e,st)=>e&&a?.engine===e&&a.profile===a.normalProfile&&a.stageId===st&&a.done===true&&e.stage?.id===st&&e.b.honroStage===st&&e.b.stageId===st&&
  e.b.mode==='campaign'&&e.b.honroCanonical===true&&e.b.honroMapOrigin==='campaign'&&e.b.honroCustom===false&&e.b.phase==='won';
const naked=p=>{const q=json(p);delete q[keyField];return q;};
const order=q=>Array.isArray(q)?q.map(order):q&&typeof q==='object'?Object.fromEntries(Object.keys(q).sort().map(k=>[k,order(q[k])])):q;
const equivalent=(a,b)=>same(order(a),order(b));
 // Stock Act 5 Continue legitimately reserializes the presentation cursor.
 // It does not gain authority over the previous chapter hash or living bodies.
 const compatibleLegacy=(a,b)=>{
  const ready=q=>{
   const p=naked(q),j=p.honroJourney;
   if(j&&j.version===1){
    delete j.stageId;delete j.story;delete j.newGrowth;delete j.talked;
    for(const field of ['pendingDirect','restStageId'])if(j[field]==null)delete j[field];
   }
   return p;
  };
  return equivalent(ready(a),ready(b));
 };

const changedKeys=(a,b)=>[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>!equivalent(a[k],b[k]));

const priorUnsafe=p=>!p||p.honroBattle||p.honroActEnding||p.honroMapRestart||p.honroPendingOutcome||p.honroPendingResult;
const withFlags=(r,flags)=>flags.every(k=>r.flags?.[k]===true);
const originals=e=>e.b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly);
const packRoster=v=>Object.fromEntries(v.map(u=>[u.cls,u]));
const shapeRoles=(r,keys,stage51=false)=>names(r)===keys.slice().sort().join(',')&&keys.every(k=>takeRow(r[k],k,stage51))&&new Set(Object.values(r).map(u=>u.id)).size===keys.length;

const status55=['act6.outerThreeAnchorsReady','act6.outerAnchorBellReady'];
const status57=['act6.fallbackRelaySecured','act6.fourCorporealJoined'];
const validate55=(r,p)=>withFlags(r,status55)&&shapeRoles(p.outer,outer)&&takeRow(p.mage,'mage')&&
  !Object.values(p.outer).some(a=>a.id===p.mage.id)&&r.actors?.length===3&&r.actors.every(a=>same(a,p.outer[a.cls]))&&same(r.parkedMage,p.mage);
const validate57=(r,p)=>withFlags(r,status57)&&shapeRoles(p.full,combat)&&names(p.receiving)===combat.join(',')&&
  combat.every(k=>p.full[k].x-3200===p.receiving[k].x&&p.full[k].y+758===p.receiving[k].y)&&
  p.guard?.ref==='local-07-gwakjin-return-keeper'&&p.guard.afterSide===2&&p.guard.end?.x-p.guard.spawn?.x>160&&p.association?.seamReady===true&&
  same(p.association.guard,p.guard)&&same(r.crew,p.full)&&same(r.boundary,{full:p.full,receiving:p.receiving,guard:p.guard,association:p.association});

const exactRoster=(r,p,stage51=false)=>shapeRoles(p.full,combat,stage51)&&r.actors?.length===4&&r.actors.every(a=>{
  const u=p.full[a.cls];return !!u&&Object.keys(a).every(k=>same(a[k],u[k]));
});
const before58=['act6.daedosaStopped','act6.innerRevisionReady','act6.fourCorporealReturned'];
const captureFull=({engine:e})=>{
  const full=packRoster(originals(e));
  return shapeRoles(full,combat)&&Object.values(full).every(u=>e.grounded(u))?full:null;
};
const deadAt58=(q,id)=>q?.id===id&&q.hp===0&&q.dead===true;
const validate58=(r,p)=>withFlags(r,before58)&&exactRoster(r,p)&&same(r.guard,p.guard)&&same(r.association,p.association)&&
  p.guard?.ref==='local-07-gwakjin-return-keeper'&&p.guard.afterSide===2&&p.association.seamReady===true&&same(p.association.guard,p.guard)&&
  deadAt58(p.boss,'a6-c08-boss')&&deadAt58(p.expansion,'a6-c08-expansion-node')&&typeof p.stakeId==='boolean'&&p.stakeId&&p.returned===true;
const solo=(r,p,exact)=>{
  const v=r.mage,u=p.mage;
  return takeRow(u,'mage')&&shapeRoles(p.external,outer)&&!Object.values(p.external).some(a=>a.id===u.id)&&
    same(p.external,r.external)&&(exact?same(v,u):v&&Object.keys(v).every(k=>same(v[k],u[k])));
};
function captureSolo(ctx){
  const u=originals(ctx.engine),x=ctx.terminal?.external;
  return u.length===1&&u[0].cls==='mage'&&ctx.engine.grounded(u[0])&&shapeRoles(x,outer)?{mage:u[0],external:x}:null;
}
const relay=(r,p,k)=>p?.witness?.skill==='M09'&&p.witness.owner===p.mage.id&&p.witness.shot===r[k]?.shot&&r[k]?.shot>0&&
  p.witness.x===r[k].x&&p.witness.y===r[k].y;
function captureRelay(ctx,k){
  const p=captureSolo(ctx);if(!p)return null;
  const r=ctx.terminal[k],v=ctx.engine.b.stakes.find(x=>x.owner===p.mage.id&&x.skill==='M09'&&x.shot===r?.shot&&x.x===r?.x&&x.y===r?.y);
  return v?{...p,witness:v}:null;
}
const verify56=(r,p)=>withFlags(r,['act6.firstGarmjinFailed','act6.temporaryPassageEscaped'])&&takeRow(p.mage,'mage')&&shapeRoles(p.external,outer)&&
  same(r.boundary.fullMage,p.mage)&&same(r.boundary.fullOuter,p.external)&&r.boundary.events.includes('exitReached')&&p.grounded===true&&
  r.boundary.reflow.some(x=>x.key==='native-reversal')&&r.boundary.reflow.some(x=>x.key==='native-evade');
const verify59=(r,p)=>withFlags(r,['act6.garmjinCompleted','act6.finalThreatResolved'])&&exactRoster(r,p)&&p.physical.closed===true&&
  p.physical.witness?.id===p.full.knight.id&&p.physical.witness.grounded===true&&p.physical.guardAftermath.anchor==='local-return-anchor-07'&&
  p.physical.guardAftermath.poses?.length===3&&p.physical.finalThreat.grounded===true&&
  (p.physical.finalThreat.dead||p.physical.finalThreat.retreat?.actor===p.full.knight.id&&p.physical.finalThreat.retreat?.shot>0&&p.physical.finalThreat.distance>=240);
export const statusByDestination=Object.freeze({
 51:'release-fifty-source-hook',52:'candidate-51-52',53:'candidate-52-53-with-sibling-PASS',
 54:'candidate-53-54',55:'candidate-54-55',56:'candidate-55-56',57:'candidate-56-57',
 58:'candidate-57-58',59:'candidate-58-59',60:'candidate-59-60'
});
const recipes={
 57:{from:56,kind:'three-parked-outers-after-real-reversal-and-escape',validate:verify56,
   capture({engine:e,terminal:r,upstream}){
    const u=originals(e);
    if(u.length!==1||!e.grounded(u[0])||!same(r.boundary.fullOuter,upstream?.boundary?.fullOuter))return null;
    return {mage:u[0],external:r.boundary.fullOuter,grounded:true};
   }},
 60:{from:59,kind:'four-injured-with-actual-defeat-and-guard-closure',validate:verify59,
   capture(ctx){const full=captureFull(ctx);return full&&ctx.physical?{full,physical:ctx.physical}:null;}},

 53:{from:52,kind:'four-actual-source-rows-split-to-sole-mage',
   validate:(r,p)=>withFlags(r,['act6.outerSitesPrepared','act6.darmheoInTemple'])&&exactRoster(r,p),
   capture({engine}){const full=packRoster(originals(engine));return shapeRoles(full,combat)?{full}:null;}},

  54:{from:53,kind:'mage-with-real-M09-plus-three-parked',capture:ctx=>ctx.terminal.bridge?captureRelay(ctx,'stake'):null,
    validate:(r,p,_verifyRelay,verifyBridge)=>withFlags(r,['act6.innerStakeAReady'])&&solo(r,p,false)&&relay(r,p,'stake')&&
      (!Object.hasOwn(r,'bridge')||verifyBridge(p.mage.id,r.bridge)&&p.mage.x===r.bridge.to.x&&p.mage.y===r.bridge.to.y)},
 55:{from:54,kind:'three-exterior-plus-mage-with-complete-native-chart-relay',
   capture:ctx=>ctx.terminal.relay?.support&&ctx.terminal.relay?.impact?captureRelay(ctx,'relay'):null,
   validate:(r,p,verifyRelay54)=>withFlags(r,['act6.invertedGalleryCrossed'])&&solo(r,p,true)&&relay(r,p,'relay')&&
     p.witness.id===r.relay.id&&verifyRelay54(r.relay)&&r.chart?.length===3&&
     ['N>L','L>C','C>L'].every((id,i)=>r.chart[i].id===id&&r.chart[i].actor===p.mage.id&&r.chart[i].grounded===true)},

 52:{from:51,kind:'four-live-exterior-carry',
   validate:(r,p)=>withFlags(r,['act6.threeSitesSighted'])&&exactRoster(r,p,true),
   capture({engine}){const full=packRoster(originals(engine));return shapeRoles(full,combat,true)?{full}:null;}},
 59:{from:58,kind:'four-injured-exterior-with-real-defeat-and-node-stop',validate:validate58,
   capture(ctx){
    const full=captureFull(ctx),e=ctx.engine,t=ctx.terminal,project=e.b.honroState.flags;
    if(!full||!same(t.guard,ctx.upstream?.boundary?.guard))return null;
    const role=id=>{const u=e.unit(id);return {id:u?.id,hp:u?.hp,dead:u?.dead};};
    return {full,guard:t.guard,association:t.association,boss:role('a6-c08-boss'),expansion:role('a6-c08-expansion-node'),
      stakeId:project['place(correctedInnerStake)']===true,returned:project.localFourBodyExit===true};
   }},

 56:{from:55,kind:'three-active-plus-original-parked-mage',validate:validate55,
   capture({app,engine:e,terminal:r,upstream}){
    const current=packRoster(originals(e)),mage=r.parkedMage;
    if(!shapeRoles(current,outer)||!same(mage,upstream?.mage)||Object.values(current).some(u=>!e.grounded(u)))return null;
    return {outer:current,mage};
   }},
 58:{from:57,kind:'four-corporeal-receiving-plus-stationary-guard',validate:validate57,
   capture({engine:e,terminal:r}){
    const live=packRoster(originals(e));
    if(!shapeRoles(live,combat)||combat.some(k=>!e.grounded(live[k])||e.contactSurface(live[k].x,live[k].y-4,live[k].y+5)?.t.id!=='local-07-08-exact-receiving-slice'))return null;
    return {...r.boundary,full:live};
   }}
};
const reject=reason=>({ok:false,reason,keepOriginal:true});
export function createChapterBoundary({slot,key,storage,locks,normalize,hash,verifyOwner,verifyCold,releasePin,verifyRelay54,verifyBridge,ownedStore=(a,w)=>a?.profileStore===w,originalProfile=a=>a.profile}){
 if(!slot||!key||typeof locks?.request!=='function'||typeof hash!=='function'||!storage||typeof normalize!=='function'||typeof verifyOwner!=='function'||typeof verifyCold!=='function'||typeof releasePin!=='function'||typeof verifyRelay54!=='function'||typeof verifyBridge!=='function')return null;
 const written=new WeakSet(),booted=new WeakMap(),working=new WeakSet();
 const digest=v=>hash(JSON.stringify(v)), read=()=>storage.getItem(key), exclusive=f=>locks.request('honro:profile-slot:'+slot,{mode:'exclusive'},f);
 function pinOkay(pin,id){
  const d=recipes[id];return !!(d&&pin?.from===d.from&&pin.to===id&&['build','fromPacket','toPacket','owner','play','world'].every(k=>hash64(pin[k])));
 }
 // Revision compatibility (2026-11-25): a stored stamp carries the PREVIOUS chapter's
 // terminal. The destination chapter re-validates that terminal in full when it mounts,
 // so a later build/destination/owner revision must not strand the player. The stored
 // terminal stays valid while the source chapter packet (fromPacket) is unchanged.
 function pinCompatible(stored,current,id){
  if(same(stored,current))return true;
  return !!(stored&&current&&pinOkay(stored,id)&&stored.from===current.from&&stored.to===current.to&&stored.fromPacket===current.fromPacket);
 }
 // A structurally sound stamp whose source packet itself was revised cannot be resumed.
 // It is retired: Act 6 restarts at chapter 1 (zero growth budget, nothing is lost) and
 // the retired stamp becomes the audited parent of the next checkpoint.
 function retired(stamp,p){
  const x=stamp?.body,id=x?.to,r=recipes[id];
  if(!x||!r||x.schema!==schema||x.slot!==slot||x.runId!==p?.equipment?.runId||!pinOkay(x.pin,id))return false;
  const now=releasePin(id);return !!now&&!pinCompatible(x.pin,now,id);
 }
 function shape(stamp,p,pin,id){
  const {body:x,sha}=stamp??{},r=recipes[id];
  return !!(x&&r&&pinOkay(pin,id)&&x.schema===schema&&x.slot===slot&&x.runId===p?.equipment?.runId&&x.kind===r.kind&&x.from===r.from&&x.to===id&&
   x.profileSHA===digest(naked(p))&&same(pin,releasePin(id))&&pinCompatible(x.pin,pin,id)&&x.generation>=1&&Number.isSafeInteger(x.generation)&&x.parent&&(x.parent==='initial'&&x.generation===1||hash64(x.parent)&&x.generation>1)&&
   x.terminal?.stage===r.from&&([51,52].includes(r.from)?x.terminal.won===undefined:x.terminal.won===true)&&x.terminal.settlement===false&&x.terminalSHA===digest(x.terminal)&&x.custodySHA===digest(x.custody)&&
   x.stageSeed?.id===r.from&&x.budget?.id===r.from&&r.validate(x.terminal,x.custody,verifyRelay54,verifyBridge)&&sha===digest(x));
 }
 async function checkpoint({app,engine:e,store,terminal,upstream,physical,stageSeed,budget,to,pin,expectedRaw}){
  const r=recipes[to];
  if(!r||!pinOkay(pin,to)||!ordinary(app,e,r.from)||!verifyOwner(app,e,terminal,to)||!ownedStore(app,store)||store?.locked||written.has(e)||typeof expectedRaw!=='string'||working.has(app))return reject('live-owner');
  let cap,baseline;
  try{cap=r.capture({app,engine:e,terminal,upstream,physical});baseline=normalize(expectedRaw);}catch{return reject('bad-native-terminal-or-slot');}
  const old=baseline?.[keyField];
  if(!cap||priorUnsafe(baseline)||!baseline.equipment?.runId||!compatibleLegacy(baseline,normalize(JSON.stringify(app.profile)))||!same(stageSeed,e.stage)||budget?.id!==r.from||
     (old&&!retired(old,baseline)&&(old?.body?.to>r.from||!shape(old,baseline,releasePin(old.body.to),old.body.to))))return reject('prior-or-custody');
  const t=json(terminal),p=json(cap);
  const data={schema,slot,runId:baseline.equipment.runId,from:r.from,to,kind:r.kind,generation:old?old.body.generation+1:1,parent:old?.sha??'initial',pin:json(pin),
   profileSHA:digest(naked(baseline)),terminal:t,terminalSHA:digest(t),custody:p,custodySHA:digest(p),stageSeed:json(stageSeed),budget:json(budget)};
  const stamp={body:data,sha:digest(data)};if(!shape(stamp,baseline,pin,to))return reject('invalid-new-checkpoint');
  const rev=app.profileImportSequence,activeProfile=app.profile,profileText=JSON.stringify(activeProfile);
  try{working.add(app);return await exclusive(()=>{
    const still=()=>read()===expectedRaw&&ordinary(app,e,r.from)&&verifyOwner(app,e,terminal,to)&&ownedStore(app,store)&&app.profileImportSequence===rev&&app.profile===activeProfile&&
      JSON.stringify(app.profile)===profileText&&same(t,terminal)&&same(p,r.capture({app,engine:e,terminal,upstream,physical}));
    if(!still())return reject('stale-slot-or-owner');
    if(!store.save({...baseline,[keyField]:stamp}))return reject('stock-save-rejected');
    const raw=read(),reopen=normalize(raw);if(!shape(reopen?.[keyField],reopen,pin,to)||!same(reopen[keyField],stamp))return reject('readback-hold');
    written.add(e);return {ok:true,raw,sha:stamp.sha};
  });}catch{return reject('lock-or-storage-failed');}finally{working.delete(app);}
 }
 async function restore({app,store,to,pin,enter}){
  if(!pinOkay(pin,to)||typeof enter!=='function'||app?.engine||app?.profile!==app?.normalProfile||!ownedStore(app,store)||store?.locked||working.has(app)||booted.has(app)||!verifyCold(app,store,to))return reject('cold-owner');
  const profile=app.profile,rev=app.profileImportSequence,text=JSON.stringify(profile);
  try{working.add(app);return await exclusive(async()=>{
    const raw=read(),loaded=normalize(raw),stamp=loaded?.[keyField];
    const still=()=>read()===raw&&app.profile===profile&&app.normalProfile===profile&&ownedStore(app,store)&&app.profileImportSequence===rev&&JSON.stringify(profile)===text&&!app.engine&&verifyCold(app,store,to);
    const committed=originalProfile(app);
    if(priorUnsafe(loaded)||!committed||priorUnsafe(committed)||committed.honroCampPending||committed.honroJourney?.pendingDirect||committed.honroJourney?.restStageId)return reject('pending-or-missing-committed-profile');
    if(!compatibleLegacy(loaded,committed))return reject('wrong-committed-profile'+(slot.startsWith('honro-act6-qa-')?':'+changedKeys(naked(loaded),naked(committed)).flatMap(k=>k==='honroJourney'?changedKeys(loaded[k]??{},committed[k]??{}).map(f=>k+'.'+f):[k]).join(','):''));
    if(!shape(stamp,loaded,pin,to))return reject('checkpoint-integrity-or-revision');
    if(!still())return reject('stale-cold-owner');
    // No Engine donor. Factory is separately private and mounts a NEW
    // signed stage at its first validated real contact positions.
    if(!await enter(Object.freeze(json(stamp.body)),still))return reject('native-entry-refused');
    booted.set(app,Object.freeze({to,sha:stamp.sha}));return {ok:true,sha:stamp.sha};
  });}catch{return reject('lock-or-native-entry-failed');}finally{working.delete(app);}
 }
 function status(){
  try{const loaded=normalize(read()),stamp=loaded?.[keyField];if(!stamp)return 'none';
   if(retired(stamp,loaded))return 'retired';
   const id=stamp.body?.to,pin=releasePin(id);return pin&&shape(stamp,loaded,pin,id)?'restorable':'invalid';
  }catch{return 'invalid';}
 }
 return Object.freeze({checkpoint,restore,status});
}
