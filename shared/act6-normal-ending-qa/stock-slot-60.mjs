// Final save owns a single per-run extension on the approved origin. The
// existing 1–50 campaign writer is never given a second writable handle.
// Real stock ProfileStore code receives a lexical storage port. No global
// Storage monkeypatch, app store, user profile, arbitrary key, or unlocked write.
export function create60StockSlot(G,{live,factory,writePort,basePath='/',origin='http://127.0.0.1:18861',released=false,anchor=()=>true}){
 const qaKey='honro-act6-normal-profile-L-1', stockKey='honro-first-act-profile-1';
 const keyFor=run=>released?'honro-campaign-act6-finale-v1:'+run:qaKey;
 const allowed=released?origin==='https://sys8994.github.io'&&basePath==='/honro/':origin==='http://127.0.0.1:18861';
 if(!allowed||!factory||!G.isSecureContext||G.location.origin!==origin||(!['/','/honro/'].includes(basePath)||![basePath,basePath+'HONRO.html',basePath+'index.html'].includes(G.location.pathname))||
 G.HONRO_EMBEDDED||typeof G.navigator?.locks?.request!=='function'||typeof G.localStorage?.getItem!=='function')return null;
 const locks=G.navigator.locks,real=G.localStorage;
 const gids=['local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay'];
 const digest=q=>typeof q==='string'&&/^[a-f0-9]{64}$/.test(q), endingKey=(run,sha)=>'act6-ending:'+run+':'+sha;
 const runGood=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{8,64}$/.test(v);
 const rawAt=key=>real.getItem(key);
 const readOnly=(key)=>({get length(){return rawAt(key)===null?0:1},key:i=>i===0&&rawAt(key)!==null?stockKey:null,getItem:k=>k===stockKey?rawAt(key):null,
  setItem(){throw Error('read-only Act6 stock slot');},removeItem(){throw Error('read-only Act6 stock slot');}});
 function peek(key,run){
  if(rawAt(key)===null)return null;
  try{
   const read=factory(G,readOnly(key)).create(),p=read.initial,r=p.honroEndingReceipt;
   if(!read.locked&&read.original().text===rawAt(key)&&!p.honroBattle&&p.honroFlags?.['act6.endingCompleted']===true&&r?.revision==='act6-reunion-v1'&&r.winner==='p-knight'&&runGood(p.equipment?.runId)&&
    (!run||p.equipment.runId===run)&&digest(r.terminalSha)&&r.key===endingKey(p.equipment.runId,r.terminalSha)&&JSON.stringify(r.recordedGuardIds)===JSON.stringify(gids))return r;
  }catch{/* Unreadable persisted record is never promoted. */}
  return null;
 }
 function completed(app){
  const run=app?.normalProfile?.equipment?.runId;
  if(!released||!runGood(run)||app.profile!==app.normalProfile||app.profileStore.locked||app.normalProfile.honroActEnding||app.normalProfile.honroBattle)return null;
  const normal=app.profileStore.original()?.text;
  return typeof normal==='string'&&real.getItem(stockKey)===normal?peek(keyFor(run),run):null;
 }
 const observer=G.document.documentElement;
 const reread=!released&&observer?peek(qaKey):null;
 if(reread)observer.dataset.act6StockSlotReopened=reread.terminalSha;
 function open(app,e,proof){
  if(!live(app,e,proof)||!runGood(proof.runId)||!digest(proof.rawSHA)||proof.endingKey!==endingKey(proof.runId,proof.rawSHA)||JSON.stringify(proof.guard?.roleIds)!==JSON.stringify(gids))return null;
  const key=keyFor(proof.runId), lock='honro:profile-slot:'+key;
  const raw=()=>rawAt(key), saveBase=app.profileStore.original?.()?.text, hasBase=typeof saveBase==='string';
  const own=()=>live(app,e,proof)&&(!released||hasBase&&real.getItem(stockKey)===saveBase&&anchor(app,e,proof));
  if(!own())return null;
  const copy=G.HonroProfileStore.migrate(JSON.stringify(app.profile));
  if(copy.honroBattle||copy.equipment?.runId!==proof.runId||JSON.stringify(G.HonroProfileStore.migrate(JSON.stringify(copy)))!==JSON.stringify(copy))return null;
  const baseline=JSON.stringify(copy);
  let locked=false;
  const storage={get length(){return 1},key:i=>i===0?stockKey:null,
   getItem:k=>k===stockKey?(raw()??baseline):null,
   setItem(k,v){
    if(k!==stockKey||!locked||!own()||typeof v!=='string')throw Error('unowned QA stock write');
    real.setItem(key,v);
   },
   removeItem(){throw Error('unowned QA stock removal');}};
  const stock=factory(G,storage), initial=stock.create();
  if(initial.locked||initial.original().text!==storage.getItem(stockKey)||initial.initial.equipment.runId!==proof.runId)return null;
  const lockPort={request(name,options,fn){
   if(name!==lock||options.mode!=='exclusive')return Promise.reject(Error('wrong QA lock'));
   return locks.request(name,options,async()=>{
    if(locked)throw Error('duplicate QA owner lock');
    locked=true;try{return await fn();}finally{locked=false;}
   });
  }};
  const staged=Object.create(app);
  staged.profile=staged.normalProfile=copy;
  staged.profileStore=Object.freeze({get locked(){return initial.locked},save(p){return locked&&own()&&initial.save(p);}});
  const write=writePort({authorize:(a,eng,p)=>a===staged&&eng===e&&p===proof&&own(),
   ownedSlot:()=>key,readSameSlot:k=>k===key?(raw()??baseline):null,normalize:stock.migrate,locks:lockPort});
  return (req,still)=>write(staged,e,proof,req,still);
 }
 return Object.freeze({open,completed});
}
