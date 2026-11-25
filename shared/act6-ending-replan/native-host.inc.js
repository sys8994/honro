// The already-certified Stage 60 world remains visible. The canvas is never moved, cloned or reframed.
function createEndingDOMDirect({authorize,container,writeFinal}){
 const surfaces=new WeakMap();
 const current=s=>!!s&&!s.inactive&&surfaces.get(s.app)===s&&s.app.engine===s.engine&&s.app.scene?.canvas===s.canvas&&
  container(s.app)?.querySelector('#battlecanvas')===s.canvas&&s.canvas.isConnected&&
  authorize(s.app,s.engine,s.proof)&&s.view.root.isConnected;
 function readPanelFrame(app,e,proof,v,display,size){
  const s=surfaces.get(app);
  return current(s)&&s.engine===e&&s.proof===proof&&s.display===display&&v?.scene==='live-stage60'&&
    size.w===s.size.w&&size.h===s.size.h?s.frame:null;
 }
 function trustedUIAction(app,e,event,control,kind){
  const s=surfaces.get(app);
  if(!current(s)||s.engine!==e||!event?.isTrusted||s.action?.event!==event||s.action?.control!==control||
     kind!=='finish'||!s.view.root.contains(control))return false;
  s.action=null;return true;
 }
 async function writeEnding(app,e,p,req){
  const s=surfaces.get(app),f=s?.frame;
  const still=()=>current(s)&&s.engine===e&&s.proof===p&&s.finishedInput&&s.frame===f;
  if(!still()||req?.frameProof!==f||req.key!==p.endingKey||req.terminalSha!==p.rawSHA||
     req.flag!=='act6.endingCompleted'||req.finalScene!=='later-return')return {ok:false,reason:'stage60-unowned-finale'};
  return writeFinal(app,e,p,req,still);
 }
 function mountEnding(app,engine,proof,ui){
  const parent=container(app),canvas=parent?.querySelector('#battlecanvas');
  if(!canvas?.isConnected||app.scene?.canvas!==canvas||!authorize(app,engine,proof)||surfaces.has(app))throw Error('Stage 60 ending owner inactive');
  const view=act6EndingReplan.open(app,'completion',()=>{app.showTitle();app.updateAudio();});
  if(!view)throw Error('Stage 60 ending surface already mounted');
  const s={app,engine,proof,canvas,view,size:{w:canvas.width,h:canvas.height},frame:Object.freeze({}),display:Object.freeze({}),action:null,finishedInput:false,inactive:false};
  surfaces.set(app,s);
  const dispose=()=>{s.inactive=true;surfaces.delete(app);view.close();};
  act6EndingReplan.intro(view,{async finish(event){
   if(!current(s)||!event.isTrusted)return {ok:false};
   const control=event.currentTarget instanceof G.HTMLElement&&view.root.contains(event.currentTarget)?event.currentTarget:view.root;
   const ticket=await ui.confirmPanel(s.display,s.size);
   if(!ticket||!current(s))return {ok:false};
   s.action={event,control};s.finishedInput=true;
   try{return await ui.input('finish',{event,control,frame:ticket});}
   finally{s.action=null;s.finishedInput=false;}
  }});
  return dispose;
 }
 return Object.freeze({mountEnding,readPanelFrame,trustedUIAction,writeEnding});
}
