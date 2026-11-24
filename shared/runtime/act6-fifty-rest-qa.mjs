// Source-shaped normal 50->51 gate. Not emitted; OFF owns no App hook.
// Runtime authority comes from the private normal App + compiled release
// owner. The stored profile is gameplay state, not release authority.
const roles=Object.freeze(['archer','mage','knight','occultist']);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o??{},k);
const clear50=v=>v===true||!!(v&&typeof v==='object'&&Number.isSafeInteger(v.visits)&&v.visits>=1);
const roster=p=>Array.isArray(p?.recruited)&&roles.every(c=>p.recruited.includes(c)&&p.heroes?.[c]&&Array.isArray(p.loadouts?.[c]));
function noEarlierTask(p){
 return p?.game==='honro'&&clear50(p.cleared?.[50])&&!p.cleared?.[51]&&!p.honroActEnding&&!p.honroBattle&&!p.honroMapRestart&&!p.honroCampPending&&
   !p.honroJourney?.pendingDirect&&!p.honroJourney?.restStageId&&roster(p);
}
function relevant(p){
 return {stage50:p.cleared?.[50],ending50:p.seen?.['act-ending-v1:50'],earlierActive:!noEarlierTask(p),heroes:p.heroes,equipment:p.equipment,loadouts:p.loadouts,tuning:p.tuning,recruited:p.recruited,settings:p.settings};
}
// Give the Stage51 canonical initializer the actually persisted party. A
// shared normal chapter-entry builder derives fresh combat state at rest.
// Never invent/recreate historical exact terminal HP for a released old save.
export function createFiftyRestAdmission(config){
 if(config?.enabled!==true)return null;
 const {privateToken,issuerReady,normalScope,restOwner,verifyPacket,buildRestEntry}=config;
 if(typeof privateToken!=='symbol'||![issuerReady,normalScope,restOwner,verifyPacket,buildRestEntry].every(x=>typeof x==='function'))throw new TypeError('Missing canonical App/packet owner');
 const busy=new WeakMap(),lets=new WeakMap();
 function inspect(token,app,offerOnly=false){
  if(token!==privateToken||!issuerReady()||!normalScope(app)||!restOwner(app)||app.screen!=='rest'||app.engine||(!offerOnly&&app.dialogue)||app.endingGallery||app.pendingJourneyLaunch||app.modal?.classList.contains('open')||
    !app.profileStore||app.profileStore.locked||app.profile!==app.normalProfile||!noEarlierTask(app.profile))return null;
  const rec=app.profileStore.original();
  if(rec?.ok!==true||typeof rec.text!=='string')return null;
  let stored; try{stored=JSON.parse(rec.text);}catch{return null;}
  if(!noEarlierTask(stored)||!same(relevant(app.profile),relevant(stored))||!stored.equipment?.runId)return null;
  // Invalid/partially saved ending always blocks. No backward requirement
  // for the newer seen key when a historic canonical clear has no pending.
  const state=has(stored.seen,'act-ending-v1:50')?(stored.seen['act-ending-v1:50']===true?'ending-seen':null):'historic-no-ending-marker';
  if(!state)return null;
  return {profile:app.profile,store:app.profileStore,raw:rec.text,root:app.root?.firstElementChild,importSequence:app.profileImportSequence,classification:state};
 }
 function canOffer(token,app){return !!inspect(token,app,true);}
 function issue(token,app,event){
  if(event?.isTrusted!==true||busy.has(app))return null;
  const c=inspect(token,app);if(!c)return null;
  const permit=Object.freeze({}); busy.set(app,permit);lets.set(permit,c);return permit;
 }
 function revoke(token,app){if(token===privateToken)busy.delete(app);}
 function accept(token,app,permit,packet){
  if(token!==privateToken||!permit||busy.get(app)!==permit)return null;
  const expected=lets.get(permit);
  busy.delete(app);lets.delete(permit);
  const c=inspect(token,app);
  if(!c||c.profile!==expected.profile||c.store!==expected.store||c.raw!==expected.raw||c.root!==expected.root||c.importSequence!==expected.importSequence||!verifyPacket(packet,51))return null;
  // Invoke the canonical starter of a new chapter at rest, not the old battle
  // and never the QA fixture's donor row/stats. Keep equip and XP authority
  // on the actual profile (builder gets clone; no mutation of the store).
  const p=structuredClone(c.profile),started=buildRestEntry(packet,p);
  if(!started||started.stage!==51||started.packet!==packet||!Array.isArray(started.actors)||!same(started.actors.map(a=>a.cls).sort(),[...roles].sort())||
    started.actors.some(a=>a.side!==0||a.summoned||a.dead||a.hp<=0||!Array.isArray(a.loadout)))return null;
  return Object.freeze({kind:'normal-inter-act-rest',stage:51,previous:50,classification:c.classification,packet,actors:started.actors,profile:c.profile});
 }
 return Object.freeze({canOffer,issue,accept,revoke});
}

// Reuse the normal stock player record factory. Authored positions/ids come
// only from the reviewed packet. This does not author enemy balance, rig,
// camera, terminal, or normal chapter registration.
export function buildPartyFromNormalRest(G,packet,profile){
 const stage=packet?.stage,compiled=packet?.compiled;
 if(!stage||stage.id!=='stage-51'||stage.metadata?.stageId!==51||stage.metadata?.campaign!==true||
   stage.metadata?.act!==6||stage.metadata?.actStage!==1||!Array.isArray(compiled?.terrain)||!roster(profile))return null;
 const rows=stage.units.filter(u=>u.team==='player');
 if(!same(rows.map(r=>r.kind).sort(),[...roles].sort())||new Set(rows.map(r=>r.id)).size!==4||
   rows.some(r=>typeof r.id!=='string'||!r.id||!Number.isFinite(r.x)||!Number.isFinite(r.y)||
     ['runtimeTemplate','stageOverrides','levelOverride','rank'].some(k=>has(r,k))))return null;
 if(!G.HonroEquipment.validate(profile.equipment))return null;
 G.HonroEquipment.sync(profile); // clones only, proven current inventory authority
 const b={terrain:compiled.terrain,heroes:structuredClone(profile.heroes),difficulty:profile.settings.difficulty};
 const actors=rows.map(u=>G.HonroUnits.create(u,b,profile,stage));
 if(actors.some(u=>!G.HONRO_CORE.validTerrainContactPose(compiled.terrain,u)))return null;
 return {stage:51,packet,actors};
}

export function bindOrdinaryFiftyRestUI({gate,privateToken,document,preparePacket,mountPrepared,onError}){
 if(!gate)return null; // OFF builds omit the entire source, not just this guard.
 const mounted=new WeakMap(),approved=new WeakMap();
 function offer(app){
  if(!gate.canOffer(privateToken,app))return false;
  const anchor=app.root.querySelector('.rest-actions .rest-next[disabled]');
  if(!anchor||mounted.has(app)&&mounted.get(app).isConnected)return false;
  const button=document.createElement('button');
  button.type='button';button.className='primary rest-next';button.textContent='스테이지 진입 →';
  button.setAttribute('aria-label','스테이지 진입 · 무명사 외부');
  mounted.set(app,button);anchor.replaceWith(button);
  button.addEventListener('click',async event=>{
   if(event.currentTarget!==button||!button.isConnected||mounted.get(app)!==button)return;
   const token=gate.issue(privateToken,app,event);if(!token)return;
   button.disabled=true;
   try{
    const packet=await preparePacket(51);
    const prepared=gate.accept(privateToken,app,token,packet);
    if(!prepared||!button.isConnected||mounted.get(app)!==button)return;
    const grant=Object.freeze({});
    approved.set(app,{grant,prepared});
    try{app.launch(51,false,null,grant);}finally{approved.delete(app);}
   }catch(error){if(button.isConnected&&mounted.get(app)===button)onError?.(app,error);}
   finally{gate.revoke(privateToken,app);button.disabled=false;}
  });
  return true;
 }
 function launch(app,id,grant){
  const row=approved.get(app);
  if(id!==51||!row||row.grant!==grant||row.prepared.profile!==app.profile||app.dialogue||!gate.canOffer(privateToken,app))return;
  approved.delete(app);
  // Must be synchronous after verification. Existing App/Engine owner
  // retains stopBattle, mount, and any future supported save transaction.
  return mountPrepared(app,row.prepared);
 }
 return Object.freeze({offer,launch});
}
