// Uses the verified Stage 60 battle frame and its private same-slot writer.
function createEndingDOMV2({authorize,container,renderNative,verifyNative,writeFinal}){
 const surfaces=new WeakMap();
 const current=s=>!s.inactive&&surfaces.get(s.app)===s&&s.app.engine===s.engine&&authorize(s.app,s.engine,s.proof)&&s.view.root.isConnected;
 function readPanelFrame(app,e,proof,v,display,size){
  const s=surfaces.get(app),f=s?.frame;
  if(!s||!f||!current(s)||s.engine!==e||s.proof!==proof||s.display!==display||
     v.scene!=='bridge-record'||!s.view.backdrop.contains(f.node)||
     size.w!==s.size.w||size.h!==s.size.h||!verifyNative(app,e,proof,'bridge-record',f.native,f.node,size))return null;
  return f;
 }
 function trustedUIAction(app,e,event,control,kind){
  const s=surfaces.get(app);
  if(!s||!current(s)||s.engine!==e||!event.isTrusted||s.action?.event!==event||s.action?.control!==control||s.action?.kind!==kind||
     !['record','depart'].includes(kind)||!s.view.root.contains(control))return false;
  s.action=null;return true;
 }
 async function writeEnding(app,e,p,req){
  const s=surfaces.get(app),f=s?.frame;
  const still=()=>s&&current(s)&&s.engine===e&&s.proof===p&&s.frame===f&&f?.walked()===1&&
    !!readPanelFrame(app,e,p,{scene:'bridge-record'},s.display,s.size);
  if(!still()||req?.frameProof!==f||req.key!==p.endingKey||req.terminalSha!==p.rawSHA||
     req.flag!=='act6.endingCompleted'||req.finalScene!=='later-return')return {ok:false,reason:'stage60-unowned-departure'};
  return writeFinal(app,e,p,req,still);
 }
 function mountEnding(app,engine,proof,ui){
  const parent=container(app);
  if(!parent?.isConnected||!authorize(app,engine,proof)||surfaces.has(app))throw Error('Stage 60 ending owner inactive');
  const view=act6EndingReplan.open(app,'completion',()=>{app.showTitle();app.updateAudio();});
  if(!view)throw Error('Stage 60 ending surface already mounted');
  const outer=view.root.getBoundingClientRect(),size={w:Math.min(4096,Math.floor(outer.width)),h:Math.min(4096,Math.floor(outer.height))};
  const s={app,engine,proof,size,view,frame:null,display:null,ticket:null,action:null,inactive:false};
  surfaces.set(app,s);
  const dispose=()=>{s.inactive=true;surfaces.delete(app);view.close();};
  let pending=false;
  async function start(){
   if(pending||s.frame||!current(s))return;pending=true;view.controls.replaceChildren();
   try{
    const f=await renderNative(app,engine,proof,'bridge-record',size,{signal:view.lifecycle.signal,endingV2:true});
    if(!current(s))return;
    if(!f?.walk||!verifyNative(app,engine,proof,'bridge-record',f.native,f.node,size))throw Error('Native post-battle frame missing');
    s.frame=f;s.display=Object.freeze({});view.backdrop.replaceChildren(f.node);view.cleanupNative=f.dispose;
    await new Promise(done=>view.frame(()=>view.frame(done)));
    if(!current(s))return;
    s.ticket=await ui.confirmPanel(s.display,size);
    if(!s.ticket)throw Error('Native Stage 60 frame not confirmed');
    const invoke=async(kind,event)=>{
     if(!current(s)||!event.isTrusted||!s.ticket)return {ok:false};
     const control=event.currentTarget instanceof G.HTMLElement&&view.root.contains(event.currentTarget)?event.currentTarget:view.root;
     s.action={event,control,kind};
     try{return await ui.input(kind,{event,control,frame:s.ticket});}finally{s.action=null;}
    };
    view.status.textContent='';
    act6EndingReplan.intro(view,{surface:f.walk,record:event=>invoke('record',event),depart:event=>invoke('depart',event)});
   }catch(error){
    if(!current(s))return;
    view.cleanupNative?.();view.cleanupNative=null;s.frame=null;s.display=null;s.ticket=null;
    view.status.textContent='엔딩 장면을 불러오지 못했습니다.';
    const retry=G.document.createElement('button');retry.type='button';retry.className='he-button';retry.textContent='다시 불러오기';
    retry.addEventListener('click',e=>{if(e.isTrusted)void start();});view.controls.replaceChildren(retry);
   }finally{pending=false;}
  }
  void start();return dispose;
 }
 return Object.freeze({mountEnding,readPanelFrame,trustedUIAction,writeEnding});
}
