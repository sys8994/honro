import {prepareEnding} from './ending.mjs';
import {endingCardFor} from '../ending10-focus-r3/app-ending-admission.mjs';
const roles=['archer','knight','mage','occultist'];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fields=['id','cls','hp','maxHp','focus','maxFocus','shield','loadout','level','equipmentState','h','r','xpBudget','xpGranted','dead'];
const profile=u=>Object.fromEntries(fields.map(k=>[k,u[k]]));
const flags=['act6.lastSoulsGuided','act6.endingStarted'];
const frameIds=['last-souls','bridge-record','daybreak','later-return'];
export function createStage60Owner({C,authorize,authorizeFrame,worldFor,createSouls,endingWriter,namesFor}){
 const owned=new WeakSet();
 return Object.freeze({
  mount(lease){
   const {app,engine:e,packet,scope,previous}=lease??{}, b=e?.b;
   if(!b||owned.has(e)||app?.engine!==e||app?.stageId!==60||packet?.id!==60||!authorize?.(lease)||!previous?.flags?.['act6.garmjinCompleted']||!previous.flags.finalThreatResolved||
    !['aim','move'].includes(b.phase)||b.honroGrowth||b.units.some(u=>u.side===1&&!u.dead))return null;
   if(!Array.isArray(previous.body)||previous.body.length!==4||!roles.every(k=>previous.body.filter(u=>u.cls===k).length===1))return null;
   const role=Object.freeze(Object.fromEntries(previous.body.map(u=>[u.cls,u.id])));
   if(Object.values(role).some(v=>typeof v!=='string'||!v)||new Set(Object.values(role)).size!==4)return null;
   const expectedRoster=Object.values(role).sort(), world=worldFor(lease);
   if(!world||world.battle!==b||!Array.isArray(world.dest)||world.dest.length!==2||!world.floor||!world.readyFlag||typeof world.y!=='function')return null;
   const allowedNames=namesFor(previous);if(!allowedNames||!allowedNames.gwakjin||allowedNames.guardWitnesses.length!==2)return null;
   const heroes=()=>b.units.filter(u=>u.side===0&&!u.summoned);
   const roster=()=>same(heroes().map(u=>u.id).sort(),expectedRoster)&&heroes().every(u=>role[u.cls]===u.id&&!u.dead&&u.hp>0);
   if(!roster()||!heroes().every(u=>same(profile(u),profile(previous.body.find(g=>g.id===u.id)??{}))))return null;
   if(!b.honroState?.flags)return null;
   if(Boolean(b.honroState.flags[world.readyFlag]))return null;
   const souls=createSouls(lease,world), bridge=u=>e.grounded(u)&&e.contactSurface(u.x,u.y-3,u.y+4)?.t.id===world.floor;
   if(!Array.isArray(souls)||souls.length!==2||new Set(souls.map(s=>s.id)).size!==2||souls.some(u=>u.side!==2||u.dead||!bridge(u)||u.loadout.length||b.units.includes(u)||b.units.some(x=>x.id===u.id)))return null;
   owned.add(e);b.units.push(...souls);
   const attackAllows=e.attackAllows;
   const block=(u,...args)=>souls.includes(u)?false:attackAllows.call(e,u,...args);
   e.attackAllows=block;
   const start=souls.map(u=>u.x);
   let armed=false,memorial=false,complete=false,accepted=null,issued=false,lastGuide=null;
   const soulGate=(v,i)=>v.x>=world.dest[i]-9&&Math.abs(v.y-world.destY[i])<35&&bridge(v)&&v.hp>0&&!v.dead;
   const mainGate=u=>Math.abs(u.x-world.gate[0])<world.gateRadius[0]&&Math.abs(u.y-world.gate[1])<world.gateRadius[1]&&e.grounded(u);
   let closed=false;
   const scoped=()=>!closed&&app.engine===e&&app.stageId===60&&e.b===b&&authorize(lease);
   const validGuide=a=>a===e.active&&[role.occultist,role.mage].includes(a?.id)&&a.hp>0&&Math.hypot(a.x-souls[0].x,a.y-souls[0].y)<225&&bridge(a)&&bridge(souls[0]);
   function nativeInteraction(action,actor=e.active){
    if(!scoped())return false;
    if(action==='guide'&&b.phase==='aim'&&e.canAct()&&!complete&&validGuide(actor)){armed=true;return true;}
    if(action==='end-walk'&&b.phase==='aim'&&e.canAct()&&!complete&&actor===e.active&&e.grounded(actor)&&e.combatEnemies().length===0){e.finishAction(true);return true;}
    if(action==='name-the-bridge-guard'&&b.phase==='won'&&accepted&&actor===heroes().find(u=>u.id===role.knight)&&ending.recordBridgeNames({actor,action})){memorial=true;return true;}
    return false;
   }
   function nativeGuide(dt,clock){
    if(!scoped()||complete||b.phase!=='aim'||b.side!==0||!(dt>0&&dt<=1/30)||!world.acceptTick?.(clock,e)||!armed||!validGuide(e.active))return false;
    for(let i=1;i>=0;i--)if(souls[i].x<world.dest[i]-9)e.walk(souls[i],1,dt,true);
    lastGuide=e.active.id;
    return true;
   }
   function nativePosition(){
    if(!scoped()||!roster()||e.combatEnemies().length)return null;
    if(!complete){
     if(b.phase!=='aim'||!armed||!lastGuide||!souls.every((v,i)=>soulGate(v,i)&&v.x-start[i]>300)||!heroes().every(mainGate))return null;
     complete=true;b.honroState.flags[world.readyFlag]=true;
     accepted=Object.freeze({id:60,phase:'certified-ending-ready',body:heroes().map(profile),souls:souls.map((s,i)=>({id:s.id,x:s.x,y:s.y,walked:s.x-start[i]})),guide:lastGuide,lineage:previous.rawSHA});
    }
    return accepted;
   }
   const ending=prepareEnding({validated09:()=>({verified09:true,correctedGarmjin:true,truePlayableFour:true,realRouteClear:true,terminalSha:previous.rawSHA,
    slotEndingReceiptKey:previous.endingKey,gwakjin:allowedNames.gwakjin,guardWitnesses:allowedNames.guardWitnesses}),grounded:e.grounded.bind(e),
    verifyFinalFrame:(proof)=>authorizeFrame?.(lease,proof,accepted),afterFinalCommit:endingWriter(lease,allowedNames)});
   function settlement(receipt){
    if(!scoped()||receipt!==accepted||issued||b.phase!=='won'||!complete||!roster())return null;
    if(!ending.begin({battle:b,party:heroes(),souls,mainGate,soulGate:(s)=>soulGate(s,souls.indexOf(s))}))return null;
    issued=true;return Object.fromEntries(flags.map(k=>[k,true]));
   }
   return Object.freeze({nativeGuide,nativeInteraction,nativePosition,settlement,
    endingView(w,h){if(!issued||!scoped())return null;
     const state=ending.view(),i=frameIds.indexOf(state.scene);
     return {...state,frameIndex:i,focus:i===0?'actual-souls-frame':i===1?'actual-memorial-frame':i===2?'illustrated-dawn':'native-later-return',
      asset:i===2?endingCardFor(w,h):null,memorial};},
    dispose(){closed=true;if(e.attackAllows===block)e.attackAllows=attackAllows;},
    advanceScene:async cue=>issued&&scoped()?ending.advance(cue):{ok:false,reason:'unowned-scene'},
    acceptFinalFrame:proof=>issued&&scoped()&&ending.acceptFinalFrame(proof)
   });
  }
 });
}
