// Candidate writer: mount via trusted same-origin normal campaign owner only.
// readCurrentExact belongs to the same profile slot and MUST get current bytes;
// ProfileStore.original() is deliberately not allowed as its implementation.
export function createFixedWriter({app,seal,authorize,frame,readCurrentExact,normalize,runExclusive}){
 if(!authorize?.(seal,app)||typeof readCurrentExact!=='function'||typeof normalize!=='function'||typeof runExclusive!=='function')return null;
 const flag='act6.endingCompleted';
 return async (request)=>runExclusive(async ()=>{
  const own=()=>!app.customMap&&!app.debugMode&&!app.profileStore.locked&&app.profile===app.normalProfile&&authorize(seal,app);
  if(!own()||request?.key!==seal.key||request.terminalSha!==seal.terminalSha||request.flag!==flag||request.finalScene!=='later-return'||
  request.witness?.terminalSha!==seal.terminalSha||request.frameProof!==frame||request.recordWitness?.by!==seal.knight||
  JSON.stringify(request.recordWitness.people)!==JSON.stringify(seal.names))return {ok:false,reason:'scope-rejected'};
  const parse=async ()=>{
   try{const bytes=await readCurrentExact();return typeof bytes==='string'?{bytes,raw:JSON.parse(bytes)}:null;}catch{return null;}
  };
  const inspect=(raw)=>{
   if(raw.equipment?.runId!==seal.runId)return {ok:false,reason:'different-run'};
   const stamp=raw.honroEndingReceipt;
   if(!stamp&&!raw.honroFlags?.[flag])return null;
   if(raw.honroFlags?.[flag]!==true||stamp?.key!==seal.key||stamp?.terminalSha!==seal.terminalSha||
     stamp?.winner!==seal.knight||JSON.stringify(stamp.recordedGuardIds)!==JSON.stringify(seal.actorIds))return {ok:false,reason:'different-or-incomplete-winner'};
   return {ok:true,already:true,key:stamp.key,terminalSha:stamp.terminalSha};
  };
  const current=await parse();if(!current||!own())return {ok:false,reason:'live-slot-unavailable'};
  const previous=inspect(current.raw);if(previous)return previous;
  let normalized;try{normalized=normalize(current.bytes);}catch{return {ok:false,reason:'invalid-live-slot'};}
  if(JSON.stringify(normalized)!==JSON.stringify(app.normalProfile))return {ok:false,reason:'stale-owner-profile'};
  const next=structuredClone(normalized);
  next.honroFlags={...(next.honroFlags??{}),[flag]:true};
  next.honroEndingReceipt={revision:'act6-reunion-v1',winner:seal.knight,key:seal.key,terminalSha:seal.terminalSha,recordedGuardIds:seal.actorIds.slice()};
  // Exact same-slot reread occurs while held; callers must route every writer
  // for this slot through the same lock, or provide sole authoritative owner.
  const check=await parse();if(check?.bytes!==current.bytes||!own())return {ok:false,reason:'slot-changed-before-save'};
  const accepted=app.profileStore.save(next);
  const persisted=await parse();
  if(persisted&&inspect(persisted.raw)?.ok){
   if(accepted){app.profile=next;app.normalProfile=next;}
   return {ok:true,already:!accepted,key:seal.key,terminalSha:seal.terminalSha};
  }
  return {ok:false,reason:accepted?'readback-unconfirmed':'stock-save-retry-required'};
 });
}
