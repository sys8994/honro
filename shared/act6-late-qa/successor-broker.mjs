// A lexical App-owned warm successor broker for the optional, detached QA
// build. This is not a production catalog, a save reader or a fixture player.
const roles=['archer','knight','mage','occultist'];
const stages=[54,55,56,57,58,59,60];
const hex=/^[a-f0-9]{64}$/;
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x??{},k);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const same=(a,b)=>eq(canon(a),canon(b));
const actorFields=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','equipmentIds','gearBonuses','dead','attack','armor','maxMove','walkSpeed','regen'];
const view=u=>Object.fromEntries(actorFields.filter(k=>own(u,k)).map(k=>[k,structuredClone(u[k])]));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const flagsValid=a=>a&&Object.keys(a).length>0&&Object.keys(a).every(k=>/^act6\.[A-Za-z0-9]+$/.test(k)&&a[k]===true);
const partition=(live,parked)=>Array.isArray(live)&&Array.isArray(parked)&&same([...live,...parked].sort(),roles);
const physical=b=>!b?.honroJourneyReplay&&b?.mode==='act6-isolated'&&b?.honroMapOrigin==='act6-qa'&&b?.honroCanonical===true&&b?.honroCustom===false;
function actor(u,cls){
 return u&&u.cls===cls&&typeof u.id==='string'&&u.id.length>0&&
 [u.hp,u.maxHp,u.focus,u.maxFocus,u.shield,u.level,u.h,u.r].every(Number.isFinite)&&u.hp>0&&u.hp<=u.maxHp&&u.focus>=0&&u.focus<=u.maxFocus&&
 u.h>0&&u.r>0&&u.shield>=0&&u.level>=1&&u.dead!==true&&Array.isArray(u.loadout);
}
const body=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroCivilian&&!u.honroAlly&&!u.enthrall);
function capture(b,parked,entry,waiting){
 const live=body(b);
 if(!partition(entry,waiting)||!same(live.map(u=>u.cls).sort(),[...entry].sort())||!same(Object.keys(parked??{}).sort(),[...waiting].sort()))return null;
 const rows=Object.fromEntries(roles.map(r=>[r,live.find(u=>u.cls===r)??parked[r]]));
 if(roles.some(r=>!actor(rows[r],r))||new Set(roles.map(r=>rows[r].id)).size!==4)return null;
 return freeze(Object.fromEntries(roles.map(r=>[r,view(rows[r])])));
}
async function sha(G,bytes){
 return Array.from(new Uint8Array(await G.crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
}
const encode=x=>new TextEncoder().encode(JSON.stringify(x));
// No exported private token, generic game globals, or production hook when
// disabled. Hosts pass this object only into the generated App lexical body.
export function createLateSuccessorBroker(G,{enabled,token,origin,manifest,owners,scope,compile,mount,enterNative,profileKey}={}){
 if(enabled!==true)return null;
 if(typeof token!=='symbol'||origin!=='http://127.0.0.1:18861'||![scope,compile,mount,enterNative,profileKey].every(f=>typeof f==='function'))throw Error('Missing isolated App authority');
 const rows=new Map(),sessions=new WeakMap(),flights=new WeakMap(),pending=new WeakMap(),seen=new WeakSet(),spent=new WeakSet();
 for(const [key,d] of Object.entries(manifest??{})){
  const id=+key;
  if(!stages.includes(id)||d?.id!==id||d.runtimeReleaseEnabled!==false||d.previous!==id-1||!['sha256','mapSHA','assetSHA','playSHA','worldSHA','ownerSHA'].every(k=>hex.test(d[k]))||
   !Number.isSafeInteger(d.bytes)||d.bytes<=0||d.bytes>8*1024*1024||d.path!=='/web/data/act6-qa-chapter-'+id+'.'+d.sha256.slice(0,16)+'.json'||
   typeof d.authoredId!=='string'||!partition(d.entry,d.parked)||!partition(d.exit,d.parkedOnExit)||!flagsValid(d.requiresFlags)||!flagsValid(d.terminalFlags)||
   typeof owners?.[id]?.prepare!=='function'||typeof owners[id].attach!=='function'||owners[id].sourceSHA!==d.ownerSHA||
   (d.events??[]).some(x=>!['interact','contextualSkill','gravityChart','tick','nativeRelease','nativeImpact','noncombatReturn'].includes(x)))throw Error('Invalid owner row '+id);
  rows.set(id,freeze(structuredClone(d)));
 }
 const allowed=app=>G.location.origin===origin&&G.location.pathname==='/HONRO.html'&&G.isSecureContext===true&&scope(app)===true&&!app.profileStore?.locked&&!app.training&&!app.debugMode&&!app.customMap&&!app.endingGallery;
 function session(app,e){
  const s=sessions.get(e);
  return allowed(app)&&app.engine===e&&s?.app===app&&s.b===e?.b&&s.stage===app.stage&&s.profile===app.profile&&s.profileKey===profileKey(app)&&physical(e.b)?s:null;
 }
 // Only the true predecessor owner outcome callsite receives this method.
 // It compares the owner's won receipt with the actual still-mounted frame;
 // no terminal state or combat rows are taken from the downloaded packet.
 function seal(t,app,e,{descriptor,receipt,parked,previous,auxiliary}){
  if(t!==token||!allowed(app)||seen.has(e)||app.engine!==e||app.stageId!==descriptor?.id||app.stage?.id!==descriptor.id||
   !physical(e?.b)||e.b.honroStage!==descriptor.id||e.b.phase!=='won'||receipt?.stage!==descriptor.id||receipt?.settlement!==false||
   !flagsValid(receipt.flags)||!same(receipt.flags,descriptor.terminalFlags))return null;
  const crew=capture(e.b,parked,descriptor.exit,descriptor.parkedOnExit);
  if(!crew)return null;
  // Existing owners may use native Mage rows and one map of parked rows; each
  // is compared to the live/parked reference, never accepted as new state.
  const projected=receipt.actors??(receipt.mage?[receipt.mage,...Object.values(receipt.external??{})]:[]);
  if(!Array.isArray(projected)||projected.length!==4||new Set(projected.map(u=>u.cls)).size!==4||
    projected.some(u=>!actor(u,u.cls)||!Object.keys(view(u)).every(k=>same(u[k],crew[u.cls]?.[k]))))return null;
  let boundary;
  if(descriptor.id===54){
   const w=receipt.chart,mage=crew.mage,relay=receipt.relay;
   if(!Array.isArray(w)||!eq(w.map(x=>x.id),['N>L','L>C','C>L'])||!w.every(x=>x.actor===mage.id&&x.grounded===true)||
      !Number.isInteger(relay?.shot)||relay.y!==2930||
      !e.b.stakes?.some(x=>x.shot===relay.shot&&x.owner===mage.id&&x.skill==='M09'&&x.y===relay.y)||
      typeof e.grounded!=='function'||!e.grounded(e.unit(mage.id)))return null;
   const liveMage=e.unit(mage.id);
   if(!liveMage||!same(view(liveMage),crew.mage))return null;
   boundary={chart:structuredClone(w),relay:structuredClone(relay),fullParkedMage:structuredClone(liveMage)};
  }else if(descriptor.id===55){
   const liveMage=previous?.boundary?.fullParkedMage;
   if(previous?.stage!==54||!liveMage||!same(view(liveMage),crew.mage)||e.b.units.some(x=>x.side===0&&x.id===liveMage.id))return null;
      const fullOuter=Object.fromEntries(body(e.b).map(x=>[x.cls,structuredClone(x)]));
   if(!['archer','knight','occultist'].every(cls=>fullOuter[cls]&&same(view(fullOuter[cls]),crew[cls])))return null;
   boundary={fullParkedMage:structuredClone(liveMage),fullOuter};
  }else if(descriptor.id===56){
   const liveMage=e.unit(crew.mage.id);
   if(!liveMage||!same(view(liveMage),crew.mage)||!e.grounded(liveMage)||!Array.isArray(receipt.events)||!receipt.events.includes('exitReached')||
    !receipt.reflow?.some(r=>r.key==='native-reversal')||!receipt.reflow?.some(r=>r.key==='native-evade'))return null;
      const fullOuter=previous?.boundary?.fullOuter;
   if(previous?.stage!==55||!['archer','knight','occultist'].every(cls=>fullOuter?.[cls]&&same(view(fullOuter[cls]),crew[cls])))return null;
   boundary={fullMage:structuredClone(liveMage),fullOuter:structuredClone(fullOuter),events:structuredClone(receipt.events),reflow:structuredClone(receipt.reflow)};
  }else if(descriptor.id===57){
   if(!receipt.association?.seamReady||!receipt.guard?.ref||receipt.guard.ref!=='local-07-gwakjin-return-keeper'||
      !Array.isArray(receipt.body)||receipt.body.length!==4||!receipt.body.every(row=>{const u=e.unit(row.id);return !!u&&u.cls===row.role&&e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==='local-07-08-exact-receiving-slice'&&Number.isFinite(row.receiving?.[0])&&Number.isFinite(row.receiving?.[1]);}))return null;
   const full=Object.fromEntries(body(e.b).map(x=>[x.cls,structuredClone(x)]));
   if(!roles.every(cls=>full[cls]&&same(view(full[cls]),crew[cls])))return null;
   boundary={full,receiving:Object.fromEntries(receipt.body.map(r=>[r.role,{x:r.receiving[0],y:r.receiving[1]}])),guard:structuredClone(receipt.guard),association:structuredClone(receipt.association)};
  }
  if(descriptor.id===58){
   const guard=receipt.guard;if(guard?.ref!=='local-07-gwakjin-return-keeper'||receipt.association?.seamReady!==true)return null;
   const f=e.b.honroState?.flags;
   if(!f?.localFourBodyExit||f['place(correctedInnerStake)']!==true||e.b.units.some(u=>u.side===0&&!u.summoned&&!e.grounded(u)))return null;
   boundary={full:Object.fromEntries(body(e.b).map(u=>[u.cls,structuredClone(u)])),guard:structuredClone(guard),association:structuredClone(receipt.association)};
  }
  if(descriptor.id===59){
   const {witness,guardAftermath,finalThreat,closed}=auxiliary??{};
   if(closed!==true||!witness||!guardAftermath||!finalThreat)return null;
   boundary={full:Object.fromEntries(body(e.b).map(u=>[u.cls,structuredClone(u)])),witness:structuredClone(witness),
    guardAftermath:structuredClone(guardAftermath),finalThreat:structuredClone(finalThreat),closed:true};
  }
  const key=profileKey(app);
  if(key===null||key===undefined)return null;
  seen.add(e);
  const cap=freeze({stage:descriptor.id,won:true,settlement:false,flags:structuredClone(receipt.flags),crew,...(boundary?{boundary}:{})});
  pending.set(app,{cap,engine:e,profile:app.profile,key,stage:app.stage,revision:app.profileImportSequence});
  return cap;
 }
 function sameBoundary(app,p,id){
  return allowed(app)&&p&&app.screen==='battle'&&app.done===true&&p.cap.stage===id-1&&app.engine===p.engine&&p.engine.b.phase==='won'&&app.profile===p.profile&&
   p.key===profileKey(app)&&p.stage===app.stage&&p.revision===app.profileImportSequence&&!spent.has(p.cap);
 }
 function available(t,app,id){
  const d=rows.get(id),p=pending.get(app);
  return t===token&&!!d&&sameBoundary(app,p,id)&&Object.keys(d.requiresFlags).every(k=>p.cap.flags[k]===true);
 }
 function offer(t,app,id,button){
  if(!available(t,app,id)||!button?.isConnected||typeof button.addEventListener!=='function')return false;
  button.addEventListener('click',async event=>{
   if(event.isTrusted!==true||event.currentTarget!==button||!button.isConnected||!available(t,app,id)||flights.has(app))return;
   const d=rows.get(id),p=pending.get(app),node=app.root.firstElementChild,live=()=>button.isConnected&&app.root.firstElementChild===node&&available(t,app,id)&&pending.get(app)===p;
   const controller=new AbortController();flights.set(app,controller);button.disabled=true;
   try{
    const url=new URL(d.path,origin),r=await G.fetch(url,{signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store'});
    if(!r.ok||r.url!==url.href)throw Error('Late chapter response owner');
    const bytes=await r.arrayBuffer();if(bytes.byteLength!==d.bytes||await sha(G,bytes)!==d.sha256)throw Error('Late chapter content mismatch');
    const packet=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if(packet?.schema!=='honro-act6-late-qa-packet-v1'||packet.id!==id||packet.authoredId!==d.authoredId||packet.runtimeReleaseEnabled!==false||
       packet.map?.id!==d.authoredId||packet.map.metadata?.stageId!==id||packet.map.metadata.campaign!==false||
       await sha(G,encode(packet.map))!==d.mapSHA||await sha(G,encode(packet.library))!==d.assetSHA||
       ['actors','profile','crew','winner','terminal','hp','phase'].some(k=>own(packet,k)))throw Error('Source packet is not authored geometry');
    const compiled=compile(packet.map,packet.library);
    if(await sha(G,encode(compiled?.terrain))!==d.playSHA||await sha(G,encode(compiled?.worldTerrain))!==d.worldSHA)throw Error('Late chapter collider mismatch');
    const party=await owners[id].prepare({descriptor:d,packet:freeze(packet),compiled,previous:p.cap});
    if(!live()||flights.get(app)!==controller||!party)return;
    const ticket=Object.freeze({}),prepared={ticket,d,packet,compiled,party,previous:p.cap,live,attached:false};
    // Hand back to the ORIGINAL private App.launch→App.mount owner. No
    // storage reads/writes and no changes to App, phase or roster here.
    grant.set(app,prepared);
    try{ if(enterNative(app,id,ticket)!==true||!prepared.attached)throw Error('Native App did not consume late owner'); }
    finally{grant.delete(app);}
    spent.add(p.cap);pending.delete(app);
   }catch(err){if(live())app.notify?.('다음 장을 열지 못했습니다.'); if(!controller.signal.aborted)G.console?.error(err);}
   finally{if(flights.get(app)===controller)flights.delete(app);if(button.isConnected)button.disabled=false;}
  },{passive:true});
  return true;
 }
 const grant=new WeakMap();
 function launch(t,app,id,ticket){
  const g=grant.get(app);
  if(t!==token||!g||g.ticket!==ticket||g.d.id!==id||!g.live()||g.started)return false;
  g.started=true;
  // Host must call attach inside the existing App.mount native transaction.
  return mount(app,{id,packet:g.packet,compiled:g.compiled,party:g.party,ticket})===true;
 }
 function attach(t,app,e,ticket){
  const g=grant.get(app);
  if(t!==token||!g||!g.started||g.ticket!==ticket||g.attached||app.engine!==e||app.stageId!==g.d.id||
    !physical(e?.b)||e.b.honroStage!==g.d.id||e.b.honroAuthoredId!==g.d.authoredId||e.b.phase!=='aim'||!allowed(app))return false;
  const parked=Object.fromEntries(g.d.parked.map(r=>[r,g.previous.crew[r]]));
  const actual=capture(e.b,parked,g.d.entry,g.d.parked);
  if(!actual||!same(actual,g.previous.crew))return false;
  const ops=owners[g.d.id].attach({app,engine:e,prepared:g.party,receipt:g.previous,packet:g.packet,compiled:g.compiled});
  if(!ops||typeof ops.project!=='function'||typeof ops.terminal!=='function')return false;
  sessions.set(e,{app,e,b:e.b,stage:app.stage,profile:app.profile,profileKey:profileKey(app),d:g.d,ops,parked,previous:g.previous});
  g.attached=true;
  return true;
 }
 function project(t,app,e){
  if(t!==token)return null;
  const s=session(app,e);
  if(!stages.includes(e?.b?.honroStage))return null;
  return s?.ops.project()??{complete:false,objectiveReady:false,blocked:true,targets:[]};
 }
 function relay(t,app,e,kind,args){
  if(t!==token||!Array.isArray(args))return null;
  const s=session(app,e);
  if(!s||!s.d.events?.includes(kind)||typeof s.ops[kind]!=='function'||['won','lost'].includes(e.b.phase))return null;
  return s.ops[kind](...args);
 }
 function finish(t,app,e){
  const s=t===token?session(app,e):null;
  if(!s||e.b.phase!=='won'||s.ops.project()?.complete!==true)return null;
  const receipt=s.ops.terminal();
  const parked=s.ops.parkedAtExit?.()??s.parked;
  // Do not let an owner create/change a still-parked actor at the outcome
  // boundary. Later explicit native body transfer needs its own proof first.
  if(Object.keys(parked).some(k=>!same(parked[k],s.parked[k])))return null;
  return seal(t,app,e,{descriptor:s.d,receipt,parked,previous:s.previous,auxiliary:s.d.id===59?s.ops.boundaryProof?.(receipt):undefined});
 }
 function abort(t,app){
  if(t!==token)return;
  flights.get(app)?.abort();flights.delete(app);grant.delete(app);pending.delete(app);
 }
 return Object.freeze({seal,available,offer,launch,attach,project,relay,finish,abort,allowColdResume:()=>false});
}
