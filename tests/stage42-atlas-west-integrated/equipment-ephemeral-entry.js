// Test-only. Must be installed into an empty, unmounted disposable Stage42 App.
// This preserves the stock transaction/candidate logic and swaps only the two exact
// pre-mount acknowledgements for RAM; everything else invokes the original save.
function stage42EquipmentEntryInMemory(app,G,StorageRead){
 const need=(b,msg)=>{if(!b)throw Error(msg)};
 const clone=structuredClone, eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const E=G.HonroEquipment,store=app.profileStore,profile=app.profile;
 const desc=Object.getOwnPropertyDescriptor(store,'save');
 const scope={observe:0,notices:0,notificationCount:0};
 const safe=()=>!app.engine&&app.screen==='title'&&app.stageId===42&&!app.debugMode&&!app.training&&!app.customMap&&!store.locked&&StorageRead()===0;
 need(safe()&&desc?.configurable===true&&typeof desc.value==='function'&&E?.observe&&E.collect&&E.notices,'Exact fresh Stage42 entry adapter scope');
 need(profile?.equipment?.initialAutoEquip===true&&profile.equipment.basicPrepared?.length===0&&
  profile.equipment.ownedItemIds?.length===0&&Object.keys(profile.equipment.rewardLedger).length===0&&Object.keys(profile.cleared??{}).length===0&&
  profile?.game==='honro'&&!profile.honroBattle&&profile.recruited?.length>0,'Expected blank isolated QA profile');
 const allowed={archer:'eq_se_start',mage:'eq_da_join',knight:'eq_hw_join',occultist:'eq_so_join'};
 const expectedFacts=profile.recruited.map(c=>allowed[c]).sort();
 need(expectedFacts.every(Boolean)&&new Set(expectedFacts).size===expectedFacts.length,'Unknown entry cast');
 const mask=p=>{const q=clone(p);delete q.equipment;for(const h of Object.values(q.heroes))delete h.equipmentIds;return q;};
 const expected=clone(profile);
 need(E.collect(expected,null,{initial:true}),'Stock exact initial equipment transaction not found');
 E.sync(expected);E.validate(expected.equipment);
 need(eq(mask(profile),mask(expected))&&eq(Object.keys(expected.equipment.rewardLedger).sort(),expectedFacts)&&
  Object.values(expected.equipment.rewardLedger).every(r=>r.state==='committed'&&r.notified===false)&&
  eq(expected.equipment.basicPrepared,profile.recruited),'Unexpected non-start equipment change');
 const expectedNotice=clone(expected);
 for(const r of Object.values(expectedNotice.equipment.rewardLedger))r.notified=true;
 E.sync(expectedNotice);E.validate(expectedNotice.equipment);
 let token=null;
 const original=desc.value;
 const guardedSave=function(candidate,...args){
  if(token&&safe()&&this===store&&app.profile===token.from&&scope[token.kind]===0&&args.length===0&&eq(candidate,token.to)){
   scope[token.kind]++;return true;
  }
  return original.call(this,candidate,...args);
 };
 Object.defineProperty(store,'save',{...desc,value:guardedSave});
 try{
  token={kind:'observe',from:profile,to:expected};
  need(E.observe(app,{initial:true})===true&&scope.observe===1&&eq(app.profile,expected),'Exact stock starter gear cannot be acknowledged in memory');
  token={kind:'notices',from:app.profile,to:expectedNotice};
  const notices=E.notices(app);
  scope.notificationCount=notices.length;
  need(scope.notices===1&&scope.notificationCount===expectedFacts.length&&eq(app.profile,expectedNotice),'Exact starter notifications cannot be acknowledged in memory');
 }finally{
  token=null;
  Object.defineProperty(store,'save',desc);
 }
 need(safe()&&store.save===original,'No effect and original persistence should be restored');
 return Object.freeze({...scope,storeRestored:true,policy:'normal stock entry equipment only, two RAM acknowledgements, guard continues blocking unintended writes'});
}
if(typeof window!=='undefined'){
 if(!['localhost','127.0.0.1'].includes(location.hostname)||!location.pathname.endsWith('/HONRO.html'))throw Error('Disposable Player only');
 Object.defineProperty(window,'HonroStage42EquipmentEntryInMemory',{value:stage42EquipmentEntryInMemory});
}
if(typeof module!=='undefined')module.exports=stage42EquipmentEntryInMemory;
