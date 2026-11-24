// Explicit loopback QA only. The serialized candidate is never the ordinary slot.
// Real stock ProfileStore code receives a lexical storage port. No global
// Storage monkeypatch, app store, user profile, arbitrary key, or unlocked write.
export function create60StockSlot(G,{live,factory,writePort}){
 const key='honro-act6-r10b-profile-L-1',stockKey='honro-first-act-profile-1',lock='honro:profile-slot:'+key;
 if(!factory||!G.isSecureContext||G.location.origin!=='http://127.0.0.1:18861'||G.location.pathname!=='/HONRO.html'||
 G.HONRO_EMBEDDED||typeof G.navigator?.locks?.request!=='function'||typeof G.localStorage?.getItem!=='function')return null;
 const locks=G.navigator.locks,real=G.localStorage;
 const gids=['local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay'];
 const digest=q=>typeof q==='string'&&/^[a-f0-9]{64}$/.test(q), endingKey=(run,sha)=>'act6-ending:'+run+':'+sha;
 const raw=()=>real.getItem(key);
 const readOnly=()=>({get length(){return raw()===null?0:1},key:i=>i===0&&raw()!==null?stockKey:null,getItem:k=>k===stockKey?raw():null,
  setItem(){throw Error('read-only QA stock slot');},removeItem(){throw Error('read-only QA stock slot');}});
 const observer=G.document.documentElement;
 if(raw()!==null&&observer)try{
  const read=factory(G,readOnly()).create(), p=read.initial, r=p.honroEndingReceipt;
  if(!read.locked&&read.original().text===raw()&&!p.honroBattle&&p.honroFlags?.['act6.endingCompleted']===true&&r?.revision==='act6-reunion-v1'&&r.winner==='p-knight'&&p.equipment?.runId&&
   digest(r.terminalSha)&&r.key===endingKey(p.equipment.runId,r.terminalSha)&&JSON.stringify(r.recordedGuardIds)===JSON.stringify(gids))
   observer.dataset.act6StockSlotReopened=r.terminalSha;
 }catch{/* Unreadable persisted candidate cannot be promoted/retried. */}
 function open(app,e,proof){
  if(!live(app,e,proof)||!proof.runId||!digest(proof.rawSHA)||proof.endingKey!==endingKey(proof.runId,proof.rawSHA)||JSON.stringify(proof.guard?.roleIds)!==JSON.stringify(gids))return null;
  const copy=G.HonroProfileStore.migrate(JSON.stringify(app.profile));
  if(copy.honroBattle||copy.equipment?.runId!==proof.runId||JSON.stringify(G.HonroProfileStore.migrate(JSON.stringify(copy)))!==JSON.stringify(copy))return null;
  const baseline=JSON.stringify(copy);
  let locked=false;
  const storage={get length(){return 1},key:i=>i===0?stockKey:null,
   getItem:k=>k===stockKey?(raw()??baseline):null,
   setItem(k,v){
    if(k!==stockKey||!locked||!live(app,e,proof)||typeof v!=='string')throw Error('unowned QA stock write');
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
  staged.profileStore=Object.freeze({get locked(){return initial.locked},save(p){return locked&&live(app,e,proof)&&initial.save(p);}});
  const write=writePort({authorize:(a,eng,p)=>a===staged&&eng===e&&p===proof&&live(app,e,proof),
   ownedSlot:()=>key,readSameSlot:k=>k===key?(raw()??baseline):null,normalize:stock.migrate,locks:lockPort});
  return (req,still)=>write(staged,e,proof,req,still);
 }
 return Object.freeze({open});
}
