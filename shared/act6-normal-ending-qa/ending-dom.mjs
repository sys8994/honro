// Stage60 scope only. All ports must come from the private mounted App/Engine owner.
const cuts=['last-souls','bridge-record','daybreak','later-return'];
const title={'last-souls':'다시 흐르는 길','bridge-record':'길을 지킨 사람들','daybreak':'돌아온 새벽','later-return':'그리고 어느 날'};
const copy={'last-souls':'마지막 혼이 길을 건넙니다.','daybreak':'새벽이 다시 산문에 닿았습니다.'};
const sha=async(w,b)=>Array.from(new Uint8Array(await w.crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
export function createEndingDOM({authorize,container,renderNative,verifyNative,resolveAsset,writeFinal,onDone=()=>{}}){
 if([authorize,container,renderNative,verifyNative,resolveAsset,writeFinal].some(v=>typeof v!=='function'))throw TypeError('Missing private stage60 ending ports');
 const refs=new WeakMap(), screenshots=new WeakMap(), inputs=new WeakMap();
 const current=s=>s.open&&s.app.engine===s.engine&&s.app.stageId===60&&s.engine.b===s.b&&s.b.phase==='won'&&s.root.isConnected&&authorize(s.app,s.engine,s.proof);
 const bounds=s=>{const b=s.panel.getBoundingClientRect();return {w:Math.floor(b.width),h:Math.floor(b.height)};};
 const sameSize=(a,b)=>a.w===b.w&&a.h===b.h;
 function readPanelFrame(app,e,proof,v,display,viewport){
  const s=refs.get(app), f=screenshots.get(display);
  if(!s||s.engine!==e||s.proof!==proof||!current(s)||!f||f!==s.frame||f.scene!==v.scene||!sameSize(f.size,viewport)||!sameSize(f.size,bounds(s))||
     !s.media.contains(f.node)||f.node.getBoundingClientRect().width<1)return null;
  if(f.image){if(!f.node.complete||f.node.naturalWidth!==v.asset.w||f.node.naturalHeight!==v.asset.h||f.sha!==v.asset.sha256)return null;}
  else if(!verifyNative(app,e,proof,v.scene,f.native,f.node,viewport))return null;
  return f;
 }
 function trustedUIAction(app,e,event,control,kind){
  const s=refs.get(app), a=inputs.get(event);
  if(!s||s.engine!==e||!current(s)||!a||a.s!==s||a.control!==control||a.kind!==kind||a.frame!==s.ticket||
   event.isTrusted!==true||event.currentTarget!==control||!control.isConnected||!s.controls.contains(control)||control.disabled)return false;
  inputs.delete(event);return true;
 }
 async function writeEnding(app,e,proof,request){
  const s=refs.get(app), f=request?.frameProof;
  if(!s||s.engine!==e||s.proof!==proof||!current(s)||s.finishing||!f||f!==s.frame||f.scene!=='later-return'||s.displayed!=='later-return'||
     request.terminalSha!==proof.rawSHA||request.key!==proof.endingKey||request.flag!=='act6.endingCompleted'||request.finalScene!=='later-return')return {ok:false,reason:'ending-dom-owner-closed'};
  s.finishing=true;
  try{
    // Scoped existing slot writer; this UI never accesses localStorage itself.
    const wrote=await writeFinal(app,e,proof,request,()=>current(s)&&s.frame===f);
    return wrote?.ok?wrote:{ok:false,reason:'ending-save-retry'};
  }finally{s.finishing=false;}
 }
 function mountEnding(app,engine,proof,ui){
  if(refs.has(app)||app.engine!==engine||app.stageId!==60||engine.b?.phase!=='won'||!authorize(app,engine,proof))throw Error('60 owner inactive');
  const parent=container(app),doc=parent?.ownerDocument,w=doc?.defaultView;
  if(!w||!parent.isConnected||!w.crypto?.subtle)throw Error('Ending needs secure connected surface');
  const el=(tag,cl,text)=>{const n=doc.createElement(tag);if(cl)n.className=cl;if(text)n.textContent=text;return n;};
  const root=el('section','honro-ending-60'),panel=el('div','honro-ending-60-panel'),media=el('div','honro-ending-60-media');
  const heading=el('h1','honro-ending-60-title'),script=el('div','honro-ending-60-lines'),controls=el('div','honro-ending-60-controls');
  const status=el('p','honro-ending-60-status');status.setAttribute('role','status');
  root.dataset.stage='60';root.dataset.mode='completion';root.setAttribute('role','region');root.setAttribute('aria-label','혼로 6막 결말');
  media.setAttribute('aria-label','장면');panel.append(media,heading,script,controls,status);root.append(panel);parent.append(root);
  const s={app,engine,proof,ui,root,panel,media,controls,b:engine.b,open:true,result:false,frame:null,ticket:null,seq:0,displayed:null,finishing:false,busy:false,url:null};
  refs.set(app,s);
  const previousActive=doc.activeElement;
  function afterFrames(){return new Promise(done=>w.requestAnimationFrame(()=>w.requestAnimationFrame(done)));}
  function clearMedia(){media.replaceChildren();if(s.url){w.URL.revokeObjectURL(s.url);s.url=null;}}
  function paintText(v){
   heading.textContent=title[v.scene];script.replaceChildren();
   if(copy[v.scene])script.append(el('p','',copy[v.scene]));
   if(v.line)script.append(el('p','',v.line));
   if(v.record){
    for(const [name,line] of v.record.beat){const p=el('p'),n=el('strong','',name+' ');p.append(n,doc.createTextNode(line));script.append(p);}
    if(v.record.recorded)script.append(el('p','honro-ending-60-recorded',[v.record.subject,...v.record.guards].join(' · ')));
   }
  }
  async function verifiedImage(v,seq){
   const path=resolveAsset(v.asset,app);
   const u=new w.URL(path,doc.baseURI);if(u.origin!==w.location.origin||u.username||u.password||!['http:','https:'].includes(u.protocol))throw Error('Untrusted stage60 card assets origin');
   const res=await w.fetch(u.href,{redirect:'error',credentials:'omit',signal:s.load.signal});
   if(!res.ok||res.url!==u.href)throw Error('Stage60 card response mismatch');
   const bytes=await res.arrayBuffer();if(await sha(w,bytes)!==v.asset.sha256)throw Error('Stage60 card digest mismatch');
   if(!current(s)||s.seq!==seq)return null;
   const url=w.URL.createObjectURL(new w.Blob([bytes],{type:v.asset.mime??'image/png'})), image=el('img','honro-ending-60-card');
   // revocation is owned by this generation only; do not revoke a newer render.
   try{
     image.alt='같은 산문에 돌아온 새벽'; image.src=url;await image.decode();
     if(!current(s)||s.seq!==seq||image.naturalWidth!==v.asset.w||image.naturalHeight!==v.asset.h){w.URL.revokeObjectURL(url);return null;}
     s.url=url;return {node:image,image:true,sha:v.asset.sha256};
   }catch(error){w.URL.revokeObjectURL(url);throw error;}
  }
  function installButtons(v){
   const record=v.scene==='bridge-record'&&!v.record.recorded;
   const kind=record?'record':'continue';
   const b=el('button','honro-ending-60-button',record?'방패선의 이름을 적기':v.scene==='later-return'?'여정을 마치기':'계속');
   b.type='button';
   b.addEventListener('click',async event=>{
    if(!current(s)||s.busy||!s.ticket||event.isTrusted!==true||event.currentTarget!==b||b.disabled)return;
    const ticket=s.ticket; inputs.set(event,{s,control:b,kind,frame:ticket});s.busy=true;
    try{
      const pending=ui.input(kind,{event,control:b,frame:ticket});b.disabled=true;
      const result=await pending;
      if(result.ok&&result.done){s.result=true;controls.replaceChildren();status.textContent='여정의 끝을 기록했습니다.';onDone(app,engine,proof,result);return;}
      if(!current(s))return;
      if(!result.ok){status.textContent=v.scene==='later-return'?'기록하지 못했습니다. 다시 눌러 주세요.':'장면을 확인하지 못했습니다.';return;}
      await show();
    }catch(error){if(current(s))status.textContent='장면을 열지 못했습니다. 다시 눌러 주세요.';}
     finally{if(b.isConnected)b.disabled=false;s.busy=false;}
   });
   controls.replaceChildren(b);b.focus({preventScroll:true});
  }
  async function show(){
   if(!current(s)||s.result)return;
   const seq=++s.seq; s.ticket=null;s.frame=null;s.load?.abort();s.load=new w.AbortController();
   const size=bounds(s);if(size.w<1||size.h<1)return;
   const v=ui.view(size.w,size.h);if(!cuts.includes(v?.scene))return;
   s.renderSize=size;s.displayed=v.scene;root.dataset.cut=v.scene;
   controls.replaceChildren();status.textContent='';clearMedia();paintText(v);
   try{
    const f=v.scene==='daybreak'?await verifiedImage(v,seq):await renderNative(app,engine,proof,v.scene,size,{signal:s.load.signal,frame:v.focus});
    if(!current(s)||s.seq!==seq)return;
    if(!f?.node)throw Error('Stage60 native frame not ready');
    if(v.scene!=='daybreak'&&(f.node.tagName!=='CANVAS'||!verifyNative(app,engine,proof,v.scene,f.native,f.node,size)))throw Error('Stage60 native frame unavailable');
    media.append(f.node);await afterFrames();
    if(!current(s)||s.seq!==seq||!sameSize(size,bounds(s))||!media.contains(f.node))return;
    const display=Object.freeze({});
    s.frame=Object.freeze({...f,size,scene:v.scene});screenshots.set(display,s.frame);
    const ticket=await ui.confirmPanel(display,size);
    if(!current(s)||s.seq!==seq)return;
    if(!ticket)throw Error('Stage60 frame authority not ready');
    s.ticket=ticket;installButtons(v);
   }catch(error){
    if(current(s)&&seq===s.seq&&error.name!=='AbortError'){
     status.textContent='이 장면을 불러오지 못했습니다.';
     // Retry only the missing presentation. No event ticket or storage call can be minted here.
     const retry=el('button','honro-ending-60-button','장면 다시 불러오기');retry.type='button';
     retry.addEventListener('click',event=>{if(event.isTrusted&&current(s)&&s.seq===seq)void show();});
     controls.replaceChildren(retry);
    }
   }
  }
  const observer=new w.ResizeObserver(()=>{if(current(s)&&!s.result&&(!s.renderSize||!sameSize(s.renderSize,bounds(s))))void show();});observer.observe(panel);
  // Disable battle controls via host integration of the private separate scene.
  // No capture of unrelated keyboard events and no implicit replay after exit.
  function dispose(){if(!s.open)return;s.open=false;observer.disconnect();s.load?.abort();clearMedia();root.remove();refs.delete(app);if(previousActive?.isConnected)previousActive.focus?.({preventScroll:true});}
  void show();return dispose;
 }
 return Object.freeze({mountEnding,readPanelFrame,trustedUIAction,writeEnding});
}
