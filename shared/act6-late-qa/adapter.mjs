import {createStage60Owner} from './runtime.mjs';
const roles=['archer','knight','occultist','mage'];
const must=['act6.garmjinCompleted','act6.finalThreatResolved'];
const panelOrder=['last-souls','bridge-record','daybreak','later-return'];
const freeze=o=>Object.freeze(o);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function createStage60Adapter(G,{sourceSHA,verifyPrevious,pinGeometry,permitMount,permitEnding,bindEndingView,readPanelFrame,writeEnding,trustedUIAction,report=()=>{}}={}){
 if(!/^[a-f0-9]{64}$/.test(sourceSHA??'')||[verifyPrevious,pinGeometry,permitMount,permitEnding,bindEndingView,readPanelFrame,writeEnding,trustedUIAction].some(p=>typeof p!=='function'))throw TypeError('60 browser owner requires scoped ports');
 const C=G.HONRO_CORE, preparedSet=new WeakSet(), attached=new WeakSet(), spent=new WeakSet();
 async function prepare({descriptor:d,packet:p,compiled:c,previous:cap}){
  if(d?.id!==60||d.previous!==59||d.runtimeReleaseEnabled!==false||d.ownerSHA!==sourceSHA||p?.id!==60||p.map?.id!==d.authoredId||p.map?.units?.length!==0||!cap||cap.stage!==59||cap.won!==true||cap.settlement!==false||!must.every(k=>cap.flags?.[k]===true))return null;
  if(!await pinGeometry(p,c,d))return null;
  const proof=verifyPrevious(cap);if(!proof||!proof.guard?.roleIds||proof.guard.actor!==cap.crew?.knight?.id||!proof.names||!proof.runId)return null;
  const q=p.quiet,floor=c.terrain.find(t=>t.id===q?.support),top=x=>C.topAt(floor,x);
  if(!floor||q?.start?.length!==4||q?.souls?.length!==2||!Number.isFinite(q.gate)||!Number.isFinite(top(q.gate))||typeof q.readyFlag!=='string'||
     q.souls.some(s=>typeof s.id!=='string'||!(s.to-s.from>300)||!Number.isFinite(top(s.from))||!Number.isFinite(top(s.to))))return null;
  const rows=roles.map(cls=>cap.crew?.[cls]);
  if(rows.some((u,i)=>!u||u.cls!==roles[i]||!u.id||u.dead||!(u.hp>0)||!Array.isArray(u.loadout))||new Set(rows.map(u=>u.id)).size!==4)return null;
  const units=[];
  for(const row of rows){
   const s=q.start.find(v=>v.cls===row.cls);
   if(!s||!c.terrain.some(t=>Number.isFinite(C.topAt(t,s.x))&&Math.abs(C.topAt(t,s.x)-s.y)<.002))return null;
   const u=C.makeUnit(row.cls,0,s.x,s.y,{...structuredClone(row),x:s.x,y:s.y,spawnX:s.x,spawnY:s.y,moveLeft:row.maxMove,airborne:false,acted:false});
   if(!C.validTerrainContactPose(c.terrain,u)||!Object.keys(row).every(k=>same(row[k],u[k])))return null;
   units.push(u);
  }
  const packed=freeze({units,proof,cap,packet:p,compiled:c,profileRunId:proof.runId});preparedSet.add(packed);return packed;
 }
 function attach({app,engine:e,prepared:req,receipt:cap,packet:p,compiled:c}){
  if(!preparedSet.has(req)||attached.has(e)||spent.has(req)||req.cap!==cap||req.packet!==p||req.compiled!==c||verifyPrevious(cap)!==req.proof||
     !permitMount(app,e,p,c,req.proof)||app.engine!==e||app.stageId!==60||app.profile?.equipment?.runId!==req.profileRunId)return null;
  const b=e.b, quiet=p.quiet, profile=app.profile, scene=app.scene;
  if(b.units.length!==4||!req.units.every(u=>b.units.includes(u)&&Object.keys(cap.crew[u.cls]).every(k=>same(cap.crew[u.cls][k],u[k])))||!req.units.every(u=>e.grounded(u)))return null;
  const floor=c.terrain.find(t=>t.id===quiet.support),top=x=>C.topAt(floor,x),ticket=freeze({});
  let inTick=false,closed=false,terminalIssued=false,routeReceipt=null,hostReady=false,captureBusy=false,lexicalFrame=null,unmountUI=null,viewportKey=null,viewportEpoch=0;
  const current=()=>!closed&&app.engine===e&&app.stageId===60&&e.b===b&&app.profile===profile&&(app.scene===scene||!scene)&&permitMount(app,e,p,c,req.proof);
  const routeUI=()=>current()&&hostReady&&b.phase==='won'&&permitEnding(app,e,req.proof);
  const previous=freeze({rawSHA:req.proof.rawSHA,endingKey:req.proof.endingKey,flags:{'act6.garmjinCompleted':true,finalThreatResolved:true},body:req.units.map(u=>structuredClone(u))});
  const grant=freeze({app,engine:e,packet:p,scope:'private-warm-qa',previous});
  const core=createStage60Owner({C,authorize:x=>x===grant&&current(),namesFor:z=>z===previous?req.proof.names:null,
    authorizeFrame:(scope,frame,owned)=>scope===grant&&frame===lexicalFrame&&owned===routeReceipt&&routeUI(),
    worldFor:()=>({battle:b,floor:quiet.support,readyFlag:quiet.readyFlag,dest:quiet.souls.map(v=>v.to),destY:quiet.souls.map(v=>top(v.to)),gate:[quiet.gate,top(quiet.gate)],gateRadius:[182,150],y:top,acceptTick:(k,g)=>g===e&&k===ticket&&inTick}),
    createSouls:()=>quiet.souls.map(v=>G.HonroUnits.create({id:v.id,kind:'ghost',team:'npc',x:v.from,y:top(v.from),label:v.label,stageOverrides:{fixed:false,loadout:[]}},b,profile,G.HONRO_CONTENT.stages[0])),
    endingWriter:()=>async request=>routeUI()&&request.frameProof===lexicalFrame&&request.terminalSha===req.proof.rawSHA?writeEnding(app,e,req.proof,request):{ok:false,reason:'60-active-frame-closed'}
  });
  const ops=core.mount(grant);if(!ops)return null;
  attached.add(e);spent.add(req);
  const panelTickets=new WeakMap();
  const ui=freeze({
   view(w,h){
    if(!routeUI()||!Number.isFinite(w)||w<=0||!Number.isFinite(h)||h<=0)return null;
    const key=w+':'+h;if(viewportKey!==key){viewportKey=key;viewportEpoch++;}
    return ops.endingView(w,h);
   },
   async confirmPanel(display,viewport){
    if(!routeUI()||captureBusy||!(Number.isFinite(viewport?.w)&&viewport.w>0&&Number.isFinite(viewport?.h)&&viewport.h>0))return null;
    const v=ui.view(viewport.w,viewport.h), epoch=viewportEpoch;
    if(!panelOrder.includes(v?.scene))return null;
    captureBusy=true;try{
     // The host witnesses the exact displayed native scene or decoded card, never supplied asset names only.
     const raw=await readPanelFrame(app,e,req.proof,v,display,viewport);
     if(!raw||!routeUI()||epoch!==viewportEpoch||ops.endingView(viewport.w,viewport.h)?.scene!==v.scene)return null;
     const k=freeze({});panelTickets.set(k,{scene:v.scene,raw,viewport:{...viewport},epoch});
     return k;
    }finally{captureBusy=false;}
   },
   async input(kind,{event,control,frame}={}){
    if(!routeUI()||!trustedUIAction(app,e,event,control,kind))return {ok:false,reason:'60-untrusted-control'};
    const t=panelTickets.get(frame);if(!t||t.epoch!==viewportEpoch||ops.endingView(t.viewport.w,t.viewport.h)?.scene!==t.scene)return {ok:false,reason:'60-unverified-panel'};
    if(kind==='record'){
     if(t.scene!=='bridge-record')return {ok:false,reason:'wrong-memorial-panel'};
     const ok=ops.nativeInteraction('name-the-bridge-guard',e.unit(cap.crew.knight.id));if(ok)panelTickets.delete(frame);return {ok};
    }
    if(kind!=='continue')return {ok:false,reason:'60-unknown-ending-input'};
    if(t.scene==='later-return'&&!lexicalFrame){lexicalFrame=t.raw;if(!ops.acceptFinalFrame(lexicalFrame)){lexicalFrame=null;return {ok:false,reason:'60-final-frame-closed'};}}
    const result=await ops.advanceScene(t.scene);
    if(result.ok)panelTickets.delete(frame);return result;
   }
  });
  function mountView(){
   if(!current()||b.phase!=='won'||!terminalIssued||hostReady)return false;
   try{hostReady=true;unmountUI=bindEndingView(app,e,req.proof,ui);if(typeof unmountUI!=='function')throw Error('60 verified view did not bind');return true;}
   catch(error){hostReady=false;report(error);return false;}
  }
  return freeze({
   tick(dt){if(!current()||inTick)return false;inTick=true;try{return ops.nativeGuide(dt,ticket);}finally{inTick=false;}},
   interact(action){return current()&&['guide','end-walk'].includes(action)&&ops.nativeInteraction(action,e.active);},
   project(){
    if(!current())return {complete:false,objectiveReady:false,blocked:true,targets:[]};
    routeReceipt??=ops.nativePosition();const at=quiet.souls[0].to;
    return {complete:!!routeReceipt,objectiveReady:!!routeReceipt,targets:routeReceipt?[]:[{kind:'route',id:'last-souls',x:at,y:top(at),label:'마지막 혼이 지날 길 열기'},{kind:'route',id:'mainGate',x:quiet.gate,y:top(quiet.gate),label:'네 사람 모두 산문에 모이기'}],
      summary:routeReceipt?'마지막 혼이 모두 길을 건넜습니다.':'두 혼을 안내하고, 산문에 함께 모이십시오.',actions:{guide:'guide',moveEnd:'end-walk'}};
   },
   terminal(){
    if(!current()||!routeReceipt||b.phase!=='won')return null;
    if(terminalIssued){mountView();return null;}
    const flags=ops.settlement(routeReceipt);if(!flags)return null;
    terminalIssued=true;
    // This callback must not call back into gameplay relay or transition to Stage61.
    mountView();
    return {stage:60,won:true,flags,settlement:false,actors:routeReceipt.body};
   },
   dispose(){closed=true;hostReady=false;ops.dispose();unmountUI?.();}
  });
 }
 return freeze({sourceSHA,prepare,attach});
}
