function prepare60UI(G){
 if(typeof G.document?.createElement!=='function'||!G.document?.head||!G.crypto?.subtle)return null;
 const C=G.HONRO_CORE, owners=new WeakMap(), snapshots=new WeakMap();
 const live=(app,e,p)=>{const s=owners.get(e);return app.engine===e&&app.stageId===60&&e.b.phase==='won'&&s?.app===app&&s.proof===p&&s.profile===app.profile;};
 const stockSlot=stockSlot60Factory?create60StockSlot(G,{live,factory:stockSlot60Factory,writePort:createEndingWritePort}):null;
 const capture=createNativeEndingCuts({G,authorize:live,outcomeFor:(a,e)=>owners.get(e)?.terminal,
  liveCanvas:a=>a.root.querySelector('#battlecanvas'),
  drawLive(a,e,p,node){if(!live(a,e,p)||a.root.querySelector('#battlecanvas')!==node)return false;a.scene.render(e,0,a.selected,.5,false,0,true);return true;},
  geometryFor(a,e,p){const s=owners.get(e),q=s?.quiet;if(!q)return null;const t=e.b.terrain.find(v=>v.id===q.support),y=C.topAt(t,q.gate);return {floor:q.support,gate:[q.gate,y],souls:q.souls};}});
 const dom=createEndingDOM({authorize:live,container:app=>app.root,renderNative:capture.renderNative,verifyNative:capture.verifyNative,
  resolveAsset:asset=>'/'+asset.asset,writeFinal(a,e,p,request,still){
   const q=snapshots.get(e);if(!q||!live(a,e,p)||!still())return {ok:false,reason:'unowned-isolated-ending'};
   if(stockSlot60Factory)return q.stock(request,still);
   const normal=Object.create(a);normal.profile=normal.normalProfile=q.profile;
   normal.profileStore={locked:false,save(next){if(!live(a,e,p)||!still())return false;try{G.sessionStorage.setItem(q.key,JSON.stringify(next));return true;}catch{return false;}}};
   return q.write(normal,e,p,request,still).then(result=>{if(result?.ok!==true)G.console.warn("Act6 isolated ending write refused: "+result?.reason);return result;});
  }});
 function seal(app,e,terminal){const s=owners.get(e);if(s?.app===app&&terminal?.stage===60&&!s.terminal)s.terminal=terminal;}
 function bind(app,e,proof,ui,quiet){
  if(G.location.origin!=='http://127.0.0.1:18861'||owners.has(e)||!quiet)return ()=>{};
  const notice=G.document.getElementById?.('notice');
  if(notice?.textContent==='저작 목표를 완료했습니다. 이 검수 결과는 정식 기록에 쓰지 않습니다.'){
   G.clearTimeout?.(app.noti);notice.hidden=true;
  }
  const profile=app.profile;
  owners.set(e,{app,proof,profile,quiet});
  const style=G.document.createElement('style');style.textContent=STAGE60_ENDING_CSS;G.document.head.append(style);
  const key='honro-act6-qa-ending:'+proof.rawSHA;
  const available=()=>live(app,e,proof)&&typeof G.navigator?.locks?.request==='function'&&!!G.sessionStorage;
  try{
   if(stockSlot60Factory){
    const scoped=stockSlot?.open(app,e,proof);if(scoped)snapshots.set(e,{stock:scoped});
   }else if(available()){
    const copy=G.HonroProfileStore.migrate(JSON.stringify(profile));
    if(copy?.equipment?.runId!==proof.runId||JSON.stringify(G.HonroProfileStore.migrate(JSON.stringify(copy)))!==JSON.stringify(copy))throw Error('60 isolated slot canonical mismatch');
    const q={key,profile:copy,write:createEndingWritePort({authorize:(a,eng,p)=>a.engine===eng&&eng===e&&p===proof&&live(app,e,proof),ownedSlot:()=>key,readSameSlot:k=>G.sessionStorage.getItem(k)??JSON.stringify(copy),normalize:G.HonroProfileStore.migrate,locks:G.navigator.locks})};snapshots.set(e,q);
   }
   const unmount=dom.mountEnding(app,e,proof,ui);
   return ()=>{unmount();owners.delete(e);snapshots.delete(e);style.remove();};
  }catch(error){owners.delete(e);snapshots.delete(e);style.remove();throw error;}
 }
 return {bind,seal,readPanelFrame:dom.readPanelFrame,trustedUIAction:dom.trustedUIAction,writeEnding:dom.writeEnding};
}
